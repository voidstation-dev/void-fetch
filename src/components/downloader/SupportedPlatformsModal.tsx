/**
 * VoidFetch - Aceternity Supported Platforms Modal
 * Copyright (c) 2026 VoidStation.
 * All rights reserved.
 */

"use client";

import { useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sparkles,
  Search,
  ExternalLink,
  ShieldCheck,
  Layers,
  Zap,
  Globe,
} from "lucide-react";
import { getPlatformSupportItems } from "@/components/downloader/platform-support";
import { PLATFORM_URLS } from "@/components/downloader/PlatformMarquee";

interface SupportedPlatformsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SupportedPlatformsModal({
  open,
  onOpenChange,
}: SupportedPlatformsModalProps) {
  const t = useTranslations("supportedPlatformsModal");
  const items = getPlatformSupportItems();
  const [searchQuery, setSearchQuery] = useState("");
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const filteredItems = items.filter((item) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    const nameMatch = item.name.toLowerCase().includes(query);
    const featureMatch = item.features.some((f) =>
      f.toLowerCase().includes(query),
    );
    return nameMatch || featureMatch;
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl w-[calc(100vw-2rem)] max-h-[85vh] flex flex-col p-0 overflow-hidden bg-card/95 backdrop-blur-2xl border-border/80 shadow-2xl rounded-3xl">
        {/* Ambient Top Glow Line */}
        <div className="h-1.5 w-full bg-linear-to-r from-emerald-500 via-primary to-cyan-500" />

        {/* Modal Header */}
        <DialogHeader className="p-6 pb-3 flex flex-col gap-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-primary/10 border border-primary/20 text-primary shadow-inner">
                <Sparkles className="h-5 w-5 text-primary animate-pulse" />
              </div>
              <div className="flex flex-col text-left">
                <DialogTitle className="text-lg font-extrabold text-foreground flex items-center gap-2">
                  <span>{t("title")}</span>
                  <Badge
                    variant="outline"
                    className="text-[10px] font-mono font-bold bg-primary/10 text-primary border-primary/20 px-2 py-0.5 rounded-full"
                  >
                    {t("badge")}
                  </Badge>
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  {t("description")}
                </DialogDescription>
              </div>
            </div>
          </div>

          {/* Search Filter Bar */}
          <div className="relative w-full pt-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              type="text"
              placeholder={t("searchPlaceholder")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-10 text-xs rounded-xl bg-muted/30 border-border/70 focus-visible:ring-primary/40"
            />
          </div>
        </DialogHeader>

        {/* Platforms Grid Container with Aceternity Card Hover Effect */}
        <div className="flex-1 overflow-y-auto px-6 pb-6 pt-1">
          {filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground gap-2">
              <Layers className="h-10 w-10 text-muted-foreground/40 stroke-1" />
              <span className="text-xs font-semibold">
                {t("noSearchResults", { query: searchQuery })}
              </span>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {filteredItems.map((item, idx) => {
                const targetUrl = PLATFORM_URLS[item.key] || "#";
                const visual = item.visual;

                return (
                  <div
                    key={item.key}
                    className="group relative block p-1.5 h-full w-full"
                    onMouseEnter={() => setHoveredIdx(idx)}
                    onMouseLeave={() => setHoveredIdx(null)}
                  >
                    <AnimatePresence>
                      {hoveredIdx === idx && (
                        <motion.span
                          className="absolute inset-0 h-full w-full bg-neutral-200/80 dark:bg-slate-800/80 block rounded-2xl"
                          layoutId="hoverBackground"
                          initial={{ opacity: 0 }}
                          animate={{
                            opacity: 1,
                            transition: { duration: 0.15 },
                          }}
                          exit={{
                            opacity: 0,
                            transition: { duration: 0.15, delay: 0.2 },
                          }}
                        />
                      )}
                    </AnimatePresence>

                    <div className="relative z-20 flex flex-col justify-between p-3.5 rounded-2xl border border-border/70 bg-card group-hover:border-slate-500/50 transition-colors h-full overflow-hidden shadow-xs">
                      <div className="flex flex-col gap-2.5">
                        {/* Platform Icon & Title */}
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <div
                              className={`relative w-8 h-8 rounded-xl border flex items-center justify-center overflow-hidden shrink-0 ${visual.frameClassName}`}
                            >
                              {visual.darkSrc && visual.src ? (
                                <>
                                  <Image
                                    src={visual.src}
                                    alt={item.name}
                                    width={20}
                                    height={20}
                                    className={`object-contain dark:hidden ${visual.iconClassName || ""}`}
                                  />
                                  <Image
                                    src={visual.darkSrc}
                                    alt={item.name}
                                    width={20}
                                    height={20}
                                    className={`object-contain hidden dark:block ${visual.iconClassName || ""}`}
                                  />
                                </>
                              ) : visual.src ? (
                                <Image
                                  src={visual.src}
                                  alt={item.name}
                                  width={20}
                                  height={20}
                                  className={`object-contain ${visual.iconClassName || ""}`}
                                />
                              ) : (
                                <Globe className="h-4 w-4 text-muted-foreground" />
                              )}
                            </div>

                            <div className="flex flex-col">
                              <span className="text-xs font-bold text-foreground group-hover:text-primary transition-colors flex items-center gap-1">
                                {item.name}
                              </span>
                              <span className="text-[9px] text-muted-foreground font-mono">
                                {item.key}
                              </span>
                            </div>
                          </div>

                          {/* Direct Link Button */}
                          <a
                            href={targetUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors z-20"
                            title={`Visit ${item.name}`}
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        </div>

                        {/* Feature Pills */}
                        <div className="flex flex-wrap gap-1 pt-1">
                          {item.features.map((feature, fIdx) => (
                            <span
                              key={fIdx}
                              className="px-2 py-0.5 rounded-md bg-muted/50 border border-border/60 text-[9px] font-medium text-foreground/80 flex items-center gap-1"
                            >
                              <ShieldCheck className="h-2.5 w-2.5 text-emerald-500 shrink-0" />
                              {feature}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Bottom Status Chip */}
                      <div className="flex items-center justify-between pt-3 mt-2 border-t border-border/40 text-[9px] text-muted-foreground font-mono">
                        <span className="flex items-center gap-1 text-emerald-500 font-semibold">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                          {t("activeStreamer")}
                        </span>
                        <span className="flex items-center gap-0.5 text-foreground/70">
                          <Zap className="h-2.5 w-2.5 text-amber-400" />{" "}
                          {t("fastExtract")}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-border/70 bg-muted/20 flex items-center justify-between text-xs px-6">
          <span className="text-[10px] text-muted-foreground font-mono">
            {t("showingCount", {
              count: filteredItems.length,
              total: items.length,
            })}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="h-8 text-xs px-4 rounded-xl border-border/80"
          >
            {t("close")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
