"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Loader2, ExternalLink, PlaySquare } from "lucide-react";
import { HlsVideoPlayer } from "@/features/hls/components/hls-video-player";
import { Card, CardContent } from "@/components/ui/card";
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
import { motion } from "framer-motion";

type ParsedResultData = NonNullable<UnifiedParseResult["data"]>;

// Aceternity UI inspired Grid Background
const AceternityGridBackground = ({
  coverUrl,
}: {
  coverUrl?: string | null;
}) => {
  return (
    <div className="absolute inset-0 -z-10 h-full w-full bg-slate-950">
      {/* Base Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f1a_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f1a_1px,transparent_1px)] bg-size-[24px_24px] mask-[radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_100%)]" />

      {/* Cover Image Blur Layer */}
      {coverUrl && (
        <div className="absolute inset-0 z-0 pointer-events-none opacity-20">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={coverUrl}
            alt=""
            className="w-full h-full object-cover blur-[100px] scale-110 saturate-150"
          />
          <div className="absolute inset-0 bg-slate-950/40 mix-blend-multiply" />
        </div>
      )}

      {/* Glowing Orbs */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 2, ease: "easeOut" }}
        className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-purple-500/10 blur-[100px]"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 2.5, ease: "easeOut", delay: 0.2 }}
        className="absolute top-[20%] right-[-10%] w-[40%] h-[60%] rounded-full bg-indigo-500/10 blur-[120px]"
      />

      <div className="absolute bottom-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-white/10 to-transparent" />
    </div>
  );
};

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
    <div className="min-h-screen flex flex-col bg-slate-950 relative overflow-hidden text-slate-200 selection:bg-indigo-500/30">
      <AceternityGridBackground coverUrl={visibleParseResult?.cover} />

      <div className="flex-1 px-2 sm:p-4 md:p-6 pt-4 sm:pt-6 z-10 relative flex flex-col items-center">
        {/* Header Logo Area */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-5xl mb-6 flex items-center justify-between px-2"
        >
          <div className="flex items-center gap-2 text-indigo-400 font-semibold tracking-wide uppercase text-sm">
            <PlaySquare className="h-5 w-5" />
            <span>Shared Playback</span>
          </div>
        </motion.div>

        {/* Main Video Container */}
        <motion.section
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", bounce: 0, duration: 0.5 }}
          className="w-full max-w-5xl mx-auto bg-black/60 backdrop-blur-2xl border border-white/10 rounded-2xl md:rounded-4xl overflow-hidden shadow-2xl relative ring-1 ring-white/5"
        >
          {/* Top Glow Edge */}
          <div className="absolute top-0 inset-x-0 h-px bg-linear-to-r from-transparent via-indigo-500/50 to-transparent opacity-80" />

          {loading ? (
            <div className="aspect-video max-h-[75dvh] flex items-center justify-center text-sm text-indigo-400/80">
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="h-10 w-10 animate-spin opacity-80" />
                <span className="tracking-[0.2em] font-mono uppercase text-[10px] opacity-70">
                  {tForm("downloading")}
                </span>
              </div>
            </div>
          ) : canPlay && playbackUrl ? (
            <div className="relative aspect-video max-h-[75dvh] w-full flex items-center justify-center bg-black/90 group">
              {/* Inner Glow when playing */}
              <div className="absolute inset-0 bg-linear-to-tr from-indigo-500/5 via-transparent to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none" />

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
                  className="block w-full h-full object-contain relative z-10 shadow-[0_0_80px_rgba(0,0,0,0.8)]"
                />
              )}
            </div>
          ) : visibleParseResult ? (
            <div className="aspect-video max-h-[75dvh] flex items-center justify-center px-4 text-sm text-slate-400 bg-black/80">
              <div className="flex flex-col items-center gap-3 p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
                <span className="text-3xl grayscale opacity-80">⚠️</span>
                <span className="font-medium tracking-wide">
                  {tResult("sharePlayUnavailable")}
                </span>
              </div>
            </div>
          ) : null}
        </motion.section>

        {/* Details Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="w-full max-w-5xl mt-6 md:mt-8"
        >
          <div className="px-2 md:px-0 space-y-4">
            {!loading && displayError && (
              <Card className="bg-red-950/30 border-red-900/50 backdrop-blur-xl shadow-xl">
                <CardContent className="p-6 space-y-4">
                  <p className="text-sm text-red-300 font-medium">
                    {displayError}
                  </p>
                  <Button
                    asChild
                    size="sm"
                    variant="outline"
                    className="border-red-900/50 hover:bg-red-900/30 text-red-200"
                  >
                    <Link href={`/${locale}`}>{tCommon("home")}</Link>
                  </Button>
                </CardContent>
              </Card>
            )}

            {!loading && !displayError && visibleParseResult && (
              <div className="w-full space-y-4 p-6 md:p-8 rounded-4xl bg-slate-900/40 border border-white/5 backdrop-blur-2xl shadow-xl relative overflow-hidden group">
                {/* Decorative Glow inside Card */}
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

                <div className="flex items-center gap-3 mb-2 relative z-10">
                  <PlatformBadge platform={visibleParseResult.platform} />
                  <div className="h-1 w-1 rounded-full bg-white/20" />
                  <span className="text-[10px] uppercase tracking-[0.2em] font-mono text-indigo-300/80 font-bold">
                    Shared Media
                  </span>
                </div>
                <h2
                  className="text-xl sm:text-2xl md:text-3xl lg:text-4xl leading-tight font-bold wrap-break-word text-white tracking-tight relative z-10"
                  title={visibleParseResult.title}
                >
                  {visibleParseResult.title}
                </h2>
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 pt-2 relative z-10">
                  {canonicalSourceUrl ? (
                    <a
                      href={canonicalSourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 hover:text-white border border-white/5 hover:border-white/10 transition-all duration-300 shadow-sm"
                    >
                      <ExternalLink className="h-4 w-4" />
                      <span className="font-medium tracking-wide">
                        {tHistory("viewSource")}
                      </span>
                    </a>
                  ) : null}
                </div>

                <div className="pt-6 mt-6 border-t border-white/5 relative z-10 flex flex-col md:flex-row gap-4 justify-between items-center">
                  <div className="w-full">
                    <ViewportSideRailAd slot="5740014745" showOn="mobile" />
                    <ViewportSideRailAd slot="6380909506" showOn="desktop" />
                  </div>
                  <Button
                    asChild
                    variant="ghost"
                    size="sm"
                    className="text-slate-400 hover:text-white shrink-0"
                  >
                    <Link href={`/${locale}`}>Return to {tCommon("home")}</Link>
                  </Button>
                </div>
              </div>
            )}
          </div>
        </motion.section>
      </div>
    </div>
  );
}
