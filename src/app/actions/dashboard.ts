'use server';

import crypto from 'crypto';
import {
  getForms,
  getForm,
  getConnector,
  getConnectors,
  deleteForm,
  deleteConnector,
  duplicateForm,
  updateForm,
  getSystems,
  createSystem,
  System
} from '../../lib/server-db';
import { ensureFullUrl } from '../../lib/utils';

import { getSession } from '../../lib/auth/actions';

export async function getDashboardData() {
  const session = await getSession();
  if (!session || !session.userId) {
    // Return empty data if not authenticated
    return { forms: [], connectors: [], systems: [] };
  }

  // Fetch all data in parallel
  const [forms, connectors, systems] = await Promise.all([
    getForms(session.userId),
    getConnectors(session.userId),
    getSystems(session.userId)
  ]);

  // Create a map for fast O(1) connector lookup
  const connectorMap = new Map(connectors.map(c => [c.id, c]));

  // Enhance forms with data from the pre-fetched connectors
  const formsWithSecrets = forms.map(f => {
    const connector = connectorMap.get(f.connectorId);
    if (!connector) return null;

    // Generate Read Token
    const payload = {
      formId: f.id,
      exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24 * 365) // 1 year
    };

    const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');

    const signature = crypto
      .createHmac('sha256', connector.secret)
      .update(payloadB64)
      .digest('hex');

    const token = `pp_read_${payloadB64}.${signature}`;

    return {
      ...f,
      connectorUrl: ensureFullUrl(connector.url),
      readToken: token,
      publicSubmitUrl: `http://localhost:3000/api/public/submit/${f.id}`,
      connectorGetterUrl: `${ensureFullUrl(connector.url)}/api/postpipe/forms/${f.id}/submissions`
    };
  });

  const validForms = formsWithSecrets.filter(Boolean);

  // Serialize forms
  const serializedForms = validForms.map((f: any) => ({
    ...f,
    _id: f._id?.toString(),
    id: f.id?.toString(),
    connectorId: f.connectorId?.toString(),
  }));

  // Serialize connectors
  const serializedConnectors = connectors.map((c: any) => ({
    ...c,
    _id: c._id?.toString(),
    id: c.id?.toString(),
  }));

  const serializedSystems = systems.map((s: any) => ({
    ...s,
    _id: s._id?.toString(),
    id: s.id?.toString(),
  }));

  return { forms: serializedForms, connectors: serializedConnectors, systems: serializedSystems };
}

export async function duplicateFormAction(id: string) {
  const session = await getSession();
  if (!session || !session.userId) throw new Error("Unauthorized");

  await duplicateForm(id, session.userId);
  return { success: true };
}

export async function toggleFormStatusAction(id: string) {
  const session = await getSession();
  if (!session || !session.userId) throw new Error("Unauthorized");

  const form = await getForm(id);
  if (!form) return { success: false, error: "Form not found" };
  if (form.userId !== session.userId) throw new Error("Unauthorized");

  const newStatus = form.status === 'Live' ? 'Paused' : 'Live';
  await updateForm(id, { status: newStatus });

  return { success: true, status: newStatus };
}

export async function createSystemAction(name: string, type: string, templateId?: string) {
  const session = await getSession();
  if (!session || !session.userId) throw new Error("Unauthorized");

  const system = await createSystem(name, type, templateId, session.userId);
  return { success: true, systemId: system.id };
}

export async function deleteFormAction(id: string) {
  const session = await getSession();
  if (!session || !session.userId) {
    throw new Error("Unauthorized");
  }

  const form = await getForm(id);
  if (!form) return { success: false, error: "Form not found" };

  if (form.userId !== session.userId) {
    throw new Error("Unauthorized");
  }

  await deleteForm(id);
  return { success: true };
}

export async function deleteConnectorAction(id: string) {
  const session = await getSession();
  if (!session || !session.userId) {
    throw new Error("Unauthorized");
  }

  const connector = await getConnector(id);
  if (!connector) return { success: false, error: "Connector not found" };



  // We pass session.userId to ensure we only delete if it belongs to the user
  await deleteConnector(id, session.userId);
  return { success: true };
}

export async function getConnectorsAction() {
  const session = await getSession();
  if (!session || !session.userId) {
    throw new Error("Unauthorized");
  }

  const connectors = await getConnectors(session.userId);
  return connectors.map((c: any) => ({
    ...c,
    _id: c._id?.toString(),
    id: c.id?.toString(),
  }));
}
