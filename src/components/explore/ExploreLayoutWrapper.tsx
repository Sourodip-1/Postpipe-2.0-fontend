"use client"

import * as React from "react"
import { ExploreSidebar } from "@/components/explore/ExploreSidebar"
import { ExploreHeader } from "@/components/explore/ExploreHeader"
import { cn } from "@/lib/utils"

interface ExploreLayoutWrapperProps {
    children: React.ReactNode
}

export function ExploreLayoutWrapper({ children }: ExploreLayoutWrapperProps) {
    const [open, setOpen] = React.useState(false);

    return (
        <div className={cn(
            "rounded-md flex flex-col md:flex-row bg-gray-50 dark:bg-neutral-950 w-full flex-1 border border-neutral-200 dark:border-neutral-700 overflow-hidden",
            "h-screen"
        )}>
            <ExploreSidebar open={open} setOpen={setOpen} />
            <div className="flex flex-1 flex-col overflow-y-auto">
                <ExploreHeader />
                <div className="flex-1">
                    {children}
                </div>
            </div>
        </div>
    )
}
