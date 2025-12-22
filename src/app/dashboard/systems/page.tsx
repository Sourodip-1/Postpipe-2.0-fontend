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
import { Badge } from "@/components/ui/badge";
import { RainbowButton } from "@/components/ui/rainbow-button";
import {
    MoreHorizontal,
    Star,
    Terminal,
    FolderOpen,
    RefreshCw,
    Database,
    Lock,
    ShoppingCart
} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type System = {
    id: string;
    name: string;
    type: "Auth" | "Ecommerce" | "Custom";
    database: "MongoDB" | "Postgres";
    status: "Active" | "Disabled";
    environment: "Dev" | "Prod";
    lastUsed: string;
    isFavorite: boolean;
};

const INITIAL_SYSTEMS: System[] = [
    {
        id: "1",
        name: "PostPipe Auth",
        type: "Auth",
        database: "MongoDB",
        status: "Active",
        environment: "Prod",
        lastUsed: "2 hours ago",
        isFavorite: true,
    },
    {
        id: "2",
        name: "E-commerce V1",
        type: "Ecommerce",
        database: "Postgres",
        status: "Active",
        environment: "Dev",
        lastUsed: "2 days ago",
        isFavorite: false,
    },
    {
        id: "3",
        name: "Legacy Blog",
        type: "Custom",
        database: "MongoDB",
        status: "Disabled",
        environment: "Dev",
        lastUsed: "1 month ago",
        isFavorite: false,
    },
];

export default function SystemsPage() {
    const [systems, setSystems] = useState<System[]>(INITIAL_SYSTEMS);

    const toggleFavorite = (id: string) => {
        setSystems(prev => prev.map(sys =>
            sys.id === id ? { ...sys, isFavorite: !sys.isFavorite } : sys
        ));
        toast({ description: "Favorites updated" });
    };

    const copyCommand = (type: string) => {
        const cmd = `npx create-postpipe-${type.toLowerCase()}`;
        navigator.clipboard.writeText(cmd);
        toast({ title: "Copied CLI Command", description: cmd });
    }

    const sortedSystems = [...systems].sort((a, b) => {
        if (a.isFavorite === b.isFavorite) return 0;
        return a.isFavorite ? -1 : 1;
    });

    return (
        <div className="flex flex-col gap-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Backend Systems</h1>
                    <p className="text-muted-foreground">
                        Manage your dynamic backend infrastructure.
                    </p>
                </div>
                <RainbowButton className="h-9 px-4 text-xs text-white">
                    <Terminal className="mr-2 h-3.5 w-3.5" />
                    <span className="whitespace-pre-wrap text-center font-medium leading-none tracking-tight">
                        New System
                    </span>
                </RainbowButton>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {sortedSystems.map((system) => (
                    <Card key={system.id} className="relative">
                        <div className="absolute top-4 right-4 z-10">
                            <Button
                                variant="ghost"
                                size="icon"
                                className={cn("h-8 w-8", system.isFavorite ? "text-yellow-500" : "text-muted-foreground/30 hover:text-yellow-500")}
                                onClick={() => toggleFavorite(system.id)}
                            >
                                <Star className={cn("h-5 w-5", system.isFavorite && "fill-yellow-500")} />
                            </Button>
                        </div>

                        <CardHeader>
                            <div className="flex items-center gap-3">
                                <div className="rounded-lg bg-primary/10 p-2 text-primary">
                                    {system.type === 'Auth' ? <Lock className="h-6 w-6" /> :
                                        system.type === 'Ecommerce' ? <ShoppingCart className="h-6 w-6" /> :
                                            <Database className="h-6 w-6" />}
                                </div>
                                <div>
                                    <CardTitle className="text-xl">{system.name}</CardTitle>
                                    <CardDescription className="flex items-center gap-2 mt-1">
                                        <Badge variant="outline" className="font-normal">{system.database}</Badge>
                                        <Badge variant={system.environment === 'Prod' ? 'default' : 'secondary'} className="text-xs">
                                            {system.environment}
                                        </Badge>
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-2">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">Status</span>
                                    <div className="flex items-center gap-2">
                                        <span className={cn("h-2 w-2 rounded-full", system.status === 'Active' ? "bg-green-500" : "bg-zinc-300")} />
                                        <span className="font-medium">{system.status}</span>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">Type</span>
                                    <span className="font-medium">{system.type}</span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">Last Used</span>
                                    <span className="text-muted-foreground">{system.lastUsed}</span>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="grid grid-cols-2 gap-2">
                            <Button variant="outline" className="w-full" onClick={() => copyCommand(system.type)}>
                                <Terminal className="mr-2 h-4 w-4" />
                                CLI
                            </Button>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" className="w-full">
                                        <MoreHorizontal className="mr-2 h-4 w-4" />
                                        Actions
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuLabel>System Actions</DropdownMenuLabel>
                                    <DropdownMenuItem onClick={() => toast({ description: "Opening file browser..." })}>
                                        <FolderOpen className="mr-2 h-4 w-4" /> View Files
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => toast({ description: "System regeneration started" })}>
                                        <RefreshCw className="mr-2 h-4 w-4" /> Regenerate
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem className="text-destructive">Archive System</DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </CardFooter>
                    </Card>
                ))}
            </div>
        </div>
    );
}
