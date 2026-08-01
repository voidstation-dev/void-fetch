/**
 * VoidFetch
 * Copyright (c) 2026 VoidStation.
 * All rights reserved.
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  X,
  Settings,
  CheckSquare,
  Video,
  Music,
  Image as ImageIcon,
  FileCode,
  Sparkles,
  Sliders,
  FolderArchive,
  Info,
} from "lucide-react";
import { useBatchStore } from "../store/batch-store";
import type { OutputType } from "../types/batch-download";
import { toast } from "@/lib/deferred-toast";
import { HlsVideoPlayer } from "@/features/hls/components/hls-video-player";
import { buildMediaPreviewUrl } from "@/components/downloader/media-preview";
import {
  buildHlsPlayProxyUrl,
  isHlsPlaylistUrl,
  HLS_PLAYLIST_ACCEPT,
} from "@/lib/hls-playback";

type ParsedDataRecord = Record<string, unknown> & {
  downloadAudioUrl?: string | null;
  downloadVideoUrl?: string | null;
  originDownloadAudioUrl?: string | null;
  originDownloadVideoUrl?: string | null;
  mediaActions?: {
    video?: string;
    audio?: string;
  };
};

// Insert token helper
const insertToken = (
  token: string,
  current: string,
  setter: (val: string) => void,
) => {
  setter(current ? `${current} ${token}` : token);
};

import { useTranslations } from "next-intl";

export function JobConfigDrawer() {
  const t = useTranslations("batchWorkspace.configDrawer");
  const store = useBatchStore();
  const rawActiveJobId = store.activeJobDrawerId;
  const [lastActiveJobId, setLastActiveJobId] = useState<string | null>(null);

  if (rawActiveJobId && rawActiveJobId !== lastActiveJobId) {
    setLastActiveJobId(rawActiveJobId);
  }

  const activeJobId = rawActiveJobId || lastActiveJobId;
  const isBulk = activeJobId === "bulk";

  const activeJob = store.jobs.find((j) => j.id === activeJobId);

  // Form states
  const [outputType, setOutputType] = useState<OutputType>("mp4");
  const [quality, setQuality] = useState("1080p");
  const [filename, setFilename] = useState("");
  const [downloadThumbnail, setDownloadThumbnail] = useState(true);
  const [saveMetadata, setSaveMetadata] = useState(false);
  const [extractAudio, setExtractAudio] = useState(false);
  const [segmentConcurrency, setSegmentConcurrency] = useState("auto");

  // State synchronization on selection change
  const [prevActiveJobId, setPrevActiveJobId] = useState<string | null>(null);

  if (activeJobId !== prevActiveJobId) {
    setPrevActiveJobId(activeJobId);
    if (isBulk) {
      setOutputType("mp4");
      setQuality("1080p");
      setFilename("{index} - {title}");
      setDownloadThumbnail(true);
      setSaveMetadata(false);
      setExtractAudio(false);
      setSegmentConcurrency("auto");
    } else if (activeJob) {
      const config = activeJob.config;
      setOutputType(config.outputType);
      setQuality(config.quality);
      setFilename(config.filename || (activeJob.metadata?.title ?? ""));
      setDownloadThumbnail(config.downloadThumbnail);
      setSaveMetadata(config.saveMetadata);
      setExtractAudio(config.extractAudio);
      setSegmentConcurrency(
        config.segmentConcurrency ? String(config.segmentConcurrency) : "auto",
      );
    }
  }

  const handleCloseDrawer = () => {
    store.setActiveJobDrawerId(null);
  };

  const rawData = activeJob?.metadata?.rawParsedData as
    ParsedDataRecord | undefined;
  const sourceUrl = activeJob?.sourceUrl || "";
  const videoUrl = rawData?.downloadVideoUrl || rawData?.originDownloadVideoUrl;
  const audioUrl = rawData?.downloadAudioUrl || rawData?.originDownloadAudioUrl;

  const isHls = Boolean(videoUrl && isHlsPlaylistUrl(videoUrl));

  let playerUrl: string | null = null;
  if (outputType === "audio") {
    if (audioUrl) {
      playerUrl = buildMediaPreviewUrl({
        mediaType: "audio",
        sourceUrl: sourceUrl,
        title: activeJob?.metadata?.title || "",
      });
    }
  } else {
    if (videoUrl) {
      if (isHls) {
        playerUrl = buildHlsPlayProxyUrl(
          videoUrl,
          sourceUrl || videoUrl,
          HLS_PLAYLIST_ACCEPT,
        );
      } else {
        playerUrl = buildMediaPreviewUrl({
          mediaType: "video",
          sourceUrl: sourceUrl,
          title: activeJob?.metadata?.title || "",
        });
      }
    }
  }

  const handleSave = async () => {
    const concurrencyVal =
      segmentConcurrency === "auto"
        ? undefined
        : parseInt(segmentConcurrency, 10);
    const updates = {
      outputType,
      quality,
      filename,
      downloadThumbnail,
      saveMetadata,
      extractAudio,
      segmentConcurrency: concurrencyVal,
    };

    if (isBulk) {
      const selectedCount = store.selectedJobIds.length;
      if (selectedCount === 0) {
        toast.warning("No jobs selected to apply configuration");
        return;
      }
      await store.applyConfigToSelected(updates);
      toast.success(`Applied settings to ${selectedCount} selected jobs`);
    } else if (activeJob) {
      await store.updateJobConfig(activeJob.id, updates);
      toast.success("Configuration updated");
    }

    handleCloseDrawer();
  };

  const handleApplyToAll = async () => {
    const concurrencyVal =
      segmentConcurrency === "auto"
        ? undefined
        : parseInt(segmentConcurrency, 10);
    const updates = {
      outputType,
      quality,
      filename,
      downloadThumbnail,
      saveMetadata,
      extractAudio,
      segmentConcurrency: concurrencyVal,
    };

    await store.applyConfigToAll(updates);
    toast.success(`Applied configuration to all ${store.jobs.length} jobs`);
    handleCloseDrawer();
  };

  return (
    <Dialog
      open={Boolean(rawActiveJobId)}
      onOpenChange={(open) => !open && handleCloseDrawer()}
    >
      <DialogContent
        showCloseButton={false}
        className="sm:max-w-140 bg-card/95 border border-border/80 rounded-2xl shadow-2xl flex flex-col p-6 text-foreground max-h-[90vh] overflow-hidden backdrop-blur-2xl"
      >
        <DialogTitle className="sr-only">
          {isBulk ? t("titleBulk") : t("titleSingle")}
        </DialogTitle>
        <DialogDescription className="sr-only">
          {t("subtitle")}
        </DialogDescription>
        {/* Glow Ambient Line Top */}
        <div className="absolute -top-px inset-x-8 h-px bg-linear-to-r from-transparent via-primary/60 to-transparent" />

        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-border/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-primary/10 border border-primary/20 text-primary">
              <Settings className="h-4 w-4 animate-spin-slow" />
            </div>
            <div>
              <span className="font-bold text-sm tracking-wide text-foreground">
                {isBulk ? t("titleBulk") : t("titleSingle")}
              </span>
              <p className="text-[10px] text-muted-foreground">
                {t("subtitle")}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground"
            onClick={handleCloseDrawer}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Form Body */}
        <div className="flex-1 overflow-y-auto py-4 flex flex-col gap-5 pr-1">
          {!isBulk && activeJob?.metadata && (
            <div className="flex flex-col gap-2 bg-muted/40 border border-border/60 rounded-xl p-3">
              <div className="flex gap-3 items-center">
                {activeJob.metadata.cover && (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={activeJob.metadata.cover}
                    alt="cover"
                    className="w-12 h-12 rounded-lg object-cover border border-border/50 bg-muted shrink-0 shadow-xs"
                  />
                )}
                <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                  <span className="text-xs font-semibold text-foreground truncate">
                    {activeJob.metadata.title}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-mono font-bold text-primary uppercase bg-primary/15 px-1.5 py-0.5 rounded border border-primary/20">
                      {activeJob.platform}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {activeJob.metadata.pagesCount
                        ? `${activeJob.metadata.pagesCount} Parts`
                        : "Single Item"}
                    </span>
                  </div>
                </div>
              </div>

              {playerUrl && (
                <div className="mt-2 border-t border-border/40 pt-2.5">
                  {outputType === "audio" ? (
                    <audio
                      key={playerUrl}
                      src={playerUrl}
                      controls
                      preload="none"
                      className="w-full h-8"
                    />
                  ) : isHls ? (
                    <HlsVideoPlayer
                      key={playerUrl}
                      src={playerUrl}
                      controls
                      playsInline
                      preload="none"
                      className="w-full aspect-video max-h-55 rounded-lg bg-black object-contain"
                    />
                  ) : (
                    <video
                      key={playerUrl}
                      src={playerUrl}
                      controls
                      playsInline
                      preload="none"
                      className="w-full aspect-video max-h-55 rounded-lg bg-black object-contain"
                    />
                  )}
                </div>
              )}
            </div>
          )}

          {/* Output Type - Visual Format Cards */}
          <div className="flex flex-col gap-2">
            <Label className="text-[11px] font-bold text-foreground/80 uppercase tracking-wider flex items-center gap-1.5">
              <Sliders className="h-3.5 w-3.5 text-primary" />
              {t("outputFormat")}
            </Label>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: "mp4", label: "Video (MP4)", icon: Video },
                { id: "original_video", label: "Original", icon: Video },
                { id: "audio", label: "Audio MP3", icon: Music },
                { id: "zip_images", label: "ZIP Images", icon: FolderArchive },
              ].map((fmt) => {
                const Icon = fmt.icon;
                const isSelected = outputType === fmt.id;
                return (
                  <button
                    key={fmt.id}
                    type="button"
                    onClick={() => setOutputType(fmt.id as OutputType)}
                    className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-medium gap-1.5 transition-all duration-200 ${
                      isSelected
                        ? "bg-primary text-primary-foreground border-primary shadow-md shadow-primary/20 scale-[1.02]"
                        : "bg-muted/30 border-border/60 hover:bg-muted/70 text-foreground/80"
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="text-[10px] font-semibold">
                      {fmt.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Dynamic Quality Selector (Video Resolutions vs Audio Bitrates) */}
          {["mp4", "original_video"].includes(outputType) && (
            <div className="flex flex-col gap-2">
              <Label className="text-[11px] font-bold text-foreground/80 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                {t("videoQuality")}
              </Label>
              <Select value={quality} onValueChange={(val) => setQuality(val)}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder={t("selectVideoQuality")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="best">Best Available</SelectItem>
                  <SelectItem value="original">Original source</SelectItem>
                  <SelectItem value="2160p">4K (2160p)</SelectItem>
                  <SelectItem value="1440p">2K (1440p)</SelectItem>
                  <SelectItem value="1080p">Full HD (1080p)</SelectItem>
                  <SelectItem value="720p">HD (720p)</SelectItem>
                  <SelectItem value="480p">SD (480p)</SelectItem>
                </SelectContent>
              </Select>
              {(quality === "2160p" || quality === "1440p") && (
                <div className="flex items-center gap-1.5 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[10px] text-amber-500 font-medium">
                  <Info className="h-3.5 w-3.5 shrink-0" />
                  <span>{t("qualityNote")}</span>
                </div>
              )}
            </div>
          )}

          {outputType === "audio" && (
            <div className="flex flex-col gap-2">
              <Label className="text-[11px] font-bold text-foreground/80 uppercase tracking-wider flex items-center gap-1.5">
                <Music className="h-3.5 w-3.5 text-emerald-500" />
                {t("audioQuality")}
              </Label>
              <Select
                value={
                  ["best", "original", "320k", "256k", "192k", "128k"].includes(
                    quality,
                  )
                    ? quality
                    : "best"
                }
                onValueChange={(val) => setQuality(val)}
              >
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder={t("selectAudioQuality")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="best">
                    Best Available (320 kbps HQ)
                  </SelectItem>
                  <SelectItem value="original">
                    Original Source Audio
                  </SelectItem>
                  <SelectItem value="320k">High Quality (320 kbps)</SelectItem>
                  <SelectItem value="256k">
                    Balanced Quality (256 kbps)
                  </SelectItem>
                  <SelectItem value="192k">
                    Standard Quality (192 kbps)
                  </SelectItem>
                  <SelectItem value="128k">Compact Size (128 kbps)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Filename Input with Dynamic Variable Chips */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <Label className="text-[11px] font-bold text-foreground/80 uppercase tracking-wider">
                {isBulk ? t("filenameTemplate") : t("outputFilename")}
              </Label>
              <span className="text-[9px] text-muted-foreground">
                {t("clickTokenHint")}
              </span>
            </div>
            <Input
              value={filename}
              onChange={(e) => setFilename(e.target.value)}
              placeholder={isBulk ? "{index} - {title}" : "filename.mp4"}
              className="h-9 text-xs font-mono bg-background/50"
            />
            {/* Token Chips */}
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              {["{index}", "{title}", "{platform}", "{quality}", "{date}"].map(
                (token) => (
                  <button
                    key={token}
                    type="button"
                    onClick={() => insertToken(token, filename, setFilename)}
                    className="text-[9px] font-mono px-2 py-0.5 rounded-md bg-muted/60 hover:bg-muted border border-border/50 text-foreground/80 transition-colors"
                  >
                    + {token}
                  </button>
                ),
              )}
            </div>
          </div>

          {/* Segment Concurrency */}
          {outputType === "mp4" && (
            <div className="flex flex-col gap-1.5">
              <Label className="text-[11px] font-bold text-foreground/80 uppercase tracking-wider">
                {t("hlsConcurrency")}
              </Label>
              <Select
                value={segmentConcurrency}
                onValueChange={(val) => setSegmentConcurrency(val)}
              >
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Auto" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">
                    Auto (Network budget adapted)
                  </SelectItem>
                  <SelectItem value="2">2 segments</SelectItem>
                  <SelectItem value="4">4 segments</SelectItem>
                  <SelectItem value="6">6 segments</SelectItem>
                  <SelectItem value="8">8 segments (Aggressive)</SelectItem>
                  <SelectItem value="12">12 segments (Extreme)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Sleek Toggle Switch Cards (Advanced Options) */}
          <div className="flex flex-col gap-2.5 pt-2 border-t border-border/40">
            <Label className="text-[11px] font-bold text-foreground/80 uppercase tracking-wider">
              {t("advancedOptions")}
            </Label>

            <div className="flex flex-col gap-2">
              <label className="flex items-center justify-between p-2.5 rounded-xl bg-muted/30 border border-border/50 cursor-pointer hover:bg-muted/60 transition-colors">
                <div className="flex items-center gap-2">
                  <ImageIcon className="h-3.5 w-3.5 text-amber-500" />
                  <span className="text-xs font-medium text-foreground">
                    {t("downloadThumbnail")}
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={downloadThumbnail}
                  onChange={(e) => setDownloadThumbnail(e.target.checked)}
                  className="h-4 w-4 rounded border-borderAccent text-primary focus:ring-0 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-2.5 rounded-xl bg-muted/30 border border-border/50 cursor-pointer hover:bg-muted/60 transition-colors">
                <div className="flex items-center gap-2">
                  <FileCode className="h-3.5 w-3.5 text-emerald-500" />
                  <span className="text-xs font-medium text-foreground">
                    {t("saveMetadataJson")}
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={saveMetadata}
                  onChange={(e) => setSaveMetadata(e.target.checked)}
                  className="h-4 w-4 rounded border-borderAccent text-primary focus:ring-0 cursor-pointer"
                />
              </label>

              {outputType !== "audio" && (
                <label className="flex items-center justify-between p-2.5 rounded-xl bg-muted/30 border border-border/50 cursor-pointer hover:bg-muted/60 transition-colors">
                  <div className="flex items-center gap-2">
                    <Music className="h-3.5 w-3.5 text-primary" />
                    <span className="text-xs font-medium text-foreground">
                      {t("forceAudioExtraction")}
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={extractAudio}
                    onChange={(e) => setExtractAudio(e.target.checked)}
                    className="h-4 w-4 rounded border-borderAccent text-primary focus:ring-0 cursor-pointer"
                  />
                </label>
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions with Aceternity Shimmer Glow Button */}
        <div className="pt-3 border-t border-border/60 flex flex-col gap-2">
          {isBulk ? (
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                onClick={handleSave}
                disabled={store.selectedJobIds.length === 0}
                className="h-10 text-xs font-bold gap-1.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 shadow-md shadow-primary/20"
              >
                <CheckSquare className="h-4 w-4" />
                {t("applyChecked", { count: store.selectedJobIds.length })}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleApplyToAll}
                className="h-10 text-xs font-semibold rounded-xl"
              >
                {t("applyAll", { count: store.jobs.length })}
              </Button>
            </div>
          ) : (
            <Button
              type="button"
              onClick={handleSave}
              className="h-10 text-xs font-bold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/25 transition-all duration-300 transform active:scale-98"
            >
              {t("saveConfig")}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
