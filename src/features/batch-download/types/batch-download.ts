/**
 * VoidFetch
 * Copyright (c) 2026 VoidStation.
 * All rights reserved.
 */

export type DownloadJobStatus =
  | "draft"
  | "parsing"
  | "ready"
  | "queued"
  | "resolving"
  | "downloading"
  | "processing"
  | "saving"
  | "paused"
  | "completed"
  | "failed"
  | "cancelled";

export type OutputType =
  | "original_video"
  | "mp4"
  | "audio"
  | "images"
  | "zip_images"
  | "platform_parts";

export type DownloadErrorCode =
  | "INVALID_URL"
  | "UNSUPPORTED_PLATFORM"
  | "PARSE_FAILED"
  | "RATE_LIMITED"
  | "AUTH_REQUIRED"
  | "MEDIA_NOT_FOUND"
  | "CORS_BLOCKED"
  | "PROXY_FAILED"
  | "NETWORK_ERROR"
  | "SAVE_CANCELLED"
  | "INSUFFICIENT_MEMORY"
  | "FFMPEG_FAILED"
  | "ABORTED"
  | "UNKNOWN";

export interface BatchSettings {
  parseConcurrency: number;
  downloadConcurrency: number;
  globalNetworkBudget: number;
  defaultOutputType: OutputType;
  defaultQuality: string;
  filenameTemplate: string;
  outputDirectoryHandleId?: string;
  continueOnError: boolean;
  autoStartDownloads: boolean;
}

export interface BatchProject {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  settings: BatchSettings;
  jobIds: string[];
}

export interface MediaMetadata {
  title: string;
  desc?: string;
  cover?: string | null;
  platform: string;
  duration?: number;
  isMultiPart?: boolean;
  images?: string[];
  pagesCount?: number;
  episodesCount?: number;
  rawParsedData?: unknown;
}

export interface DownloadConfig {
  enabled: boolean;
  outputType: OutputType;
  quality: string;
  filename: string;
  outputDirectory?: string;
  downloadThumbnail: boolean;
  saveMetadata: boolean;
  extractAudio: boolean;
  packageImagesAsZip: boolean;
  segmentConcurrency?: number;
}

export interface DownloadProgress {
  percent: number;
  downloadedBytes: number;
  totalBytes?: number;
  speedBytesPerSecond?: number;
  etaSeconds?: number;
  completedUnits?: number;
  totalUnits?: number;
}

export interface DownloadError {
  code: DownloadErrorCode;
  message: string;
  retryable: boolean;
  httpStatus?: number;
  requestId?: string;
  details?: unknown;
}

export interface DownloadJob {
  id: string;
  sourceUrl: string;
  normalizedUrl: string;
  platform?: string;

  status: DownloadJobStatus;
  priority: number;
  createdAt: number;
  updatedAt: number;
  startedAt?: number;
  completedAt?: number;

  metadata?: MediaMetadata;
  config: DownloadConfig;
  progress: DownloadProgress;
  error?: DownloadError;

  retryCount: number;
  maxRetries: number;
}
