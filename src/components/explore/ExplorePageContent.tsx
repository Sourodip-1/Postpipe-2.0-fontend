"use client"

import { ExploreCard } from "./ExploreCard"
import { ExploreModal } from "./ExploreModal"
import { RainbowButton } from "@/components/ui/rainbow-button"
import { ChevronRight } from "lucide-react"
import * as React from "react"
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from "@/components/ui/carousel"

// ... (previous imports)

interface Template {
    _id: string;
    name: string;
    slug: string;
    category: string;
    tags: string[];
    author: { name: string; profileUrl?: string };
    thumbnailUrl: string;
    demoGifUrl: string;
    isPublished: boolean;
    cli?: string;
    aiPrompt?: string;
    npmPackageUrl?: string;
}

interface ExplorePageContentProps {
    templates?: Template[];
}

export function ExplorePageContent({ templates = [] }: ExplorePageContentProps) {
    const [selectedItem, setSelectedItem] = React.useState<any>(null)

    const masterTemplates = React.useMemo(() => {
        return templates.filter(t =>
            t.tags?.some(tag => ['master', 'Master', 'MASTER', 'Master Template'].includes(tag))
        );
    }, [templates]);

    const otherTemplates = React.useMemo(() => {
        return templates.filter(t =>
            !t.tags?.some(tag => ['master', 'Master', 'MASTER', 'Master Template'].includes(tag))
        );
    }, [templates]);

    // Map template to ExploreCard props
    // We now pass the full template or an extended object to the modal via selectedItem
    // But for ExploreCard component itself, we only need the visual props.
    // However, we set `selectedItem` to the ORIGINAL template object (item) directly in the onClick.
    // Wait, looking at lines 85 and 111: onClick={() => setSelectedItem(item)}
    // `item` there IS the original template object from the map function (line 80 and 107).
    // BUT, line 125 passes: item={selectedItem ? mapToCardProps(selectedItem) : null}
    // This explicitly strips the data. I need to change line 125 to pass `selectedItem` directly on top of mapToCardProps or just merge them.
    // Map template to ExploreCard props
    const mapToCardProps = (t: Template) => ({
        title: t.name,
        // Card shows thumbnail
        image: t.thumbnailUrl || (t.demoGifUrl || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=60"),
        author: { name: t.author.name, avatar: t.author.profileUrl || "" },
        tags: t.tags
    });

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

            {masterTemplates.length > 0 && (
                <section>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-primary">Master Templates</h3>
                    </div>
                    <div className="relative px-12">
                        <Carousel
                            opts={{
                                align: "start",
                            }}
                            className="w-full"
                        >
                            <CarouselContent>
                                {masterTemplates.map((item) => (
                                    <CarouselItem key={item._id} className="md:basis-1/2 lg:basis-1/3">
                                        <div className="p-1">
                                            <ExploreCard
                                                {...mapToCardProps(item)}
                                                onClick={() => setSelectedItem(item)}
                                                className="border-primary/20 bg-primary/5"
                                            />
                                        </div>
                                    </CarouselItem>
                                ))}
                            </CarouselContent>
                            <CarouselPrevious />
                            <CarouselNext />
                        </Carousel>
                    </div>
                </section>
            )}

            <section>
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Newest</h3>
                    <RainbowButton className="hidden sm:flex h-8 px-4 text-xs rounded-none after:rounded-none">
                        View all <ChevronRight className="ml-1 h-3 w-3" />
                    </RainbowButton>
                </div>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {otherTemplates.map((item) => (
                        <ExploreCard
                            key={item._id}
                            {...mapToCardProps(item)}
                            onClick={() => setSelectedItem(item)}
                        />
                    ))}
                    {templates.length === 0 && (
                        <div className="col-span-full text-center py-10 text-muted-foreground">
                            No templates found.
                        </div>
                    )}
                </div>
            </section>

            <ExploreModal
                open={!!selectedItem}
                onOpenChange={(open: boolean) => !open && setSelectedItem(null)}
                item={selectedItem ? {
                    ...mapToCardProps(selectedItem),
                    // Override image for modal to show demoGifUrl if valid, else fallback to thumbnail
                    image: (selectedItem.demoGifUrl && selectedItem.demoGifUrl.startsWith('http'))
                        ? selectedItem.demoGifUrl
                        : (selectedItem.thumbnailUrl || (selectedItem.demoGifUrl || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=60")),
                    cli: selectedItem.cli,
                    aiPrompt: selectedItem.aiPrompt,
                    npmPackageUrl: selectedItem.npmPackageUrl
                } : null}
            />
        </div>
    )
}
