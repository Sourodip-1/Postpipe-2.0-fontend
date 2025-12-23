"use client";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { ExploreSidebar } from "@/components/explore/ExploreSidebar"
import { ExploreHeader } from "@/components/explore/ExploreHeader"
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function ExploreLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const { isAuthenticated, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !isAuthenticated) {
            router.push("/login");
        }
    }, [loading, isAuthenticated, router]);

    if (loading) return null;

    return (
        <SidebarProvider defaultOpen={false}>
            <div className="flex min-h-screen w-full bg-background pt-16">
                <ExploreSidebar collapsible="offcanvas" />
                <SidebarInset>
                    <ExploreHeader />
                    <div className="flex-1">
                        {children}
                    </div>
                </SidebarInset>
            </div>
        </SidebarProvider>
    )
}
