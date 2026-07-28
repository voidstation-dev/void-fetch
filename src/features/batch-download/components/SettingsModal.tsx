/**
 * VoidFetch - Aceternity Animated Settings Modal Component
 * Copyright (c) 2026 VoidStation.
 */

"use client";

import React from "react";
import { useBatchStore } from "../store/batch-store";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
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
  ShieldCheck,
  Sliders,
  HardDrive,
  Sparkles,
  Folder,
  FolderCheck,
  FolderSync,
} from "lucide-react";
import { toast } from "@/lib/deferred-toast";
import {
  getActiveDirectoryName,
  selectCustomDirectory,
  clearActiveDirectoryHandle,
} from "@/lib/directory-picker";

import { cn } from "@/lib/utils";
import type { OutputType } from "../types/batch-download";

export function SettingsModal() {
  const store = useBatchStore();
  const isOpen = store.isSettingsOpen;
  const settings = store.settings;

  const [customDirName, setCustomDirName] = React.useState<string | null>(
    getActiveDirectoryName(),
  );

  const handleClose = () => {
    store.setIsSettingsOpen(false);
  };

  const handleUpdate = (newSettings: Partial<typeof settings>) => {
    store.updateSettings(newSettings);
    toast.success("Settings updated successfully");
  };

  const handleChooseDirectory = async () => {
    try {
      const selected = await selectCustomDirectory();
      if (selected) {
        setCustomDirName(selected);
        toast.success(`Custom download folder set to "${selected}"`);
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        toast.error(err.message);
      }
    }
  };

  const handleResetDirectory = () => {
    clearActiveDirectoryHandle();
    setCustomDirName(null);
    toast.info("Reset download location to browser default");
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent showCloseButton={false} className="sm:max-w-xl w-[calc(100vw-2rem)] max-h-[85vh] overflow-x-hidden overflow-y-auto p-6 rounded-2xl border border-border/80 bg-card shadow-2xl backdrop-blur-xl transition-all duration-200">
        <DialogTitle className="sr-only">Workspace Preferences</DialogTitle>
        <DialogDescription className="sr-only">Configure global download defaults and network concurrency</DialogDescription>
        {/* Glow Ambient Line Top */}
        <div className="absolute -top-px inset-x-8 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-border/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-primary/10 border border-primary/20 text-primary">
              <Settings className="h-5 w-5 animate-spin-slow" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">
                Workspace Preferences
              </h2>
              <p className="text-[11px] text-muted-foreground">
                Configure global download defaults & network concurrency
              </p>
            </div>
          </div>
          <Button
            aria-label="Close workspace preferences"
            variant="ghost"
            size="icon"
            onClick={handleClose}
            className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>

        {/* Modal Body */}
        <div className="flex flex-col gap-5 py-4">
          {/* Default Format & Quality */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground/90 uppercase tracking-wider">
              <Sliders className="h-3.5 w-3.5 text-primary" />
              <span>Default Output & Quality</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="default-format-select" className="text-[11px] text-muted-foreground">
                  Default Format
                </Label>
                <Select
                  value={settings.defaultOutputType}
                  onValueChange={(val) =>
                    handleUpdate({ defaultOutputType: val as OutputType })
                  }
                >
                  <SelectTrigger id="default-format-select" aria-label="Default Format" className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mp4">Video (MP4)</SelectItem>
                    <SelectItem value="original_video">
                      Original Format
                    </SelectItem>
                    <SelectItem value="audio">Audio (MP3)</SelectItem>
                    <SelectItem value="zip_images">ZIP Image Pack</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="default-quality-select" className="text-[11px] text-muted-foreground">
                  Default Quality
                </Label>
                <Select
                  value={settings.defaultQuality}
                  onValueChange={(val) => handleUpdate({ defaultQuality: val })}
                >
                  <SelectTrigger id="default-quality-select" aria-label="Default Quality" className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="best">Best Available</SelectItem>
                    <SelectItem value="2160p">4K (2160p)</SelectItem>
                    <SelectItem value="1440p">2K (1440p)</SelectItem>
                    <SelectItem value="1080p">Full HD (1080p)</SelectItem>
                    <SelectItem value="720p">HD (720p)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Custom Download Directory */}
          <div className="flex flex-col gap-3 pt-2 border-t border-border/40">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground/90 uppercase tracking-wider">
              <Folder className="h-3.5 w-3.5 text-primary" />
              <span>Download Directory Path</span>
            </div>

            <div className="flex flex-col gap-2 p-3.5 rounded-xl border border-border/60 bg-muted/20 backdrop-blur-md">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2 overflow-hidden min-w-0">
                  <div className="p-2 rounded-lg bg-primary/10 border border-primary/20 text-primary shrink-0">
                    <FolderCheck className="h-4 w-4" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-bold text-foreground truncate">
                      {customDirName
                        ? `📁 Custom: ${customDirName}`
                        : "Browser Default (Downloads Folder)"}
                    </span>
                    <span className="text-[10px] text-muted-foreground truncate">
                      {customDirName
                        ? "Files will be saved directly into this folder handle"
                        : "Files are automatically saved directly to your Downloads folder"}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5 shrink-0">
                  {customDirName ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleResetDirectory}
                      className="h-8 text-xs px-2.5 rounded-lg text-muted-foreground hover:text-destructive"
                      title="Reset to default Downloads folder"
                    >
                      Reset Default
                    </Button>
                  ) : null}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleChooseDirectory}
                    className="h-8 text-xs gap-1.5 px-3 rounded-lg border-primary/40 bg-primary/10 text-primary font-bold hover:bg-primary/20"
                  >
                    <FolderSync className="h-3.5 w-3.5" />
                    {customDirName ? "Change Folder" : "Select Custom Folder"}
                  </Button>
                </div>
              </div>

              <span className="text-[10px] text-muted-foreground/80 leading-tight pt-1 border-t border-border/30">
                💡 <strong>Tip:</strong> Browser security blocks picking the
                root Downloads folder directly. To organize inside Downloads,
                create or pick a subfolder (e.g.{" "}
                <code className="bg-background px-1 py-0.5 rounded text-primary font-mono">
                  Downloads/VoidFetch
                </code>
                ).
              </span>
            </div>
          </div>

          {/* Network Concurrency */}
          <div className="flex flex-col gap-3 pt-2 border-t border-border/40">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground/90 uppercase tracking-wider">
              <Sparkles className="h-3.5 w-3.5 text-amber-500" />
              <span>Network Concurrency</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="concurrent-jobs-select" className="text-[11px] text-muted-foreground">
                  Concurrent Jobs
                </Label>
                <Select
                  value={String(settings.downloadConcurrency)}
                  onValueChange={(val) =>
                    handleUpdate({ downloadConcurrency: Number(val) })
                  }
                >
                  <SelectTrigger id="concurrent-jobs-select" aria-label="Concurrent Jobs" className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 Job at a time</SelectItem>
                    <SelectItem value="2">2 Concurrent Jobs</SelectItem>
                    <SelectItem value="3">
                      3 Concurrent Jobs (Default)
                    </SelectItem>
                    <SelectItem value="5">5 Concurrent Jobs</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="hls-concurrency-select" className="text-[11px] text-muted-foreground">
                  HLS Segment Concurrency
                </Label>
                <Select
                  value={String(settings.globalNetworkBudget)}
                  onValueChange={(val) =>
                    handleUpdate({ globalNetworkBudget: Number(val) })
                  }
                >
                  <SelectTrigger id="hls-concurrency-select" aria-label="HLS Segment Concurrency" className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="8">8 Workers (Slow network)</SelectItem>
                    <SelectItem value="18">18 Workers (Default)</SelectItem>
                    <SelectItem value="32">32 Workers (Ultra Fast)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Queue Behavior */}
          <div className="flex flex-col gap-3 pt-2 border-t border-border/40">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground/90 uppercase tracking-wider">
              <HardDrive className="h-3.5 w-3.5 text-emerald-500" />
              <span>Queue Behavior</span>
            </div>

            <label className="flex items-center justify-between p-2.5 rounded-xl bg-muted/40 border border-border/60 cursor-pointer hover:bg-muted/60 transition-colors">
              <div className="flex flex-col gap-0.5">
                <span className="text-xs font-medium text-foreground">
                  Continue Queue on Error
                </span>
                <span className="text-[10px] text-muted-foreground">
                  Skip failed links and continue downloading remaining jobs
                </span>
              </div>
              <input
                type="checkbox"
                checked={settings.continueOnError}
                onChange={(e) =>
                  handleUpdate({ continueOnError: e.target.checked })
                }
                className="h-4 w-4 rounded border-borderAccent text-primary focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 cursor-pointer"
              />
            </label>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-border/60">
          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
            <ShieldCheck className="h-3 w-3 text-emerald-500" />
            Changes saved to local workspace
          </span>
          <Button
            type="button"
            onClick={handleClose}
            className="h-9 px-5 text-xs font-semibold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
