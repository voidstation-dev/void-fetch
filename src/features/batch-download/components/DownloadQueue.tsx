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
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Settings,
  Trash2,
  FolderOpen,
  Layers,
  AlertTriangle,
  Sparkles,
} from "lucide-react";
import type { DownloadJob } from "../types/batch-download";
import { downloadScheduler } from "../services/download-scheduler";
import { formatBytes } from "@/lib/utils";
import { ExpandableJobCard } from "./ExpandableJobCard";

export function DownloadQueue() {
  const jobs = useBatchStore((s) => s.jobs);
  const searchQuery = useBatchStore((s) => s.searchQuery);
  const statusFilter = useBatchStore((s) => s.statusFilter);
  const platformFilter = useBatchStore((s) => s.platformFilter);
  const selectedJobIds = useBatchStore((s) => s.selectedJobIds);
  const setActiveJobDrawerId = useBatchStore((s) => s.setActiveJobDrawerId);
  const removeJobs = useBatchStore((s) => s.removeJobs);
  const toggleAllSelection = useBatchStore((s) => s.toggleAllSelection);

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
    if (
      platformFilter !== "all" &&
      job.platform !== platformFilter
    ) {
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
      <div className="relative overflow-hidden rounded-3xl border-2 border-dashed border-primary/30 bg-card/85 backdrop-blur-2xl p-12 text-center shadow-2xl flex flex-col items-center justify-center gap-6 group hover:border-primary/60 transition-colors duration-200 my-2">
        {/* Ambient Radial Spotlight Glow */}
        <div className="absolute inset-0 bg-radial-glow from-primary/10 via-transparent to-transparent pointer-events-none opacity-60 group-hover:opacity-100 transition-opacity duration-500" />

        {/* Animated Icon Badge */}
        <div className="relative p-5 rounded-2xl bg-gradient-to-br from-primary/20 via-primary/10 to-transparent border border-primary/30 text-primary shadow-xl group-hover:scale-110 group-hover:-translate-y-1 transition-all duration-300">
          <Layers className="h-10 w-10 text-primary animate-pulse" />
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </span>
        </div>

        {/* Text Area */}
        <div className="flex flex-col items-center gap-2 max-w-md z-10">
          <h3 className="text-base font-extrabold text-foreground tracking-wide flex items-center gap-2">
            <span>Empty Downloader Workspace</span>
            <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 font-bold uppercase">
              Ready
            </span>
          </h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Paste video URLs (
            <span className="text-foreground font-medium">
              YouTube, TikTok, Douyin, SoundCloud...
            </span>
            ) or import a text file above to start batch downloading.
          </p>
        </div>

        {/* Feature Highlights Pills */}
        <div className="flex flex-wrap items-center justify-center gap-2 z-10 pt-2 border-t border-border/40">
          <span className="px-3 py-1 rounded-full bg-muted/30 border border-border/60 text-[10px] font-medium text-muted-foreground flex items-center gap-1.5 shadow-2xs">
            <Sparkles className="h-3 w-3 text-emerald-500" /> Multi-Threaded
            Engine
          </span>
          <span className="px-3 py-1 rounded-full bg-muted/30 border border-border/60 text-[10px] font-medium text-muted-foreground flex items-center gap-1.5 shadow-2xs">
            <Sparkles className="h-3 w-3 text-cyan-400" /> Audio Stream
            Extraction
          </span>
          <span className="px-3 py-1 rounded-full bg-muted/30 border border-border/60 text-[10px] font-medium text-muted-foreground flex items-center gap-1.5 shadow-2xs">
            <Sparkles className="h-3 w-3 text-purple-400" /> Up to 4K / 60FPS
            Video
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Bulk Operations Toolbar */}
      {selectedJobIds.length > 0 && (
        <div className="flex items-center justify-between p-3.5 border rounded-2xl bg-primary/10 border-primary/25 backdrop-blur-md animate-in fade-in duration-200 shadow-md">
          <span className="text-xs font-bold text-primary">
            {selectedJobIds.length} item
            {selectedJobIds.length > 1 ? "s" : ""} selected
          </span>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleBulkEdit}
              className="h-8 text-xs gap-1.5 px-3 rounded-xl bg-card border-primary/30 text-primary font-semibold hover:bg-primary/10"
            >
              <Settings className="h-3.5 w-3.5" />
              Bulk Configure
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleRemoveSelected}
              className="h-8 text-xs gap-1.5 px-3 rounded-xl bg-card text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Remove Selected
            </Button>
          </div>
        </div>
      )}

      {/* Select All & List Header Bar */}
      <div className="flex items-center justify-between p-3.5 border rounded-2xl bg-card/80 border-border/80 backdrop-blur-xl shadow-xs">
        <div className="flex items-center gap-2.5">
          <input
            type="checkbox"
            checked={allVisibleSelected}
            onChange={() => toggleAllSelection(visibleIds)}
            className="h-4 w-4 rounded border-borderAccent text-primary focus:ring-0 cursor-pointer"
          />
          <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
            <span>Select All Queue Items</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 font-bold">
              {filteredJobs.length} Items
            </span>
          </span>
        </div>

        {selectedJobIds.length > 0 && (
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="default"
              onClick={handleBulkEdit}
              className="h-7 text-xs gap-1.5 px-3 rounded-xl bg-card border-primary/30 text-primary font-semibold hover:bg-primary/10 shadow-2xs"
            >
              <Settings className="h-3.5 w-3.5" />
              Bulk Configure ({selectedJobIds.length})
            </Button>
            <Button
              type="button"
              variant="outline"
              size="default"
              onClick={handleRemoveSelected}
              className="h-7 text-xs gap-1.5 px-3 rounded-xl bg-card text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive shadow-2xs"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Remove Selected
            </Button>
          </div>
        )}
      </div>

      {/* High-Visibility Card Item List */}
      <div className="flex flex-col gap-3">
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
            No jobs match the active search or filters.
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
