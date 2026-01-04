
import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
dotenv.config();

const uri = process.env.MONGODB_URI;
const CONNECTOR_ID = 'conn_7oyz65f78';
const SECRET_TO_SET = 'sk_live_PLACEHOLDER';

async function main() {
    if (!uri) {
        console.error("Missing MONGODB_URI");
        process.exit(1);
    }

    const client = new MongoClient(uri);
    await client.connect();
    const db = client.db('postpipe_core');

    // Update Access Token in User Connectors
    const result = await db.collection('user_connectors').updateOne(
        { "connectors.id": CONNECTOR_ID },
        { $set: { "connectors.$.secret": SECRET_TO_SET } }
    );

    console.log(`Matched: ${result.matchedCount}, Modified: ${result.modifiedCount}`);

    // START DB FIX (For 403 Forbidden)
    // Also ensuring UserId matches if needed, but secret is the main key for Gateway Auth

    await client.close();
    console.log("Secret Synced Successfully.");
}

main().catch(console.error);
