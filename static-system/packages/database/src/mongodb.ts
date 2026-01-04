import { MongoClient, Db } from 'mongodb';
import { DatabaseAdapter, PostPipeIngestPayload } from './types';
import * as fs from 'fs';
import * as path from 'path';

// --- Configuration Types ---
interface DbConfig {
  uri: string;
  dbName: string;
}

interface DbRouteConfig {
  databases: Record<string, DbConfig>;
  rules: Array<{
    field: string;
    match: string;
    target: string;
  }>;
  defaultTarget: string;
}

// --- Connection Pooling ---
// Map of URI -> MongoClient Promise (to handle race conditions during connect)
const connectionPool = new Map<string, Promise<MongoClient>>();

export class MongoAdapter implements DatabaseAdapter {
  private config: DbRouteConfig | null = null;
  
  // These are now resolved dynamically per request, but we keep 'default' 
  // values initialized for fallback or initial connection if needed.
  private defaultUri: string;
  private defaultDbName: string;
  private collectionName: string;

  constructor() {
    this.defaultUri = process.env.MONGODB_URI || '';
    this.defaultDbName = process.env.MONGODB_DB_NAME || 'postpipe';
    this.collectionName = process.env.MONGODB_COLLECTION || 'submissions';

    this.loadConfig();
  }

  private loadConfig() {
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
    } catch (error) {
      console.error("[MongoAdapter] Failed to load config:", error);
    }
  }

  private resolveValue(val: string): string {
    if (val.startsWith('env:')) {
      const envVar = val.split('env:')[1];
      return process.env[envVar] || '';
    }
    return val;
  }

  private getTargetConfig(payload?: PostPipeIngestPayload): { uri: string, dbName: string } {
    // 1. If no config, return defaults
    if (!this.config) {
      return { uri: this.defaultUri, dbName: this.defaultDbName };
    }

    // 2. Determine Target from Payload
    let target = this.config?.defaultTarget || 'default';
    
    // Dynamic: If payload has targetDb, try to find matching Env Var
    if (payload?.targetDb) {
      const dynamicKey = `MONGODB_URI_${payload.targetDb.toUpperCase()}`; // e.g. MONGODB_URI_SECONDARY
      const dynamicUri = process.env[dynamicKey];
      
      console.log(`[MongoAdapter] Debug: targetDb="${payload.targetDb}", looking for env var "${dynamicKey}"`);

      if (dynamicUri) {
        console.log(`[MongoAdapter] Dynamic Logic: Found ${dynamicKey}, routing to '${payload.targetDb}'`);
        return { uri: dynamicUri, dbName: `postpipe_${payload.targetDb}` }; 
      } else {
         console.warn(`[MongoAdapter] Warning: targetDb '${payload.targetDb}' requested but env var '${dynamicKey}' not found.`);
         console.warn(`[MongoAdapter] Falling back to default routing logic.`);
      }
    }

    if (payload && this.config?.rules) {
      for (const rule of this.config.rules) {
        const value = (payload as any)[rule.field]; // e.g. payload.formName
        
        if (value && new RegExp(rule.match).test(String(value))) {
          console.log(`[MongoAdapter] Routing Rule Matched: ${rule.field}="${value}" matches /${rule.match}/ -> ${rule.target}`);
          target = rule.target;
          break;
        }
      }
    }

    // 3. Resolve Target to Config (Fallback to db-routes.json logic if dynamic failed)
    const dbConf = this.config?.databases?.[target];
    if (!dbConf) {
      // If we are here and didn't find dynamic, revert to default vars
      return { uri: this.defaultUri, dbName: this.defaultDbName };
    }

    // 4. Resolve Env Vars
    const uri = this.resolveValue(dbConf.uri) || this.defaultUri;
    const dbName = this.resolveValue(dbConf.dbName) || this.defaultDbName;

    return { uri, dbName };
  }

  private async getClient(uri: string): Promise<MongoClient> {
    if (connectionPool.has(uri)) {
      return connectionPool.get(uri)!;
    }

    console.log(`[MongoAdapter] Creating new connection pool for URI: ${uri.replace(/\/\/.*@/, '//***@')}`); // Mask secret
    
    // Create promise and store it immediately
    const clientPromise = new MongoClient(uri).connect().then(client => {
       console.log(`[MongoAdapter] Connected to MongoDB host.`);
       return client;
    });
    
    connectionPool.set(uri, clientPromise);
    return clientPromise;
  }

  // NOTE: For multi-db, "connect" is lazy or just pre-checks the default.
  // We'll actually connect in `insert` to the *correct* DB.
  async connect(): Promise<void> {
    // Optional: Pre-warm the default connection
    try {
        const { uri } = this.getTargetConfig();
        if (uri) await this.getClient(uri);
    } catch (e) {
        console.warn("[MongoAdapter] Initial connection warning:", e);
    }
  }

  async insert(submission: PostPipeIngestPayload): Promise<void> {
    // 1. Resolve which DB to use based on payload
    const { uri, dbName } = this.getTargetConfig(submission);

    if (!uri) throw new Error("No MongoDB URI resolved.");

    // 2. Get connection (cached)
    const client = await this.getClient(uri);
    const db = client.db(dbName);
    
    // 3. Determine Collection (Dynamic logic from previous task via payload)
    const targetCollection = submission.formName || submission.formId || this.collectionName;

    // 4. Insert
    await db.collection(targetCollection).insertOne({
      ...submission,
      _receivedAt: new Date()
    });

    console.log(`[MongoAdapter] Saved to DB [${dbName}] -> Collection [${targetCollection}]`);
  }

  async query(formId: string, limit: number = 50): Promise<PostPipeIngestPayload[]> {
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
    return results as unknown as PostPipeIngestPayload[];
  }

  async disconnect(): Promise<void> {
    // Close all connections
    for (const [uri, clientPromise] of connectionPool.entries()) {
        const client = await clientPromise;
        await client.close();
    }
    connectionPool.clear();
  }
}
