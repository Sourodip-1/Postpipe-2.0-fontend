import { Metadata } from 'next';
import NewFormClient from '@/components/dashboard/new-form-client';

export const metadata: Metadata = {
    title: 'Create Form',
};

export default function NewFormPage() {
    return <NewFormClient />;
}
