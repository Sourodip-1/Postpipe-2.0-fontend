import { Metadata } from 'next';
import ConnectorsClient from '@/components/dashboard/connectors-client';

export const metadata: Metadata = {
    title: 'Connectors',
};

export default function ConnectorsPage() {
    return <ConnectorsClient />;
}
