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
  query(formId: string, options?: QueryOptions): Promise<PostPipeIngestPayload[]>;
  updateSubmission(formId: string, submissionId: string, patch: Record<string, unknown>, options?: any): Promise<boolean>;
  deleteSubmission(formId: string, submissionId: string, hard: boolean, options?: any): Promise<boolean>;
  disconnect?(): Promise<void>;
  
  // Auth methods
  findUserByEmail(email: string, context?: any): Promise<any>;
  insertUser(user: any, context?: any): Promise<void>;
  updateUserLastLogin(userId: string, context?: any): Promise<void>;
  updateUserPassword(userId: string, newPasswordHash: string, context?: any): Promise<void>;
  verifyUserEmail(userId: string, context?: any): Promise<void>;
  updateUserOtp(userId: string, otp: string, expiresAt: Date, context?: any): Promise<void>;
}

export interface QueryOptions {
  limit?: number;
  page?: number;        // 1-indexed
  targetDatabase?: string;
  databaseConfig?: any;
  filter?: Record<string, any>;
  includeDeleted?: boolean;
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
