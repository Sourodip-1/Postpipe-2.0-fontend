"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Database, RefreshCw, Key, Link as LinkIcon, Copy, Loader2, Edit3, Trash2, Check, X, AlertCircle, Search, Calendar, Filter } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";

import { AlertTriangle, ShieldAlert, Link2 } from "lucide-react";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface SubmissionsClientProps {
    id: string;
    formName: string;
    schema: any[];
    endpoint: string;
    token: string;
}

export default function SubmissionsClient({ id, formName, schema = [], endpoint, token }: SubmissionsClientProps) {
    const [submissions, setSubmissions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [fetchError, setFetchError] = useState<string | null>(null);
    const [authError, setAuthError] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editData, setEditData] = useState<any>({});
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<{ id: string, hard: boolean } | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [dateFilter, setDateFilter] = useState("all");
    const [showDeleted, setShowDeleted] = useState(false);

    // Debounce search query
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery]);


    const fetchSubmissions = async () => {
        setLoading(true);
        setFetchError(null);
        setAuthError(false);
        try {
            const params = new URLSearchParams({
                formId: id,
                search: debouncedSearch,
                dateRange: dateFilter,
                includeDeleted: showDeleted.toString()
            });
            const res = await fetch(`/api/submissions?${params.toString()}`);
            const data = await res.json();

            if (res.status === 401 || res.status === 403 || data.error?.includes("Auth")) {
                setAuthError(true);
                setFetchError(data.error || "Authentication Failed: Check your connector secret.");
            } else if (data.status === 'success') {
                setSubmissions(data.records || []);
                // Log first record for debugging
                if (data.records?.length > 0) {
                    console.log("[DEBUG] First submission keys:", Object.keys(data.records[0]));
                    console.log("[DEBUG] First submission sample:", JSON.stringify(data.records[0]).slice(0, 500));
                }
            } else {
                setFetchError(data.error || "Failed to fetch submissions");
            }
        } catch (e: any) {
            setFetchError(e.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSubmissions();
    }, [id, debouncedSearch, dateFilter, showDeleted]);

    const handleUpdate = async (submissionId: string) => {
        const originalRecord = submissions.find(s => (s.submissionId || s.id) === submissionId);
        const dataObj = originalRecord?.data || originalRecord || {};
        
        setActionLoading(submissionId);
        try {
            const translatedPatch: Record<string, any> = {};
            console.log("[DEBUG] Schema fields:", schema.map(f => f.label));
            
            Object.entries(editData).forEach(([fieldKey, value]) => {
                // Find field by ID, name, or label matching the key used in editData
                const fieldDef = schema.find(f => (f.id || f.name || f.label) === fieldKey);
                if (!fieldDef) return;

                const possibleKeys = [
                    fieldDef.label,
                    fieldDef.name,
                    fieldDef.id,
                    (fieldDef.label || '').toLowerCase(),
                    (fieldDef.name || '').toLowerCase(),
                    (fieldDef.id || '').toLowerCase()
                ].filter(Boolean);

                const existingKey = Object.keys(dataObj).find(k => 
                    possibleKeys.includes(k) || possibleKeys.includes(k.toLowerCase())
                );

                const finalKey = existingKey || fieldDef.name || fieldDef.id || fieldDef.label;
                
                const currentValue = dataObj[finalKey];
                
                // Enhanced comparison: handle numeric strings and boolean types
                let isModified = false;
                if (fieldDef.type === 'number' || fieldDef.type === 'decimal') {
                    isModified = Number(currentValue) !== Number(value);
                } else if (fieldDef.type === 'boolean' || fieldDef.type === 'checkbox') {
                    const normalizedCurrent = typeof currentValue === 'string' ? currentValue.toLowerCase() === 'true' : !!currentValue;
                    const normalizedNew = typeof value === 'string' ? value.toLowerCase() === 'true' : !!value;
                    isModified = normalizedCurrent !== normalizedNew;
                } else {
                    isModified = String(currentValue ?? '') !== String(value ?? '');
                }

                if (isModified) {
                    translatedPatch[finalKey] = value;
                }
            });

            if (Object.keys(translatedPatch).length === 0) {
                setEditingId(null);
                setActionLoading(null);
                return;
            }

            const res = await fetch(`/api/submissions`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    submissionId,
                    formId: id,
                    patch: translatedPatch
                })
            });
            const result = await res.json();
            if (res.ok) {
                toast({ title: "Updated", description: "The record has been overwritten with your changes." });
                setEditingId(null);
                fetchSubmissions();
            } else {
                toast({ variant: "destructive", title: "Error", description: result.error || "Update failed" });
            }
        } catch (e: any) {

            toast({ variant: "destructive", title: "Network Error", description: e.message });
        } finally {
            setActionLoading(null);
        }
    };



    const handleDelete = async (submissionId: string, hard = false) => {
        setActionLoading(submissionId);
        try {
            const res = await fetch(`/api/submissions?submissionId=${submissionId}&formId=${id}${hard ? '&hard=true' : ''}`, {
                method: 'DELETE'
            });
            const result = await res.json();
            if (res.ok) {
                toast({ title: "Deleted", description: hard ? "Record purged permanently." : "Record marked as deleted." });
                fetchSubmissions();
            } else {
                toast({ variant: "destructive", title: "Error", description: result.error || "Delete failed" });
            }
        } catch (e: any) {
            toast({ variant: "destructive", title: "Network Error", description: e.message });
        } finally {
            setActionLoading(null);
            setDeleteConfirm(null);
        }
    };


    const renderCell = (col: any, value: any, subId: string) => {
        const isEditing = editingId === subId;
        const type = col.type;

        if (isEditing) {
            const fieldKey = col.id || col.name || col.label;
            if (type === 'text' || type === 'email' || type === 'number' || type === 'textarea' || type === 'decimal') {
                return (
                    <Input 
                        value={editData[fieldKey] ?? value ?? ''} 
                        onChange={(e) => setEditData({ ...editData, [fieldKey]: e.target.value })}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') handleUpdate(subId);
                            if (e.key === 'Escape') setEditingId(null);
                        }}
                        className="h-8 text-xs bg-black/40 border-indigo-500/50"
                        autoFocus
                    />
                );
            }
            if (type === 'boolean' || type === 'checkbox') {
                const boolVal = typeof (editData[fieldKey] ?? value) === 'string' 
                    ? (editData[fieldKey] ?? value).toLowerCase() === 'true' 
                    : !!(editData[fieldKey] ?? value);
                return (
                    <Switch 
                        checked={boolVal} 
                        onCheckedChange={(checked) => setEditData({ ...editData, [fieldKey]: checked })}
                        className="scale-75 origin-left"
                    />
                );
            }
            if (type === 'enum' && col.options) {
                const options = col.options.split(',').map((o: string) => o.trim()).filter(Boolean);
                return (
                    <Select 
                        value={String(editData[fieldKey] ?? value ?? '')} 
                        onValueChange={(val) => setEditData({ ...editData, [fieldKey]: val })}
                    >
                        <SelectTrigger className="h-8 text-xs bg-black/40 border-indigo-500/50">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {options.map((o: string) => (
                                <SelectItem key={o} value={o}>{o}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                );
            }
            if (type === 'reference') {
                return (
                    <div className="flex items-center gap-2 text-xs text-violet-400 opacity-60 italic">
                        <Link2 className="w-3 h-3" /> Relational ID
                    </div>
                );
            }
        }


        if (value === undefined || value === null || value === '') return <span className="text-muted-foreground opacity-50">-</span>;


        if (type === 'image') {
            return <a href={value} target="_blank" rel="noreferrer"><img src={value} alt="upload" className="max-w-[100px] max-h-[100px] object-cover rounded-md border border-white/10 hover:opacity-80 transition-opacity" /></a>;
        }
        if (type === 'boolean' || type === 'checkbox') {
            const boolVal = typeof value === 'string' ? value.toLowerCase() === 'true' : !!value;
            return <Badge variant={boolVal ? 'default' : 'secondary'} className={boolVal ? 'bg-green-500/20 text-green-400 border-green-500/30' : ''}>{boolVal ? 'Yes' : 'No'}</Badge>;
        }
        if (typeof value === 'object') {
            return <pre className="text-[10px] bg-black/40 p-2 rounded-md border border-white/5 overflow-x-auto max-w-[200px] max-h-[100px] scrollbar-thin scrollbar-thumb-white/10">{JSON.stringify(value, null, 2)}</pre>;
        }
        return <span className="text-sm truncate max-w-[200px] block" title={String(value)}>{String(value)}</span>;
    };

    const copyToClipboard = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        toast({ title: "Copied", description: `${label} copied to clipboard.` });
    };

    return (
        <div className="flex flex-col gap-8 max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
            <div className="flex items-center gap-4">
                <Link href="/dashboard/forms">
                    <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Form Submissions</h1>
                    <p className="text-muted-foreground text-sm">Viewing data for <span className="font-semibold">{formName}</span> ({id})</p>
                </div>
                <div className="ml-auto flex gap-2">
                    <Button variant="outline" onClick={fetchSubmissions} disabled={loading}>
                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />} Refresh
                    </Button>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <LinkIcon className="h-4 w-4 text-muted-foreground" />
                            GET Endpoint
                        </CardTitle>
                        <CardDescription>Retrieve submissions via API</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2">
                            <Input value={endpoint} readOnly className="font-mono text-xs" />
                            <Button variant="ghost" size="icon" onClick={() => copyToClipboard(endpoint, "Endpoint")}>
                                <Copy className="h-4 w-4" />
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <Key className="h-4 w-4 text-muted-foreground" />
                            API Token
                        </CardTitle>
                        <CardDescription>Bearer token for authentication</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2">
                            <Input value={token} readOnly className="font-mono text-xs" type="password" />
                            <Button variant="ghost" size="icon" onClick={() => copyToClipboard(token, "Token")}>
                                <Copy className="h-4 w-4" />
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <RefreshCw className="h-4 w-4 text-violet-400" />
                            Update Record (PATCH)
                        </CardTitle>
                        <CardDescription>Overwrites specific fields in a submission</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="flex items-center gap-2">
                            <Input value={endpoint} readOnly className="font-mono text-xs" />
                            <Button variant="ghost" size="icon" onClick={() => copyToClipboard(endpoint, "Endpoint")}>
                                <Copy className="h-4 w-4" />
                            </Button>
                        </div>
                        <div className="bg-black/40 p-2 rounded border border-white/5 font-mono text-[10px] text-violet-300/70">
                            {"{ \"submissionId\": \"id\", \"patch\": { \"field\": \"value\" } }"}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <Trash2 className="h-4 w-4 text-red-400" />
                            Delete Record (DELETE)
                        </CardTitle>
                        <CardDescription>Soft or hard delete a submission</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="flex items-center gap-2">
                            <Input value={`${endpoint}?submissionId=...&hard=true`} readOnly className="font-mono text-xs" />
                            <Button variant="ghost" size="icon" onClick={() => copyToClipboard(`${endpoint}?submissionId=...`, "Delete Endpoint")}>
                                <Copy className="h-4 w-4" />
                            </Button>
                        </div>
                        <p className="text-[10px] text-muted-foreground italic">Add &hard=true to permanently purge records.</p>
                    </CardContent>
                </Card>
            </div>

            <div className="flex flex-col md:flex-row gap-4 items-center bg-white/[0.03] p-4 rounded-xl border border-white/5">
                <div className="flex flex-col gap-1.5 flex-1 w-full">
                    <div className="h-[15px]" /> {/* Phantom spacer to align with Date Range label */}
                    <div className="relative flex-1 w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                            placeholder="Search by ID or keys..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 h-10 bg-black/20 border-white/10"
                        />
                    </div>
                </div>
                
                <div className="flex items-center gap-4 w-full md:w-auto">
                    <div className="flex flex-col gap-1.5 min-w-[140px]">
                        <label className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground pl-1">Date Range</label>
                        <Select value={dateFilter} onValueChange={setDateFilter}>
                            <SelectTrigger className="h-10 bg-black/20 border-white/10 text-xs">
                                <Calendar className="mr-2 h-3.5 w-3.5 opacity-50" />
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Time</SelectItem>
                                <SelectItem value="24h">Last 24 Hours</SelectItem>
                                <SelectItem value="7d">Last 7 Days</SelectItem>
                                <SelectItem value="30d">Last 30 Days</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex flex-col gap-2 items-center justify-center h-10">
                        <div className="flex items-center gap-2 mb-1.5">
                            <Switch checked={showDeleted} onCheckedChange={setShowDeleted} id="show-deleted" />
                            <label htmlFor="show-deleted" className="text-xs font-medium cursor-pointer text-muted-foreground">Show Deleted</label>
                        </div>
                    </div>
                </div>
            </div>

            {!fetchError && (
                <Alert variant="default" className="bg-blue-500/10 text-blue-600 border-blue-500/20">
                    <Database className="h-4 w-4" />
                    <AlertTitle>Data Source Info</AlertTitle>
                    <AlertDescription>
                        Data is fetched directly from your active connector.
                    </AlertDescription>
                </Alert>
            )}

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow className="border-white/5">
                            <TableHead className="w-[180px] text-xs font-semibold tracking-wider text-neutral-400">Submission ID</TableHead>
                            <TableHead className="w-[180px] text-xs font-semibold tracking-wider text-neutral-400">Timestamp</TableHead>
                            {schema.map((col, idx) => (
                                <TableHead key={col.id || col.label || idx} className="text-xs font-semibold tracking-wider text-neutral-400 whitespace-nowrap">
                                    {col.label}
                                </TableHead>
                            ))}
                            {schema.length === 0 && <TableHead>Payload Data</TableHead>}
                            <TableHead className="w-[120px] text-xs font-semibold tracking-wider text-neutral-400 text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>

                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={schema.length + 2} className="h-32 text-center text-muted-foreground">
                                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-indigo-500/50" />
                                    Loading submissions...
                                </TableCell>
                            </TableRow>
                        ) : submissions.map((sub: any) => (
                            <TableRow key={sub.submissionId || sub.id} className="border-white/5 hover:bg-white/[0.02]">
                                <TableCell className="w-[180px] align-top">
                                    <div className="flex flex-col gap-1 mt-1">
                                        <div className="font-mono text-xs text-muted-foreground break-all">
                                            {sub.submissionId || sub.id}
                                        </div>
                                        {sub._dbType && (
                                            <div className="mt-1">
                                                <Badge
                                                    variant="outline"
                                                    className={`text-[9px] px-1.5 py-0 font-medium tracking-tight flex items-center gap-1 w-fit border-white/10 bg-white/5 text-neutral-300`}
                                                >
                                                    <Database className="h-[9px] w-[9px]" />
                                                    <span className="truncate max-w-[120px]">
                                                        {sub._sourceDb || sub._dbType}
                                                    </span>
                                                </Badge>
                                            </div>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell className="w-[180px] align-top">
                                    <div className="text-xs mt-1.5 text-neutral-300">
                                        {sub.timestamp || sub.submittedAt ? new Date(sub.timestamp || sub.submittedAt).toLocaleString() : '-'}
                                    </div>
                                </TableCell>
                                {schema.map((col, idx) => {
                                    // Smart key matching: forms could save under exact label, ID, name, or lowercase version 
                                    const dataObj = sub.data || sub || {};
                                    let val = undefined;

                                    const possibleKeys = [
                                        col.label,
                                        col.id,
                                        col.name,
                                        (col.label || '').toLowerCase(),
                                        (col.name || '').toLowerCase(),
                                        (col.id || '').toLowerCase()
                                    ];

                                    const matchingKey = Object.keys(dataObj).find(k =>
                                        possibleKeys.includes(k) || possibleKeys.includes(k.toLowerCase())
                                    );

                                    if (matchingKey) {
                                        val = dataObj[matchingKey];
                                    }
                                    
                                    return (
                                        <TableCell key={col.id || col.label || idx} className="align-top py-4">
                                            {renderCell(col, val, sub.submissionId || sub.id)}
                                        </TableCell>
                                    );
                                })}

                                {schema.length === 0 && (
                                    <TableCell className="align-top py-4">
                                        <pre className="text-[10px] bg-black/40 p-2 rounded-md border border-white/5 overflow-x-auto max-w-[300px] scrollbar-thin">
                                            {JSON.stringify(sub.data || sub, null, 2)}
                                        </pre>
                                    </TableCell>
                                )}
                                <TableCell className="text-right align-top py-4">
                                    <div className="flex justify-end gap-1">
                                        {editingId === (sub.submissionId || sub.id) ? (
                                            <>
                                                <Button 
                                                    size="icon" 
                                                    variant="ghost" 
                                                    className="h-7 w-7 text-green-500 hover:text-green-400 hover:bg-green-500/10"
                                                    onClick={() => handleUpdate(sub.submissionId || sub.id)}
                                                    disabled={actionLoading === (sub.submissionId || sub.id)}
                                                >
                                                    <Check className="h-4 w-4" />
                                                </Button>
                                                <Button 
                                                    size="icon" 
                                                    variant="ghost" 
                                                    className="h-7 w-7 text-red-500 hover:text-red-400 hover:bg-red-500/10"
                                                    onClick={() => setEditingId(null)}
                                                >
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            </>
                                        ) : (
                                            <>
                                                <Button 
                                                    size="icon" 
                                                    variant="ghost" 
                                                    className="h-7 w-7 text-indigo-400/70 hover:text-indigo-300 hover:bg-indigo-500/10"
                                                    onClick={() => {
                                                        setEditingId(sub.submissionId || sub.id);
                                                        // Initialize editData with all fields from schema mapped to current values
                                                        const initialEditData: Record<string, any> = {};
                                                        const subData = sub.data || sub || {};
                                                        
                                                        schema.forEach(field => {
                                                            const fieldKey = field.id || field.name || field.label;
                                                            const possibleKeys = [
                                                                field.label, field.name, field.id,
                                                                (field.label||'').toLowerCase(), (field.name||'').toLowerCase()
                                                            ].filter(Boolean);
                                                            
                                                            const match = Object.keys(subData).find(k => 
                                                                possibleKeys.includes(k) || possibleKeys.includes(k.toLowerCase())
                                                            );
                                                            
                                                            if (match) {
                                                                initialEditData[fieldKey] = subData[match];
                                                            }
                                                        });
                                                        setEditData(initialEditData);
                                                    }}
                                                >
                                                    <Edit3 className="h-3.5 w-3.5" />
                                                </Button>

                                                <Button 
                                                    size="icon" 
                                                    variant="ghost" 
                                                    className="h-7 w-7 text-red-400/50 hover:text-red-300 hover:bg-red-500/15"
                                                    onClick={() => setDeleteConfirm({ id: sub.submissionId || sub.id, hard: false })}
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </Button>
                                                <Button 
                                                    size="icon" 
                                                    variant="ghost" 
                                                    className="h-7 w-7 text-red-600/40 hover:text-red-500 hover:bg-red-900/20"
                                                    title="Hard Delete"
                                                    onClick={() => setDeleteConfirm({ id: sub.submissionId || sub.id, hard: true })}
                                                >
                                                    <AlertCircle className="h-3.5 w-3.5" />
                                                </Button>
                                            </>
                                        )}
                                    </div>
                                </TableCell>
                            </TableRow>

                        ))}
                        {!loading && submissions.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={schema.length + 2 > 2 ? schema.length + 2 : 3} className="h-32 text-center text-muted-foreground">
                                    {fetchError ? (
                                        <span className="text-destructive flex items-center justify-center gap-2">
                                            <AlertTriangle className="h-4 w-4" /> Unable to load submissions.
                                        </span>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center gap-2 opacity-50">
                                            <Database className="h-6 w-6" />
                                            <span>No submissions found.</span>
                                        </div>
                                    )}
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
                <AlertDialogContent className="bg-neutral-900 border-white/10 text-white">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription className="text-neutral-400">
                            {deleteConfirm?.hard 
                                ? "This action cannot be undone. This will permanently delete the submission and remove the data from our servers."
                                : "The submission will be moved to the trash. You can still recover it later if needed."}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="bg-transparent border-white/10 text-white hover:bg-white/5">Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                            className={`${deleteConfirm?.hard ? 'bg-red-600 hover:bg-red-500' : 'bg-indigo-600 hover:bg-indigo-500'} text-white border-none`}
                            onClick={() => deleteConfirm && handleDelete(deleteConfirm.id, deleteConfirm.hard)}
                        >
                            {deleteConfirm?.hard ? 'Permanently Delete' : 'Delete'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
