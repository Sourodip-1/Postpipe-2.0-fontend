"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
    Server, FileText, Key, Activity, Terminal, Zap, Shield,
    ArrowRight, Plus, Database, Globe, GitBranch, Clock,
    TrendingUp, ChevronRight, ExternalLink, Rocket, Check
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { ParticleDashboardHeader } from "@/components/ui/particle-dashboard-header";

interface OverviewClientProps {
    forms: any[];
    connectors: any[];
    systems: any[];
    authPresets: any[];
}

export default function OverviewClient({ forms, connectors, systems = [], authPresets = [] }: OverviewClientProps) {


    const recentForms = [...forms]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5);

    const stats = [
        {
            label: "Backend Systems",
            value: systems.length,
            sub: "Active systems",
            icon: Server,
            color: "text-violet-500 dark:text-violet-400",
            bg: "bg-violet-500/10 dark:bg-violet-500/10",
            border: "border-violet-200 dark:border-violet-500/20",
            glow: "shadow-violet-500/10",
            href: "/dashboard/systems",
            trend: "+2 this week",
        },
        {
            label: "Static Forms",
            value: forms.length,
            sub: "Live endpoints",
            icon: FileText,
            color: "text-blue-500 dark:text-blue-400",
            bg: "bg-blue-500/10",
            border: "border-blue-200 dark:border-blue-500/20",
            glow: "shadow-blue-500/10",
            href: "/dashboard/forms",
            trend: `${forms.filter((f: any) => f.status === "Live").length} live`,
        },
        {
            label: "Connectors",
            value: connectors.length,
            sub: "Connected apps",
            icon: Database,
            color: "text-emerald-500 dark:text-emerald-400",
            bg: "bg-emerald-500/10",
            border: "border-emerald-200 dark:border-emerald-500/20",
            glow: "shadow-emerald-500/10",
            href: "/dashboard/connectors",
            trend: "All healthy",
        },
        {
            label: "Auth Presets",
            value: authPresets.length,
            sub: "Custom auth flows",
            icon: Shield,
            color: "text-amber-500 dark:text-amber-400",
            bg: "bg-amber-500/10",
            border: "border-amber-200 dark:border-amber-500/20",
            glow: "shadow-amber-500/10",
            href: "/dashboard/forms?tab=presets",
            trend: "All secure",
        },
    ];

    const actions = [
        {
            label: "New Backend System",
            desc: "Launch from a production-ready template",
            icon: Server,
            iconBg: "bg-violet-500/10 dark:bg-violet-500/10",
            iconColor: "text-violet-500",
            hoverBorder: "hover:border-violet-300 dark:hover:border-violet-500/30",
            hoverBg: "hover:bg-violet-50/50 dark:hover:bg-violet-500/5",
            href: "/explore",
        },
        {
            label: "Create Static Form",
            desc: "Collect data without a backend",
            icon: FileText,
            iconBg: "bg-blue-500/10",
            iconColor: "text-blue-500",
            hoverBorder: "hover:border-blue-300 dark:hover:border-blue-500/30",
            hoverBg: "hover:bg-blue-50/50 dark:hover:bg-blue-500/5",
            href: "/dashboard/forms/new",
        },
        {
            label: "Generate Connector",
            desc: "Plug in any external data source",
            icon: Zap,
            iconBg: "bg-amber-500/10",
            iconColor: "text-amber-500",
            hoverBorder: "hover:border-amber-300 dark:hover:border-amber-500/30",
            hoverBg: "hover:bg-amber-50/50 dark:hover:bg-amber-500/5",
            href: "/dashboard/connectors",
        },
        {
            label: "Generate Auth Preset",
            desc: "Setup authentication in minutes",
            icon: Key,
            iconBg: "bg-purple-500/10",
            iconColor: "text-purple-500",
            hoverBorder: "hover:border-purple-300 dark:hover:border-purple-500/30",
            hoverBg: "hover:bg-purple-50/50 dark:hover:bg-purple-500/5",
            href: "/dashboard/forms?tab=presets&action=new-preset",
        },
    ] as any[];

    return (
        <div className="flex flex-col gap-10">
            <ParticleDashboardHeader
                title="Overview"
                subtitle="Welcome back! Here's what's happening with your infrastructure."
            />

            {/* ── Guided Setup ── */}
            {forms.length === 0 && (
                <div className="rounded-2xl border border-primary/20 bg-primary/5 p-6 md:p-8 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Rocket className="h-24 w-24 text-primary" />
                    </div>
                    <div className="relative z-10 max-w-2xl">
                        <h2 className="text-2xl font-bold mb-2 flex items-center gap-3">
                            🚀 Welcome to PostPipe! 
                            <span className="text-xs font-normal bg-primary/10 text-primary px-3 py-1 rounded-full uppercase tracking-wider">Newbie Guide</span>
                        </h2>
                        <p className="text-muted-foreground mb-6">
                            Let&apos;s get your infrastructure up and running. Follow these steps to create your first backend connection.
                        </p>
                        
                        <div className="grid sm:grid-cols-2 gap-4 mb-6">
                            {[
                                { title: "Step 1: Choose Path", desc: "Static Connector or Dynamic CLI", done: true },
                                { title: "Step 2: Initialize", desc: "Setup your first system", done: systems.length > 0 },
                                { title: "Step 3: Create Form", desc: "Map your frontend fields", done: forms.length > 0 },
                                { title: "Step 4: Go Live", desc: "Embed and collect data", done: false },
                            ].map((s, i) => (
                                <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-background/50 border border-border/50">
                                    <div className={cn(
                                        "h-6 w-6 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold",
                                        s.done ? "bg-emerald-500/20 text-emerald-500" : "bg-primary/20 text-primary"
                                    )}>
                                        {s.done ? <Check className="h-3 w-3" /> : i + 1}
                                    </div>
                                    <div>
                                        <div className="text-sm font-semibold leading-tight">{s.title}</div>
                                        <div className="text-[11px] text-muted-foreground">{s.desc}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        
                        <div className="flex flex-wrap gap-3">
                            <Link href="/static">
                                <Button className="gap-2 font-bold">
                                    Setup Static Connector <ArrowRight className="h-4 w-4" />
                                </Button>
                            </Link>
                            <Link href="/explore">
                                <Button variant="outline" className="gap-2 font-bold">
                                    Explore CLI Marketplace
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Stat Cards ── */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {stats.map((s) => (
                    <Link key={s.label} href={s.href} className="group">
                        <div className={cn(
                            "relative rounded-xl border p-5 flex flex-col gap-4",
                            "bg-card transition-all duration-200",
                            "hover:shadow-lg hover:-translate-y-0.5",
                            s.border, s.glow
                        )}>
                            {/* Icon + trend */}
                            <div className="flex items-start justify-between">
                                <div className={cn("rounded-lg p-2.5", s.bg)}>
                                    <s.icon className={cn("h-5 w-5", s.color)} />
                                </div>
                                <span className="text-[10px] font-semibold text-muted-foreground bg-muted rounded-full px-2 py-0.5">
                                    {s.trend}
                                </span>
                            </div>

                            {/* Value */}
                            <div>
                                <div className={cn("text-4xl font-black tabular-nums tracking-tighter", s.color)}>
                                    {s.value}
                                </div>
                                <div className="mt-1 text-sm font-semibold text-foreground">{s.label}</div>
                                <div className="text-xs text-muted-foreground mt-0.5">{s.sub}</div>
                            </div>

                            {/* Bottom link arrow */}
                            <div className={cn(
                                "flex items-center gap-1 text-[11px] font-medium transition-colors",
                                s.color,
                                "opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                            )}>
                                View all <ChevronRight className="h-3 w-3" />
                            </div>
                        </div>
                    </Link>
                ))}
            </div>

            {/* ── Quick Actions ── */}
            <div>
                <div className="flex items-center gap-2 mb-5">
                    <div className="h-5 w-1 rounded-full bg-primary/50" />
                    <h2 className="text-base font-bold tracking-tight">Quick Actions</h2>
                </div>
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                    {actions.map((a) => {
                        const inner = (
                            <div className={cn(
                                "group relative rounded-xl border border-border p-5 flex flex-col gap-4",
                                "bg-card transition-all duration-200 cursor-pointer",
                                "hover:shadow-md hover:-translate-y-0.5",
                                a.hoverBorder, a.hoverBg
                            )}>
                                <div className={cn("w-fit rounded-lg p-2.5", a.iconBg)}>
                                    <a.icon className={cn("h-5 w-5", a.iconColor)} />
                                </div>
                                <div className="flex-1">
                                    <div className="font-semibold text-sm text-foreground">{a.label}</div>
                                    <div className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{a.desc}</div>
                                </div>
                                <div className={cn(
                                    "flex items-center gap-1 text-xs font-medium",
                                    a.iconColor,
                                    "opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                                )}>
                                    {a.onClick ? "Copy command" : "Get started"} <ArrowRight className="h-3 w-3" />
                                </div>
                            </div>
                        );

                        return a.onClick ? (
                            <div key={a.label} onClick={a.onClick}>{inner}</div>
                        ) : (
                            <Link key={a.label} href={a.href!}>{inner}</Link>
                        );
                    })}
                </div>
            </div>

            {/* ── Recent Forms ── */}
            <div>
                <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-2">
                        <div className="h-5 w-1 rounded-full bg-primary/50" />
                        <h2 className="text-base font-bold tracking-tight">Recent Forms</h2>
                    </div>
                    <Link href="/dashboard/forms">
                        <Button variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-foreground gap-1">
                            View all <ExternalLink className="h-3 w-3" />
                        </Button>
                    </Link>
                </div>
                <div className="rounded-xl border border-border bg-card overflow-hidden">
                    {recentForms.length > 0 ? (
                        <div className="divide-y divide-border">
                            {recentForms.map((form, i) => (
                                <Link key={i} href={`/dashboard/forms`}>
                                    <div className="flex items-center justify-between px-5 py-3.5 hover:bg-muted/40 transition-colors group">
                                        <div className="flex items-center gap-3.5 min-w-0">
                                            <div className="rounded-lg bg-blue-500/10 p-2 flex-shrink-0">
                                                <FileText className="h-3.5 w-3.5 text-blue-500" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-semibold text-foreground truncate">{form.name}</p>
                                                <p className="text-xs text-muted-foreground truncate">ID: {form.id}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4 shrink-0 ml-4">
                                            <span className={cn(
                                                "hidden sm:inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest border",
                                                form.status === "Live"
                                                    ? "text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-500/20 bg-emerald-100 dark:bg-emerald-500/10"
                                                    : "text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-500/20 bg-amber-100 dark:bg-amber-500/10"
                                            )}>
                                                {form.status || "Live"}
                                            </span>
                                            <span className="text-xs text-muted-foreground tabular-nums">
                                                {new Date(form.createdAt).toLocaleDateString()}
                                            </span>
                                            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
                            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-muted border border-border">
                                <FileText className="h-6 w-6 text-muted-foreground" />
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-foreground">No forms yet</p>
                                <p className="text-xs text-muted-foreground mt-0.5">Create your first static form endpoint</p>
                            </div>
                            <Link href="/dashboard/forms/new">
                                <Button size="sm" className="gap-2 mt-1">
                                    <Plus className="h-3.5 w-3.5" /> New Form
                                </Button>
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
