import { Metadata } from 'next';
import CliClient from '@/components/dashboard/cli-client';
import { getTemplates } from '@/lib/actions/explore';

export const metadata: Metadata = {
    title: 'CLI & Integrations',
};

export default async function CliPage() {
    const templates = await getTemplates();
    return <CliClient templates={templates} />;
}
