"use client";

import type { ChangeEvent, DragEvent, ReactNode } from "react";

import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";
import { formatBytes } from "@/lib/utils";

import { FileDropzone } from "./file-dropzone";

interface FileExtractPanelProps {
  selectedFile: File | null;
  inputId: string;
  isBusy: boolean;
  statusPanel: ReactNode;
  onSelect: (event: ChangeEvent<HTMLInputElement>) => void;
  onDrop: (event: DragEvent<HTMLDivElement>) => void;
  onDragOver: (event: DragEvent<HTMLDivElement>) => void;
  onClear: () => void;
  onSubmit: () => void;
}

export function FileExtractPanel({
  selectedFile,
  inputId,
  isBusy,
  statusPanel,
  onSelect,
  onDrop,
  onDragOver,
  onClear,
  onSubmit,
}: FileExtractPanelProps) {
  const tAudioTool = useTranslations("audioTool");

  return (
    <div className="space-y-4">
      <FileDropzone
        acceptedFile={selectedFile}
        title={tAudioTool("videoFile")}
        hint={tAudioTool("dropHint")}
        limitText={tAudioTool("fileSizeLimit")}
        emptyButtonLabel={
          selectedFile
            ? tAudioTool("changeFileButton")
            : tAudioTool("selectFileButton")
        }
        selectedLabel={
          selectedFile
            ? tAudioTool("fileSelected", {
                name: selectedFile.name,
                size: formatBytes(selectedFile.size),
              })
            : ""
        }
        inputId={inputId}
        accept="video/*,.mp4,.webm,.mov,.mkv,.avi,.mpeg,.mpg"
        isBusy={isBusy}
        onSelect={onSelect}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onClear={onClear}
      />

      {statusPanel}

      <Button
        type="button"
        className="w-full flex items-center justify-center gap-2"
        onClick={onSubmit}
        disabled={isBusy || !selectedFile}
      >
        {isBusy && <Loader2 className="h-4 w-4 animate-spin" />}
        {isBusy ? tAudioTool("processingButton") : tAudioTool("submitButton")}
      </Button>
    </div>
  );
}
