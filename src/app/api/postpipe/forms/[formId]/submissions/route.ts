import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getForm, getConnector } from '../../../../../../lib/server-db';

export async function GET(
  req: NextRequest, 
  { params }: { params: Promise<{ formId: string }> }
) {
    try {
        const { formId } = await params;
        const form = await getForm(formId);

        if (!form) {
            return NextResponse.json({ error: 'Form not found' }, { status: 404 });
        }

        const connector = await getConnector(form.connectorId);
        if (!connector) {
             return NextResponse.json({ error: 'Connector not provisioned' }, { status: 503 });
        }

        // Verify Token
        const authHeader = req.headers.get('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const token = authHeader.split(' ')[1];

        // Token Format: pp_read_PAYLOAD.SIGNATURE
        const [prefix, payloadB64, signature] = token.split(/[_.]/);
        
        if (prefix !== 'pp' || !payloadB64 || !signature) {
             return NextResponse.json({ error: 'Invalid token format' }, { status: 401 });
        }

        // Verify Signature
        const expectedSignature = crypto
            .createHmac('sha256', connector.secret)
            .update(payloadB64)
            .digest('hex');

        if (signature !== expectedSignature) {
            return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
        }

        // Return submissions from DB
        const submissions = form.submissions || [];

        return NextResponse.json({ 
            formId: form.id,
            submissions 
        });

    } catch (e) {
        console.error("Error fetching submissions:", e);
         return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
