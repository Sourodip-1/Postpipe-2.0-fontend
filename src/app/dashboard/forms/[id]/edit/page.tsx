import { getFormAction } from '@/app/actions/builder';
import NewFormClient from '@/components/dashboard/new-form-client';
import { notFound, redirect } from 'next/navigation';

export const metadata = {
    title: 'Edit Form',
};

export default async function EditFormPage({ params }: { params: { id: string } }) {
    const { id } = params;

    // Fetch initial data
    const res = await getFormAction(id);

    if (res.error === 'Unauthorized') {
        // Redirect to login or show error
        // For now, let's redirect to dashboard
        redirect('/dashboard/forms');
    }

    if (res.error === 'Form not found' || !res.form) {
        notFound();
    }

    return <NewFormClient initialData={res.form} />;
}
