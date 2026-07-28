"use client";

import {
  startTransition,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

import { toast } from "@/lib/deferred-toast";
import { DeferredAudioExtractDialog } from "@/components/deferred-audio-extract-dialog";
import { useTopBarActions } from "@/components/layout/top-bar-actions";
import type { AudioExtractTask } from "@/components/audio-tool/types";
import type { MediaPreviewRequest } from "@/components/downloader/media-preview";
import { buildPrimaryResultPreview } from "@/components/downloader/media-preview";
import { ArrowUp, Loader2, X } from "lucide-react";

import type { DownloadRecord } from "./download-history";
import { useLocalStorageState } from "@/hooks/use-local-storage-state";
import { useInstallPrompt } from "@/hooks/use-install-prompt";
import type { UnifiedParseResult } from "@/lib/types";
import { Platform } from "@/lib/types";
import {
  DOWNLOAD_HISTORY_MAX_COUNT,
  DOWNLOAD_HISTORY_STORAGE_KEY,
} from "@/lib/constants";
import { useTranslations } from "next-intl";
import { isApiRequestError, resolveApiErrorMessage } from "@/lib/api-errors";
import { getPlatformLabel, normalizePlatform } from "@/lib/platforms";
import {
  UnifiedParseReloadError,
  requestUnifiedParse,
} from "@/lib/unified-parse";

const UnifiedDownloaderLowerSections = dynamic(
  () =>
    import("./unified-downloader-lower-sections").then(
      (m) => m.UnifiedDownloaderLowerSections,
    ),
  { ssr: false },
);

interface UnifiedDownloaderProps {
  leftRail?: ReactNode;
  rightRail?: ReactNode;
  mobileAd?: ReactNode;
  mobileGuides?: ReactNode;
  heroMeta?: ReactNode;
  footer?: ReactNode;
}

interface ActivePreview extends MediaPreviewRequest {
  origin: "share" | "result";
}

export function UnifiedDownloader({
  leftRail,
  rightRail,
  mobileAd,
  mobileGuides,
  heroMeta,
  footer,
}: UnifiedDownloaderProps) {
  const tUnified = useTranslations("unified");
  const tHistory = useTranslations("history");
  const tToast = useTranslations("toast");
  const tForm = useTranslations("form");
  const tErrors = useTranslations("errors");
  const tPage = useTranslations("page");
  const tCommon = useTranslations("common");
  const tPlatforms = useTranslations("history.platforms");

  const { setActions: setTopBarActions } = useTopBarActions();
  const searchParams = useSearchParams();
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [isCoolingDown, setIsCoolingDown] = useState(false);
  const [error, setError] = useState("");
  const lastParseTimeRef = useRef<number>(0);
  const [audioToolMounted, setAudioToolMounted] = useState(false);
  const [audioToolOpen, setAudioToolOpen] = useState(false);
  const [audioToolEntry, setAudioToolEntry] = useState<"toolbar" | "result">(
    "toolbar",
  );
  const [audioToolTask, setAudioToolTask] = useState<AudioExtractTask | null>(
    null,
  );
  const [parseResult, setParseResult] = useState<
    UnifiedParseResult["data"] | null
  >(null);
  const [activePreview, setActivePreview] = useState<ActivePreview | null>(
    null,
  );
  const [showBackToTop, setShowBackToTop] = useState(false);
  const historyRef = useRef<HTMLDivElement>(null);
  const urlInputRef = useRef<HTMLTextAreaElement>(null);
  const handledShareTaskRef = useRef<string | null>(null);

  const [downloadHistory, setDownloadHistory, historyHydrated] =
    useLocalStorageState<DownloadRecord[]>(DOWNLOAD_HISTORY_STORAGE_KEY, {
      defaultValue: [],
    });
  const { canPrompt, promptInstall, dismiss } = useInstallPrompt();
  const hasPromptedInstall = useRef(false);
  const addToHistory = useCallback(
    (record: DownloadRecord) => {
      const normalizedUrl = record.url.trim();
      setDownloadHistory((prev) =>
        [
          record,
          ...(prev || []).filter((item) => item.url.trim() !== normalizedUrl),
        ].slice(0, DOWNLOAD_HISTORY_MAX_COUNT),
      );
    },
    [setDownloadHistory],
  );

  const clearDownloadHistory = () => {
    setDownloadHistory([]);
  };

  const openToolbarAudioTool = useCallback(() => {
    setAudioToolMounted(true);
    setAudioToolEntry("toolbar");
    setAudioToolTask(null);
    setAudioToolOpen(true);
  }, []);

  const openResultAudioExtract = (task: AudioExtractTask) => {
    setAudioToolMounted(true);
    setAudioToolEntry("result");
    setAudioToolTask(task);
    setAudioToolOpen(true);
  };

  // Unified parse handler: parse only, do not automatically download
  const handleUnifiedParse = useCallback(
    async (videoUrl: string) => {
      void import("./unified-downloader-lower-sections");

      // Call the parse API to get video information
      const apiResult = await requestUnifiedParse(videoUrl);
      const normalizedData = {
        ...apiResult.data,
        platform: normalizePlatform(apiResult.data.platform),
      };
      const platformCode = normalizedData.platform;
      const platformLabel = getPlatformLabel(platformCode, tPlatforms);

      // Add to download history - use desc if title is empty
      // Use canonical URL returned by API to avoid tracking params/raw text inputs
      const displayTitle =
        normalizedData.title ||
        normalizedData.desc ||
        tHistory("unknownTitle");
      const nextRecord: DownloadRecord = {
        url: normalizedData.url || videoUrl,
        title: displayTitle,
        timestamp: Date.now(),
        platform: platformCode as Platform,
      };

      // Parse result card can be heavy on mobile. Mark as transition to keep interaction responsive.
      startTransition(() => {
        // Directly save the complete parseResult data for ResultCard to render all fields
        setParseResult(normalizedData);
        addToHistory(nextRecord);
      });

      // Show success toast
      toast.success(tToast("douyinParseSuccess"), {
        description: `${platformLabel}: ${displayTitle}`,
      });

      // Prompt PWA installation on first successful parse
      if (canPrompt && !hasPromptedInstall.current) {
        hasPromptedInstall.current = true;
        toast(tToast("installTitle"), {
          description: tToast("installDescription"),
          duration: 10000,
          action: {
            label: tToast("installAction"),
            onClick: promptInstall,
          },
          onDismiss: dismiss,
        });
      }
      return normalizedData;
    },
    [addToHistory, canPrompt, dismiss, promptInstall, tHistory, tPlatforms, tToast],
  );

  const closeParseResult = () => {
    setParseResult(null);
    setActivePreview(null);
  };

  const openResultPreview = useCallback((request: MediaPreviewRequest) => {
    setActivePreview({
      ...request,
      autoplay: request.autoplay ?? false,
      origin: "result",
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!url.trim()) {
      setError(tErrors("emptyUrl"));
      return;
    }

    const now = Date.now();
    if (now - lastParseTimeRef.current < 3000) {
      return; // Cooldown active, prevent resubmission
    }
    lastParseTimeRef.current = now;
    setIsCoolingDown(true);
    setTimeout(() => setIsCoolingDown(false), 3000);

    setLoading(true);
    setError("");
    setParseResult(null);
    setActivePreview(null);

    try {
      // Use unified interface to handle all platforms, backend handles all routing and detection
      await handleUnifiedParse(url.trim());

      setUrl("");
    } catch (err) {
      if (err instanceof UnifiedParseReloadError) {
        setLoading(false);
        return;
      }

      if (isApiRequestError(err)) {
        console.error("Unified parse request failed", {
          code: err.code,
          status: err.status,
          requestId: err.requestId,
          details: err.details,
        });
      }

      const errorMessage = resolveApiErrorMessage(err, {
        api: {
          networkError: tErrors("api.networkError"),
          rateLimit: tErrors("api.rateLimit"),
          serverError: tErrors("api.serverError"),
          serviceUnavailable: tErrors("api.serviceUnavailable"),
          unknownError: tErrors("api.unknownError"),
        },
        downloadError: tErrors("downloadError"),
      });
      setError(errorMessage);
      toast.error(tErrors("downloadFailed"), {
        description: errorMessage,
      });
    }

    setLoading(false);
  };

  const handleRedownload = (url: string) => {
    setUrl(url);
    setParseResult(null);
    setActivePreview(null);
    toast(tToast("linkFilledForRedownload"), {
      description: tToast("clickToRedownloadDesc"),
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const sharedPlaySourceUrl = searchParams.get("play")?.trim() ?? "";
  const sharedAutoplayRequested = searchParams.get("autoplay") === "1";
  const hasDownloadHistory = downloadHistory.length > 0;
  const showHistoryShortcut = historyHydrated && hasDownloadHistory;
  const scrollToHistory = useCallback(() => {
    if (historyRef.current) {
      const top =
        historyRef.current.getBoundingClientRect().top + window.scrollY - 64;
      window.scrollTo({ top, behavior: "smooth" });
    }
  }, []);

  useEffect(() => {
    setTopBarActions({
      showHistoryShortcut,
      onHistoryClick: scrollToHistory,
      showAudioTool: true,
      onAudioToolClick: openToolbarAudioTool,
    });

    return () => {
      setTopBarActions({});
    };
  }, [
    openToolbarAudioTool,
    scrollToHistory,
    setTopBarActions,
    showHistoryShortcut,
  ]);

  useEffect(() => {
    if (!sharedPlaySourceUrl) {
      return;
    }

    const taskKey = `${sharedPlaySourceUrl}::${sharedAutoplayRequested ? "1" : "0"}`;
    if (handledShareTaskRef.current === taskKey) {
      return;
    }
    handledShareTaskRef.current = taskKey;

    let cancelled = false;

    const runSharedPlayback = async () => {
      setLoading(true);
      setError("");
      setParseResult(null);
      setUrl(sharedPlaySourceUrl);
      setActivePreview(null);

      try {
        const parsed = await handleUnifiedParse(sharedPlaySourceUrl);
        if (cancelled) {
          return;
        }

        const sharePreview = buildPrimaryResultPreview(parsed, {
          autoplay: sharedAutoplayRequested,
        });

        setActivePreview(
          sharePreview
            ? {
                ...sharePreview,
                origin: "share",
              }
            : null,
        );
      } catch (err) {
        if (cancelled) {
          return;
        }

        if (err instanceof UnifiedParseReloadError) {
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

        const errorMessage = resolveApiErrorMessage(err, {
          api: {
            networkError: tErrors("api.networkError"),
            rateLimit: tErrors("api.rateLimit"),
            serverError: tErrors("api.serverError"),
            serviceUnavailable: tErrors("api.serviceUnavailable"),
            unknownError: tErrors("api.unknownError"),
          },
          downloadError: tErrors("downloadError"),
        });
        setError(errorMessage);
        toast.error(tErrors("downloadFailed"), {
          description: errorMessage,
        });
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void runSharedPlayback();

    return () => {
      cancelled = true;
    };
  }, [handleUnifiedParse, sharedAutoplayRequested, sharedPlaySourceUrl, tErrors]);

  useEffect(() => {
    let idleId: number | null = null;
    let timerId: ReturnType<typeof setTimeout> | null = null;

    const preloadInteractiveChunks = () => {
      void import("./unified-downloader-lower-sections");
    };

    if (typeof window !== "undefined" && "requestIdleCallback" in window) {
      idleId = window.requestIdleCallback(
        () => {
          preloadInteractiveChunks();
        },
        { timeout: 3000 },
      );
    } else {
      timerId = setTimeout(() => {
        preloadInteractiveChunks();
      }, 1200);
    }

    return () => {
      if (idleId !== null && "cancelIdleCallback" in window) {
        window.cancelIdleCallback(idleId);
      }
      if (timerId !== null) {
        clearTimeout(timerId);
      }
    };
  }, []);

  useEffect(() => {
    let ticking = false;

    const updateVisibility = () => {
      const shouldShow = window.scrollY > 800;
      setShowBackToTop((prev) => (prev === shouldShow ? prev : shouldShow));
      ticking = false;
    };

    const handleScroll = () => {
      if (ticking) {
        return;
      }
      ticking = true;
      window.requestAnimationFrame(updateVisibility);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <DeferredAudioExtractDialog
        mounted={audioToolMounted}
        open={audioToolOpen}
        onOpenChange={(nextOpen) => {
          setAudioToolOpen(nextOpen);
          if (!nextOpen) {
            setAudioToolTask(null);
            setAudioToolEntry("toolbar");
          }
        }}
        entry={audioToolEntry}
        autoExtractTask={audioToolTask}
      />

      <main className="flex-1 p-3 sm:p-4 md:p-4 pt-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            <div className="hidden lg:block">
              <div className="sticky top-20 flex flex-col gap-4">
                {leftRail}
              </div>
            </div>

            <div className="lg:col-span-2 flex flex-col gap-4">
              <Card className="shrink-0">
                <CardHeader className="p-4 pb-2 space-y-1.5">
                  <h1 className="text-2xl text-center font-semibold tracking-tight">
                    {tUnified("pageTitle")}
                  </h1>
                  <p className="text-xs sm:text-[13px] leading-relaxed text-foreground/60 text-center break-words">
                    {tUnified("pageDescription")}
                  </p>
                </CardHeader>
                <CardContent className="px-4 pb-4 pt-1">
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Textarea
                        id="url"
                        ref={urlInputRef}
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder={tUnified("placeholder")}
                        required
                        className="min-h-[120px] resize-none break-all"
                      />
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          className="flex-1"
                          onClick={async () => {
                            try {
                              const text = await navigator.clipboard.readText();
                              setUrl(text);

                              // Show link pasted toast
                              toast.success(tToast("linkFilled"));
                            } catch (err) {
                              console.error("Failed to read clipboard:", err);
                              toast.error(tErrors("clipboardFailed"), {
                                description: tErrors("clipboardPermission"),
                              });
                            }
                          }}
                        >
                          {tForm("pasteButton")}
                        </Button>
                        <Button
                          type="submit"
                          className="flex-1 flex items-center justify-center gap-2"
                          disabled={loading || isCoolingDown || !url.trim()}
                        >
                          {loading && (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          )}
                          {loading
                            ? tForm("downloading")
                            : tForm("downloadButton")}
                        </Button>
                      </div>
                    </div>

                    {error && (
                      <p className="text-sm text-destructive text-center">
                        {error}
                      </p>
                    )}

                    <div className="pt-2 space-y-3">
                      <div className="rounded-md border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-center text-xs text-amber-600 dark:text-amber-400/90 break-words">
                        {tPage("copyrightBilibiliRestriction")}
                      </div>
                      {heroMeta}
                    </div>
                  </form>
                </CardContent>
              </Card>

              <UnifiedDownloaderLowerSections
                parseResult={parseResult}
                onCloseParseResult={closeParseResult}
                onOpenExtractAudio={openResultAudioExtract}
                onRequestPreview={openResultPreview}
                activePreview={activePreview}
                mobileAd={mobileAd}
                mobileGuides={mobileGuides}
                downloadHistory={downloadHistory}
                clearHistory={clearDownloadHistory}
                onRedownload={handleRedownload}
                historyRef={historyRef}
                historyHydrated={historyHydrated}
              />
            </div>

            <div className="hidden lg:block">
              <div className="sticky top-20 flex flex-col gap-4">
                {rightRail}
              </div>
            </div>
          </div>
        </div>
      </main>

      {footer}

      <Button
        type="button"
        size="icon"
        className={`fixed right-4 bottom-[calc(1rem+env(safe-area-inset-bottom))] z-30 h-10 w-10 rounded-full shadow-md transition-all duration-300 ease-out ${
          showBackToTop
            ? "pointer-events-auto opacity-100 translate-y-0 scale-100"
            : "pointer-events-none opacity-0 translate-y-2 scale-95"
        }`}
        aria-label={tCommon("backToTop")}
        onClick={() => {
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
      >
        <ArrowUp className="h-4 w-4" />
      </Button>
    </div>
  );
}
