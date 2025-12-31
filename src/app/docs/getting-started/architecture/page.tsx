import React from "react";
import { Metadata } from "next";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Server, Zap, Globe, Database } from "lucide-react";

export const metadata: Metadata = {
    title: "Architecture - PostPipe",
    description: "PostPipe Architecture Overview",
};

export default function ArchitecturePage() {
    return (
        <div className="space-y-12 pb-20">
            <div className="border-b pb-8">
                <div className="flex items-center gap-2 mb-4">
                    <Badge>Concept</Badge>
                </div>
                <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl mb-4">Architecture</h1>
                <p className="text-xl text-muted-foreground max-w-3xl">
                    PostPipe is designed as a modular, high-performance backend ecosystem. It consists of three main pillars: The Core, The Static Ingest, and The Connectors.
                </p>
            </div>

            <div className="grid gap-8 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <Server className="h-8 w-8 mb-4 text-purple-500" />
                        <CardTitle>PostPipe Core</CardTitle>
                        <CardDescription>The self-hosted control plane.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">
                            The Core is the heart of your infrastructure. It manages authentication, project organization, and orchestration of your services. It can be self-hosted or managed.
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <Zap className="h-8 w-8 mb-4 text-amber-500" />
                        <CardTitle>Static Ingest (Pipe)</CardTitle>
                        <CardDescription>Serverless form handling.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">
                            A high-scale ingestion system that accepts data from any source—static sites, mobile apps, or IoT devices—without needing a dedicated backend server.
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <Globe className="h-8 w-8 mb-4 text-blue-500" />
                        <CardTitle>Connectors</CardTitle>
                        <CardDescription>Bridge to external services.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">
                            Specialized micro-services that connect your data to third-party tools like Slack, Notion, or custom webhooks. Connectors are independently deployable.
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <Database className="h-8 w-8 mb-4 text-green-500" />
                        <CardTitle>Dynamic Backends</CardTitle>
                        <CardDescription>Generated database architectures.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">
                            The CLI scaffolds full-stack compatible backends (Postgres, MongoDB) with built-in patterns for E-commerce, SaaS, and more.
                        </p>
                    </CardContent>
                </Card>
            </div>

            <div className="prose dark:prose-invert max-w-none pt-8 border-t">
                <h2>How it fits together</h2>
                <p>
                    You use the <strong>CLI</strong> to scaffold a new project. This project might be a <strong>Static Site</strong> using the Ingest system, or a full <strong>Dynamic Backend</strong>.
                </p>
                <p>
                    For advanced integrations, you deploy <strong>Connectors</strong> that listen to events from your core application and trigger actions in external systems.
                </p>
            </div>
        </div>
    );
}
