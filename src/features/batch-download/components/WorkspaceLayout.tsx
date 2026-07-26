/**
 * VoidFetch
 * Copyright (c) 2026 VoidStation.
 * All rights reserved.
 */

"use client";

import React, { ReactNode, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Download,
  History,
  Settings,
  Info,
  Terminal,
  Layers,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { i18n } from "@/lib/i18n/config";
import { BackgroundGrid } from "@/components/ui/background-grid";
import { useBatchStore } from "../store/batch-store";
import { LoadingScreen } from "@/components/ui/LoadingScreen";

interface WorkspaceLayoutProps {
  children: ReactNode;
}

export function WorkspaceLayout({ children }: WorkspaceLayoutProps) {
  const pathname = usePathname();
  const setIsSettingsOpen = useBatchStore((s) => s.setIsSettingsOpen);
  const store = useBatchStore();
  const initializeStore = useBatchStore((s) => s.initializeStore);

  useEffect(() => {
    initializeStore();
  }, [initializeStore]);

  // Extract locale from path
  const segments = pathname.split("/").filter(Boolean);
  const locale = i18n.locales.includes(
    segments[0] as (typeof i18n.locales)[number],
  )
    ? segments[0]
    : i18n.defaultLocale;

  const links = [
    {
      label: "Queue Workspace",
      icon: Download,
      href: `/${locale}`,
      active: pathname === `/${locale}` || pathname === `/${locale}/`,
    },
    {
      label: "Download History",
      icon: History,
      href: `/${locale}/history`,
      active: pathname.includes("/history"),
    },
    {
      label: "Preferences",
      icon: Settings,
      href: `/${locale}/settings`,
      active: pathname.includes("/settings"),
    },
    {
      label: "About VoidFetch",
      icon: Info,
      href: `/${locale}/about`,
      active: pathname.includes("/about"),
    },
  ];

  return (
    <BackgroundGrid>
      <div className="min-h-screen text-foreground flex flex-col">
        <div className="flex-1 flex max-w-7xl w-full mx-auto p-3 md:p-4 gap-4">
          {/* Left Sidebar - Desktop */}
          <aside className="hidden lg:flex flex-col w-[220px] shrink-0 gap-4">
            {/* Navigation box */}
            <div className="flex flex-col gap-1.5 p-4 border rounded-xl bg-card border-border/80">
              <div className="flex items-center gap-2 pb-3 mb-2 border-b border-border/60">
                <Terminal className="h-4 w-4 text-primary animate-pulse" />
                <span className="font-bold text-xs tracking-widest text-foreground/90 uppercase">
                  VOIDFETCH
                </span>
              </div>

              <nav className="flex flex-col gap-1">
                {links.map((link) => {
                  const Icon = link.icon;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={(e) => {
                        if (link.active) {
                          e.preventDefault();
                        }
                      }}
                      className={cn(
                        "flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-lg transition-colors",
                        link.active
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span>{link.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>
            {/* VoidStation Glassmorphic Footer Badge */}
            <div className="mt-auto p-3.5 rounded-2xl border border-border/60 bg-muted/30 backdrop-blur-md flex flex-col gap-2 shadow-2xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span className="text-[10px] font-bold text-foreground tracking-wider uppercase">
                    VoidFetch
                  </span>
                </div>
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20 font-bold">
                  v1.0.0
                </span>
              </div>

              <div className="flex items-center justify-between text-[9px] text-muted-foreground/80 pt-1.5 border-t border-border/40">
                <span>© 2026 VoidStation</span>
                <Link
                  href={`/${locale}/privacy`}
                  className="hover:text-primary transition-colors font-medium"
                >
                  Privacy & Terms
                </Link>
              </div>
            </div>
          </aside>

          {/* Main Content Pane */}
          <main className="flex-1 flex flex-col min-w-0 gap-4">
            {/* Mobile Navigation bar header */}
            <div className="flex lg:hidden items-center justify-between p-3 border rounded-xl bg-card border-border/80 shrink-0">
              <div className="flex items-center gap-2">
                <Terminal className="h-4 w-4 text-primary" />
                <span className="font-bold text-xs tracking-wider">
                  VOIDFETCH
                </span>
              </div>
              <nav className="flex gap-1">
                {links.map((link) => {
                  const Icon = link.icon;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      title={link.label}
                      onClick={(e) => {
                        if (link.active) {
                          e.preventDefault();
                        }
                      }}
                      className={cn(
                        "p-1.5 rounded-lg transition-colors",
                        link.active
                          ? "bg-primary/15 text-primary"
                          : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                    </Link>
                  );
                })}
              </nav>
            </div>

            <div className="flex-1 flex flex-col gap-4 min-w-0">{children}</div>
          </main>
        </div>
      </div>
    </BackgroundGrid>
  );
}
