'use server';

import { createForm, getConnectors } from '../../lib/server-db';

import { getSession } from '../../lib/auth/actions';

export async function createFormAction(formData: FormData) {
  const session = await getSession();
  if (!session || !session.userId) {
      return { error: 'Unauthorized' };
  }

  const name = formData.get('name') as string;
  const connectorId = formData.get('connectorId') as string;
  const fieldsJson = formData.get('fields') as string;

  if (!name || !connectorId) {
    return { error: 'Name and Connector are required' };
  }

  let fields = [];
  try {
      fields = JSON.parse(fieldsJson);
  } catch (e) {
      return { error: 'Invalid fields data' };
  }

  try {
     const form = await createForm(connectorId, name, fields, session.userId);
     return { success: true, formId: form.id };
  } catch (e) {
      return { error: 'Failed to create form' };
  }
}

export async function getConnectorsAction() {
    const session = await getSession();
    if (!session || !session.userId) {
        return [];
    }

    const connectors = await getConnectors(session.userId);
    return connectors.map((c: any) => ({
        ...c,
        _id: c._id?.toString(), // Handle if _id exists (though it might not in subdoc)
        id: c.id?.toString() || '',
    }));
}
