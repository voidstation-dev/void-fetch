/**
 * VoidFetch
 * Copyright (c) 2026 VoidStation.
 * All rights reserved.
 */

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "@/lib/deferred-toast";
import { Copy, Terminal } from "lucide-react";
import type { DownloadJob } from "../types/batch-download";

interface JobErrorDialogProps {
  job: DownloadJob | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function JobErrorDialog({
  job,
  open,
  onOpenChange,
}: JobErrorDialogProps) {
  if (!job || !job.error) return null;

  const error = job.error;

  const handleCopy = async () => {
    const errorDetails = JSON.stringify(
      {
        jobId: job.id,
        url: job.sourceUrl,
        errorCode: error.code,
        message: error.message,
        httpStatus: error.httpStatus,
        requestId: error.requestId,
        details: error.details,
      },
      null,
      2,
    );

    try {
      await navigator.clipboard.writeText(errorDetails);
      toast.success("Error logs copied to clipboard");
    } catch {
      toast.error("Failed to copy error logs");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-card border-border/80 text-foreground">
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold flex items-center gap-2">
            <Terminal className="h-4 w-4 text-destructive animate-pulse" />
            JOB FAILURE DETAILS
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Error details for download job:{" "}
            {job.metadata?.title || job.sourceUrl}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3 my-2 text-xs">
          <div className="grid grid-cols-3 border-b border-border/50 pb-2">
            <span className="text-muted-foreground">Error Code</span>
            <span className="col-span-2 font-mono font-bold text-destructive">
              {error.code}
            </span>
          </div>

          {error.httpStatus && (
            <div className="grid grid-cols-3 border-b border-border/50 pb-2">
              <span className="text-muted-foreground">HTTP Status</span>
              <span className="col-span-2 font-mono">{error.httpStatus}</span>
            </div>
          )}

          {error.requestId && (
            <div className="grid grid-cols-3 border-b border-border/50 pb-2">
              <span className="text-muted-foreground">Request ID</span>
              <span className="col-span-2 font-mono">{error.requestId}</span>
            </div>
          )}

          <div className="flex flex-col gap-1">
            <span className="text-muted-foreground">Error Message</span>
            <div className="p-3 bg-background/50 border border-border/50 rounded-md font-mono text-destructive leading-relaxed whitespace-pre-wrap">
              {error.message}
            </div>
          </div>

          {Boolean(error.details) && (
            <div className="flex flex-col gap-1 mt-1">
              <span className="text-muted-foreground">Technical Details</span>
              <pre className="p-3 bg-background/80 border border-border/50 rounded-md font-mono text-[10px] text-muted-foreground overflow-auto max-h-[120px]">
                {JSON.stringify(error.details, null, 2)}
              </pre>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleCopy}
            className="text-xs gap-1.5"
          >
            <Copy className="h-3.5 w-3.5" />
            Copy Log
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="text-xs"
          >
            Dismiss
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
