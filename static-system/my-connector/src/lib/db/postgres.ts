import { Pool } from 'pg';
import { DatabaseAdapter, PostPipeIngestPayload } from '../../types';

// Map of Connection String -> Pool Promise (to handle race conditions)
const postgresPoolMap = new Map<string, Promise<Pool>>();

// Track initialized tables to prevent running CREATE TABLE IF NOT EXISTS on every query
const initializedTables = new Set<string>();

export class PostgresAdapter implements DatabaseAdapter {

    private resolveConnectionString(payload?: PostPipeIngestPayload): string | undefined {
        const { databaseConfig, targetDatabase } = (payload || {}) as any;
        const targetDb = targetDatabase || (payload as any)?.targetDb;
        
        console.log(`[PostgresAdapter] resolving connection for target: ${targetDb || 'default'}...`);
        
        // 1. Explicit Payload Config
        if (databaseConfig?.uri) {
            const envVarName = databaseConfig.uri;
            const uri = process.env[envVarName];
            if (uri) return uri;
        }

        // 2. Dynamic Routing
        if (targetDb) {
            const dynamicKey = `DATABASE_URL_${targetDb.toUpperCase()}`;
            let dynamicUri = process.env[dynamicKey];
            if (dynamicUri) return dynamicUri;

            dynamicUri = process.env[targetDb];
            if (dynamicUri) return dynamicUri;
        }

        // 3. Default Environment Variables
        const prefix = process.env.POSTPIPE_VAR_PREFIX ? `${process.env.POSTPIPE_VAR_PREFIX}_` : "";
        const defaultUri = process.env[`${prefix}DATABASE_URL`] || 
                           process.env[`${prefix}POSTGRES_URL`] || 
                           process.env.DATABASE_URL || 
                           process.env.POSTGRES_URL;
                           
        return defaultUri;
    }

    /**
     * ARCHITECT OPTIMIZATION: Dynamic Database Override
     * In PostgreSQL, databases must exist before connecting. We cannot auto-create them 
     * just by changing the URI string (it throws 3D000 Invalid Catalog Name). 
     * We leave the connection untouched and use the alias for dynamic TABLE routing instead.
     */
    private overrideDatabaseInUri(uri: string, alias?: string): string {
        return uri;
    }

    private getTableName(alias?: string, dbName?: string): string {
        const nameToUse = dbName || alias;
        
        const thermalKeys = ['url', 'uri', 'postgres', 'postgresql', 'database'];
        const isTechnical = nameToUse && thermalKeys.some(key => nameToUse.toLowerCase().includes(key));

        if (!nameToUse || nameToUse === 'default' || nameToUse.startsWith('conn_') || isTechnical) {
            return 'public.postpipe_submissions';
        }
        const safeAlias = nameToUse.replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase();
        return `public.${safeAlias}`;
    }

    private async getPool(connectionString: string, alias?: string, dbName?: string): Promise<Pool> {
        // We do not override Postgres URI databases because it throws 3D000 if it doesn't exist
        const finalUri = connectionString;

        // Include alias in the cache key so different aliases don't return the same pool mapping mistakenly if URIs match
        const cacheKey = `${finalUri}::${dbName || alias || 'default'}`;
        
        let poolPromise = postgresPoolMap.get(cacheKey);

        if (!poolPromise) {
            poolPromise = (async () => {
                console.log(`[PostgresAdapter] Target Database: [${dbName || alias || 'default'}]`);
                console.log(`[PostgresAdapter] Establishing connection pool to host: ${finalUri.split('@').pop()?.split('/')[0] || 'localhost'}`);

                const pool = new Pool({
                    connectionString: finalUri,
                    ssl: (finalUri.includes('supabase') || 
                          finalUri.includes('render') || 
                          finalUri.includes('aiven') ||
                          finalUri.includes('neon.tech'))
                        ? { rejectUnauthorized: false } 
                        : false
                });

                // Test connection
                await pool.query('SELECT NOW()');
                return pool;
            })();

            postgresPoolMap.set(cacheKey, poolPromise);
        }

        const pool = await poolPromise;
        await this.ensureTable(pool, alias, dbName);
        return pool;
    }

    private async ensureTable(pool: Pool, alias?: string, dbName?: string) {
        const tableName = this.getTableName(alias, dbName);
        
        // Skip if we already initialized this specific table in this runtime
        if (initializedTables.has(tableName)) {
            return;
        }

        try {
            console.log(`[PostgresAdapter] Verifying table '${tableName}' exists...`);
            const createTableQuery = `
                CREATE TABLE IF NOT EXISTS ${tableName} (
                    id SERIAL PRIMARY KEY,
                    form_id TEXT NOT NULL,
                    submission_id TEXT UNIQUE NOT NULL,
                    data JSONB NOT NULL,
                    timestamp TIMESTAMPTZ NOT NULL,
                    created_at TIMESTAMPTZ DEFAULT NOW()
                );
            `;
            await pool.query(createTableQuery);

            const indexName = `idx_form_id_${tableName.replace('public.', '')}`;
            const createIndexQuery = `
                CREATE INDEX IF NOT EXISTS ${indexName} ON ${tableName}(form_id);
            `;
            await pool.query(createIndexQuery);
            initializedTables.add(tableName);
            console.log("[PostgresAdapter] Table verification complete.");
        } catch (error) {
            console.error(`[PostgresAdapter] FAILED to verify/create table ${tableName}:`, error);
            throw error;
        }
    }

    async connect(payload?: PostPipeIngestPayload) {
        const connectionString = this.resolveConnectionString(payload);
        const alias = (payload as any)?.targetDatabase || (payload as any)?.targetDb;
        const dbName = (payload as any)?.databaseConfig?.dbName;
        if (connectionString) {
            await this.getPool(connectionString, alias, dbName);
        }
    }

    async insert(submission: PostPipeIngestPayload): Promise<void> {
        const connectionString = this.resolveConnectionString(submission);
        const alias = (submission as any).targetDatabase || (submission as any).targetDb;
        const dbName = (submission as any).databaseConfig?.dbName;

        if (!connectionString) {
            throw new Error(`[PostgresAdapter] No connection string resolved.`);
        }

        const pool = await this.getPool(connectionString, alias, dbName);
        
        // ARCHITECT LEVEL OPTIMIZATION: Payload Sanitization
        const { 
            databaseConfig, 
            routing, 
            signature,
            ...cleanData 
        } = submission as any;
        delete cleanData.targetDatabase;
        delete cleanData.targetDb;

        const tableName = this.getTableName(alias, dbName);

        const query = `
            INSERT INTO ${tableName} (form_id, submission_id, data, timestamp)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (submission_id) DO NOTHING;
        `;
        
        await pool.query(query, [
            cleanData.formId,
            cleanData.submissionId,
            JSON.stringify(cleanData.data),
            cleanData.timestamp
        ]);
        
        console.log(`[PostgresAdapter] Saved to DB: [${alias || 'default'}]`);
    }

    async query(formId: string, options?: any): Promise<PostPipeIngestPayload[]> {
        const connectionString = this.resolveConnectionString(options);
        const alias = options?.targetDatabase || options?.targetDb;
        const dbName = options?.databaseConfig?.dbName;
        if (!connectionString) throw new Error("[PostgresAdapter] Cannot query: No connection string.");
        
        const pool = await this.getPool(connectionString, alias, dbName);
        
        const tableName = this.getTableName(alias, dbName);
        const limit = options?.limit || 50;
        const query = `
            SELECT submission_id as "submissionId", data, timestamp, form_id as "formId"
            FROM ${tableName}
            WHERE form_id = $1
            ORDER BY timestamp DESC
            LIMIT $2;
        `;
        
        const res = await pool.query(query, [formId, limit]);
        
        return res.rows.map(row => ({
            ...row,
            signature: ''
        }));
    }

    async disconnect() {
        for (const poolPromise of postgresPoolMap.values()) {
            const pool = await poolPromise;
            await pool.end();
        }
        postgresPoolMap.clear();
    }
}
