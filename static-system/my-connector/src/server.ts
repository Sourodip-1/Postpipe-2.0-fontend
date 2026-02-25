
import express, { Request, Response } from 'express';
import cookieParser from 'cookie-parser';
import { verifySignature, validateTimestamp, validatePayloadIds, verifyJwt } from './lib/security';
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
app.use(cookieParser());

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
        version: 'v2.1.0',
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
    const authCookie = (req as any).cookies?.pp_auth_token;

    // Support both Header and Cookie auth
    let token = authCookie;
    if (!token && authHeader) {
        const match = authHeader.match(/^Bearer\s+(.+)$/i);
        if (match) token = match[1];
    }

    if (!token) {
        console.warn(`[Auth] Missing Authorization from IP: ${req.ip}`);
        return res.status(401).json({ error: "Unauthorized: Token missing" });
    }

    // 1. Try JWT validation (Quick Auth)
    const jwtPayload = verifyJwt(token, CONNECTOR_SECRET as string);
    if (jwtPayload) {
        (req as any).user = jwtPayload;
        return next();
    }

    // 2. Fallback to Legacy Secret Comparison
    try {
        const tokenBuf = Buffer.from(token);
        const secretBuf = Buffer.from(CONNECTOR_SECRET as string);

        if (tokenBuf.length === secretBuf.length && nodeCrypto.timingSafeEqual(tokenBuf, secretBuf)) {
            return next();
        }
    } catch (e) {
        // Ignore binary buffer errors and proceed to fail
    }

    console.warn(`[Auth] Invalid Token provided from IP: ${req.ip}`);
    return res.status(403).json({ error: "Forbidden: Invalid Token" });
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
        // SMART ADAPTER SELECTION & ROUTING
        const routing = (payload as any).routing;

        // --- Transformation Helper ---
        const applyTransformations = (data: any, config: any) => {
            if (!config || !data) return data;
            const transformed = { ...data };

            // Masking
            if (config.mask && Array.isArray(config.mask)) {
                config.mask.forEach((field: string) => {
                    if (transformed[field]) {
                        const val = String(transformed[field]);
                        // Show last 4 chars, mask rest
                        const visible = val.slice(-4);
                        const masked = "*".repeat(Math.max(0, val.length - 4)) + visible;
                        transformed[field] = masked;
                    }
                });
            }

            // Hashing
            if (config.hash && Array.isArray(config.hash)) {
                config.hash.forEach((field: string) => {
                    if (transformed[field]) {
                        // Simple SHA-256 hash
                        const hash = nodeCrypto.createHash('sha256').update(String(transformed[field])).digest('hex');
                        transformed[field] = hash;
                    }
                });
            }

            return transformed;
        };

        // Apply transformations globally to the base payload data first
        if (routing && routing.transformations) {
            payload.data = applyTransformations(payload.data, routing.transformations);
            console.log("[Server] Applied Data Transformations (Masking/Hashing)");
        }

        // Helper to insert into a specific target
        const insertToTarget = async (targetName: string, dataPayload: PostPipeIngestPayload) => {
            const payloadType = (dataPayload as any).databaseConfig?.type;
            let resolvedType = payloadType;

            if (!resolvedType && targetName) {
                const targetLower = String(targetName).toLowerCase();
                if (targetLower.includes('postgres') || targetLower.includes('pg') || targetLower.includes('neon')) {
                    resolvedType = 'postgres';
                    console.log(`[Server] Smart Routing: Target '${targetName}' suggests Postgres.`);
                } else if (targetLower.includes('mongo') || targetLower.includes('mongodb') || targetLower.includes('atlas')) {
                    resolvedType = 'mongodb';
                    console.log(`[Server] Smart Routing: Target '${targetName}' suggests MongoDB.`);
                }
            }

            const adapter = getAdapter(resolvedType);

            if (resolvedType) {
                console.log(`[Server] Using adapter: ${resolvedType} for target: ${targetName}`);
            } else {
                console.log(`[Server] Using default adapter: ${process.env.DB_TYPE || 'InMemory'} for target: ${targetName}`);
            }

            console.log(`[Server] Connecting to database for target: ${targetName}...`);
            // Ensure connection (might need specific config per target if available in payload)
            // For now, we assume the adapter handles connection based on global env or passed config
            // If targetName is specific, we might need to look up its config if not in payload
            await adapter.connect({ ...dataPayload, targetDatabase: targetName });

            console.log(`[Server] Inserting payload into ${targetName}...`);
            await adapter.insert({ ...dataPayload, targetDb: targetName });
        };

        const promises = [];

        // A. Primary/Default Target
        const primaryTarget = (payload as any).targetDatabase || payload.targetDb || "default";

        // Calculate Exclusion for Primary Target
        let primaryPayloadData = { ...payload.data };
        let hasExclusions = false;

        if (routing && routing.splits && Array.isArray(routing.splits)) {
            routing.splits.forEach((split: any) => {
                if (split.excludeFromMain && split.fields) {
                    split.fields.forEach((field: string) => {
                        delete primaryPayloadData[field];
                        hasExclusions = true;
                    });
                }
            });
        }

        const primaryPayload = hasExclusions
            ? { ...payload, data: primaryPayloadData }
            : payload;

        if (hasExclusions) {
            console.log(`[Server] Excluded fields from primary '${primaryTarget}' payload.`);
        }

        promises.push(insertToTarget(primaryTarget, primaryPayload));

        // B. Broadcast Targets
        if (routing && routing.broadcast && Array.isArray(routing.broadcast)) {
            for (const target of routing.broadcast) {
                if (target !== primaryTarget) {
                    console.log(`[Server] Broadcasting to: ${target}`);
                    const broadcastPayload = { ...payload, targetDb: target };
                    // Clean up primary target metadata to allow fresh resolution for bridged target
                    delete (broadcastPayload as any).targetDatabase;
                    delete (broadcastPayload as any).databaseConfig;
                    promises.push(insertToTarget(target, broadcastPayload));
                }
            }
        }

        // C. BreakPoint / Splits
        if (routing && routing.splits && Array.isArray(routing.splits)) {
            for (const split of routing.splits) {
                console.log(`[Server] Processing Split for: ${split.target}`);

                // Filter Data
                const filteredData: Record<string, unknown> = {};
                if (split.fields && Array.isArray(split.fields)) {
                    split.fields.forEach((field: string) => {
                        if (payload.data && Object.prototype.hasOwnProperty.call(payload.data, field)) {
                            filteredData[field] = payload.data[field];
                        }
                    });
                }

                const partialPayload = {
                    ...payload,
                    data: filteredData,
                    targetDb: split.target
                };
                // Clean up primary target metadata to allow fresh resolution for bridged target
                delete (partialPayload as any).targetDatabase;
                delete (partialPayload as any).databaseConfig;

                promises.push(insertToTarget(split.target, partialPayload));
            }
        }

        await Promise.all(promises);

        // Return Success
        console.log("[Server] Success! All targets processed.");
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
            } else if (targetLower.includes('mongo') || targetLower.includes('mongodb') || targetLower.includes('atlas')) {
                resolvedType = 'mongodb';
                console.log(`[Server] Smart Routing: Data target '${dbNameStr}' suggests MongoDB.`);
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
