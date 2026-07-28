/**
 * VoidFetch
 * Copyright (c) 2026 VoidStation.
 * All rights reserved.
 */

import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/lib/deferred-toast";
import { Clipboard, Upload, Plus, Trash2, FileText, Sparkles, Link2, CheckCircle2, AlertTriangle, MessageSquare } from "lucide-react";
import { extractAndNormalizeUrls } from "../utils/normalize-url";
import { useBatchStore } from "../store/batch-store";
import { parseJobs } from "../services/parse-worker-pool";
import { PlatformMarquee } from "@/components/downloader/PlatformMarquee";
import { SpotlightCard } from "@/components/ui/spotlight-card";
import { SupportedPlatformsModal } from "@/components/downloader/SupportedPlatformsModal";

export function BatchComposer() {
  const [inputText, setInputText] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [platformsModalOpen, setPlatformsModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const jobs = useBatchStore((s) => s.jobs);
  const addJobs = useBatchStore((s) => s.addJobs);
  const settings = useBatchStore((s) => s.settings);
  const existingUrls = jobs.map((j) => j.normalizedUrl);

  // Live URL detection counter
  const detectedResults = inputText.trim() ? extractAndNormalizeUrls(inputText, existingUrls) : [];
  const validDetectedCount = detectedResults.filter((r) => r.status === "valid").length;
  const duplicateCount = detectedResults.filter((r) => r.status === "duplicate").length;

  const handleProcessInput = (text: string) => {
    if (!text.trim()) return;

    const results = extractAndNormalizeUrls(text, existingUrls);
    const validJobs = results.filter((r) => r.status === "valid");
    const dupCount = results.filter((r) => r.status === "duplicate").length;
    const malformedCount = results.filter((r) => r.status === "malformed").length;

    if (results.length === 0) {
      toast.error("No valid URLs found in the input");
      return;
    }

    if (validJobs.length === 0) {
      toast.warning("All input URLs are already added or invalid", {
        description: `Found ${dupCount} duplicates, ${malformedCount} invalid links.`,
      });
      return;
    }

    // Check warning threshold
    if (validJobs.length > 50) {
      toast.info(`Importing a large batch of ${validJobs.length} URLs.`, {
        description: "Parsing will run concurrently in the background.",
      });
    }

    const isAudioPlatform = ["soundcloud", "apple_podcasts"];

    // Map to store jobs
    const jobsToAdd = validJobs.map((item) => {
      const isAudioOnlyPlatform = isAudioPlatform.includes(item.platform);
      const outputType = isAudioOnlyPlatform
        ? "audio"
        : settings.defaultOutputType;

      return {
        id: crypto.randomUUID(),
        sourceUrl: item.original,
        normalizedUrl: item.normalized,
        platform: item.platform,
        status: "draft" as const,
        priority: 0,
        maxRetries: 3,
        config: {
          enabled: true,
          outputType,
          quality: settings.defaultQuality,
          filename: "",
          downloadThumbnail: true,
          saveMetadata: false,
          extractAudio: outputType === "audio",
          packageImagesAsZip: outputType === "zip_images",
        },
      };
    });

    addJobs(jobsToAdd).then(() => {
      toast.success(`Successfully added ${validJobs.length} new jobs`, {
        description: `Deduplicated ${dupCount} URLs, ${malformedCount} invalid skipped.`,
      });
      setInputText("");

      // Auto-trigger parsing for newly added jobs
      parseJobs(jobsToAdd.map((j) => j.id));
    });
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setInputText(text);
      toast.success("Pasted clipboard content");
    } catch {
      toast.error("Failed to read clipboard");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      readAndImportFile(e.target.files[0]);
    }
  };

  const readAndImportFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (content) {
        handleProcessInput(content);
      }
    };
    reader.readAsText(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.name.endsWith(".txt") || file.name.endsWith(".csv")) {
        readAndImportFile(file);
      } else {
        toast.error("Only .txt and .csv file imports are supported");
      }
    }
  };

  const handleClear = () => {
    setInputText("");
  };

  return (
    <SpotlightCard
      className={`relative transition-colors duration-200 p-5 rounded-2xl border ${dragActive
          ? "border-primary ring-2 ring-primary/20 bg-primary/5"
          : "border-border/80 bg-card/90 backdrop-blur-xl shadow-lg"
        }`}
      onDragEnter={handleDrag}
      onDragOver={handleDrag}
      onDragLeave={handleDrag}
      onDrop={handleDrop}
    >
      <div className="flex flex-col gap-3.5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1 border-b border-border/40">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary/10 border border-primary/20 text-primary">
              <Sparkles className="h-4 w-4 animate-pulse" />
            </div>
            <div>
              <label className="text-xs font-bold text-foreground/90 tracking-wider uppercase block">
                BATCH URL COMPOSER
              </label>
              <span className="text-[10px] text-muted-foreground">
                Paste video links from{' '}
                <button
                  type="button"
                  onClick={() => setPlatformsModalOpen(true)}
                  className="inline-flex items-center gap-0.5 text-primary hover:underline font-semibold cursor-pointer"
                >
                  25+ supported platforms
                </button>{' '}
                or import a file
              </span>
            </div>
          </div>

          <div className="flex gap-2 shrink-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 text-xs gap-1.5 px-3 rounded-xl border-border/60 bg-muted/30 hover:bg-muted/80 shadow-2xs"
              onClick={handlePaste}
            >
              <Clipboard className="h-3.5 w-3.5 text-primary" />
              Paste Clipboard
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 text-xs gap-1.5 px-3 rounded-xl border-border/60 bg-muted/30 hover:bg-muted/80 shadow-2xs"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-3.5 w-3.5 text-emerald-500" />
              Import File
            </Button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".txt,.csv"
              className="hidden"
            />
          </div>
        </div>

        {/* Textarea Input Container */}
        <div className="relative">
          <Textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Paste multiple URLs here (one per line, or raw text with embedded links)..."
            className="min-h-[110px] max-h-[300px] font-mono text-xs resize-y bg-background/50 border-border/80 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all rounded-xl p-3 shadow-inner"
          />

          {/* Live Link Counter Badge */}
          {validDetectedCount > 0 && (
            <div className="absolute bottom-2.5 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 text-[10px] font-semibold backdrop-blur-md animate-in fade-in duration-200">
              <CheckCircle2 className="h-3 w-3" />
              <span>{validDetectedCount} New Link{validDetectedCount > 1 ? 's' : ''} Detected</span>
              {duplicateCount > 0 && <span className="opacity-75 font-normal">({duplicateCount} dupes)</span>}
            </div>
          )}

          {dragActive && (
            <div className="absolute inset-0 rounded-xl bg-background/90 backdrop-blur-md flex flex-col items-center justify-center border-2 border-dashed border-primary gap-2 z-20">
              <FileText className="h-8 w-8 text-primary animate-pulse" />
              <span className="text-sm font-bold text-primary">
                Drop text or CSV file here to import links
              </span>
            </div>
          )}
        </div>

        {/* Infinite Animated Marquee Ticker */}
        <PlatformMarquee />

        {/* Sleek Integrated Warning & Feedback Notice Banner */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 py-2 px-3.5 rounded-xl border border-amber-500/25 bg-amber-500/5 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[11px] font-medium shadow-2xs">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-500" />
            <span>Copyrighted, paid, or member-only restricted content is not supported.</span>
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground/80 text-[10px] shrink-0">
            <MessageSquare className="h-3 w-3 text-muted-foreground/60" />
            <span>Feedback? Click &quot;Feedback&quot; in top-right.</span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center justify-between pt-1 border-t border-border/40">
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
            <Link2 className="h-3 w-3 text-muted-foreground/60" />
            <span>Supported: YouTube, TikTok, Douyin, Bilibili, SoundCloud & 20+ more</span>
          </div>

          <div className="flex items-center gap-2">
            {inputText && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleClear}
                className="h-9 px-3 text-xs gap-1.5 rounded-xl text-muted-foreground hover:text-foreground"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Clear
              </Button>
            )}
            <Button
              type="button"
              disabled={!inputText.trim()}
              onClick={() => handleProcessInput(inputText)}
              className="h-10 px-5 text-xs font-bold gap-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/40 transition-all duration-300 transform active:scale-98 border-0"
            >
              <Plus className="h-4 w-4" />
              {validDetectedCount > 0 ? `Add ${validDetectedCount} URLs to Queue` : 'Add URLs to Queue'}
            </Button>
          </div>
        </div>
      </div>

      <SupportedPlatformsModal
        open={platformsModalOpen}
        onOpenChange={setPlatformsModalOpen}
      />
    </SpotlightCard>
  );
}
