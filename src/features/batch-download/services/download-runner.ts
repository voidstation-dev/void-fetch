/**
 * VoidFetch
 * Copyright (c) 2026 VoidStation.
 * All rights reserved.
 */

import { supported as supportsStreamingFileSave } from 'browser-fs-access';
import JSZip from 'jszip';
import { useBatchStore } from '../store/batch-store';
import type { DownloadJob, DownloadError, DownloadErrorCode } from '../types/batch-download';
import { calculateSegmentConcurrency } from '../utils/concurrency-budget';
import { renderFilename } from '../utils/filename-template';
import {
  parseHlsMediaPlaylist,
  importAes128Key,
  decryptAes128Cbc,
  buildRangeHeader,
  type HlsSegment,
} from '@/lib/hls-browser-download';
import { isHlsPlaylistUrl } from '@/lib/hls-playback';
import { isApiRequestError, notifyApiErrorToast } from '@/lib/api-errors';

type HlsDirectFetchMode = 'probe' | 'direct-ok' | 'proxy-only';

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

// Retries helpers
const HTTP_RETRY_STATUSES = [408, 425, 429, 500, 502, 503, 504];

function isRetryableStatus(status: number): boolean {
  return HTTP_RETRY_STATUSES.includes(status);
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// -------------------------------------------------------------
// Direct Progressive Fetch Downloader (Allows progress bars!)
// -------------------------------------------------------------
// -------------------------------------------------------------
// Direct Progressive & Parallel Chunk Downloader (Booster Engine)
// -------------------------------------------------------------
async function runDirectDownloadStream(
  job: DownloadJob,
  url: string,
  _filename: string,
  signal: AbortSignal
): Promise<Blob> {
  const store = useBatchStore.getState();
  let response: Response;
  let retries = job.maxRetries || 3;
  let backoff = 1000;
  let useProxy = false;

  while (true) {
    try {
      let fetchUrl = url;
      if (useProxy) {
        let proxyPath = `/api/hls-download-proxy?target=${encodeURIComponent(url)}`;
        if (job.sourceUrl) {
          proxyPath += `&referer=${encodeURIComponent(job.sourceUrl)}`;
        }
        fetchUrl = proxyPath;
      }

      response = await fetch(fetchUrl, { signal });
      if (!response.ok) {
        if (response.status === 403 && !useProxy) {
          useProxy = true;
          continue;
        }

        if (isRetryableStatus(response.status) && retries > 0) {
          retries--;
          await delay(backoff);
          backoff *= 2;
          continue;
        }
        throw new Error(`HTTP Error ${response.status}: ${response.statusText}`);
      }
      break;
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === 'AbortError') throw err;
      if (signal.aborted) throw err;
      if (!useProxy) {
        useProxy = true;
        continue;
      }
      if (retries > 0) {
        retries--;
        await delay(backoff);
        backoff *= 2;
        continue;
      }
      throw err;
    }
  }

  const contentLength = response.headers.get('content-length');
  const totalBytes = contentLength ? parseInt(contentLength, 10) : undefined;

  if (!response.body) {
    const buffer = await response.arrayBuffer();
    return new Blob([buffer]);
  }

  await store.updateJobStatus(job.id, 'downloading');

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let downloadedBytes = 0;
  let lastUpdate = Date.now();
  let updateSample: { bytes: number; timestamp: number }[] = [];

  while (true) {
    if (signal.aborted) {
      await reader.cancel().catch(() => undefined);
      throw new DOMException('Download aborted', 'AbortError');
    }

    const { done, value } = await reader.read();
    if (done) break;
    if (!value) continue;

    chunks.push(value);
    downloadedBytes += value.byteLength;

    const now = Date.now();
    updateSample.push({ bytes: value.byteLength, timestamp: now });
    updateSample = updateSample.filter((s) => now - s.timestamp <= 4000);

    if (now - lastUpdate > 200) {
      const elapsed = updateSample.length >= 2 
        ? (updateSample[updateSample.length - 1].timestamp - updateSample[0].timestamp) / 1000 
        : 0;
      const speed = elapsed > 0 
        ? updateSample.reduce((acc, s) => acc + s.bytes, 0) / elapsed 
        : undefined;
      const eta = speed && totalBytes ? (totalBytes - downloadedBytes) / speed : undefined;
      const percent = totalBytes ? Math.round((downloadedBytes * 100) / totalBytes) : 0;

      store.updateJobProgress(job.id, {
        percent,
        downloadedBytes,
        totalBytes,
        speedBytesPerSecond: speed,
        etaSeconds: eta,
      });
      lastUpdate = now;
    }
  }

  return new Blob(chunks as BlobPart[]);
}

async function runDirectDownload(
  job: DownloadJob,
  url: string,
  filename: string,
  signal: AbortSignal
): Promise<Blob> {
  const store = useBatchStore.getState();
  await store.updateJobStatus(job.id, 'resolving');

  // Probe HEAD or Range 0-0 request to check file size and range support
  let totalBytes: number | undefined = undefined;
  let useProxy = false;

  try {
    let checkUrl = url;
    if (useProxy) {
      checkUrl = `/api/hls-download-proxy?target=${encodeURIComponent(url)}`;
      if (job.sourceUrl) {
        checkUrl += `&referer=${encodeURIComponent(job.sourceUrl)}`;
      }
    }

    const headRes = await fetch(checkUrl, { method: 'HEAD', signal }).catch(() => null);
    if (headRes && headRes.ok) {
      const cl = headRes.headers.get('content-length');
      if (cl) totalBytes = parseInt(cl, 10);
    }

    if (!totalBytes) {
      const rangeRes = await fetch(checkUrl, { headers: { Range: 'bytes=0-0' }, signal }).catch(() => null);
      if (rangeRes && (rangeRes.status === 206 || rangeRes.ok)) {
        const cr = rangeRes.headers.get('content-range');
        if (cr) {
          const parts = cr.split('/');
          if (parts[1]) totalBytes = parseInt(parts[1], 10);
        }
      }
    }
  } catch {
    // If probing fails, fall back to single stream
    return runDirectDownloadStream(job, url, filename, signal);
  }

  // If totalBytes is small (< 3MB) or indeterminate, use single stream
  if (!totalBytes || totalBytes < 3 * 1024 * 1024) {
    return runDirectDownloadStream(job, url, filename, signal);
  }

  // Large file detected (e.g. Douyin / TikTok 140MB - 231MB video)!
  // Launch Multi-Threaded Parallel HTTP Range Chunking to boost speeds 10x - 50x!
  try {
    const maxWorkers = Math.max(8, calculateSegmentConcurrency(1, job.config.segmentConcurrency));
    const chunkSize = Math.max(2 * 1024 * 1024, Math.ceil(totalBytes / (maxWorkers * 4))); // 2MB to 5MB chunks

    interface ChunkTask {
      index: number;
      start: number;
      end: number;
    }

    const tasks: ChunkTask[] = [];
    let startByte = 0;
    let taskIdx = 0;
    while (startByte < totalBytes) {
      const endByte = Math.min(startByte + chunkSize - 1, totalBytes - 1);
      tasks.push({ index: taskIdx++, start: startByte, end: endByte });
      startByte = endByte + 1;
    }

    await store.updateJobStatus(job.id, 'downloading');

    let downloadedBytes = 0;
    let lastUpdate = Date.now();
    let updateSample: { bytes: number; timestamp: number }[] = [];

    async function fetchChunkTask(task: ChunkTask): Promise<Uint8Array> {
      let retries = 3;
      let backoff = 800;
      while (true) {
        if (signal.aborted) throw new DOMException('Download aborted', 'AbortError');
        try {
          let fetchUrl = url;
          if (useProxy) {
            fetchUrl = `/api/hls-download-proxy?target=${encodeURIComponent(url)}`;
            if (job.sourceUrl) {
              fetchUrl += `&referer=${encodeURIComponent(job.sourceUrl)}`;
            }
          }

          const res = await fetch(fetchUrl, {
            headers: { Range: `bytes=${task.start}-${task.end}` },
            signal,
          });

          if (!res.ok) {
            if (res.status === 403 && !useProxy) {
              useProxy = true;
              continue;
            }
            if (retries > 0) {
              retries--;
              await delay(backoff);
              backoff *= 1.5;
              continue;
            }
            throw new Error(`Chunk HTTP Error ${res.status}`);
          }

          const buf = await res.arrayBuffer();
          const chunkData = new Uint8Array(buf);

          downloadedBytes += chunkData.byteLength;
          const now = Date.now();
          updateSample.push({ bytes: chunkData.byteLength, timestamp: now });
          updateSample = updateSample.filter((s) => now - s.timestamp <= 4000);

          if (now - lastUpdate > 150) {
            const elapsed = updateSample.length >= 2
              ? (updateSample[updateSample.length - 1].timestamp - updateSample[0].timestamp) / 1000
              : 0;
            const speed = elapsed > 0
              ? updateSample.reduce((acc, s) => acc + s.bytes, 0) / elapsed
              : undefined;
            const eta = speed ? (totalBytes! - downloadedBytes) / speed : undefined;
            const percent = Math.min(100, Math.round((downloadedBytes * 100) / totalBytes!));

            store.updateJobProgress(job.id, {
              percent,
              downloadedBytes,
              totalBytes,
              speedBytesPerSecond: speed,
              etaSeconds: eta,
            });
            lastUpdate = now;
          }

          return chunkData;
        } catch (err) {
          if (signal.aborted) throw err;
          if (retries > 0) {
            retries--;
            await delay(backoff);
            backoff *= 1.5;
            continue;
          }
          throw err;
        }
      }
    }

    const results: Uint8Array[] = new Array(tasks.length);
    let nextTaskIdx = 0;

    async function worker() {
      while (nextTaskIdx < tasks.length) {
        if (signal.aborted) break;
        const currentIdx = nextTaskIdx++;
        results[currentIdx] = await fetchChunkTask(tasks[currentIdx]);
      }
    }

    const workerPromises: Promise<void>[] = [];
    const workerCount = Math.min(maxWorkers, tasks.length);
    for (let i = 0; i < workerCount; i++) {
      workerPromises.push(worker());
    }

    await Promise.all(workerPromises);

    if (signal.aborted) {
      throw new DOMException('Download aborted', 'AbortError');
    }

    return new Blob(results as BlobPart[]);
  } catch (err) {
    console.warn(`Parallel chunk download failed for job ${job.id}, falling back to single stream:`, err);
    return runDirectDownloadStream(job, url, filename, signal);
  }
}

// -------------------------------------------------------------
// Image Batch ZIP Downloader
// -------------------------------------------------------------
async function runImagesDownload(
  job: DownloadJob,
  imageUrls: string[],
  signal: AbortSignal
): Promise<Blob> {
  const store = useBatchStore.getState();
  await store.updateJobStatus(job.id, 'downloading');

  const zip = new JSZip();
  let completed = 0;
  const total = imageUrls.length;

  for (let i = 0; i < total; i++) {
    if (signal.aborted) {
      throw new DOMException('Download aborted', 'AbortError');
    }

    const imgUrl = imageUrls[i];
    try {
      const response = await fetch(imgUrl, { signal });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const buffer = await response.arrayBuffer();

      // Detect type
      let ext = 'jpg';
      const contentType = response.headers.get('content-type');
      if (contentType?.includes('png')) ext = 'png';
      else if (contentType?.includes('webp')) ext = 'webp';
      else if (contentType?.includes('gif')) ext = 'gif';

      zip.file(`${String(i + 1).padStart(3, '0')}.${ext}`, buffer);
    } catch (err) {
      console.warn(`Failed to download image ${imgUrl}:`, err);
      // Continue download of other images
    }

    completed++;
    store.updateJobProgress(job.id, {
      percent: Math.round((completed * 100) / total),
      downloadedBytes: completed,
      totalBytes: total,
    });
  }

  await store.updateJobStatus(job.id, 'processing');
  return await zip.generateAsync({ type: 'blob' });
}

// -------------------------------------------------------------
// HLS Streaming Downloader
// -------------------------------------------------------------
async function runHlsDownload(
  job: DownloadJob,
  playlistUrl: string,
  signal: AbortSignal
): Promise<Response> {
  const store = useBatchStore.getState();
  await store.updateJobStatus(job.id, 'resolving');

  // 1. Fetch playlist
  const response = await fetch(playlistUrl, { signal });
  if (!response.ok) throw new Error(`HLS Playlist HTTP ${response.status}`);
  const playlistText = await response.text();

  // Parse playlist
  const resolution = parseHlsMediaPlaylist(playlistText, playlistUrl);
  
  // 2. Select segment limit / slice if browser lacks streaming save support
  const segmentCount = resolution.segments.length;
  if (!supportsStreamingFileSave && segmentCount > 800) {
    throw new Error('HLS playlist contains too many segments for direct browser memory download. Please use a supported browser with file streaming capabilities.');
  }

  // Calculate dynamic concurrency based on current active jobs and job config
  const activeJobs = store.jobs.filter((j) => j.status === 'downloading' || j.status === 'resolving').length;
  const concurrency = calculateSegmentConcurrency(Math.max(1, activeJobs), job.config.segmentConcurrency);

  await store.updateJobStatus(job.id, 'downloading');

  const targets = [
    ...(resolution.mapUrl ? [{ url: resolution.mapUrl, byterange: resolution.mapByterange }] : []),
    ...resolution.segments,
  ];

  let completed = 0;
  let downloadedBytes = 0;
  let lastUpdate = Date.now();
  let updateSample: { bytes: number; timestamp: number }[] = [];
  const _directFetchModes = new Map<string, HlsDirectFetchMode>();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const keyCache = new Map<string, Promise<CryptoKey>>();
      const pendingChunks = new Map<number, Uint8Array>();
      let nextWriteIndex = 0;

      const flushChunks = () => {
        while (pendingChunks.has(nextWriteIndex)) {
          const chunk = pendingChunks.get(nextWriteIndex);
          pendingChunks.delete(nextWriteIndex);
          nextWriteIndex += 1;
          if (chunk) controller.enqueue(chunk);
        }
      };

      // Define a concurrent chunk-fetch runner
      let nextIndex = 0;
      const workers = Array.from({ length: Math.min(concurrency, targets.length) }, async () => {
        while (nextIndex < targets.length && !signal.aborted) {
          const currentIndex = nextIndex;
          nextIndex++;
          const target = targets[currentIndex];

          let retries = 3;
          let backoff = 1000;
          let bytes: Uint8Array | null = null;

          while (retries > 0) {
            try {
              const headers = target.byterange ? { Range: buildRangeHeader(target.byterange)! } : undefined;
              const res = await fetch(target.url, { headers, signal });
              if (!res.ok) {
                if (isRetryableStatus(res.status)) {
                  retries--;
                  await delay(backoff);
                  backoff *= 2;
                  continue;
                }
                throw new Error(`HTTP ${res.status}`);
              }
              const buffer = await res.arrayBuffer();
              bytes = new Uint8Array(buffer);
              break;
            } catch (err) {
              if (signal.aborted) throw err;
              retries--;
              if (retries === 0) throw err;
              await delay(backoff);
              backoff *= 2;
            }
          }

          if (!bytes) throw new Error('Failed to fetch segment bytes');

          let outputChunk = bytes;
          const hlsSeg = target as HlsSegment;
          if (hlsSeg.keyUrl) {
            if (!hlsSeg.iv) throw new Error('Encrypted HLS segment missing IV');
            if (!keyCache.has(hlsSeg.keyUrl)) {
              keyCache.set(hlsSeg.keyUrl, (async () => {
                const keyRes = await fetch(hlsSeg.keyUrl!, { signal });
                if (!keyRes.ok) throw new Error(`Key HTTP ${keyRes.status}`);
                const rawKey = new Uint8Array(await keyRes.arrayBuffer());
                return importAes128Key(rawKey);
              })());
            }
            const cryptoKey = await keyCache.get(hlsSeg.keyUrl)!;
            outputChunk = await decryptAes128Cbc(bytes, cryptoKey, hlsSeg.iv);
          }

          pendingChunks.set(currentIndex, outputChunk);
          completed++;
          downloadedBytes += outputChunk.byteLength;

          // Emit progress updates
          const now = Date.now();
          updateSample.push({ bytes: outputChunk.byteLength, timestamp: now });
          updateSample = updateSample.filter((s) => now - s.timestamp <= 4000);

          if (now - lastUpdate > 250) {
            const elapsed = updateSample.length >= 2 
              ? (updateSample[updateSample.length - 1].timestamp - updateSample[0].timestamp) / 1000 
              : 0;
            const speed = elapsed > 0 
              ? updateSample.reduce((acc, s) => acc + s.bytes, 0) / elapsed 
              : undefined;
            const eta = speed ? ((targets.length - completed) * (downloadedBytes / completed)) / speed : undefined;

            store.updateJobProgress(job.id, {
              percent: Math.round((completed * 100) / targets.length),
              downloadedBytes,
              speedBytesPerSecond: speed,
              etaSeconds: eta,
            });
            lastUpdate = now;
          }

          flushChunks();
        }
      });

      try {
        await Promise.all(workers);
        flushChunks();
        controller.close();
      } catch (err) {
        controller.error(err);
      }
    }
  });

  return new Response(stream);
}

// -------------------------------------------------------------
// Core Runner Dispatcher
// -------------------------------------------------------------
export async function runJob(job: DownloadJob, signal: AbortSignal): Promise<void> {
  const store = useBatchStore.getState();
  const config = job.config;

  try {
    let outputBlob: Blob | null = null;
    let responseStream: Response | null = null;
    let resolvedFilename = job.config.filename;
    let extension = 'mp4';
    let mimeType = 'video/mp4';

    const platform = job.metadata?.platform || 'generic';
    const title = job.metadata?.title || 'VoidFetch Media';
    const rawData = job.metadata?.rawParsedData as ParsedDataRecord | undefined;

    // 1. Check Output Type & Dispatcher
    if (config.outputType === 'images' || config.outputType === 'zip_images') {
      const images = job.metadata?.images || [];
      if (images.length === 0) throw new Error('No images detected to package');
      
      outputBlob = await runImagesDownload(job, images, signal);
      extension = 'zip';
      mimeType = 'application/zip';
    } 
    else if (config.outputType === 'audio') {
      const audioUrl = rawData?.downloadAudioUrl;
      const extractAudioNeeded = job.config.extractAudio || rawData?.mediaActions?.audio === 'extract-audio';
      
      if (audioUrl && !extractAudioNeeded) {
        // Direct audio stream download
        outputBlob = await runDirectDownload(job, audioUrl, config.filename, signal);
      } else {
        // Must fetch video and run client-side FFmpeg extraction!
        const videoUrl = rawData?.downloadVideoUrl || rawData?.originDownloadVideoUrl;
        if (!videoUrl) throw new Error('Video URL missing for audio extraction');

        await store.updateJobStatus(job.id, 'processing', {
          progress: { percent: 0, downloadedBytes: 0 }
        });

        // Dynamic load FFmpeg to save load memory
        const { extractAudioFromVideo } = await import('@/lib/ffmpeg');
        
        outputBlob = await extractAudioFromVideo({
          videoUrl,
          signal,
          onProgress: (p, stage) => {
            store.updateJobProgress(job.id, {
              percent: p,
              downloadedBytes: stage === 'downloading' ? p : 100, // mock bytes
            });
          }
        });
      }
      extension = 'mp3';
      mimeType = 'audio/mpeg';
    }
    else {
      // Original video or MP4 video format
      const videoUrl = rawData?.downloadVideoUrl || rawData?.originDownloadVideoUrl;
      
      if (!videoUrl) {
        // Fallback: If no video URL is resolved, check audio or image post fallback.
        const audioUrl = rawData?.downloadAudioUrl || rawData?.originDownloadAudioUrl;
        if (audioUrl) {
          console.warn(`No video URL resolved for job ${job.id}, falling back to audio-only download.`);
          outputBlob = await runDirectDownload(job, audioUrl, config.filename, signal);
          extension = 'mp3';
          mimeType = 'audio/mpeg';
        } else if (job.metadata?.images && job.metadata.images.length > 0) {
          console.warn(`No video or audio URL resolved for job ${job.id}, falling back to image download.`);
          outputBlob = await runImagesDownload(job, job.metadata.images, signal);
          extension = 'zip';
          mimeType = 'application/zip';
        } else {
          throw new Error('No download media URL resolved');
        }
      } else {
        const isHls = isHlsPlaylistUrl(videoUrl);
        if (isHls) {
          responseStream = await runHlsDownload(job, videoUrl, signal);
          extension = 'mp4';
          mimeType = 'video/mp4';
        } else {
          const needsMerge = rawData?.mediaActions?.video === 'merge-then-download';
          if (needsMerge) {
            // Separate audio and video streams must be combined!
            const audioUrl = rawData?.downloadAudioUrl || rawData?.originDownloadAudioUrl;
            if (!audioUrl) throw new Error('Audio URL missing for stream merge');

            await store.updateJobStatus(job.id, 'processing');
            const { getFFmpeg } = await import('@/lib/ffmpeg');
            
            // Download both to blobs
            const videoBlob = await runDirectDownload(job, videoUrl, 'video-temp', signal);
            const audioBlob = await runDirectDownload(job, audioUrl, 'audio-temp', signal);

            await store.updateJobStatus(job.id, 'processing', {
              progress: { percent: 50, downloadedBytes: 100 }
            });

            const _ffmpeg = await getFFmpeg();
            const videoFile = new File([videoBlob], 'input-video.mp4');
            const audioFile = new File([audioBlob], 'input-audio.mp3');

            const { mergeVideoAudio } = await import('@/lib/ffmpeg');
            outputBlob = await mergeVideoAudio({
              videoFile,
              audioFile,
              signal,
              onProgress: (p) => {
                store.updateJobProgress(job.id, {
                  percent: p,
                });
              }
            });
          } else {
            // Standard progressive fetch
            outputBlob = await runDirectDownload(job, videoUrl, config.filename, signal);
          }
          extension = 'mp4';
          mimeType = 'video/mp4';
        }
      }
    }

    if (signal.aborted) {
      throw new DOMException('Download aborted', 'AbortError');
    }

    // 2. Set saving state
    await store.updateJobStatus(job.id, 'saving');

    // 3. Render final filename
    resolvedFilename = renderFilename(
      store.settings.filenameTemplate || '{index} - {title}',
      {
        index: store.jobs.findIndex((j) => j.id === job.id) + 1,
        title,
        platform,
        mediaId: job.id,
        quality: config.quality,
      },
      extension
    );

    // 4. Save to filesystem (Custom directory or browser download fallback)
    const finalBlob = responseStream ? await responseStream.blob() : outputBlob;
    if (finalBlob) {
      const { saveDownloadedFile } = await import('@/lib/directory-picker');
      await saveDownloadedFile(finalBlob, resolvedFilename);
    } else {
      throw new Error('No media output buffer resolved');
    }

    // 5. Complete job
    await store.updateJobStatus(job.id, 'completed', {
      progress: { percent: 100, downloadedBytes: 100 },
    });

  } catch (error: unknown) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      await store.updateJobStatus(job.id, 'cancelled');
      return;
    }

    console.error(`Download execution error for job ${job.id}:`, error);

    let errorCode: DownloadErrorCode = 'NETWORK_ERROR';
    let errorMessage = 'Media download failed';
    let httpStatus: number | undefined = undefined;

    if (isApiRequestError(error)) {
      errorCode = (error.code as DownloadErrorCode) || 'NETWORK_ERROR';
      errorMessage = error.fallbackMessage || errorMessage;
      httpStatus = error.status;
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }

    const downloadError: DownloadError = {
      code: errorCode,
      message: errorMessage,
      retryable: true, // retry by default unless cancelled
      httpStatus,
    };

    notifyApiErrorToast(error);

    await store.updateJobError(job.id, downloadError);
  }
}
