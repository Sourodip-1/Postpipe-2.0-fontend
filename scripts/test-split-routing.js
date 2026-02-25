const axios = require('axios');
const jwt = require('jsonwebtoken');

const CONNECTOR_URL = process.env.CONNECTOR_URL || 'http://localhost:3002';
const CONNECTOR_SECRET = process.env.POSTPIPE_CONNECTOR_SECRET || 'sk_live_lha45v1qunz99jpb1y71l';

/**
 * Test Split Routing (CCDRS)
 * Verifies that the connector can route data to multiple targets simultaneously.
 */
async function testSplitRouting() {
    console.log("🚀 Starting Split Routing Verification Test...");

    const payload = {
        formId: "split-test-form",
        formName: "SplitTest",
        submissionId: `sub_${Date.now()}`,
        timestamp: new Date().toISOString(),
        data: {
            email: "test@example.com",
            message: "Hello from split routing test!",
            marketing_opt_in: true,
            internal_note: "Keep this secret"
        },
        signature: "mock-signature",
        routing: {
            broadcast: ["primary"], // Save full payload to primary
            splits: [
                {
                    target: "marketing", // Save only specific fields to marketing DB
                    fields: ["email", "marketing_opt_in"]
                }
            ]
        }
    };

    // To test this, we need to ensure the connector has env vars for both:
    // 1. Primary (default)
    // 2. Marketing (DATABASE_URL_MARKETING or POSTGRES_URL_MARKETING)

    // For this test, we assume the connector is running and has access to its .env
    // We'll send the request and check if it succeeds.

    try {
        console.log("📤 Sending split-routing payload...");
        const response = await axios.post(`${CONNECTOR_URL}/postpipe/data`, payload, {
            headers: {
                'Authorization': `Bearer ${CONNECTOR_SECRET}`,
                'Content-Type': 'application/json'
            }
        });

        console.log("✅ Server Response:", response.data);
        console.log("\n💡 Check the connector terminal logs for 'Establishing new connection pool' messages.");
        console.log("If you see multiple connection attempts, the fix is working!");

    } catch (error) {
        console.error("❌ Test Failed:", error.response?.status, error.response?.data || error.message);
    }
}

testSplitRouting();
