export interface PostPipeIngestPayload {
    formId: string;
    formName?: string;
    targetDb?: string;
    submissionId: string;
    timestamp: string;
    data: Record<string, unknown>;
    signature: string;
}
export interface ConnectorResponse {
    status: "ok" | "error";
    stored: boolean;
    message?: string;
}
export interface DatabaseAdapter {
    connect(): Promise<void>;
    insert(submission: PostPipeIngestPayload): Promise<void>;
    query(formId: string, limit?: number): Promise<PostPipeIngestPayload[]>;
    disconnect?(): Promise<void>;
}
export interface ConnectorConfig {
    connectorId: string;
    connectorSecret: string;
    port: number;
}
