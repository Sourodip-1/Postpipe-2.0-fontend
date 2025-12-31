"use client";
import { ExploreLayoutWrapper } from "@/components/explore/ExploreLayoutWrapper"
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
        <ExploreLayoutWrapper>
            {children}
        </ExploreLayoutWrapper>
    )
}
