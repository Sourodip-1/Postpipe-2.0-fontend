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

  private getTargetConfig(payload?: PostPipeIngestPayload): { uri: string, dbName: string } {
    // 1. Determine requested target from Payload (support both naming conventions)
    const targetName = (payload as any)?.targetDatabase || payload?.targetDb;

    // 2. Dynamic Routing: Check Environment Variables directly
    // This allows routing to work WITHOUT db-routes.json if Env Vars are set.
    if (targetName) {
      const dynamicKey = `MONGODB_URI_${targetName.toUpperCase()}`; // e.g. MONGODB_URI_SECONDARY
      const dynamicUri = process.env[dynamicKey];

      console.log(`[MongoAdapter] Debug: target="${targetName}", looking for env var "${dynamicKey}"`);

      if (dynamicUri) {
        console.log(`[MongoAdapter] Dynamic Logic: Found ${dynamicKey}, routing to '${targetName}'`);
        return { uri: dynamicUri, dbName: `postpipe_${targetName}` };
      } else {
        console.warn(`[MongoAdapter] Warning: target '${targetName}' requested but env var "${dynamicKey}" not found.`);
      }
    }

    // 3. Config-based Rules (Only if config exists)
    let ruleTarget = this.config?.defaultTarget || 'default';

    if (payload && this.config?.rules) {
      for (const rule of this.config.rules) {
        const value = (payload as any)[rule.field];
        if (value && new RegExp(rule.match).test(String(value))) {
          console.log(`[MongoAdapter] Routing Rule Matched: ${rule.field}="${value}" matches /${rule.match}/ -> ${rule.target}`);
          ruleTarget = rule.target;
          break;
        }
      }
    }

    // 4. Resolve Target from Config (Fallback to db-routes.json)
    if (this.config) {
      // If we found a specific target via rules, or use default
      // Note: If request had targetName but no env var found, we might want to check config for that name too?
      // Let's check config for the requested targetName first if it exists, otherwise use ruleTarget
      const effectiveTarget = (targetName && this.config.databases?.[targetName]) ? targetName : ruleTarget;

      const dbConf = this.config.databases?.[effectiveTarget];
      if (dbConf) {
        const uri = this.resolveValue(dbConf.uri) || this.defaultUri;
        const dbName = this.resolveValue(dbConf.dbName) || this.defaultDbName;
        return { uri, dbName };
      }
    }

    // 5. Fallback to Defaults
    // If no config, no dynamic env var found, return default URI
    return { uri: this.defaultUri, dbName: this.defaultDbName };
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

  async insert(payload: PostPipeIngestPayload): Promise<void> {
    // 1. EXTRACT CONFIG FROM PAYLOAD
    const { targetDatabase, databaseConfig } = payload as any;
    let uri: string | undefined;
    let dbName: string = "postpipe"; // default

    if (databaseConfig) {
      // CASE A: Frontend sent explicit config (Dependency Injection)

      // The frontend sends the VARIABLE NAME, so we look it up in process.env
      // This requires the Connector to have the same .env variables as Frontend
      const envVarName = databaseConfig.uri;
      uri = process.env[envVarName];

      if (databaseConfig.dbName) {
        dbName = databaseConfig.dbName;
      }

      console.log(`[MongoAdapter] Using injected config: ${envVarName} -> ${uri ? 'Found' : 'MISSING'}`);
    } else {
      // CASE B: Legacy / Fallback (Old behavior)
      const config = this.getTargetConfig(payload);
      uri = config.uri;
      dbName = config.dbName;
    }

    if (!uri) {
      throw new Error(`No MongoDB URI resolved. Target: ${targetDatabase || payload.targetDb}`);
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
    // 1. Determine Database URI & Name
    let targetUri = this.defaultUri;
    let targetDbName = this.defaultDbName;

    if (options?.databaseConfig?.uri) {
      const envVarName = options.databaseConfig.uri.trim(); // Ensure no whitespace
      const resolvedUri = process.env[envVarName];
      console.log(`[MongoAdapter] Lookup URI for key: '${envVarName}' -> Found: ${!!resolvedUri ? 'YES' : 'NO'}`);

      if (resolvedUri) {
        targetUri = resolvedUri;
        targetDbName = options.databaseConfig.dbName || targetDbName;
        console.log(`[MongoAdapter] Querying routed DB: ${targetDbName}`);
      } else {
        console.warn(`[MongoAdapter] Failed to resolve URI from env var: '${envVarName}'`);
        const availableKeys = Object.keys(process.env).filter(k => k.startsWith('MONGODB_URI'));
        console.log(`[MongoAdapter] Available MONGODB_URI_* keys:`, availableKeys);
      }
    } else {
      // Fallback to default config resolution
      // Fix: Pass targetDatabase from options to getTargetConfig to enable dynamic routing (MONGODB_URI_{TARGET})
      const config = this.getTargetConfig({ targetDb: options?.targetDatabase } as any);
      targetUri = config.uri;
      targetDbName = config.dbName;
    }

    if (!targetUri) {
      console.error("[MongoAdapter] CRITICAL: No MongoDB URI resolved. Config state:", {
        defaultUri: this.defaultUri ? 'SET' : 'UNSET',
        hasConfig: !!this.config,
        options: options
      });
      throw new Error("No MongoDB URI resolved for query.");
    }

    // 2. Get Client from Pool
    const client = await this.getClient(targetUri);
    const db = client.db(targetDbName);

    // 3. Query Collection
    // Assuming collection name == formId
    const collection = db.collection(formId);

    const results = await collection
      .find({})
      .sort({ _receivedAt: -1 })
      .limit(options?.limit || 50)
      .toArray();

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
