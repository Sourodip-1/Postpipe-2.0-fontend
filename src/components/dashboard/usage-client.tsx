"use client";

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Activity, AlertCircle, ArrowUp, ArrowDown, Database } from "lucide-react";

interface UsageStats {
    totalRequests: number;
    errorRate: number;
    avgLatency: number;
    storageBytes: number;
    activeConnectors: number;
}

interface UsageClientProps {
    stats: UsageStats;
}

function formatBytes(bytes: number, decimals = 2) {
    if (!+bytes) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export default function UsageClient({ stats }: UsageClientProps) {
    return (
        <div className="flex flex-col gap-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Usage</h1>
                <p className="text-muted-foreground">
                    Monitor your system performance and limits.
                </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
                        <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalRequests.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <ArrowUp className="h-4 w-4 text-green-500" />
                            Live count
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
                        <AlertCircle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.errorRate}%</div>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <ArrowDown className="h-4 w-4 text-green-500" />
                            Estimated
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Avg Latency</CardTitle>
                        <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.avgLatency}ms</div>
                        <p className="text-xs text-muted-foreground">
                            Backend p95
                        </p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Usage Limits</CardTitle>
                    <CardDescription>You are currently on the <strong>Unlimited</strong> Developer plan.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                    <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                            <span className="font-medium">Monthly Requests</span>
                            <span className="text-muted-foreground font-mono">Unlimited</span>
                        </div>
                        <Progress value={0} className="h-2" />
                        <p className="text-xs text-muted-foreground text-right">{stats.totalRequests.toLocaleString()} used</p>
                    </div>
                    <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                            <span className="font-medium">Storage Used</span>
                            <span className="text-muted-foreground font-mono">Unlimited</span>
                        </div>
                        <Progress value={0} className="h-2" />
                        <p className="text-xs text-muted-foreground text-right">{formatBytes(stats.storageBytes)} used</p>
                    </div>
                    <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                            <span className="font-medium">Active Connectors</span>
                            <span className="text-muted-foreground font-mono">Unlimited</span>
                        </div>
                        <Progress value={0} className="h-2" />
                        <p className="text-xs text-muted-foreground text-right">{stats.activeConnectors} active</p>
                    </div>
                </CardContent>
            </Card>

            <Alert>
                <Database className="h-4 w-4" />
                <AlertTitle>Scalable Infrastructure</AlertTitle>
                <AlertDescription>
                    Your current plan handles unlimited traffic and storage. Scale without limits!
                </AlertDescription>
            </Alert>
        </div>
    );
}
