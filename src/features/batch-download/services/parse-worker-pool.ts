/**
 * VoidFetch
 * Copyright (c) 2026 VoidStation.
 * All rights reserved.
 */

import {
  requestUnifiedParse,
  type UnifiedParseSuccessResult,
} from "@/lib/unified-parse";
// Removed useBatchStore to break circular dependency
import type {
  DownloadJob,
  MediaMetadata,
  DownloadConfig,
  DownloadError,
  DownloadErrorCode,
} from "../types/batch-download";
import { isApiRequestError, notifyApiErrorToast } from "@/lib/api-errors";
import { normalizePlatform } from "@/lib/platforms";
import type { PodcastEpisodeInfo } from "@/lib/types";
import { parseMediaDuration } from "../utils/duration-helper";

import type { BatchSettings, DownloadJobStatus } from "../types/batch-download";

export interface ParseWorkerCallbacks {
  getJob: (id: string) => DownloadJob | undefined;
  getSettings: () => BatchSettings;
  updateJobStatus: (id: string, status: DownloadJobStatus, extra?: Partial<DownloadJob>) => Promise<void>;
  updateJobError: (id: string, error: DownloadError | undefined) => Promise<void>;
}

/**
 * Helper to delay execution.
 */
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Retries a parse request with exponential backoff if rate limited.
 */
async function requestWithRetry(
  url: string,
  retries = 3,
  backoffMs = 1500,
): Promise<UnifiedParseSuccessResult> {
  try {
    return await requestUnifiedParse(url);
  } catch (error) {
    const isRateLimit =
      isApiRequestError(error) &&
      (error.code === "RATE_LIMITED" || error.status === 429);

    if (isRateLimit && retries > 0) {
      await delay(backoffMs);
      return requestWithRetry(url, retries - 1, backoffMs * 2);
    }
    throw error;
  }
}

/**
 * Helper to resolve the correct file extension based on OutputType and platform
 */
function inferExtension(outputType: string, platform: string): string {
  if (outputType === "audio" || platform === "soundcloud" || platform === "apple_podcasts") return "mp3";
  if (outputType === "zip_images" || outputType === "images") return "zip";
  return "mp4"; // default to mp4
}



class ParseWorkerPool {
  private activeParsersCount = 0;
  private parseQueue: string[] = [];
  private callbacks: ParseWorkerCallbacks | null = null;

  public init(callbacks: ParseWorkerCallbacks) {
    this.callbacks = callbacks;
  }

  private processNextParseJobs() {
    if (!this.callbacks) return;
    const settings = this.callbacks.getSettings();
    const maxConcurrency = settings.parseConcurrency || 4;

    while (this.activeParsersCount < maxConcurrency && this.parseQueue.length > 0) {
      const jobId = this.parseQueue.shift();
      if (jobId) {
        this.activeParsersCount++;
        this.parseJob(jobId).finally(() => {
          this.activeParsersCount--;
          this.processNextParseJobs();
        });
      }
    }
  }

  private async parseJob(jobId: string): Promise<void> {
    if (!this.callbacks) return;
    
    const job = this.callbacks.getJob(jobId);
    if (!job) return;

    await this.callbacks.updateJobStatus(jobId, "parsing");

    try {
      const apiResult = await requestWithRetry(
        job.normalizedUrl || job.sourceUrl,
      );

      if (!apiResult.success || !apiResult.data) {
        throw new Error("API parse result returned empty data");
      }

      const parseData = apiResult.data;
      const episodes = parseData.episodes || [];
      const isPicker = parseData.kind === "picker" || episodes.length > 0;
      const defaultEpisode = isPicker
        ? episodes.find(
            (e: PodcastEpisodeInfo) =>
              e.id === (parseData.currentEpisodeId || parseData.currentItemId),
          ) || episodes[0]
        : undefined;

      const parseRecord = parseData as Record<string, unknown>;
      const rawParsedData = parseRecord.rawParsedData as Record<string, unknown> | undefined;

      const resolvedDuration = parseMediaDuration(
        defaultEpisode?.duration ??
          parseData.duration ??
          parseRecord.videoDuration ??
          parseRecord.video_duration ??
          parseRecord.duration_seconds
      );

      const metadata: MediaMetadata = {
        title: defaultEpisode
          ? `${parseData.title || "Apple Podcasts"} · ${defaultEpisode.title}`
          : parseData.title || parseData.desc || "Untitled Media",
        desc: parseData.desc,
        cover: defaultEpisode?.cover || parseData.cover,
        platform: normalizePlatform(parseData.platform),
        duration: resolvedDuration,
        isMultiPart: parseData.isMultiPart,
        images: parseData.images
          ?.map((img: unknown) => (typeof img === "string" ? img : (img as { url?: string })?.url))
          .filter((url): url is string => Boolean(url)),
        pagesCount: parseData.pages?.length,
        episodesCount: episodes.length,
        rawParsedData: {
          ...parseData,
          downloadAudioUrl:
            parseData.downloadAudioUrl ||
            defaultEpisode?.downloadAudioUrl ||
            defaultEpisode?.originDownloadAudioUrl ||
            null,
        },
      };

      const settings = this.callbacks.getSettings();
      const targetSourceUrl = (job.sourceUrl || job.normalizedUrl || "").toLowerCase();
      const isValidStreamUrl = (url?: unknown): boolean => {
        if (typeof url !== "string" || !url.trim()) return false;
        const lower = url.toLowerCase();
        if (lower === targetSourceUrl || lower.includes("pinterest.com/pin/") || lower.includes("pin.it/")) return false;
        return true;
      };

      const hasStream = Boolean(
        isValidStreamUrl(parseData.downloadVideoUrl) ||
        isValidStreamUrl(parseRecord.streamUrl) ||
        isValidStreamUrl(parseData.downloadAudioUrl) ||
        isValidStreamUrl(rawParsedData?.downloadVideoUrl) ||
        isValidStreamUrl(rawParsedData?.downloadAudioUrl)
      );
      const isAudioItem =
        metadata.platform === "soundcloud" ||
        metadata.platform === "apple_podcasts" ||
        parseRecord.type === "audio" ||
        parseData.kind === "audio";

      const isExplicitVideo =
        parseRecord.type === "video" ||
        parseData.kind === "video" ||
        Boolean(parseData.downloadVideoUrl && !isAudioItem);

      const isImageOnlyPost =
        !isAudioItem &&
        !isExplicitVideo &&
        (
          parseRecord.type === "image" ||
          parseRecord.type === "images" ||
          (metadata.platform === "pinterest" && !isExplicitVideo) ||
          (Boolean(metadata.images && metadata.images.length > 0) && !hasStream)
        );

      const isAudioMode = isAudioItem || settings.defaultOutputType === "audio";

      const effectiveOutputType = isImageOnlyPost
        ? metadata.images && metadata.images.length > 1
          ? "zip_images"
          : "images"
        : isAudioMode
        ? "audio"
        : settings.defaultOutputType;

      const extension = inferExtension(effectiveOutputType, metadata.platform);

      const initialFilename = settings.filenameTemplate
        .replaceAll("{title}", metadata.title)
        .replaceAll("{platform}", metadata.platform)
        .replaceAll("{mediaId}", jobId.slice(0, 8)); // fallback id

      const config: DownloadConfig = {
        enabled: true,
        outputType: effectiveOutputType,
        quality: settings.defaultQuality,
        filename: `${initialFilename}.${extension}`,
        downloadThumbnail: true,
        saveMetadata: false,
        extractAudio: false,
        packageImagesAsZip: effectiveOutputType === "zip_images" || isImageOnlyPost,
      };

      await this.callbacks.updateJobStatus(jobId, "ready", {
        metadata,
        config,
        platform: metadata.platform,
      });

      if (settings.autoStartDownloads) {
        await this.callbacks.updateJobStatus(jobId, "queued");
      }
    } catch (error: unknown) {
      let errorCode: DownloadErrorCode = "PARSE_FAILED";
      let errorMessage = "Failed to parse URL metadata";
      let httpStatus: number | undefined = undefined;

      if (isApiRequestError(error)) {
        errorCode = (error.code as DownloadErrorCode) || "PARSE_FAILED";
        errorMessage = error.fallbackMessage || errorMessage;
        httpStatus = error.status;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      const downloadError: DownloadError = {
        code: errorCode,
        message: errorMessage,
        retryable:
          errorCode === "RATE_LIMITED" ||
          errorCode === "NETWORK_ERROR" ||
          (httpStatus ? httpStatus >= 500 : false),
        httpStatus,
      };

      notifyApiErrorToast(downloadError);

      await this.callbacks.updateJobStatus(jobId, errorCode === "RATE_LIMITED" || (httpStatus && httpStatus >= 500) ? "failed" : "failed");
      await this.callbacks.updateJobError(jobId, downloadError);
    }
  }

  public parseJobs(jobIds?: string[], allJobs?: DownloadJob[]): void {
    const targets = jobIds && allJobs
      ? allJobs.filter((j) => jobIds.includes(j.id))
      : (allJobs || []).filter((j) => j.status === "draft" || j.status === "failed");

    targets.forEach((job) => {
      if (
        !this.parseQueue.includes(job.id) &&
        (job.status === "draft" || job.status === "failed")
      ) {
        this.parseQueue.push(job.id);
      }
    });

    this.processNextParseJobs();
  }

  public cancelParseJob(jobId: string): void {
    if (!this.callbacks) return;
    
    const index = this.parseQueue.indexOf(jobId);
    if (index > -1) {
      this.parseQueue.splice(index, 1);
    }

    const job = this.callbacks.getJob(jobId);
    if (job && job.status === "parsing") {
      this.callbacks.updateJobStatus(jobId, "cancelled");
    }
  }
}

export const parseWorker = new ParseWorkerPool();

export function parseJobs(jobIds?: string[]): void {
  import("../store/batch-store").then(({ useBatchStore }) => {
    const jobs = useBatchStore.getState().jobs;
    parseWorker.parseJobs(jobIds, jobs);
  });
}

export function cancelParseJob(jobId: string): void {
  parseWorker.cancelParseJob(jobId);
}
