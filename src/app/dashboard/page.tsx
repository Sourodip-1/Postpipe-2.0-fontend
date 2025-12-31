import { Metadata } from 'next';
import OverviewClient from '@/components/dashboard/overview-client';
import { getDashboardData } from '@/app/actions/dashboard';

export const metadata: Metadata = {
    title: 'Overview',
};

export default async function DashboardPage() {
    const { forms, connectors, systems } = await getDashboardData();
    return <OverviewClient forms={forms} connectors={connectors} systems={systems} />;
}
