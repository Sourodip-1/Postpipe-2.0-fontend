import { PostgresAdapter } from './lib/db/postgres';
import * as dotenv from 'dotenv';

dotenv.config();

async function runTest() {
    const adapter = new PostgresAdapter();
    const payload = {
        formId: 'test-form',
        submissionId: 'test-' + Date.now(),
        data: { message: 'hello' },
        timestamp: new Date().toISOString(),
        signature: 'mock-sig',
        targetDb: 'postgres-url' // Uses Technical Alias logic
    };

    console.log("--- Starting Postgres Concurrency Test ---");
    console.log("Simulating 5 concurrent requests to trigger initialization race...");

    // Run 5 requests concurrently
    const promises = Array.from({ length: 5 }).map((_, i) => {
        const p = { ...payload, submissionId: payload.submissionId + i };
        return adapter.insert(p as any)
            .then(() => console.log(`[PASS] Request ${i} completed.`))
            .catch(err => console.error(`[FAIL] Request ${i} failed:`, err.message));
    });

    await Promise.all(promises);
    console.log("--- Concurrency Test Finished ---");
}

runTest().catch(console.error);
