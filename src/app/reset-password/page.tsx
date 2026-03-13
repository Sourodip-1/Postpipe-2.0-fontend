"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { CheckCircle2, AlertCircle, Loader2, ArrowRight, Lock, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

function ResetPasswordForm() {
    const searchParams = useSearchParams();
    const token = searchParams.get("token");

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
    const [errorMessage, setErrorMessage] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!token) {
            toast({ title: "Error", description: "Reset token is missing from the URL.", variant: "destructive" });
            return;
        }

        if (password !== confirmPassword) {
            toast({ title: "Error", description: "Passwords do not match.", variant: "destructive" });
            return;
        }

        if (password.length < 6) {
            toast({ title: "Error", description: "Password must be at least 6 characters.", variant: "destructive" });
            return;
        }

        setIsLoading(true);
        setStatus("idle");

        try {
            const apiUrl = process.env.NEXT_PUBLIC_CONNECTOR_URL || "http://localhost:5501";
            const response = await fetch(`${apiUrl}/api/auth/reset-password`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token, newPassword: password, targetDatabase: "default" })
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.message || "Failed to reset password.");

            setStatus("success");
            toast({ title: "Success", description: "Your password has been reset successfully." });
        } catch (error: any) {
            setStatus("error");
            setErrorMessage(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    if (!token) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center space-y-6 py-4"
            >
                <div className="bg-destructive/10 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-2 border border-destructive/20">
                    <AlertCircle className="h-10 w-10 text-destructive" />
                </div>
                <div>
                    <h3 className="text-2xl font-bold tracking-tight text-foreground">Invalid Link</h3>
                    <p className="text-muted-foreground mt-2 text-sm max-w-xs mx-auto">
                        This password reset link is invalid or missing the required token.
                    </p>
                </div>
                <Link href="/">
                    <Button variant="outline" className="h-12 w-full rounded-xl text-md font-semibold mt-4">
                        Return Home
                    </Button>
                </Link>
            </motion.div>
        );
    }

    if (status === "success") {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center space-y-6 py-4"
            >
                <div className="bg-green-500/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-green-500/20">
                    <CheckCircle2 className="h-12 w-12 text-green-500" />
                </div>
                <div>
                    <h3 className="text-2xl font-bold tracking-tight text-foreground">Security Updated</h3>
                    <p className="text-muted-foreground mt-2 text-sm">
                        Your password has been changed. You can now use your new credentials to log in.
                    </p>
                </div>
                <Link href="/" className="block pt-4 text-center">
                    <Button className="h-12 w-full rounded-xl text-md font-bold shadow-lg shadow-primary/20 group">
                        Back to Login
                        <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Button>
                </Link>
            </motion.div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
                <div className="space-y-2">
                    <label className="text-sm font-semibold text-foreground ml-1">New Password</label>
                    <div className="relative group">
                        <Lock className="absolute left-4 top-3.5 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <Input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter new password"
                            className="h-12 pl-12 rounded-xl border-border/50 bg-secondary/30 focus-visible:ring-primary/20 focus-visible:border-primary transition-all"
                            required
                            disabled={isLoading}
                        />
                    </div>
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-semibold text-foreground ml-1">Confirm New Password</label>
                    <div className="relative group">
                        <ShieldCheck className="absolute left-4 top-3.5 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <Input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Confirm new password"
                            className="h-12 pl-12 rounded-xl border-border/50 bg-secondary/30 focus-visible:ring-primary/20 focus-visible:border-primary transition-all"
                            required
                            disabled={isLoading}
                        />
                    </div>
                </div>
            </div>

            {status === "error" && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-xl bg-destructive/10 text-destructive text-sm font-medium flex items-center gap-3 border border-destructive/20"
                >
                    <AlertCircle className="h-5 w-5 shrink-0" />
                    <p>{errorMessage}</p>
                </motion.div>
            )}

            <Button type="submit" className="w-full h-12 rounded-xl text-md font-bold shadow-lg shadow-primary/20 group" disabled={isLoading}>
                {isLoading ? (
                    <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Securing...
                    </>
                ) : (
                    "Complete Password Reset"
                )}
            </Button>
        </form>
    );
}

export default function ResetPasswordPage() {
    return (
        <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-500/10 via-background to-background flex flex-col items-center justify-center p-6 selection:bg-primary/20">
            <div className="w-full max-w-md relative">
                {/* Decorative background blur */}
                <div className="absolute -top-24 -left-24 w-64 h-64 bg-primary/20 rounded-full blur-3xl opacity-50" />
                <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl opacity-50" />

                <div className="relative bg-card/80 backdrop-blur-xl border border-border/50 rounded-[2rem] shadow-2xl p-10 overflow-hidden">
                    {/* Header accent */}
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50" />

                    <div className="flex justify-center mb-8">
                        <div className="h-12 w-12 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20 rotate-3 transition-transform hover:rotate-0">
                            <Lock className="h-6 w-6 text-white" />
                        </div>
                    </div>

                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-black tracking-tight text-foreground">Secure Reset</h1>
                        <p className="text-muted-foreground mt-2">Recover access with a new identity</p>
                    </div>

                    <Suspense fallback={
                        <div className="flex flex-col items-center justify-center py-12 space-y-6">
                            <Loader2 className="h-12 w-12 animate-spin text-primary opacity-50" />
                            <p className="text-sm font-medium text-muted-foreground animate-pulse">Establishing Secure Tunnel...</p>
                        </div>
                    }>
                        <ResetPasswordForm />
                    </Suspense>
                </div>

                <p className="text-center mt-8 text-sm text-muted-foreground">
                    Your security is our highest priority at Postpipe.
                </p>
            </div>
        </div>
    );
}
