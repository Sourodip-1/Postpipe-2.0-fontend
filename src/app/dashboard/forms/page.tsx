import { Suspense } from 'react';
import { Metadata } from 'next';
import FormsClient from '@/components/dashboard/forms-client';
import { DashboardSkeleton } from '@/components/dashboard/dashboard-skeleton';

export const metadata: Metadata = {
  title: 'Forms',
};

import { getDashboardData } from '@/app/actions/dashboard';
import { getAuthPresetsAction } from '@/app/actions/builder';

export default async function FormsPage() {
  const { forms } = await getDashboardData();
  const presets = await getAuthPresetsAction();
  
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <FormsClient initialForms={forms} initialPresets={presets} />
    </Suspense>
  );
}
