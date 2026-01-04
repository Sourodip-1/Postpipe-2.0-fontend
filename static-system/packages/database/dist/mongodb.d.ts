import { DatabaseAdapter, PostPipeIngestPayload } from './types';
export declare class MongoAdapter implements DatabaseAdapter {
    private config;
    private defaultUri;
    private defaultDbName;
    private collectionName;
    constructor();
    private loadConfig;
    private resolveValue;
    private getTargetConfig;
    private getClient;
    connect(): Promise<void>;
    insert(submission: PostPipeIngestPayload): Promise<void>;
    query(formId: string, limit?: number): Promise<PostPipeIngestPayload[]>;
    disconnect(): Promise<void>;
}
