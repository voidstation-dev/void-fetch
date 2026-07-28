/**
 * VoidFetch
 * Copyright (c) 2026 VoidStation.
 * All rights reserved.
 */

import React from 'react';
import { useBatchStore } from '../store/batch-store';
import { Progress } from '@/components/ui/progress';
import { formatBytes } from '@/lib/utils';
import { Layers, Activity, CheckCircle2, AlertTriangle, Clock } from 'lucide-react';
import { useTranslations } from 'next-intl';

export function BatchProgressBar() {
  const t = useTranslations('batchWorkspace.progress');
  const store = useBatchStore();
  const jobs = store.jobs;
  
  if (jobs.length === 0) return null;

  const total = jobs.length;
  const completed = jobs.filter((j) => j.status === 'completed').length;
  const downloading = jobs.filter((j) => j.status === 'downloading' || j.status === 'resolving' || j.status === 'processing' || j.status === 'saving').length;
  const queued = jobs.filter((j) => j.status === 'queued').length;
  const failed = jobs.filter((j) => j.status === 'failed').length;

  // Calculate overall progress percentage based on completed jobs
  const overallPercent = total > 0 ? Math.round((completed * 100) / total) : 0;

  // Aggregate speeds and remaining bytes
  let totalSpeed = 0;
  let activeJobsWithSpeed = 0;

  jobs.forEach((job) => {
    if (job.status === 'downloading' && job.progress.speedBytesPerSecond) {
      totalSpeed += job.progress.speedBytesPerSecond;
      activeJobsWithSpeed++;
    }
  });

  // Calculate overall ETA
  let totalEtaSeconds: number | null = null;
  const remainingJobs = total - completed;

  if (totalSpeed > 0) {
    // Estimate based on average sizes
    const activeBytesDownloaded = jobs.reduce((sum, j) => sum + (j.progress.downloadedBytes || 0), 0);
    const activeBytesTotal = jobs.reduce((sum, j) => sum + (j.progress.totalBytes || 0), 0);
    const remainingBytes = activeBytesTotal - activeBytesDownloaded;
    
    if (remainingBytes > 0) {
      totalEtaSeconds = remainingBytes / totalSpeed;
    }
  }

  const formatSpeed = (bytesPerSec: number) => {
    if (bytesPerSec <= 0) return '0 KB/s';
    if (bytesPerSec < 1024 * 1024) return `${(bytesPerSec / 1024).toFixed(1)} KB/s`;
    return `${(bytesPerSec / (1024 * 1024)).toFixed(1)} MB/s`;
  };

  const formatEta = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  return (
    <div className="sticky bottom-3 z-30 w-full max-w-7xl mx-auto px-2">
      <div className="border bg-card/95 backdrop-blur-2xl border-border/80 p-4 rounded-2xl shadow-2xl flex flex-col md:flex-row gap-3 items-center justify-between text-xs text-muted-foreground">
        
        {/* Statistics Labels */}
        <div className="flex flex-wrap gap-2.5 items-center justify-center md:justify-start">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-muted/40 border border-border/50 text-foreground font-semibold" title="Total jobs">
            <Layers className="h-3.5 w-3.5 text-muted-foreground" />
            <span>{t('totalItems', { count: total })}</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-primary/10 border border-primary/20 text-primary font-semibold" title="Active downloads">
            <Activity className="h-3.5 w-3.5 animate-pulse" />
            <span>{t('running', { count: downloading })}</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 font-semibold" title="Queued downloads">
            <Clock className="h-3.5 w-3.5" />
            <span>{t('queued', { count: queued })}</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 font-semibold" title="Completed downloads">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>{t('completed', { count: completed })}</span>
          </div>
          {failed > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive font-semibold" title="Failed downloads">
              <AlertTriangle className="h-3.5 w-3.5 animate-bounce-slow" />
              <span>{t('failed', { count: failed })}</span>
            </div>
          )}
        </div>

        {/* Global Progress Bar */}
        <div className="flex-1 max-w-md w-full flex items-center gap-3">
          <Progress value={overallPercent} className="h-2 flex-1 bg-muted/60 rounded-full" />
          <span className="font-mono font-bold text-foreground shrink-0 text-sm">{overallPercent}%</span>
        </div>

        {/* Global Network Performance */}
        <div className="flex gap-4 items-center shrink-0">
          {totalSpeed > 0 ? (
            <>
              <div className="flex flex-col items-end">
                <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider">{t('speed')}</span>
                <span className="font-bold text-primary font-mono text-xs">{formatSpeed(totalSpeed)}</span>
              </div>
              {totalEtaSeconds ? (
                <div className="flex flex-col items-end border-l pl-3 border-border/60">
                  <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider">{t('eta')}</span>
                  <span className="font-bold text-foreground font-mono text-xs">{formatEta(totalEtaSeconds)}</span>
                </div>
              ) : null}
            </>
          ) : (
            <div className="px-3 py-1 rounded-xl bg-muted/30 border border-border/50 text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
              {downloading > 0 ? t('queueActive') : t('queueIdle')}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
