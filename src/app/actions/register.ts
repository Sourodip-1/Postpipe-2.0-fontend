'use server';

import { registerConnector, updateConnectorUrl } from '../../lib/server-db';
import { getSession } from '../../lib/auth/actions';

export async function registerConnectorAction(formData: FormData) {
  const url = formData.get('url') as string; // Optional now
  const name = formData.get('name') as string;

  try {
    const session = await getSession();
    if (!session || !session.userId) {
      return { error: 'Unauthorized' };
    }

    const connector = await registerConnector(url || null, name, session.userId);
    return {
      success: true,
      connectorId: connector.id,
      connectorSecret: connector.secret
    };
  } catch (e) {
    return { error: 'Failed to register connector' };
  }
}

export async function finalizeConnectorAction(id: string, url: string) {
  if (!id || !url) {
    return { error: 'Connector ID and URL are required' };
  }

  try {
    const session = await getSession();
    if (!session || !session.userId) {
      return { error: 'Unauthorized' };
    }

    await updateConnectorUrl(id, url, session.userId);
    return { success: true };
  } catch (e) {
    return { error: 'Failed to verify connector' };
  }
}
