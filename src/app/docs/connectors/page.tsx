import React from "react";
import { Metadata } from "next";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Share2, Webhook, Link as LinkIcon, Terminal } from "lucide-react";

export const metadata: Metadata = {
    title: "Connectors - PostPipe",
    description: "PostPipe Connectors Documentation",
};

export default function ConnectorsPage() {
    return (
        <div className="space-y-12 pb-20">
            <div className="border-b pb-8">
                <div className="flex items-center gap-2 mb-4">
                    <Badge variant="outline" className="border-blue-500 text-blue-500">Integration</Badge>
                </div>
                <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl mb-4">Connectors</h1>
                <p className="text-xl text-muted-foreground max-w-3xl">
                    Connectors are the bridge between your PostPipe data and the outside world. They allow you to trigger actions in external services when events occur in your application.
                </p>
            </div>

            <div className="grid gap-8 md:grid-cols-3">
                <div className="col-span-1 md:col-span-3">
                    <h2 className="text-2xl font-bold tracking-tight mb-4">How it works</h2>
                </div>

                <Card>
                    <CardHeader>
                        <Webhook className="h-6 w-6 mb-2 text-pink-500" />
                        <CardTitle>Event Driven</CardTitle>
                        <CardDescription>
                            Connectors listen for events like "form.submitted" or "user.created".
                        </CardDescription>
                    </CardHeader>
                </Card>
                <Card>
                    <CardHeader>
                        <Share2 className="h-6 w-6 mb-2 text-indigo-500" />
                        <CardTitle>Distributed</CardTitle>
                        <CardDescription>
                            Each connector is a standalone microservice, ensuring isolation and scalability.
                        </CardDescription>
                    </CardHeader>
                </Card>
                <Card>
                    <CardHeader>
                        <LinkIcon className="h-6 w-6 mb-2 text-cyan-500" />
                        <CardTitle>Discoverable</CardTitle>
                        <CardDescription>
                            Connectors register themselves with the Core, making them available in the dashboard.
                        </CardDescription>
                    </CardHeader>
                </Card>
            </div>

            <div className="space-y-6 pt-8 border-t">
                <h2 className="text-2xl font-bold tracking-tight">Create a Connector</h2>
                <p className="text-muted-foreground">
                    You can generate a new connector using the CLI. This will scaffold a Next.js app ready to handle webhooks and API requests.
                </p>

                <div className="bg-neutral-950 p-4 rounded-lg border border-neutral-800 font-mono text-sm text-white flex items-center gap-4">
                    <Terminal className="h-4 w-4 text-muted-foreground" />
                    npx create-postpipe-connector my-connector
                </div>

                <div className="prose dark:prose-invert max-w-none">
                    <h3>Lifecycle</h3>
                    <ol>
                        <li><strong>Scaffold:</strong> Generate the connector code.</li>
                        <li><strong>Register:</strong> The connector announces itself to the PostPipe Core.</li>
                        <li><strong>Activate:</strong> Enable the connector in the PostPipe Dashboard.</li>
                    </ol>
                </div>
            </div>
        </div>
    );
}
