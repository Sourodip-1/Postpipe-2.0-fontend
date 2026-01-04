import { PostPipeIngestPayload } from './types';
export declare function verifySignature(rawBody: string, signature: string, secret: string): boolean;
export declare function validateTimestamp(timestamp: string): boolean;
export declare function validatePayloadIds(payload: Partial<PostPipeIngestPayload>): boolean;
