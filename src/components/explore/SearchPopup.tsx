"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Search, CornerDownLeft } from "lucide-react"
import { getTemplates, getExploreFilters } from "@/lib/actions/explore"

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

interface SearchPopupProps {
    open: boolean
    setOpen: (open: boolean) => void
}

export function SearchPopup({ open, setOpen }: SearchPopupProps) {
    const router = useRouter()
    const [query, setQuery] = React.useState("")
    const [templates, setTemplates] = React.useState<any[]>([])
    const [categories, setCategories] = React.useState<string[]>([])
    const [loading, setLoading] = React.useState(true)

    React.useEffect(() => {
        const fetchData = async () => {
            setLoading(true)
            try {
                const [t, f] = await Promise.all([
                    getTemplates(),
                    getExploreFilters()
                ]);
                setTemplates(t);
                setCategories(f.categories);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        }
        if (open) {
            fetchData();
        }
    }, [open])

    const handleSearch = () => {
        if (!query.trim()) return;
        const searchParams = new URLSearchParams(window.location.search);
        searchParams.set("q", query);
        router.push(`/explore?${searchParams.toString()}`);
        setOpen(false);
    }

    const handleCategoryClick = (cat: string) => {
        const searchParams = new URLSearchParams(window.location.search);
        searchParams.set("category", cat);
        router.push(`/explore?${searchParams.toString()}`);
        setOpen(false);
    }

    const handleTemplateClick = (template: any) => {
        const searchParams = new URLSearchParams(window.location.search);
        searchParams.set("q", template.name);
        router.push(`/explore?${searchParams.toString()}`);
        setOpen(false);
    }

    const filteredTemplates = templates.filter(t => {
        if (!query) return true;
        const q = query.toLowerCase();
        const matchName = t.name.toLowerCase().includes(q);
        const matchTag = t.tags?.some((tag: string) => tag.toLowerCase().includes(q));
        return matchName || matchTag;
    });

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            handleSearch();
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="overflow-hidden p-0 shadow-2xl bg-zinc-950 border-zinc-800 sm:rounded-2xl max-w-4xl max-h-[85vh] [&>button]:hidden">
                <DialogTitle className="sr-only">Search</DialogTitle>
                <div className="bg-transparent text-white h-full w-full flex flex-col">

                    <div className="flex items-center border-b border-zinc-800 px-3">
                        <Search className="mr-2 h-5 w-5 shrink-0 opacity-50 text-zinc-400" />
                        <input
                            autoFocus
                            placeholder="Search templates by tags..."
                            className="flex h-14 w-full bg-transparent py-3 outline-none placeholder:text-zinc-500 text-base"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onKeyDown={handleKeyDown}
                        />
                        <Button
                            variant="ghost"
                            size="sm"
                            className="ml-2 h-8 text-xs text-muted-foreground hover:bg-zinc-200 hover:text-zinc-900 transition-colors"
                            onClick={handleSearch}
                        >
                            Enter <CornerDownLeft className="ml-1.5 h-3 w-3" />
                        </Button>
                    </div>

                    <div className="flex items-center gap-2 p-4 pb-2 border-b border-zinc-800/50 overflow-x-auto no-scrollbar">
                        {categories.slice(0, 6).map(cat => (
                            <Button
                                key={cat}
                                variant="secondary"
                                size="sm"
                                className="bg-zinc-800 text-zinc-100 hover:bg-zinc-700 h-8 rounded-full px-4 text-xs font-normal shrink-0"
                                onClick={() => handleCategoryClick(cat)}
                            >
                                {cat}
                            </Button>
                        ))}
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
                        {loading ? (
                            <div className="text-center py-12 text-zinc-500">Loading...</div>
                        ) : filteredTemplates.length === 0 ? (
                            <div className="text-center py-12 text-zinc-500">No templates found.</div>
                        ) : (
                            <div className="grid grid-cols-3 gap-4 pb-6">
                                {filteredTemplates.map(t => (
                                    <div
                                        key={t._id}
                                        onClick={() => handleTemplateClick(t)}
                                        className="cursor-pointer flex flex-col items-start gap-3 p-3 bg-zinc-900/50 border border-zinc-800/50 hover:bg-zinc-800/80 hover:border-zinc-700 rounded-xl transition-all group"
                                    >
                                        <div className="w-full aspect-[4/3] bg-zinc-950 rounded-lg border border-zinc-900 group-hover:border-zinc-700 transition-colors overflow-hidden relative">
                                            {t.thumbnailUrl ? (
                                                <img src={t.thumbnailUrl} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" alt={t.name} />
                                            ) : (
                                                <div className="w-full h-full bg-zinc-800 flex items-center justify-center text-zinc-700">
                                                    <span className="text-xs">No Preview</span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="space-y-1 w-full px-1">
                                            <p className="font-medium text-zinc-200 truncate w-full">{t.name}</p>
                                            <p className="text-xs text-zinc-500 line-clamp-1">
                                                {t.tags?.join(", ")}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="flex items-center justify-between px-2 py-2 mt-4 border-t border-zinc-800/50 pt-4">
                            <div className="flex gap-2 text-xs text-zinc-500">
                                <span>Press Enter to search all</span>
                            </div>
                        </div>

                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
