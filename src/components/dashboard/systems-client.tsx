"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { RainbowButton } from "@/components/ui/rainbow-button";
import {
    Terminal,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { getSystems, toggleFavoriteSystem } from "@/lib/actions/systems";
import { ExploreCard } from "@/components/explore/ExploreCard";
import { ExploreModal } from "@/components/explore/ExploreModal";

type System = {
    id: string;
    name: string;
    type: string;
    database: string;
    status: "Active" | "Disabled";
    environment: "Dev" | "Prod";
    lastUsed: string;
    isFavorite: boolean;
    image: string;
    author: { name: string; profileUrl?: string };
    tags: string[];
    cli?: string;
    aiPrompt?: string;
    npmPackageUrl?: string;
};

export default function SystemsClient() {
    const [systems, setSystems] = useState<System[]>([]);
    const [selectedSystem, setSelectedSystem] = useState<System | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSystems = async () => {
            try {
                const data = await getSystems();
                setSystems(data as any);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        fetchSystems();
    }, []);

    const toggleFavorite = async (id: string) => {
        // Optimistic update
        setSystems(prev => prev.map(sys =>
            sys.id === id ? { ...sys, isFavorite: !sys.isFavorite } : sys
        ));

        const res = await toggleFavoriteSystem(id);
        if (res.success) {
            toast({ description: "Favorites updated" });
        } else {
            // Revert if failed
            setSystems(prev => prev.map(sys =>
                sys.id === id ? { ...sys, isFavorite: !sys.isFavorite } : sys
            ));
        }
    };

    const sortedSystems = [...systems].sort((a, b) => {
        if (a.isFavorite === b.isFavorite) return 0;
        return a.isFavorite ? -1 : 1;
    });

    return (
        <div className="flex flex-col gap-8">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Backend Systems</h1>
                    <p className="text-muted-foreground">
                        Manage your dynamic backend infrastructure.
                    </p>
                </div>
                <Link href="/explore">
                    <RainbowButton className="h-9 px-4 text-xs text-white w-full md:w-auto">
                        <Terminal className="mr-2 h-3.5 w-3.5" />
                        <span className="whitespace-pre-wrap text-center font-medium leading-none tracking-tight">
                            New System
                        </span>
                    </RainbowButton>
                </Link>
            </div>

            {loading ? (
                <div className="text-center py-10 text-muted-foreground">Loading specific systems...</div>
            ) : systems.length === 0 ? (
                <div className="text-center py-20 border border-dashed rounded-lg">
                    <h3 className="text-lg font-medium">No Backend Systems</h3>
                    <p className="text-muted-foreground text-sm mt-1 mb-4">
                        You haven&apos;t added any systems yet. Explore templates to add one.
                    </p>
                    <Link href="/explore">
                        <Button variant="outline">Browse Templates</Button>
                    </Link>
                </div>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {sortedSystems.map((system) => (
                        <div key={system.id} className="relative group">
                            <ExploreCard
                                title={system.name}
                                image={system.image}
                                author={{ name: system.author.name, avatar: system.author.profileUrl }}
                                tags={[system.status, system.environment, ...system.tags].slice(0, 3)}
                                onClick={() => setSelectedSystem(system)}
                            />
                            {/* Optional: Add a subtle favorite button overlay? User didn't ask explicitly but it was there */}
                        </div>
                    ))}
                </div>
            )}

            <ExploreModal
                open={!!selectedSystem}
                onOpenChange={(open) => !open && setSelectedSystem(null)}
                item={selectedSystem ? {
                    id: selectedSystem.id,
                    title: selectedSystem.name,
                    author: {
                        name: selectedSystem.author.name,
                        avatar: selectedSystem.author.profileUrl
                    },
                    image: selectedSystem.image,
                    tags: selectedSystem.tags,
                    cli: selectedSystem.cli,
                    aiPrompt: selectedSystem.aiPrompt,
                    npmPackageUrl: selectedSystem.npmPackageUrl
                } : null}
            />
        </div>
    );
}
