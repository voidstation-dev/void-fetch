/**
 * VoidFetch
 * Copyright (c) 2026 VoidStation.
 * All rights reserved.
 */

"use client";

import React, { useEffect, useState } from "react";
import { useBatchStore } from "@/features/batch-download/store/batch-store";
import { WorkspaceLayout } from "@/features/batch-download/components/WorkspaceLayout";
import { ExpandableJobCard } from "@/features/batch-download/components/ExpandableJobCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  History,
  Trash2,
  Loader2,
  Layers,
  Sparkles,
  Maximize2,
  ExternalLink,
  Video,
  Music,
  Image as ImageIcon,
  CheckCircle2,
  FileVideo,
} from "lucide-react";
import { toast } from "@/lib/deferred-toast";
import type { DownloadJob, OutputType } from "@/features/batch-download/types/batch-download";
import { getPlatformBadgeStyle } from "@/lib/platforms";
import { LoadingScreen } from "@/components/ui/LoadingScreen";

interface HistoryCardRowProps {
  job: DownloadJob;
  onExpand: (job: DownloadJob) => void;
  onRedownload: (job: DownloadJob, format?: OutputType) => void;
  onRemove: (id: string) => void;
}

function HistoryCardRow({
  job,
  onExpand,
  onRedownload,
  onRemove,
}: HistoryCardRowProps) {
  const completedDate = job.completedAt
    ? new Date(job.completedAt).toLocaleString()
    : "Recently";

  const rawData = (job.metadata?.rawParsedData || job.metadata) as Record<string, unknown> | undefined;
  const videoUrl = typeof rawData?.downloadVideoUrl === "string" ? rawData.downloadVideoUrl : typeof rawData?.originDownloadVideoUrl === "string" ? rawData.originDownloadVideoUrl : typeof rawData?.videoUrl === "string" ? rawData.videoUrl : undefined;
  const audioUrl = typeof rawData?.downloadAudioUrl === "string" ? rawData.downloadAudioUrl : typeof rawData?.originDownloadAudioUrl === "string" ? rawData.originDownloadAudioUrl : typeof rawData?.audioUrl === "string" ? rawData.audioUrl : undefined;
  const images = job.metadata?.images || (Array.isArray(rawData?.images) ? (rawData.images as string[]) : undefined);

  const isImageOnly =
    job.config.outputType === "images" ||
    job.config.outputType === "zip_images" ||
    (Boolean(images && images.length > 0) && !videoUrl && !audioUrl);

  return (
    <div className="group relative flex flex-col md:flex-row items-start md:items-center justify-between p-4 rounded-2xl bg-card/90 backdrop-blur-2xl border border-border/80 hover:border-primary/50 shadow-md hover:shadow-xl transition-all duration-300 gap-4">
      {/* Left: Thumbnail Cover & Title Info */}
      <div className="flex items-center gap-3.5 min-w-0 flex-1 w-full md:w-auto">
        {/* Media Thumbnail */}
        <div
          onClick={() => onExpand(job)}
          className="relative w-13 h-13 sm:w-14 sm:h-14 shrink-0 bg-muted rounded-xl border border-border/60 flex items-center justify-center overflow-hidden shadow-md cursor-pointer group/thumb hover:border-primary/80 transition-all duration-300"
        >
          {job.metadata?.cover ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={job.metadata.cover}
              alt=""
              className="w-full h-full object-cover group-hover/thumb:scale-110 transition-transform duration-300"
            />
          ) : (
            <FileVideo className="h-6 w-6 text-muted-foreground/60" />
          )}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/thumb:opacity-100 transition-opacity flex items-center justify-center">
            <Maximize2 className="h-4 w-4 text-white" />
          </div>
        </div>

        {/* Info Column */}
        <div className="flex flex-col min-w-0 gap-1 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge
              variant="outline"
              className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${getPlatformBadgeStyle(
                job.platform,
              )}`}
            >
              {job.platform || "generic"}
            </Badge>

            <span className="text-[10px] font-mono font-bold uppercase text-muted-foreground/80 bg-muted/40 px-1.5 py-0.5 rounded border border-border/40">
              {job.config.outputType === "audio"
                ? "AUDIO MP3"
                : job.config.outputType === "images"
                  ? "ZIP IMAGES"
                  : "MP4 VIDEO"}
            </span>

            <span className="text-[9px] font-mono text-muted-foreground/70">
              Completed: {completedDate}
            </span>
          </div>

          <h4
            onClick={() => onExpand(job)}
            className="text-sm font-bold text-foreground hover:text-primary transition-colors cursor-pointer line-clamp-1 leading-snug tracking-tight"
            title={job.metadata?.title || job.sourceUrl}
          >
            {job.metadata?.title || job.sourceUrl}
          </h4>

          <a
            href={job.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] text-muted-foreground/80 font-mono hover:text-primary transition-colors flex items-center gap-1 truncate max-w-sm"
          >
            <span className="truncate">{job.sourceUrl}</span>
            <ExternalLink className="h-3 w-3 shrink-0 opacity-60" />
          </a>
        </div>
      </div>

      {/* Right: Status Pill & Action Buttons */}
      <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 pt-3 md:pt-0 border-border/40 shrink-0">
        <Badge
          variant="outline"
          className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-500 border-emerald-500/30 flex items-center gap-1 shadow-2xs"
        >
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
          Completed
        </Badge>

        <div className="flex items-center gap-1.5">
          {/* Details / Preview Button */}
          <Button
            type="button"
            variant="outline"
            size="default"
            onClick={() => onExpand(job)}
            className="h-8 text-xs font-semibold gap-1 px-2.5 rounded-xl border-border/70 bg-card hover:bg-primary/10 hover:text-primary hover:border-primary/50 shadow-2xs transition-all"
            title="Open Details & Media Preview Modal"
          >
            <Maximize2 className="h-3.5 w-3.5 text-primary" />
            <span className="hidden sm:inline">Details</span>
          </Button>

          {/* Format Redownload Buttons */}
          {isImageOnly ? (
            <Button
              type="button"
              variant="outline"
              size="default"
              onClick={() => onRedownload(job, images && images.length > 1 ? "zip_images" : "images")}
              className="h-8 text-xs font-semibold gap-1 px-2.5 rounded-xl border-cyan-500/40 bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 shadow-2xs transition-all"
              title="Redownload Image Pack"
            >
              <ImageIcon className="h-3.5 w-3.5 text-cyan-400" />
              <span className="hidden sm:inline">
                {images && images.length > 1 ? "Tải lại ZIP (Ảnh)" : "Tải lại Ảnh"}
              </span>
            </Button>
          ) : (
            <>
              {/* Redownload MP4 */}
              <Button
                type="button"
                variant="outline"
                size="default"
                onClick={() => onRedownload(job, "mp4")}
                className="h-8 text-xs font-semibold gap-1 px-2.5 rounded-xl border-border/70 bg-card hover:bg-emerald-500/10 hover:text-emerald-500 hover:border-emerald-500/40 shadow-2xs transition-all"
                title="Redownload MP4 Video"
              >
                <Video className="h-3.5 w-3.5 text-emerald-500" />
                <span className="hidden sm:inline">Redownload MP4</span>
              </Button>

              {/* Redownload MP3 */}
              <Button
                type="button"
                variant="outline"
                size="default"
                onClick={() => onRedownload(job, "audio")}
                className="h-8 text-xs font-semibold gap-1 px-2.5 rounded-xl border-border/70 bg-card hover:bg-purple-500/10 hover:text-purple-400 hover:border-purple-500/40 shadow-2xs transition-all"
                title="Redownload MP3 Audio"
              >
                <Music className="h-3.5 w-3.5 text-purple-400" />
                <span className="hidden sm:inline">Redownload MP3</span>
              </Button>
            </>
          )}

          {/* Remove from History */}
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-8 w-8 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 border-border/70 shadow-2xs"
            onClick={() => onRemove(job.id)}
            title="Remove from history"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function HistoryPage() {
  const store = useBatchStore();
  const initializeStore = useBatchStore((s) => s.initializeStore);
  const [expandedJob, setExpandedJob] = useState<DownloadJob | null>(null);

  useEffect(() => {
    initializeStore();
  }, [initializeStore]);

  const completedJobs = store.jobs.filter((j) => j.status === "completed");

  const handleRedownload = async (
    job: DownloadJob,
    format?: OutputType,
  ) => {
    if (format) {
      await store.updateJobConfig(job.id, {
        outputType: format,
        extractAudio: format === "audio",
      });
    }
    await store.updateJobStatus(job.id, "queued");
    toast.success(`Queued ${job.metadata?.title || "item"} for redownload`);
  };

  const handleRemove = (id: string) => {
    store.removeJobs([id]);
    toast.success("Removed job record");
  };

  const handleClearAll = () => {
    store.clearCompleted();
    toast.success("Cleared all completed history");
  };

  return (
    <>
      {/* Header Bar */}
      <div className="flex items-center justify-between p-4 border rounded-xl bg-card border-border/80 shadow-2xs shrink-0">
        <div className="flex flex-col gap-0.5">
          <h1 className="text-sm font-bold text-foreground flex items-center gap-2">
            <History className="h-4 w-4 text-primary" />
            <span>Download History</span>
          </h1>
          <span className="text-[10px] text-muted-foreground uppercase tracking-wide">
            Logs of successfully completed jobs ({completedJobs.length} items)
          </span>
        </div>
        {completedJobs.length > 0 && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleClearAll}
            className="h-8 text-xs gap-1.5 text-destructive hover:bg-destructive/10 hover:text-destructive border-border/60 shadow-2xs transition-all"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Clear History
          </Button>
        )}
      </div>

      {/* History Items List or Glassmorphic Empty State */}
      {completedJobs.length === 0 ? (
        <div className="relative overflow-hidden rounded-3xl border-2 border-dashed border-primary/30 bg-card/85 backdrop-blur-2xl p-12 text-center shadow-2xl flex flex-col items-center justify-center gap-6 group hover:border-primary/60 transition-all duration-500 my-2">
          {/* Ambient Radial Spotlight Glow */}
          <div className="absolute inset-0 bg-radial-glow from-primary/10 via-transparent to-transparent pointer-events-none opacity-60 group-hover:opacity-100 transition-opacity duration-500" />

          {/* Animated Icon Badge */}
          <div className="relative p-5 rounded-2xl bg-gradient-to-br from-primary/20 via-primary/10 to-transparent border border-primary/30 text-primary shadow-xl group-hover:scale-110 group-hover:-translate-y-1 transition-all duration-300">
            <Layers className="h-10 w-10 text-primary animate-pulse" />
          </div>

          {/* Text Area */}
          <div className="flex flex-col items-center gap-2 max-w-md z-10">
            <h3 className="text-base font-extrabold text-foreground tracking-wide flex items-center gap-2">
              <span>No History Records Found</span>
              <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 font-bold uppercase">
                Clean
              </span>
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Completed downloads will automatically appear here with media
              details, instant redownload shortcuts, and download logs.
            </p>
          </div>

          {/* Micro Feature Badges */}
          <div className="flex flex-wrap items-center justify-center gap-2 z-10 pt-2">
            <span className="px-3 py-1 rounded-full bg-muted/30 border border-border/60 text-[10px] font-medium text-muted-foreground flex items-center gap-1.5 shadow-2xs">
              <Sparkles className="h-3 w-3 text-amber-400" /> Auto Persisted
            </span>
            <span className="px-3 py-1 rounded-full bg-muted/30 border border-border/60 text-[10px] font-medium text-muted-foreground flex items-center gap-1.5 shadow-2xs">
              <Sparkles className="h-3 w-3 text-cyan-400" /> Instant Redownloads
            </span>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3 mt-4">
          {completedJobs.map((job) => (
            <HistoryCardRow
              key={job.id}
              job={job}
              onExpand={(j) => setExpandedJob(j)}
              onRedownload={handleRedownload}
              onRemove={handleRemove}
            />
          ))}
        </div>
      )}

      {/* Expandable Detail Modal */}
      {expandedJob && (
        <ExpandableJobCard
          job={expandedJob}
          onClose={() => setExpandedJob(null)}
          onOpenConfig={(j) => store.setActiveJobDrawerId(j.id)}
        />
      )}
    </>
  );
}
