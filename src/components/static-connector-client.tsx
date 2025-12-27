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
                            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4">
                                <h4 className="font-semibold text-amber-600 mb-2 flex items-center gap-2">
                                    <ShieldCheck className="h-4 w-4" /> Important: Copy These First
                                </h4>
                                <p className="text-sm text-amber-600/90 mb-4">
                                    You will need to paste these into Vercel/Azure during deployment.
                                </p>

                                {connectorData && (
                                    <div className="space-y-3 bg-background/50 p-3 rounded border">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-mono text-muted-foreground">POSTPIPE_CONNECTOR_ID</span>
                                            <div className="flex items-center gap-2">
                                                <code className="text-xs font-mono bg-muted px-2 py-1 rounded">{connectorData.id}</code>
                                                <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => copyToClipboard(connectorData.id, "ID")}><Copy className="h-3 w-3" /></Button>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-mono text-muted-foreground">POSTPIPE_CONNECTOR_SECRET</span>
                                            <div className="flex items-center gap-2">
                                                <code className="text-xs font-mono bg-muted px-2 py-1 rounded">
                                                    {showSecret ? connectorData.secret : "••••••••••••••••"}
                                                </code>
                                                <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setShowSecret(!showSecret)}>
                                                    {showSecret ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                                                </Button>
                                                <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => copyToClipboard(connectorData.secret, "Secret")}><Copy className="h-3 w-3" /></Button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-2">
                                <p className="text-sm font-medium">Click below to deploy (keep this tab open!)</p>
                                <div className="flex gap-4">
                                    <a
                                        href={`https://vercel.com/new/clone?repository-url=https://github.com/Sourodip-1/postpipe-connector-template&project-name=postpipe-connector&repository-name=postpipe-connector&env=POSTPIPE_CONNECTOR_ID,POSTPIPE_CONNECTOR_SECRET,MONGODB_URI&envDescription=Paste_Credentials_From_PostPipe&envLink=${encodeURIComponent('https://postpipe.in/dashboard')}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex-1 flex items-center justify-center gap-2 bg-black text-white hover:bg-neutral-800 rounded-md p-3 transition-colors text-sm font-medium"
                                    >
                                        <svg viewBox="0 0 76 65" fill="currentColor" className="h-4 w-4"><path d="M37.5274 0L75.0548 65H0L37.5274 0Z" /></svg>
                                        Deploy to Vercel
                                    </a>
                                </div>
                            </div>

                            <Button variant="outline" className="w-full" onClick={() => setStep(3)}>
                                I have deployed it <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
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
