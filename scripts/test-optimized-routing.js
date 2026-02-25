const axios = require('axios');
const crypto = require('crypto');

const CONNECTOR_URL = process.env.CONNECTOR_URL || 'http://localhost:3002';
const CONNECTOR_SECRET = process.env.POSTPIPE_CONNECTOR_SECRET || 'sk_live_lha45v1qunz99jpb1y71l';

/**
 * 🏛️ Professional Architect Test: Optimized Routing & Payloads
 * Verifies:
 * 1. Data lands in databases named exactly as the aliases (e.g. 'main-db').
 * 2. Payloads are sanitized (no 'routing', 'databaseConfig', 'targetDb').
 * 3. Cross-database (Mongo -> Postgres) split routing works smoothly.
 */
async function testOptimizedRouting() {
    console.log("🚀 Starting Optimized Routing & Payload Verification...");

    const payload = {
        formId: "opt-test-arch",
        formName: "ArchitectTest",
        submissionId: `sub_arch_${Date.now()}`,
        timestamp: new Date().toISOString(),
        data: {
            user_email: "architect@google.com",
            project_name: "PostPipe 2.1 Optimization",
            secret_api_key: "api_key_hidden_12345678",
            is_urgent: true
        },
        signature: "payload-signature-string",
        routing: {
            transformations: {
                mask: ["secret_api_key"]
            },
            broadcast: ["main-db"], // Should go to Mongo (if main-db alias points there)
            splits: [
                {
                    target: "second-db", // Should go to Postgres
                    fields: ["project_name", "is_urgent"],
                    excludeFromMain: false
                }
            ]
        }
    };

    const rawBody = JSON.stringify(payload);
    const signature = crypto
        .createHmac('sha256', CONNECTOR_SECRET)
        .update(rawBody)
        .digest('hex');

    try {
        console.log("📤 Sending optimized payload to Multi-Target...");
        const response = await axios.post(`${CONNECTOR_URL}/postpipe/ingest`, payload, {
            headers: {
                'x-postpipe-signature': signature,
                'Content-Type': 'application/json'
            }
        });

        console.log("✅ Server Response:", response.data);
        console.log("\n🕵️ Verification Checklist for User:");
        console.log("1. Check MongoDB: Is there a database named 'main-db'? (NO 'postpipe_' prefix)");
        console.log("2. Check MongoDB Document: Is 'routing' and 'databaseConfig' GONE?");
        console.log("3. Check Postgres: Is there a database named 'second-db'?");
        console.log("4. Check Postgres Row: Is it clean of internal metadata?");

    } catch (error) {
        console.error("❌ Test Failed:", error.response?.status, error.response?.data || error.message);
    }
}

testOptimizedRouting();
