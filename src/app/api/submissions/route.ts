import { NextRequest, NextResponse } from 'next/server';
import { getForm, getConnector, getUserDatabaseConfig } from '@/lib/server-db';
import { ensureFullUrl } from '@/lib/utils';
import { getSession } from '@/lib/auth/actions';

export async function GET(req: NextRequest) {
    console.log("[API] Incoming request to /api/submissions");
    
    // 1. Authenticate user
    const session = await getSession();
    if (!session || !session.userId) {
        return NextResponse.json({ status: "error", error: "Unauthorized" }, { status: 401 });
    }

    // 2. Extract query parameters
    const url = new URL(req.url);
    const formId = url.searchParams.get("formId");

    if (!formId) {
        return NextResponse.json({ status: "error", error: "Missing formId" }, { status: 400 });
    }

    try {
        const form = await getForm(formId);
        if (!form) {
            return NextResponse.json({ status: "error", error: "Form not found" }, { status: 404 });
        }

        if (form.userId !== session.userId) {
            return NextResponse.json({ status: "error", error: "Forbidden" }, { status: 403 });
        }

        const connector = await getConnector(form.connectorId);
        if (!connector) {
            return NextResponse.json({ status: "error", error: "Connector not found" }, { status: 404 });
        }

        // Pagination/Filtering
        const limit = url.searchParams.get("limit") || "100";
        const page = url.searchParams.get("page") || "1";
        const includeDeleted = url.searchParams.get("includeDeleted") || "false";
        const filterStr = url.searchParams.get("filter");
        const search = url.searchParams.get("search");
        const dateRange = url.searchParams.get("dateRange");

        // Resolve Target Database
        const target = form.targetDatabase || "default";
        const userConfig = await getUserDatabaseConfig(form.userId || "");
        
        let databaseConfig = null;
        if (userConfig?.databases?.[target]) {
            databaseConfig = userConfig.databases[target];
        } else if (connector.databases?.[target]) {
            databaseConfig = connector.databases[target];
        }

        // Fetch from Connector
        const queryParams = new URLSearchParams({
            formId: form.id,
            limit,
            page,
            targetDatabase: target,
            includeDeleted
        });
        if (search) queryParams.set("search", search);
        if (dateRange) queryParams.set("dateRange", dateRange);
        if (databaseConfig) {
            queryParams.set("databaseConfig", JSON.stringify(databaseConfig));
        }
        if (filterStr) {
            queryParams.set("filter", filterStr);
        }

        const baseUrl = ensureFullUrl(connector.url);
        const fetchUrl = `${baseUrl}/postpipe/data?${queryParams.toString()}`;

        const res = await fetch(fetchUrl, {
            headers: { Authorization: `Bearer ${connector.secret}` },
            cache: 'no-store'
        });

        if (!res.ok) {
            const errText = await res.text();
            return NextResponse.json({ status: "error", error: "Connector error", details: errText }, { status: res.status });
        }

        const data = await res.json();
        return NextResponse.json({
            status: "success",
            records: data.data || [],
            count: data.count || 0
        });

    } catch (e: any) {
        console.error("[API] Internal Error fetching submissions:", e);
        return NextResponse.json({ status: "error", error: "Internal Server Error" }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest) {
    console.log("[API] PATCH /api/submissions called");
    const session = await getSession();
    if (!session || !session.userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();
        console.log("[API] PATCH body:", JSON.stringify(body));
        const { submissionId, formId, patch } = body;

        if (!submissionId || !formId || !patch) {
            return NextResponse.json({ error: "submissionId, formId, and patch are required" }, { status: 400 });
        }

        const form = await getForm(formId);
        if (!form || form.userId !== session.userId) {
            return NextResponse.json({ error: "Form not found or unauthorized" }, { status: 404 });
        }

        const connector = await getConnector(form.connectorId);
        if (!connector) return NextResponse.json({ error: "Connector not found" }, { status: 404 });

        const target = form.targetDatabase || "default";
        const userConfig = await getUserDatabaseConfig(form.userId || "");
        const databaseConfig = userConfig?.databases?.[target] || connector.databases?.[target];

        const baseUrl = ensureFullUrl(connector.url);
        console.log("[API] Calling connector:", `${baseUrl}/postpipe/data/${submissionId}`, "method: PATCH");
        
        const res = await fetch(`${baseUrl}/postpipe/data/${submissionId}`, {
            method: 'PATCH',
            headers: { 
                'Authorization': `Bearer ${connector.secret}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ formId, patch, targetDatabase: target, databaseConfig })
        });

        const result = await res.json();
        console.log("[API] Connector response:", JSON.stringify(result), "status:", res.status);
        return NextResponse.json(result, { status: res.status });
    } catch (e) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    const session = await getSession();
    if (!session || !session.userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const url = new URL(req.url);
        const submissionId = url.searchParams.get("submissionId");
        const formId = url.searchParams.get("formId");
        const hard = url.searchParams.get("hard") === 'true';

        if (!submissionId || !formId) {
            return NextResponse.json({ error: "submissionId and formId are required" }, { status: 400 });
        }

        const form = await getForm(formId);
        if (!form || form.userId !== session.userId) {
            return NextResponse.json({ error: "Form not found or unauthorized" }, { status: 404 });
        }

        const connector = await getConnector(form.connectorId);
        if (!connector) return NextResponse.json({ error: "Connector not found" }, { status: 404 });

        const target = form.targetDatabase || "default";
        const userConfig = await getUserDatabaseConfig(form.userId || "");
        const databaseConfig = userConfig?.databases?.[target] || connector.databases?.[target];

        const baseUrl = ensureFullUrl(connector.url);
        const res = await fetch(`${baseUrl}/postpipe/data/${submissionId}`, {
            method: 'DELETE',
            headers: { 
                'Authorization': `Bearer ${connector.secret}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ formId, hard, targetDatabase: target, databaseConfig })
        });

        const result = await res.json();
        return NextResponse.json(result, { status: res.status });
    } catch (e) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

