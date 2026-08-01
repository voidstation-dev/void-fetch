"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Loader2, ExternalLink, PlaySquare, Clock, Info } from "lucide-react";
import { HlsVideoPlayer } from "@/features/hls/components/hls-video-player";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { PlatformBadge } from "@/components/platform-badge";
import {
  buildMediaPreviewUrl,
  canSharePlayResult,
} from "@/components/downloader/media-preview";
import { useLocale, useTranslations } from "next-intl";
import {
  isApiRequestError,
  notifyApiErrorToast,
  resolveApiErrorMessage,
} from "@/lib/api-errors";
import {
  buildHlsPlayProxyUrl,
  HLS_PLAYLIST_ACCEPT,
  isHlsPlaylistUrl,
} from "@/lib/hls-playback";
import {
  UnifiedParseReloadError,
  requestUnifiedParse,
} from "@/lib/unified-parse";
import type { UnifiedParseResult } from "@/lib/types";
import { normalizePlatform } from "@/lib/platforms";

type ParsedResultData = NonNullable<UnifiedParseResult["data"]>;

export function PlayPageClient() {
  const locale = useLocale();
  const tErrors = useTranslations("errors");
  const tForm = useTranslations("form");
  const tResult = useTranslations("result");
  const tCommon = useTranslations("common");
  const tHistory = useTranslations("history");
  const searchParams = useSearchParams();

  const sourceUrl = (
    searchParams.get("url") ||
    searchParams.get("play") ||
    ""
  ).trim();
  const autoplay = searchParams.get("autoplay") === "1";

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [parseResult, setParseResult] = useState<ParsedResultData | null>(null);

  useEffect(() => {
    let cancelled = false;

    if (!sourceUrl) {
      return;
    }

    const loadSharedResult = async () => {
      setLoading(true);
      setError("");
      setParseResult(null);

      try {
        const parsed = await requestUnifiedParse(sourceUrl);
        if (cancelled) {
          return;
        }

        setParseResult({
          ...parsed.data,
          platform: normalizePlatform(parsed.data.platform),
        });
      } catch (err) {
        if (cancelled) {
          return;
        }

        if (err instanceof UnifiedParseReloadError) {
          return;
        }

        if (notifyApiErrorToast(err)) {
          setError("Server unavailable or rate limited");
          return;
        }

        if (isApiRequestError(err)) {
          console.error("Shared playback parse failed", {
            code: err.code,
            status: err.status,
            requestId: err.requestId,
            details: err.details,
          });
        }

        setError(
          resolveApiErrorMessage(err, {
            api: tErrors.raw("api") as Record<string, string>,
            downloadError: tErrors("downloadError"),
          }),
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadSharedResult();

    return () => {
      cancelled = true;
    };
  }, [tErrors, sourceUrl]);

  const visibleParseResult = sourceUrl ? parseResult : null;
  const displayError = sourceUrl ? error : tErrors("emptyUrl");
  const canonicalSourceUrl = (visibleParseResult?.url || sourceUrl).trim();
  const isVideo = Boolean(
    visibleParseResult?.downloadVideoUrl ||
    visibleParseResult?.originDownloadVideoUrl,
  );
  const isAudio = Boolean(
    (visibleParseResult?.downloadAudioUrl ||
      visibleParseResult?.originDownloadAudioUrl) &&
    !isVideo,
  );
  const images = visibleParseResult?.images;
  const isImagePost = Boolean(
    images && images.length > 0 && !isVideo && !isAudio,
  );
  const resolvedMediaType = isAudio ? "audio" : "video";

  const hlsPlaybackUrl = useMemo(() => {
    const playlistUrl = visibleParseResult?.originDownloadVideoUrl?.trim();
    if (!playlistUrl || !isHlsPlaylistUrl(playlistUrl)) {
      return null;
    }

    return buildHlsPlayProxyUrl(
      playlistUrl,
      canonicalSourceUrl || playlistUrl,
      HLS_PLAYLIST_ACCEPT,
    );
  }, [canonicalSourceUrl, visibleParseResult]);

  const playbackUrl = useMemo(() => {
    if (hlsPlaybackUrl) {
      return hlsPlaybackUrl;
    }

    if (!canonicalSourceUrl || !visibleParseResult || isImagePost) {
      return null;
    }

    return buildMediaPreviewUrl({
      mediaType: resolvedMediaType,
      sourceUrl: canonicalSourceUrl,
      title: visibleParseResult.title,
    });
  }, [
    canonicalSourceUrl,
    hlsPlaybackUrl,
    visibleParseResult,
    isImagePost,
    resolvedMediaType,
  ]);

  const canPlay = visibleParseResult
    ? canSharePlayResult(visibleParseResult) || isImagePost
    : false;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 md:px-8 py-10 space-y-4">
      {/* Header Block */}
      <div className="flex items-center justify-between p-4 border rounded-xl bg-card border-border/80 shadow-sm">
        <div className="flex flex-col gap-0.5">
          <h1 className="text-sm font-bold text-foreground flex items-center gap-2">
            <PlaySquare className="h-4 w-4 text-primary" />
            <span>Shared Playback</span>
          </h1>
          <span className="text-[10px] text-muted-foreground uppercase">
            {tResult("sharePlayPlayerTitle")}
          </span>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-col gap-4">
        {loading ? (
          <div className="border rounded-xl bg-card border-border/80 p-12 flex flex-col items-center justify-center gap-4 text-muted-foreground shadow-sm">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="text-xs uppercase tracking-wider">
              {tForm("downloading")}
            </span>
          </div>
        ) : !loading && displayError ? (
          <div className="border rounded-xl bg-red-500/10 border-red-500/20 p-6 flex flex-col gap-4 items-start shadow-sm">
            <p className="text-sm text-red-500 font-medium">{displayError}</p>
            <Button
              asChild
              size="sm"
              variant="outline"
              className="border-red-500/20 hover:bg-red-500/10 text-red-500"
            >
              <Link href={`/${locale}`}>{tCommon("home")}</Link>
            </Button>
          </div>
        ) : canPlay ? (
          <>
            {isImagePost ? (
              <div className="border rounded-xl bg-muted/10 border-border/80 overflow-hidden shadow-sm max-h-[80vh] overflow-y-auto flex flex-col gap-4 items-center p-4">
                {images?.map((img, i) => {
                  const url = typeof img === "string" ? img : img.url;
                  if (!url) return null;
                  return (
                    <Image
                      key={i}
                      src={url}
                      alt="Shared Image"
                      width={0}
                      height={0}
                      sizes="100vw"
                      style={{ width: "100%", height: "auto" }}
                      unoptimized
                      className="max-w-full rounded-md shadow-md"
                    />
                  );
                })}
              </div>
            ) : isAudio ? (
              <div className="border rounded-xl bg-card border-border/80 shadow-sm relative overflow-hidden flex flex-col md:flex-row items-center gap-6 p-6 md:p-8">
                {/* Background Blur */}
                {visibleParseResult?.cover && (
                  <div className="absolute inset-0 z-0 pointer-events-none opacity-30 dark:opacity-20">
                    <Image
                      src={visibleParseResult.cover}
                      alt=""
                      fill
                      unoptimized
                      className="object-cover blur-3xl saturate-200"
                    />
                    <div className="absolute inset-0 bg-background/60" />
                  </div>
                )}

                <div className="relative z-10 shrink-0">
                  {visibleParseResult?.cover ? (
                    <Image
                      src={visibleParseResult.cover}
                      alt="Cover"
                      width={500}
                      height={500}
                      unoptimized
                      className="w-32 h-32 md:w-48 md:h-48 object-cover rounded-2xl shadow-xl ring-1 ring-border/50"
                    />
                  ) : (
                    <div className="w-32 h-32 md:w-48 md:h-48 rounded-2xl bg-muted/50 flex items-center justify-center shadow-inner">
                      <PlaySquare className="h-10 w-10 text-muted-foreground/30" />
                    </div>
                  )}
                </div>

                <div className="relative z-10 flex flex-col items-center md:items-start justify-center w-full max-w-md">
                  <audio
                    src={playbackUrl || undefined}
                    controls
                    autoPlay={autoplay}
                    className="w-full h-12"
                  />
                </div>
              </div>
            ) : (
              <div className="border rounded-xl bg-black border-border/80 overflow-hidden shadow-sm aspect-video flex items-center justify-center relative">
                {hlsPlaybackUrl ? (
                  <HlsVideoPlayer
                    src={playbackUrl!}
                    controls
                    autoPlay={autoplay}
                    playsInline
                    preload="metadata"
                    className="block w-full h-full object-contain relative z-10"
                  />
                ) : playbackUrl ? (
                  <video
                    src={playbackUrl}
                    controls
                    autoPlay={autoplay}
                    playsInline
                    preload="metadata"
                    className="block w-full h-full object-contain relative z-10"
                  />
                ) : null}
              </div>
            )}
          </>
        ) : visibleParseResult ? (
          <div className="border rounded-xl bg-card border-border/80 p-12 flex flex-col items-center justify-center gap-4 text-muted-foreground shadow-sm">
            <span className="text-3xl grayscale opacity-80">⚠️</span>
            <span className="text-sm font-medium tracking-wide">
              {tResult("sharePlayUnavailable")}
            </span>
          </div>
        ) : null}

        {/* Details Section */}
        {!loading && !displayError && visibleParseResult && (
          <div className="border rounded-xl bg-card border-border/80 p-5 md:p-6 flex flex-col gap-6 shadow-sm">
            {/* Header: Platform + Source Link */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <PlatformBadge platform={visibleParseResult.platform} />
                {visibleParseResult.duration ? (
                  <>
                    <span className="text-muted-foreground/30 text-xs">•</span>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                      <Clock className="h-3.5 w-3.5" />
                      <span>
                        {Math.floor(visibleParseResult.duration / 60)}:
                        {String(
                          Math.floor(visibleParseResult.duration % 60),
                        ).padStart(2, "0")}
                      </span>
                    </div>
                  </>
                ) : null}
              </div>

              {canonicalSourceUrl && (
                <a
                  href={canonicalSourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-primary transition-colors"
                >
                  <span>{tHistory("viewSource")}</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              )}
            </div>

            {/* Title & Description */}
            <div className="flex flex-col gap-2.5">
              <h2 className="text-lg md:text-xl font-bold text-foreground leading-snug wrap-break-word">
                {visibleParseResult.title}
              </h2>
              {visibleParseResult.desc && (
                <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed line-clamp-4">
                  {visibleParseResult.desc}
                </p>
              )}
            </div>

            {/* Info Box & Actions */}
            <div className="pt-5 border-t border-border/40 flex flex-col gap-4">
              <div className="flex gap-3 items-start p-3 md:p-4 rounded-xl bg-muted/30 border border-border/50 text-xs text-muted-foreground leading-relaxed">
                <Info className="h-4 w-4 shrink-0 mt-0.5 text-muted-foreground/70" />
                <p>
                  Đây là trang xem trước nội dung từ VoidFetch. Tốc độ tải tuỳ
                  thuộc vào máy chủ gốc của nền tảng. Để có trải nghiệm tốt nhất
                  và tải media về máy, hãy sử dụng ứng dụng VoidFetch.
                </p>
              </div>

              <div className="flex items-center justify-between">
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs font-medium shrink-0"
                >
                  <Link href={`/${locale}`}>Quay về {tCommon("home")}</Link>
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
