import { DatabaseAdapter, PostPipeIngestPayload } from '../../types';
import { MongoAdapter } from './mongodb';
import { PostgresAdapter } from './postgres';

const adapterCache: Record<string, DatabaseAdapter> = {};

export function getAdapter(forcedType?: string): DatabaseAdapter {
  let type = (forcedType || process.env.DB_TYPE || "").toLowerCase();

  // Smart fallback if type is empty
  if (!type) {
    if (process.env.POSTGRES_URL || process.env.DATABASE_URL) {
      type = 'postgres';
    } else if (process.env.MONGODB_URI) {
      type = 'mongodb';
    }
  }

  if (adapterCache[type]) {
    return adapterCache[type];
  }

  let adapter: DatabaseAdapter;
  switch (type) {
    case 'mongodb':
      adapter = new MongoAdapter();
      break;
    case 'postgres':
    case 'postgresql':
      adapter = new PostgresAdapter();
      break;
    default:
      console.warn(`[Config] No valid DB_TYPE set (got '${type}'). Defaulting to Memory (Dry Run).`);
      adapter = new MemoryAdapter();
      break;
  }

  adapterCache[type] = adapter;
  return adapter;
}

class MemoryAdapter implements DatabaseAdapter {
  private store: PostPipeIngestPayload[] = [];

  async connect(context?: any) {
    console.log("[MemoryAdapter] Connected (Data will be lost on restart)");
  }
  async insert(submission: PostPipeIngestPayload): Promise<void> {
    console.log('[MemoryAdapter] Inserted:', submission);
    this.store.push(submission);
  }
  async query(formId: string, options?: any): Promise<PostPipeIngestPayload[]> {
    const limit = options?.limit || 50;
    const page = Math.max(1, options?.page || 1);
    const skip = (page - 1) * limit;

    const results = this.store
      .filter(s => {
        const matchesForm = (s as any).formId === formId;
        const isDeleted = (s as any).is_deleted === true;
        const shouldShow = options?.includeDeleted ? true : !isDeleted;
        return matchesForm && shouldShow;
      })
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return results.slice(skip, skip + limit);
  }

  async updateSubmission(formId: string, submissionId: string, patch: Record<string, unknown>): Promise<boolean> {
    const index = this.store.findIndex(s => s.submissionId === submissionId && s.formId === formId);
    if (index === -1) return false;

    this.store[index] = {
      ...this.store[index],
      data: { ...this.store[index].data, ...patch },
      updated_at: new Date().toISOString()
    } as any;
    return true;
  }

  async deleteSubmission(formId: string, submissionId: string, hard: boolean): Promise<boolean> {
    const index = this.store.findIndex(s => s.submissionId === submissionId && s.formId === formId);
    if (index === -1) return false;

    if (hard) {
      this.store.splice(index, 1);
    } else {
      (this.store[index] as any).is_deleted = true;
      (this.store[index] as any).deleted_at = new Date().toISOString();
    }
    return true;
  }


  // Auth methods
  private users: any[] = [];
  async findUserByEmail(email: string) {
    return this.users.find(u => u.email === email) || null;
  }
  async insertUser(user: any) {
    this.users.push(user);
    console.log('[MemoryAdapter] Inserted User:', user.email);
  }
  async updateUserLastLogin(userId: string) {
    const user = this.users.find(u => u.id === userId);
    if (user) {
      user.last_login = new Date().toISOString();
    }
  }
  async updateUserPassword(userId: string, newPasswordHash: string) {
    const user = this.users.find(u => u.id === userId);
    if (user) {
      user.password_hash = newPasswordHash;
    }
  }
  async verifyUserEmail(userId: string) {
    const user = this.users.find(u => u.id === userId);
    if (user) {
      user.email_verified = true;
      user.otp_code = null;
      user.otp_expires_at = null;
    }
  }

  async updateUserOtp(userId: string, otp: string, expiresAt: Date) {
    const user = this.users.find(u => u.id === userId);
    if (user) {
      user.otp_code = otp;
      user.otp_expires_at = expiresAt;
    }
  }
}
