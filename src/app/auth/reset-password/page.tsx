import ResetPasswordPage from "@/lib/auth/frontend/ResetPasswordPage";
import { Metadata } from 'next';
import { Suspense } from 'react';

export const metadata: Metadata = {
    title: 'Reset Password',
};

export default function Page() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <ResetPasswordPage />
        </Suspense>
    );
}
