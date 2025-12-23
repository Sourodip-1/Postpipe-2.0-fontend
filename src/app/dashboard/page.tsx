"use client";

import Link from "next/link";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Server,
    FileText,
    Key,
    Activity,
    Plus,
    Terminal,
    Zap
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

export default function DashboardPage() {
    const copyCliCommand = () => {
        navigator.clipboard.writeText("npx create-postpipe-app@latest");
        toast({
            title: "Copied to clipboard",
            description: "CLI command copied to clipboard",
        });
    };

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
                        <div className="text-2xl font-bold">3</div>
                        <p className="text-xs text-muted-foreground">
                            2 Active, 1 Paused
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Static Forms</CardTitle>
                        <FileText className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">12</div>
                        <p className="text-xs text-muted-foreground">
                            +28% from last month
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Connectors</CardTitle>
                        <Key className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">2</div>
                        <p className="text-xs text-muted-foreground">
                            Prod & Dev environments
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Requests</CardTitle>
                        <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">1,240</div>
                        <p className="text-xs text-muted-foreground">
                            +201 since last hour
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

                    <Button variant="outline" className="h-auto flex-col items-start gap-2 p-4" onClick={copyCliCommand}>
                        <div className="rounded-full bg-zinc-500/10 p-2 text-zinc-500">
                            <Terminal className="h-5 w-5" />
                        </div>
                        <div className="text-left">
                            <div className="font-semibold">Copy CLI Command</div>
                            <div className="text-xs text-muted-foreground">Start from your terminal</div>
                        </div>
                    </Button>
                </div>
            </div>

            {/* Recent Activity Mock */}
            <div>
                <h2 className="mb-4 text-lg font-semibold">Recent Activity</h2>
                <Card>
                    <CardContent className="p-0">
                        <div className="divide-y">
                            {[
                                { action: "Created new auth system", time: "2 hours ago", user: "Demo User" },
                                { action: "Form submission received", time: "5 hours ago", user: "External" },
                                { action: "Rotated production keys", time: "1 day ago", user: "Demo User" },
                                { action: "Deployed E-commerce backend", time: "2 days ago", user: "Demo User" },
                            ].map((item, i) => (
                                <div key={i} className="flex items-center justify-between p-4">
                                    <div className="flex items-center gap-4">
                                        <div className="rounded-full bg-muted p-2">
                                            <Activity className="h-4 w-4 text-muted-foreground" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium">{item.action}</p>
                                            <p className="text-xs text-muted-foreground">{item.user}</p>
                                        </div>
                                    </div>
                                    <div className="text-xs text-muted-foreground">{item.time}</div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

        </div>
    );
}
