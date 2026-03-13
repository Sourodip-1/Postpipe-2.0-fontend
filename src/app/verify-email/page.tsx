"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { CheckCircle2, AlertCircle, Loader2, ArrowRight, Mail, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

function VerifyEmailLogic() {
    const searchParams = useSearchParams();
    const token = searchParams.get("token");

    const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
    const [errorMessage, setErrorMessage] = useState("");

    useEffect(() => {
        if (!token) {
            setStatus("error");
            setErrorMessage("Verification token is missing from the URL.");
            return;
        }

        const verifyEmail = async () => {
            try {
                const apiUrl = process.env.NEXT_PUBLIC_CONNECTOR_URL || "http://localhost:5501";
                const response = await fetch(`${apiUrl}/api/auth/verify-email`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ token, targetDatabase: "default" })
                });

                const data = await response.json();
                if (!response.ok) throw new Error(data.message || "Failed to verify email.");
                setStatus("success");
            } catch (error: any) {
                setStatus("error");
                setErrorMessage(error.message);
            }
        };

        verifyEmail();
    }, [token]);

    return (
        <AnimatePresence mode="wait">
            {status === "loading" && (
                <motion.div
                    key="loading"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="text-center space-y-6 py-8"
                >
                    <div className="relative mx-auto w-20 h-20">
                        <div className="absolute inset-0 rounded-full border-4 border-primary/20 animate-pulse" />
                        <Loader2 className="h-20 w-20 animate-spin text-primary relative z-10" />
                    </div>
                    <div>
                        <h3 className="text-2xl font-bold tracking-tight text-foreground">Verifying Identity</h3>
                        <p className="text-muted-foreground mt-2">Securing your account in the cloud...</p>
                    </div>
                    <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                        <motion.div
                            className="h-full bg-primary"
                            initial={{ width: "0%" }}
                            animate={{ width: "100%" }}
                            transition={{ duration: 2, repeat: Infinity }}
                        />
                    </div>
                </motion.div>
            )}

            {status === "error" && (
                <motion.div
                    key="error"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center space-y-6 py-4"
                >
                    <div className="bg-destructive/10 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-2 border border-destructive/20">
                        <AlertCircle className="h-10 w-10 text-destructive" />
                    </div>
                    <div>
                        <h3 className="text-2xl font-bold tracking-tight text-foreground">Verification Failed</h3>
                        <p className="text-destructive/80 font-medium mt-2 p-3 bg-destructive/5 rounded-lg border border-destructive/10 inline-block text-sm">
                            {errorMessage}
                        </p>
                    </div>
                    <p className="text-muted-foreground text-sm max-w-sm mx-auto">
                        This link may have expired or was already used. Please try requesting a new one.
                    </p>
                    <div className="pt-4 flex flex-col gap-3">
                        <Link href="/" className="w-full">
                            <Button variant="outline" className="w-full h-12 rounded-xl text-md font-semibold">
                                Request New Link
                            </Button>
                        </Link>
                        <Link href="/" className="w-full">
                            <Button variant="ghost" className="w-full h-12 rounded-xl text-muted-foreground hover:text-foreground">
                                Back to Postpipe
                            </Button>
                        </Link>
                    </div>
                </motion.div>
            )}

            {status === "success" && (
                <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center space-y-6 py-4"
                >
                    <div className="bg-green-500/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-2 border-4 border-green-500/20 relative">
                        <motion.div
                            className="absolute inset-0 rounded-full bg-green-500/10"
                            animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
                            transition={{ duration: 2, repeat: Infinity }}
                        />
                        <CheckCircle2 className="h-12 w-12 text-green-500 relative z-10" />
                    </div>
                    <div>
                        <h3 className="text-2xl font-bold tracking-tight text-foreground">Account Verified</h3>
                        <p className="text-muted-foreground mt-2 text-sm">Welcome to the future of Postpipe authentication.</p>
                    </div>
                    <div className="p-4 bg-secondary/30 rounded-2xl border border-border/50 text-left space-y-3">
                        <div className="flex items-center gap-3 text-sm font-medium text-foreground">
                            <ShieldCheck className="h-4 w-4 text-primary" />
                            Email securely confirmed
                        </div>
                        <div className="flex items-center gap-3 text-sm font-medium text-foreground">
                            <Mail className="h-4 w-4 text-primary" />
                            Authentication activated
                        </div>
                    </div>
                    <Link href="/" className="block pt-4">
                        <Button className="h-12 w-full rounded-xl text-md font-bold shadow-lg shadow-primary/20 group">
                            Enter Dashboard
                            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                        </Button>
                    </Link>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

export default function VerifyEmailPage() {
    return (
        <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background flex flex-col items-center justify-center p-6 selection:bg-primary/20">
            <div className="w-full max-w-md relative">
                {/* Decorative background blur */}
                <div className="absolute -top-24 -left-24 w-64 h-64 bg-primary/20 rounded-full blur-3xl opacity-50 transition-all" />
                <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl opacity-50 transition-all" />

                <div className="relative bg-card/80 backdrop-blur-xl border border-border/50 rounded-[2rem] shadow-2xl p-10 overflow-hidden">
                    {/* Header accent */}
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50" />

                    <div className="flex justify-center mb-8">
                        <div className="h-12 w-12 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20 rotate-3 transition-transform hover:rotate-0">
                            <span className="text-2xl font-black text-white italic">P</span>
                        </div>
                    </div>

                    <Suspense fallback={
                        <div className="flex flex-col items-center justify-center py-12 space-y-6">
                            <Loader2 className="h-12 w-12 animate-spin text-primary opacity-50" />
                            <p className="text-sm font-medium text-muted-foreground animate-pulse">Initializing Security Protocol...</p>
                        </div>
                    }>
                        <VerifyEmailLogic />
                    </Suspense>
                </div>

                <p className="text-center mt-8 text-sm text-muted-foreground">
                    &copy; 2026 Postpipe. Built with precision and care.
                </p>
            </div>
        </div>
    );
}
