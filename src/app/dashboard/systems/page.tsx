import { Metadata } from 'next';
import SystemsClient from '@/components/dashboard/systems-client';

export const metadata: Metadata = {
    title: 'Backend Systems',
};

export default function SystemsPage() {
    return <SystemsClient />;
}
