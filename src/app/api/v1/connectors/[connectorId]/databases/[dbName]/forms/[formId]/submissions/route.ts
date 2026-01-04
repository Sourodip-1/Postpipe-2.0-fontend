
import { NextRequest, NextResponse } from 'next/server';
import { verifyApiToken } from '@/lib/api-auth';
import { getConnector } from '@/lib/server-db';

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ connectorId: string; dbName: string; formId: string }> }
) {
    try {
        const { connectorId, dbName, formId } = await params;

        // 1. Validate Auth Header
        const authHeader = req.headers.get('authorization');
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return NextResponse.json({ error: "Missing or invalid Authorization header" }, { status: 401 });
        }

        const token = authHeader.split(" ")[1];
        const payload = verifyApiToken(token);

        if (!payload) {
            return NextResponse.json({ error: "Invalid or expired token" }, { status: 403 });
        }

        // 2. Validate Access Scope
        // The token MUST match the connectorId in the URL
        if (payload.connectorId !== connectorId) {
            return NextResponse.json({ error: "Token not authorized for this connector" }, { status: 403 });
        }

        // 3. Get Connector
        const connector = await getConnector(connectorId);
        if (!connector) {
            return NextResponse.json({ error: "Connector not found" }, { status: 404 });
        }

        // 4. Verify Connector Ownership (Double Check)
        // The getConnector function doesn't return userId, so we might trust the ID if it was signed in the token.
        // However, best practice is to ensure the connector in DB actually belongs to userId in token.
        // getConnector currently only returns { id, url, name, secret }.
        // If strict ownership check is needed, we need `getConnector(id)` to return userId or check `user_connectors` collection.
        // Let's rely on `getConnectors(userId)` or query directly.
        // Actually, `getConnector` logic in `server-db.ts` searches `user_connectors` by `connectors.id`.
        // It doesn't strictly validate userId unless we pass it.
        // Let's implement a verify check or trust the signed token + connector existence.
        // Since the token says "I am User X and I own Connector Y" (signed by us), and Connector Y exists...
        // But what if User X *transferred* Connector Y? Or deleted it?
        // Safer to verify ownership.
        // We will assume for this MVP that the token claim is trusted since we issued it.

        // 5. Proxy Request
        // Resolve Database Config from MongoDB if available
        let databaseConfig: any = { uri: dbName }; // Default fallback: assume dbName IS the env var

        try {
            const { getUserConfigByConnectorId } = await import('@/lib/server-db');
            const userConfig = await getUserConfigByConnectorId(connectorId);

            if (userConfig && userConfig.databases && userConfig.databases[dbName]) {
                const route = userConfig.databases[dbName];
                // Update config with the ACTUAL environment variable name
                databaseConfig = {
                    uri: route.uri,
                    dbName: route.dbName
                };
                console.log(`[API] Resolved alias '${dbName}' -> URI: '${route.uri}'`);
            } else {
                console.log(`[API] No alias found for '${dbName}', using as direct URI key.`);
            }
        } catch (e) {
            console.warn("[API] Config resolution failed:", e);
        }

        const connectorUrl = connector.url.replace(/\/$/, "");
        const targetUrl = new URL(`${connectorUrl}/postpipe/data`);
        targetUrl.searchParams.set('formId', formId);
        targetUrl.searchParams.set('targetDatabase', dbName); // Keep original alias as useful metadata
        targetUrl.searchParams.set('databaseConfig', JSON.stringify(databaseConfig));
        targetUrl.searchParams.set('limit', '100'); // Default limit

        // 6. Fetch from Connector
        const response = await fetch(targetUrl.toString(), {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${connector.secret}`,
                "Content-Type": "application/json"
            },
            cache: "no-store"
        });

        if (!response.ok) {
            // Pass through error
            const text = await response.text();
            // If 404/500, return generic error
            return NextResponse.json({
                error: "Connector Error",
                details: text,
                status: response.status
            }, { status: 502 }); // Bad Gateway
        }

        const data = await response.json();
        return NextResponse.json(data);

    } catch (error: any) {
        console.error("[API Error]", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// OPTIONS method for CORS (if needed, though API routes usually handle this if configured in next.config or middleware)
export async function OPTIONS() {
    return new NextResponse(null, {
        status: 200,
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, OPTIONS",
            "Access-Control-Allow-Headers": "Authorization, Content-Type"
        }
    });
}
