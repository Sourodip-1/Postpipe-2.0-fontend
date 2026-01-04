"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Database, RefreshCw, Key, Link as LinkIcon, Copy } from "lucide-react";
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
import { toast } from "@/hooks/use-toast";

import { AlertTriangle, ShieldAlert } from "lucide-react";

interface SubmissionsClientProps {
    id: string;
    formName: string;
    initialSubmissions: any[];
    endpoint: string;
    token: string;
    fetchError?: string | null;
    authError?: boolean;
}

export default function SubmissionsClient({ id, formName, initialSubmissions, endpoint, token, fetchError, authError }: SubmissionsClientProps) {
    const [submissions, setSubmissions] = useState(initialSubmissions);

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
                    <Button variant="outline" onClick={() => window.location.reload()}>
                        <RefreshCw className="mr-2 h-4 w-4" /> Refresh
                    </Button>
                </div>
            </div>

            {fetchError && (
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Connection Error</AlertTitle>
                    <AlertDescription className="flex flex-col gap-2">
                        <span>{fetchError}</span>
                        {authError && (
                            <div className="mt-2">
                                <Link href="/dashboard/connectors">
                                    <Button variant="secondary" size="sm">
                                        <ShieldAlert className="mr-2 h-3 w-3" />
                                        Manage Connector Secrets
                                    </Button>
                                </Link>
                            </div>
                        )}
                        {!authError && (
                            <p className="text-xs opacity-80 mt-1">Please ensure your Connector is deployed and running.</p>
                        )}
                    </AlertDescription>
                </Alert>
            )}

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
                        <TableRow>
                            <TableHead className="w-[180px]">Submission ID</TableHead>
                            <TableHead className="w-[220px]">Timestamp</TableHead>
                            <TableHead>Payload Data</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {submissions.map((sub: any) => (
                            <TableRow key={sub.submissionId || sub.id}>
                                <TableCell className="font-mono text-xs text-muted-foreground">
                                    {sub.submissionId || sub.id}
                                </TableCell>
                                <TableCell className="text-sm">
                                    {sub.timestamp || sub.submittedAt}
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-wrap gap-2">
                                        {Object.entries(sub.data || {}).map(([key, value]) => (
                                            <Badge key={key} variant="secondary" className="font-normal">
                                                <span className="font-semibold mr-1 opacity-70">{key}:</span> {String(value)}
                                            </Badge>
                                        ))}
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                        {submissions.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={3} className="h-24 text-center">
                                    {fetchError ? (
                                        <span className="text-destructive">Unable to load submissions.</span>
                                    ) : (
                                        "No submissions found."
                                    )}
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
