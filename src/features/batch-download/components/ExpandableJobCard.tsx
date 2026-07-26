/**
 * VoidFetch - Aceternity UI Inspired Expandable Card Component
 * Copyright (c) 2026 VoidStation.
 */

"use client";

import React from "react";
import { DownloadJob } from "../types/batch-download";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  X,
  Download,
  Music,
  Video,
  ExternalLink,
  Clock,
  Copy,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Image as ImageIcon,
  Volume2,
} from "lucide-react";
import { cn, downloadFile } from "@/lib/utils";
import { toast } from "@/lib/deferred-toast";
import { buildMediaPreviewUrl } from "@/components/downloader/media-preview";

import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

import { formatDuration, probeMediaDuration } from "../utils/duration-helper";
import { useBatchStore } from "../store/batch-store";

interface ExpandableJobCardProps {
  job: DownloadJob | null;
  onClose: () => void;
  onOpenConfig?: (job: DownloadJob) => void;
}

export function ExpandableJobCard({
  job,
  onClose,
  onOpenConfig,
}: ExpandableJobCardProps) {
  const store = useBatchStore();
  const [isClosing, setIsClosing] = React.useState(false);

  const handleClose = React.useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
    }, 150);
  }, [onClose]);

  const title = job?.metadata?.title || job?.sourceUrl || "";
  const coverUrl = job?.metadata?.cover;
  const rawData = (job?.metadata?.rawParsedData || job?.metadata) as
    | Record<string, unknown>
    | undefined;
  const videoUrl =
    typeof rawData?.downloadVideoUrl === "string"
      ? rawData.downloadVideoUrl
      : typeof rawData?.originDownloadVideoUrl === "string"
        ? rawData.originDownloadVideoUrl
        : typeof rawData?.videoUrl === "string"
          ? rawData.videoUrl
          : undefined;
  const audioUrl =
    typeof rawData?.downloadAudioUrl === "string"
      ? rawData.downloadAudioUrl
      : typeof rawData?.originDownloadAudioUrl === "string"
        ? rawData.originDownloadAudioUrl
        : typeof rawData?.audioUrl === "string"
          ? rawData.audioUrl
          : undefined;
  const images =
    job?.metadata?.images ||
    (Array.isArray(rawData?.images) ? (rawData.images as string[]) : undefined);

  const hasAudioTrack = Boolean(
    typeof audioUrl === "string" &&
    audioUrl.length > 5 &&
    (audioUrl.startsWith("http") || audioUrl.startsWith("/")),
  );

  const isImagePost = Boolean(
    job &&
    (job.config.outputType === "images" ||
      job.config.outputType === "zip_images" ||
      (Boolean(images && images.length > 0) && !videoUrl && !audioUrl)),
  );

  // Background media duration probe if initial API response lacked duration
  React.useEffect(() => {
    if (!job || job.metadata?.duration) return;
    const targetUrl = videoUrl || audioUrl;
    if (!targetUrl) return;

    let isMounted = true;
    probeMediaDuration(targetUrl, Boolean(videoUrl)).then((probed) => {
      if (isMounted && probed && probed > 0) {
        store.updateJobStatus(job.id, job.status, {
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
  }, [job, videoUrl, audioUrl, store]);

  if (!job) return null;

  const handleCopyLink = (url?: string | null) => {
    if (!url) return;
    navigator.clipboard.writeText(url);
    toast.success("Copied direct link to clipboard");
  };

  const handleDownload = (url: string | null | undefined, filename: string) => {
    if (!url) {
      toast.error("No download link available for this item");
      return;
    }
    // Safely open in a new tab to avoid replacing current workspace page
    window.open(url, "_blank", "noopener,noreferrer");
    downloadFile(url, filename, true);
    toast.success(
      `Opening download in a new tab for ${job?.platform?.toUpperCase()}`,
    );
  };

  return (
    <Dialog open={Boolean(job)} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent
        showCloseButton={false}
        className="sm:max-w-2xl p-0 overflow-hidden bg-card border-border/80 rounded-2xl shadow-2xl backdrop-blur-xl max-h-[90vh] flex flex-col border"
      >
        <DialogTitle className="sr-only">{title}</DialogTitle>
        <DialogDescription className="sr-only">
          {job.platform} media preview and downloads
        </DialogDescription>
        {/* Glow Ambient Line Top */}
        <div className="absolute -top-px inset-x-12 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent z-20" />

        {/* Hero Cover / Media Header */}
        <div className="relative w-full h-56 md:h-64 bg-slate-950 flex items-center justify-center overflow-hidden shrink-0">
          {coverUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={coverUrl}
              alt={title}
              className="w-full h-full object-cover opacity-90 transition-transform duration-700 hover:scale-105"
            />
          ) : (
            <div className="flex flex-col items-center gap-2 text-muted-foreground/60">
              {isImagePost ? (
                <ImageIcon className="h-12 w-12 stroke-[1.5] text-cyan-400" />
              ) : (
                <Video className="h-12 w-12 stroke-[1.5]" />
              )}
              <span className="text-xs uppercase tracking-wider">
                No Preview Available
              </span>
            </div>
          )}

          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-card via-card/30 to-transparent" />

          {/* Top Floating Badge Bar */}
          <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-10">
            <Badge className="bg-background/90 backdrop-blur-md border border-border/60 text-foreground text-[10px] px-2.5 py-1 uppercase tracking-wider font-mono">
              {job.platform}
            </Badge>

            <Button
              variant="secondary"
              size="icon"
              onClick={handleClose}
              className="h-8 w-8 rounded-full bg-background/80 backdrop-blur-md border border-border/60 text-muted-foreground hover:text-foreground shadow-md"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Bottom Title Overlay */}
          <div className="absolute bottom-3 left-4 right-4 z-10 flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5 text-amber-400" />
              <span className="text-[10px] font-semibold text-amber-400 uppercase tracking-widest">
                Expanded Media Item
              </span>
            </div>
            <h3 className="text-base md:text-lg font-bold text-white drop-shadow-md line-clamp-2 leading-tight">
              {title}
            </h3>
          </div>
        </div>

        {/* Card Details Body */}
        <div className="p-5 flex flex-col gap-4 overflow-y-auto">
          {/* Status & Metadata Badges Row */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {isImagePost ? (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 font-medium">
                <ImageIcon className="h-3.5 w-3.5 text-cyan-400" />
                <span>
                  {images?.length || 1}{" "}
                  {images && images.length > 1 ? "Images" : "Image"}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-muted/60 border border-border/40 text-foreground font-medium">
                <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                <span>
                  {formatDuration(job.metadata?.duration) ||
                    (videoUrl ? "HD Video Stream" : "Audio Stream")}
                </span>
              </div>
            )}

            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-muted/60 border border-border/40 text-foreground font-medium">
              <Badge
                variant="outline"
                className={`text-[9px] uppercase ${
                  isImagePost
                    ? "bg-cyan-500/15 text-cyan-400 border-cyan-500/30 font-bold"
                    : job.config.outputType === "audio"
                      ? "bg-purple-500/15 text-purple-400 border-purple-500/30 font-bold"
                      : "bg-primary/15 text-primary border-primary/30 font-bold"
                }`}
              >
                {isImagePost
                  ? images && images.length > 1
                    ? "ZIP IMAGES"
                    : "HD IMAGE"
                  : job.config.outputType === "audio"
                    ? "AUDIO MP3"
                    : "MP4 VIDEO"}
              </Badge>
              <span>{job.config.quality || "1080p"}</span>
            </div>

            <div className="ml-auto flex items-center gap-1.5">
              {job.status === "completed" && (
                <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  <CheckCircle2 className="h-3 w-3" /> Ready
                </span>
              )}
              {job.status === "failed" && (
                <span className="flex items-center gap-1 text-[11px] font-semibold text-destructive bg-destructive/10 px-2 py-0.5 rounded-full border border-destructive/20">
                  <AlertCircle className="h-3 w-3" /> Failed
                </span>
              )}
            </div>
          </div>

          {/* Glassmorphic Audio Preview Player (Only rendered when valid audio track exists) */}
          {hasAudioTrack && (
            <div className="flex flex-col gap-2 p-3 rounded-xl bg-muted/40 border border-border/60">
              <div className="flex items-center justify-between text-xs font-semibold text-foreground/90">
                <div className="flex items-center gap-1.5">
                  <Volume2 className="h-4 w-4 text-emerald-500 animate-pulse shrink-0" />
                  <span>Phát nghe thử Âm thanh (Audio Stream Preview)</span>
                </div>
                <span className="text-[10px] text-muted-foreground font-mono">
                  Live Stream
                </span>
              </div>

              <audio
                key={audioUrl}
                src={audioUrl}
                controls
                preload="none"
                className="w-full h-8 rounded-lg"
              />
            </div>
          )}

          {/* Source Link Bar */}
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-muted/40 border border-border/60 gap-2">
            <span className="text-xs font-mono text-muted-foreground truncate flex-1">
              {job.sourceUrl}
            </span>
            <div className="flex items-center gap-1 shrink-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleCopyLink(job.sourceUrl)}
                className="h-7 text-[10px] gap-1 px-2"
              >
                <Copy className="h-3 w-3" /> Copy
              </Button>
              <a href={job.sourceUrl} target="_blank" rel="noopener noreferrer">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-[10px] gap-1 px-2"
                >
                  <ExternalLink className="h-3 w-3" /> Visit
                </Button>
              </a>
            </div>
          </div>

          {/* Quick Download Actions Grid */}
          <div className="flex flex-col gap-2 pt-2 border-t border-border/40">
            <span className="text-[11px] font-bold text-foreground/80 uppercase tracking-wider flex items-center gap-1.5">
              <Download className="h-3.5 w-3.5 text-primary" />
              Thao tác tải nhanh (Quick Downloads)
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
              {videoUrl && (
                <Button
                  onClick={() => handleDownload(videoUrl, `${title}.mp4`)}
                  className="h-10 text-xs font-semibold gap-2 bg-primary text-primary-foreground hover:bg-primary/90 shadow-md"
                >
                  <Video className="h-4 w-4" /> Tải Video (MP4)
                </Button>
              )}

              {audioUrl && (
                <Button
                  variant="outline"
                  onClick={() => handleDownload(audioUrl, `${title}.mp3`)}
                  className="h-10 text-xs font-semibold gap-2 border-border/80 hover:bg-muted/60"
                >
                  <Music className="h-4 w-4 text-emerald-500" /> Tách Nhạc (MP3)
                </Button>
              )}

              {coverUrl && (
                <Button
                  variant="outline"
                  onClick={() => handleDownload(coverUrl, `${title}-cover.jpg`)}
                  className="h-10 text-xs font-semibold gap-2 border-border/80 hover:bg-muted/60"
                >
                  <ImageIcon className="h-4 w-4 text-amber-500" /> Tải Ảnh (HD
                  Image / Cover)
                </Button>
              )}
            </div>

            {images && images.length > 0 && (
              <div className="flex flex-col gap-2 pt-2">
                <span className="text-[11px] font-bold text-foreground/80 uppercase tracking-wider flex items-center gap-1.5">
                  <ImageIcon className="h-3.5 w-3.5 text-cyan-400" />
                  Danh sách ảnh trích xuất ({images.length} Ảnh)
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {images.map((imgUrl, idx) => (
                    <div
                      key={idx}
                      className="group relative rounded-lg overflow-hidden border border-border/60 bg-muted/40 aspect-square"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={imgUrl}
                        alt={`Image ${idx + 1}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                      <Button
                        size="default"
                        variant="secondary"
                        onClick={() =>
                          handleDownload(
                            imgUrl,
                            `${title}-image-${idx + 1}.jpg`,
                          )
                        }
                        className="absolute bottom-1 right-1 h-6 text-[9px] px-1.5 bg-background/90 backdrop-blur-md opacity-90 group-hover:opacity-100"
                      >
                        Tải #{idx + 1}
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!videoUrl &&
              !audioUrl &&
              !coverUrl &&
              (!images || images.length === 0) && (
                <p className="text-[10px] text-muted-foreground bg-muted/30 p-2 rounded-lg border border-border/40">
                  💡 Nút tải MP4 / MP3 / Ảnh sẽ xuất hiện đầy đủ tại đây sau khi
                  hệ thống hoàn tất phân tích link (Parse Link).
                </p>
              )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between p-4 bg-muted/20 border-t border-border/60">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              handleClose();
              onOpenConfig?.(job);
            }}
            className="h-8 text-xs gap-1.5"
          >
            Configure Stream Options
          </Button>

          <Button
            size="sm"
            onClick={handleClose}
            className="h-8 px-4 text-xs font-medium"
          >
            Close Preview
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
