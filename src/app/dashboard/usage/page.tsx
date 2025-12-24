import { Metadata } from 'next';
import UsageClient from '@/components/dashboard/usage-client';

export const metadata: Metadata = {
    title: 'Usage',
};

export default function UsagePage() {
    return <UsageClient />;
}
