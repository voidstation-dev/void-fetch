/**
 * VoidFetch
 * Copyright (c) 2026 VoidStation.
 * All rights reserved.
 */

"use client";

import React, { useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslations } from "next-intl";
import {
  getPlatformSupportItems,
  PlatformSupportKey,
} from "@/components/downloader/platform-support";
import { cn } from "@/lib/utils";
import { Sparkles, ExternalLink, ShieldCheck, Globe, Zap } from "lucide-react";

import { SupportedPlatformsModal } from "./SupportedPlatformsModal";

interface PlatformMarqueeProps {
  className?: string;
}

export const PLATFORM_URLS: Record<PlatformSupportKey, string> = {
  bilibili: "https://www.bilibili.com",
  bilibiliTv: "https://www.bilibili.com",
  douyin: "https://www.douyin.com",
  youtube: "https://www.youtube.com",
  telegram: "https://telegram.org",
  threads: "https://www.threads.net",
  wechat: "https://mp.weixin.qq.com",
  niconico: "https://www.nicovideo.jp",
  weibo: "https://weibo.com",
  xiaohongshu: "https://www.xiaohongshu.com",
  tiktok: "https://www.tiktok.com",
  instagram: "https://www.instagram.com",
  x: "https://x.com",
  vimeo: "https://vimeo.com",
  dailymotion: "https://www.dailymotion.com",
  streamable: "https://streamable.com",
  reddit: "https://www.reddit.com",
  newgrounds: "https://www.newgrounds.com",
  tumblr: "https://www.tumblr.com",
  pinterest: "https://www.pinterest.com",
  vk: "https://vk.com",
  okru: "https://ok.ru",
  twitch: "https://www.twitch.tv",
  soundcloud: "https://soundcloud.com",
  applePodcasts: "https://podcasts.apple.com",
  hls: "https://m3u8player.org",
};

export function PlatformMarquee({ className }: PlatformMarqueeProps) {
  const tModal = useTranslations("supportedPlatformsModal");
  const items = getPlatformSupportItems();
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Duplicate items twice to ensure a seamless infinite scroll loop
  const marqueeItems = [...items, ...items];

  return (
    <div
      className={cn(
        "relative w-full overflow-x-clip overflow-y-visible rounded-xl bg-card/70 border border-border/70 p-2 pt-7 shadow-xs",
        className,
      )}
    >
      {/* Left & Right gradient fade masks for smooth entrance & exit */}
      <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-12 z-10 bg-linear-to-r from-card via-card/80 to-transparent rounded-l-xl" />
      <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-12 z-10 bg-linear-to-l from-card via-card/80 to-transparent rounded-r-xl" />

      {/* Marquee Header & Moving Ticker track */}
      <div className="flex items-center gap-3 relative overflow-y-visible">
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-1.5 px-2.5 shrink-0 z-20 bg-background/90 hover:bg-muted/80 backdrop-blur-md border border-border/60 hover:border-primary/50 py-1 rounded-lg shadow-xs transition-all duration-200 group cursor-pointer"
          title={tModal("clickTitle")}
        >
          <Sparkles className="h-3.5 w-3.5 text-amber-500 animate-pulse" />
          <span className="text-[10px] font-bold text-foreground/90 uppercase tracking-wider whitespace-nowrap group-hover:text-primary transition-colors">
            {tModal("title")}
          </span>
          <span className="text-[9px] font-bold text-primary bg-primary/15 px-1.5 py-0.2 rounded-full border border-primary/20 group-hover:bg-primary group-hover:text-primary-foreground transition-all">
            {tModal("badge")}
          </span>
        </button>

        {/* Moving Ticker track */}
        <div className="flex-1 overflow-x-clip overflow-y-visible py-1 group/track">
          <div className="animate-marquee flex items-center gap-2 group-hover/track:[animation-play-state:paused] overflow-y-visible py-1">
            {marqueeItems.map((item, idx) => {
              const platformUrl = PLATFORM_URLS[item.key] || "#";
              const isHovered = hoveredIdx === idx;

              return (
                <div
                  key={`${item.key}-${idx}`}
                  className={cn(
                    "relative group shrink-0",
                    isHovered ? "z-50" : "z-10",
                  )}
                  onMouseEnter={() => setHoveredIdx(idx)}
                  onMouseLeave={() => setHoveredIdx(null)}
                >
                  {/* Aceternity Tooltip Card Centered Above Hovered Pill */}
                  <AnimatePresence>
                    {isHovered && (
                      <motion.div
                        initial={{ opacity: 0, y: 6, scale: 0.95 }}
                        animate={{
                          opacity: 1,
                          y: 0,
                          scale: 1,
                          transition: {
                            duration: 0.12,
                            ease: "easeOut",
                          },
                        }}
                        exit={{
                          opacity: 0,
                          y: 4,
                          scale: 0.96,
                          transition: { duration: 0.08 },
                        }}
                        className="absolute bottom-full mb-2.5 left-1/2 -translate-x-1/2 z-50 pointer-events-none flex flex-col items-center transform-gpu will-change-transform"
                      >
                        <div className="w-52 p-3 rounded-2xl bg-card/95 backdrop-blur-2xl border border-primary/40 shadow-2xl flex flex-col gap-2 text-left">
                          <div className="flex items-center justify-between gap-2 border-b border-border/40 pb-2">
                            <div className="flex items-center gap-2">
                              <div
                                className={cn(
                                  "w-7 h-7 rounded-lg border flex items-center justify-center overflow-hidden shrink-0",
                                  item.visual.frameClassName,
                                )}
                              >
                                {item.visual.darkSrc && item.visual.src ? (
                                  <>
                                    <Image
                                      src={item.visual.src}
                                      alt=""
                                      width={16}
                                      height={16}
                                      unoptimized
                                      className="h-4 w-4 object-contain dark:hidden"
                                    />
                                    <Image
                                      src={item.visual.darkSrc}
                                      alt=""
                                      width={16}
                                      height={16}
                                      unoptimized
                                      className="hidden h-4 w-4 object-contain dark:block"
                                    />
                                  </>
                                ) : item.visual.src ? (
                                  <Image
                                    src={item.visual.src}
                                    alt=""
                                    width={16}
                                    height={16}
                                    unoptimized
                                    className="h-4 w-4 object-contain"
                                  />
                                ) : (
                                  <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                                )}
                              </div>
                              <div className="flex flex-col">
                                <span className="text-xs font-bold text-foreground leading-tight">
                                  {item.name}
                                </span>
                                <span className="text-[9px] font-mono text-primary">
                                  #{item.key}
                                </span>
                              </div>
                            </div>
                            <span className="text-[9px] font-bold text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                              {tModal("active")}
                            </span>
                          </div>

                          <div className="flex flex-wrap gap-1">
                            {item.features.map((feat, fIdx) => (
                              <span
                                key={fIdx}
                                className="px-1.5 py-0.5 rounded bg-muted/60 text-[9px] text-foreground/80 flex items-center gap-1 font-medium border border-border/40"
                              >
                                <ShieldCheck className="h-2.5 w-2.5 text-emerald-500 shrink-0" />
                                {feat}
                              </span>
                            ))}
                          </div>

                          <div className="flex items-center justify-between pt-1 border-t border-border/30 text-[9px] text-muted-foreground font-mono">
                            <span className="flex items-center gap-1">
                              <Zap className="h-2.5 w-2.5 text-amber-400" />{" "}
                              {tModal("autoDetect")}
                            </span>
                            <ExternalLink className="h-3 w-3 text-primary shrink-0" />
                          </div>
                        </div>
                        <div className="w-2.5 h-2.5 bg-card/95 border-r border-b border-primary/40 rotate-45 -mt-1 shadow-md" />
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <a
                    href={platformUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
                      "bg-background/80 hover:bg-card border border-border/60 hover:border-primary/60",
                      "shadow-2xs hover:shadow-lg hover:shadow-primary/10 transition-all duration-300 transform hover:-translate-y-0.5 cursor-pointer text-foreground",
                    )}
                  >
                    <div
                      className={cn(
                        "relative flex h-5 w-5 shrink-0 items-center justify-center rounded-md border",
                        item.visual.frameClassName,
                      )}
                    >
                      {item.visual.darkSrc && item.visual.src ? (
                        <>
                          <Image
                            src={item.visual.src}
                            alt=""
                            width={14}
                            height={14}
                            unoptimized
                            className={cn(
                              "h-3.5 w-3.5 object-contain dark:hidden transition-transform duration-300 group-hover:scale-110",
                              item.visual.iconClassName,
                            )}
                          />
                          <Image
                            src={item.visual.darkSrc}
                            alt=""
                            width={14}
                            height={14}
                            unoptimized
                            className={cn(
                              "hidden h-3.5 w-3.5 object-contain dark:block transition-transform duration-300 group-hover:scale-110",
                              item.visual.iconClassName,
                            )}
                          />
                        </>
                      ) : item.visual.src ? (
                        <Image
                          src={item.visual.src}
                          alt=""
                          width={14}
                          height={14}
                          unoptimized
                          className={cn(
                            "h-3.5 w-3.5 object-contain transition-transform duration-300 group-hover:scale-110",
                            item.visual.iconClassName,
                          )}
                        />
                      ) : (
                        <span className="text-[8px] font-bold uppercase">
                          {item.name.slice(0, 2)}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] font-medium text-foreground/80 group-hover:text-primary transition-colors whitespace-nowrap">
                      {item.name}
                    </span>
                  </a>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <SupportedPlatformsModal open={modalOpen} onOpenChange={setModalOpen} />
    </div>
  );
}
