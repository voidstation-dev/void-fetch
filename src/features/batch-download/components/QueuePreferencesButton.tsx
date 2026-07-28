/**
 * VoidFetch
 * Copyright (c) 2026 VoidStation.
 * All rights reserved.
 */

"use client";

import React from "react";
import { useBatchStore } from "../store/batch-store";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";
import { useTranslations } from "next-intl";

export function QueuePreferencesButton() {
  const t = useTranslations("batchWorkspace");
  const setIsSettingsOpen = useBatchStore((s) => s.setIsSettingsOpen);

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => setIsSettingsOpen(true)}
      className="h-8 text-xs gap-1.5 px-3 border-border/80 hover:border-primary/50 hover:bg-primary/5 transition-all shadow-2xs cursor-pointer"
    >
      <Settings className="h-3.5 w-3.5 text-primary animate-spin-slow" />
      <span>{t("queuePreferences")}</span>
    </Button>
  );
}
