import { Metadata } from 'next';
import crypto from 'crypto';
import { notFound, redirect } from 'next/navigation';
import SubmissionsClient from '@/components/dashboard/submissions-client';
import { getForm, getConnector } from '@/lib/server-db';
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

    // Generate Read Token
    const payload = {
        formId: form.id,
        exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24 * 365) // 1 year
    };
    const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const signature = crypto
        .createHmac('sha256', connector.secret)
        .update(payloadB64)
        .digest('hex');
    const token = `pp_read_${payloadB64}.${signature}`;

    const endpoint = `${connector.url}/api/postpipe/forms/${form.id}/submissions`;

    // Fetch Submissions directly from DB (Server Component)
    // This avoids self-fetch issues and is faster.
    const submissions = form.submissions || [];

    return (
        <SubmissionsClient
            id={id}
            formName={form.name}
            initialSubmissions={submissions}
            endpoint={endpoint}
            token={token}
        />
    );
}
