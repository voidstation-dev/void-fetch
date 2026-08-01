/**
 * VoidFetch - Aceternity Header Logo Cloud Component
 * Copyright (c) 2026 VoidStation.
 */

"use client";

import React, { useState } from "react";
import { SupportedPlatformsModal } from "./SupportedPlatformsModal";
import { ChevronRight } from "lucide-react";

interface PlatformLogo {
  name: string;
  label: string;
  iconBg: string;
  textColor: string;
}

const SUPPORTED_PLATFORMS: PlatformLogo[] = [
  {
    name: "youtube",
    label: "YouTube",
    iconBg: "bg-red-500/10 text-red-500 border-red-500/20",
    textColor: "hover:text-red-500",
  },
  {
    name: "tiktok",
    label: "TikTok",
    iconBg: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
    textColor: "hover:text-cyan-400",
  },
  {
    name: "douyin",
    label: "Douyin",
    iconBg: "bg-pink-500/10 text-pink-500 border-pink-500/20",
    textColor: "hover:text-pink-500",
  },
  {
    name: "soundcloud",
    label: "SoundCloud",
    iconBg: "bg-orange-500/10 text-orange-500 border-orange-500/20",
    textColor: "hover:text-orange-500",
  },
  {
    name: "bilibili",
    label: "Bilibili",
    iconBg: "bg-sky-500/10 text-sky-400 border-sky-500/20",
    textColor: "hover:text-sky-400",
  },
  {
    name: "instagram",
    label: "Instagram",
    iconBg: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    textColor: "hover:text-purple-400",
  },
  {
    name: "twitter",
    label: "X / Twitter",
    iconBg: "bg-zinc-500/10 text-zinc-300 border-zinc-500/20",
    textColor: "hover:text-foreground",
  },
  {
    name: "twitch",
    label: "Twitch",
    iconBg: "bg-purple-600/10 text-purple-500 border-purple-600/20",
    textColor: "hover:text-purple-500",
  },
];

export function HeaderLogoCloud() {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <div
        onClick={() => setModalOpen(true)}
        className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-muted/20 border border-border/60 backdrop-blur-md cursor-pointer hover:border-primary/50 hover:bg-muted/40 transition-all duration-300 group shadow-2xs"
        title="Click to view all 25+ supported platforms"
      >
        <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mr-1 flex items-center gap-1 group-hover:text-primary transition-colors">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping"></span>
          25+ Supported
          <ChevronRight className="h-2.5 w-2.5 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
        </span>

        <div className="flex items-center gap-1.5">
          {SUPPORTED_PLATFORMS.map((platform) => (
            <div
              key={platform.name}
              className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-[10px] font-bold transition-all duration-300 transform group-hover:scale-105 ${platform.iconBg}`}
            >
              <span>{platform.label}</span>
            </div>
          ))}
        </div>
      </div>

      <SupportedPlatformsModal open={modalOpen} onOpenChange={setModalOpen} />
    </>
  );
}
