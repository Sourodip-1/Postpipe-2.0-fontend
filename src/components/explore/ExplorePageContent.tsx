"use client"

import { ExploreCard } from "./ExploreCard"
import { ExploreModal } from "./ExploreModal"
import { RainbowButton } from "@/components/ui/rainbow-button"
import SlidingPagination from "@/components/ui/sliding-pagination"
import { ChevronRight } from "lucide-react"
import * as React from "react"
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from "@/components/ui/carousel"
import { BeamsBackground } from "@/components/ui/beams-background"
import { Particles } from "@/components/ui/particles"
import { useTheme } from "next-themes"

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
    databaseConfigurations?: {
        databaseName: string;
        logo: string;
        prompt: string;
    }[];
}

interface ExplorePageContentProps {
    templates?: Template[];
}

export function ExplorePageContent({ templates = [] }: ExplorePageContentProps) {
    const [selectedItem, setSelectedItem] = React.useState<any>(null)
    const { resolvedTheme } = useTheme()
    const [mounted, setMounted] = React.useState(false)

    React.useEffect(() => {
        setMounted(true)
    }, [])

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

    const ITEMS_PER_PAGE = 8;
    const totalPages = Math.ceil(otherTemplates.length / ITEMS_PER_PAGE);
    const [currentPage, setCurrentPage] = React.useState(1);

    const paginatedItems = React.useMemo(() => {
        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        return otherTemplates.slice(start, start + ITEMS_PER_PAGE);
    }, [otherTemplates, currentPage]);

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
        id: t._id,
        title: t.name,
        // Card shows thumbnail
        image: t.thumbnailUrl || (t.demoGifUrl || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=60"),
        author: { name: t.author.name, avatar: t.author.profileUrl || "" },
        tags: t.tags
    });

    return (
        <div className="flex-1 space-y-8 p-4 pt-6 md:p-8">
            <div className="relative w-full rounded-xl overflow-hidden mb-12 border border-border/50 bg-white dark:bg-neutral-950 shadow-2xl">
                <BeamsBackground className="absolute inset-0 z-0 h-full w-full hidden dark:block" intensity="subtle" />
                <div className="relative z-10 p-8 md:p-16 flex flex-col items-start gap-6">
                    <Particles
                        className="absolute inset-0 z-0 opacity-40"
                        quantity={100}
                        ease={80}
                        color={mounted && resolvedTheme === "dark" ? "#ffffff" : "#000000"}
                        refresh={false}
                    />
                    <div className="flex flex-col gap-3 relative z-10 max-w-3xl">
                        <div className="inline-flex items-center rounded-full border border-neutral-200 dark:border-white/10 bg-neutral-100 dark:bg-white/5 px-3 py-1 text-xs font-medium text-neutral-900 dark:text-white backdrop-blur-md w-fit mb-2">
                            <span className="flex h-2 w-2 rounded-full bg-primary mr-2 animate-pulse"></span>
                            Release 2.0
                        </div>
                        <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-neutral-900 dark:text-white drop-shadow-sm">
                            Forge
                            <span className="text-primary">.</span>
                        </h1>
                        <p className="text-xl md:text-2xl text-muted-foreground font-light leading-relaxed">
                            Build, ship, and scale your backend with production-ready templates.
                        </p>
                    </div>
                </div>
                {/* Decorative bottom gradient */}
                <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white dark:from-neutral-950 to-transparent pointer-events-none" />
            </div>

            {masterTemplates.length > 0 && (
                <section>
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-2">
                            <div className="h-6 w-1 rounded-full bg-primary/50" />
                            <h3 className="text-xl font-semibold tracking-tight">Master Templates</h3>
                        </div>
                    </div>

                    {masterTemplates.length === 1 ? (
                        <div className="relative w-full overflow-hidden rounded-xl border border-border/50 bg-white dark:bg-neutral-950 shadow-2xl group cursor-pointer" onClick={() => setSelectedItem(masterTemplates[0])}>
                            {/* Hero Banner Background - using the thumbnail as a blurred backdrop */}
                            <div className="absolute inset-0 z-0 overflow-hidden">
                                <img
                                    src={masterTemplates[0].thumbnailUrl || masterTemplates[0].demoGifUrl || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=60"}
                                    alt="Background"
                                    className="h-full w-full object-cover opacity-10 dark:opacity-20 blur-md"
                                />
                                <div className="absolute inset-0 bg-gradient-to-r from-white via-white/80 dark:from-neutral-950 dark:via-neutral-950/80 to-transparent" />
                            </div>

                            <div className="relative z-10 flex flex-col md:flex-row gap-6 p-6 md:p-10 items-center">
                                {/* Featured Image */}
                                <div className="w-full md:w-3/5 lg:w-2/3 aspect-video md:aspect-[21/9] relative rounded-lg overflow-hidden border border-neutral-200 dark:border-white/10 shadow-lg group-hover:shadow-primary/20 transition-all duration-500">
                                    <img
                                        src={masterTemplates[0].thumbnailUrl || masterTemplates[0].demoGifUrl || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=60"}
                                        alt={masterTemplates[0].name}
                                        className="h-full w-full object-cover"
                                    />
                                    {/* Overlay Gradient */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-60" />
                                </div>

                                {/* Content Side */}
                                <div className="w-full md:w-2/5 lg:w-1/3 flex flex-col gap-4 items-start justify-center">
                                    <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary backdrop-blur-md">
                                        Featured Master Template
                                    </div>
                                    <h3 className="text-3xl md:text-4xl font-bold tracking-tight text-neutral-900 dark:text-white group-hover:text-primary transition-colors duration-300">
                                        {masterTemplates[0].name}
                                    </h3>
                                    <p className="text-muted-foreground text-lg line-clamp-3">
                                        A high-quality, production-ready component to kickstart your next big project.
                                    </p>
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        {masterTemplates[0].tags.slice(0, 3).map(tag => (
                                            <span key={tag} className="px-2 py-1 rounded-md bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10 text-xs text-neutral-600 dark:text-neutral-400">
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="relative px-4 md:px-12">
                            <Carousel
                                opts={{
                                    align: "start",
                                    loop: masterTemplates.length > 1,
                                }}
                                className="w-full"
                            >
                                <CarouselContent>
                                    {masterTemplates.map((item) => (
                                        <CarouselItem
                                            key={item._id}
                                            className="md:basis-1/2 lg:basis-1/3 pl-4"
                                        >
                                            <div className="h-full p-1">
                                                <ExploreCard
                                                    {...mapToCardProps(item)}
                                                    onClick={() => setSelectedItem(item)}
                                                    className="border-primary/20 bg-primary/5 h-full transition-all duration-300"
                                                />
                                            </div>
                                        </CarouselItem>
                                    ))}
                                </CarouselContent>
                                <CarouselPrevious />
                                <CarouselNext />
                            </Carousel>
                        </div>
                    )}
                </section>
            )}

            {otherTemplates.length > 0 && (
                <section>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold">Newest</h3>
                    </div>
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {paginatedItems.map((item) => (
                            <ExploreCard
                                key={item._id}
                                {...mapToCardProps(item)}
                                onClick={() => setSelectedItem(item)}
                            />
                        ))}
                    </div>

                    {totalPages > 1 && (
                        <div className="mt-8 flex justify-center">
                            <SlidingPagination
                                totalPages={totalPages}
                                currentPage={currentPage}
                                onPageChange={setCurrentPage}
                            />
                        </div>
                    )}
                </section>
            )}

            {templates.length === 0 && (
                <div className="text-center py-20 text-muted-foreground">
                    <p>No templates found matching your criteria.</p>
                </div>
            )}

            <ExploreModal
                open={!!selectedItem}
                onOpenChange={(open: boolean) => !open && setSelectedItem(null)}
                item={selectedItem ? {
                    ...mapToCardProps(selectedItem),
                    id: selectedItem._id,
                    image: (selectedItem.demoGifUrl && selectedItem.demoGifUrl.startsWith('http'))
                        ? selectedItem.demoGifUrl
                        : (selectedItem.thumbnailUrl || (selectedItem.demoGifUrl || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=60")),
                    cli: selectedItem.cli,
                    aiPrompt: selectedItem.aiPrompt,
                    npmPackageUrl: selectedItem.npmPackageUrl,
                    databaseConfigurations: selectedItem.databaseConfigurations
                } : null}
            />
        </div>
    );
}
