"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Check, Copy, ExternalLink, Terminal, ArrowRight, ShieldCheck, Server, AlertCircle, Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RainbowButton } from "@/components/ui/rainbow-button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "@/hooks/use-toast";
import NewFormClient from "@/components/dashboard/new-form-client";
import { registerConnectorAction, finalizeConnectorAction } from "@/app/actions/register";

export default function StaticConnectorClient() {
    const { user } = useAuth();

    // State
    const [step, setStep] = useState(1); // 1: Generate, 2: Deploy, 3: Connect
    const [connectorName, setConnectorName] = useState("");
    const [connectorData, setConnectorData] = useState<{ id: string; secret: string } | null>(null);
    const [deploymentUrl, setDeploymentUrl] = useState("");
    const [hasForked, setHasForked] = useState(false);

    const [isLoading, setIsLoading] = useState(false);
    const [showSecret, setShowSecret] = useState(false);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [isDashboardReady, setIsDashboardReady] = useState(false);

    // Load state from local storage
    useEffect(() => {
        if (user?.email) {
            const storedStep = localStorage.getItem(`pp_setup_step_${user.email}`);
            const storedData = localStorage.getItem(`pp_connector_data_${user.email}`);

            if (storedStep) setStep(parseInt(storedStep));
            if (storedData) setConnectorData(JSON.parse(storedData));
            if (storedStep === "4") setIsDashboardReady(true);
        }
    }, [user]);

    // Persist state
    const saveState = (newStep: number, data?: any) => {
        if (user?.email) {
            localStorage.setItem(`pp_setup_step_${user.email}`, newStep.toString());
            if (data) localStorage.setItem(`pp_connector_data_${user.email}`, JSON.stringify(data));
        }
        setStep(newStep);
        if (data) setConnectorData(data);
    };

    // Step 1: Generate Credentials
    const handleGenerate = async () => {
        if (!connectorName) {
            toast({ title: "Name Required", description: "Please give your connector a name.", variant: "destructive" });
            return;
        }

        setIsLoading(true);
        const FormDataObj = new FormData();
        FormDataObj.append('name', connectorName);

        const res = await registerConnectorAction(FormDataObj);
        setIsLoading(false);

        if (res.success && res.connectorId && res.connectorSecret) {
            const data = { id: res.connectorId, secret: res.connectorSecret };
            saveState(2, data);
            toast({ title: "Credentials Generated", description: "Now copy them to Vercel." });
        } else {
            toast({ title: "Error", description: res.error || "Failed to generate", variant: "destructive" });
        }
    };

    // Step 3: Connect
    const handleConnect = async () => {
        if (!deploymentUrl || !connectorData) return;

        setIsLoading(true);
        const res = await finalizeConnectorAction(connectorData.id, deploymentUrl);
        setIsLoading(false);

        if (res.success) {
            saveState(4); // 4 = Complete
            setIsDashboardReady(true);
            toast({ title: "Connected!", description: "Your connector is live." });
        } else {
            toast({ title: "Connection Failed", description: res.error, variant: "destructive" });
        }
    };

    const copyToClipboard = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        toast({ title: "Copied!", description: `${label} copied to clipboard.` });
    };

    if (showCreateForm) {
        return (
            <div className="pt-20 px-8">
                <NewFormClient onBack={() => setShowCreateForm(false)} />
            </div>
        );
    }

    return (
        <div className="min-h-screen w-full bg-background text-foreground flex flex-col items-center pt-32 pb-12 px-4 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="max-w-3xl w-full text-center mb-12 space-y-4">
                <Badge variant="outline" className="mb-2 bg-primary/10 text-primary border-primary/20">
                    Setup Wizard
                </Badge>
                <h1 className="text-3xl md:text-4xl font-bold tracking-tight font-headline">
                    Connect Your Database
                </h1>
                <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                    Three simple steps to deploy your private connector.
                </p>
            </div>

            {/* Main Card */}
            <div className="max-w-2xl w-full bg-card border rounded-xl shadow-sm overflow-hidden relative">

                {/* Progress Bar */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-muted">
                    <div
                        className="h-full bg-primary transition-all duration-500 ease-in-out"
                        style={{ width: isDashboardReady ? '100%' : `${(step / 3) * 100}%` }}
                    />
                </div>

                <div className="p-8 space-y-8">

                    {/* Step 1: Generate */}
                    <div className={cn("space-y-4 transition-opacity duration-300", step !== 1 && "opacity-50 pointer-events-none hidden")}>
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">1</div>
                            <h3 className="text-xl font-semibold">Generate Credentials</h3>
                        </div>
                        <p className="text-muted-foreground pl-14">
                            First, let's create a secure identity for your connector.
                        </p>
                        <div className="pl-14 space-y-4">
                            <div className="grid gap-2">
                                <label className="text-sm font-medium">Connector Name</label>
                                <Input
                                    placeholder="e.g. My Production DB"
                                    value={connectorName}
                                    onChange={e => setConnectorName(e.target.value)}
                                />
                            </div>
                            <Button onClick={handleGenerate} disabled={isLoading} className="w-full">
                                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Generate Credentials"}
                            </Button>
                        </div>
                    </div>

                    {/* Step 2: Deploy */}
                    <div className={cn("space-y-6 transition-opacity duration-300", step !== 2 && "opacity-50 pointer-events-none hidden")}>
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">2</div>
                            <h3 className="text-xl font-semibold">Deploy to Cloud</h3>
                        </div>

                        <div className="pl-14 space-y-6">
                            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-5">
                                <h4 className="font-semibold text-amber-600 mb-2 flex items-center gap-2">
                                    <ShieldCheck className="h-4 w-4" /> Important: Copy Credentials
                                </h4>
                                <p className="text-xs text-amber-600/90 mb-4">
                                    You will need to paste these into Vercel/Azure during deployment. Make sure to also add your **Database Connection String** (e.g., `MONGODB_URI` or `POSTGRES_URL`) and set the install command to `npm install`.
                                </p>

                                {connectorData && (
                                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
                                        <div className="bg-muted/40 rounded-xl p-5 border border-dashed relative group border-primary/10">
                                            <div className="flex items-center justify-between mb-3">
                                                <h4 className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground flex items-center gap-2">
                                                    <Terminal className="h-3.5 w-3.5" /> Env Vars
                                                </h4>
                                                <Badge variant="outline" className="text-[9px] bg-primary/5 text-primary border-primary/10">
                                                    Vercel Friendly
                                                </Badge>
                                            </div>
                                            <div className="relative">
                                                <pre className="text-[11px] font-mono leading-relaxed text-muted-foreground overflow-x-auto bg-background/80 p-4 rounded-lg border border-primary/5">
                                                    {`POSTPIPE_CONNECTOR_ID=${connectorData.id}\n`}
                                                    {`POSTPIPE_CONNECTOR_SECRET=`}
                                                    {showSecret ? connectorData.secret : "sk_live_•••••••••••••••••••••"}
                                                </pre>
                                                <div className="absolute top-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Button size="icon" variant="ghost" className="h-7 w-7 hover:bg-primary/10" onClick={() => setShowSecret(!showSecret)}>
                                                        {showSecret ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                                                    </Button>
                                                    <Button size="icon" variant="ghost" className="h-7 w-7 hover:bg-primary/10" onClick={() => copyToClipboard(`POSTPIPE_CONNECTOR_ID=${connectorData.id}\nPOSTPIPE_CONNECTOR_SECRET=${connectorData.secret}`, "Credentials")}>
                                                        <Copy className="h-3.5 w-3.5" />
                                                    </Button>
                                                </div>
                                            </div>
                                            <p className="text-[10px] mt-4 text-amber-600/70 italic border-t border-amber-500/10 pt-3 flex items-center gap-2">
                                                <ShieldCheck className="h-3.5 w-3.5" />
                                                Database types (Mongo/Postgres) are now resolved per-form in the Dashboard.
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <h4 className="text-sm font-medium">Deployment Pipeline</h4>

                                    {/* Step 1: Fork */}
                                    <div className={cn(
                                        "relative overflow-hidden rounded-xl border p-4 transition-all duration-300",
                                        hasForked ? "bg-muted/40 border-muted" : "bg-card border-primary ring-1 ring-primary/20 shadow-lg"
                                    )}>
                                        <div className="flex items-center gap-4">
                                            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#24292e] text-white shadow-sm">
                                                <svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="0" className="h-7 w-7"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" /></svg>
                                            </div>
                                            <div className="flex-1 space-y-1">
                                                <p className="font-semibold text-base leading-none">Fork Repository</p>
                                                <p className="text-sm text-muted-foreground">
                                                    Clone the template to your GitHub account.
                                                </p>
                                            </div>
                                            <Button
                                                onClick={() => {
                                                    setHasForked(true);
                                                    window.open("https://github.com/Sourodip-1/postpipe-connector-template", "_blank");
                                                }}
                                                size="lg"
                                                variant={hasForked ? "outline" : "default"}
                                                className={cn("gap-2 min-w-[120px] transition-all", !hasForked && "shadow-md hover:shadow-lg hover:scale-105")}
                                            >
                                                {hasForked ? (
                                                    <><Check className="h-4 w-4" /> Forked</>
                                                ) : (
                                                    <>Fork Now <ArrowRight className="h-4 w-4" /></>
                                                )}
                                            </Button>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h4 className={cn("text-sm font-medium transition-colors", !hasForked && "text-muted-foreground")}>
                                            Select Deployment Target
                                        </h4>
                                        {!hasForked && (
                                            <Badge variant="outline" className="text-muted-foreground bg-muted/50">Locked</Badge>
                                        )}
                                    </div>

                                    <div className={cn("grid grid-cols-2 gap-4 transition-all duration-500", !hasForked && "opacity-40 grayscale pointer-events-none blur-[1px]")}>
                                        {/* Vercel */}
                                        <a
                                            href="https://vercel.com/new"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="group relative flex flex-col items-center gap-3 rounded-xl border bg-card p-6 text-center shadow-sm transition-all hover:border-black hover:shadow-lg hover:-translate-y-1"
                                        >
                                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-black text-white shadow-md group-hover:scale-110 transition-transform duration-300">
                                                <svg viewBox="0 0 76 65" fill="currentColor" className="h-6 w-6"><path d="M37.5274 0L75.0548 65H0L37.5274 0Z" /></svg>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="font-semibold text-base">Vercel</p>
                                                <p className="text-xs text-muted-foreground">Recommended Serverless</p>
                                            </div>
                                            {/* Hover indicator */}
                                            <div className="absolute inset-0 rounded-xl border-2 border-black opacity-0 group-hover:opacity-10 transition-opacity pointer-events-none" />
                                        </a>

                                        {/* Azure */}
                                        <a
                                            href="https://portal.azure.com/#create/Microsoft.WebSite"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="group relative flex flex-col items-center gap-3 rounded-xl border bg-card p-6 text-center shadow-sm transition-all hover:border-[#0078D4] hover:shadow-lg hover:-translate-y-1"
                                        >
                                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#0078D4]/10 text-[#0078D4] group-hover:bg-[#0078D4] group-hover:text-white transition-all duration-300">
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-7 w-7"><path d="M20 17.58A5 5 0 0 0 18 8h-1.26A8 8 0 1 0 4 16.25" /><line x1="8" y1="16" x2="8.01" y2="16" /><line x1="8" y1="20" x2="8.01" y2="20" /><line x1="12" y1="18" x2="12.01" y2="18" /><line x1="12" y1="22" x2="12.01" y2="22" /><line x1="16" y1="16" x2="16.01" y2="16" /><line x1="16" y1="20" x2="16.01" y2="20" /></svg>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="font-semibold text-base">Azure / Cloud</p>
                                                <p className="text-xs text-muted-foreground">Container / Node.js</p>
                                            </div>
                                            <div className="absolute inset-0 rounded-xl border-2 border-[#0078D4] opacity-0 group-hover:opacity-10 transition-opacity pointer-events-none" />
                                        </a>
                                    </div>
                                    {!hasForked && (
                                        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground animate-pulse py-2">
                                            <AlertCircle className="h-3 w-3" /> Fork the repository above to unlock deployment options
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex gap-2 pt-4">
                                <Button variant="ghost" onClick={() => setStep(1)}>
                                    Back
                                </Button>
                                <Button variant="outline" className="flex-1" onClick={() => setStep(3)}>
                                    I have deployed it <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Step 3: Connect */}
                    <div className={cn("space-y-4 transition-opacity duration-300", step !== 3 && "opacity-50 pointer-events-none hidden")}>
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">3</div>
                            <h3 className="text-xl font-semibold">Final Connection</h3>
                        </div>
                        <p className="text-muted-foreground pl-14">
                            Paste the URL provided by Vercel (e.g. https://postpipe-connector.vercel.app).
                        </p>
                        <div className="pl-14 space-y-4">
                            <Input
                                placeholder="https://..."
                                value={deploymentUrl}
                                onChange={e => setDeploymentUrl(e.target.value)}
                            />
                            <div className="flex gap-2">
                                <Button variant="outline" onClick={() => setStep(2)}>Back</Button>
                                <Button onClick={handleConnect} disabled={isLoading} className="flex-1">
                                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Connect Instance"}
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Completion State */}
                    {isDashboardReady && (
                        <div className="text-center space-y-6 pt-4 animate-in fade-in zoom-in">
                            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Check className="h-8 w-8" />
                            </div>
                            <h3 className="text-2xl font-bold">You're All Set!</h3>
                            <p className="text-muted-foreground">
                                Your private connector is now active and ready to handle submissions.
                            </p>
                            <div className="flex flex-col gap-3 pt-4">
                                <RainbowButton onClick={() => setShowCreateForm(true)}>
                                    Create Your First Form
                                </RainbowButton>
                                <Button variant="ghost" onClick={() => {
                                    if (user?.email) {
                                        localStorage.removeItem(`pp_setup_step_${user.email}`); // Reset
                                        setIsDashboardReady(false);
                                        setStep(1);
                                        setConnectorData(null);
                                    }
                                }}>
                                    Setup Another Connector
                                </Button>
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}
