"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifySignature = verifySignature;
exports.validateTimestamp = validateTimestamp;
exports.validatePayloadIds = validatePayloadIds;
const crypto_1 = __importDefault(require("crypto"));
/**
 * Security Utilities for PostPipe Connector
 *
 * Implements:
 * 1. HMAC-SHA256 Signature Verification
 * 2. Constant-time string comparison (to prevent timing attacks)
 * 3. Timestamp verification (to prevent replay attacks)
 */
const MAX_SKEW_SECONDS = 300; // 5 minutes allow skew
function verifySignature(rawBody, signature, secret) {
    if (!rawBody || !signature || !secret) {
        return false;
    }
    // 1. Compute expected HMAC
    const expectedSignature = crypto_1.default
        .createHmac('sha256', secret)
        .update(rawBody)
        .digest('hex');
    // 2. Constant-time comparison
    const sigBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expectedSignature);
    if (sigBuffer.length !== expectedBuffer.length) {
        return false;
    }
    return crypto_1.default.timingSafeEqual(sigBuffer, expectedBuffer);
}
function validateTimestamp(timestamp) {
    const reqTime = new Date(timestamp).getTime();
    const now = Date.now();
    const diff = Math.abs(now - reqTime) / 1000;
    if (isNaN(reqTime))
        return false;
    // Reject if skew is too large (replay attack or clock sync issue)
    return diff <= MAX_SKEW_SECONDS;
}
function validatePayloadIds(payload) {
    if (!payload.formId || !payload.submissionId || !payload.data) {
        return false;
    }
    return true;
}
