'use server';

import { registerConnector } from '../../lib/server-db';
import { getSession } from '../../lib/auth/actions';

export async function registerConnectorAction(formData: FormData) {
  const url = formData.get('url') as string;
  const name = formData.get('name') as string;

  if (!url) {
    return { error: 'URL is required' };
  }

  try {
    const session = await getSession();
    if (!session || !session.userId) {
      return { error: 'Unauthorized' };
    }

    const connector = await registerConnector(url, name, session.userId);
    return {
      success: true,
      connectorId: connector.id,
      connectorSecret: connector.secret
    };
  } catch (e) {
    return { error: 'Failed to register connector' };
  }
}
