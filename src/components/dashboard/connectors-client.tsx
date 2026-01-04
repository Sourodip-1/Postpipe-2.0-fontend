"use client";
// Force refresh

import { useState } from "react";
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RainbowButton } from "@/components/ui/rainbow-button";
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
    ShieldCheck,
    CheckCircle2,
    Trash2
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { registerConnectorAction } from "@/app/actions/register";
import { deleteConnectorAction } from "@/app/actions/dashboard";

type Connector = {
    id: string; // The UUID (conn_...)
    name: string;
    secret: string;
    url: string;
    targetDatabase?: string;
    databases?: Record<string, {
        uri: string;
        dbName: string;
    }>;
    status: "Verified" | "Not Verified";
    lastUsed: string;
};


interface ConnectorsClientProps {
    initialConnectors: any[];
    databaseConfig?: any;
}

export default function ConnectorsClient({ initialConnectors, databaseConfig }: ConnectorsClientProps) {
    const [connectors, setConnectors] = useState<Connector[]>(initialConnectors);
    const [visibleSecrets, setVisibleSecrets] = useState<Record<string, boolean>>({});
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    // New Connector State
    const [newName, setNewName] = useState("");
    const [newUrl, setNewUrl] = useState("");
    const [targetDatabase, setTargetDatabase] = useState("default");
    const [isRegistering, setIsRegistering] = useState(false);

    const toggleSecret = (id: string) => {
        setVisibleSecrets(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const copyToClipboard = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        toast({ title: "Copied!", description: `${label} copied to clipboard.` });
    };

    const deleteConnector = async (id: string, connectorId: string) => {
        try {
            // Optimistic update
            const prev = connectors;
            setConnectors(prev => prev.filter(c => c.id !== id));

            // Server Action
            // Note: DB expects the string UUID (c.id from props), but our local state id might be _id
            // Let's pass the connectorId (the UUID) if that's what deleteConnector expects
            // Looking at server-db.ts, deleteConnector uses 'id' which is the UUID.
            await deleteConnectorAction(connectorId);

            toast({ title: "Connector Deleted", description: "The connector has been removed." });
        } catch (e) {
            toast({ title: "Error", description: "Failed to delete connector", variant: "destructive" });
        }
    };

    const rotateSecret = (id: string) => {
        toast({
            title: "Secret Rotated",
            description: "Previous secret is now invalid. Update your apps.",
            variant: "destructive"
        });
    };

    const handleRegisterConnector = async () => {
        if (!newName || !newUrl) return;

        setIsRegistering(true);
        const FormDataObj = new FormData();
        FormDataObj.append('name', newName);
        FormDataObj.append('url', newUrl);
        if (targetDatabase && targetDatabase !== "default") {
            FormDataObj.append('targetDatabase', targetDatabase);
        }

        try {
            const res = await registerConnectorAction(FormDataObj);

            if (res.error) {
                toast({ title: "Registration Failed", description: res.error, variant: "destructive" });
            } else {
                const newConnector: Connector = {
                    id: res.connectorId || '',
                    name: newName,
                    secret: res.connectorSecret || '',
                    url: newUrl,
                    targetDatabase: targetDatabase === "default" ? undefined : targetDatabase,
                    status: "Verified",
                    lastUsed: "Just now",
                };

                setConnectors(prev => [...prev, newConnector]);
                setNewName("");
                setNewUrl("");
                setIsDialogOpen(false);
                toast({ title: "Connector Registered", description: "You can now use this connector in your forms." });
            }
        } catch (error) {
            toast({ title: "Error", description: "Something went wrong.", variant: "destructive" });
        } finally {
            setIsRegistering(false);
        }
    };

    return (
        <div className="flex flex-col gap-8" >
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Connectors & Secrets</h1>
                    <p className="text-muted-foreground">
                        Manage your deployed PostPipe connectors.
                    </p>
                </div>

                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <RainbowButton className="h-9 px-4 text-xs rounded-none text-white bg-[#181818]">
                            <ShieldCheck className="mr-2 h-3.5 w-3.5" />
                            <span className="whitespace-pre-wrap text-center font-medium leading-none tracking-tight">New Connector</span>
                        </RainbowButton>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Register New Connector</DialogTitle>
                            <DialogDescription>
                                Enter the details of your deployed connector.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="name">Connector Name</Label>
                                <Input
                                    id="name"
                                    placeholder="e.g. Production Azure"
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="url">Deployment URL</Label>
                                <Input
                                    id="url"
                                    placeholder="https://my-connector.vercel.app"
                                    value={newUrl}
                                    onChange={(e) => setNewUrl(e.target.value)}
                                />
                            </div>


                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                            <Button onClick={handleRegisterConnector} disabled={isRegistering}>
                                {isRegistering ? "Verifying..." : "Register Connector"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div >

            <Alert variant="default" className="bg-amber-500/10 text-amber-600 border-amber-500/20">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Security Warning</AlertTitle>
                <AlertDescription>
                    Never share your secrets. Your database credentials never leave your infrastructure.
                </AlertDescription>
            </Alert>

            <div className="grid gap-6">
                {connectors.map((connector) => (
                    <Card key={connector.id} className="overflow-hidden">
                        <CardHeader className="bg-muted/40">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <CardTitle className="text-lg">{connector.name}</CardTitle>
                                    <Badge variant="outline" className={cn(
                                        "gap-1",
                                        connector.status === 'Verified' ? "border-green-500 text-green-500" : "border-yellow-500 text-yellow-500"
                                    )}>
                                        {connector.status === 'Verified' ? <CheckCircle2 className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
                                        {connector.status}
                                    </Badge>
                                    {connector.targetDatabase && (
                                        <Badge variant="secondary" className="gap-1 bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 border-blue-500/20">
                                            <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                                            {connector.targetDatabase}
                                        </Badge>
                                    )}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                    Last used: {connector.lastUsed}
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6 grid gap-6 md:grid-cols-2">
                            {/* Connector Info */}
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Deployment URL</Label>
                                    <div className="text-sm font-mono text-muted-foreground truncate bg-muted p-2 rounded">
                                        {connector.url}
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Connector ID</Label>
                                    <div className="flex items-center gap-2">
                                        <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold flex-1">
                                            {connector.id}
                                        </code>
                                        <Button variant="ghost" size="icon" onClick={() => copyToClipboard(connector.id, "Connector ID")}>
                                            <Copy className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            {/* Secret Key */}
                            <div className="space-y-2">
                                <Label>Connector Secret</Label>
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
                                <p className="text-[0.8rem] text-muted-foreground pt-1">
                                    This secret key acts as the password for your connector.
                                </p>
                            </div>
                        </CardContent>
                        <CardFooter className="bg-muted/40 p-4 flex justify-between">
                            <Dialog>
                                <DialogTrigger asChild>
                                    <Button variant="ghost" className="text-muted-foreground hover:text-destructive text-xs h-8">
                                        <Trash2 className="mr-2 h-3 w-3" />
                                        Delete
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Delete Connector?</DialogTitle>
                                        <DialogDescription>
                                            Are you sure you want to delete <strong>{connector.name}</strong>?
                                            This action cannot be undone and any forms using this connector will stop working.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <DialogFooter>
                                        <Button variant="outline">Cancel</Button>
                                        <Button variant="destructive" onClick={() => deleteConnector(connector.id, connector.id)}>Delete Connector</Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>

                            <Dialog>
                                <DialogTrigger asChild>
                                    <Button variant="outline" className="text-xs h-8">
                                        <RefreshCw className="mr-2 h-3 w-3" />
                                        Rotate Secret
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Rotate Secret Key?</DialogTitle>
                                        <DialogDescription>
                                            This will invalidate the current secret key for <strong>{connector.name}</strong>.
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
        </div >
    );
}
