import { MongoClient } from 'mongodb';

// --- Types ---
export interface Connector {
  id: string;      // Generated UUID
  secret: string;  // Generated "sk_..."
  url: string;     // e.g. http://localhost:3001
  name: string;
}

export interface UserConnectorsDocument {
  userId: string;
  connectors: Connector[];
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
  fields: FormField[];
  createdAt: string;
  userId?: string; // The user who owns this form
}

// --- Persistence ---
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

async function getDB() {
  const c = await getClientPromise();
  return c.db(dbName);
}

// --- Connectors ---
// --- Connectors ---
export async function registerConnector(url: string, name: string = 'My Connector', userId?: string): Promise<Connector> {
  const db = await getDB();

  if (!userId) {
    throw new Error("UserId is required to register a connector");
  }

  // Clean URL
  let cleanUrl = url.replace(/\/$/, "");

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
export async function createForm(connectorId: string, name: string, fields: FormField[], userId?: string): Promise<Form> {
  const db = await getDB();

  // Simple slugify for ID
  const baseId = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  let id = baseId;
  let counter = 1;

  while (await db.collection('forms').findOne({ id })) {
    id = `${baseId}-${counter++}`;
  }

  const newForm: Form = {
    id,
    name,
    connectorId,
    fields,
    createdAt: new Date().toISOString(),
    userId
  };

  await db.collection('forms').insertOne(newForm);
  return newForm;
}

export async function getForms(userId?: string): Promise<Form[]> {
  const db = await getDB();
  const query: any = {};
  if (userId) {
    query.userId = userId;
  }
  return db.collection<Form>('forms').find(query).toArray();
}

export async function getForm(id: string): Promise<Form | undefined> {
  const db = await getDB();
  const res = await db.collection<Form>('forms').findOne({ id });
  return res || undefined;
}

export async function updateForm(id: string, updates: Partial<Form>): Promise<void> {
  const db = await getDB();
  await db.collection('forms').updateOne({ id }, { $set: updates });
}

export async function deleteConnector(id: string): Promise<void> {
  const db = await getDB();
  // We need to pull from the array where this connector exists
  await db.collection<UserConnectorsDocument>('user_connectors').updateOne(
    { "connectors.id": id },
    { $pull: { connectors: { id } } }
  );
  await db.collection('forms').deleteMany({ connectorId: id });
}

export async function deleteForm(id: string): Promise<void> {
  const db = await getDB();
  await db.collection('forms').deleteOne({ id });
}
