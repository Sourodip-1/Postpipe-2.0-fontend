"use client";

import React, { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Sidebar, SidebarBody, SidebarLink } from "@/components/ui/sidebar-motion";
import {
    Book,
    Terminal,
    ShieldCheck,
    User,
    ArrowLeftToLine,
    ArrowRightFromLine,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ShaderBackground } from "@/components/ui/shader-background";

export default function DocsShell({
    children,
}: {
    children: React.ReactNode;
}) {
    const [open, setOpen] = useState(false);

    // Docs Navigation Items
    const navItems = [
        {
            label: "Introduction",
            href: "/docs/introduction",
            icon: <Book className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
        },
        {
            label: "Static Setup",
            href: "/docs/guides/static-connector",
            icon: <ShieldCheck className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
        },
        {
            label: "Dynamic CLI",
            href: "/docs/guides/cli-components",
            icon: <Terminal className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
        },
        {
            label: "How It Works",
            href: "/docs/how-it-works",
            icon: <User className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
        }
    ];

    const pathname = usePathname();
    const isIntro = pathname === "/docs/introduction";

    return (
        <div className={cn(
            "rounded-md flex flex-col md:flex-row w-full flex-1 mx-auto border border-neutral-200 dark:border-neutral-700 overflow-hidden relative",
            "h-screen pt-16 bg-black"
        )}>
            {/* Global Shader Background */}
            <div className="absolute inset-0 z-0">
                <ShaderBackground />
            </div>

            <Sidebar open={open} setOpen={setOpen}>
                <SidebarBody className="justify-between gap-10 bg-transparent border-r border-white/10 backdrop-blur-sm z-10">
                    <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
                        <div className="mt-8 flex flex-col gap-2">
                            {navItems.map((link, idx) => (
                                <SidebarLink key={idx} link={link} />
                            ))}
                        </div>

                        {/* Collapse Toggle */}
                        <div onClick={() => setOpen(!open)} className="cursor-pointer mt-4 pt-4 border-t border-white/10 mt-auto mb-4">
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
                            />
                        </div>
                    </div>
                </SidebarBody>
            </Sidebar>

            {/* Main Content Area */}
            <div className="flex flex-1 relative z-10 pointer-events-none">
                {/* pointer-events-none on wrapper to let clicks pass if needed? No, content needs events. 
                   But we need z-10 to be above background. 
                */}
                <div className={cn(
                    "docs-scroller flex flex-col gap-2 flex-1 w-full h-full overflow-y-auto relative pointer-events-auto",
                    // Apply glassmorphism card for non-intro pages
                    !isIntro && "p-0 md:p-0 rounded-tl-2xl border border-white/10 bg-black/40 backdrop-blur-xl"
                )}>
                    {children}
                </div>
            </div>
        </div>
    );
}
