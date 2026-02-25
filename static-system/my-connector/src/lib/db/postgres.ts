import { Pool } from 'pg';
import { DatabaseAdapter, PostPipeIngestPayload } from '../../types';

// Map of Connection String -> Pool Promise (to handle race conditions)
const postgresPoolMap = new Map<string, Promise<Pool>>();

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
     * Replaces the database name in the connection string with the provided alias.
     */
    private overrideDatabaseInUri(uri: string, alias?: string): string {
        if (!alias || alias === 'default' || alias.startsWith('conn_')) return uri;

        // Skip if alias is actually an environment variable name or a technical key
        const thermalKeys = ['url', 'uri', 'database', 'postgres', 'postgresql'];
        const lowerAlias = alias.toLowerCase();
        
        if (process.env[alias] || 
            thermalKeys.some(key => lowerAlias.includes(key))) {
            return uri;
        }

        try {
            // Very robust regex for postgres URIs: postgresql://user:pass@host:port/dbname?options
            const match = uri.match(/^(postgresql?:\/\/[^/]+\/)([^?#]+)(\?.*)?$/);
            if (match) {
                const base = match[1];
                const query = match[3] || "";
                console.log(`[PostgresAdapter] Overriding database name in URI: [${match[2]}] -> [${alias}]`);
                return `${base}${alias}${query}`;
            }
        } catch (e) {
            console.warn("[PostgresAdapter] Failed to parse URI for override, using original.", e);
        }
        return uri;
    }

    private async getPool(connectionString: string, alias?: string): Promise<Pool> {
        // Apply override if alias is provided
        const finalUri = this.overrideDatabaseInUri(connectionString, alias);

        if (postgresPoolMap.has(finalUri)) {
            return postgresPoolMap.get(finalUri)!;
        }

        const poolPromise = (async () => {
            console.log(`[PostgresAdapter] Target Database: [${alias || 'default'}]`);
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
            await this.ensureTable(pool);
            return pool;
        })();

        postgresPoolMap.set(finalUri, poolPromise);
        return poolPromise;
    }

    private async ensureTable(pool: Pool) {
        try {
            console.log("[PostgresAdapter] Verifying table 'public.postpipe_submissions' exists...");
            const createTableQuery = `
                CREATE TABLE IF NOT EXISTS public.postpipe_submissions (
                    id SERIAL PRIMARY KEY,
                    form_id TEXT NOT NULL,
                    submission_id TEXT UNIQUE NOT NULL,
                    data JSONB NOT NULL,
                    timestamp TIMESTAMPTZ NOT NULL,
                    created_at TIMESTAMPTZ DEFAULT NOW()
                );
            `;
            await pool.query(createTableQuery);

            const createIndexQuery = `
                CREATE INDEX IF NOT EXISTS idx_form_id ON public.postpipe_submissions(form_id);
            `;
            await pool.query(createIndexQuery);
            console.log("[PostgresAdapter] Table verification complete.");
        } catch (error) {
            console.error("[PostgresAdapter] FAILED to verify/create table:", error);
            throw error;
        }
    }

    async connect(payload?: PostPipeIngestPayload) {
        const connectionString = this.resolveConnectionString(payload);
        const alias = (payload as any)?.targetDatabase || (payload as any)?.targetDb;
        if (connectionString) {
            await this.getPool(connectionString, alias);
        }
    }

    async insert(submission: PostPipeIngestPayload): Promise<void> {
        const connectionString = this.resolveConnectionString(submission);
        const alias = (submission as any).targetDatabase || (submission as any).targetDb;

        if (!connectionString) {
            throw new Error(`[PostgresAdapter] No connection string resolved.`);
        }

        const pool = await this.getPool(connectionString, alias);
        
        // ARCHITECT LEVEL OPTIMIZATION: Payload Sanitization
        const { 
            databaseConfig, 
            routing, 
            signature,
            ...cleanData 
        } = submission as any;
        delete cleanData.targetDatabase;
        delete cleanData.targetDb;

        const query = `
            INSERT INTO public.postpipe_submissions (form_id, submission_id, data, timestamp)
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
        if (!connectionString) throw new Error("[PostgresAdapter] Cannot query: No connection string.");
        
        const pool = await this.getPool(connectionString, alias);
        
        const limit = options?.limit || 50;
        const query = `
            SELECT submission_id as "submissionId", data, timestamp, form_id as "formId"
            FROM public.postpipe_submissions
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
