"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Loader2,
  ExternalLink,
  PlaySquare,
  AlignLeft,
  Clock,
  Info,
} from "lucide-react";
import { HlsVideoPlayer } from "@/features/hls/components/hls-video-player";
import { Button } from "@/components/ui/button";
import { PlatformBadge } from "@/components/platform-badge";
import { ViewportSideRailAd } from "@/components/ads/viewport-side-rail-ad";
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

    if (!canonicalSourceUrl || !visibleParseResult) {
      return null;
    }

    return buildMediaPreviewUrl({
      mediaType: "video",
      sourceUrl: canonicalSourceUrl,
      title: visibleParseResult.title,
    });
  }, [canonicalSourceUrl, hlsPlaybackUrl, visibleParseResult]);

  const canPlay = visibleParseResult
    ? canSharePlayResult(visibleParseResult)
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
        ) : canPlay && playbackUrl ? (
          <div className="border rounded-xl bg-black border-border/80 overflow-hidden shadow-sm aspect-video flex items-center justify-center relative">
            {hlsPlaybackUrl ? (
              <HlsVideoPlayer
                src={playbackUrl}
                controls
                autoPlay={autoplay}
                playsInline
                preload="metadata"
                className="block w-full h-full object-contain relative z-10"
              />
            ) : (
              <video
                src={playbackUrl}
                controls
                autoPlay={autoplay}
                playsInline
                preload="metadata"
                className="block w-full h-full object-contain relative z-10"
              />
            )}
          </div>
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
          <div className="border rounded-xl bg-card border-border/80 p-5 flex flex-col gap-4 shadow-sm">
            <div className="flex items-center gap-2">
              <PlatformBadge platform={visibleParseResult.platform} />
              <span className="text-[10px] uppercase tracking-wider font-mono text-muted-foreground font-bold">
                Shared Media
              </span>
            </div>

            <h2 className="text-sm md:text-base font-bold text-foreground leading-snug wrap-break-word">
              {visibleParseResult.title}
            </h2>

            {(visibleParseResult.duration || visibleParseResult.desc) && (
              <div className="flex flex-col gap-3 pt-2">
                {visibleParseResult.duration ? (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" />
                    <span>
                      {Math.floor(visibleParseResult.duration / 60)}:
                      {String(
                        Math.floor(visibleParseResult.duration % 60),
                      ).padStart(2, "0")}
                    </span>
                  </div>
                ) : null}

                {visibleParseResult.desc ? (
                  <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/30 p-3 rounded-lg border border-border/40">
                    <AlignLeft className="h-3.5 w-3.5 shrink-0 mt-0.5 opacity-70" />
                    <p className="whitespace-pre-wrap leading-relaxed line-clamp-4">
                      {visibleParseResult.desc}
                    </p>
                  </div>
                ) : null}
              </div>
            )}

            {canonicalSourceUrl && (
              <div className="flex items-center gap-3 pt-2">
                <a
                  href={canonicalSourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-primary hover:underline underline-offset-2 transition-colors"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  <span>{tHistory("viewSource")}</span>
                </a>
              </div>
            )}

            {/* Informational Box */}
            <div className="mt-2 border rounded-xl bg-primary/5 border-primary/20 p-4 flex gap-3">
              <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <div className="flex flex-col gap-1 text-xs">
                <span className="font-semibold text-primary">
                  Về Shared Playback
                </span>
                <span className="text-muted-foreground leading-relaxed">
                  Đây là trang xem trước nội dung được chia sẻ từ VoidFetch. Tốc
                  độ tải tuỳ thuộc vào máy chủ gốc của nền tảng. Để trải nghiệm
                  tốt nhất và lưu video/âm thanh về máy, bạn có thể tải nội dung
                  trực tiếp trên ứng dụng VoidFetch.
                </span>
              </div>
            </div>

            <div className="pt-4 mt-2 border-t border-border/40 flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="w-full">
                <ViewportSideRailAd slot="5740014745" showOn="mobile" />
                <ViewportSideRailAd slot="6380909506" showOn="desktop" />
              </div>
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground shrink-0 text-xs"
              >
                <Link href={`/${locale}`}>Return to {tCommon("home")}</Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
