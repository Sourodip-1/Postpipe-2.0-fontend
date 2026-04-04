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

    // NEW: Direct Environment Variable Match
    // If the targetName itself is an environment variable name, use it.
    if (targetName && process.env[targetName]) {
      console.log(`[MongoAdapter] -> Found via direct env match: ${targetName}`);
      return process.env[targetName];
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

  private extractDbNameFromUri(uri: string): string | undefined {
    try {
      // mongodb://user:pass@host/dbname?options or mongodb+srv://...
      const match = uri.match(/^mongodb(?:\+srv)?:\/\/[^/]+\/([^?#]+)/);
      if (match && match[1] && match[1].trim() !== '') return match[1];
    } catch (e) {}
    return undefined;
  }

  private getTargetConfig(payload?: PostPipeIngestPayload): { uri: string, dbName: string } {
    const { targetDatabase, databaseConfig } = (payload || {}) as any;
    // CRITICAL: targetDb is usually the routed target (split/broadcast), prioritize it!
    const targetName = (payload as any)?.targetDb || targetDatabase;

    console.log(`[MongoAdapter] Resolving config for target: '${targetName || 'default'}'`);
    const uri = this.resolveUri(targetName, databaseConfig) || "";

    // Optimized: Resolve DB Name with correct priority
    let dbName = this.defaultDbName;
    
    // Logic to determine if targetName is a real DB name or a technical alias/routing key
    const thermalKeys = ['url', 'uri', 'mongodb', 'atlas', 'database'];
    
    const isRoutingKey = targetName && (
      process.env[`MONGODB_URI_${targetName.toUpperCase()}`] ||
      process.env[`DATABASE_URL_${targetName.toUpperCase()}`] ||
      process.env[`POSTGRES_URL_${targetName.toUpperCase()}`]
    );

    const isInternalAlias = targetName && (
      process.env[targetName] || 
      thermalKeys.some(key => targetName.toLowerCase().includes(key)) ||
      targetName === 'default'
    );

    const isTechnicalAlias = !!(isInternalAlias || isRoutingKey);

    if (databaseConfig?.dbName) {
      dbName = databaseConfig.dbName;
    } else if (targetName && !isTechnicalAlias) {
      dbName = targetName;
    } else {
      const extracted = uri ? this.extractDbNameFromUri(uri) : undefined;
      // Many MongoDB cloud URIs end with /?retryWrites=true which makes extracted ""
      if (extracted && extracted.trim() !== '') {
        dbName = extracted;
      }
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
    const clientPromise = new MongoClient(uri, {
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000,
    }).connect().then(client => {
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

    // 1. Get connection (cached)
    const client = await this.getClient(uri);
    const db = client.db(dbName);

    // 2. Determine Collection (Dynamic logic via formName/formId)
    const targetCollection = payload.formName || payload.formId || this.collectionName;

    // 3. ARCHITECT LEVEL OPTIMIZATION: Payload Sanitization
    // Strip ALL internal routing and configuration metadata
    const { 
      databaseConfig, 
      routing, 
      signature,
      ...cleanData 
    } = payload as any;

    // Remove legacy/routing fields
    delete cleanData.targetDatabase;
    delete cleanData.targetDb;

    // 4. Insert Sanitized Data
    await db.collection(targetCollection).insertOne({
      ...cleanData,
      _receivedAt: new Date()
    });

    console.log(`[MongoAdapter] Successfully routed to DB: [${dbName}] -> Collection: [${targetCollection}]`);
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

    const client = await this.getClient(targetUri);
    const db = client.db(targetDbName);

    const collection = db.collection(formId);
    console.log(`[MongoAdapter] Fetching from collection: [${formId}]`);

    // Pagination
    const limit = options?.limit || 50;
    const page = Math.max(1, options?.page || 1);
    const skip = (page - 1) * limit;

    // Build filter — exclude soft-deleted by default
    const filter: Record<string, any> = {};
    if (!options?.includeDeleted) {
      filter.is_deleted = { $ne: true };
    }

    // Smart Search
    if (options?.search) {
      filter.$or = [
        { submissionId: { $regex: options.search, $options: 'i' } },
        { id: { $regex: options.search, $options: 'i' } }
      ];
    }

    // Date range filter
    if (options?.dateRange) {
      const now = new Date();
      let startDate: Date | null = null;
      if (options.dateRange === '24h') startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      else if (options.dateRange === '7d') startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      else if (options.dateRange === '30d') startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      if (startDate) {
        filter.timestamp = { $gte: startDate.toISOString() };
      }
    }

    // Support arbitrary extra filters (e.g. {_id: 'xyz'})
    if (options?.filter) {
      Object.assign(filter, options.filter);
    }

    const results = await collection
      .find(filter)
      .sort({ _receivedAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    const taggedResults = results.map(doc => {
      const { _id, ...rest } = doc;
      return {
        ...rest,
        id: _id.toString(), // Standardize on 'id' for frontend
        _id: _id.toString(),
        submissionId: rest.submissionId || _id.toString(), // Ensure submissionId is always there
        _dbType: 'mongodb',
        _sourceDb: targetDbName
      };
    });


    console.log(`[MongoAdapter] Query finished. Found ${taggedResults.length} documents (page ${page}).`);
    return taggedResults as unknown as PostPipeIngestPayload[];
  }

  async updateSubmission(formId: string, submissionId: string, patch: Record<string, unknown>, options?: any): Promise<boolean> {
    const { uri, dbName } = this.getTargetConfig(options as any);
    console.log(`[MongoAdapter] updateSubmission: formId=${formId}, submissionId=${submissionId}, patch=`, patch);
    console.log(`[MongoAdapter] Using uri (first 50 chars): ${uri ? uri.substring(0, 50) : 'undefined'}, dbName=${dbName}`);
    if (!uri) throw new Error('[MongoAdapter] No URI for updateSubmission');

    const client = await this.getClient(uri);
    const db = client.db(dbName);
    const collection = db.collection(formId);

    // Build $set using dot-notation keys to correctly partial-update the 'data' field
    const setOps: Record<string, any> = { updated_at: new Date().toISOString() };
    for (const [key, value] of Object.entries(patch)) {
      setOps[`data.${key}`] = value;
    }
    console.log(`[MongoAdapter] setOps =`, setOps);



    // Resolve _id if it's a valid hex string for Mongo, as backup for submissionId
    let queryFilter: any = { submissionId };
    try {
        if (submissionId.length === 24) {
            const { ObjectId } = require('mongodb');
            queryFilter = {
                $or: [
                    { submissionId },
                    { _id: new ObjectId(submissionId) }
                ]
            };
        }
    } catch (e) { /* not an objectid */ }
    console.log(`[MongoAdapter] queryFilter =`, queryFilter);

    const result = await collection.updateOne(
      { ...queryFilter, is_deleted: { $ne: true } },
      { $set: setOps }
    );


    console.log(`[MongoAdapter] updateSubmission: matched=${result.matchedCount} modified=${result.modifiedCount} upsertedId=${result.upsertedId}`);
    if (result.matchedCount === 0) {
        console.warn(`[MongoAdapter] UPDATE FAILED: No document matched filter:`, JSON.stringify(queryFilter));
    }
    return result.matchedCount > 0;
  }

  async deleteSubmission(formId: string, submissionId: string, hard: boolean, options?: any): Promise<boolean> {
    const { uri, dbName } = this.getTargetConfig(options as any);
    if (!uri) throw new Error('[MongoAdapter] No URI for deleteSubmission');

    const client = await this.getClient(uri);
    const db = client.db(dbName);
    const collection = db.collection(formId);

    if (hard) {
      const result = await collection.deleteOne({ submissionId });
      console.log(`[MongoAdapter] Hard delete submissionId=${submissionId}: deleted=${result.deletedCount}`);
      return result.deletedCount > 0;
    } else {
      const result = await collection.updateOne(
        { submissionId },
        { $set: { is_deleted: true, deleted_at: new Date().toISOString() } }
      );
      console.log(`[MongoAdapter] Soft delete submissionId=${submissionId}: matched=${result.matchedCount}`);
      return result.matchedCount > 0;
    }
  }

  // --- AUTH METHODS ---
  async findUserByEmail(email: string, context?: any) {
    const uri = this.resolveConnectionString(context);
    if (!uri) throw new Error("[MongoAdapter] Cannot query: No MongoDB URI provided.");
    const targetDbName = context?.targetDatabase || process.env.MONGODB_DB_NAME || 'postpipe';
    
    // We reuse getClient. But the original file uses `getClient` which is private.
    const client = await this.getClient(uri);
    const db = client.db(targetDbName);
    const collection = db.collection('postpipe_users');
    return collection.findOne({ email });
  }

  async insertUser(user: any, context?: any) {
    const uri = this.resolveConnectionString(context);
    if (!uri) throw new Error("[MongoAdapter] Cannot query: No MongoDB URI provided.");
    const targetDbName = context?.targetDatabase || process.env.MONGODB_DB_NAME || 'postpipe';
    
    const client = await this.getClient(uri);
    const db = client.db(targetDbName);
    const collection = db.collection('postpipe_users');
    
    // Ensure unique index on email
    await collection.createIndex({ email: 1 }, { unique: true });
    
    try {
      await collection.insertOne(user);
      console.log(`[MongoAdapter] Inserted Auth User: ${user.email}`);
    } catch (error: any) {
      if (error.code !== 11000) { // Ignore duplicate key errors if they happen
        throw error;
      }
    }
  }

  async updateUserLastLogin(userId: string, context?: any) {
    const uri = this.resolveConnectionString(context);
    if (!uri) return;
    const targetDbName = context?.targetDatabase || process.env.MONGODB_DB_NAME || 'postpipe';
    
    const client = await this.getClient(uri);
    const db = client.db(targetDbName);
    const collection = db.collection('postpipe_users');
    await collection.updateOne({ id: userId }, { $set: { last_login: new Date().toISOString() } });
  }

  async updateUserPassword(userId: string, newPasswordHash: string, context?: any) {
    const uri = this.resolveConnectionString(context);
    if (!uri) return;
    const targetDbName = context?.targetDatabase || process.env.MONGODB_DB_NAME || 'postpipe';
    
    const client = await this.getClient(uri);
    const db = client.db(targetDbName);
    const collection = db.collection('postpipe_users');
    await collection.updateOne({ id: userId }, { $set: { password_hash: newPasswordHash } });
  }

  async verifyUserEmail(userId: string, context?: any) {
    const uri = this.resolveConnectionString(context);
    if (!uri) return;
    const targetDbName = context?.targetDatabase || process.env.MONGODB_DB_NAME || 'postpipe';
    
    const client = await this.getClient(uri);
    const db = client.db(targetDbName);
    const collection = db.collection('postpipe_users');
    await collection.updateOne({ id: userId }, { $set: { email_verified: true, otp_code: null, otp_expires_at: null } });
  }

  async updateUserOtp(userId: string, otp: string, expiresAt: Date, context?: any) {
    const uri = this.resolveConnectionString(context);
    if (!uri) return;
    const targetDbName = context?.targetDatabase || process.env.MONGODB_DB_NAME || 'postpipe';
    
    const client = await this.getClient(uri);
    const db = client.db(targetDbName);
    const collection = db.collection('postpipe_users');
    await collection.updateOne({ id: userId }, { $set: { otp_code: otp, otp_expires_at: expiresAt } });
  }

  private resolveConnectionString(context?: any): string | undefined {
    return this.getTargetConfig({ targetDatabase: context?.targetDatabase, databaseConfig: context?.databaseConfig } as any).uri;
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
