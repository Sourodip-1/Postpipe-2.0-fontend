import { Metadata } from 'next';
import UsageClient from '@/components/dashboard/usage-client';
import { getSession } from '@/lib/auth/actions';
import { getUserUsageStats } from '@/lib/server-db';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
    title: 'Usage',
};

export default async function UsagePage() {
    const session = await getSession();
    if (!session?.userId) {
        redirect('/login');
    }

    const stats = await getUserUsageStats(session.userId);

    return <UsageClient stats={stats} />;
}
