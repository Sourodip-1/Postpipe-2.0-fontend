"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Plus, Trash, Database, Server, XCircle, Save, Variable, Copy, Info } from "lucide-react";
import { getConnectorsAction } from "@/app/actions/dashboard";
import { addDatabaseAction, removeDatabaseAction } from "@/app/actions/connector-databases";
import { toast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

type Connector = {
    id: string;
    name: string;
    url: string;
    envPrefix?: string;
    databases?: Record<string, {
        uri: string;
        dbName: string;
        type?: 'mongodb' | 'postgres';
    }>;
};

export default function DatabasePage() {
    const [connectors, setConnectors] = useState<Connector[]>([]);
    const [loading, setLoading] = useState(true);

    // Temp state for new database inputs: { [connectorId]: { uri: "", dbName: "", type: "mongodb" } }
    const [newDbInputs, setNewDbInputs] = useState<Record<string, { uri: string, dbName: string, type: 'mongodb' | 'postgres' }>>({});

    useEffect(() => {
        fetchConnectors();
    }, []);

    const fetchConnectors = async () => {
        try {
            // We reuse the existing getConnectorsAction which calls getConnectors from server-db
            const res = await getConnectorsAction();
            // Map to our local strict type if needed, but the response should match
            setConnectors(res as any);
        } catch (error) {
            console.error("Failed to fetch connectors", error);
            toast({ title: "Error", description: "Failed to load connectors", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (connectorId: string, field: 'uri' | 'dbName' | 'type', value: string) => {
        setNewDbInputs(prev => ({
            ...prev,
            [connectorId]: {
                ...(prev[connectorId] || { uri: "", dbName: "", type: "mongodb" }),
                [field]: value
            }
        }));
    };

    const handleAddDatabase = async (connectorId: string) => {
        const input = newDbInputs[connectorId];
        if (!input || !input.uri || !input.dbName) {
            toast({ title: "Validation Error", description: "All fields are required", variant: "destructive" });
            return;
        }

        // Auto-generate alias from URI env var name
        // e.g., "MONGODB_URI_PRODUCTION" -> "production"
        const alias = input.uri.toLowerCase().replace(/^mongodb_uri_/i, '').replace(/_/g, '-') || input.uri.toLowerCase();

        try {
            const res = await addDatabaseAction(connectorId, alias, input.uri, input.dbName, input.type);
            if (res.success) {
                toast({ title: "Database Added", description: `Alias '${alias}' configured as ${input.type}.` });

                // Clear inputs
                setNewDbInputs(prev => ({
                    ...prev,
                    [connectorId]: { uri: "", dbName: "", type: "mongodb" }
                }));

                // Refresh list
                fetchConnectors();
            } else {
                toast({ title: "Error", description: res.error, variant: "destructive" });
            }
        } catch (error) {
            toast({ title: "Error", description: "Failed to add database", variant: "destructive" });
        }
    };

    const handleRemoveDatabase = async (connectorId: string, alias: string) => {
        try {
            const res = await removeDatabaseAction(connectorId, alias);
            if (res.success) {
                toast({ title: "Database Removed" });
                fetchConnectors();
            } else {
                toast({ title: "Error", description: res.error, variant: "destructive" });
            }
        } catch (error) {
            toast({ title: "Error", description: "Failed to remove database", variant: "destructive" });
        }
    };

    if (loading) {
        return (
            <div className="flex h-full w-full items-center justify-center pt-20">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-8 p-6 max-w-5xl mx-auto">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight">Database Configuration</h1>
                <p className="text-muted-foreground text-lg">
                    Manage database connections for each of your deployed connectors.
                </p>
            </div>

            {connectors.length === 0 ? (
                <div className="text-center py-12 border rounded-xl bg-muted/10 border-dashed">
                    <Server className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
                    <h3 className="text-lg font-semibold">No Connectors Found</h3>
                    <p className="text-muted-foreground">You need to deploy a connector first.</p>
                </div>
            ) : (
                <div className="grid gap-8">
                    {connectors.map((connector) => (
                        <Card key={connector.id} className="overflow-hidden border-2">
                            <CardHeader className="bg-muted/30 pb-4">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                        <Server className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-xl">{connector.name}</CardTitle>
                                        <CardDescription className="flex flex-wrap items-center gap-2 mt-1">
                                            <span className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded">{connector.id}</span>
                                            <span className="text-xs text-muted-foreground truncate max-w-[200px] md:max-w-[300px]">{connector.url}</span>
                                        </CardDescription>
                                    </div>
                                    {connector.envPrefix && (
                                        <Badge variant="outline" className="ml-auto bg-primary/5 text-primary border-primary/20 gap-1.5">
                                            <Variable className="h-3 w-3" />
                                            Prefix: {connector.envPrefix}
                                        </Badge>
                                    )}
                                </div>
                            </CardHeader>

                            <CardContent className="p-6">
                                <div className="space-y-6">
                                    {/* Existing Databases */}
                                    <div>
                                        <h4 className="text-sm font-semibold mb-4 flex items-center gap-2 text-muted-foreground">
                                            <Database className="h-4 w-4" /> Configured Databases
                                        </h4>

                                        {!connector.databases || Object.keys(connector.databases).length === 0 ? (
                                            <p className="text-sm text-muted-foreground italic pl-6">No extra databases configured.</p>
                                        ) : (
                                            <div className="grid gap-3 pl-2">
                                                {Object.entries(connector.databases).map(([alias, config]) => (
                                                    <div key={alias} className="flex items-center justify-between p-3 rounded-lg border bg-card hover:shadow-sm transition-all group border-l-4 border-l-primary/30">
                                                        <div className="flex flex-col gap-1.5">
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-bold text-sm bg-primary/10 text-primary px-2 py-0.5 rounded tracking-tight">{alias}</span>
                                                                <span className="text-xs text-muted-foreground">points to</span>
                                                                <span className="text-xs font-mono font-medium text-foreground">{config.dbName}</span>
                                                            </div>
                                                            <div className="flex items-center gap-3">
                                                                <Badge variant="secondary" className="text-[9px] h-4 px-1.5 uppercase font-bold tracking-wider">
                                                                    {config.type || 'mongodb'}
                                                                </Badge>
                                                                <div className="flex items-center gap-1.5 group/uri">
                                                                    <Variable className="h-3 w-3 text-muted-foreground/60" />
                                                                    <div className="text-[10px] text-muted-foreground font-mono truncate max-w-[300px] opacity-80">
                                                                        {config.uri}
                                                                    </div>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="h-4 w-4 opacity-0 group-hover/uri:opacity-100 transition-opacity"
                                                                        onClick={() => {
                                                                            navigator.clipboard.writeText(config.uri);
                                                                            toast({ title: "Copied!", description: "Variable name copied." });
                                                                        }}
                                                                    >
                                                                        <Copy className="h-2.5 w-2.5" />
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                                                            onClick={() => handleRemoveDatabase(connector.id, alias)}
                                                        >
                                                            <Trash className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Add New Section */}
                                    <div className="bg-muted/30 p-5 rounded-2xl border border-dashed border-primary/20">
                                        <div className="flex items-center gap-2 mb-4">
                                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                                <Plus className="h-4 w-4" />
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-bold">Add Database Alias</h4>
                                                <p className="text-[10px] text-muted-foreground italic">Target specific databases based on form needs.</p>
                                            </div>
                                        </div>

                                        <div className="flex flex-col lg:flex-row gap-4 items-end">
                                            <div className="grid gap-2 flex-[2] w-full">
                                                <div className="flex items-center justify-between">
                                                    <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                                                        URI Reference <Variable className="h-3 w-3 text-primary" />
                                                    </label>
                                                    <div className="group relative">
                                                        <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                                                        <div className="absolute bottom-full right-0 mb-2 w-48 p-2 bg-popover text-popover-foreground text-[10px] rounded shadow-lg border opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                                                            Enter the EXACT name of the environment variable you will set in Vercel (e.g., MONGODB_URI_PROD).
                                                        </div>
                                                    </div>
                                                </div>
                                                <Input
                                                    placeholder="e.g. MONGODB_URI_PRODUCTION"
                                                    className="h-10 bg-background font-mono text-xs border-primary/10 focus:border-primary/30"
                                                    value={newDbInputs[connector.id]?.uri || ""}
                                                    onChange={e => handleInputChange(connector.id, 'uri', e.target.value)}
                                                />
                                            </div>
                                            <div className="grid gap-2 flex-1 w-full">
                                                <label className="text-xs font-bold text-foreground">DB Type</label>
                                                <Select
                                                    value={newDbInputs[connector.id]?.type || "mongodb"}
                                                    onValueChange={val => handleInputChange(connector.id, 'type', val)}
                                                >
                                                    <SelectTrigger className="h-10 text-xs border-primary/10">
                                                        <SelectValue placeholder="Select Type" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="mongodb">MongoDB</SelectItem>
                                                        <SelectItem value="postgres">PostgreSql</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="grid gap-2 flex-1 w-full">
                                                <label className="text-xs font-bold text-foreground">Internal Name</label>
                                                <Input
                                                    placeholder="e.g. main_db"
                                                    className="h-10 bg-background border-primary/10"
                                                    value={newDbInputs[connector.id]?.dbName || ""}
                                                    onChange={e => handleInputChange(connector.id, 'dbName', e.target.value)}
                                                />
                                            </div>
                                            <Button size="sm" onClick={() => handleAddDatabase(connector.id)} className="h-10 px-6 font-bold shadow-sm">
                                                Save Alias
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
