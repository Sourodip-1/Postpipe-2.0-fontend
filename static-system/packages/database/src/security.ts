import crypto from 'crypto';
import { PostPipeIngestPayload } from './types';

/**
 * Security Utilities for PostPipe Connector
 * 
 * Implements:
 * 1. HMAC-SHA256 Signature Verification
 * 2. Constant-time string comparison (to prevent timing attacks)
 * 3. Timestamp verification (to prevent replay attacks)
 */

const MAX_SKEW_SECONDS = 300; // 5 minutes allow skew

export function verifySignature(
  rawBody: string, 
  signature: string, 
  secret: string
): boolean {
  if (!rawBody || !signature || !secret) {
    return false;
  }

  // 1. Compute expected HMAC
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(rawBody)
    .digest('hex');

  // 2. Constant-time comparison
  const sigBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (sigBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(sigBuffer, expectedBuffer);
}

export function validateTimestamp(timestamp: string): boolean {
  const reqTime = new Date(timestamp).getTime();
  const now = Date.now();
  const diff = Math.abs(now - reqTime) / 1000;

  if (isNaN(reqTime)) return false;

  // Reject if skew is too large (replay attack or clock sync issue)
  return diff <= MAX_SKEW_SECONDS;
}

export function validatePayloadIds(payload: Partial<PostPipeIngestPayload>): boolean {
  if (!payload.formId || !payload.submissionId || !payload.data) {
    return false;
  }
  return true;
}
