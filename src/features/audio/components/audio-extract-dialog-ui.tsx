"use client";

import * as Tabs from "@radix-ui/react-tabs";
import { FileExtractPanel } from "./file-extract-panel";
import { MergePanel } from "./merge-panel";
import { ResultAutoExtractPanel } from "./result-auto-extract-panel";
import type {
  AudioExtractTask,
  AudioToolStage,
  ExtractMode,
  ResultTaskAction,
} from "./types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import React from "react";

type TranslationFn = (
  key: string,
  values?: Record<string, string | number>,
) => string | React.ReactNode;

export interface AudioExtractDialogViewProps {
  open: boolean;
  entry?: "toolbar" | "result";
  autoExtractTask?: AudioExtractTask | null;
  tAudioTool: TranslationFn;
  tExtractAudio: TranslationFn;
  tHistory: TranslationFn;
  tResult: TranslationFn;
  mode: ExtractMode;
  setMode: (mode: ExtractMode) => void;
  stage: AudioToolStage;
  isBusy: boolean;
  statusPanel: React.ReactNode;
  selectedFile: File | null;
  extractFileInputId: string;
  handleExtractFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleExtractFileDrop: (e: React.DragEvent<HTMLDivElement>) => void;
  handleClearExtractFile: () => void;
  handleExtractFile: () => void;
  mergeVideoFile: File | null;
  mergeAudioFile: File | null;
  mergeVideoInputId: string;
  mergeAudioInputId: string;
  handleMergeVideoSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleMergeAudioSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleMergeVideoDrop: (e: React.DragEvent<HTMLDivElement>) => void;
  handleMergeAudioDrop: (e: React.DragEvent<HTMLDivElement>) => void;
  handleClearMergeVideo: () => void;
  handleClearMergeAudio: () => void;
  handleMerge: () => void;
  handleDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
  handleDialogOpenChange: (open: boolean) => void;
  toolbarDescription: string;
  resultTaskAction: ResultTaskAction | null;
  runAutoExtractTask: () => void;
}

export function AudioExtractDialogView(props: AudioExtractDialogViewProps) {
  const {
    open,
    entry,
    autoExtractTask,
    tAudioTool,
    tExtractAudio,
    tHistory,
    tResult,
    mode,
    setMode,
    stage,
    isBusy,
    statusPanel,
    selectedFile,
    extractFileInputId,
    handleExtractFileSelect,
    handleExtractFileDrop,
    handleClearExtractFile,
    handleExtractFile,
    mergeVideoFile,
    mergeAudioFile,
    mergeVideoInputId,
    mergeAudioInputId,
    handleMergeVideoSelect,
    handleMergeAudioSelect,
    handleMergeVideoDrop,
    handleMergeAudioDrop,
    handleClearMergeVideo,
    handleClearMergeAudio,
    handleMerge,
    handleDragOver,
    handleDialogOpenChange,
    toolbarDescription,
    resultTaskAction,
    runAutoExtractTask,
  } = props;

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogContent
        className="flex max-h-[calc(100vh-2rem)] max-w-2xl flex-col overflow-hidden p-4 sm:max-h-[90vh] sm:p-6"
        onInteractOutside={(event) => {
          event.preventDefault();
        }}
      >
        <DialogHeader>
          <DialogTitle>
            {entry === "result"
              ? resultTaskAction === "merge-video"
                ? tResult("mergeDownloadVideo")
                : tExtractAudio("button")
              : tAudioTool("title")}
          </DialogTitle>
          <DialogDescription>
            {entry === "result"
              ? autoExtractTask?.title ||
                autoExtractTask?.videoUrl ||
                tHistory("unknownTitle")
              : toolbarDescription}
          </DialogDescription>
        </DialogHeader>

        <div
          className="flex-1 min-h-0 overflow-y-auto pr-1"
          style={{ paddingBottom: "max(env(safe-area-inset-bottom), 0px)" }}
        >
          {entry === "result" && autoExtractTask ? (
            <ResultAutoExtractPanel
              task={autoExtractTask}
              stage={stage}
              isBusy={isBusy}
              statusPanel={statusPanel}
              onRetry={() => void runAutoExtractTask()}
            />
          ) : (
            <Tabs.Root
              value={mode}
              onValueChange={(value) => setMode(value as ExtractMode)}
              className="space-y-4"
            >
              <Tabs.List className="grid grid-cols-2 rounded-lg bg-muted p-1">
                <Tabs.Trigger
                  value="file"
                  className={cn(
                    "inline-flex items-center justify-center rounded-md px-3 py-1.5 text-sm font-medium transition-all",
                    mode === "file"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {tAudioTool("fileTab")}
                </Tabs.Trigger>
                <Tabs.Trigger
                  value="merge"
                  className={cn(
                    "inline-flex items-center justify-center rounded-md px-3 py-1.5 text-sm font-medium transition-all",
                    mode === "merge"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {tAudioTool("mergeTab")}
                </Tabs.Trigger>
              </Tabs.List>

              <Tabs.Content
                value="file"
                className="space-y-4 focus:outline-none"
              >
                <FileExtractPanel
                  selectedFile={selectedFile}
                  inputId={extractFileInputId}
                  isBusy={isBusy}
                  statusPanel={statusPanel}
                  onSelect={handleExtractFileSelect}
                  onDrop={handleExtractFileDrop}
                  onDragOver={handleDragOver}
                  onClear={handleClearExtractFile}
                  onSubmit={() => void handleExtractFile()}
                />
              </Tabs.Content>

              <Tabs.Content
                value="merge"
                className="space-y-4 focus:outline-none"
              >
                <MergePanel
                  mergeVideoFile={mergeVideoFile}
                  mergeAudioFile={mergeAudioFile}
                  videoInputId={mergeVideoInputId}
                  audioInputId={mergeAudioInputId}
                  isBusy={isBusy}
                  statusPanel={statusPanel}
                  onVideoSelect={handleMergeVideoSelect}
                  onAudioSelect={handleMergeAudioSelect}
                  onVideoDrop={handleMergeVideoDrop}
                  onAudioDrop={handleMergeAudioDrop}
                  onDragOver={handleDragOver}
                  onClearVideo={handleClearMergeVideo}
                  onClearAudio={handleClearMergeAudio}
                  onSubmit={() => void handleMerge()}
                />
              </Tabs.Content>
            </Tabs.Root>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
