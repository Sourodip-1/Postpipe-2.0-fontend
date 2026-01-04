
import { generateApiToken } from '../src/lib/api-auth';
import dotenv from 'dotenv';
dotenv.config();

const userId = process.argv[2];
const connectorId = process.argv[3];

if (!userId || !connectorId) {
    console.error("Usage: ts-node scripts/generate-token.ts <userId> <connectorId>");
    process.exit(1);
}

const token = generateApiToken(userId, connectorId);
console.log("\n✅ Generated Bearer Token:\n");
console.log(token);
console.log("\n");
