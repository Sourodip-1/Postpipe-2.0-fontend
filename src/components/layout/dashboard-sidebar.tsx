"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    Server,
    FileText,
    Key,
    Terminal,
    Activity,
    Settings,
    LogOut,
    ChevronLeft
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { MenuToggleIcon } from "@/components/ui/menu-toggle-icon";
import { useAuth } from "@/hooks/use-auth";

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> { }

export function DashboardSidebar({ className }: SidebarProps) {
    const pathname = usePathname();
    const { logout } = useAuth();
    const [collapsed, setCollapsed] = React.useState(false);

    // Navigation Items
    const items = [
        {
            title: "Overview",
            href: "/dashboard",
            icon: LayoutDashboard,
        },
        {
            title: "Backend Systems",
            href: "/dashboard/systems",
            icon: Server,
        },
        {
            title: "Forms",
            href: "/dashboard/forms",
            icon: FileText,
        },
        {
            title: "Connectors",
            href: "/dashboard/connectors",
            icon: Key,
        },
        {
            title: "CLI & Integrations",
            href: "/dashboard/cli",
            icon: Terminal,
        },
        {
            title: "Usage",
            href: "/dashboard/usage",
            icon: Activity,
        },
        {
            title: "Settings",
            href: "/dashboard/settings",
            icon: Settings,
        },
    ];

    const SidebarContent = () => (
        <div className="flex h-full flex-col gap-4">
            <div className={cn("flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6", collapsed && "justify-center px-2")}>
                <Link href="/" className="flex items-center gap-2 font-semibold">
                    {!collapsed && (
                        <div className="relative h-6 w-28">
                            <Image src="/PostPipe-Black.svg" alt="PostPipe" fill className="dark:hidden object-contain object-left" />
                            <Image src="/PostPipe.svg" alt="PostPipe" fill className="hidden dark:block object-contain object-left" />
                        </div>
                    )}
                    {collapsed && <span className="font-bold text-xl">P</span>}
                </Link>
                {!collapsed && (
                    <Button variant="ghost" size="icon" className="ml-auto h-8 w-8 lg:hidden">
                        {/* Mobile close handled by Sheet */}
                    </Button>
                )}
            </div>

            <div className="flex-1">
                <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
                    {items.map((item, index) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));

                        return (
                            <Link
                                key={index}
                                href={item.href}
                                className={cn(
                                    "flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary",
                                    isActive ? "bg-muted text-primary" : "text-muted-foreground",
                                    collapsed && "justify-center px-2"
                                )}
                                title={collapsed ? item.title : undefined}
                            >
                                <Icon className="h-4 w-4" />
                                {!collapsed && item.title}
                            </Link>
                        )
                    })}
                </nav>
            </div>

            <div className="mt-auto border-t p-4">
                <Button
                    variant="ghost"
                    className={cn("w-full justify-start gap-2 text-muted-foreground hover:text-destructive", collapsed && "justify-center px-0")}
                    onClick={logout}
                >
                    <LogOut className="h-4 w-4" />
                    {!collapsed && "Log out"}
                </Button>
            </div>
        </div>
    );

    return (
        <>
            {/* Desktop Sidebar */}
            <div className={cn("hidden border-r bg-muted/40 md:block", collapsed ? "w-[70px]" : "w-[220px] lg:w-[280px]", className)}>
                <SidebarContent />
                <div className="absolute top-3 -right-3 z-20 hidden md:block">
                    <Button
                        variant="outline"
                        size="icon"
                        className="h-6 w-6 rounded-full border shadow-sm"
                        onClick={() => setCollapsed(!collapsed)}
                    >
                        <ChevronLeft className={cn("h-3 w-3 transition-transform", collapsed && "rotate-180")} />
                    </Button>
                </div>
            </div>

            {/* Mobile Sidebar (Sheet) - Trigger usually in Header, but can be managed here if layout passes trigger */}
        </>
    );
}
