import { MongoClient, Db } from 'mongodb';
import { DatabaseAdapter, PostPipeIngestPayload } from '../../types';
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
      // Try to load db-routes.json from src/config or config/
      const possiblePaths = [
        path.join(process.cwd(), 'src', 'config', 'db-routes.json'),
        path.join(process.cwd(), 'config', 'db-routes.json'),
        path.join(__dirname, '..', '..', 'config', 'db-routes.json')
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
      const result = process.env[envVar] || '';
      if (!result) console.warn(`[MongoAdapter] Warning: Env var ${envVar} sought but empty.`);
      return result;
    }
    return val;
  }

  private resolveUri(targetName?: string, databaseConfig?: any): string | undefined {
    // 1. Explicit Payload Config
    if (databaseConfig?.uri) {
      const envVarName = databaseConfig.uri;
      const uri = process.env[envVarName];
      if (uri) {
        console.log(`[MongoAdapter] -> Found via explicit payload config: ${envVarName}`);
        return uri;
      }
      console.warn(`[MongoAdapter] -> Payload requested env var ${envVarName} but it's MISSING.`);
    }

    // 2. Dynamic Routing (MONGODB_URI_{TARGET})
    if (targetName) {
      const dynamicKey = `MONGODB_URI_${targetName.toUpperCase()}`;
      const dynamicUri = process.env[dynamicKey];
      if (dynamicUri) {
        console.log(`[MongoAdapter] -> Found via dynamic routing: ${dynamicKey}`);
        return dynamicUri;
      }
    }

    // 3. Default Environment Variable
    const prefix = process.env.POSTPIPE_VAR_PREFIX ? `${process.env.POSTPIPE_VAR_PREFIX}_` : "";
    const prefixedUri = process.env[`${prefix}MONGODB_URI`];
    if (prefixedUri) {
      console.log(`[MongoAdapter] -> Found via prefixed default (MONGODB_URI)`);
      return prefixedUri;
    }

    if (this.defaultUri) {
      console.log(`[MongoAdapter] -> Found via default (MONGODB_URI)`);
      return this.defaultUri;
    }

    // 4. Fallback: Scan process.env for ANY MONGODB_URI_* (Last Resort)
    console.log(`[MongoAdapter] -> Searching fallback keys...`);
    const fallbackKeys = Object.keys(process.env).filter(k => 
      k.startsWith('MONGODB_URI_') && process.env[k]
    );
    
    if (fallbackKeys.length > 0) {
      const fallbackKey = fallbackKeys[0];
      console.log(`[MongoAdapter] -> Fallback match: ${fallbackKey}`);
      return process.env[fallbackKey];
    }

    return undefined;
  }

  private getTargetConfig(payload?: PostPipeIngestPayload): { uri: string, dbName: string } {
    const { targetDatabase, databaseConfig } = (payload || {}) as any;
    const targetName = targetDatabase || (payload as any)?.targetDb;

    console.log(`[MongoAdapter] Resolving config for target: '${targetName}'`);
    const uri = this.resolveUri(targetName, databaseConfig) || "";
    
    // Default dbName resolution
    let dbName = this.defaultDbName;
    if (databaseConfig?.dbName) {
      dbName = databaseConfig.dbName;
    } else if (targetName) {
      dbName = `postpipe_${targetName}`;
    }

    console.log(`[MongoAdapter] Resolved: DB=[${dbName}] URI=[${uri ? 'SET' : 'MISSING'}]`);
    return { uri, dbName };
  }

  private async getClient(uri: string): Promise<MongoClient> {
    if (connectionPool.has(uri)) {
      return connectionPool.get(uri)!;
    }

    console.log(`[MongoAdapter] Establishing connection to host: ${uri.split('@').pop() || 'localhost'}`); 

    // Create promise and store it immediately
    const clientPromise = new MongoClient(uri).connect().then(client => {
      console.log(`[MongoAdapter] Connection established successfully.`);
      return client;
    });

    connectionPool.set(uri, clientPromise);
    return clientPromise;
  }

  // NOTE: For multi-db, "connect" is lazy or just pre-checks the default.
  // We'll actually connect in `insert` to the *correct* DB.
  async connect(context?: any): Promise<void> {
    // Optional: Pre-warm the default connection
    try {
      const { uri } = this.getTargetConfig();
      if (uri) await this.getClient(uri);
    } catch (e) {
      console.warn("[MongoAdapter] Initial connection warning:", e);
    }
  }

  async insert(payload: PostPipeIngestPayload): Promise<void> {
    const { uri, dbName } = this.getTargetConfig(payload);

    if (!uri) {
      throw new Error(`[MongoAdapter] No MongoDB URI resolved. Available relevant keys: ${Object.keys(process.env).filter(k => k.includes('MONGO'))}`);
    }

    // 2. Get connection (cached)
    const client = await this.getClient(uri);
    const db = client.db(dbName);

    // 3. Determine Collection (Dynamic logic from previous task via payload)
    const targetCollection = payload.formName || payload.formId || this.collectionName;

    // 4. Insert
    await db.collection(targetCollection).insertOne({
      ...payload,
      _receivedAt: new Date()
    });

    console.log(`[MongoAdapter] Saved to DB [${dbName}] -> Collection [${targetCollection}]`);
  }

  async query(formId: string, options?: any): Promise<PostPipeIngestPayload[]> {
    const { uri: targetUri, dbName: targetDbName } = this.getTargetConfig({ 
      targetDatabase: options?.targetDatabase, 
      databaseConfig: options?.databaseConfig 
    } as any);

    if (!targetUri) {
      console.error("[MongoAdapter] CRITICAL: No MongoDB URI resolved. Available relevant keys:", 
        Object.keys(process.env).filter(k => k.includes('MONGO'))
      );
      throw new Error(`No MongoDB URI resolved for query. Target: ${options?.targetDatabase}`);
    }

    // 2. Get Client from Pool
    const client = await this.getClient(targetUri);
    const db = client.db(targetDbName);

    // 3. Query Collection
    // Assuming collection name == formId
    const collection = db.collection(formId);
    console.log(`[MongoAdapter] Fetching from collection: [${formId}]`);

    const results = await collection
      .find({})
      .sort({ _receivedAt: -1 })
      .limit(options?.limit || 50)
      .toArray();

    console.log(`[MongoAdapter] Query finished. Found ${results.length} documents.`);
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
