import { Metadata } from 'next';
import OverviewClient from '@/components/dashboard/overview-client';

export const metadata: Metadata = {
    title: 'Overview',
};

export default function DashboardPage() {
    return <OverviewClient />;
}
