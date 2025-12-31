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
// Ensure you have a toaster or similar installed. If not, window.alert or console.log is fallback;
// but better to use a simple toast if available. Using basic alert for now if toast not readily seen or assume shadcn's useToast.
import { useToast } from "@/hooks/use-toast"

import { createSystem } from "@/lib/actions/systems"
import databases from "@/data/databases.json"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { useState, useEffect } from "react"

interface ExploreModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    item: {
        id?: string
        title: string
        author: {
            name: string
            avatar?: string
            handle?: string
        }
        image: string
        tags?: string[]
        cli?: string
        aiPrompt?: string
        npmPackageUrl?: string
        databaseConfigurations?: {
            databaseName: string;
            logo: string;
            prompt: string;
        }[]
    } | null
}

export function ExploreModal({ open, onOpenChange, item }: ExploreModalProps) {
    const { toast } = useToast()
    const [selectedDb, setSelectedDb] = useState("")

    useEffect(() => {
        setSelectedDb("")
    }, [open, item])

    if (!item) return null

    const handleCopy = async (text: string | undefined, type: string) => {
        if (!text) return;
        try {
            await navigator.clipboard.writeText(text);
            toast({
                title: "Copied!",
                description: `${type} copied to clipboard.`,
            });
            if (item.id) {
                // Track usage
                await createSystem(item.title, item.tags?.[0] || 'Application', item.id);
            }
        } catch (err) {
            console.error('Failed to copy', err);
        }
    }

    const handleOpenPackage = async () => {
        if (item.npmPackageUrl) {
            if (item.id) {
                await createSystem(item.title, item.tags?.[0] || 'Application', item.id);
            }
            window.open(item.npmPackageUrl, '_blank');
        }
    }

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
                                            <Avatar className="h-10 w-10 flex items-center justify-center rounded-lg border">
                                                <AvatarImage src={item.author.avatar} alt={item.title} className="object-cover" />
                                                <AvatarFallback className="rounded-lg bg-muted text-lg font-bold">
                                                    {item.title.substring(0, 2)}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <Dialog.Title className="text-lg font-semibold leading-none">{item.title}</Dialog.Title>
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
                                                {item.cli && (
                                                    <Button variant="outline" size="sm" className="h-9 gap-2" onClick={() => handleCopy(item.cli, "CLI command")}>
                                                        <Terminal className="h-4 w-4" />
                                                        <span className="font-medium text-xs">Copy CLI</span>
                                                    </Button>
                                                )}
                                                {item.npmPackageUrl && (
                                                    <Button variant="outline" size="sm" className="h-9 gap-2" onClick={handleOpenPackage}>
                                                        <ExternalLink className="h-4 w-4" />
                                                        <span className="font-medium text-xs">Open Package</span>
                                                    </Button>
                                                )}
                                            </div>

                                            <div className="h-6 w-px bg-border mx-2" />

                                            <div className="w-[180px]">
                                                <Select
                                                    value={selectedDb}
                                                    onValueChange={(val) => {
                                                        setSelectedDb(val);
                                                        const config = item.databaseConfigurations?.find(c => c.databaseName === val);
                                                        if (config) {
                                                            handleCopy(config.prompt, "Prompt");
                                                        } else {
                                                            // Fallback if no specific config found, though UI is driven by databases list so this might be generic
                                                            handleCopy(`${item.aiPrompt || ''} using ${val}`, "Prompt");
                                                        }
                                                    }}
                                                >
                                                    <SelectTrigger className="h-9 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 border-none">
                                                        <div className="flex items-center gap-2">
                                                            <SelectValue placeholder="Select Database" />
                                                        </div>
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {databases.map((db) => (
                                                            <SelectItem key={db.name} value={db.name}>
                                                                <div className="flex items-center gap-2">
                                                                    <img src={db.logo} alt={db.name} className="h-4 w-4" />
                                                                    <span>{db.name}</span>
                                                                </div>
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>

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
                                        <div className="w-full max-w-4xl aspect-[16/10] bg-zinc-900 rounded-lg border border-white/10 shadow-2xl flex items-center justify-center relative overflow-hidden group">
                                            {(() => {
                                                const url = item.image;
                                                const isVideo = url && (
                                                    url.includes('jumpshare') ||
                                                    url.includes('cloudfront') ||
                                                    url.endsWith('.mp4') ||
                                                    url.endsWith('.webm') ||
                                                    !/\.(jpg|jpeg|png|gif|webp|svg)($|\?)/i.test(url)
                                                );

                                                if (isVideo) {
                                                    return (
                                                        <video
                                                            src={item.image}
                                                            className="w-full h-full object-cover"
                                                            autoPlay
                                                            muted
                                                            loop
                                                            playsInline
                                                        />
                                                    );
                                                }

                                                return (
                                                    <div className="w-full h-full relative">
                                                        {/* Fallback pattern background if no image, or render image */}
                                                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(120,119,198,0.1),rgba(255,255,255,0))]" />
                                                        {item.image && (
                                                            <img
                                                                src={item.image}
                                                                alt={item.title}
                                                                className="w-full h-full object-cover relative z-10"
                                                            />
                                                        )}
                                                    </div>
                                                );
                                            })()}

                                            {/* Overlay for text if image is missing/broken? No, assuming valid URLs for now. */}
                                            {!item.image && (
                                                <div className="text-center space-y-4 relative z-10 p-8">
                                                    <h3 className="text-3xl font-light text-white tracking-widest">
                                                        {item.title} Preview
                                                    </h3>
                                                    <p className="text-zinc-500 max-w-md mx-auto">
                                                        Preview not available.
                                                    </p>
                                                </div>
                                            )}
                                        </div>
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
