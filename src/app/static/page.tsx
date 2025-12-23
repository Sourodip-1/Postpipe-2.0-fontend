"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Copy, ExternalLink, Terminal, ArrowRight, ShieldCheck, Server } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default function StaticConnectorPage() {
    const [copied, setCopied] = useState(false);
    const command = "npx create-postpipe-connector";

    const handleCopy = () => {
        navigator.clipboard.writeText(command);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="min-h-screen w-full bg-background text-foreground flex flex-col items-center pt-32 pb-12 px-4 sm:px-6 lg:px-8">

            {/* SECTION 1: Title & Context */}
            <div className="max-w-3xl w-full text-center mb-12 space-y-4">
                <Badge variant="outline" className="mb-2 bg-primary/10 text-primary border-primary/20">
                    Prerequisite
                </Badge>
                <h1 className="text-3xl md:text-4xl font-bold tracking-tight font-headline">
                    Set up your PostPipe Connector
                </h1>
                <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                    PostPipe Static requires a connector deployed in your infrastructure.
                    This connector owns your database credentials. <span className="text-foreground font-medium">PostPipe never sees them.</span>
                </p>
            </div>

            <div className="max-w-3xl w-full space-y-8">

                {/* SECTION 2: Step-by-Step Setup */}
                <div className="relative">
                    {/* Vertical Line */}
                    <div className="absolute left-6 top-4 bottom-4 w-px bg-border md:left-8 z-0"></div>

                    {/* Step 1: Deploy CLI */}
                    <div className="relative z-10 flex gap-6 mb-12">
                        <div className="flex-shrink-0 w-12 h-12 md:w-16 md:h-16 rounded-full bg-background border flex items-center justify-center font-mono font-bold text-lg md:text-xl shadow-sm">
                            1
                        </div>
                        <div className="flex-1 pt-2">
                            <h3 className="text-xl font-semibold mb-2">Generate Connector Locally</h3>
                            <p className="text-muted-foreground mb-6">
                                Run this command locally to scaffold a new PostPipe connector project.
                            </p>

                            <div className="bg-zinc-950 rounded-lg border border-zinc-800 p-4 font-mono text-sm flex items-center justify-between group">
                                <div className="flex items-center gap-3 text-zinc-100">
                                    <Terminal className="h-4 w-4 text-zinc-500" />
                                    <span>{command}</span>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-zinc-500 hover:text-white hover:bg-zinc-800"
                                    onClick={handleCopy}
                                >
                                    {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                                </Button>
                            </div>

                            <div className="flex gap-4 mt-6">
                                <Button variant="outline" size="sm" className="gap-2 text-muted-foreground" asChild>
                                    <Link href="https://vercel.com/docs/deployments/overview" target="_blank">
                                        Vercel Deployment Docs <ExternalLink className="h-3 w-3" />
                                    </Link>
                                </Button>
                                <Button variant="outline" size="sm" className="gap-2 text-muted-foreground" asChild>
                                    <Link href="https://learn.microsoft.com/en-us/azure/app-service/quickstart-nodejs" target="_blank">
                                        Azure Deployment Docs <ExternalLink className="h-3 w-3" />
                                    </Link>
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Step 2: Deploy to Platform */}
                    <div className="relative z-10 flex gap-6 mb-12">
                        <div className="flex-shrink-0 w-12 h-12 md:w-16 md:h-16 rounded-full bg-background border flex items-center justify-center font-mono font-bold text-lg md:text-xl shadow-sm">
                            2
                        </div>
                        <div className="flex-1 pt-2">
                            <h3 className="text-xl font-semibold mb-2">Deploy to Your Cloud</h3>
                            <p className="text-muted-foreground mb-4">
                                Deploy the generated connector to Vercel, Azure, or AWS.
                                Once deployed, you will receive a public URL.
                            </p>

                            <div className="bg-muted/50 rounded-md border p-3">
                                <div className="text-xs text-muted-foreground uppercase font-semibold mb-1 tracking-wider">Example Output URL</div>
                                <div className="font-mono text-sm text-foreground">https://postpipe-connector-yourname.vercel.app</div>
                            </div>
                        </div>
                    </div>

                    {/* Step 3: Copy URL */}
                    <div className="relative z-10 flex gap-6">
                        <div className="flex-shrink-0 w-12 h-12 md:w-16 md:h-16 rounded-full bg-background border flex items-center justify-center font-mono font-bold text-lg md:text-xl shadow-sm">
                            3
                        </div>
                        <div className="flex-1 pt-2">
                            <h3 className="text-xl font-semibold mb-2">Copy Your Connector URL</h3>
                            <p className="text-muted-foreground mb-4">
                                Copy the deployment URL. You’ll register it in PostPipe in the next step.
                            </p>

                            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 flex items-start gap-3 mb-4">
                                <ShieldCheck className="h-5 w-5 text-amber-500 mt-0.5" />
                                <div className="text-sm text-amber-500/90">
                                    <strong>Security Note:</strong> No database credentials are shared at this step. PostPipe only needs the URL to communicate with your connector properly.
                                </div>
                            </div>
                        </div>
                    </div>

                </div>

                <Separator className="my-12" />

                {/* SECTION 3: Continue to Dashboard */}
                <div className="text-center space-y-6 bg-card border rounded-xl p-8 shadow-sm">
                    <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                        <Server className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <h3 className="text-2xl font-bold mb-2">Ready to Register?</h3>
                        <p className="text-muted-foreground max-w-lg mx-auto">
                            Once you have your connector URL, proceed to the dashboard to generate your Connector ID & Secret.
                        </p>
                    </div>

                    <Button size="lg" className="w-full sm:w-auto min-w-[240px] gap-2 text-base h-12" asChild>
                        <Link href="/dashboard/connectors">
                            Go to Connector Dashboard <ArrowRight className="h-4 w-4" />
                        </Link>
                    </Button>
                </div>

            </div>
        </div>
    );
}
