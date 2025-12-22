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
import { Activity, AlertCircle, ArrowUp, ArrowDown } from "lucide-react";

export default function UsagePage() {
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
                        <div className="text-2xl font-bold">45,231</div>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <ArrowUp className="h-4 w-4 text-green-500" />
                            +20.1% from last month
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
                        <AlertCircle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">0.12%</div>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <ArrowDown className="h-4 w-4 text-green-500" />
                            -0.05% improvement
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Avg Latency</CardTitle>
                        <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">45ms</div>
                        <p className="text-xs text-muted-foreground">
                            Backend p95
                        </p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Usage Limits (Free Tier)</CardTitle>
                    <CardDescription>You are currently on the generous Developer plan.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                    <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                            <span className="font-medium">Monthly Requests</span>
                            <span className="text-muted-foreground">45k / 100k</span>
                        </div>
                        <Progress value={45} className="h-2" />
                    </div>
                    <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                            <span className="font-medium">Storage Used</span>
                            <span className="text-muted-foreground">1.2GB / 5GB</span>
                        </div>
                        <Progress value={24} className="h-2" />
                    </div>
                    <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                            <span className="font-medium">Active Connectors</span>
                            <span className="text-muted-foreground">2 / 5</span>
                        </div>
                        <Progress value={40} className="h-2" />
                    </div>
                </CardContent>
            </Card>

            <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Need more?</AlertTitle>
                <AlertDescription>
                    We are working on Pro plans. For now, enjoy the free limits!
                </AlertDescription>
            </Alert>
        </div>
    );
}
