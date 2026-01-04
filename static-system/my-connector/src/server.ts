
import express, { Request, Response } from 'express';
import { verifySignature, validateTimestamp, validatePayloadIds } from './lib/security';
import { PostPipeIngestPayload } from './types';
import { getAdapter } from './lib/db';
import dotenv from 'dotenv';
import cors from 'cors';
import nodeCrypto from 'crypto';

dotenv.config();

console.log("[Server] Environment Variables Loaded.");
console.log("[Server] MONGODB Keys detected:", Object.keys(process.env).filter(k => k.startsWith('MONGODB')));
console.log(`[Server] CONNECTOR_ID: ${process.env.POSTPIPE_CONNECTOR_ID ? 'SET' : 'MISSING'}`);
console.log(`[Server] CONNECTOR_SECRET: ${process.env.POSTPIPE_CONNECTOR_SECRET ? 'SET' : 'MISSING'}`);
console.log(`[Server] MONGODB_URI: ${process.env.MONGODB_URI ? 'SET' : 'MISSING'}`);
if (process.env.MONGODB_URI) {
    console.log(`[Server] MONGODB_URI Target: ${process.env.MONGODB_URI.split('@').pop()}`); // Log the host part only
} else {
    console.warn(`[Server] WARNING: MONGODB_URI is not set. Defaulting to localhost?`);
}

const app = express();
const PORT = process.env.PORT || 3002;

// Enable CORS for all routes
app.use(cors());

// IMPORTANT: We need the raw body for signature verification
app.use(express.json({
    verify: (req: any, res, buf) => {
        req.rawBody = buf.toString();
    }
}));

const CONNECTOR_ID = process.env.POSTPIPE_CONNECTOR_ID;
const CONNECTOR_SECRET = process.env.POSTPIPE_CONNECTOR_SECRET;

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

app.use(rateLimit);
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
        console.log("[Server] Getting adapter...");
        const adapter = getAdapter(); // getAdapter() might be async in some impls but usually synchronous factory
        console.log("[Server] Connecting to DB...");
        await adapter.connect();
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

        const adapter = getAdapter();
        // Ensure connection
        await adapter.connect();

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

        console.log(`[Server] Querying submissions for form: ${formId}`);

        const adapter = getAdapter();
        // Ensure strictly connected/reconnected if needed
        await adapter.connect();

        const data = await adapter.query(formId, limit);
        return res.json({ status: 'ok', data });
    } catch (e) {
        console.error("Query Error:", e);
        return res.status(500).json({ status: 'error', message: String(e) });
    }
});

if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`🔒 PostPipe Connector listening on port ${PORT}`);
        console.log(`📝 Mode: ${process.env.DB_TYPE || 'InMemory'}`);
    });
}

export default app;
