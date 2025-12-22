"use client";

import { useState } from "react";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
    Alert,
    AlertDescription,
    AlertTitle,
} from "@/components/ui/alert";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Eye,
    EyeOff,
    Copy,
    RefreshCw,
    AlertTriangle,
    CheckCircle2,
    ShieldCheck
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type Connector = {
    id: string;
    name: string;
    connectorId: string;
    secret: string;
    environment: "Production" | "Development";
    lastUsed: string;
};

const INITIAL_CONNECTORS: Connector[] = [
    {
        id: "c1",
        name: "Primary Prod",
        connectorId: "conn_prod_8x92m",
        secret: "sk_live_51Mx92...",
        environment: "Production",
        lastUsed: "5 mins ago",
    },
    {
        id: "c2",
        name: "Dev Local",
        connectorId: "conn_dev_k29s8",
        secret: "sk_test_48Kv21...",
        environment: "Development",
        lastUsed: "2 days ago",
    },
];

export default function ConnectorsPage() {
    const [connectors, setConnectors] = useState<Connector[]>(INITIAL_CONNECTORS);
    const [visibleSecrets, setVisibleSecrets] = useState<Record<string, boolean>>({});

    const toggleSecret = (id: string) => {
        setVisibleSecrets(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const copyToClipboard = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        toast({ title: "Copied!", description: `${label} copied to clipboard.` });
    };

    const rotateSecret = (id: string) => {
        toast({
            title: "Secret Rotated",
            description: "Previous secret is now invalid. Update your apps.",
            variant: "destructive"
        });
    };

    return (
        <div className="flex flex-col gap-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Connectors & Secrets</h1>
                    <p className="text-muted-foreground">
                        Manage access keys for your PostPipe integrations.
                    </p>
                </div>
                <Button>
                    <ShieldCheck className="mr-2 h-4 w-4" />
                    New Connector
                </Button>
            </div>

            <Alert variant="default" className="bg-amber-500/10 text-amber-600 border-amber-500/20">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Security Warning</AlertTitle>
                <AlertDescription>
                    Never share your secrets. Rotate them immediately if you suspect a leak.
                </AlertDescription>
            </Alert>

            <div className="grid gap-6">
                {connectors.map((connector) => (
                    <Card key={connector.id} className="overflow-hidden">
                        <CardHeader className="bg-muted/40">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <CardTitle className="text-lg">{connector.name}</CardTitle>
                                    <Badge variant={connector.environment === 'Production' ? 'default' : 'outline'}>
                                        {connector.environment}
                                    </Badge>
                                </div>
                                <div className="text-sm text-muted-foreground">
                                    Last used: {connector.lastUsed}
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6 grid gap-6 md:grid-cols-2">
                            {/* Connector ID */}
                            <div className="space-y-2">
                                <Label>Connector ID</Label>
                                <div className="flex items-center gap-2">
                                    <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold flex-1">
                                        {connector.connectorId}
                                    </code>
                                    <Button variant="ghost" size="icon" onClick={() => copyToClipboard(connector.connectorId, "Connector ID")}>
                                        <Copy className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>

                            {/* Secret Key */}
                            <div className="space-y-2">
                                <Label>Secret Key</Label>
                                <div className="flex items-center gap-2">
                                    <div className="relative flex-1 group">
                                        <code className={cn("rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold block w-full truncate", !visibleSecrets[connector.id] && "blur-sm select-none")}>
                                            {visibleSecrets[connector.id] ? connector.secret : "sk_live_•••••••••••••••••••••"}
                                        </code>
                                        {!visibleSecrets[connector.id] && (
                                            <div className="absolute inset-0 flex items-center justify-center bg-transparent group-hover:bg-muted/10 transition">
                                                <span className="sr-only">Hidden</span>
                                            </div>
                                        )}
                                    </div>
                                    <Button variant="ghost" size="icon" onClick={() => toggleSecret(connector.id)}>
                                        {visibleSecrets[connector.id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </Button>
                                    <Button variant="ghost" size="icon" onClick={() => copyToClipboard(connector.secret, "Secret Key")} disabled={!visibleSecrets[connector.id]}>
                                        <Copy className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="bg-muted/40 p-4 flex justify-end">
                            <Dialog>
                                <DialogTrigger asChild>
                                    <Button variant="outline" className="text-destructive hover:text-destructive">
                                        <RefreshCw className="mr-2 h-4 w-4" />
                                        Rotate Secret
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Rotate Secret Key?</DialogTitle>
                                        <DialogDescription>
                                            This will check invalidates the current secret key for <strong>{connector.name}</strong>.
                                            All applications using this key will immediately lose access until updated.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <DialogFooter>
                                        <Button variant="outline">Cancel</Button>
                                        <Button variant="destructive" onClick={() => rotateSecret(connector.id)}>Yes, Rotate Secret</Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </CardFooter>
                    </Card>
                ))}
            </div>
        </div>
    );
}
