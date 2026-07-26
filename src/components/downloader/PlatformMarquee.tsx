/**
 * VoidFetch
 * Copyright (c) 2026 VoidStation.
 * All rights reserved.
 */

'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useDictionary } from '@/i18n/client';
import { getPlatformSupportItems, PlatformSupportKey } from '@/components/downloader/platform-support';
import { cn } from '@/lib/utils';
import { Sparkles, ExternalLink, ShieldCheck } from 'lucide-react';

import { SupportedPlatformsModal } from './SupportedPlatformsModal';

interface PlatformMarqueeProps {
  className?: string;
}

export const PLATFORM_URLS: Record<PlatformSupportKey, string> = {
  bilibili: 'https://www.bilibili.com',
  bilibiliTv: 'https://www.bilibili.com',
  douyin: 'https://www.douyin.com',
  youtube: 'https://www.youtube.com',
  telegram: 'https://telegram.org',
  threads: 'https://www.threads.net',
  wechat: 'https://mp.weixin.qq.com',
  niconico: 'https://www.nicovideo.jp',
  weibo: 'https://weibo.com',
  xiaohongshu: 'https://www.xiaohongshu.com',
  tiktok: 'https://www.tiktok.com',
  instagram: 'https://www.instagram.com',
  x: 'https://x.com',
  vimeo: 'https://vimeo.com',
  dailymotion: 'https://www.dailymotion.com',
  streamable: 'https://streamable.com',
  reddit: 'https://www.reddit.com',
  newgrounds: 'https://www.newgrounds.com',
  tumblr: 'https://www.tumblr.com',
  pinterest: 'https://www.pinterest.com',
  vk: 'https://vk.com',
  okru: 'https://ok.ru',
  twitch: 'https://www.twitch.tv',
  soundcloud: 'https://soundcloud.com',
  applePodcasts: 'https://podcasts.apple.com',
  hls: 'https://m3u8player.org',
};

export function PlatformMarquee({ className }: PlatformMarqueeProps) {
  const dict = useDictionary();
  const items = getPlatformSupportItems(dict);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Duplicate items twice to ensure a seamless infinite scroll loop
  const marqueeItems = [...items, ...items];

  return (
    <div className={cn('relative w-full overflow-hidden rounded-xl bg-card/70 border border-border/70 p-2 pt-7 shadow-xs', className)}>
      {/* Left & Right gradient fade masks for smooth entrance & exit */}
      <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-12 z-10 bg-gradient-to-r from-card via-card/80 to-transparent" />
      <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-12 z-10 bg-gradient-to-l from-card via-card/80 to-transparent" />

      {/* Marquee Header & Moving Ticker track */}
      <div className="flex items-center gap-3 relative">
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-1.5 px-2.5 shrink-0 z-20 bg-background/90 hover:bg-muted/80 backdrop-blur-md border border-border/60 hover:border-primary/50 py-1 rounded-lg shadow-xs transition-all duration-200 group cursor-pointer"
          title="Click to view all 25+ supported platforms"
        >
          <Sparkles className="h-3.5 w-3.5 text-amber-500 animate-pulse" />
          <span className="text-[10px] font-bold text-foreground/90 uppercase tracking-wider whitespace-nowrap group-hover:text-primary transition-colors">
            {dict?.guide?.platformSupport?.title || 'PLATFORMS'}
          </span>
          <span className="text-[9px] font-bold text-primary bg-primary/15 px-1.5 py-0.2 rounded-full border border-primary/20 group-hover:bg-primary group-hover:text-primary-foreground transition-all">
            25+ Live
          </span>
        </button>

        {/* Moving Ticker track */}
        <div className="flex-1 overflow-hidden py-1">
          <div className="animate-marquee flex items-center gap-2">
            {marqueeItems.map((item, idx) => {
              const platformUrl = PLATFORM_URLS[item.key] || '#';
              const isHovered = hoveredIdx === idx;

              return (
                <div
                  key={`${item.key}-${idx}`}
                  className="relative group shrink-0"
                  onMouseEnter={() => setHoveredIdx(idx)}
                  onMouseLeave={() => setHoveredIdx(null)}
                >
                  {/* Floating Glassmorphic Tooltip Centered Above Hovered Pill */}
                  {isHovered && (
                    <div className="absolute -top-9 left-1/2 -translate-x-1/2 z-50 pointer-events-none flex flex-col items-center animate-in fade-in-0 zoom-in-95 duration-150">
                      <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-popover/95 text-popover-foreground border border-border/80 shadow-xl backdrop-blur-md text-[10px] font-bold whitespace-nowrap">
                        <ShieldCheck className="h-3 w-3 text-emerald-500 shrink-0" />
                        <span>{item.name}</span>
                        {item.features && item.features.length > 0 && (
                          <span className="text-[8px] font-medium bg-muted/80 text-muted-foreground px-1.5 py-0.2 rounded">
                            {item.features[0]}
                          </span>
                        )}
                        <ExternalLink className="h-2.5 w-2.5 text-muted-foreground shrink-0" />
                      </div>
                      <div className="w-1.5 h-1.5 bg-popover/95 border-r border-b border-border/80 rotate-45 -mt-0.5" />
                    </div>
                  )}

                  <a
                    href={platformUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
                      'bg-background/80 hover:bg-card border border-border/60 hover:border-primary/60',
                      'shadow-2xs hover:shadow-lg hover:shadow-primary/10 transition-all duration-300 transform hover:-translate-y-0.5 cursor-pointer text-foreground'
                    )}
                  >
                    <div
                      className={cn(
                        'relative flex h-5 w-5 shrink-0 items-center justify-center rounded-md border',
                        item.visual.frameClassName
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
                              'h-3.5 w-3.5 object-contain dark:hidden transition-transform duration-300 group-hover:scale-110',
                              item.visual.iconClassName
                            )}
                          />
                          <Image
                            src={item.visual.darkSrc}
                            alt=""
                            width={14}
                            height={14}
                            unoptimized
                            className={cn(
                              'hidden h-3.5 w-3.5 object-contain dark:block transition-transform duration-300 group-hover:scale-110',
                              item.visual.iconClassName
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
                            'h-3.5 w-3.5 object-contain transition-transform duration-300 group-hover:scale-110',
                            item.visual.iconClassName
                          )}
                        />
                      ) : (
                        <span className="text-[8px] font-bold uppercase">{item.name.slice(0, 2)}</span>
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
