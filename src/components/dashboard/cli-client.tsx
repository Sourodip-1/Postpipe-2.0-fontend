"use client";

import { useState } from "react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Terminal, Copy, Bot, Filter } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface CliClientProps {
    templates?: any[];
}

const FILTERS = ["All", "MongoDB", "PostgreSQL", "Supabase"];

export default function CliClient({ templates = [] }: CliClientProps) {
    const [filter, setFilter] = useState("All");

    const copyToClipboard = (text: string, type: string) => {
        navigator.clipboard.writeText(text);
        toast({ title: "Copied!", description: `${type} copied to clipboard.` });
    };

    const filteredTemplates = templates.filter(t => {
        if (filter === "All") return true;
        // Check tags or name for the filter (case-insensitive)
        const search = filter.toLowerCase();
        const hasTag = t.tags?.some((tag: string) => tag.toLowerCase().includes(search));
        const hasName = t.name?.toLowerCase().includes(search);
        return hasTag || hasName;
    });

    const cliTemplates = filteredTemplates.filter(t => t.cli);

    // Select the correct prompt based on filter
    const promptTemplates = filteredTemplates.map(t => {
        let prompt = t.aiPrompt;

        if (filter !== "All" && t.databaseConfigurations) {
            // Case-insensitive match for database name
            const config = t.databaseConfigurations.find((c: any) =>
                c.databaseName.toLowerCase().includes(filter.toLowerCase()) ||
                filter.toLowerCase().includes(c.databaseName.toLowerCase())
            );
            if (config) {
                prompt = config.prompt;
            }
        }
        return { ...t, aiPrompt: prompt };
    }).filter(t => t.aiPrompt);

    return (
        <div className="flex flex-col gap-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">CLI & Integrations</h1>
                    <p className="text-muted-foreground">
                        Tools to accelerate your development workflow.
                    </p>
                </div>

                <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
                    <Filter className="h-4 w-4 text-muted-foreground mr-1" />
                    {FILTERS.map(f => (
                        <Button
                            key={f}
                            variant={filter === f ? "default" : "outline"}
                            size="sm"
                            onClick={() => setFilter(f)}
                            className={cn(
                                "whitespace-nowrap transition-all",
                                filter === f && "bg-black text-white dark:bg-white dark:text-black"
                            )}
                        >
                            {f}
                        </Button>
                    ))}
                </div>
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
                    {cliTemplates.length > 0 ? (
                        cliTemplates.map((item, i) => (
                            <Card key={i}>
                                <CardHeader>
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <CardTitle className="text-lg">{item.title || item.name}</CardTitle>
                                            <CardDescription className="mt-1">{item.description || `Scaffold a new ${item.name} project`}</CardDescription>
                                        </div>
                                        {item.tags && (
                                            <div className="flex gap-1">
                                                {item.tags.slice(0, 2).map((tag: string, idx: number) => (
                                                    <span key={idx} className="text-[10px] px-2 py-1 rounded-full bg-secondary text-secondary-foreground font-medium">
                                                        {tag}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-center gap-2 rounded-md bg-muted p-4 font-mono text-sm group relative">
                                        <span className="flex-1 text-foreground break-all">{item.cli}</span>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity"
                                            onClick={() => copyToClipboard(item.cli, "Command")}
                                        >
                                            <Copy className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    ) : (
                        <div className="p-12 text-center text-muted-foreground border rounded-md border-dashed">
                            <Terminal className="h-8 w-8 mx-auto mb-3 opacity-50" />
                            <p>No CLI commands found for <strong>{filter}</strong>.</p>
                            <Button variant="link" onClick={() => setFilter("All")} className="mt-2">Clear filters</Button>
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="agents" className="space-y-4">
                    {promptTemplates.length > 0 ? (
                        promptTemplates.map((item, i) => (
                            <Card key={i}>
                                <CardHeader>
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <CardTitle className="text-lg">{item.title || item.name} Prompt</CardTitle>
                                            <CardDescription className="mt-1">
                                                Use this system prompt to bootstrap your {item.name} development.
                                            </CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="relative rounded-md bg-muted p-4 group">
                                        <pre className="whitespace-pre-wrap font-mono text-sm text-muted-foreground max-h-60 overflow-y-auto pr-8">
                                            {item.aiPrompt}
                                        </pre>
                                        <Button
                                            className="absolute top-4 right-4 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity"
                                            variant="secondary"
                                            size="sm"
                                            onClick={() => copyToClipboard(item.aiPrompt, "Prompt")}
                                        >
                                            <Copy className="mr-2 h-4 w-4" /> Copy
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    ) : (
                        <div className="p-12 text-center text-muted-foreground border rounded-md border-dashed">
                            <Bot className="h-8 w-8 mx-auto mb-3 opacity-50" />
                            <p>No agent prompts found for <strong>{filter}</strong>.</p>
                            <Button variant="link" onClick={() => setFilter("All")} className="mt-2">Clear filters</Button>
                        </div>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}
