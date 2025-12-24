import { Metadata } from 'next';
import CliClient from '@/components/dashboard/cli-client';

export const metadata: Metadata = {
    title: 'CLI & Integrations',
};

export default function CliPage() {
    return <CliClient />;
}
