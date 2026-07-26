/**
 * VoidFetch
 * Copyright (c) 2026 VoidStation.
 * All rights reserved.
 */

import {
  requestUnifiedParse,
  type UnifiedParseSuccessResult,
} from "@/lib/unified-parse";
import { useBatchStore } from "../store/batch-store";
import type {
  DownloadJob,
  MediaMetadata,
  DownloadConfig,
  DownloadError,
  DownloadErrorCode,
} from "../types/batch-download";
import { isApiRequestError } from "@/lib/api-errors";
import { normalizePlatform } from "@/lib/platforms";
import type { PodcastEpisodeInfo } from "@/lib/types";
import { parseMediaDuration } from "../utils/duration-helper";

let activeParsersCount = 0;
const parseQueue: string[] = [];

/**
 * Starts processing the parse queue if there are slots available.
 */
function processNextParseJobs() {
  const { settings } = useBatchStore.getState();
  const maxConcurrency = settings.parseConcurrency || 4;

  while (activeParsersCount < maxConcurrency && parseQueue.length > 0) {
    const jobId = parseQueue.shift();
    if (jobId) {
      activeParsersCount++;
      parseJob(jobId).finally(() => {
        activeParsersCount--;
        processNextParseJobs();
      });
    }
  }
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
  if (outputType === "audio") return "mp3";
  if (outputType === "zip_images" || outputType === "images") return "zip";
  return "mp4"; // default to mp4
}

/**
 * Builds smart fallback metadata if server parsing is temporarily down or 503
 */
function buildFallbackMetadata(targetUrl: string): MediaMetadata | null {
  try {
    const urlObj = new URL(targetUrl);
    const host = urlObj.hostname.toLowerCase();
    const pathname = urlObj.pathname;

    // Pinterest Pin Fallback
    if (host.includes("pinterest.com") || host.includes("pin.it")) {
      const pinMatch = pathname.match(/\/pin\/(\d+)/);
      const pinId = pinMatch ? pinMatch[1] : "Media";
      return {
        title: `Pinterest Pin #${pinId}`,
        desc: `Pinterest Pin Item (${targetUrl})`,
        cover: null,
        platform: "pinterest",
        images: [targetUrl],
        rawParsedData: {},
      };
    }

    // Douyin Fallback
    if (host.includes("douyin.com") || host.includes("iesdouyin.com")) {
      return {
        title: `Douyin Video / Post`,
        desc: `Douyin Item (${targetUrl})`,
        cover: null,
        platform: "douyin",
        rawParsedData: {
          downloadVideoUrl: targetUrl,
          videoUrl: targetUrl,
        },
      };
    }

    // Threads Fallback
    if (host.includes("threads.com") || host.includes("threads.net")) {
      return {
        title: `Threads Post`,
        desc: `Threads Media Item (${targetUrl})`,
        cover: null,
        platform: "threads",
        rawParsedData: {
          downloadVideoUrl: targetUrl,
        },
      };
    }

    // Generic URL fallback
    const lastSegment = pathname.split("/").filter(Boolean).pop() || "Media Item";
    return {
      title: decodeURIComponent(lastSegment),
      desc: targetUrl,
      cover: null,
      platform: normalizePlatform(host),
      rawParsedData: {
        downloadVideoUrl: targetUrl,
      },
    };
  } catch {
    return null;
  }
}

/**
 * Parses a single job, fetches metadata, and populates default download configuration.
 */
async function parseJob(jobId: string): Promise<void> {
  const store = useBatchStore.getState();
  const job = store.jobs.find((j) => j.id === jobId);
  if (!job) return;

  // Set status to parsing
  await store.updateJobStatus(jobId, "parsing");

  try {
    const apiResult = await requestWithRetry(
      job.normalizedUrl || job.sourceUrl,
    );

    console.log(`[parseJob] API Response Received for job ${job.id} (${job.normalizedUrl || job.sourceUrl}):`, {
      success: apiResult.success,
      platform: apiResult.data?.platform,
      title: apiResult.data?.title,
      type: (apiResult.data as Record<string, unknown>)?.type,
      kind: apiResult.data?.kind,
      hasVideoUrl: Boolean(apiResult.data?.downloadVideoUrl),
      hasAudioUrl: Boolean(apiResult.data?.downloadAudioUrl),
      imagesCount: apiResult.data?.images?.length || 0,
      fullResponseData: apiResult.data,
    });

    if (!apiResult.success || !apiResult.data) {
      throw new Error("API parse result returned empty data");
    }

    const parseData = apiResult.data;

    // Check if it's an Apple Podcasts show or multi-episode picker
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

    // Construct metadata
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

    // Construct default config
    const settings = store.settings;
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
    const isExplicitVideo = parseRecord.type === "video" || parseData.kind === "video";
    const isImageOnlyPost =
      parseRecord.type === "image" ||
      parseRecord.type === "images" ||
      (metadata.platform === "pinterest" && !isExplicitVideo) ||
      (Boolean(metadata.images && metadata.images.length > 0) && !hasStream);

    const isAudioPlatform =
      metadata.platform === "apple_podcasts" ||
      settings.defaultOutputType === "audio";

    const effectiveOutputType = isImageOnlyPost
      ? metadata.images && metadata.images.length > 1
        ? "zip_images"
        : "images"
      : isAudioPlatform
      ? "audio"
      : settings.defaultOutputType;

    const extension = inferExtension(effectiveOutputType, metadata.platform);

    // Initial filename template replacement
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

    console.log(`[parseJob] Resolved Job Config for job ${job.id}:`, {
      platform: metadata.platform,
      isImageOnlyPost,
      hasStream,
      effectiveOutputType,
      extension,
      filename: config.filename,
      imagesCount: metadata.images?.length || 0,
    });

    // Update job with parsed data
    await store.updateJobStatus(jobId, "ready", {
      metadata,
      config,
      platform: metadata.platform,
    });

    // If auto-start is active, queue it up automatically
    if (settings.autoStartDownloads) {
      await store.updateJobStatus(jobId, "queued");
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

    console.error(`[parseJob] API Parse Failure for job ${jobId}:`, {
      code: errorCode,
      status: httpStatus,
      message: errorMessage,
      error,
    });

    await store.updateJobError(jobId, downloadError);
  }
}

/**
 * Triggers concurrent parsing for a specific list of job IDs or all draft/failed jobs.
 */
export function parseJobs(jobIds?: string[]): void {
  const store = useBatchStore.getState();
  const targets = jobIds
    ? store.jobs.filter((j) => jobIds.includes(j.id))
    : store.jobs.filter((j) => j.status === "draft" || j.status === "failed");

  targets.forEach((job) => {
    // Only queue if not already in queue and status is eligible
    if (
      !parseQueue.includes(job.id) &&
      (job.status === "draft" || job.status === "failed")
    ) {
      parseQueue.push(job.id);
    }
  });

  processNextParseJobs();
}

/**
 * Cancels a pending or active parse job.
 */
export function cancelParseJob(jobId: string): void {
  const index = parseQueue.indexOf(jobId);
  if (index > -1) {
    parseQueue.splice(index, 1);
  }

  const store = useBatchStore.getState();
  const job = store.jobs.find((j) => j.id === jobId);
  if (job && job.status === "parsing") {
    store.updateJobStatus(jobId, "cancelled");
  }
}
