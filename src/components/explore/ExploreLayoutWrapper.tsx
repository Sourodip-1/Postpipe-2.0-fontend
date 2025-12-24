"use client"

import * as React from "react"
import { SidebarInset, useSidebar } from "@/components/ui/sidebar"
import { ExploreSidebar } from "@/components/explore/ExploreSidebar"
import { ExploreHeader } from "@/components/explore/ExploreHeader"

interface ExploreLayoutWrapperProps {
    children: React.ReactNode
}

export function ExploreLayoutWrapper({ children }: ExploreLayoutWrapperProps) {
    const { open, setOpen, isMobile } = useSidebar()

    const handleInsetClick = (e: React.MouseEvent) => {
        if (open && !isMobile) {
            const target = e.target as HTMLElement;
            // Don't close if clicking on interactive elements or cards
            if (target.closest('a, button, input, textarea, [role="button"], .explore-card')) {
                return;
            }
            setOpen(false)
        }
    }

    // We need to apply the onClick to the SidebarInset or a wrapper div that covers the content.
    // SidebarInset renders a <main> tag and spreads props.
    return (
        <div className="flex min-h-screen w-full bg-background pt-16">
            <ExploreSidebar collapsible="offcanvas" />
            <SidebarInset onClick={handleInsetClick}>
                <ExploreHeader />
                <div className="flex-1">
                    {children}
                </div>
            </SidebarInset>
        </div>
    )
}
