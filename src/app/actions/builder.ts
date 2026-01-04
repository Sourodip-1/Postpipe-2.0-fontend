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
    const targetDatabase = formData.get('targetDatabase') as string;
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
        const form = await createForm(connectorId, name, fields, session.userId, targetDatabase);
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

export async function getFormAction(id: string) {
    const session = await getSession();
    if (!session || !session.userId) {
        return { error: 'Unauthorized' };
    }

    const { getForm } = await import('../../lib/server-db'); // Dynamic import to avoid circular dep if any
    const form = await getForm(id);
    if (!form) return { error: 'Form not found' };

    if (form.userId !== session.userId) {
        return { error: 'Unauthorized' };
    }

    return {
        success: true,
        form: {
            ...form,
            _id: (form as any)._id?.toString(),
        }
    };
}

export async function updateFormAction(id: string, formData: FormData) {
    const session = await getSession();
    if (!session || !session.userId) {
        return { error: 'Unauthorized' };
    }

    const name = formData.get('name') as string;
    const connectorId = formData.get('connectorId') as string;
    const targetDatabase = formData.get('targetDatabase') as string;
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

    const dbModule = await import('../../lib/server-db');
    const existingForm = await dbModule.getForm(id);

    if (!existingForm) return { error: 'Form not found' };
    if (existingForm.userId !== session.userId) return { error: 'Unauthorized' };

    try {
        await dbModule.updateForm(id, { name, connectorId, fields, targetDatabase });
        return { success: true };
    } catch (e) {
        return { error: 'Failed to update form' };
    }
}
