"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.MongoAdapter = void 0;
const mongodb_1 = require("mongodb");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
// --- Connection Pooling ---
// Map of URI -> MongoClient Promise (to handle race conditions during connect)
const connectionPool = new Map();
class MongoAdapter {
    constructor() {
        this.config = null;
        this.defaultUri = process.env.MONGODB_URI || '';
        this.defaultDbName = process.env.MONGODB_DB_NAME || 'postpipe';
        this.collectionName = process.env.MONGODB_COLLECTION || 'submissions';
        this.loadConfig();
    }
    loadConfig() {
        try {
            // Try to load db-routes.json from various locations
            // Note: In shared package, process.cwd() might be the app root (e.g. apps/web or my-connector)
            const possiblePaths = [
                path.join(process.cwd(), 'src', 'config', 'db-routes.json'),
                path.join(process.cwd(), 'config', 'db-routes.json'),
                // Fallback for when running deeply nested or in different structures
                path.join(process.cwd(), '..', 'config', 'db-routes.json')
            ];
            for (const p of possiblePaths) {
                if (fs.existsSync(p)) {
                    console.log(`[MongoAdapter] Loading routing config from: ${p}`);
                    const raw = fs.readFileSync(p, 'utf-8');
                    this.config = JSON.parse(raw);
                    break;
                }
            }
            if (!this.config) {
                console.warn("[MongoAdapter] No db-routes.json found. Using single-DB mode.");
            }
        }
        catch (error) {
            console.error("[MongoAdapter] Failed to load config:", error);
        }
    }
    resolveValue(val) {
        if (val.startsWith('env:')) {
            const envVar = val.split('env:')[1];
            return process.env[envVar] || '';
        }
        return val;
    }
    getTargetConfig(payload) {
        var _a, _b, _c, _d;
        // 1. If no config, return defaults
        if (!this.config) {
            return { uri: this.defaultUri, dbName: this.defaultDbName };
        }
        // 2. Determine Target from Payload
        let target = ((_a = this.config) === null || _a === void 0 ? void 0 : _a.defaultTarget) || 'default';
        // Dynamic: If payload has targetDb, try to find matching Env Var
        if (payload === null || payload === void 0 ? void 0 : payload.targetDb) {
            const dynamicKey = `MONGODB_URI_${payload.targetDb.toUpperCase()}`; // e.g. MONGODB_URI_SECONDARY
            const dynamicUri = process.env[dynamicKey];
            console.log(`[MongoAdapter] Debug: targetDb="${payload.targetDb}", looking for env var "${dynamicKey}"`);
            if (dynamicUri) {
                console.log(`[MongoAdapter] Dynamic Logic: Found ${dynamicKey}, routing to '${payload.targetDb}'`);
                return { uri: dynamicUri, dbName: `postpipe_${payload.targetDb}` };
            }
            else {
                console.warn(`[MongoAdapter] Warning: targetDb '${payload.targetDb}' requested but env var '${dynamicKey}' not found.`);
                console.warn(`[MongoAdapter] Falling back to default routing logic.`);
            }
        }
        if (payload && ((_b = this.config) === null || _b === void 0 ? void 0 : _b.rules)) {
            for (const rule of this.config.rules) {
                const value = payload[rule.field]; // e.g. payload.formName
                if (value && new RegExp(rule.match).test(String(value))) {
                    console.log(`[MongoAdapter] Routing Rule Matched: ${rule.field}="${value}" matches /${rule.match}/ -> ${rule.target}`);
                    target = rule.target;
                    break;
                }
            }
        }
        // 3. Resolve Target to Config (Fallback to db-routes.json logic if dynamic failed)
        const dbConf = (_d = (_c = this.config) === null || _c === void 0 ? void 0 : _c.databases) === null || _d === void 0 ? void 0 : _d[target];
        if (!dbConf) {
            // If we are here and didn't find dynamic, revert to default vars
            return { uri: this.defaultUri, dbName: this.defaultDbName };
        }
        // 4. Resolve Env Vars
        const uri = this.resolveValue(dbConf.uri) || this.defaultUri;
        const dbName = this.resolveValue(dbConf.dbName) || this.defaultDbName;
        return { uri, dbName };
    }
    async getClient(uri) {
        if (connectionPool.has(uri)) {
            return connectionPool.get(uri);
        }
        console.log(`[MongoAdapter] Creating new connection pool for URI: ${uri.replace(/\/\/.*@/, '//***@')}`); // Mask secret
        // Create promise and store it immediately
        const clientPromise = new mongodb_1.MongoClient(uri).connect().then(client => {
            console.log(`[MongoAdapter] Connected to MongoDB host.`);
            return client;
        });
        connectionPool.set(uri, clientPromise);
        return clientPromise;
    }
    // NOTE: For multi-db, "connect" is lazy or just pre-checks the default.
    // We'll actually connect in `insert` to the *correct* DB.
    async connect() {
        // Optional: Pre-warm the default connection
        try {
            const { uri } = this.getTargetConfig();
            if (uri)
                await this.getClient(uri);
        }
        catch (e) {
            console.warn("[MongoAdapter] Initial connection warning:", e);
        }
    }
    async insert(submission) {
        // 1. Resolve which DB to use based on payload
        const { uri, dbName } = this.getTargetConfig(submission);
        if (!uri)
            throw new Error("No MongoDB URI resolved.");
        // 2. Get connection (cached)
        const client = await this.getClient(uri);
        const db = client.db(dbName);
        // 3. Determine Collection (Dynamic logic from previous task via payload)
        const targetCollection = submission.formName || submission.formId || this.collectionName;
        // 4. Insert
        await db.collection(targetCollection).insertOne(Object.assign(Object.assign({}, submission), { _receivedAt: new Date() }));
        console.log(`[MongoAdapter] Saved to DB [${dbName}] -> Collection [${targetCollection}]`);
    }
    async query(formId, limit = 50) {
        // 1. We need to find WHICH db/collection this formId maps to.
        // This is tricky because routing depends on PAYLOAD data (like formName or targetDb).
        // But here we only have `formId`.
        // Assumption: The simplest logic is that `formId` maps to a collection with the SAME name
        // in the DEFAULT database, UNLESS we assume the user knows the targetDb.
        // We'll search in the default setup first. 
        // Ideally, we should pass `targetDb` in the query params if we want to query a secondary DB.
        const { uri, dbName } = this.getTargetConfig(); // Defaults
        const client = await this.getClient(uri);
        const db = client.db(dbName);
        const results = await db.collection(formId).find({}).sort({ _receivedAt: -1 }).limit(limit).toArray();
        return results;
    }
    async disconnect() {
        // Close all connections
        for (const [uri, clientPromise] of connectionPool.entries()) {
            const client = await clientPromise;
            await client.close();
        }
        connectionPool.clear();
    }
}
exports.MongoAdapter = MongoAdapter;
