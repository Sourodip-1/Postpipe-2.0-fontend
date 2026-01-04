'use server';

import { getSession } from "@/lib/auth/actions";
import { getDB, UserConnectorsDocument } from "@/lib/server-db";

export async function addDatabaseAction(
    connectorId: string,
    alias: string,
    uri: string,
    dbName: string
) {
    try {
        const session = await getSession();
        if (!session || !session.userId) {
            return { error: 'Unauthorized' };
        }

        const db = await getDB();

        // Find existing connector to verify ownership
        const userDoc = await db.collection<UserConnectorsDocument>('user_connectors').findOne({
            userId: session.userId,
            "connectors.id": connectorId
        });

        if (!userDoc) {
            return { error: 'Connector not found' };
        }

        // Validate inputs
        if (!alias || !uri || !dbName) {
            return { error: 'All fields are required' };
        }

        const safeAlias = alias.trim(); // e.g., "staging"

        // Update specific connector in the array
        await db.collection('user_connectors').updateOne(
            {
                userId: session.userId,
                "connectors.id": connectorId
            },
            {
                $set: {
                    [`connectors.$.databases.${safeAlias}`]: {
                        uri: uri,
                        dbName: dbName
                    }
                }
            }
        );

        return { success: true };
    } catch (e) {
        console.error("Add Database Error:", e);
        return { error: 'Failed to add database' };
    }
}

export async function removeDatabaseAction(connectorId: string, alias: string) {
    try {
        const session = await getSession();
        if (!session || !session.userId) {
            return { error: 'Unauthorized' };
        }

        const db = await getDB();

        await db.collection('user_connectors').updateOne(
            {
                userId: session.userId,
                "connectors.id": connectorId
            },
            {
                $unset: {
                    [`connectors.$.databases.${alias}`]: ""
                }
            }
        );

        return { success: true };
    } catch (e) {
        console.error("Remove Database Error:", e);
        return { error: 'Failed to remove database' };
    }
}
