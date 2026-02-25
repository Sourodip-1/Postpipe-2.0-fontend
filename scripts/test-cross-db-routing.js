const axios = require('axios');
const crypto = require('crypto');

const CONNECTOR_URL = process.env.CONNECTOR_URL || 'http://localhost:3002';
const CONNECTOR_SECRET = process.env.POSTPIPE_CONNECTOR_SECRET || 'sk_live_lha45v1qunz99jpb1y71l';

/**
 * Test Cross-Database Split Routing (CCDRS)
 * Verifies that data can be split from a Postgres primary to a Mongo secondary.
 */
async function testCrossDbRouting() {
    console.log("🚀 Starting Cross-Database Split Routing Verification...");

    const payload = {
        formId: "cross-db-test",
        formName: "CrossDbTest",
        submissionId: `sub_cross_${Date.now()}`,
        timestamp: new Date().toISOString(),
        data: {
            email: "crossdb@example.com",
            message: "Testing Postgres to Mongo split!",
            mongo_exclusive_data: "This should land in MongoDB"
        },
        signature: "mock-signature", // internal payload signature (not checked by ingest itself)
        routing: {
            broadcast: ["primary-pg"], // Default to postgres
            splits: [
                {
                    target: "secondary-mongo", // Should trigger Mongo adapter via smart routing
                    fields: ["mongo_exclusive_data"]
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
        console.log("📤 Sending cross-db payload...");
        const response = await axios.post(`${CONNECTOR_URL}/postpipe/ingest`, payload, {
            headers: {
                'x-postpipe-signature': signature,
                'Content-Type': 'application/json'
            }
        });

        console.log("✅ Server Response:", response.data);
        console.log("\n💡 Check the connector terminal for:");
        console.log("1. 'Smart Routing: Target 'primary-pg' suggests Postgres.'");
        console.log("2. 'Smart Routing: Target 'secondary-mongo' suggests MongoDB.'");

    } catch (error) {
        console.error("❌ Test Failed:", error.response?.status, error.response?.data || error.message);
    }
}

testCrossDbRouting();
