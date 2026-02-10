export interface RoutingConfig {
  broadcast: string[]; // List of databases to receive the full payload
  splits: {
    target: string;
    fields: string[];
    excludeFromMain?: boolean;
  }[]; // Mappings for partial data routing
  transformations?: {
    mask: string[]; // Fields to mask (****-1234)
    hash: string[]; // Fields to hash (SHA-256)
  };
}

export interface PostPipeIngestPayload {
  formId: string;
  formName?: string;
  targetDb?: string; // e.g. "secondary", "marketing"
  submissionId: string;
  timestamp: string; // ISO-8601
  data: Record<string, unknown>;
  signature: string;
  routing?: RoutingConfig;
  databaseConfig?: any; // For dynamic configuration passed from frontend
}

export interface ConnectorResponse {
  status: "ok" | "error";
  stored: boolean;
  message?: string;
}

export interface DatabaseAdapter {
  connect(context?: any): Promise<void>;
  insert(submission: PostPipeIngestPayload): Promise<void>;
  query(formId: string, options?: any): Promise<PostPipeIngestPayload[]>;
  disconnect?(): Promise<void>;
}

export interface ConnectorConfig {
  connectorId: string;
  connectorSecret: string;
  port: number;
}

// Extend Express Request to include rawBody
declare global {
  namespace Express {
    interface Request {
      rawBody?: Buffer;
    }
  }
}
