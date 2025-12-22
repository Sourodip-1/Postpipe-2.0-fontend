"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sidebar, SidebarBody, SidebarLink } from "@/components/ui/sidebar-motion";
import { useAuth } from "@/hooks/use-auth";
import {
  LayoutGrid,
  FileText,
  LogOut,
  Settings,
  User,
  Server,
  Key,
  Terminal,
  Activity,
  UserCog,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const navItems = [
    {
      label: "Overview",
      href: "/dashboard",
      icon: <LayoutGrid className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
    },
    {
      label: "Backend Systems",
      href: "/dashboard/systems",
      icon: <Server className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
    },
    {
      label: "Forms",
      href: "/dashboard/forms",
      icon: <FileText className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
    },
    {
      label: "Connectors",
      href: "/dashboard/connectors",
      icon: <Key className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
    },
    {
      label: "CLI & Integrations",
      href: "/dashboard/cli",
      icon: <Terminal className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
    },
    {
      label: "Usage",
      href: "/dashboard/usage",
      icon: <Activity className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
    },
  ];

  const bottomLinks = [
    {
      label: "Profile",
      href: "#", // Placeholder
      icon: <UserCog className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
    },
    {
      label: "Settings",
      href: "#", // Placeholder
      icon: <Settings className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
    },
  ];

  return (
    <div className={cn(
      "rounded-md flex flex-col md:flex-row bg-gray-100 dark:bg-neutral-800 w-full flex-1 mx-auto border border-neutral-200 dark:border-neutral-700 overflow-hidden",
      "h-screen pt-16" // Start below global header
    )}>
      <Sidebar open={open} setOpen={setOpen}>
        <SidebarBody className="justify-between gap-10">
          <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
            {/* Logo Removed as requested */}
            <div className="mt-8 flex flex-col gap-2">
              {navItems.map((link, idx) => (
                <SidebarLink key={idx} link={link} />
              ))}
            </div>
          </div>
          <div>
            {bottomLinks.map((link, idx) => (
              <SidebarLink key={idx} link={link} />
            ))}

            {/* Logout Link */}
            <div onClick={logout} className="cursor-pointer">
              <SidebarLink
                link={{
                  label: "Logout",
                  href: "#",
                  icon: <LogOut className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
                }}
              />
            </div>
          </div>
        </SidebarBody>
      </Sidebar>

      {/* Main Content Area */}
      <div className="flex flex-1">
        <div className="p-2 md:p-10 rounded-tl-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 flex flex-col gap-2 flex-1 w-full h-full overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}
