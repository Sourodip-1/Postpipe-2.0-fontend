"use client"

import { ExploreCard } from "./ExploreCard"
import { ExploreModal } from "./ExploreModal"
import { Button } from "@/components/ui/button"
import { RainbowButton } from "@/components/ui/rainbow-button"
import { ChevronRight } from "lucide-react"
import * as React from "react"

const MOCK_ITEMS = [
    {
        title: "ASMR Background",
        image: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop",
        author: { name: "Ashish Rajwani" },
        tags: ["React", "Background"]
    },
    {
        title: "Design Testimonial",
        image: "https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=2629&auto=format&fit=crop",
        author: { name: "Jatin Yadav" },
        tags: ["UI", "Social"]
    },
    {
        title: "Spatial Product",
        image: "https://images.unsplash.com/photo-1615672962456-11b7dffa635f?q=80&w=2574&auto=format&fit=crop",
        author: { name: "Dahwik Harihar" },
        tags: ["3D", "Product"]
    },
    {
        title: "Audio Visualizer",
        image: "https://images.unsplash.com/photo-1478737270239-2f02b77ac6d5?q=80&w=2676&auto=format&fit=crop",
        author: { name: "Jatin Audio" },
        tags: ["Audio", "Canvas"]
    },
    {
        title: "Glowing Effect",
        image: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=2670&auto=format&fit=crop",
        author: { name: "Aceternity UI" },
        tags: ["CSS", "Effects"]
    },
    {
        title: "Spline Scene",
        image: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?q=80&w=2670&auto=format&fit=crop",
        author: { name: "Serafim" },
        tags: ["3D", "Spline"]
    },
]

export function ExplorePageContent() {
    const [selectedItem, setSelectedItem] = React.useState<typeof MOCK_ITEMS[0] | null>(null)

    return (
        <div className="flex-1 space-y-8 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Components</h2>
                    <p className="text-muted-foreground">
                        Discover the latest and greatest components for your next project.
                    </p>
                </div>
            </div>

            <section>
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Newest</h3>
                    <RainbowButton className="hidden sm:flex h-8 px-4 text-xs rounded-none after:rounded-none">
                        View all <ChevronRight className="ml-1 h-3 w-3" />
                    </RainbowButton>
                </div>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {MOCK_ITEMS.slice(0, 4).map((item, i) => (
                        <ExploreCard key={i} {...item} onClick={() => setSelectedItem(item)} />
                    ))}
                </div>
            </section>

            <section>
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Popular</h3>
                    <RainbowButton className="hidden sm:flex h-8 px-4 text-xs rounded-none after:rounded-none">
                        View all <ChevronRight className="ml-1 h-3 w-3" />
                    </RainbowButton>
                </div>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {MOCK_ITEMS.slice(2, 6).map((item, i) => (
                        <ExploreCard key={i} {...item} onClick={() => setSelectedItem(item)} />
                    ))}
                </div>
            </section>

            <ExploreModal
                open={!!selectedItem}
                onOpenChange={(open: boolean) => !open && setSelectedItem(null)}
                item={selectedItem}
            />
        </div>
    )
}
