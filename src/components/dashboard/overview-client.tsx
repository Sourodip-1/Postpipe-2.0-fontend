"use client";

import Link from "next/link";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Server,
    FileText,
    Key,
    Activity,
    Terminal,
    Zap
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Form, Connector } from "@/lib/server-db";

interface OverviewClientProps {
    forms: any[]; // Using any to match serialized data from action, ideally should match Form with extra fields
    connectors: any[];
    systems: any[];
}

export default function OverviewClient({ forms, connectors, systems = [] }: OverviewClientProps) {
    const copyCliCommand = () => {
        navigator.clipboard.writeText("npx create-postpipe-app@latest");
        toast({
            title: "Copied to clipboard",
            description: "CLI command copied to clipboard",
        });
    };

    // Sort forms by creation date (newest first)
    const recentForms = [...forms].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5);

    return (
        <div className="flex flex-col gap-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Overview</h1>
                <p className="text-muted-foreground">
                    Welcome back! Here's what's happening with your infrastructure.
                </p>
            </div>

            {/* Metrics Section */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Backend Systems</CardTitle>
                        <Server className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{systems.length}</div>
                        <p className="text-xs text-muted-foreground">
                            Total active systems
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Static Forms</CardTitle>
                        <FileText className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{forms.length}</div>
                        <p className="text-xs text-muted-foreground">
                            Total active forms
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Connectors</CardTitle>
                        <Key className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{connectors.length}</div>
                        <p className="text-xs text-muted-foreground">
                            Connected apps
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Requests</CardTitle>
                        <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">0</div>
                        <p className="text-xs text-muted-foreground">
                            Analytics coming soon
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Quick Actions */}
            <div>
                <h2 className="mb-4 text-lg font-semibold">Quick Actions</h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Button asChild variant="outline" className="h-auto flex-col items-start gap-2 p-4">
                        <Link href="/explore">
                            <div className="rounded-full bg-primary/10 p-2 text-primary">
                                <Server className="h-5 w-5" />
                            </div>
                            <div className="text-left">
                                <div className="font-semibold">Create Backend System</div>
                                <div className="text-xs text-muted-foreground">Launch a new dynamic backend</div>
                            </div>
                        </Link>
                    </Button>

                    <Button asChild variant="outline" className="h-auto flex-col items-start gap-2 p-4">
                        <Link href="/dashboard/forms/new">
                            <div className="rounded-full bg-blue-500/10 p-2 text-blue-500">
                                <FileText className="h-5 w-5" />
                            </div>
                            <div className="text-left">
                                <div className="font-semibold">Create Static Form</div>
                                <div className="text-xs text-muted-foreground">Setup a backendless form</div>
                            </div>
                        </Link>
                    </Button>

                    <Button asChild variant="outline" className="h-auto flex-col items-start gap-2 p-4">
                        <Link href="/dashboard/connectors">
                            <div className="rounded-full bg-amber-500/10 p-2 text-amber-500">
                                <Zap className="h-5 w-5" />
                            </div>
                            <div className="text-left">
                                <div className="font-semibold">Generate Connector</div>
                                <div className="text-xs text-muted-foreground">Connect external apps</div>
                            </div>
                        </Link>
                    </Button>

                    <Button asChild variant="outline" className="h-auto flex-col items-start gap-2 p-4">
                        <Link href="/docs">
                            <div className="rounded-full bg-zinc-500/10 p-2 text-zinc-500">
                                <Terminal className="h-5 w-5" />
                            </div>
                            <div className="text-left">
                                <div className="font-semibold">Copy CLI Command</div>
                                <div className="text-xs text-muted-foreground">Start from your terminal</div>
                            </div>
                        </Link>
                    </Button>
                </div>
            </div>

            {/* Recent Activity Mock */}
            <div>
                <h2 className="mb-4 text-lg font-semibold">Recent Forms</h2>
                <Card>
                    <CardContent className="p-0">
                        <div className="divide-y">
                            {recentForms.length > 0 ? recentForms.map((form, i) => (
                                <div key={i} className="flex items-center justify-between p-4">
                                    <div className="flex items-center gap-4">
                                        <div className="rounded-full bg-blue-500/10 p-2">
                                            <FileText className="h-4 w-4 text-blue-500" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium">{form.name}</p>
                                            <p className="text-xs text-muted-foreground">ID: {form.id}</p>
                                        </div>
                                    </div>
                                    <div className="text-xs text-muted-foreground">{new Date(form.createdAt).toLocaleDateString()}</div>
                                </div>
                            )) : (
                                <div className="p-4 text-center text-sm text-muted-foreground">
                                    No forms created yet.
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

        </div>
    );
}

