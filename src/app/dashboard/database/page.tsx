"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Plus, Trash, Database, Server, XCircle, Save } from "lucide-react";
import { getConnectorsAction } from "@/app/actions/dashboard";
import { addDatabaseAction, removeDatabaseAction } from "@/app/actions/connector-databases";
import { toast } from "@/hooks/use-toast";

type Connector = {
    id: string;
    name: string;
    url: string;
    databases?: Record<string, {
        uri: string;
        dbName: string;
    }>;
};

export default function DatabasePage() {
    const [connectors, setConnectors] = useState<Connector[]>([]);
    const [loading, setLoading] = useState(true);

    // Temp state for new database inputs: { [connectorId]: { uri: "", dbName: "" } }
    const [newDbInputs, setNewDbInputs] = useState<Record<string, { uri: string, dbName: string }>>({});

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

    const handleInputChange = (connectorId: string, field: 'uri' | 'dbName', value: string) => {
        setNewDbInputs(prev => ({
            ...prev,
            [connectorId]: {
                ...(prev[connectorId] || { uri: "", dbName: "" }),
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
            const res = await addDatabaseAction(connectorId, alias, input.uri, input.dbName);
            if (res.success) {
                toast({ title: "Database Added", description: `Alias '${alias}' configured.` });

                // Clear inputs
                setNewDbInputs(prev => ({
                    ...prev,
                    [connectorId]: { uri: "", dbName: "" }
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
                                        <CardDescription className="flex items-center gap-2 mt-1">
                                            <span className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded">{connector.id}</span>
                                            <span className="text-xs text-muted-foreground truncate max-w-[300px]">{connector.url}</span>
                                        </CardDescription>
                                    </div>
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
                                                    <div key={alias} className="flex items-center justify-between p-3 rounded-lg border bg-card hover:shadow-sm transition-all group">
                                                        <div className="flex flex-col gap-1">
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-bold text-sm bg-primary/10 text-primary px-2 py-0.5 rounded">{alias}</span>
                                                                <span className="text-xs text-muted-foreground">→</span>
                                                                <span className="text-xs font-mono text-muted-foreground">{config.dbName}</span>
                                                            </div>
                                                            <div className="text-[10px] text-muted-foreground font-mono truncate max-w-[400px] opacity-70">
                                                                URI: {config.uri}
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
                                    <div className="bg-muted/20 p-4 rounded-xl border border-dashed">
                                        <h4 className="text-sm font-medium mb-3">Add New Database Alias</h4>
                                        <div className="flex flex-col md:flex-row gap-3 items-end">
                                            <div className="grid gap-1.5 flex-[2] w-full">
                                                <label className="text-xs font-medium text-muted-foreground">URI (or env:VAR_NAME)</label>
                                                <Input
                                                    placeholder="MONGODB_URI_PRODUCTION"
                                                    className="h-9 bg-background font-mono text-xs"
                                                    value={newDbInputs[connector.id]?.uri || ""}
                                                    onChange={e => handleInputChange(connector.id, 'uri', e.target.value)}
                                                />
                                            </div>
                                            <div className="grid gap-1.5 flex-1 w-full">
                                                <label className="text-xs font-medium text-muted-foreground">Database Name</label>
                                                <Input
                                                    placeholder="my_database"
                                                    className="h-9 bg-background"
                                                    value={newDbInputs[connector.id]?.dbName || ""}
                                                    onChange={e => handleInputChange(connector.id, 'dbName', e.target.value)}
                                                />
                                            </div>
                                            <Button size="sm" onClick={() => handleAddDatabase(connector.id)} className="h-9 px-4">
                                                Add <Plus className="ml-2 h-3 w-3" />
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
