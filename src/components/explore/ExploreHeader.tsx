"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Search } from "lucide-react"
import { SearchPopup } from "./SearchPopup"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

export function ExploreHeader() {
    const [searchOpen, setSearchOpen] = React.useState(false)

    return (
        <TooltipProvider>
            <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between border-b px-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 transition-all w-full">
                <div className="flex items-center gap-2">
                    {/* Sidebar toggle removed as it's handled by hover/DesktopSidebar */}

                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" onClick={() => setSearchOpen(true)} className="h-9 w-9 rounded-full text-muted-foreground hover:text-foreground hover:bg-transparent hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.6)] transition-all duration-300">
                                <Search className="h-5 w-5" />
                                <span className="sr-only">Search</span>
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" align="start">Search components (⌘K)</TooltipContent>
                    </Tooltip>

                    <div className="hidden md:flex ml-2 font-medium text-sm text-foreground/80">
                        Forge
                    </div>
                </div>

                <SearchPopup open={searchOpen} setOpen={setSearchOpen} />
            </header>
        </TooltipProvider>
    )
}
