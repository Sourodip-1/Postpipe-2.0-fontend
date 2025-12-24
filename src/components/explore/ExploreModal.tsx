"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import * as Dialog from "@radix-ui/react-dialog"
import { X, Copy, Terminal, ExternalLink, Sun, RotateCcw, Link2, Bookmark, Share2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

interface ExploreModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    item: {
        title: string
        author: {
            name: string
            avatar?: string
            handle?: string
        }
        image: string
        tags?: string[]
    } | null
}

export function ExploreModal({ open, onOpenChange, item }: ExploreModalProps) {
    if (!item) return null

    return (
        <Dialog.Root open={open} onOpenChange={onOpenChange}>
            <AnimatePresence>
                {open && (
                    <Dialog.Portal forceMount>
                        <Dialog.Overlay asChild>
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm"
                            />
                        </Dialog.Overlay>
                        <Dialog.Content asChild>
                            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 pointer-events-none">
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                    transition={{ duration: 0.2, ease: "easeOut" }}
                                    className="w-full max-w-[95vw] h-[90vh] overflow-hidden rounded-xl border bg-background shadow-lg sm:rounded-2xl md:w-full pointer-events-auto flex flex-col relative"
                                >
                                    {/* Header */}
                                    <div className="flex items-center justify-between border-b p-4 bg-background/50 backdrop-blur-md sticky top-0 z-10">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-muted border">
                                                {/* Icon placeholder or Avatar */}
                                                <span className="text-lg font-bold">
                                                    {item.title.substring(0, 2)}
                                                </span>
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <Dialog.Title className="text-lg font-semibold leading-none">{item.title}</Dialog.Title>
                                                    <span className="text-muted-foreground text-sm">/ default.tsx</span>
                                                </div>
                                                <div className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                                                    <span>{item.author.name}</span>
                                                    {/* Publisher (mocked for now) */}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            {/* Toolbar Actions */}
                                            <div className="flex items-center gap-2 mr-2">
                                                <Button variant="outline" size="sm" className="h-9 gap-2">
                                                    <Terminal className="h-4 w-4" />
                                                    <span className="font-medium text-xs">Copy CLI</span>
                                                </Button>
                                                <Button variant="outline" size="sm" className="h-9 gap-2">
                                                    <ExternalLink className="h-4 w-4" />
                                                    <span className="font-medium text-xs">Open Package</span>
                                                </Button>
                                            </div>

                                            <div className="h-6 w-px bg-border mx-2" />

                                            <Button className="h-9 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 gap-2">
                                                <Copy className="h-4 w-4" />
                                                <span className="font-medium text-xs tracking-wide">COPY PROMPT</span>
                                            </Button>

                                            <Dialog.Close asChild>
                                                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full ml-1">
                                                    <X className="h-4 w-4" />
                                                    <span className="sr-only">Close</span>
                                                </Button>
                                            </Dialog.Close>
                                        </div>
                                    </div>

                                    {/* Body / Preview Area */}
                                    <div className="relative flex-1 bg-black/95 overflow-hidden flex flex-col justify-center items-center p-8">
                                        {/* Mock Preview Content */}
                                        <div className="w-full max-w-4xl aspect-[16/10] bg-zinc-900 rounded-lg border border-white/10 shadow-2xl flex items-center justify-center relative overflow-hidden group">
                                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(120,119,198,0.1),rgba(255,255,255,0))]" />

                                            {/* Placeholder for the actual component render */}
                                            <div className="text-center space-y-4 relative z-10 p-8">
                                                <h3 className="text-3xl font-light text-white tracking-widest">
                                                    {item.title} Preview
                                                </h3>
                                                <p className="text-zinc-500 max-w-md mx-auto">
                                                    Interactive preview would be rendered here.
                                                </p>
                                            </div>

                                            {/* Mock Interactive UI Elements in Preview */}

                                        </div>

                                        {/* Bottom Info Bar / Tabs? */}
                                    </div>
                                </motion.div>
                            </div>
                        </Dialog.Content>
                    </Dialog.Portal>
                )}
            </AnimatePresence>
        </Dialog.Root>
    )
}
