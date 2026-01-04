
import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET || 'default-secret-do-not-use-in-prod';

export interface ApiTokenPayload {
    userId: string;
    connectorId: string;
}

export function generateApiToken(userId: string, connectorId: string, expiresIn = '30d'): string {
    if (!userId || !connectorId) throw new Error("userId and connectorId required");
    return jwt.sign({ userId, connectorId }, SECRET, { expiresIn } as jwt.SignOptions);
}

export function verifyApiToken(token: string): ApiTokenPayload | null {
    try {
        const decoded = jwt.verify(token, SECRET) as ApiTokenPayload;
        if (decoded && decoded.userId && decoded.connectorId) {
            return decoded;
        }
        return null;
    } catch (e) {
        return null;
    }
}
