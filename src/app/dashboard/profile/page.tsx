import { Metadata } from 'next';
import ProfileClient from '@/components/dashboard/profile-client';

export const metadata: Metadata = {
    title: 'Profile',
};

export default function ProfilePage() {
    return <ProfileClient />;
}
