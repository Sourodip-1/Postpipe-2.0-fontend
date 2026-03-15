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
    const routingJson = formData.get('routing') as string;

    if (!name || !connectorId) {
        return { error: 'Name and Connector are required' };
    }

    let fields = [];
    try {
        fields = JSON.parse(fieldsJson);
    } catch (e) {
        return { error: 'Invalid fields data' };
    }

    let routing = undefined;
    if (routingJson) {
        try {
            routing = JSON.parse(routingJson);
        } catch (e) {
            console.warn("Invalid routing JSON", e);
        }
    }

    try {
        const form = await createForm(connectorId, name, fields, session.userId, targetDatabase, routing);
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
    const routingJson = formData.get('routing') as string;

    if (!name || !connectorId) {
        return { error: 'Name and Connector are required' };
    }

    let fields = [];
    try {
        fields = JSON.parse(fieldsJson);
    } catch (e) {
        return { error: 'Invalid fields data' };
    }

    let routing = undefined;
    if (routingJson) {
        try {
            routing = JSON.parse(routingJson);
        } catch (e) {
            console.warn("Invalid routing JSON", e);
        }
    }

    const dbModule = await import('../../lib/server-db');
    const existingForm = await dbModule.getForm(id);

    if (!existingForm) return { error: 'Form not found' };
    if (existingForm.userId !== session.userId) return { error: 'Unauthorized' };

    try {
        await dbModule.updateForm(id, { name, connectorId, fields, targetDatabase, routing });
        return { success: true };
    } catch (e) {
        return { error: 'Failed to update form' };
    }
}

// === AUTH PRESET ACTIONS ===

export async function createAuthPresetAction(formData: FormData) {
    const session = await getSession();
    if (!session || !session.userId) return { error: 'Unauthorized' };

    const name = formData.get('name') as string;
    const connectorId = formData.get('connectorId') as string;
    const targetDatabase = formData.get('targetDatabase') as string;
    const projectId = formData.get('projectId') as string;
    const redirectUrl = formData.get('redirectUrl') as string;
    const envFrontendUrlAlias = formData.get('envFrontendUrlAlias') as string;
    const apiUrl = formData.get('apiUrl') as string;
    const providersJson = formData.get('providers') as string;

    if (!name || !connectorId) {
        return { error: 'Name and Connector are required' };
    }

    let providers = { email: true, google: false, github: false };
    try {
        if (providersJson) providers = JSON.parse(providersJson);
    } catch (e) {
        return { error: 'Invalid providers data' };
    }

    try {
        const dbModule = await import('../../lib/server-db');
        const preset = await dbModule.createAuthPreset(session.userId, {
            name,
            connectorId,
            targetDatabase: targetDatabase === 'default' ? undefined : targetDatabase,
            projectId,
            redirectUrl,
            envFrontendUrlAlias,
            apiUrl,
            providers
        });
        return { success: true, presetId: preset.id };
    } catch (e) {
        console.error("Failed to create Auth Preset:", e);
        return { error: 'Failed to save Auth Preset' };
    }
}

export async function updateAuthPresetAction(presetId: string, formData: FormData) {
    const session = await getSession();
    if (!session || !session.userId) return { error: 'Unauthorized' };

    const name = formData.get('name') as string;
    const connectorId = formData.get('connectorId') as string;
    const targetDatabase = formData.get('targetDatabase') as string;
    const projectId = formData.get('projectId') as string;
    const redirectUrl = formData.get('redirectUrl') as string;
    const envFrontendUrlAlias = formData.get('envFrontendUrlAlias') as string;
    const apiUrl = formData.get('apiUrl') as string;
    const providersJson = formData.get('providers') as string;

    if (!name || !connectorId) {
        return { error: 'Name and Connector are required' };
    }

    let providers = undefined;
    if (providersJson) {
        try {
            providers = JSON.parse(providersJson);
        } catch (e) {
            return { error: 'Invalid providers data' };
        }
    }

    try {
        const dbModule = await import('../../lib/server-db');
        await dbModule.updateAuthPreset(session.userId, presetId, {
            name,
            connectorId,
            targetDatabase: targetDatabase === 'default' ? undefined : targetDatabase,
            projectId,
            redirectUrl,
            envFrontendUrlAlias,
            apiUrl,
            providers
        });
        return { success: true };
    } catch (e) {
        console.error("Failed to update Auth Preset:", e);
        return { error: 'Failed to update Auth Preset' };
    }
}

export async function getAuthPresetsAction() {
    const session = await getSession();
    if (!session || !session.userId) return [];

    try {
        const dbModule = await import('../../lib/server-db');
        const presets = await dbModule.getAuthPresets(session.userId);
        return presets;
    } catch (e) {
        console.error("Failed to fetch Auth Presets:", e);
        return [];
    }
}
