"use client";
import React, { useState, useEffect } from "react";
import { Sidebar, SidebarBody, SidebarLink } from "@/components/ui/sidebar";
import {
    LayoutDashboard,
    UserCog,
    Settings,
    LogOut,
    Layers,
    Tag,
    Home,
    Search,
    ArrowLeftToLine,
    ArrowRightFromLine,
} from "lucide-react";
import { usePathname, useSearchParams } from "next/navigation";

import Link from "next/link";
import { motion } from "framer-motion";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { getExploreFilters } from "@/lib/actions/explore";
import { SearchPopup } from "./SearchPopup";
import { useAuth } from "@/hooks/use-auth";

interface ExploreSidebarProps {
    open: boolean;
    setOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

export function ExploreSidebar({ open, setOpen }: ExploreSidebarProps) {
    const [links, setLinks] = useState<any[]>([
        {
            label: "Home",
            href: "/explore",
            icon: (
                <Home className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
            ),
            group: "main"
        },
        {
            label: "Search",
            href: "#",
            icon: (
                <Search className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
            ),
            onClick: () => setSearchOpen(true),
            group: "main"
        },
    ]);
    const [searchOpen, setSearchOpen] = useState(false);
    const { user } = useAuth();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    // Helper to check if a link is active
    const isActive = (link: any) => {
        if (link.href === "#") return false;

        // Detailed check for query params
        if (link.href.includes("?")) {
            const [path, query] = link.href.split("?");
            const params = new URLSearchParams(query);

            // Check if all params match
            let match = true;
            params.forEach((value, key) => {
                if (searchParams.get(key) !== value) match = false;
            });

            // Also ensure base path matches (usually /explore)
            if (pathname !== path && path !== "") match = false;

            return match;
        }

        // Exact match for paths without params
        return pathname === link.href && searchParams.toString() === "";
    };

    useEffect(() => {
        const fetchFilters = async () => {
            try {
                const data = await getExploreFilters();
                const categoryLinks = (data?.categories || []).map((cat: string) => ({
                    label: cat,
                    href: `/explore?category=${encodeURIComponent(cat)}`,
                    icon: (
                        <Layers className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
                    ),
                    group: "category"
                }));
                const tagLinks = (data?.tags || []).map((tag: string) => ({
                    label: tag,
                    href: `/explore?tag=${encodeURIComponent(tag)}`,
                    icon: (
                        <Tag className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
                    ),
                    group: "tag"
                }));

                setLinks(prevLinks => {
                    const staticLinks = [
                        {
                            label: "Home",
                            href: "/explore",
                            icon: (
                                <Home className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
                            ),
                            group: "main"
                        },
                        {
                            label: "Search",
                            href: "#",
                            icon: (
                                <Search className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
                            ),
                            onClick: () => setSearchOpen(true),
                            group: "main"
                        }
                    ];
                    return [...staticLinks, ...categoryLinks, ...tagLinks];
                });
            } catch (error) {
                console.error("Failed to load sidebar filters", error);
            }
        };

        fetchFilters();
    }, []);

    // Custom Link Wrapper to handle active state styling
    const RenderLink = ({ link }: { link: any }) => {
        const active = isActive(link);
        const isSubItem = !link.icon;

        return (
            <SidebarLink
                link={link}
                props={link.onClick ? { onClick: (e: any) => { e.preventDefault(); link.onClick(); }, href: link.href as any } : undefined}
                className={cn(
                    "transition-all duration-300 group/link overflow-hidden whitespace-nowrap",
                    open ? cn("px-3 py-1.5 rounded-lg w-full", isSubItem && "ml-5 text-[13px]") : "p-0 justify-center h-10 w-10 mx-auto rounded-md flex items-center mb-1",
                    active
                        ? "bg-neutral-100 dark:bg-primary/10 text-neutral-900 dark:text-primary font-medium"
                        : "text-neutral-600 dark:text-muted-foreground hover:bg-neutral-100 dark:hover:bg-white/5 hover:text-neutral-900 dark:hover:text-foreground transparent"
                )}
            />
        );
    };

    return (
        <>
            <Sidebar open={open} setOpen={setOpen}>
                <SidebarBody className="justify-between gap-10 bg-white dark:bg-neutral-950 border-r border-neutral-200 dark:border-white/10">
                    <div className="flex flex-col flex-1 overflow-hidden relative">
                        <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden pb-10 scrollbar-none">
                            <motion.div layout initial={false} className="flex-shrink-0">
                                {open ? <Logo /> : <LogoIcon />}
                            </motion.div>
                            <div className={cn("flex flex-col transition-all duration-300", open ? "mt-6 gap-3" : "mt-4 gap-0")}>
                                {/* Main Menu */}
                                <div className={cn("flex flex-col w-full transition-all duration-300", !open ? "mx-auto w-8 gap-0" : "gap-1")}>
                                    <h4 className={cn("text-[10px] font-bold text-neutral-500 dark:text-muted-foreground/40 mb-2 px-3 uppercase tracking-widest transition-all duration-300 overflow-hidden whitespace-nowrap", !open && "opacity-0 h-0 m-0 p-0")}>Menu</h4>
                                    {links.filter(l => l.group === 'main').map((link, idx) => (
                                        <RenderLink key={idx} link={link} />
                                    ))}
                                </div>

                                {/* Categories */}
                                {links.filter(l => l.group === 'category').length > 0 && (
                                    <>
                                        <div className={cn("border-t border-neutral-200 dark:border-white/10 mx-auto w-6 my-2 transition-opacity duration-300", open ? "opacity-0 h-0 my-0 border-0" : "opacity-100")} />
                                        <div className={cn("flex flex-col gap-1 w-full")}>
                                            <div className={cn("flex items-center gap-2 px-3 mb-1 mt-4 border-t border-neutral-200 dark:border-white/10 pt-4 text-primary font-bold overflow-hidden transition-all duration-300 whitespace-nowrap", !open && "opacity-0 h-0 overflow-hidden m-0 p-0 border-0")}>
                                                <Layers className="h-4 w-4 flex-shrink-0" />
                                                <h4 className="text-[11px] uppercase tracking-widest m-0 flex-shrink-0 whitespace-nowrap">Categories</h4>
                                            </div>
                                            {!open && (
                                                <div className="flex justify-center text-neutral-500 dark:text-muted-foreground transition-colors group-hover:text-primary relative group cursor-pointer" title="Categories">
                                                    <Layers className="h-5 w-5 flex-shrink-0" />
                                                </div>
                                            )}
                                            {links.filter(l => l.group === 'category').map((link, idx) => (
                                                <div key={idx} className={cn(!open && "hidden")}>
                                                    <RenderLink link={{ ...link, icon: undefined }} />
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                )}

                                {/* Tags */}
                                {links.filter(l => l.group === 'tag').length > 0 && (
                                    <>
                                        <div className={cn("border-t border-neutral-200 dark:border-white/10 mx-auto w-6 my-2 transition-opacity duration-300", open ? "opacity-0 h-0 my-0 border-0" : "opacity-100")} />
                                        <div className={cn("flex flex-col gap-1 w-full")}>
                                            <div className={cn("flex items-center gap-2 px-3 mb-1 mt-4 border-t border-neutral-200 dark:border-white/10 pt-4 text-primary font-bold overflow-hidden transition-all duration-300 whitespace-nowrap", !open && "opacity-0 h-0 overflow-hidden m-0 p-0 border-0")}>
                                                <Tag className="h-4 w-4 flex-shrink-0" />
                                                <h4 className="text-[11px] uppercase tracking-widest m-0 flex-shrink-0 whitespace-nowrap">Tags</h4>
                                            </div>
                                            {!open && (
                                                <div className="flex justify-center text-neutral-500 dark:text-muted-foreground transition-colors group-hover:text-primary relative group cursor-pointer" title="Tags">
                                                    <Tag className="h-5 w-5 flex-shrink-0" />
                                                </div>
                                            )}
                                            {links.filter(l => l.group === 'tag').map((link, idx) => (
                                                <div key={idx} className={cn(!open && "hidden")}>
                                                    <RenderLink link={{ ...link, icon: undefined }} />
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                        {/* Fade/Blur overlay */}
                        <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-white dark:from-neutral-950 to-transparent pointer-events-none" />
                    </div>

                    <div className="flex flex-col gap-1">
                        <SidebarLink
                            link={{
                                label: user?.name || "User",
                                href: "/dashboard/profile",
                                icon: (
                                    <div className="h-7 w-7 relative flex-shrink-0 rounded-full overflow-hidden border border-neutral-200 dark:border-white/10">
                                        <Image
                                            src={user?.image || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8YXZhdGFyfGVufDB8fDB8fHww&auto=format&fit=crop&w=800&q=60"}
                                            className="object-cover"
                                            fill
                                            alt={user?.name || "Avatar"}
                                        />
                                    </div>
                                ),
                            }}
                            className={cn("rounded-lg hover:bg-neutral-100 dark:hover:bg-white/5 transition-all duration-300 text-neutral-600 dark:text-neutral-200 overflow-hidden", open ? "px-3 py-2" : "px-0 py-2 justify-center w-full")}
                        />

                        {/* Collapse Toggle */}
                        <div onClick={() => setOpen(!open)} className="cursor-pointer mt-4 pt-4 border-t border-neutral-200 dark:border-white/10 overflow-hidden">
                            <SidebarLink
                                link={{
                                    label: open ? "Collapse Sidebar" : "Expand Sidebar",
                                    href: "#",
                                    icon: open ? (
                                        <ArrowLeftToLine className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
                                    ) : (
                                        <ArrowRightFromLine className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
                                    )
                                }}
                                className={cn("rounded-lg hover:bg-neutral-100 dark:hover:bg-white/5 transition-all duration-300", open ? "px-3 py-2" : "px-0 py-2 justify-center w-full")}
                            />
                        </div>
                    </div>
                </SidebarBody>
            </Sidebar>

            <SearchPopup open={searchOpen} setOpen={setSearchOpen} />
        </>
    );
}

export const Logo = () => {
    return (
        <Link
            href="/explore"
            className="font-normal flex space-x-2 items-center text-sm text-black py-1 relative z-20"
        >
            <div className="relative h-8 w-40">
                <Image src="/PostPipe-Black.svg" alt="PostPipe" fill className="dark:hidden object-contain object-left" />
                <Image src="/PostPipe.svg" alt="PostPipe" fill className="hidden dark:block object-contain object-left" />
            </div>
        </Link>
    );
};

export const LogoIcon = () => {
    return (
        <Link
            href="/explore"
            className="font-normal flex space-x-2 items-center justify-center text-sm text-black py-1 relative z-20"
        >
            <div className="relative h-6 w-6">
                {/* PostPipe.ico might be a good small icon replacement, or keeping the svg but very small. 
                 Since the original code used a div, I'll assume just the icon part of the svg is needed. 
                 However, scaling down the full logo might be weird. Let's try to crop or use a smaller version if available.
                 Reverting to a small div representation or just the 'P' if I can finds it. 
                 Given no specific icon asset, I'll stick to a small generic logo or the full logo scaled down. 
                 Actually, looking at Header2 code, it uses the full SVG. 
                 Let's use the favicon or similar if possible. root layout uses /PostPipe.ico. 
                 */}
                <Image src="/PostPipe.ico" alt="PostPipe" fill className="object-contain" />
            </div>
        </Link>
    );
};
