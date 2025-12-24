import { Metadata } from 'next';
import WorkflowsClient from '@/components/dashboard/workflows-client';

export const metadata: Metadata = {
  title: 'Workflows',
};

export default function WorkflowsPage() {
  return <WorkflowsClient />;
}
