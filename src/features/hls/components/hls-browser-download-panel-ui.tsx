"use client";

import { AlertCircle, CheckCircle2, ListVideo, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { formatEta, formatSpeed } from "@/lib/utils";
import type { ReactNode } from "react";

export interface HlsBrowserDownloadPanelViewProps {
  failed: boolean;
  isBusy: boolean;
  progress: number;
  status: string;
  speedBytesPerSecond?: number | null;
  etaSeconds?: number | null;
  autorun?: boolean;
  tHls: (key: string, values?: Record<string, string | number>) => ReactNode;
  handleStart: () => void;
}

export function HlsBrowserDownloadPanelView(
  props: HlsBrowserDownloadPanelViewProps,
) {
  const {
    failed,
    isBusy,
    progress,
    status,
    speedBytesPerSecond,
    etaSeconds,
    autorun,
    tHls,
    handleStart,
  } = props;

  return (
    <div className="space-y-5">
      <div className="rounded-md border bg-muted/30 p-3 space-y-3">
        <div className="flex items-start gap-2 text-sm">
          {failed ? (
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
          ) : isBusy ? (
            <Loader2 className="mt-0.5 h-4 w-4 shrink-0 animate-spin" />
          ) : progress === 100 ? (
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
          ) : (
            <ListVideo className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
          )}
          <div className="min-w-0 space-y-1">
            <div className="font-medium">{tHls("statusLabel")}</div>
            <p className="wrap-break-word text-muted-foreground">{status}</p>
          </div>
        </div>
        <Progress value={progress} />
        <div className="grid grid-cols-3 gap-3 text-xs text-muted-foreground sm:text-sm">
          <div className="rounded-md bg-background/60 px-3 py-2">
            <div>{tHls("progressLabel")}</div>
            <div className="mt-1 font-medium text-foreground">{progress}%</div>
          </div>
          <div className="rounded-md bg-background/60 px-3 py-2">
            <div>{tHls("speedLabel")}</div>
            <div className="mt-1 font-medium text-foreground">
              {speedBytesPerSecond
                ? formatSpeed(speedBytesPerSecond)
                : tHls("calculatingLabel")}
            </div>
          </div>
          <div className="rounded-md bg-background/60 px-3 py-2">
            <div>{tHls("etaLabel")}</div>
            <div className="mt-1 font-medium text-foreground">
              {etaSeconds == null
                ? tHls("calculatingLabel")
                : formatEta(etaSeconds)}
            </div>
          </div>
        </div>
      </div>

      {failed || (!autorun && !isBusy && progress === 0) ? (
        <div className="flex justify-end">
          <Button onClick={() => void handleStart()} disabled={isBusy}>
            {isBusy ? tHls("downloadingButton") : tHls("downloadButton")}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
