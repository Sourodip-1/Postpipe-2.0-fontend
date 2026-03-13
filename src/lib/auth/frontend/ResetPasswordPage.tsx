'use client';

import { useActionState } from 'react';
import { resetPassword } from '../actions';
import { useSearchParams } from 'next/navigation';

const initialState = {
    message: '',
    success: false,
};

export default function ResetPasswordPage() {
    const searchParams = useSearchParams();
    const token = searchParams.get('token');
    const [state, action] = useActionState(resetPassword, initialState);

    if (!token) {
        return <div>Invalid token</div>;
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-background p-4 text-foreground">
            <div className="w-full max-w-md space-y-6 rounded-lg border border-border bg-card p-8 shadow-lg">
                <div className="text-center">
                    <h1 className="text-2xl font-bold">Reset Password</h1>
                    <p className="text-sm text-muted-foreground mt-2">Enter your new password below</p>
                </div>

                <form action={action} className="flex flex-col gap-4">
                    <input type="hidden" name="token" value={token} />
                    <div className="grid gap-2">
                        <label className="text-sm font-medium leading-none">New Password</label>
                        <input
                            name="password"
                            type="password"
                            placeholder="New Password"
                            required
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        />
                    </div>
                    <div className="grid gap-2">
                        <label className="text-sm font-medium leading-none">Confirm Password</label>
                        <input
                            name="confirmPassword"
                            type="password"
                            placeholder="Confirm New Password"
                            required
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        />
                    </div>

                    <button type="submit" className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 mt-2">
                        Reset Password
                    </button>
                </form>

                {state?.message && (
                    <p className={`text-sm text-center font-medium ${state.success ? 'text-green-500' : 'text-red-500'}`}>
                        {state.message}
                    </p>
                )}
                {state?.success && (
                    <div className="text-center">
                        <a href="/login" className="text-sm font-medium underline underline-offset-4 hover:text-primary">
                            Go to login
                        </a>
                    </div>
                )}
            </div>
        </div>
    );
}
