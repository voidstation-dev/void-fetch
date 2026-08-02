/**
 * VoidFetch
 * Copyright (c) 2026 VoidStation.
 * All rights reserved.
 */

import React, { useState } from "react";
import { useBatchStore } from "../store/batch-store";
import { DownloadJobRow } from "./DownloadJobRow";
import { JobErrorDialog } from "./JobErrorDialog";
import { Button } from "@/components/ui/button";
import { Settings, Trash2, Layers, Sparkles, Play } from "lucide-react";
import type { DownloadJob } from "../types/batch-download";
import { ExpandableJobCard } from "./ExpandableJobCard";
import { useTranslations } from "next-intl";

export function DownloadQueue() {
  const t = useTranslations("batchWorkspace.queue");
  const jobs = useBatchStore((s) => s.jobs);
  const searchQuery = useBatchStore((s) => s.searchQuery);
  const statusFilter = useBatchStore((s) => s.statusFilter);
  const platformFilter = useBatchStore((s) => s.platformFilter);
  const selectedJobIds = useBatchStore((s) => s.selectedJobIds);
  const setActiveJobDrawerId = useBatchStore((s) => s.setActiveJobDrawerId);
  const removeJobs = useBatchStore((s) => s.removeJobs);
  const toggleAllSelection = useBatchStore((s) => s.toggleAllSelection);
  const startSelectedQueue = useBatchStore((s) => s.startSelectedQueue);

  const [selectedErrorJob, setSelectedErrorJob] = useState<DownloadJob | null>(
    null,
  );
  const [errorDialogOpen, setErrorDialogOpen] = useState(false);
  const [expandedJob, setExpandedJob] = useState<DownloadJob | null>(null);

  // Apply filters to jobs list
  const filteredJobs = jobs.filter((job) => {
    // 1. Search Query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const titleMatch = job.metadata?.title?.toLowerCase().includes(query);
      const urlMatch = job.sourceUrl.toLowerCase().includes(query);
      if (!titleMatch && !urlMatch) return false;
    }

    // 2. Status Filter
    if (statusFilter !== "all" && job.status !== statusFilter) {
      return false;
    }

    // 3. Platform Filter
    if (platformFilter !== "all" && job.platform !== platformFilter) {
      return false;
    }

    return true;
  });

  const handleOpenError = (job: DownloadJob) => {
    setSelectedErrorJob(job);
    setErrorDialogOpen(true);
  };

  const handleBulkEdit = () => {
    setActiveJobDrawerId("bulk");
  };

  const handleRemoveSelected = () => {
    removeJobs(selectedJobIds);
  };

  const visibleIds = filteredJobs.map((j) => j.id);
  const allVisibleSelected =
    visibleIds.length > 0 &&
    visibleIds.every((id) => selectedJobIds.includes(id));

  // Render Aceternity Glassmorphic Empty State
  if (jobs.length === 0) {
    return (
      <div
        id="tour-batch-queue"
        className="relative overflow-hidden rounded-3xl border-2 border-dashed border-primary/30 bg-card/85 backdrop-blur-2xl p-12 text-center shadow-2xl flex flex-col items-center justify-center gap-6 group hover:border-primary/60 transition-colors duration-200 my-2"
      >
        {/* Ambient Radial Spotlight Glow */}
        <div className="absolute inset-0 bg-radial-glow from-primary/10 via-transparent to-transparent pointer-events-none opacity-60 group-hover:opacity-100 transition-opacity duration-500" />

        {/* Animated Icon Badge */}
        <div className="relative p-5 rounded-2xl bg-linear-to-br from-primary/20 via-primary/10 to-transparent border border-primary/30 text-primary shadow-xl group-hover:scale-110 group-hover:-translate-y-1 transition-all duration-300">
          <Layers className="h-10 w-10 text-primary animate-pulse" />
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </span>
        </div>

        {/* Text Area */}
        <div className="flex flex-col items-center gap-2 max-w-md z-10">
          <h3 className="text-base font-extrabold text-foreground tracking-wide flex items-center gap-2">
            <span>{t("emptyTitle")}</span>
            <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 font-bold uppercase">
              {t("emptyBadge")}
            </span>
          </h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {t("emptyDescription")}
          </p>
        </div>

        {/* Feature Highlights Pills */}
        <div className="flex flex-wrap items-center justify-center gap-2 z-10 pt-2 border-t border-border/40">
          <span className="px-3 py-1 rounded-full bg-muted/30 border border-border/60 text-[10px] font-medium text-muted-foreground flex items-center gap-1.5 shadow-2xs">
            <Sparkles className="h-3 w-3 text-emerald-500" />{" "}
            {t("multiThreaded")}
          </span>
          <span className="px-3 py-1 rounded-full bg-muted/30 border border-border/60 text-[10px] font-medium text-muted-foreground flex items-center gap-1.5 shadow-2xs">
            <Sparkles className="h-3 w-3 text-cyan-400" />{" "}
            {t("audioExtraction")}
          </span>
          <span className="px-3 py-1 rounded-full bg-muted/30 border border-border/60 text-[10px] font-medium text-muted-foreground flex items-center gap-1.5 shadow-2xs">
            <Sparkles className="h-3 w-3 text-purple-400" /> {t("upTo4k")}
          </span>
        </div>
      </div>
    );
  }
  return (
    <div id="tour-batch-queue" className="flex flex-col gap-3 pb-20 md:pb-24">
      {/* Select All & List Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3.5 border rounded-2xl bg-card/80 border-border/80 backdrop-blur-xl shadow-xs gap-3 sm:gap-2">
        <label className="flex items-center gap-2.5 cursor-pointer select-none">
          <input
            type="checkbox"
            aria-label={t("selectAll")}
            checked={allVisibleSelected}
            onChange={() => toggleAllSelection(visibleIds)}
            className="h-4 w-4 rounded border-borderAccent text-primary focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 cursor-pointer"
          />
          <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
            <span>{t("selectAll")}</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 font-bold">
              {t("itemsCount", { count: selectedJobIds.length })}
            </span>
          </span>
        </label>

        {selectedJobIds.length > 0 && (
          <div className="flex flex-wrap gap-2 animate-in fade-in slide-in-from-right-4 duration-300">
            <Button
              type="button"
              size="default"
              onClick={startSelectedQueue}
              className="h-8 text-xs gap-1.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-md shadow-emerald-600/25 hover:shadow-lg hover:shadow-emerald-500/40 border-0 transition-all duration-200"
            >
              <Play
                className="h-3.5 w-3.5 text-white fill-white"
                aria-hidden="true"
              />
              {t("downloadSelected")}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="default"
              onClick={handleBulkEdit}
              className="h-8 text-xs gap-1.5 px-3 rounded-xl bg-card border-primary/30 text-primary font-semibold hover:bg-primary/10 shadow-2xs"
            >
              <Settings className="h-3.5 w-3.5" aria-hidden="true" />
              {t("bulkConfigureCount", { count: selectedJobIds.length })}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="default"
              onClick={handleRemoveSelected}
              className="h-8 text-xs gap-1.5 px-3 rounded-xl bg-card text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive shadow-2xs"
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
              {t("removeSelected")}
            </Button>
          </div>
        )}
      </div>

      {/* High-Visibility Card Item List */}
      <div className="flex flex-col gap-3 [content-visibility:auto]">
        {filteredJobs.length > 0 ? (
          filteredJobs.map((job) => (
            <DownloadJobRow
              key={job.id}
              job={job}
              onOpenErrorLogs={handleOpenError}
              onExpand={setExpandedJob}
            />
          ))
        ) : (
          <div className="p-8 text-center text-xs text-muted-foreground border border-dashed rounded-2xl border-border/70 bg-card/40">
            {t("noMatchingJobs")}
          </div>
        )}
      </div>

      {/* Error dialog */}
      <JobErrorDialog
        job={selectedErrorJob}
        open={errorDialogOpen}
        onOpenChange={setErrorDialogOpen}
      />

      {/* Aceternity Expandable Job Card Overlay */}
      <ExpandableJobCard
        job={expandedJob}
        onClose={() => setExpandedJob(null)}
        onOpenConfig={(job) => setActiveJobDrawerId(job.id)}
      />
    </div>
  );
}
