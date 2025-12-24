import { Metadata } from 'next';
import StaticConnectorClient from '@/components/static-connector-client';

export const metadata: Metadata = {
    title: 'Static Connector',
};

export default function StaticConnectorPage() {
    return <StaticConnectorClient />;
}
