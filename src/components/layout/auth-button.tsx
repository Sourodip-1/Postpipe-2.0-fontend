"use client";

import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { ShinyButton } from "@/components/ui/shiny-button";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowRight } from "lucide-react";

export function AuthButton() {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

  if (loading) {
    return <Skeleton className="h-10 w-24" />;
  }

  return isAuthenticated ? (
    <ShinyButton onClick={() => router.push("/dashboard")}>
      Dashboard
    </ShinyButton>
  ) : (
    <Button asChild variant="outline">
      <Link href="/login">Login</Link>
    </Button>
  );
}
