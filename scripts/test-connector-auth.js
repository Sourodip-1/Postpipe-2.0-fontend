
const axios = require('axios');
const crypto = require('crypto');

// --- Configuration ---
const CONNECTOR_URL = process.env.CONNECTOR_URL || 'http://localhost:3000';
const SECRET = process.env.POSTPIPE_CONNECTOR_SECRET || 'sk_live_test_123456789';
// ---------------------

async function runTests() {
    console.log(`🚀 Starting Connector Auth Tests against ${CONNECTOR_URL}`);

    // 1. Test Unauthenticated (Expect 401)
    try {
        await axios.get(`${CONNECTOR_URL}/postpipe/data?formId=test-form`);
        console.error("❌ Test 1 Failed: Should have returned 401 for missing header");
    } catch (e) {
        if (e.response && e.response.status === 401) {
            console.log("✅ Test 1 Passed: Missing header -> 401");
        } else {
            console.error(`❌ Test 1 Failed: Unexpected status ${e.response?.status}`);
        }
    }

    // 2. Test Invalid Token (Expect 403)
    try {
        await axios.get(`${CONNECTOR_URL}/postpipe/data?formId=test-form`, {
            headers: { 'Authorization': 'Bearer wrong_token' }
        });
        console.error("❌ Test 2 Failed: Should have returned 403 for invalid token");
    } catch (e) {
        if (e.response && e.response.status === 403) {
            console.log("✅ Test 2 Passed: Invalid token -> 403");
        } else {
            console.error(`❌ Test 2 Failed: Unexpected status ${e.response?.status}`);
        }
    }

    // 3. Test Valid Token (Expect 200/501 depending on DB impl, but Auth OK)
    // Note: The template returns 501 Not Implemented if getAdapter().query is missing or mock mode.
    // If we get 200 or 501, Auth Passed.
    try {
        await axios.get(`${CONNECTOR_URL}/postpipe/data?formId=test-form`, {
            headers: { 'Authorization': `Bearer ${SECRET}` }
        });
        console.log("✅ Test 3 Passed: Valid token -> Auth OK");
    } catch (e) {
        if (e.response && (e.response.status === 501 || e.response.status === 200)) {
            console.log(`✅ Test 3 Passed: Valid token -> Auth OK (Status ${e.response.status})`);
        } else {
            console.error(`❌ Test 3 Failed: Valid token rejected? ${e.response?.status} ${JSON.stringify(e.response?.data)}`);
        }
    }

    // 4. Test Malformed Header (Expect 401)
    try {
        await axios.get(`${CONNECTOR_URL}/postpipe/data?formId=test-form`, {
            headers: { 'Authorization': `Token ${SECRET}` } // Wrong prefix
        });
        console.error("❌ Test 4 Failed: Should have returned 401 for malformed header");
    } catch (e) {
        if (e.response && e.response.status === 401) {
            console.log("✅ Test 4 Passed: Malformed header -> 401");
        } else {
            console.error(`❌ Test 4 Failed: Unexpected status ${e.response?.status}`);
        }
    }

    // 5. Test Rate Limit (Optional - skip if tedious to trigger)
    console.log("ℹ️ Skipping Rate Limit Test (requires >100 requests)");

}

runTests();
