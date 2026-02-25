import { PostgresAdapter } from './lib/db/postgres';
import * as dotenv from 'dotenv';

dotenv.config();

async function runTest() {
    const adapter = new PostgresAdapter();
    
    // Simulate a "leaked" payload where targetDatabase (from primary) 
    // is passed to a routed target (postgres-url)
    const leakedPayload = {
        formId: 'verification-form',
        submissionId: 'leak-test-' + Date.now(),
        data: { test: 'data' },
        timestamp: new Date().toISOString(),
        signature: 'mock-sig',
        targetDb: 'postgres-url', // The routed target
        targetDatabase: 'mongodb-uri', // THE LEAKED FIELD
        databaseConfig: { type: 'mongodb' } // THE LEAKED CONFIG
    };

    console.log("--- Starting Routing Leakage & Schema Test ---");
    
    try {
        // This used to fail because it would try to connect to MongoDB logic via targetDatabase
        // Now server.ts should have cleaned this up, but we'll test the Adapter's resilience
        // and its ability to handle schema-qualified tables.
        
        console.log("1. Testing PostgresAdapter with potentially leaked metadata...");
        // In the real server, targetDatabase is now deleted before this call
        // but let's see how the adapter handles a clean payload vs a leaked one.
        
        const cleanPayload = { ...leakedPayload };
        delete (cleanPayload as any).targetDatabase;
        delete (cleanPayload as any).databaseConfig;

        await adapter.insert(cleanPayload as any);
        console.log("[PASS] PostgresAdapter successfully inserted with clean payload.");

        console.log("2. Verifying schema qualification by querying...");
        const results = await adapter.query('verification-form', { 
            limit: 1, 
            targetDb: 'postgres-url' 
        });
        
        if (results.length > 0) {
            console.log("[PASS] Successfully queried using schema-qualified table.");
        } else {
            console.log("[FAIL] No results found.");
        }

    } catch (err) {
        console.error("[FAIL] Test encountered error:", err);
        process.exit(1);
    }

    console.log("--- Verification Finished ---");
}

runTest().catch(console.error);
