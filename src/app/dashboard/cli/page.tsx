"use client";

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Terminal, Copy, Bot } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const CLI_COMMANDS = [
    {
        title: "PostPipe Auth (MongoDB)",
        description: "Initialize a complete authentication system with MongoDB backend.",
        command: "npx create-postpipe-auth --mongodb",
    },
    {
        title: "PostPipe E-commerce",
        description: "Launch a full-featured e-commerce backend with Postgres.",
        command: "npx create-postpipe-ecommerce",
    },
    {
        title: "PostPipe Custom",
        description: "Start from scratch with a configured monorepo setup.",
        command: "npx create-postpipe-app@latest",
    },
];

const AGENT_PROMPT = `You are a Senior Engineer specializing in PostPipe architecture.
Your goal is to build a scalable backend system using the PostPipe CLI.

1. Use "npx create-postpipe-app" to scaffold.
2. Follow the standard directory structure: /src/lib/auth, /src/db.
3. Ensure all environment variables are documented in .env.example.

Technology Stack: Next.js 14, MongoDB/Postgres, Tailwind CSS.
Start by analyzing the requirements...`;

export default function CliPage() {
    const copyToClipboard = (text: string, type: string) => {
        navigator.clipboard.writeText(text);
        toast({ title: "Copied!", description: `${type} copied to clipboard.` });
    };

    return (
        <div className="flex flex-col gap-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">CLI & Integrations</h1>
                <p className="text-muted-foreground">
                    Tools to accelerate your development workflow.
                </p>
            </div>

            <Tabs defaultValue="cli" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="cli" className="flex items-center gap-2">
                        <Terminal className="h-4 w-4" /> CLI Commands
                    </TabsTrigger>
                    <TabsTrigger value="agents" className="flex items-center gap-2">
                        <Bot className="h-4 w-4" /> Agent Prompts
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="cli" className="space-y-4">
                    {CLI_COMMANDS.map((item, i) => (
                        <Card key={i}>
                            <CardHeader>
                                <CardTitle className="text-lg">{item.title}</CardTitle>
                                <CardDescription>{item.description}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center gap-2 rounded-md bg-muted p-4 font-mono text-sm">
                                    <span className="flex-1 text-foreground">{item.command}</span>
                                    <Button variant="ghost" size="icon" onClick={() => copyToClipboard(item.command, "Command")}>
                                        <Copy className="h-4 w-4" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </TabsContent>

                <TabsContent value="agents">
                    <Card>
                        <CardHeader>
                            <CardTitle>Master System Prompt</CardTitle>
                            <CardDescription>
                                Paste this prompt into ChatGPT or Claude to bootstrap your PostPipe development.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="relative rounded-md bg-muted p-4">
                                <pre className="whitespace-pre-wrap font-mono text-sm text-muted-foreground">
                                    {AGENT_PROMPT}
                                </pre>
                                <Button
                                    className="absolute top-4 right-4"
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => copyToClipboard(AGENT_PROMPT, "Prompt")}
                                >
                                    <Copy className="mr-2 h-4 w-4" /> Copy Prompt
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
