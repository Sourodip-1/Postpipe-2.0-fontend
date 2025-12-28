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
} from "lucide-react";
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
    const [links, setLinks] = useState<any[]>([]);
    const [searchOpen, setSearchOpen] = useState(false);
    const { user } = useAuth();

    useEffect(() => {
        const fetchFilters = async () => {
            const data = await getExploreFilters();
            const newLinks = [
                {
                    label: "Home",
                    href: "/explore",
                    icon: (
                        <Home className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
                    ),
                },
                {
                    label: "Search",
                    href: "#",
                    icon: (
                        <Search className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
                    ),
                    onClick: () => setSearchOpen(true)
                },
                ...data.categories.map((cat) => ({
                    label: cat,
                    href: `?category=${encodeURIComponent(cat)}`,
                    icon: (
                        <Layers className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
                    ),
                })),
                ...data.tags.map((tag) => ({
                    label: tag,
                    href: `?tag=${encodeURIComponent(tag)}`,
                    icon: (
                        <Tag className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
                    ),
                })),
            ];
            setLinks(newLinks);
        };

        fetchFilters();
    }, []);

    return (
        <>
            <Sidebar open={open} setOpen={setOpen}>
                <SidebarBody className="justify-between gap-10 bg-white dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-700">
                    <div className="flex flex-col flex-1 overflow-hidden relative">
                        <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden pb-10">
                            {open ? <Logo /> : <LogoIcon />}
                            <div className="mt-8 flex flex-col gap-2">
                                {links.map((link, idx) => (
                                    <div key={idx} onClick={link.onClick ? (e) => { e.preventDefault(); link.onClick(); } : undefined}>
                                        <SidebarLink link={link} />
                                    </div>
                                ))}
                            </div>
                        </div>
                        {/* Fade/Blur overlay */}
                        <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-white dark:from-neutral-900 to-transparent pointer-events-none" />
                    </div>
                    <div>
                        <SidebarLink
                            link={{
                                label: user?.name || "User",
                                href: "/dashboard/profile",
                                icon: (
                                    <div className="h-7 w-7 relative flex-shrink-0 rounded-full overflow-hidden">
                                        <Image
                                            src={user?.image || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8YXZhdGFyfGVufDB8fDB8fHww&auto=format&fit=crop&w=800&q=60"}
                                            className="object-cover"
                                            fill
                                            alt={user?.name || "Avatar"}
                                        />
                                    </div>
                                ),
                            }}
                        />
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
            className="font-normal flex space-x-2 items-center text-sm text-black py-1 relative z-20"
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
