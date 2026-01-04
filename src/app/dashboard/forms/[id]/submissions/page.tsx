
import { Metadata } from 'next';
import crypto from 'crypto';
import { notFound, redirect } from 'next/navigation';
import fs from 'fs';
import path from 'path';
import SubmissionsClient from '@/components/dashboard/submissions-client';
import { getForm, getConnector, getUserDatabaseConfig } from '@/lib/server-db';
import { getSession } from '@/lib/auth/actions';

export const metadata: Metadata = {
    title: 'Submissions',
};

export default async function SubmissionsPage({ params }: { params: { id: string } }) {
    const session = await getSession();
    if (!session || !session.userId) {
        redirect('/login');
    }

    const { id } = await params;
    const form = await getForm(id);

    if (!form) {
        notFound();
    }

    if (form.userId !== session.userId) {
        redirect('/dashboard/forms');
    }

    const connector = await getConnector(form.connectorId);
    if (!connector) {
        return <div>Connector not found for this form.</div>;
    }

    // 1. Resolve Database Config (to support dynamic routing)
    let databaseConfig = null;

    // STRATEGY: Fetch from User Database Config (MongoDB)
    try {
        // We need getUserDatabaseConfig helper
        // Since this is a server component, we can call server-db directly
        // But we need the userId. 'form' object has userId.
        if (form.userId) {
            const userConfig = await getUserDatabaseConfig(form.userId);
            console.log(`[Dashboard] Fetched user config for target: '${form.targetDatabase}'`);

            if (userConfig && userConfig.databases) {
                // The UI stores it in 'databases' object keyed by the target name alias
                const target = form.targetDatabase || userConfig.defaultTarget || "default";
                const route = userConfig.databases[target];

                if (route) {
                    // The UI structure: { uri: "MONGODB_URI_...", dbName: "postpipe-2" }
                    // The Connector expects: { uri: "MONGODB_URI_...", dbName: "postpipe-2" }
                    // It matches perfectly!
                    databaseConfig = route;
                    console.log(`[Dashboard] Resolved config from DB: `, databaseConfig);
                } else {
                    console.warn(`[Dashboard] Target '${target}' not found in user config.`);
                }
            }
        }
    } catch (e) {
        console.error("[Dashboard] Error fetching user config:", e);
    }

    // Fallback? Maybe keep file system just in case for now?
    // User requested to "connect it to mongo db", so we prioritize DB.
    // If DB has nothing, we could fallback, but better to be clean.

    // Legacy Fallback (Optional - remove if fully migrated)
    if (!databaseConfig) {
        try {
            const configPath = path.join(process.cwd(), 'src', 'config', 'db-routes.json');
            if (fs.existsSync(configPath)) {
                // ... file logic ...
                // Keeping it brief here to avoid cluttering, user wants Mongo connection.
                // We will skip file fallback to force Mongo path logic validation.
                console.warn("[Dashboard] Falling back to local file config is disabled. Please save config in dashboard to migrate to DB.");
            }
        } catch (e) { }
    }

    // 2. Fetch Submissions directly from Connector (Remote Fetch)
    let submissions = [];
    let fetchError: string | null = null;
    let authError: boolean = false;

    // Retry configuration
    const MAX_RETRIES = 3;
    const INITIAL_BACKOFF = 500; // ms

    if (!connector.secret || typeof connector.secret !== 'string') {
        console.error(`[Dashboard] Critical: Connector ${connector.id} has no valid secret.`);
        fetchError = "Configuration Error: Missing Connector Secret";
    } else {
        const fetchWithRetry = async (attempt: number = 0): Promise<any> => {
            try {
                const queryParams = new URLSearchParams({
                    formId: form.id,
                    limit: "100",
                    targetDatabase: form.targetDatabase || "",
                    databaseConfig: JSON.stringify(databaseConfig || {})
                });

                const fetchUrl = `${connector.url}/postpipe/data?${queryParams.toString()}`;

                const res = await fetch(fetchUrl, {
                    headers: {
                        Authorization: `Bearer ${connector.secret} `
                    },
                    cache: 'no-store',
                    next: { revalidate: 0 }
                });

                if (res.ok) {
                    return { ok: true, json: await res.json() };
                }

                // If Auth Error (401/403), do not retry
                if (res.status === 401 || res.status === 403) {
                    return { ok: false, status: res.status, error: "AuthFailed" };
                }

                // If Connector Error (500) or other, throw to retry
                const errorText = await res.text();
                console.error(`[Dashboard] Connector Error(${res.status}): `, errorText);
                throw new Error(`Status ${res.status}: ${errorText} `);

            } catch (e) {
                if (attempt < MAX_RETRIES) {
                    const delay = INITIAL_BACKOFF * Math.pow(2, attempt);
                    await new Promise(r => setTimeout(r, delay));
                    return fetchWithRetry(attempt + 1);
                }
                throw e;
            }
        };

        try {
            console.log(`[Dashboard] Fetching submissions for form ${form.id} from ${connector.url} `);
            console.log(`[Dashboard] Using Secret: ${connector.secret} `);
            const result = await fetchWithRetry();

            if (result.ok) {
                submissions = result.json.data || [];
            } else if (result.error === "AuthFailed") {
                console.error(`[Dashboard] Connector Auth Failed for ${connector.id}`);
                authError = true;
                fetchError = "Authentication Failed: Check your connector secret.";
            }
        } catch (e) {
            console.error("[Dashboard] Connector fetch error (Retries exhausted):", e);
            fetchError = "Failed to connect to Connector. Please check if it is running.";
        }
    }

    // Generate Secure API Token
    const { generateApiToken } = await import('@/lib/api-auth');
    const token = generateApiToken(session.userId, form.connectorId);

    // Construct Public API Endpoint
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002';
    const dbName = form.targetDatabase || "default"; // Or resolve from file if complex logic needed
    const endpoint = `${appUrl}/api/v1/connectors/${form.connectorId}/databases/${dbName}/forms/${form.id}/submissions`;

    return (
        <SubmissionsClient
            id={id}
            formName={form.name}
            initialSubmissions={submissions}
            endpoint={endpoint}
            token={token}
            fetchError={fetchError}
            authError={authError}
        />
    );
}
