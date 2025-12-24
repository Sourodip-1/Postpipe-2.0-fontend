import { Metadata } from 'next';
import FormsClient from '@/components/dashboard/forms-client';

export const metadata: Metadata = {
  title: 'Forms',
};

export default function FormsPage() {
  return <FormsClient />;
}
