import { Pool } from 'pg';
import { DatabaseAdapter, PostPipeIngestPayload } from '../../types';

export class PostgresAdapter implements DatabaseAdapter {
    private pool: Pool | null = null;

    private resolveConnectionString(payload?: PostPipeIngestPayload): string | undefined {
        const { databaseConfig, targetDatabase } = (payload || {}) as any;
        console.log(`[PostgresAdapter] resolving connection... payload has context? ${!!payload}`);
        
        // 1. Explicit Payload Config (Highest Priority)
        if (databaseConfig?.uri) {
            const envVarName = databaseConfig.uri;
            const uri = process.env[envVarName];
            if (uri) {
                console.log(`[PostgresAdapter] -> Found via explicit payload config: ${envVarName}`);
                return uri;
            }
            console.warn(`[PostgresAdapter] -> Payload requested env var ${envVarName} but it's MISSING in process.env.`);
        }

        // 2. Dynamic Routing (Secondary Priority)
        if (targetDatabase) {
            // A. Check for Mapped Key (e.g. DATABASE_URL_NEON)
            const dynamicKey = `DATABASE_URL_${targetDatabase.toUpperCase()}`;
            let dynamicUri = process.env[dynamicKey];
            if (dynamicUri) {
                console.log(`[PostgresAdapter] -> Found via dynamic routing (mapped): ${dynamicKey}`);
                return dynamicUri;
            }

            // B. Check for Direct Key (e.g. POSTGRES_URL_NEON)
            dynamicUri = process.env[targetDatabase];
            if (dynamicUri) {
                console.log(`[PostgresAdapter] -> Found via direct key match: ${targetDatabase}`);
                return dynamicUri;
            }
            console.log(`[PostgresAdapter] -> Dynamic key ${dynamicKey} or direct ${targetDatabase} not found.`);
        }

        // 3. Default Environment Variables
        const prefix = process.env.POSTPIPE_VAR_PREFIX ? `${process.env.POSTPIPE_VAR_PREFIX}_` : "";
        const defaultUri = process.env[`${prefix}DATABASE_URL`] || 
                           process.env[`${prefix}POSTGRES_URL`] || 
                           process.env.DATABASE_URL || 
                           process.env.POSTGRES_URL;
                           
        if (defaultUri) {
            console.log(`[PostgresAdapter] -> Found via ${prefix ? 'prefixed ' : ''}default (DATABASE_URL/POSTGRES_URL)`);
            return defaultUri;
        }

        // 4. Fallback: Scan process.env for ANY POSTGRES_URL_* or DATABASE_URL_* (Last Resort)
        console.log(`[PostgresAdapter] -> Searching fallback keys...`);
        const allKeys = Object.keys(process.env);
        const fallbackKeys = allKeys.filter(k => 
            (k.startsWith('POSTGRES_URL_') || k.startsWith('DATABASE_URL_')) && process.env[k]
        );
        
        if (fallbackKeys.length > 0) {
            const fallbackKey = fallbackKeys[0];
            console.log(`[PostgresAdapter] -> Fallback match: ${fallbackKey}`);
            return process.env[fallbackKey];
        }

        console.error(`[PostgresAdapter] ERROR: Could not resolve connection string. Available relevant keys:`, 
            allKeys.filter(k => k.includes('POSTGRES') || k.includes('DATABASE'))
        );
        return undefined;
    }

    async connect(payload?: PostPipeIngestPayload) {
        if (this.pool) return;

        const connectionString = this.resolveConnectionString(payload);
        
        if (!connectionString) {
            throw new Error("[PostgresAdapter] Connection failed: Missing DATABASE_URL, POSTGRES_URL, or a valid dynamic config override in request payload.");
        }

        this.pool = new Pool({
            connectionString,
            ssl: (connectionString.includes('supabase') || 
                  connectionString.includes('render') || 
                  connectionString.includes('aiven') ||
                  connectionString.includes('neon.tech'))
                ? { rejectUnauthorized: false } 
                : false
        });

        // Test connection
        await this.pool.query('SELECT NOW()');
        console.log(`[PostgresAdapter] Connected successfully to host: ${connectionString.split('@').pop()?.split('/')[0] || 'localhost'}`);
        
        // Ensure table exists
        await this.ensureTable();
    }

    private async ensureTable() {
        if (!this.pool) return;
        
        const query = `
            CREATE TABLE IF NOT EXISTS postpipe_submissions (
                id SERIAL PRIMARY KEY,
                form_id TEXT NOT NULL,
                submission_id TEXT UNIQUE NOT NULL,
                data JSONB NOT NULL,
                timestamp TIMESTAMPTZ NOT NULL,
                created_at TIMESTAMPTZ DEFAULT NOW()
            );
            CREATE INDEX IF NOT EXISTS idx_form_id ON postpipe_submissions(form_id);
        `;
        await this.pool.query(query);
    }

    async insert(submission: PostPipeIngestPayload): Promise<void> {
        // 1. Resolve Connection String for this specific payload
        const connectionString = this.resolveConnectionString(submission);

        if (!connectionString) {
            throw new Error(`[PostgresAdapter] No connection string resolved for target: ${(submission as any).targetDatabase || 'default'}`);
        }

        // 2. Ensure Pool exists (simple logic: reuse if exists, otherwise create)
        // Note: In a production scenario with many different DBs, we'd use a Map of pools.
        if (!this.pool) {
            await this.connect(submission);
        }
        
        const query = `
            INSERT INTO postpipe_submissions (form_id, submission_id, data, timestamp)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (submission_id) DO NOTHING;
        `;
        
        await this.pool!.query(query, [
            submission.formId,
            submission.submissionId,
            JSON.stringify(submission.data),
            submission.timestamp
        ]);
        
        console.log(`[PostgresAdapter] Data saved successfully to PostgreSQL.`);
    }

    async query(formId: string, options?: any): Promise<PostPipeIngestPayload[]> {
        if (!this.pool) await this.connect(options);
        
        const limit = options?.limit || 50;
        const query = `
            SELECT submission_id as "submissionId", data, timestamp, form_id as "formId"
            FROM postpipe_submissions
            WHERE form_id = $1
            ORDER BY timestamp DESC
            LIMIT $2;
        `;
        
        const res = await this.pool!.query(query, [formId, limit]);
        
        return res.rows.map(row => ({
            ...row,
            signature: '' // Signature not stored/needed for display
        }));
    }

    async disconnect() {
        if (this.pool) {
            await this.pool.end();
            this.pool = null;
        }
    }
}

