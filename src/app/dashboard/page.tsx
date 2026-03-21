
import { Suspense } from 'react';
import { Metadata } from 'next';
import OverviewClient from '@/components/dashboard/overview-client';
import { getDashboardData } from '@/app/actions/dashboard';
import { DashboardSkeleton } from '@/components/dashboard/dashboard-skeleton';

export const metadata: Metadata = {
    title: 'Overview',
};

import { getAuthPresetsAction } from '@/app/actions/builder';

async function OverviewContent() {
    const { forms, connectors, systems } = await getDashboardData();
    const presets = await getAuthPresetsAction();
    return <OverviewClient forms={forms} connectors={connectors} systems={systems} authPresets={presets} />;
}

export default function DashboardPage() {
    return (
        <Suspense fallback={<DashboardSkeleton />}>
            <OverviewContent />
        </Suspense>
    );
}
