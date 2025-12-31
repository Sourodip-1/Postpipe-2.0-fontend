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

import { getSession } from '../../lib/auth/actions';

export async function getDashboardData() {
  const session = await getSession();
  if (!session || !session.userId) {
    // Return empty data if not authenticated, or redirect (better handled by middleware/page)
    return { forms: [], connectors: [], systems: [] };
  }

  const forms = await getForms(session.userId);

  // Enhance forms with proper tokens/urls
  const formsWithSecrets = await Promise.all(forms.map(async f => {
    const connector = await getConnector(f.connectorId);
    if (!connector) return null;

    // Generate Read Token (Same logic as before, but dynamic secret)
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
      connectorUrl: connector.url,
      readToken: token,
      // The public ingest endpoint the user can use for testing
      publicSubmitUrl: `http://localhost:3000/api/public/submit/${f.id}`,
      // The direct connector getter endpoint
      connectorGetterUrl: `${connector.url}/api/postpipe/forms/${f.id}/submissions`
    };
  }));

  const validForms = formsWithSecrets.filter(Boolean);

  // Serialize forms
  const serializedForms = validForms.map((f: any) => ({
    ...f,
    _id: f._id?.toString(),
    id: f.id?.toString(),
    connectorId: f.connectorId?.toString(),
  }));

  const connectors = await getConnectors(session.userId); // Fetch connectors directly from DB util
  // Serialize connectors
  const serializedConnectors = connectors.map((c: any) => ({
    ...c,
    _id: c._id?.toString(),
    id: c.id?.toString(),
  }));

  const systems = await getSystems(session.userId);
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
