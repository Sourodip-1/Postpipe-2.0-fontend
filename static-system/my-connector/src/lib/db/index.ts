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
    const results = this.store
      .filter(s => (s as any).formId === formId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    const limit = options?.limit || 50;
    return results.slice(0, limit);
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
