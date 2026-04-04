
import express, { Request, Response } from 'express';
import cookieParser from 'cookie-parser';
import { verifySignature, validateTimestamp, validatePayloadIds, verifyJwt } from './lib/security';
import { PostPipeIngestPayload } from './types';
import { getAdapter } from './lib/db';
import dotenv from 'dotenv';
import cors from 'cors';
import nodeCrypto from 'crypto';
import authRouter from './routes/auth';
import cdnRouter from './routes/cdn';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { getPrefixedEnv } from './lib/config';

dotenv.config();

// Explicitly configure Cloudinary after dotenv has loaded the env vars.
// The SDK does NOT auto-read CLOUDINARY_URL at import time.
if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
        secure: true,
    });
    console.log(`[Server] Cloudinary configured for cloud: ${process.env.CLOUDINARY_CLOUD_NAME}`);
} else if (process.env.CLOUDINARY_URL) {
    // Fallback: parse the CLOUDINARY_URL manually
    cloudinary.config({ cloudinary_url: process.env.CLOUDINARY_URL });
    console.log(`[Server] Cloudinary configured via CLOUDINARY_URL`);
} else {
    console.warn('[Server] Cloudinary not configured. Image upload fields will not work. Add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET to connector .env');
}


// Check for MongoDB keys
const mongoKeys = Object.keys(process.env).filter(k => k.startsWith('MONGODB_URI'));
console.log(`[Server] Detected MongoDB URIs: ${mongoKeys.length > 0 ? mongoKeys.join(', ') : 'NONE'}`);

// Check for Postgres keys
const pgKeys = Object.keys(process.env).filter(k => k.startsWith('POSTGRES_URL') || k.startsWith('DATABASE_URL'));
console.log(`[Server] Detected Postgres URLs: ${pgKeys.length > 0 ? pgKeys.join(', ') : 'NONE'}`);

console.log(`[Server] CONNECTOR_ID: ${process.env.POSTPIPE_CONNECTOR_ID ? 'SET' : 'MISSING'}`);
console.log(`[Server] CONNECTOR_SECRET: ${process.env.JWT_SECRET || process.env.POSTPIPE_CONNECTOR_SECRET ? 'SET' : 'MISSING'}`);

if (!process.env.DB_TYPE) {
    if (pgKeys.length > 0) {
        process.env.DB_TYPE = 'postgres';
        console.log(`[Server] Smart Detect: DB_TYPE auto-set to 'postgres' based on ENV variables.`);
    } else if (mongoKeys.length > 0) {
        process.env.DB_TYPE = 'mongodb';
        console.log(`[Server] Smart Detect: DB_TYPE auto-set to 'mongodb' based on ENV variables.`);
    }
}

if (mongoKeys.length === 0 && pgKeys.length === 0 && (process.env.DB_TYPE === 'mongodb' || process.env.DB_TYPE === 'postgres')) {
    console.warn(`[Server] WARNING: DB_TYPE is set to '${process.env.DB_TYPE}' but no corresponding connection strings were found.`);
}


const app = express();
const PORT = process.env.PORT || 3002;

// --- Prefix Resolution Helper ---
const VAR_PREFIX = process.env.POSTPIPE_VAR_PREFIX || "";

const CONNECTOR_ID = getPrefixedEnv('POSTPIPE_CONNECTOR_ID');
const CONNECTOR_SECRET = getPrefixedEnv('JWT_SECRET') || getPrefixedEnv('POSTPIPE_CONNECTOR_SECRET');

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

app.use(cors({ origin: '*' }));
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

// --- Public Auth Route (CORS open) ---
app.use('/api/auth', authRouter);
app.use('/api/public/cdn', cdnRouter);



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

// --- Cloudinary Image Upload ---
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB max

// @ts-ignore
app.post('/postpipe/upload', upload.single('file'), async (req: Request, res: Response) => {
    const cloudinaryUrl = process.env.CLOUDINARY_URL;

    if (!cloudinaryUrl) {
        console.error('[Upload] CLOUDINARY_URL is not set in connector .env');
        return res.status(503).json({
            error: 'Image upload is not configured. Add CLOUDINARY_URL to the connector .env file.',
            hint: 'Example: CLOUDINARY_URL=cloudinary://API_KEY:API_SECRET@CLOUD_NAME'
        });
    }

    if (!req.file) {
        return res.status(400).json({ error: 'No file provided. Send a multipart/form-data request with a "file" field.' });
    }

    try {
        // cloudinary auto-reads CLOUDINARY_URL from env
        const result = await new Promise<any>((resolve, reject) => {
            cloudinary.uploader.upload_stream(
                { folder: 'postpipe_uploads', resource_type: 'auto' },
                (error, result) => {
                    if (error) reject(error);
                    else resolve(result);
                }
            ).end(req.file!.buffer);
        });

        console.log(`[Upload] Success: ${result.secure_url}`);
        return res.status(200).json({ success: true, url: result.secure_url, public_id: result.public_id });
    } catch (err: any) {
        console.error('[Upload] Cloudinary error:', err.message);
        return res.status(500).json({ error: 'Upload to Cloudinary failed', details: err.message });
    }
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

        // Track fully covered targets so we don't send redundant breakpoint data
        const fullyCoveredTargets = new Set<string>();
        fullyCoveredTargets.add(primaryTarget);

        // B. Broadcast Targets
        if (routing && routing.broadcast && Array.isArray(routing.broadcast)) {
            for (const target of routing.broadcast) {
                if (!fullyCoveredTargets.has(target)) {
                    console.log(`[Server] Broadcasting to: ${target}`);
                    const broadcastPayload = { ...payload, targetDb: target };
                    // Clean up primary target metadata to allow fresh resolution for bridged target
                    delete (broadcastPayload as any).targetDatabase;
                    delete (broadcastPayload as any).databaseConfig;
                    promises.push(insertToTarget(target, broadcastPayload));
                    fullyCoveredTargets.add(target);
                }
            }
        }

        // C. BreakPoint / Splits
        if (routing && routing.splits && Array.isArray(routing.splits)) {
            // Group breakpoint logic by target to prevent inserting multiple fragments into the same DB
            const groupedSplits = new Map<string, Record<string, unknown>>();

            for (const split of routing.splits) {
                // If this target is already receiving a FULL broadcast (or is primary), skip breakpoint logic entirely.
                if (fullyCoveredTargets.has(split.target)) {
                    console.log(`[Server] Skipping BreakPoint for ${split.target}: Target is already receiving full broadcast payload.`);
                    continue;
                }

                console.log(`[Server] Processing BreakPoint Split for: ${split.target}`);

                if (!groupedSplits.has(split.target)) {
                    groupedSplits.set(split.target, {});
                }

                const currentGroupedData = groupedSplits.get(split.target)!;

                if (split.fields && Array.isArray(split.fields)) {
                    split.fields.forEach((field: string) => {
                        if (payload.data && Object.prototype.hasOwnProperty.call(payload.data, field)) {
                            // Merge multiple breakpoint rules targeting the same DB
                            currentGroupedData[field] = payload.data[field];
                        }
                    });
                }
            }

            // Execute inserts for grouped breakpoints
            for (const [targetDb, mergedData] of groupedSplits.entries()) {
                if (Object.keys(mergedData).length > 0) {
                    const partialPayload = {
                        ...payload,
                        data: mergedData,
                        targetDb: targetDb
                    };
                    
                    // Clean up primary target metadata
                    delete (partialPayload as any).targetDatabase;
                    delete (partialPayload as any).databaseConfig;

                    promises.push(insertToTarget(targetDb, partialPayload));
                }
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
        const { formId, limit, page, targetDatabase, databaseConfig, includeDeleted, filter } = req.query;

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

        // Parse filter if passed as JSON string
        let filterParsed = null;
        if (typeof filter === 'string') {
            try {
                filterParsed = JSON.parse(filter);
            } catch (e) {
                console.warn("Invalid filter JSON");
            }
        }

        // Validate targetDatabase (alphanumeric, underscores, hyphens only for safety)
        const dbNameStr = String(targetDatabase || "");
        if (dbNameStr && !/^[a-zA-Z0-9_-]*$/.test(dbNameStr)) {
            return res.status(400).json({ error: "Invalid targetDatabase name" });
        }

        // SMART ADAPTER SELECTION
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
            page: Number(page) || 1,
            targetDatabase: dbNameStr,
            databaseConfig: dbConfigParsed,
            includeDeleted: includeDeleted === 'true',
            filter: filterParsed || undefined
        });
        return res.json({ success: true, count: data.length, data });

    } catch (e) {
        console.error("Fetch Error:", e);
        return res.status(500).json({ error: "Internal Server Error", details: e instanceof Error ? e.message : String(e) });
    }
});

// --- Submission PATCH (Partial Update) ---
// @ts-ignore
app.patch('/postpipe/data/:submissionId', authenticateConnector, async (req: Request, res: Response) => {
    try {
        const { submissionId } = req.params;
        const { formId, patch, targetDatabase, databaseConfig } = req.body;

        console.log(`[PATCH] submissionId=${submissionId}, formId=${formId}, targetDatabase=${targetDatabase}`);
        console.log(`[PATCH] databaseConfig=`, databaseConfig);
        console.log(`[PATCH] databaseConfig.type=`, databaseConfig?.type);

        if (!formId || !patch || typeof patch !== 'object') {
            return res.status(400).json({ error: "formId (string) and patch (object) are required" });
        }

        const dbType = databaseConfig?.type || process.env.DB_TYPE;
        console.log(`[PATCH] Using dbType: ${dbType}`);
        const adapter = getAdapter(dbType);
        await adapter.connect({ databaseConfig, targetDatabase });

        const success = await adapter.updateSubmission(formId, submissionId, patch, {
            targetDatabase,
            databaseConfig
        });

        if (success) {
            return res.json({ success: true, message: "Submission updated" });
        } else {
            return res.status(404).json({ error: "Submission not found or already deleted" });
        }
    } catch (e) {
        console.error("Update Error:", e);
        return res.status(500).json({ error: "Internal Server Error", details: e instanceof Error ? e.message : String(e) });
    }
});

// --- Submission DELETE (Soft/Hard) ---
// @ts-ignore
app.delete('/postpipe/data/:submissionId', authenticateConnector, async (req: Request, res: Response) => {
    try {
        const { submissionId } = req.params;
        const { formId, targetDatabase, databaseConfig, hard } = req.body;

        if (!formId) {
            return res.status(400).json({ error: "formId is required" });
        }

        const adapter = getAdapter(databaseConfig?.type);
        await adapter.connect({ databaseConfig, targetDatabase });

        const success = await adapter.deleteSubmission(formId, submissionId, hard === true || hard === 'true', {
            targetDatabase,
            databaseConfig
        });

        if (success) {
            return res.json({ success: true, message: hard ? "Submission permanently deleted" : "Submission soft-deleted" });
        } else {
            return res.status(404).json({ error: "Submission not found" });
        }
    } catch (e) {
        console.error("Delete Error:", e);
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

// --- Reference Resolution (Population) Endpoint ---
// POST /postpipe/resolve
// Body: { collection: string, ids: string[], targetDatabase?: string }
// Returns populated records for each provided ID.
// This enables "eager" reference resolution on the read path.
// @ts-ignore
app.post('/postpipe/resolve', authenticateConnector, async (req: Request, res: Response) => {
    try {
        const { collection, ids, targetDatabase, databaseConfig: dbConfigBody } = req.body;

        if (!collection || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ error: "collection (string) and ids (array) are required" });
        }

        if (ids.length > 100) {
            return res.status(400).json({ error: "Maximum 100 IDs per resolution request" });
        }

        const dbNameStr = String(targetDatabase || "");

        let resolvedType: string | undefined;
        if (dbNameStr) {
            const targetLower = dbNameStr.toLowerCase();
            if (targetLower.includes('postgres') || targetLower.includes('pg') || targetLower.includes('neon')) {
                resolvedType = 'postgres';
            } else if (targetLower.includes('mongo') || targetLower.includes('mongodb') || targetLower.includes('atlas')) {
                resolvedType = 'mongodb';
            }
        }

        const adapter = getAdapter(resolvedType as string);
        await adapter.connect({ databaseConfig: dbConfigBody, targetDatabase: dbNameStr });

        // Query all requested IDs — paginated-safe (client controls batch size)
        const results: Record<string, any> = {};
        await Promise.all(
            ids.map(async (id: string) => {
                try {
                    const records = await adapter.query(collection, {
                        limit: 1,
                        targetDatabase: dbNameStr,
                        databaseConfig: dbConfigBody,
                        filter: { _id: id }
                    });
                    if (records && records.length > 0) {
                        results[id] = records[0];
                    }
                } catch {
                    // Keep null for failed resolutions — backward compat
                    results[id] = null;
                }
            })
        );

        return res.json({ success: true, resolved: results, count: Object.keys(results).length });

    } catch (e) {
        console.error("[Resolve] Error:", e);
        return res.status(500).json({ error: "Internal Server Error", details: e instanceof Error ? e.message : String(e) });
    }
});

// --- Diagnostic Catch-All ---
app.use((req, res) => {
    console.warn(`[404] Route Not Found: ${req.method} ${req.originalUrl} from IP: ${req.ip}`);
    res.status(404).json({
        error: "Not Found",
        message: `Route ${req.originalUrl} does not exist on this connector.`,
        availableRoutes: ["POST /postpipe/ingest", "GET /postpipe/data", "GET /api/postpipe/forms/:formId/submissions", "POST /postpipe/resolve"]
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
