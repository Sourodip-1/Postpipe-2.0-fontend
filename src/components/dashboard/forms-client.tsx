"use client";

import * as React from "react";
import Link from 'next/link';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { RainbowButton } from "@/components/ui/rainbow-button";
import { Input } from "@/components/ui/input";
import AuthPresetGenerator from "./auth-preset-generator";
import { Badge } from "@/components/ui/badge";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ToastAction } from "@/components/ui/toast";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Trash2, Copy, FileText, Plus, Database, Power, Code, Eye,
    MoreHorizontal, Edit, CopyPlus, PauseCircle, PlayCircle,
    Search, Filter, ArrowUpDown, ChevronDown, CheckCircle2,
    Activity, Play, Globe, Terminal, Zap, Shield, Settings2,
    ExternalLink
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useRouter, useSearchParams } from "next/navigation";
import { deleteFormAction, duplicateFormAction, toggleFormStatusAction, deleteAuthPresetAction } from "@/app/actions/dashboard";
import IsoLevelWarp from "@/components/ui/isometric-wave-grid-background";
import { FormSearchBar } from "@/components/ui/animated-search-bar";
import { motion, AnimatePresence } from "framer-motion";

type Form = {
    id: string;
    name: string;
    connectorName: string;
    submissions: number;
    lastSubmission: string;
    status: "Live" | "Paused";
    fields: any[];
};

interface FormsClientProps {
    initialForms: any[];
    initialPresets?: any[];
}

export default function FormsClient({ initialForms = [], initialPresets = [] }: FormsClientProps) {
    const router = useRouter();
    const [isCreatingPreset, setIsCreatingPreset] = React.useState(false);
    const [editingPreset, setEditingPreset] = React.useState<any | null>(null);
    const [presets, setPresets] = React.useState<any[]>(initialPresets);
    const [searchQuery, setSearchQuery] = React.useState("");
    const [statusFilter, setStatusFilter] = React.useState("all");
    const [dbFilter, setDbFilter] = React.useState("all");
    const [sortBy, setSortBy] = React.useState("name");
    const [expandedFormId, setExpandedFormId] = React.useState<string | null>(null);
    const [copiedId, setCopiedId] = React.useState<string | null>(null);
    const [searchExpanded, setSearchExpanded] = React.useState(false);
    const pendingDeletions = React.useRef<Record<string, any>>({});


    const searchParams = useSearchParams();

    React.useEffect(() => {
        const tab = searchParams.get('tab');
        if (tab === 'presets') {
            // Since we're using Radix/Shadcn Tabs, we might need to control the state if we want to programmatically switch.
            // But if we just want to open the 'isCreatingPreset' dialog if an action is specified:
            const action = searchParams.get('action');
            if (action === 'new-preset') {
                setIsCreatingPreset(true);
            }
        }
    }, [searchParams]);

    React.useEffect(() => { setPresets(initialPresets); }, [initialPresets]);

    const mapForms = (data: any[]): Form[] => data.map((f: any) => {
        const subCount = f.submissionCount !== undefined ? f.submissionCount : (f.submissions?.length || 0);
        let lastSub = "Never";
        if (subCount > 0 && f.submissions?.length > 0) {
            const sorted = [...f.submissions].sort((a: any, b: any) =>
                new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
            );
            if (sorted[0]) {
                const diffMs = Date.now() - new Date(sorted[0].submittedAt).getTime();
                const m = Math.round(diffMs / 60000);
                const h = Math.round(m / 60);
                const d = Math.round(h / 24);
                if (m < 60) lastSub = `${m}m ago`;
                else if (h < 24) lastSub = `${h}h ago`;
                else lastSub = `${d}d ago`;
            }
        }
        return {
            id: f.id, name: f.name,
            connectorName: f.targetDatabase || f.connectorName || "Default Connector",
            submissions: subCount, lastSubmission: lastSub,
            status: f.status || "Live", fields: f.fields || []
        };
    });

    const [forms, setForms] = React.useState<Form[]>(mapForms(initialForms));
    React.useEffect(() => { 
        const mapped = mapForms(initialForms);
        // Ensure pending deletions don't reappear if initialForms updates from server
        setForms(mapped.filter(f => !pendingDeletions.current[f.id])); 
    }, [initialForms]);

    const toggleStatus = async (id: string, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        const form = forms.find(f => f.id === id);
        if (!form) return;
        const newStatus = form.status === 'Live' ? 'Paused' : 'Live';
        setForms(prev => prev.map(f => f.id === id ? { ...f, status: newStatus } : f));
        toast({ title: "Status Updated", description: `Endpoint ${newStatus === 'Live' ? 'resumed' : 'paused'}.`, duration: 2000 });
        try {
            await toggleFormStatusAction(id);
            router.refresh();
        } catch {
            setForms(prev => prev.map(f => f.id === id ? { ...f, status: form.status } : f));
            toast({ title: "Error", description: "Failed to update status", variant: "destructive" });
        }
    };

    const handleDuplicate = async (id: string, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        toast({ description: "Duplicating..." });
        try {
            await duplicateFormAction(id);
            toast({ title: "Duplicated" });
            router.refresh();
        } catch {
            toast({ title: "Error", description: "Failed to duplicate", variant: "destructive" });
        }
    };

    const deleteForm = async (id: string, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        
        const formToDelete = forms.find(f => f.id === id);
        if (!formToDelete) return;

        // Optimistically remove from state
        setForms(prev => prev.filter(f => f.id !== id));
        setExpandedFormId(null);

        const performDelete = async () => {
            try {
                await deleteFormAction(id);
                delete pendingDeletions.current[id];
                router.refresh();
            } catch {
                // Restore if failed
                setForms(prev => [...prev, formToDelete]);
                toast({ title: "Error", description: "Failed to delete endpoint", variant: "destructive" });
            }
        };

        // Delay the actual server action by 5 seconds
        const timeoutId = setTimeout(performDelete, 5000);
        pendingDeletions.current[id] = timeoutId;

        toast({
            title: "Endpoint Deleted",
            description: `"${formToDelete.name}" has been removed.`,
            action: (
                <ToastAction 
                    altText="Undo deletion" 
                    onClick={() => {
                        if (pendingDeletions.current[id]) {
                            clearTimeout(pendingDeletions.current[id]);
                            delete pendingDeletions.current[id];
                            setForms(prev => [...prev, formToDelete]);
                            toast({ title: "Restored", description: "Endpoint restored successfully." });
                        }
                    }}
                >
                    Undo
                </ToastAction>
            ),
        });
    };

    const deletePreset = async (id: string) => {
        if (!confirm("Delete this auth preset? This cannot be undone.")) return;
        try {
            await deleteAuthPresetAction(id);
            setPresets(prev => prev.filter(p => p.id !== id));
            toast({ title: "Preset deleted" });
        } catch {
            toast({ title: "Failed to delete preset", variant: "destructive" });
        }
    };

    const resendVerification = async (id: string) => {
        toast({ title: "Verification emails queued", description: "This is a mocked action for now." });
    };

    const getEndpointUrl = (id: string) => {
        const base = typeof window !== 'undefined' ? window.location.origin : (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002');
        return `${base}/api/public/submit/${id}`;
    };

    const copyEndpoint = (id: string, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        navigator.clipboard.writeText(getEndpointUrl(id));
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
        toast({ description: "Endpoint URL copied!" });
    };

    const copyToClipboard = (text: string, msg: string, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        navigator.clipboard.writeText(text);
        toast({ description: msg });
    };

    const copyEmbed = (id: string, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        const form = forms.find(f => f.id === id);
        if (!form) return;
        const html = `<form action="${getEndpointUrl(id)}" method="POST">\n${form.fields.map((f: any) =>
            `  <div>\n    <label>${f.name}</label>\n    <input type="${f.type}" name="${f.name}" ${f.required ? 'required' : ''} />\n  </div>`
        ).join('\n')}\n  <button type="submit">Submit</button>\n</form>`;
        copyToClipboard(html, "HTML embed copied!");
    };

    const filteredForms = forms
        .filter(f => {
            if (statusFilter !== 'all' && f.status.toLowerCase() !== statusFilter) return false;
            if (dbFilter !== 'all' && f.connectorName !== dbFilter) return false;
            if (searchQuery && !f.name.toLowerCase().includes(searchQuery.toLowerCase()) && !f.id.toLowerCase().includes(searchQuery.toLowerCase())) return false;
            return true;
        })
        .sort((a, b) => sortBy === 'submissions' ? b.submissions - a.submissions : a.name.localeCompare(b.name));

    const activeForms = forms.filter(f => f.status === 'Live').length;
    const totalSubmissions = forms.reduce((acc, f) => acc + f.submissions, 0);
    const uniqueConnectors = Array.from(new Set(forms.map(f => f.connectorName)));

    return (
        <div className="relative min-h-screen text-foreground">
            {/* ── Main content ── */}
            <div className="relative z-10 flex flex-col gap-10 pb-16">

                {/* ══ HEADER ══ */}
                <div className="relative rounded-xl overflow-hidden mb-2 bg-neutral-100/80 dark:bg-transparent border border-neutral-200 dark:border-white/5">
                    {/* Animated canvas background */}
                    <IsoLevelWarp
                        color="100, 80, 255"
                        speed={0.8}
                        density={45}
                        className="!bg-transparent"
                    />
                    {/* Soft overlay */}
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-neutral-100/20 to-neutral-100/80 dark:from-black/20 dark:via-black/30 dark:to-black/60 pointer-events-none z-10" />

                    <div className="relative z-20 flex flex-col gap-6 px-8 py-8 border-b border-black/10 dark:border-white/5">
                        {/* Top row: pill + button */}
                        <div className="flex items-center justify-between flex-wrap gap-3">
                            <div className="flex items-center gap-2 rounded-full border border-black/15 dark:border-white/20 bg-white/60 dark:bg-black/30 backdrop-blur-md px-4 py-1.5 text-xs font-semibold text-neutral-700 dark:text-white/70">
                                <span className="relative flex h-1.5 w-1.5">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-500 opacity-75" />
                                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-indigo-500" />
                                </span>
                                Postpipe · Static Endpoints
                            </div>
                            <Link href="/dashboard/forms/new">
                                <RainbowButton className="h-10 rounded-lg px-6 text-sm font-semibold">
                                    <Plus className="mr-2 h-4 w-4" /> New Endpoint
                                </RainbowButton>
                            </Link>
                        </div>

                        {/* Title */}
                        <div>
                            <h1 className="text-5xl font-black tracking-tighter leading-none drop-shadow-lg">
                                <span className="bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-600 dark:from-white dark:via-white/95 dark:to-white/50 bg-clip-text text-transparent">Static</span>{" "}
                                <span className="bg-gradient-to-br from-violet-600 via-indigo-500 to-blue-500 dark:from-violet-300 dark:via-indigo-300 dark:to-blue-300 bg-clip-text text-transparent">Forms</span>
                            </h1>
                            <p className="mt-3 max-w-md text-sm text-neutral-600 dark:text-white/50 leading-relaxed">
                                Instantly collect data with backendless form endpoints — routed directly to MongoDB, Supabase, or any connector.
                            </p>
                        </div>

                        {/* Stat pills */}
                        <div className="flex flex-wrap gap-3">
                            {[
                                { label: "Total", value: forms.length, icon: FileText, color: "text-neutral-600 dark:text-white/70" },
                                { label: "Live", value: activeForms, icon: Zap, color: "text-emerald-600 dark:text-emerald-400" },
                                { label: "Submissions", value: totalSubmissions, icon: Activity, color: "text-sky-600 dark:text-sky-400" },
                                { label: "Connectors", value: uniqueConnectors.length, icon: Database, color: "text-violet-600 dark:text-violet-400" },
                                { label: "Auth Presets", value: presets.length, icon: Shield, color: "text-amber-600 dark:text-amber-400" },
                            ].map(s => (
                                <div key={s.label} className="flex items-center gap-2.5 rounded-lg border border-black/10 dark:border-white/10 bg-white/50 dark:bg-black/30 backdrop-blur-md px-4 py-2.5 hover:bg-white/70 dark:hover:bg-black/40 transition-all">
                                    <s.icon className={cn("h-4 w-4", s.color)} />
                                    <span className={cn("text-xl font-bold tabular-nums", s.color)}>{s.value}</span>
                                    <span className="text-xs font-medium text-neutral-500 dark:text-white/40 uppercase tracking-widest">{s.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* ══ TABS ══ */}
                <Tabs defaultValue={searchParams.get('tab') === 'presets' ? 'presets' : 'endpoints'} className="w-full">
                    <div className="flex items-center justify-between gap-4 flex-wrap mb-6">
                        <TabsList className="bg-muted dark:bg-white/[0.06] rounded-lg h-10 p-1 gap-1">
                            <TabsTrigger value="endpoints" className="rounded-lg text-xs font-semibold data-[state=active]:bg-background dark:data-[state=active]:bg-white/10 data-[state=active]:text-neutral-900 dark:data-[state=active]:text-white data-[state=active]:shadow-sm text-muted-foreground px-4 h-8 transition-all">
                                <Globe className="mr-2 h-3.5 w-3.5" /> Endpoints
                            </TabsTrigger>
                            <TabsTrigger value="presets" className="rounded-lg text-xs font-semibold data-[state=active]:bg-background dark:data-[state=active]:bg-white/10 data-[state=active]:text-neutral-900 dark:data-[state=active]:text-white data-[state=active]:shadow-sm text-muted-foreground px-4 h-8 transition-all">
                                <Shield className="mr-2 h-3.5 w-3.5" /> Auth Presets
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    {/* ── Endpoints tab ── */}
                    <TabsContent value="endpoints" className="space-y-5 mt-0">
                        {/* Search + Filters */}
                        <div className="flex flex-col sm:flex-row items-center gap-3">
                            <FormSearchBar
                                onSearch={setSearchQuery}
                                suggestions={forms.map(f => f.name)}
                                placeholder="Search by name or endpoint ID…"
                            />
                            <div className="flex gap-2 shrink-0">
                                <Select value={dbFilter} onValueChange={setDbFilter}>
                                    <SelectTrigger className="h-10 rounded-lg bg-muted border-border text-xs text-muted-foreground w-[150px] focus:ring-violet-500/40 hover:bg-accent transition-colors">
                                        <Database className="mr-2 h-3.5 w-3.5" />
                                        <SelectValue placeholder="All Databases" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-lg border-border bg-popover backdrop-blur-xl">
                                        <SelectItem value="all">All Databases</SelectItem>
                                        {uniqueConnectors.map(conn => (
                                            <SelectItem key={conn} value={conn}>{conn}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Select value={statusFilter} onValueChange={setStatusFilter}>
                                    <SelectTrigger className="h-10 rounded-lg bg-muted border-border text-xs text-muted-foreground w-[120px] focus:ring-violet-500/40 hover:bg-accent transition-colors">
                                        <Filter className="mr-2 h-3.5 w-3.5" />
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-lg border-border bg-popover backdrop-blur-xl">
                                        <SelectItem value="all">All Status</SelectItem>
                                        <SelectItem value="live">Live</SelectItem>
                                        <SelectItem value="paused">Paused</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Select value={sortBy} onValueChange={setSortBy}>
                                    <SelectTrigger className="h-10 rounded-lg bg-muted border-border text-xs text-muted-foreground w-[140px] focus:ring-violet-500/40 hover:bg-accent transition-colors">
                                        <ArrowUpDown className="mr-2 h-3.5 w-3.5" />
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-lg border-border bg-popover backdrop-blur-xl">
                                        <SelectItem value="name">Name A–Z</SelectItem>
                                        <SelectItem value="submissions">Most Submissions</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* List */}
                        {filteredForms.length === 0 ? (
                            <div className="flex flex-col items-center justify-center gap-5 rounded-2xl border border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-white/[0.02] py-24 text-center backdrop-blur-md shadow-inner">
                                <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-neutral-200 dark:border-white/10 bg-neutral-100 dark:bg-white/5 shadow-xl">
                                    <Globe className="h-10 w-10 text-neutral-400 dark:text-white/30" />
                                </div>
                                <div>
                                    <p className="text-lg font-bold text-neutral-700 dark:text-white/80">Create your first form endpoint</p>
                                    <p className="mt-1.5 text-sm text-neutral-500 dark:text-white/40 max-w-sm mx-auto">Start collecting submissions instantly from any frontend framework with a simple POST request.</p>
                                </div>
                                <Link href="/dashboard/forms/new">
                                    <Button className="rounded-xl mt-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold h-11 px-6 shadow-[0_0_20px_rgba(139,92,246,0.2)] transition-all">
                                        <Plus className="mr-2 h-4 w-4" /> Create Endpoint
                                    </Button>
                                </Link>
                            </div>
                        ) : (
                            <div className="rounded-xl border border-indigo-200/60 dark:border-indigo-500/10 bg-indigo-50/50 dark:bg-indigo-950/10 backdrop-blur-sm overflow-hidden">
                                {filteredForms.map((form, index) => {
                                    const isExpanded = expandedFormId === form.id;
                                    const endpoint = getEndpointUrl(form.id);
                                    const isLive = form.status === 'Live';
                                    const isCopied = copiedId === form.id;

                                    return (
                                        <div
                                            key={form.id}
                                            className={cn(
                                                "border-b border-neutral-200/70 dark:border-white/[0.05] last:border-b-0",
                                                "transition-colors duration-200",
                                                !isLive && "opacity-60"
                                            )}
                                        >
                                            {/* ── ROW ── */}
                                            <div
                                                className={cn(
                                                    "flex items-center gap-4 px-4 py-3.5 cursor-pointer",
                                                    "transition-colors duration-150",
                                                    isExpanded ? "bg-indigo-100/60 dark:bg-indigo-500/5" : "hover:bg-neutral-100/60 dark:hover:bg-white/[0.03]"
                                                )}
                                                onClick={() => setExpandedFormId(isExpanded ? null : form.id)}
                                            >
                                                {/* Left — name + status */}
                                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                                    <div className={cn(
                                                        "h-2 w-2 rounded-full shrink-0",
                                                        isLive ? "bg-emerald-500 shadow-[0_0_6px_rgba(52,211,153,0.6)]" : "bg-amber-500"
                                                    )} />
                                                    <span className="font-medium text-sm text-neutral-800 dark:text-white truncate">{form.name}</span>
                                                    <span className={cn(
                                                        "hidden sm:inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest border shrink-0",
                                                        isLive
                                                            ? "text-emerald-700 dark:text-emerald-400 border-emerald-400/30 dark:border-emerald-500/20 bg-emerald-100 dark:bg-emerald-500/8"
                                                            : "text-amber-700 dark:text-amber-400 border-amber-400/30 dark:border-amber-500/20 bg-amber-100 dark:bg-amber-500/8"
                                                    )}>
                                                        {form.status}
                                                    </span>
                                                </div>

                                                {/* Center — connector + stats */}
                                                <div className="hidden md:flex items-center gap-5 shrink-0">
                                                    <span className="flex items-center gap-1.5 text-xs text-neutral-500 dark:text-white/35">
                                                        <Database className="h-3 w-3" />
                                                        {form.connectorName}
                                                    </span>
                                                    <span className="text-xs text-neutral-500 dark:text-white/35 tabular-nums">
                                                        <span className="text-neutral-700 dark:text-white/55 font-semibold">{form.submissions}</span> submissions
                                                    </span>
                                                    <span className="text-xs text-neutral-400 dark:text-white/30">{form.lastSubmission}</span>
                                                </div>

                                                {/* Right — chevron + menu */}
                                                <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button size="icon" variant="ghost" className="h-7 w-7 rounded-md text-neutral-400 dark:text-white/25 hover:text-neutral-700 dark:hover:text-white hover:bg-neutral-200 dark:hover:bg-white/10 transition-all">
                                                                <MoreHorizontal className="h-3.5 w-3.5" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end" className="w-48 rounded-xl border-neutral-200 dark:border-white/10 bg-white dark:bg-zinc-900/95 backdrop-blur-xl shadow-2xl p-1.5">
                                                            <DropdownMenuItem onClick={(e) => { router.push(`/dashboard/forms/${form.id}/edit`); e.stopPropagation(); }} className="rounded-md text-xs text-neutral-600 dark:text-white/70 cursor-pointer hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/8 gap-2.5 py-2">
                                                                <Edit className="h-3.5 w-3.5 text-neutral-400 dark:text-white/50" /> Edit Config
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onClick={(e) => copyEmbed(form.id, e)} className="rounded-md text-xs text-neutral-600 dark:text-white/70 cursor-pointer hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/8 gap-2.5 py-2">
                                                                <Code className="h-3.5 w-3.5 text-neutral-400 dark:text-white/50" /> Copy HTML
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onClick={(e) => handleDuplicate(form.id, e)} className="rounded-md text-xs text-neutral-600 dark:text-white/70 cursor-pointer hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/8 gap-2.5 py-2">
                                                                <CopyPlus className="h-3.5 w-3.5 text-neutral-400 dark:text-white/50" /> Duplicate
                                                            </DropdownMenuItem>
                                                            <DropdownMenuSeparator className="my-1.5 bg-neutral-200 dark:bg-white/8" />
                                                            <DropdownMenuItem onClick={(e) => toggleStatus(form.id, e)} className={cn("rounded-md text-xs cursor-pointer hover:bg-neutral-100 dark:hover:bg-white/8 gap-2.5 py-2", isLive ? "text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300" : "text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300")}>
                                                                {isLive ? <><PauseCircle className="h-3.5 w-3.5" /> Pause Form</> : <><PlayCircle className="h-3.5 w-3.5" /> Resume Form</>}
                                                            </DropdownMenuItem>
                                                            <DropdownMenuSeparator className="my-1.5 bg-neutral-200 dark:bg-white/8" />
                                                            <DropdownMenuItem onClick={(e) => deleteForm(form.id, e)} className="rounded-md text-xs text-red-500 cursor-pointer hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/15 gap-2.5 py-2">
                                                                <Trash2 className="h-3.5 w-3.5" /> Delete Endpoint
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                    <ChevronDown className={cn(
                                                        "h-3.5 w-3.5 text-neutral-400 dark:text-white/25 transition-transform duration-200 cursor-pointer",
                                                        isExpanded && "rotate-180"
                                                    )} onClick={() => setExpandedFormId(isExpanded ? null : form.id)} />
                                                </div>
                                            </div>

                                            {/* ── EXPANDED DETAIL ── */}
                                            <div className={cn(
                                                "overflow-hidden transition-all duration-300",
                                                isExpanded ? "max-h-[400px] opacity-100" : "max-h-0 opacity-0"
                                            )}>
                                                <div className="px-4 pb-5 pt-1 border-t border-neutral-200/60 dark:border-white/[0.04] bg-indigo-50/50 dark:bg-indigo-950/10">
                                                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                                                        {/* Details */}
                                                        <div className="lg:col-span-2 flex flex-col gap-4">
                                                            <div>
                                                                <label className="text-[9px] font-bold uppercase tracking-widest text-neutral-500 dark:text-white/40 block mb-1.5 flex items-center gap-1.5"><Terminal className="h-3 w-3" /> ENDPOINT URL</label>
                                                                <div className="flex items-center gap-2">
                                                                    <div className="flex-1 rounded-xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-black/40 px-3.5 py-2.5 font-mono text-xs text-neutral-600 dark:text-white/70 truncate flex items-center">
                                                                        {endpoint}
                                                                    </div>
                                                                    <Button
                                                                        size="icon"
                                                                        className="h-10 w-10 rounded-xl bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10 text-neutral-500 dark:text-white/40 hover:bg-neutral-200 dark:hover:bg-white/15 hover:text-neutral-800 dark:hover:text-white transition-all shrink-0"
                                                                        onClick={(e) => { e.stopPropagation(); copyEndpoint(form.id, e); }}
                                                                    >
                                                                        {isCopied ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
                                                                {[
                                                                    { label: "Connector", value: form.connectorName, icon: <Database className="h-3 w-3 opacity-60" /> },
                                                                    { label: "Schema", value: `${form.fields?.length || 0} fields`, icon: <Settings2 className="h-3 w-3 opacity-60" /> },
                                                                    { label: "Submissions", value: form.submissions.toLocaleString() },
                                                                    { label: "Form ID", value: form.id, mono: true },
                                                                ].map(({ label, value, icon, mono }) => (
                                                                    <div key={label} className="flex flex-col rounded-xl border border-neutral-200 dark:border-white/5 bg-white dark:bg-white/[0.02] p-3">
                                                                        <span className="text-[9px] font-bold tracking-widest uppercase text-neutral-400 dark:text-white/30 mb-1 flex items-center gap-1.5">{icon}{label}</span>
                                                                        <span className={cn("text-xs font-semibold text-neutral-700 dark:text-white/80 truncate", mono && "font-mono font-medium")}>{value}</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                        {/* Actions */}
                                                        <div className="flex flex-col gap-2.5 justify-center lg:border-l border-neutral-200 dark:border-white/10 lg:pl-5 mt-2 lg:mt-0">
                                                            <Button
                                                                className="w-full h-10 rounded-xl bg-neutral-100 dark:bg-white/10 hover:bg-neutral-200 dark:hover:bg-white/20 text-neutral-700 dark:text-white font-bold transition-all"
                                                                onClick={(e) => { e.stopPropagation(); router.push(`/dashboard/forms/${form.id}/submissions`); }}
                                                            >
                                                                <Eye className="mr-2 h-4 w-4 opacity-50" /> View Submissions
                                                            </Button>
                                                            <Button
                                                                className="w-full h-10 rounded-xl bg-violet-100 dark:bg-violet-500/15 hover:bg-violet-200 dark:hover:bg-violet-500/25 text-violet-700 dark:text-violet-200 border border-violet-200 dark:border-violet-500/20 font-bold transition-all"
                                                                onClick={(e) => { e.stopPropagation(); window.open(`/api/public/test-form/${form.id}`, '_blank'); }}
                                                            >
                                                                <ExternalLink className="mr-2 h-4 w-4 opacity-50" /> Test Endpoint
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </TabsContent>

                    {/* ── Auth Presets tab ── */}
                    <TabsContent value="presets" className="mt-0">
                        {(!isCreatingPreset && !editingPreset) ? (
                            <div className="space-y-5">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h2 className="text-lg font-bold text-neutral-800 dark:text-white/80">Auth Configurations</h2>
                                        <p className="text-sm text-neutral-500 dark:text-white/30 mt-0.5">Reusable drop-in authentication presets.</p>
                                    </div>
                                    <RainbowButton className="h-9 rounded-lg px-5 text-xs font-semibold" onClick={() => { setEditingPreset(null); setIsCreatingPreset(true); }}>
                                        <Plus className="mr-2 h-3.5 w-3.5" /> New Preset
                                    </RainbowButton>
                                </div>

                                {presets.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center gap-4 rounded-lg border border-neutral-200 dark:border-white/6 bg-neutral-50 dark:bg-white/2 py-20 text-center">
                                        <div className="flex h-16 w-16 items-center justify-center rounded-lg border border-neutral-200 dark:border-white/10 bg-neutral-100 dark:bg-white/[0.05]">
                                            <Shield className="h-8 w-8 text-neutral-400 dark:text-white/20" />
                                        </div>
                                        <div>
                                            <p className="text-base font-semibold text-neutral-600 dark:text-white/50">No presets configured</p>
                                            <p className="mt-1 text-sm text-neutral-400 dark:text-white/30">Create an auth preset for instant drop-in login UI.</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                        {presets.map((preset) => (
                                            <div key={preset.id} className="group relative rounded-lg border border-neutral-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.05] hover:bg-neutral-50 dark:hover:bg-white/10 hover:border-neutral-300 dark:hover:border-white/[0.15] transition-all p-5 flex flex-col gap-4">
                                                <div className="flex items-start justify-between gap-4">
                                                    <div className="min-w-0">
                                                        <h3 className="font-bold text-sm text-neutral-800 dark:text-white/80 truncate">{preset.name}</h3>
                                                        <code className="text-[10px] text-neutral-400 dark:text-white/[0.25] mt-1 font-mono block">ID: {preset.id?.slice(0, 16)}…</code>
                                                    </div>
                                                    <Badge className="text-[10px] bg-violet-100 dark:bg-violet-500/15 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-500/25 border rounded-lg px-2">
                                                        {preset.targetDatabase || 'Default DB'}
                                                    </Badge>
                                                </div>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {preset.providers?.email && <span className="rounded-lg bg-blue-100 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 text-blue-700 dark:text-blue-300 text-[10px] px-2 py-0.5 font-semibold">Email</span>}
                                                    {preset.providers?.google && <span className="rounded-lg bg-red-100 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-700 dark:text-red-300 text-[10px] px-2 py-0.5 font-semibold">Google</span>}
                                                    {preset.providers?.github && <span className="rounded-lg bg-neutral-100 dark:bg-white/[0.08] border border-neutral-200 dark:border-white/[0.12] text-neutral-600 dark:text-white/50 text-[10px] px-2 py-0.5 font-semibold">GitHub</span>}
                                                </div>
                                                <div className="flex gap-2 mt-auto pt-3 border-t border-neutral-200 dark:border-white/[0.06]">
                                                    <Button variant="ghost" size="sm" className="h-8 text-xs text-neutral-500 dark:text-white/50 hover:text-neutral-800 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/[0.08] rounded-lg gap-1.5" onClick={() => setEditingPreset(preset)}>
                                                        <Edit className="h-3.5 w-3.5" /> Edit
                                                    </Button>
                                                    <Button variant="ghost" size="sm" className="h-8 text-xs text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 hover:bg-violet-50 dark:hover:bg-violet-500/10 rounded-lg gap-1.5" onClick={() => {
                                                        const origin = typeof window !== 'undefined' ? window.location.origin : '';
                                                        const providers = [
                                                            preset.providers?.email && '"email"',
                                                            preset.providers?.google && '"google"',
                                                            preset.providers?.github && '"github"',
                                                        ].filter(Boolean).join(', ');
                                                        const snip = `<!-- Place this where you want the Postpipe Auth UI to render -->
<div id="postpipe-auth"></div>

<!-- Include the Postpipe Auth CDN script -->
<script src="${origin}/api/public/cdn/auth.js?projectId=${preset.projectId || ''}"></script>

<!-- Initialize Postpipe Auth -->
<script>
    PostpipeAuth.init({
        apiUrl: "${preset.apiUrl || ''}",
        projectId: "${preset.projectId || ''}",
        providers: [${providers}],
        redirectUrl: ${(!preset.redirectUrl || preset.redirectUrl === 'window.location.origin') ? 'window.location.origin' : `"${preset.redirectUrl}"`}${preset.targetDatabase && preset.targetDatabase !== 'default' ? `,\n        targetDatabase: "${preset.targetDatabase}"` : ''}
    });

    PostpipeAuth.on("success", (user) => {
        console.log("Authenticated User:", user);
    });

    PostpipeAuth.on("error", (error) => {
        console.error("Authentication Error:", error);
    });
</script>`;
                                                        copyToClipboard(snip, "Auth snippet copied!");
                                                    }}>
                                                        <Code className="h-3.5 w-3.5" /> Snippet
                                                    </Button>
                                                    <Button variant="ghost" size="sm" className="h-8 text-xs text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg gap-1.5 ml-auto" onClick={() => deletePreset(preset.id)}>
                                                        <Trash2 className="h-3.5 w-3.5" /> Delete
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="rounded-lg border border-neutral-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.03] p-6 backdrop-blur-xl animate-in zoom-in-95 duration-200">
                                <div className="flex items-center justify-between mb-6 border-b border-neutral-200 dark:border-white/[0.08] pb-4">
                                    <div>
                                        <h2 className="text-base font-bold text-neutral-800 dark:text-white/80">{editingPreset ? "Edit Configuration" : "New Auth Preset"}</h2>
                                        <p className="text-xs text-neutral-500 dark:text-white/30 mt-1">{editingPreset ? "Update your authentication parameters." : "Configure a new drop-in authentication flow."}</p>
                                    </div>
                                    <Button variant="ghost" size="sm" className="text-neutral-500 dark:text-white/40 hover:text-neutral-800 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/[0.08] rounded-lg" onClick={() => { setIsCreatingPreset(false); setEditingPreset(null); }}>
                                        Cancel
                                    </Button>
                                </div>
                                <AuthPresetGenerator
                                    initialPreset={editingPreset}
                                    onSuccess={() => { setIsCreatingPreset(false); setEditingPreset(null); router.refresh(); }}
                                />
                            </div>
                        )}
                    </TabsContent>
                </Tabs>
            </div >

        </div >
    );
}
