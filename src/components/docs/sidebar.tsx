"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import {
    Book,
    Terminal,
    Menu,
    X,
    Search,
    ChevronRight,
    ShieldCheck,
    ShoppingCart,
    Cpu,
    Code,
    Copy,
    Database,
    FileText
} from "lucide-react";

const NAV_ITEMS = [
    {
        category: "Start Here",
        items: [
            { title: "Introduction", href: "/docs/introduction", icon: <Book size={18} /> },
        ]
    },
    {
        category: "Static",
        items: [
            { title: "Connector Setup", href: "/docs/guides/static-connector", icon: <ShieldCheck size={18} /> },
        ]
    },
    {
        category: "Dynamic",
        items: [
            { title: "CLI Components", href: "/docs/guides/cli-components", icon: <Terminal size={18} /> },
        ]
    },
];

export function DocsSidebar() {
    const pathname = usePathname();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    // Close sidebar on path change
    useEffect(() => {
        setIsSidebarOpen(false);
    }, [pathname]);

    return (
        <>
            {/* Mobile Header */}
            <div className="lg:hidden sticky top-14 z-40 border-b border-slate-800 bg-[#09090b]/80 backdrop-blur-md px-4 py-3 flex items-center justify-between">
                <span className="font-semibold text-white">Documentation</span>
                <button
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    className="p-2 text-slate-400 hover:text-white"
                >
                    {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>

            {/* Sidebar */}
            <aside
                className={`
          fixed lg:sticky lg:top-16 h-[calc(100vh-60px)] lg:h-[calc(100vh-4rem)] w-72 bg-[#09090b] border-r border-slate-800 
          z-40 transition-transform duration-300 ease-in-out lg:translate-x-0
          ${isSidebarOpen ? "translate-x-0 top-[110px]" : "-translate-x-full lg:translate-x-0 top-16"}
        `}
            >
                <div className="p-6 h-full flex flex-col">
                    {/* Logo */}
                    <div className="hidden lg:flex items-center gap-3 font-bold text-white text-xl mb-8">
                        <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-cyan-400">
                            PostPipe Docs
                        </span>
                    </div>

                    {/* Search */}
                    <div className="relative mb-6">
                        <Search
                            className="absolute left-3 top-2.5 text-slate-500"
                            size={16}
                        />
                        <input
                            type="text"
                            placeholder="Search..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                        />
                    </div>

                    {/* Nav Links */}
                    <nav className="flex-1 overflow-y-auto space-y-6 scrollbar-hide">
                        {NAV_ITEMS.map((section, idx) => {
                            const sectionFilteredItems = section.items.filter(item =>
                                item.title.toLowerCase().includes(searchQuery.toLowerCase())
                            );

                            if (searchQuery && sectionFilteredItems.length === 0) return null;

                            return (
                                <div key={idx}>
                                    {!searchQuery && (
                                        <h3 className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                                            {section.category}
                                        </h3>
                                    )}
                                    <div className="space-y-1">
                                        {(searchQuery ? sectionFilteredItems : section.items).map((item) => {
                                            const isActive = pathname === item.href;
                                            return (
                                                <Link
                                                    key={item.href}
                                                    href={item.href}
                                                    className={`
                              w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-200
                              ${isActive
                                                            ? "bg-indigo-500/10 text-indigo-400 font-medium"
                                                            : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                                                        }
                            `}
                                                >
                                                    <span
                                                        className={
                                                            isActive ? "text-indigo-400" : "text-slate-500"
                                                        }
                                                    >
                                                        {item.icon}
                                                    </span>
                                                    {item.title}
                                                    {isActive && (
                                                        <ChevronRight size={14} className="ml-auto" />
                                                    )}
                                                </Link>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </nav>

                    <div className="mt-auto pt-6 border-t border-slate-800 text-xs text-slate-500">
                        <p>v2.0.4-beta</p>
                    </div>
                </div>
            </aside>

            {/* Overlay for mobile */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/60 z-30 lg:hidden backdrop-blur-sm"
                    style={{ top: "60px" }}
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}
        </>
    );
}
