"use client";

import React from "react";
import Link from "next/link";
import { Zap, Terminal, ArrowRight, ShieldCheck, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { GlowingEffect } from "@/components/ui/glowing-effect";

export function PathSelection() {
    return (
        <section id="choose-path" className="py-24 bg-background relative overflow-hidden">
            <div className="container mx-auto px-4 relative z-10">
                <div className="text-center mb-16">
                    <h2 className="text-4xl md:text-5xl font-black mb-4 tracking-tight">Choose Your <span className="text-primary">Path</span></h2>
                    <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                        Whether you're connecting an existing database or building a new backend from scratch, PostPipe has you covered.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                    {/* Static Path */}
                    <div className="relative group">
                        <div className="relative h-full rounded-[2rem] border border-border bg-card/50 backdrop-blur-sm p-8 flex flex-col gap-6 transition-all hover:border-primary/50 overflow-hidden">
                            <GlowingEffect
                                spread={60}
                                glow={true}
                                disabled={false}
                                proximity={64}
                                inactiveZone={0.01}
                                borderWidth={3}
                            />
                            <div className="relative z-10">
                                <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-6">
                                    <Zap className="h-8 w-8 text-blue-500" />
                                </div>
                                <h3 className="text-2xl font-bold mb-3">Static (The Connector)</h3>
                                <p className="text-muted-foreground mb-6">
                                    Connect your existing MongoDB or PostgreSQL database to PostPipe. Ideal for adding forms and data ingest to your current applications.
                                </p>
                                <ul className="space-y-3 mb-8">
                                    <li className="flex items-center gap-3 text-sm text-foreground/80">
                                        <div className="h-5 w-5 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                                            <ShieldCheck className="h-3 w-3 text-emerald-500" />
                                        </div>
                                        Secure Signature Verification
                                    </li>
                                    <li className="flex items-center gap-3 text-sm text-foreground/80">
                                        <div className="h-5 w-5 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                                            <ShieldCheck className="h-3 w-3 text-emerald-500" />
                                        </div>
                                        Zero-Trust Architecture
                                    </li>
                                    <li className="flex items-center gap-3 text-sm text-foreground/80">
                                        <div className="h-5 w-5 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                                            <ShieldCheck className="h-3 w-3 text-emerald-500" />
                                        </div>
                                        Instant API Endpoints
                                    </li>
                                </ul>
                                <Link href="/static">
                                    <Button className="w-full h-12 text-lg font-bold gap-2 group-hover:gap-3 transition-all">
                                        Get Started with Static <ArrowRight className="h-5 w-5" />
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </div>

                    {/* Dynamic Path */}
                    <div className="relative group">
                        <div className="relative h-full rounded-[2rem] border border-border bg-card/50 backdrop-blur-sm p-8 flex flex-col gap-6 transition-all hover:border-primary/50 overflow-hidden">
                            <GlowingEffect
                                spread={60}
                                glow={true}
                                disabled={false}
                                proximity={64}
                                inactiveZone={0.01}
                                borderWidth={3}
                            />
                            <div className="relative z-10">
                                <div className="w-14 h-14 rounded-2xl bg-violet-500/10 flex items-center justify-center mb-6">
                                    <Rocket className="h-8 w-8 text-violet-500" />
                                </div>
                                <h3 className="text-2xl font-bold mb-3">Dynamic (CLI Components)</h3>
                                <p className="text-muted-foreground mb-6">
                                    Scaffold full-featured Next.js backends with our CLI. perfect for new projects requiring auth, databases, and more.
                                </p>
                                <ul className="space-y-3 mb-8">
                                    <li className="flex items-center gap-3 text-sm text-foreground/80">
                                        <div className="h-5 w-5 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                                            <Terminal className="h-3 w-3 text-emerald-500" />
                                        </div>
                                        CLI-First Workflow
                                    </li>
                                    <li className="flex items-center gap-3 text-sm text-foreground/80">
                                        <div className="h-5 w-5 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                                            <Terminal className="h-3 w-3 text-emerald-500" />
                                        </div>
                                        Modular Components
                                    </li>
                                    <li className="flex items-center gap-3 text-sm text-foreground/80">
                                        <div className="h-5 w-5 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                                            <Terminal className="h-3 w-3 text-emerald-500" />
                                        </div>
                                        Ready-to-Deploy Templates
                                    </li>
                                </ul>
                                <Link href="/explore">
                                    <Button variant="outline" className="w-full h-12 text-lg font-bold gap-2 group-hover:gap-3 transition-all">
                                        Explore CLI Forge <ArrowRight className="h-5 w-5" />
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Background elements */}
            <div className="absolute top-1/2 left-0 w-64 h-64 bg-blue-500/5 blur-[120px] rounded-full -translate-y-1/2" />
            <div className="absolute top-1/2 right-0 w-64 h-64 bg-violet-500/5 blur-[120px] rounded-full -translate-y-1/2" />
        </section>
    );
}
