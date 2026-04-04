import { NextRequest, NextResponse } from 'next/server';
import { getForm, getConnector, getUserDatabaseConfig } from '../../../../../lib/server-db';
import { ensureFullUrl } from '../../../../../lib/utils';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS, POST',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-api-key',
};

export async function OPTIONS() {
    return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ formId: string }> }
) {
    try {
        const { formId } = await params;
        console.log(`[Public References] GET request received for form: ${formId}`);
        const form = await getForm(formId);

        if (!form) {
            return NextResponse.json({ error: 'Form not found', data: [] }, { status: 404, headers: corsHeaders });
        }

        if (form.status === 'Paused') {
            return NextResponse.json({ error: 'Form paused', data: [] }, { status: 423, headers: corsHeaders });
        }

        const connector = await getConnector(form.connectorId);
        if (!connector) {
            return NextResponse.json({ error: 'Connector not found', data: [] }, { status: 503, headers: corsHeaders });
        }

        // Resolving Database Config
        let databaseConfig = null;
        const target = form.targetDatabase || "default";

        try {
            if (form.userId) {
                const userConfig = await getUserDatabaseConfig(form.userId);
                if (userConfig && userConfig.databases && userConfig.databases[target]) {
                    databaseConfig = userConfig.databases[target];
                }
            }
            if (!databaseConfig && connector.databases && connector.databases[target]) {
                databaseConfig = connector.databases[target];
            }
        } catch (e) {
            console.error("[References API] DB resolution error:", e);
        }

        const connectorUrl = ensureFullUrl(connector.url);
        const targetUrl = new URL(`${connectorUrl}/postpipe/data`);
        targetUrl.searchParams.set('formId', formId);
        targetUrl.searchParams.set('targetDatabase', target);
        if (databaseConfig) {
            targetUrl.searchParams.set('databaseConfig', JSON.stringify(databaseConfig));
        }
        targetUrl.searchParams.set('limit', '500');

        const response = await fetch(targetUrl.toString(), {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${connector.secret}`,
                "Content-Type": "application/json"
            },
            cache: "no-store"
        });

        if (!response.ok) {
            return NextResponse.json({ data: [] }, { status: 502, headers: corsHeaders });
        }

        const data = await response.json();
        return NextResponse.json({ data: data.data || data }, { headers: corsHeaders });

    } catch (e) {
        console.error("[References API Error]", e);
        return NextResponse.json({ data: [] }, { status: 500, headers: corsHeaders });
    }
}
