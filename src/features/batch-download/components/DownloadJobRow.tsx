/**
 * VoidFetch - High-Visibility Glassmorphic Job Card Item
 * Copyright (c) 2026 VoidStation.
 * All rights reserved.
 */

import React from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Play,
  Trash2,
  Settings,
  AlertCircle,
  CheckCircle2,
  FileVideo,
  Loader2,
  XSquare,
  Maximize2,
  ExternalLink,
  Video,
  Music,
  Image as ImageIcon,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import type { DownloadJob, OutputType } from "../types/batch-download";
import { useBatchStore } from "../store/batch-store";
import { parseJobs, cancelParseJob } from "../services/parse-worker-pool";
import { downloadScheduler } from "../services/download-scheduler";
import { formatBytes, formatSpeed, formatEta } from "@/lib/utils";
import { probeMediaDuration } from "../utils/duration-helper";
import { getPlatformBadgeStyle } from "@/lib/platforms";
import { motion } from "framer-motion";

interface DownloadJobRowProps {
  job: DownloadJob;
  onOpenErrorLogs: (job: DownloadJob) => void;
  onExpand?: (job: DownloadJob) => void;
}

export function DownloadJobRowComponent({
  job,
  onOpenErrorLogs,
  onExpand,
}: DownloadJobRowProps) {
  const isSelected = useBatchStore((s) => s.selectedJobIds.includes(job.id));
  const toggleJobSelection = useBatchStore((s) => s.toggleJobSelection);
  const updateJobStatus = useBatchStore((s) => s.updateJobStatus);
  const updateJobConfig = useBatchStore((s) => s.updateJobConfig);
  const isQueueRunning = useBatchStore((s) => s.isQueueRunning);
  const startQueue = useBatchStore((s) => s.startQueue);
  const removeJobs = useBatchStore((s) => s.removeJobs);
  const setActiveJobDrawerId = useBatchStore((s) => s.setActiveJobDrawerId);
  const retryJob = useBatchStore((s) => s.retryJob);

  const handleParse = () => {
    parseJobs([job.id]);
  };

  const handleCancelParse = () => {
    cancelParseJob(job.id);
  };

  const handleStart = async () => {
    await updateJobStatus(job.id, "queued");
    if (!isQueueRunning) {
      await startQueue();
    } else {
      downloadScheduler.schedule();
    }
  };

  const { rawData, videoUrl, audioUrl, images, isImageOnly } = React.useMemo(() => {
    const raw = (job.metadata?.rawParsedData || job.metadata) as Record<string, unknown> | undefined;
    const vUrl =
      typeof raw?.downloadVideoUrl === "string"
        ? raw.downloadVideoUrl
        : typeof raw?.originDownloadVideoUrl === "string"
          ? raw.originDownloadVideoUrl
          : typeof raw?.videoUrl === "string"
            ? raw.videoUrl
            : undefined;
    const aUrl =
      typeof raw?.downloadAudioUrl === "string"
        ? raw.downloadAudioUrl
        : typeof raw?.originDownloadAudioUrl === "string"
          ? raw.originDownloadAudioUrl
          : typeof raw?.audioUrl === "string"
            ? raw.audioUrl
            : undefined;
    const imgs =
      job.metadata?.images ||
      (Array.isArray(raw?.images) ? (raw.images as string[]) : undefined);
    const imgOnly =
      job.config.outputType === "images" ||
      job.config.outputType === "zip_images" ||
      (Boolean(imgs && imgs.length > 0) && !vUrl && !aUrl);

    return {
      rawData: raw,
      videoUrl: vUrl,
      audioUrl: aUrl,
      images: imgs,
      isImageOnly: imgOnly,
    };
  }, [job.metadata, job.config.outputType]);

  // Background media duration probe if initial API response lacked duration
  React.useEffect(() => {
    if (job.status !== "ready" && job.status !== "completed") return;
    if (job.metadata?.duration) return;
    const targetUrl = videoUrl || audioUrl;
    if (!targetUrl) return;

    let isMounted = true;
    probeMediaDuration(targetUrl, Boolean(videoUrl)).then((probed) => {
      if (isMounted && probed && probed > 0) {
        updateJobStatus(job.id, job.status, {
          metadata: {
            ...job.metadata,
            title: job.metadata?.title || job.sourceUrl,
            cover: job.metadata?.cover || null,
            platform: job.platform || "generic",
            duration: probed,
          },
        });
      }
    });
    return () => {
      isMounted = false;
    };
  }, [
    job.id,
    job.status,
    job.metadata,
    job.metadata?.duration,
    job.platform,
    job.sourceUrl,
    videoUrl,
    audioUrl,
    updateJobStatus,
  ]);

  const handleDownloadWithFormat = async (format: OutputType) => {
    await updateJobConfig(job.id, {
      outputType: format,
      extractAudio: format === "audio",
    });
    await updateJobStatus(job.id, "queued");
    if (!isQueueRunning) {
      await startQueue();
    } else {
      downloadScheduler.schedule();
    }
  };

  const handlePause = () => {
    downloadScheduler.pauseJob(job.id);
  };

  const handleCancel = () => {
    downloadScheduler.cancelJob(job.id);
  };

  const handleRemove = () => {
    removeJobs([job.id]);
  };

  const handleEditConfig = () => {
    setActiveJobDrawerId(job.id);
  };

  // Render Status Badge & Controls
  const renderStatusBadge = () => {
    switch (job.status) {
      case "draft":
        return (
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-muted/40 text-muted-foreground border-border/60"
            >
              Draft
            </Badge>
            <Button
              variant="outline"
              size="default"
              onClick={handleParse}
              className="h-6 text-[10px] px-2 rounded-lg font-semibold border-primary/30 text-primary hover:bg-primary/10"
            >
              Parse Now
            </Button>
          </div>
        );
      case "parsing":
        return (
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-primary/15 text-primary border-primary/30 animate-pulse flex items-center gap-1"
            >
              <Loader2 className="h-3 w-3 animate-spin text-primary" />
              Parsing URL...
            </Badge>
          </div>
        );
      case "ready":
        return (
          <Badge
            variant="outline"
            className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-500 border-emerald-500/30 flex items-center gap-1"
          >
            <Sparkles className="h-3 w-3 text-emerald-500" />
            Ready to Download
          </Badge>
        );
      case "paused":
        return (
          <Badge
            variant="outline"
            className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-500 border-amber-500/30"
          >
            Paused
          </Badge>
        );
      case "queued":
        return (
          <Badge
            variant="outline"
            className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-cyan-500/15 text-cyan-400 border-cyan-500/30 animate-pulse flex items-center gap-1"
          >
            <Loader2 className="h-3 w-3 animate-spin text-cyan-400" />
            Queued
          </Badge>
        );
      case "resolving":
        return (
          <Badge
            variant="outline"
            className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-primary/15 text-primary border-primary/30 animate-pulse flex items-center gap-1"
          >
            <Loader2 className="h-3 w-3 animate-spin text-primary" />
            Resolving Stream...
          </Badge>
        );
      case "downloading":
        return (
          <div className="flex flex-col gap-1 w-full min-w-[160px] max-w-[220px]">
            <div className="flex items-center justify-between text-[10px] font-bold text-foreground">
              <span className="text-primary font-mono">
                {job.progress.percent}%
              </span>
              <span className="text-emerald-500 font-mono">
                {formatSpeed(job.progress.speedBytesPerSecond)}
              </span>
            </div>
            <Progress
              value={job.progress.percent}
              className="h-1.5 bg-muted/80 rounded-full"
            />
            <div className="flex items-center justify-between text-[9px] text-muted-foreground font-mono">
              <span>
                {formatBytes(job.progress.downloadedBytes)}
                {job.progress.totalBytes
                  ? ` / ${formatBytes(job.progress.totalBytes)}`
                  : ""}
              </span>
              {job.progress.etaSeconds ? (
                <span>ETA: {formatEta(job.progress.etaSeconds)}</span>
              ) : null}
            </div>
          </div>
        );
      case "processing":
        return (
          <Badge
            variant="outline"
            className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-purple-500/15 text-purple-400 border-purple-500/30 animate-pulse flex items-center gap-1"
          >
            <Loader2 className="h-3 w-3 animate-spin text-purple-400" />
            FFmpeg Processing...
          </Badge>
        );
      case "saving":
        return (
          <Badge
            variant="outline"
            className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-primary/15 text-primary border-primary/30 animate-pulse flex items-center gap-1"
          >
            <Loader2 className="h-3 w-3 animate-spin text-primary" />
            Saving to Disk...
          </Badge>
        );
      case "completed":
        return (
          <Badge
            variant="outline"
            className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-500 border-emerald-500/30 flex items-center gap-1 shadow-2xs"
          >
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
            Completed
          </Badge>
        );
      case "failed":
        return (
          <Badge
            variant="outline"
            className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/40 flex items-center gap-1.5 shadow-2xs"
          >
            <AlertCircle className="h-3.5 w-3.5 text-rose-500 shrink-0" />
            Failed
          </Badge>
        );
      case "cancelled":
        return (
          <Badge
            variant="outline"
            className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-muted/40 text-muted-foreground border-border/60"
          >
            Cancelled
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <motion.div
      className={`group relative flex flex-col md:flex-row items-start md:items-center justify-between p-4 rounded-2xl backdrop-blur-2xl border shadow-md hover:shadow-xl transition-all duration-300 gap-4 ${
        job.status === "failed"
          ? "bg-rose-500/5 dark:bg-rose-500/10 border-rose-500/30 hover:border-rose-500/50"
          : "bg-card/90 border-border/80 hover:border-primary/50"
      } ${
        isSelected
          ? "bg-primary/5 border-primary/40 ring-1 ring-primary/30"
          : ""
      }`}
    >
      {/* Left: Checkbox, Thumbnail Cover & Metadata Title */}
      <div className="flex items-center gap-3.5 min-w-0 flex-1 w-full md:w-auto">
        {/* Selection Checkbox */}
        <input
          type="checkbox"
          aria-label={`Select job ${job.metadata?.title || job.sourceUrl}`}
          checked={isSelected}
          onChange={() => toggleJobSelection(job.id)}
          disabled={[
            "parsing",
            "downloading",
            "resolving",
            "saving",
            "processing",
          ].includes(job.status)}
          className="h-4 w-4 rounded border-borderAccent text-primary focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 cursor-pointer disabled:opacity-50 shrink-0"
        />

        {/* Media Cover Thumbnail */}
        <motion.div
          role="button"
          tabIndex={0}
          aria-label={`View details for ${job.metadata?.title || job.sourceUrl}`}
          onClick={() => onExpand?.(job)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onExpand?.(job);
            }
          }}
          className="relative w-13 h-13 sm:w-14 sm:h-14 shrink-0 bg-muted rounded-xl border border-border/60 flex items-center justify-center overflow-hidden shadow-md cursor-pointer group/thumb hover:border-primary/80 transition-all duration-300"
        >
          {job.metadata?.cover ? (
            <Image
              src={job.metadata.cover}
              alt=""
              width={56}
              height={56}
              unoptimized
              className="w-full h-full object-cover group-hover/thumb:scale-110 transition-transform duration-300"
            />
          ) : isImageOnly ? (
            <ImageIcon className="h-6 w-6 text-primary/60" aria-hidden="true" />
          ) : (
            <FileVideo className="h-6 w-6 text-muted-foreground/60" aria-hidden="true" />
          )}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/thumb:opacity-100 transition-opacity flex items-center justify-center">
            <Maximize2 className="h-4 w-4 text-white" aria-hidden="true" />
          </div>
        </motion.div>

        {/* Info Column */}
        <div className="flex flex-col min-w-0 gap-1 flex-1">
          {/* Title & Platform Tag */}
          <motion.div
            className="flex items-center gap-2 flex-wrap"
          >
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
                ? "AUDIO"
                : job.config.outputType === "images"
                  ? "IMAGE"
                  : job.config.outputType === "zip_images" || isImageOnly
                    ? "IMAGES ZIP"
                    : "MP4 VIDEO"}
            </span>
          </motion.div>

          <motion.h4
            role="button"
            tabIndex={0}
            onClick={() => onExpand?.(job)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onExpand?.(job);
              }
            }}
            className="text-sm font-bold text-foreground hover:text-primary transition-colors cursor-pointer line-clamp-1 leading-snug tracking-tight"
            title={job.metadata?.title || job.sourceUrl}
          >
            {job.metadata?.title || job.sourceUrl}
          </motion.h4>

          {/* URL Subtitle */}
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

      {/* Right: Status & Action Control Group */}
      <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 pt-3 md:pt-0 border-border/40 shrink-0">
        {/* Status Badge / Download Progress */}
        <div className="flex items-center gap-2">{renderStatusBadge()}</div>

        {/* Action Button Cluster */}
        <div className="flex items-center gap-1.5">
          {/* Details / Preview Card Button */}
          <Button
            type="button"
            variant="outline"
            size="default"
            onClick={() => onExpand?.(job)}
            className="h-8 text-xs font-semibold gap-1 px-2.5 rounded-xl border-border/70 bg-card hover:bg-primary/10 hover:text-primary hover:border-primary/50 shadow-2xs transition-all"
            title="Open Details & Media Preview Modal"
            aria-label="Open Details & Media Preview Modal"
          >
            <Maximize2 className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
            <span className="hidden sm:inline">Details</span>
          </Button>

          {/* Format Download Shortcuts for Ready or Completed Jobs */}
          {(job.status === "ready" || job.status === "completed") &&
            (isImageOnly ? (
              <Button
                type="button"
                variant="outline"
                size="default"
                onClick={() =>
                  handleDownloadWithFormat(
                    images && images.length > 1 ? "zip_images" : "images",
                  )
                }
                className="h-8 text-xs font-semibold gap-1 px-2.5 rounded-xl border-cyan-500/40 bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 shadow-2xs transition-all"
                title="Download / Redownload Image Pack"
                aria-label="Download / Redownload Image Pack"
              >
                <ImageIcon className="h-3.5 w-3.5 text-cyan-400" aria-hidden="true" />
                <span className="hidden sm:inline">
                  {images && images.length > 1 ? "ZIP (Images)" : "IMAGE"}
                </span>
              </Button>
            ) : (
              <>
                <Button
                  type="button"
                  variant="outline"
                  size="default"
                  onClick={() => handleDownloadWithFormat("mp4")}
                  className="h-8 text-xs font-semibold gap-1 px-2.5 rounded-xl border-border/70 bg-card hover:bg-emerald-500/10 hover:text-emerald-500 hover:border-emerald-500/40 shadow-2xs transition-all"
                  title="Download / Redownload MP4 Video"
                  aria-label="Download / Redownload MP4 Video"
                >
                  <Video className="h-3.5 w-3.5 text-emerald-500" aria-hidden="true" />
                  <span className="hidden sm:inline">MP4</span>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="default"
                  onClick={() => handleDownloadWithFormat("audio")}
                  className="h-8 text-xs font-semibold gap-1 px-2.5 rounded-xl border-border/70 bg-card hover:bg-purple-500/10 hover:text-purple-400 hover:border-purple-500/40 shadow-2xs transition-all"
                  title="Extract / Redownload MP3 Audio"
                  aria-label="Extract / Redownload MP3 Audio"
                >
                  <Music className="h-3.5 w-3.5 text-purple-400" aria-hidden="true" />
                  <span className="hidden sm:inline">MP3</span>
                </Button>
              </>
            ))}

          {/* Retry / Start / Logs Shortcuts */}
          {job.status === "failed" && (
            <>
              <Button
                type="button"
                variant="outline"
                size="default"
                onClick={() => onOpenErrorLogs(job)}
                className="h-8 text-xs font-bold gap-1 px-3 rounded-xl bg-amber-500/10 border-amber-500/40 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 shadow-2xs transition-all cursor-pointer"
                title="View Diagnostic Failure Logs"
              >
                <AlertCircle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                <span>Error Logs</span>
              </Button>
              <Button
                type="button"
                variant="outline"
                size="default"
                onClick={() => retryJob(job.id)}
                className="h-8 text-xs font-bold gap-1 px-3 rounded-xl bg-primary/10 border-primary/40 text-primary hover:bg-primary/20 shadow-2xs transition-all cursor-pointer"
                title="Retry Parse & Download"
              >
                <RotateCcw className="h-3.5 w-3.5 shrink-0" />
                <span>Retry</span>
              </Button>
            </>
          )}

          {/* Retry Button for Failed/Cancelled */}
          {(job.status === "failed" || job.status === "cancelled") && (
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-xl text-amber-500 hover:text-amber-400 border-amber-500/30 hover:bg-amber-500/10 shadow-2xs"
              onClick={() => retryJob(job.id)}
              title={job.status === "cancelled" ? "Re-install" : "Retry"}
              aria-label="Retry job"
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
            </Button>
          )}

          {/* Config Settings Button */}
          {["ready", "paused", "failed", "cancelled", "completed"].includes(
            job.status,
          ) && (
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-xl text-muted-foreground hover:text-foreground border-border/70 shadow-2xs"
              onClick={handleEditConfig}
              title="Edit Job Configuration"
              aria-label="Edit Job Configuration"
            >
              <Settings className="h-3.5 w-3.5" aria-hidden="true" />
            </Button>
          )}

          {/* Delete Button */}
          {[
            "parsing",
            "downloading",
            "resolving",
            "saving",
            "processing",
          ].includes(job.status) ? (
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-xl text-destructive border-destructive/30 hover:bg-destructive/10"
              onClick={
                job.status === "parsing" ? handleCancelParse : handleCancel
              }
              title="Cancel"
              aria-label="Cancel active job"
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
            </Button>
          ) : (
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 border-border/70 shadow-2xs"
              onClick={handleRemove}
              title="Remove Job"
              aria-label="Remove job from queue"
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export const DownloadJobRow = React.memo(DownloadJobRowComponent);
