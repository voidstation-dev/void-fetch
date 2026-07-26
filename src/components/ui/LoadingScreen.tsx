/**
 * VoidFetch - Aceternity High-Tech Loading Screen Component
 * Copyright (c) 2026 VoidStation.
 * All rights reserved.
 */

"use client";

import React, { useState, useEffect } from "react";
import { Sparkles, Zap, ShieldCheck, Cpu } from "lucide-react";
import { EncryptedText } from "./encrypted-text";
import { Badge } from "./badge";
import { cn } from "@/lib/utils";

interface LoadingScreenProps {
  title?: string;
  subtitle?: string;
  className?: string;
}

const LOADING_STEP_MESSAGES = [
  "Booting multi-threaded extraction engine...",
  "Syncing local workspace database & queue...",
  "Initializing HLS/M3U8 proxy stream handlers...",
  "Readying ultra-speed chunk downloader...",
];

export function LoadingScreen({
  title = "INITIALIZING VOIDFETCH ENGINE",
  subtitle = "Loading local workspace database & worker threads...",
  className,
}: LoadingScreenProps) {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep((prev) => (prev + 1) % LOADING_STEP_MESSAGES.length);
    }, 1800);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className={cn(
        "relative flex flex-col items-center justify-center h-[calc(100vh-5.5rem)] w-full overflow-hidden rounded-3xl border border-border/80 bg-card/90 backdrop-blur-2xl shadow-2xl p-8 transition-all duration-300 animate-in fade-in-50",
        className
      )}
    >
      {/* Background Radial Glow & Cyber Grid */}
      <div className="absolute inset-0 bg-[radial-gradient(#ffffff0a_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none opacity-80" />
      <div className="absolute -top-32 -left-32 w-80 h-80 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute -bottom-32 -right-32 w-80 h-80 bg-purple-500/15 rounded-full blur-3xl pointer-events-none animate-pulse" />

      {/* Top Ambient Glow Line */}
      <div className="absolute top-0 inset-x-12 h-px bg-gradient-to-r from-transparent via-primary/70 to-transparent" />

      {/* Main Animated Orb & Orbit Rings */}
      <div className="relative flex items-center justify-center my-6">
        {/* Outer Orbit Pulse */}
        <div className="absolute w-28 h-28 rounded-full border border-primary/20 bg-primary/5 animate-ping opacity-40" />

        {/* Dual Rotating Dashed Rings */}
        <div className="absolute w-24 h-24 rounded-full border-2 border-dashed border-cyan-500/40 animate-spin-slow" />
        <div className="absolute w-20 h-20 rounded-full border border-dashed border-purple-500/50 animate-spin-reverse-slow" />

        {/* Glowing Center Badge */}
        <div className="relative p-4 rounded-2xl bg-gradient-to-br from-card via-card/90 to-primary/20 border border-primary/40 text-primary shadow-[0_0_30px_rgba(16,185,129,0.35)] backdrop-blur-xl flex items-center justify-center">
          <Zap className="h-8 w-8 text-primary animate-pulse drop-shadow-[0_0_12px_rgba(16,185,129,0.8)]" />
        </div>
      </div>

      {/* Title & Cyberpunk Encrypted Text */}
      <div className="flex flex-col items-center gap-2 z-10 text-center max-w-md">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-amber-400 animate-spin-slow" />
          <span className="text-xs font-black tracking-widest uppercase text-foreground">
            <EncryptedText
              text={title}
              className="text-primary drop-shadow-[0_0_10px_rgba(16,185,129,0.5)] font-mono"
            />
          </span>
          <Sparkles className="h-4 w-4 text-cyan-400 animate-spin-slow" />
        </div>

        {/* Neon Progress Bar */}
        <div className="relative w-64 h-1.5 rounded-full bg-muted/60 overflow-hidden border border-border/40 my-2">
          <div className="absolute inset-y-0 left-0 w-full bg-gradient-to-r from-cyan-500 via-primary to-purple-500 rounded-full animate-shimmer" />
        </div>

        {/* Dynamic Stepper Text */}
        <span className="text-[11px] font-mono text-muted-foreground transition-all duration-300 min-h-[1.25rem] flex items-center gap-1.5">
          <Cpu className="h-3 w-3 text-cyan-400 shrink-0 animate-pulse" />
          <span>{LOADING_STEP_MESSAGES[currentStep] || subtitle}</span>
        </span>
      </div>

      {/* Bottom Tech Badges */}
      <div className="mt-8 flex items-center gap-2 z-10">
        <Badge
          variant="outline"
          className="text-[9px] font-mono font-bold bg-primary/10 text-primary border-primary/20 px-2.5 py-0.5 rounded-full flex items-center gap-1"
        >
          <ShieldCheck className="h-3 w-3 text-emerald-400" /> 25+ PLATFORMS READY
        </Badge>
        <Badge
          variant="outline"
          className="text-[9px] font-mono text-muted-foreground/80 bg-muted/40 border-border/40 px-2 py-0.5 rounded-full"
        >
          v1.0.0 RELEASE
        </Badge>
      </div>
    </div>
  );
}
