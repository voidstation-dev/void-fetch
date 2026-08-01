/**
 * VoidFetch - Aceternity UI Inspired Ambient Background Grid & Radial Light Beams
 * Copyright (c) 2026 VoidStation.
 */

"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface BackgroundGridProps {
  children?: React.ReactNode;
  className?: string;
}

export function BackgroundGrid({ children, className }: BackgroundGridProps) {
  return (
    <div
      className={cn(
        "relative min-h-screen w-full bg-background overflow-hidden",
        className,
      )}
    >
      {/* Radial Gradient Ambient Light Beam Top */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-primary/10 rounded-full blur-[140px] opacity-50 dark:opacity-40" />

      {/* Radial Gradient Ambient Light Beam Bottom Right */}
      <div className="pointer-events-none absolute -bottom-40 -right-40 w-[600px] h-[450px] bg-primary/5 rounded-full blur-[120px] opacity-40" />

      {/* Grid Pattern Overlay */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />

      {/* Content wrapper */}
      <div className="relative z-10">{children}</div>
    </div>
  );
}
