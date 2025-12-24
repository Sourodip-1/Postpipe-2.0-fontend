import { Metadata } from 'next';
import SubmissionsClient from '@/components/dashboard/submissions-client';

export const metadata: Metadata = {
    title: 'Submissions',
};

export default function SubmissionsPage({ params }: { params: { id: string } }) {
    return <SubmissionsClient id={params.id} />;
}
