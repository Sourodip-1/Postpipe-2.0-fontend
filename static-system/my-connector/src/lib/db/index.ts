import { DatabaseAdapter, PostPipeIngestPayload } from '../../types';
import { MongoAdapter } from './mongodb';
import { PostgresAdapter } from './postgres';

const adapterCache: Record<string, DatabaseAdapter> = {};

export function getAdapter(forcedType?: string): DatabaseAdapter {
  const type = (forcedType || process.env.DB_TYPE || "").toLowerCase();

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
}
