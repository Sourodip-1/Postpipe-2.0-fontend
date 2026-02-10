"use client";

import React, { createContext, useState, useEffect, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { signOut } from "@/lib/auth/actions";

const AUTH_COOKIE_NAME = "postpipe_auth";

type User = {
  name: string;
  email: string;
  image?: string;
};

export type AuthContextType = {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string) => void;
  logout: () => void;
  loading: boolean;
  refreshSession?: () => void;
};

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const fetchUser = async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          setUser(data.user);
        } else {
          setUser(null);
          document.cookie = `${AUTH_COOKIE_NAME}=; path=/; max-age=-1`;
        }
      } else {
        setUser(null);
        document.cookie = `${AUTH_COOKIE_NAME}=; path=/; max-age=-1`;
      }
    } catch (error) {
      console.error("Failed to fetch user session", error);
      setUser(null);
      // Only clear cookie on explicit auth failure, but error might include 401. 
      // Safest to clear if we can't verify identity.
      document.cookie = `${AUTH_COOKIE_NAME}=; path=/; max-age=-1`;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, [pathname]); // Re-check on route change if needed, or better, expose refresh

  const login = (email: string) => {
    // Legacy cookie setting - server actions usually handle the insecure cookies or the server-side cookie
    // But we'll keep it for now if other things depend on it.
    // However, the main thing is to refresh the user state.
    document.cookie = `${AUTH_COOKIE_NAME}=${encodeURIComponent(email)}; path=/; max-age=86400`;
    fetchUser(); // Refresh user data immediately
    router.push("/dashboard");
  };

  const logout = useCallback(async () => {
    await signOut();
    document.cookie = `${AUTH_COOKIE_NAME}=; path=/; max-age=-1`;
    setUser(null);
    router.push("/login");
  }, [router]);



  // Function to manually refresh session (useful after profile update)
  const refreshSession = () => {
    fetchUser();
  };

  const value = {
    user,
    isAuthenticated: !!user,
    login,
    logout,
    loading,
    refreshSession, // Expose this
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
