"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface PaginationProps {
    totalPages: number
    currentPage: number
    onPageChange: (page: number) => void
    className?: string
    maxVisiblePages?: number // max number of page buttons to show before adding dots
}

export default function SlidingPagination({
    totalPages,
    currentPage,
    onPageChange,
    className,
    maxVisiblePages = 7,
}: PaginationProps) {
    const buttonRefs = React.useRef<(HTMLButtonElement | null)[]>([])
    const [underlineStyle, setUnderlineStyle] = React.useState<{ left: number; width: number }>({
        left: 0,
        width: 0,
    })

    // Update underline position whenever current page changes
    React.useEffect(() => {
        const currentBtn = buttonRefs.current[currentPage - 1]
        if (currentBtn) {
            const rect = currentBtn.getBoundingClientRect()
            const parentRect = currentBtn.parentElement!.getBoundingClientRect()
            setUnderlineStyle({
                left: rect.left - parentRect.left,
                width: rect.width,
            })
        }
    }, [currentPage, totalPages])

    // Generate pages array with ellipsis if needed
    const generatePages = () => {
        if (totalPages <= maxVisiblePages) return Array.from({ length: totalPages }, (_, i) => i + 1)

        const pages: (number | -1)[] = []
        const first = 1
        const last = totalPages
        const sideCount = 1
        const middleCount = maxVisiblePages - 2 * sideCount - 2

        pages.push(first)

        // left/right bounds around current page
        let left = Math.max(currentPage - Math.floor(middleCount / 2), sideCount + 1)
        let right = Math.min(currentPage + Math.floor(middleCount / 2), totalPages - sideCount)

        // Add first ellipsis if needed
        if (left > sideCount + 1) pages.push(-1)
        else left = sideCount + 1 // include pages after first if no dots

        // Add middle pages
        for (let i = left; i <= right; i++) pages.push(i)

        // Add last ellipsis if needed
        if (right < totalPages - sideCount) pages.push(-1)

        pages.push(last)

        return pages
    }

    const pagesToShow = generatePages()

    return (
        <div className={cn("flex items-center gap-4", className)}>
            <Button
                variant="outline"
                size="icon"
                className="h-9 w-9 rounded-full border-neutral-200 dark:border-white/10 bg-white dark:bg-neutral-900 disabled:opacity-30 transition-all hover:bg-neutral-100 dark:hover:bg-white/10 shadow-sm hover:border-primary/20 hover:text-primary"
                onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
            >
                <ChevronLeft className="h-4 w-4" />
                <span className="sr-only">Previous Page</span>
            </Button>

            <div className="relative inline-flex items-center p-1 rounded-full bg-neutral-100/80 dark:bg-neutral-900/50 border border-neutral-200 dark:border-white/5 hover:border-primary/20 transition-colors backdrop-blur-sm">
                {/* Sliding Pill Background - Purple Brand Color */}
                <motion.div
                    layout
                    initial={false}
                    animate={{
                        left: underlineStyle.left,
                        width: underlineStyle.width,
                    }}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    className="absolute top-1 bottom-1 bg-primary rounded-full shadow-lg shadow-primary/25 z-0"
                />

                {pagesToShow.map((pageNum, i) =>
                    pageNum === -1 ? (
                        <span key={`dots-${i}`} className="px-3 text-muted-foreground text-xs select-none">...</span>
                    ) : (
                        <Button
                            key={pageNum}
                            variant="ghost"
                            ref={(el) => { buttonRefs.current[pageNum - 1] = el; }}
                            onClick={() => onPageChange(pageNum)}
                            className={cn(
                                "relative h-8 min-w-[32px] px-3 rounded-full text-sm font-medium z-10 transition-colors hover:bg-transparent",
                                pageNum === currentPage
                                    ? "text-primary-foreground font-semibold"
                                    : "text-muted-foreground hover:text-primary"
                            )}
                        >
                            {pageNum}
                        </Button>
                    )
                )}
            </div>

            <Button
                variant="outline"
                size="icon"
                className="h-9 w-9 rounded-full border-neutral-200 dark:border-white/10 bg-white dark:bg-neutral-900 disabled:opacity-30 transition-all hover:bg-neutral-100 dark:hover:bg-white/10 shadow-sm hover:border-primary/20 hover:text-primary"
                onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
            >
                <ChevronRight className="h-4 w-4" />
                <span className="sr-only">Next Page</span>
            </Button>
        </div>
    )
}
