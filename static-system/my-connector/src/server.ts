
import express, { Request, Response } from 'express';
import { verifySignature, validateTimestamp, validatePayloadIds } from './lib/security';
import { PostPipeIngestPayload } from './types';
import { getAdapter } from './lib/db';
import dotenv from 'dotenv';
import cors from 'cors';
import nodeCrypto from 'crypto';

dotenv.config();

console.log("[Server] Environment Variables Loaded.");

// Check for MongoDB keys
const mongoKeys = Object.keys(process.env).filter(k => k.startsWith('MONGODB_URI'));
console.log(`[Server] Detected MongoDB URIs: ${mongoKeys.length > 0 ? mongoKeys.join(', ') : 'NONE'}`);

// Check for Postgres keys
const pgKeys = Object.keys(process.env).filter(k => k.startsWith('POSTGRES_URL') || k.startsWith('DATABASE_URL'));
console.log(`[Server] Detected Postgres URLs: ${pgKeys.length > 0 ? pgKeys.join(', ') : 'NONE'}`);

console.log(`[Server] CONNECTOR_ID: ${process.env.POSTPIPE_CONNECTOR_ID ? 'SET' : 'MISSING'}`);
console.log(`[Server] CONNECTOR_SECRET: ${process.env.POSTPIPE_CONNECTOR_SECRET ? 'SET' : 'MISSING'}`);

if (mongoKeys.length === 0 && pgKeys.length === 0 && (process.env.DB_TYPE === 'mongodb' || process.env.DB_TYPE === 'postgres')) {
    console.warn(`[Server] WARNING: DB_TYPE is set to '${process.env.DB_TYPE}' but no corresponding connection strings were found.`);
}


const app = express();
const PORT = process.env.PORT || 3002;

// --- Prefix Resolution Helper ---
const VAR_PREFIX = process.env.POSTPIPE_VAR_PREFIX || "";

function getPrefixedEnv(key: string): string | undefined {
    if (VAR_PREFIX) {
        const prefixed = `${VAR_PREFIX}_${key}`;
        if (process.env[prefixed]) {
            console.log(`[Config] Resolved '${key}' from prefixed variable: ${prefixed}`);
            return process.env[prefixed];
        }
    }
    return process.env[key];
}

const CONNECTOR_ID = getPrefixedEnv('POSTPIPE_CONNECTOR_ID');
const CONNECTOR_SECRET = getPrefixedEnv('POSTPIPE_CONNECTOR_SECRET');

if (!CONNECTOR_ID || !CONNECTOR_SECRET) {
    console.error("❌ CRITICAL ERROR: POSTPIPE_CONNECTOR_ID or POSTPIPE_CONNECTOR_SECRET is missing.");
    process.exit(1);
}

// --- Rate Limiting (Simple In-Memory) ---
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 100;
const requestCounts = new Map<string, { count: number, startTime: number }>();

function rateLimit(req: Request, res: Response, next: express.NextFunction) {
    const ip = req.ip || 'unknown';
    const now = Date.now();

    const clientData = requestCounts.get(ip) || { count: 0, startTime: now };

    if (now - clientData.startTime > RATE_LIMIT_WINDOW_MS) {
        clientData.count = 0;
        clientData.startTime = now;
    }

    clientData.count++;
    requestCounts.set(ip, clientData);

    if (clientData.count > MAX_REQUESTS_PER_WINDOW) {
        console.warn(`[Security] Rate limit exceeded for IP: ${ip}`);
        return res.status(429).json({ error: "Too Many Requests" });
    }

    next();
}

app.use(cors());

// --- Body Parsing Middleware ---
// IMPORTANT: We use a custom verify function to capture the raw body buffer
// for HMAC signature verification.
app.use(express.json({
    limit: '5mb',
    verify: (req: any, res, buf) => {
        req.rawBody = buf;
    }
}));

app.use(express.urlencoded({ extended: true, limit: '5mb' }));

app.use(rateLimit);

// --- Health Check / Diagnostic ---
app.get('/', (req, res) => {
    res.json({
        status: 'ok',
        service: 'PostPipe Connector',
        version: '1.0.0',
        config: {
            dbTypeDetected: process.env.DB_TYPE || 'InMemory',
            hasConnectorId: !!process.env.POSTPIPE_CONNECTOR_ID,
            mongoDetected: Object.keys(process.env).some(k => k.startsWith('MONGODB_URI')),
            pgDetected: Object.keys(process.env).some(k => k.startsWith('POSTGRES_URL') || k.startsWith('DATABASE_URL'))
        }
    });
});
// ----------------------------------------

// --- Core Authentication Middleware ---
function authenticateConnector(req: Request, res: Response, next: express.NextFunction) {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        console.warn(`[Auth] Missing Authorization Header from IP: ${req.ip}`);
        return res.status(401).json({ error: "Unauthorized: Missing Header" });
    }

    // Regex to robustly match "Bearer <token>"
    const match = authHeader.match(/^Bearer\s+(.+)$/i);
    if (!match) {
        console.warn(`[Auth] Invalid Authorization Format from IP: ${req.ip}`);
        return res.status(401).json({ error: "Unauthorized: Invalid Format" });
    }

    const token = match[1];

    // Secure comparison
    try {
        const tokenBuf = Buffer.from(token);
        const secretBuf = Buffer.from(CONNECTOR_SECRET as string);

        if (tokenBuf.length !== secretBuf.length || !nodeCrypto.timingSafeEqual(tokenBuf, secretBuf)) {
            console.warn(`[Auth] Invalid Token provided from IP: ${req.ip}`);
            return res.status(403).json({ error: "Forbidden: Invalid Token" });
        }
    } catch (e) {
        console.error("[Auth] Error during comparison", e);
        return res.status(403).json({ error: "Forbidden" });
    }

    next();
}
// ----------------------------------------

// @ts-ignore
app.post('/postpipe/ingest', async (req: Request, res: Response) => {
    try {
        const payload = req.body as PostPipeIngestPayload;
        // @ts-ignore
        const rawBody = req.rawBody;

        if (!rawBody) {
            console.error("❌ Error: Raw Body missing. Ensure middleware is configured.");
            return res.status(400).json({ status: 'error', message: 'Payload missing' });
        }

        const signature = req.headers['x-postpipe-signature'] as string;

        // 1. Verify Structure
        if (!validatePayloadIds(payload)) {
            return res.status(400).json({ status: 'error', message: 'Invalid Payload Structure' });
        }

        // 2. Verify Timestamp
        if (!validateTimestamp(payload.timestamp)) {
            console.warn(`[Security] Timestamp skew detected: ${payload.timestamp}`);
            return res.status(401).json({ status: 'error', message: 'Request Expired' });
        }

        // 3. Verify Signature
        // We check `x-postpipe-signature` header.
        const isValid = verifySignature(rawBody, signature, CONNECTOR_SECRET as string);
        if (!isValid) {
            console.warn(`[Security] Invalid Signature from IP: ${req.ip}`);
            return res.status(401).json({ status: 'error', message: 'Invalid Signature' });
        }

        // 4. Persistence
        // SMART ADAPTER SELECTION
        const payloadType = (payload as any).databaseConfig?.type;
        const targetName = (payload as any).targetDatabase || payload.targetDb;
        
        let resolvedType = payloadType;
        if (!resolvedType && targetName) {
            const targetLower = String(targetName).toLowerCase();
            if (targetLower.includes('postgres') || targetLower.includes('pg') || targetLower.includes('neon')) {
                resolvedType = 'postgres';
                console.log(`[Server] Smart Routing: Ingest target '${targetName}' suggests Postgres.`);
            }
        }

        const adapter = getAdapter(resolvedType);
        
        if (resolvedType) {
            console.log(`[Server] Using adapter: ${resolvedType}`);
        } else {
            console.log(`[Server] Using default adapter: ${process.env.DB_TYPE || 'InMemory'}`);
        }

        console.log("[Server] Connecting to database...");
        await adapter.connect(payload);
        console.log("[Server] Inserting payload...");
        await adapter.insert(payload);

        // Return Success
        console.log("[Server] Success!");
        return res.status(200).json({ status: 'ok', stored: true });

    } catch (error) {
        console.error("Connector Error Stack:", error);
        return res.status(500).json({ status: 'error', message: 'Internal Server Error', details: String(error) });
    }
});

// @ts-ignore
app.get('/postpipe/data', authenticateConnector, async (req: Request, res: Response) => {
    try {
        const { formId, limit, targetDatabase, databaseConfig } = req.query;

        if (!formId) {
            return res.status(400).json({ error: "formId required" });
        }

        // Parse databaseConfig if passed as JSON string
        let dbConfigParsed = null;
        if (typeof databaseConfig === 'string') {
            try {
                dbConfigParsed = JSON.parse(databaseConfig);
            } catch (e) {
                console.warn("Invalid databaseConfig JSON");
            }
        }

        // Validate targetDatabase (alphanumeric, underscores, hyphens only for safety)
        const dbNameStr = String(targetDatabase || "");
        if (dbNameStr && !/^[a-zA-Z0-9_-]*$/.test(dbNameStr)) {
            return res.status(400).json({ error: "Invalid targetDatabase name" });
        }

        // SMART ADAPTER SELECTION
        // Extract from query or config
        const queryType = req.query.dbType as string;
        const configType = dbConfigParsed?.type;
        
        let resolvedType = queryType || configType;
        if (!resolvedType && dbNameStr) {
            const targetLower = dbNameStr.toLowerCase();
            if (targetLower.includes('postgres') || targetLower.includes('pg') || targetLower.includes('neon')) {
                resolvedType = 'postgres';
                console.log(`[Server] Smart Routing: Data target '${dbNameStr}' suggests Postgres.`);
            }
        }

        const adapter = getAdapter(resolvedType as string);
        // Ensure connection
        await adapter.connect({ databaseConfig: dbConfigParsed, targetDatabase: dbNameStr });

        const data = await adapter.query(String(formId), {
            limit: Number(limit) || 50,
            targetDatabase: dbNameStr,
            databaseConfig: dbConfigParsed
        });
        return res.json({ success: true, count: data.length, data });

    } catch (e) {
        console.error("Fetch Error:", e);
        return res.status(500).json({ error: "Internal Server Error", details: e instanceof Error ? e.message : String(e) });
    }
});

// @ts-ignore
app.get('/api/postpipe/forms/:formId/submissions', async (req: Request, res: Response) => {
    try {
        const { formId } = req.params;
        const limit = parseInt(req.query.limit as string) || 50;
        const { dbType, databaseConfig } = req.query;

        console.log(`[Server] Querying submissions for form: ${formId}`);

        // Parse databaseConfig if passed as JSON string
        let dbConfigParsed = null;
        if (typeof databaseConfig === 'string') {
            try {
                dbConfigParsed = JSON.parse(databaseConfig);
            } catch (e) {
                console.warn("Invalid databaseConfig JSON");
            }
        }

        // Pass the database type from the parsed databaseConfig or dbType query parameter
        const adapter = getAdapter((dbConfigParsed?.type || dbType) as string);
        // Ensure strictly connected/reconnected if needed
        await adapter.connect({ databaseConfig: dbConfigParsed });

        const data = await adapter.query(formId, { limit, databaseConfig: dbConfigParsed });
        return res.json({ status: 'ok', data });
    } catch (e) {
        console.error("Query Error:", e);
        return res.status(500).json({ status: 'error', message: String(e) });
    }
});

// --- Diagnostic Catch-All ---
app.use((req, res) => {
    console.warn(`[404] Route Not Found: ${req.method} ${req.originalUrl} from IP: ${req.ip}`);
    res.status(404).json({ 
        error: "Not Found", 
        message: `Route ${req.originalUrl} does not exist on this connector.`,
        availableRoutes: ["POST /postpipe/ingest", "GET /postpipe/data", "GET /api/postpipe/forms/:formId/submissions"]
    });
});

if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`🔒 PostPipe Connector listening on port ${PORT}`);
        console.log(`📝 Default Mode: ${process.env.DB_TYPE || 'InMemory'}`);
        console.log(`🌐 Health Check: http://localhost:${PORT}/`);
    });
}

export default app;
