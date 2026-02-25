import { MongoAdapter } from './lib/db/mongodb';
import * as dotenv from 'dotenv';

dotenv.config();

async function runTest() {
    const adapter = new MongoAdapter() as any;
    
    // Mock environments
    process.env['MONGODB_URI'] = 'mongodb+srv://user:pass@host.mongodb.net/postpipe?appName=test';
    process.env['MONGODB_URI_ALT'] = 'mongodb+srv://user:pass@host.mongodb.net/alt_db';
    process.env['postgres-url'] = 'postgresql://something';

    const testCases = [
        { 
            payload: { targetDb: 'mongodb-uri' }, 
            expectedDb: 'postpipe', 
            description: 'Technical alias as targetDb' 
        },
        { 
            payload: { targetDatabase: 'mongodb-uri', targetDb: 'postgres-url' }, 
            expectedDb: 'postpipe', 
            description: 'Routed target is also technical' 
        },
        { 
            payload: { targetDb: 'my_custom_mongo_db' }, 
            expectedDb: 'my_custom_mongo_db', 
            description: 'Custom target name used as DB name' 
        },
        { 
            payload: { databaseConfig: { dbName: 'explicit_db' } }, 
            expectedDb: 'explicit_db', 
            description: 'Explicit dbName in payload' 
        },
        {
            payload: { targetDb: 'ALT' },
            expectedDb: 'alt_db',
            description: 'URI priority: extract DB from resolved URI (ALT -> MONGODB_URI_ALT)'
        }
    ];

    console.log("--- Starting MongoDB Config Tests ---");
    let passed = 0;

    let output = "--- MongoDB Config Test Results ---\n";
    for (const tc of testCases) {
        const result = adapter.getTargetConfig(tc.payload);
        const success = result.dbName === tc.expectedDb;
        
        output += `CASE: ${tc.description}\n`;
        output += `  Target: ${tc.payload.targetDb || tc.payload.targetDatabase || 'default'}\n`;
        output += `  Expected DB: ${tc.expectedDb}\n`;
        output += `  Got DB:      ${result.dbName}\n`;
        output += `  Result: ${success ? 'PASSED' : 'FAILED'}\n\n`;
        
        if (success) passed++;
    }

    output += `TOTAL: ${passed}/${testCases.length} Passed\n`;
    require('fs').writeFileSync('mongo-test-results.txt', output);
    console.log(output);
    process.exit(passed === testCases.length ? 0 : 1);
}

runTest().catch(err => {
    console.error(err);
    process.exit(1);
});
