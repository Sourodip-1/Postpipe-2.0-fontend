import { MongoClient } from 'mongodb';

// --- Types ---
export interface Connector {
  id: string;      // Generated UUID
  secret: string;  // Generated "sk_..."
  url: string;     // e.g. http://localhost:3001
  name: string;
  databaseRoutes?: {
    dbName: string;
    connectorId: string;
    connectorName: string;
    [key: string]: any;
  }[];
  databases?: Record<string, {
    uri: string;
    dbName: string;
  }>;
}

export interface UserConnectorsDocument {
  userId: string;
  connectors: Connector[];
  databaseConfig?: any; // Stores the configuration from the "Defined Databases" page
}


export interface UserFormsDocument {
  userId: string;
  forms: Form[];
}

export interface FormField {
  name: string;
  type: string;    // text, email, number, etc.
  required: boolean;
}

export interface Form {
  id: string; // Slug/ID e.g. "contact-us"
  name: string;
  connectorId: string;
  targetDatabase?: string; // e.g. "main", "backup"
  fields: FormField[];
  createdAt: string;
  userId?: string; // The user who owns this form
  status: 'Live' | 'Paused';
  submissions?: Submission[];
  submissionCount?: number;
}

export interface Submission {
  id: string;
  submittedAt: string;
  data: any;
}

export interface System {
  id: string;
  name: string;
  type: string; // e.g. "Auth", "E-commerce"
  templateId?: string;
  createdAt: string;
}

export interface UserSystemsDocument {
  userId: string;
  systems: System[];
}

// --- Persistence ---
// NOTE: We check this lazily or let it fail at runtime in functions to allow build-time execution without env vars.

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB_NAME || 'postpipe_core';
const options = {};

let client;
let clientPromise: Promise<MongoClient>;

function getClientPromise(): Promise<MongoClient> {
  if (clientPromise) return clientPromise;

  if (!uri) {
    throw new Error('Invalid/Missing environment variable: "MONGODB_URI"');
  }

  if (process.env.NODE_ENV === 'development') {
    // In development mode, use a global variable so that the value
    // is preserved across module reloads caused by HMR.
    // @ts-ignore
    if (!global._mongoClientPromise) {
      client = new MongoClient(uri, options);
      // @ts-ignore
      global._mongoClientPromise = client.connect();
    }
    // @ts-ignore
    clientPromise = global._mongoClientPromise;
  } else {
    // In production mode, it's best to not use a global variable.
    client = new MongoClient(uri, options);
    clientPromise = client.connect();
  }
  return clientPromise;
}

export async function getDB() {
  const c = await getClientPromise();
  return c.db(dbName);
}

// --- Connectors ---
export async function registerConnector(url: string | null, name: string = 'My Connector', userId?: string): Promise<Connector> {
  const db = await getDB();

  if (!userId) {
    throw new Error("UserId is required to register a connector");
  }

  // Clean URL if provided, otherwise PENDING
  let cleanUrl = url ? url.replace(/\/$/, "") : "PENDING";

  // Check if user already has this connector
  const existingDoc = await db.collection<UserConnectorsDocument>('user_connectors').findOne({
    userId,
    "connectors.url": cleanUrl
  });

  if (existingDoc) {
    // Find the specific connector
    const existingConnector = existingDoc.connectors.find(c => c.url === cleanUrl);
    if (existingConnector) return existingConnector;
  }

  const newConnector: Connector = {
    id: `conn_${Math.random().toString(36).substr(2, 9)}`,
    secret: `sk_live_${Math.random().toString(36).substr(2, 16)}${Math.random().toString(36).substr(2, 16)}`,
    url: cleanUrl,
    name
  };

  await db.collection<UserConnectorsDocument>('user_connectors').updateOne(
    { userId },
    { $push: { connectors: newConnector } },
    { upsert: true }
  );

  return newConnector;
}

export async function updateConnectorUrl(id: string, url: string, userId: string): Promise<void> {
  const db = await getDB();
  const cleanUrl = url.replace(/\/$/, "");

  // Verify ownership
  const doc = await db.collection<UserConnectorsDocument>('user_connectors').findOne({
    userId,
    "connectors.id": id
  });

  if (!doc) {
    throw new Error("Connector not found or unauthorized");
  }

  await db.collection<UserConnectorsDocument>('user_connectors').updateOne(
    { userId, "connectors.id": id },
    { $set: { "connectors.$.url": cleanUrl } }
  );
}

export async function getConnector(id: string): Promise<Connector | undefined> {
  const db = await getDB();
  const res = await db.collection<UserConnectorsDocument>('user_connectors').findOne(
    { "connectors.id": id },
    { projection: { "connectors.$": 1 } }
  );

  if (res && res.connectors && res.connectors.length > 0) {
    return res.connectors[0];
  }
  return undefined;
}

export async function getConnectors(userId?: string): Promise<Connector[]> {
  const db = await getDB();
  if (!userId) return [];

  const res = await db.collection<UserConnectorsDocument>('user_connectors').findOne({ userId });
  return res?.connectors || [];
}


// --- Forms ---
export async function createForm(connectorId: string, name: string, fields: FormField[], userId?: string, targetDatabase?: string): Promise<Form> {
  const db = await getDB();

  if (!userId) {
    throw new Error("UserId is required to create a form");
  }

  // Simple slugify for ID
  const baseId = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  let id = baseId;
  let counter = 1;

  while (await db.collection('user_forms').findOne({ "forms.id": id })) {
    id = `${baseId}-${counter++}`;
  }

  const newForm: Form = {
    id,
    name,
    connectorId,
    targetDatabase,
    fields,
    createdAt: new Date().toISOString(),
    status: 'Live',
    userId
  };

  await db.collection<UserFormsDocument>('user_forms').updateOne(
    { userId },
    { $push: { forms: newForm } },
    { upsert: true }
  );

  return newForm;
}

export async function duplicateForm(originalFormId: string, userId: string): Promise<Form> {
  const db = await getDB();
  const originalForm = await getForm(originalFormId);
  if (!originalForm) throw new Error("Form not found");
  if (originalForm.userId !== userId) throw new Error("Unauthorized");

  const newName = `${originalForm.name} (Copy)`;
  const newForm = await createForm(originalForm.connectorId, newName, originalForm.fields, userId, originalForm.targetDatabase);
  return newForm;
}

export async function getForms(userId?: string): Promise<Form[]> {
  const db = await getDB();
  if (!userId) return [];

  const res = await db.collection<UserFormsDocument>('user_forms').findOne({ userId });
  return res?.forms || [];
}

export async function getForm(id: string): Promise<Form | undefined> {
  const db = await getDB();
  const res = await db.collection<UserFormsDocument>('user_forms').findOne(
    { "forms.id": id },
    { projection: { "forms.$": 1 } }
  );

  if (res && res.forms && res.forms.length > 0) {
    // We need to return the specific form, not the first one if multiple matches (though ID should be unique)
    // projection "forms.$" returns only the FIRST matching element from the array
    return res.forms[0];
  }
  return undefined;
}

export async function updateForm(id: string, updates: Partial<Form>): Promise<void> {
  const db = await getDB();

  const updateFields: any = {};
  for (const [key, value] of Object.entries(updates)) {
    if (key !== 'id') {
      updateFields[`forms.$.${key}`] = value;
    }
  }

  if (Object.keys(updateFields).length === 0) return;

  await db.collection('user_forms').updateOne(
    { "forms.id": id },
    { $set: updateFields }
  );
}

export async function addSubmission(formId: string, submission: Submission): Promise<void> {
  const db = await getDB();
  await db.collection('user_forms').updateOne(
    { "forms.id": formId },
    { $push: { "forms.$.submissions": submission } as any }
  );
}

export async function incrementSubmissionCount(formId: string): Promise<void> {
  const db = await getDB();
  await db.collection('user_forms').updateOne(
    { "forms.id": formId },
    { $inc: { "forms.$.submissionCount": 1 } }
  );
}

export async function deleteConnector(id: string, userId?: string): Promise<void> {
  const db = await getDB();

  const filter: any = { "connectors.id": id };
  if (userId) {
    filter.userId = userId;
  }

  // We need to pull from the array where this connector exists
  const res = await db.collection<UserConnectorsDocument>('user_connectors').updateOne(
    filter,
    { $pull: { connectors: { id } } as any }
  );

  // Only delete forms if we actually deleted the connector (or if we blindly trust, but safer this way)
  // If userId was provided, we implicitly know we are targeting that user's forms too.
  if (res.modifiedCount > 0) {
    const formFilter: any = { "forms.connectorId": id };
    if (userId) formFilter.userId = userId;

    await db.collection('user_forms').updateMany(
      formFilter,
      { $pull: { forms: { connectorId: id } } as any }
    );
  }
}

export async function deleteForm(id: string): Promise<void> {
  const db = await getDB();
  await db.collection('user_forms').updateOne(
    { "forms.id": id },
    { $pull: { forms: { id } } as any }
  );
}

// --- Systems (User Backend Systems) ---
export async function createSystem(name: string, type: string, templateId?: string, userId?: string): Promise<System> {
  const db = await getDB();
  if (!userId) throw new Error("UserId required");

  // Check for duplicates
  // We check if the user already has a system with this templateId
  if (templateId) {
    const existingDoc = await db.collection<UserSystemsDocument>('user_systems').findOne({
      userId,
      "systems.templateId": templateId
    });

    if (existingDoc && existingDoc.systems) {
      const existingSystem = existingDoc.systems.find(s => s.templateId === templateId);
      if (existingSystem) return existingSystem; // Return existing instead of creating new
    }
  }

  const newSystem: System = {
    id: `sys_${Math.random().toString(36).substr(2, 9)}`,
    name,
    type,
    templateId,
    createdAt: new Date().toISOString()
  };

  await db.collection<UserSystemsDocument>('user_systems').updateOne(
    { userId },
    { $push: { systems: newSystem } },
    { upsert: true }
  );

  return newSystem;
}

export async function getSystems(userId?: string): Promise<System[]> {
  const db = await getDB();
  if (!userId) return [];

  const res = await db.collection<UserSystemsDocument>('user_systems').findOne({ userId });
  return res?.systems || [];
}

// --- Usage Stats ---
export async function getUserUsageStats(userId: string) {
  const db = await getDB();

  // 1. Get Forms & Submissions
  const formsDoc = await db.collection<UserFormsDocument>('user_forms').findOne({ userId });
  const forms = formsDoc?.forms || [];

  let totalSubmissions = 0;
  forms.forEach(f => {
    if (f.submissions) {
      totalSubmissions += f.submissions.length;
    }
  });

  // 2. Get Connectors count
  const connectorsDoc = await db.collection<UserConnectorsDocument>('user_connectors').findOne({ userId });
  const activeConnectors = connectorsDoc?.connectors?.length || 0;

  // 3. Estimate Storage (Mock calculation: ~2KB per submission + overhead)
  const storageBytes = (totalSubmissions * 2048) + (forms.length * 5120) + 51200;

  // 4. Mock Error Rate & Latency (deterministic-ish or random)
  // Using random for demo "variance" as requested
  const errorRate = (Math.random() * 0.3).toFixed(2); // 0.00% - 0.30%
  const avgLatency = Math.floor(Math.random() * (80 - 30) + 30); // 30ms - 80ms

  return {
    totalRequests: totalSubmissions,
    errorRate: parseFloat(errorRate),
    avgLatency,
    storageBytes,
    activeConnectors
  };
}

// --- Database Configuration (User Level) ---
export async function getUserDatabaseConfig(userId: string): Promise<any | null> {
  const db = await getDB();
  const res = await db.collection<UserConnectorsDocument>('user_connectors').findOne(
    { userId },
    { projection: { databaseConfig: 1 } }
  );
  return res?.databaseConfig || null;
}

export async function saveUserDatabaseConfig(userId: string, config: any): Promise<void> {
  const db = await getDB();
  await db.collection<UserConnectorsDocument>('user_connectors').updateOne(
    { userId },
    { $set: { databaseConfig: config } },
    { upsert: true }
  );
}

export async function getUserConfigByConnectorId(connectorId: string): Promise<any | null> {
  const db = await getDB();
  const res = await db.collection<UserConnectorsDocument>('user_connectors').findOne(
    { "connectors.id": connectorId },
    { projection: { databaseConfig: 1 } }
  );
  return res?.databaseConfig || null;
}
