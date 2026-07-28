/**
 * VoidFetch
 * Copyright (c) 2026 VoidStation.
 * All rights reserved.
 */

import React, { useMemo } from 'react';
import { useBatchStore } from '../store/batch-store';
import { Progress } from '@/components/ui/progress';
import { formatBytes, formatSpeed, formatEta } from '@/lib/utils';
import { Layers, Activity, CheckCircle2, AlertTriangle, Clock } from 'lucide-react';

export function BatchProgressBar() {
  const jobs = useBatchStore((s) => s.jobs);

  const stats = useMemo(() => {
    if (jobs.length === 0) return null;

    const total = jobs.length;
    let completed = 0;
    let downloading = 0;
    let queued = 0;
    let failed = 0;
    let totalSpeed = 0;
    let activeBytesDownloaded = 0;
    let activeBytesTotal = 0;

    for (const j of jobs) {
      if (j.status === 'completed') {
        completed++;
      } else if (
        j.status === 'downloading' ||
        j.status === 'resolving' ||
        j.status === 'processing' ||
        j.status === 'saving'
      ) {
        downloading++;
      } else if (j.status === 'queued') {
        queued++;
      } else if (j.status === 'failed') {
        failed++;
      }

      if (j.status === 'downloading' && j.progress.speedBytesPerSecond) {
        totalSpeed += j.progress.speedBytesPerSecond;
      }
      activeBytesDownloaded += j.progress.downloadedBytes || 0;
      activeBytesTotal += j.progress.totalBytes || 0;
    }

    const overallPercent = total > 0 ? Math.round((completed * 100) / total) : 0;

    let totalEtaSeconds: number | null = null;
    if (totalSpeed > 0) {
      const remainingBytes = activeBytesTotal - activeBytesDownloaded;
      if (remainingBytes > 0) {
        totalEtaSeconds = remainingBytes / totalSpeed;
      }
    }

    return {
      total,
      completed,
      downloading,
      queued,
      failed,
      overallPercent,
      totalSpeed,
      totalEtaSeconds,
    };
  }, [jobs]);

  if (!stats) return null;
  const { total, completed, downloading, queued, failed, overallPercent, totalSpeed, totalEtaSeconds } = stats;

  return (
    <div className="sticky bottom-3 z-30 w-full max-w-7xl mx-auto px-2">
      <div className="border bg-card/95 backdrop-blur-2xl border-border/80 p-4 rounded-2xl shadow-2xl flex flex-col md:flex-row gap-3 items-center justify-between text-xs text-muted-foreground">
        
        {/* Statistics Labels */}
        <div
          role="status"
          aria-live="polite"
          className="flex flex-wrap gap-2.5 items-center justify-center md:justify-start"
        >
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-muted/40 border border-border/50 text-foreground font-semibold" title="Total jobs">
            <Layers className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
            <span>{total} items</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-primary/10 border border-primary/20 text-primary font-semibold" title="Active downloads">
            <Activity className="h-3.5 w-3.5 animate-pulse" aria-hidden="true" />
            <span>{downloading} running</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 font-semibold" title="Queued downloads">
            <Clock className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{queued} queued</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 font-semibold" title="Completed downloads">
            <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{completed} completed</span>
          </div>
          {failed > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive font-semibold" title="Failed downloads">
              <AlertTriangle className="h-3.5 w-3.5 animate-bounce-slow" aria-hidden="true" />
              <span>{failed} failed</span>
            </div>
          )}
        </div>

        {/* Global Progress Bar */}
        <div className="flex-1 max-w-md w-full flex items-center gap-3">
          <Progress
            aria-label="Overall batch download progress"
            value={overallPercent}
            className="h-2 flex-1 bg-muted/60 rounded-full"
          />
          <span className="font-mono font-bold text-foreground shrink-0 text-sm">{overallPercent}%</span>
        </div>

        {/* Global Network Performance */}
        <div className="flex gap-4 items-center shrink-0">
          {totalSpeed > 0 ? (
            <>
              <div className="flex flex-col items-end">
                <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider">Speed</span>
                <span className="font-bold text-primary font-mono text-xs">{formatSpeed(totalSpeed)}</span>
              </div>
              {totalEtaSeconds ? (
                <div className="flex flex-col items-end border-l pl-3 border-border/60">
                  <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider">ETA</span>
                  <span className="font-bold text-foreground font-mono text-xs">{formatEta(totalEtaSeconds)}</span>
                </div>
              ) : null}
            </>
          ) : (
            <div className="px-3 py-1 rounded-xl bg-muted/30 border border-border/50 text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
              {downloading > 0 ? 'QUEUE ACTIVE' : 'QUEUE IDLE'}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
