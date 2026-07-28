/**
 * VoidFetch
 * Copyright (c) 2026 VoidStation.
 * All rights reserved.
 */

import React, { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Trash2, 
  Search, 
  RefreshCw 
} from 'lucide-react';
import { useBatchStore } from '../store/batch-store';
import { parseJobs } from '../services/parse-worker-pool';

import { SpotlightCard } from '@/components/ui/spotlight-card';

export function BatchToolbar() {
  const jobs = useBatchStore((s) => s.jobs);
  const searchQuery = useBatchStore((s) => s.searchQuery);
  const statusFilter = useBatchStore((s) => s.statusFilter);
  const platformFilter = useBatchStore((s) => s.platformFilter);
  const isQueueRunning = useBatchStore((s) => s.isQueueRunning);
  const setSearchQuery = useBatchStore((s) => s.setSearchQuery);
  const setStatusFilter = useBatchStore((s) => s.setStatusFilter);
  const setPlatformFilter = useBatchStore((s) => s.setPlatformFilter);
  const startQueue = useBatchStore((s) => s.startQueue);
  const pauseQueue = useBatchStore((s) => s.pauseQueue);
  const retryFailedJobs = useBatchStore((s) => s.retryFailedJobs);
  const clearCompleted = useBatchStore((s) => s.clearCompleted);

  // Single-pass computation for platforms and counts
  const { platforms, draftOrFailedCount, completedCount, readyOrPausedCount, failedCount } = useMemo(() => {
    const platformSet = new Set<string>();
    let draftOrFailed = 0;
    let completed = 0;
    let readyOrPaused = 0;
    let failed = 0;

    for (const job of jobs) {
      if (job.platform) {
        platformSet.add(job.platform);
      }
      if (job.status === 'draft' || job.status === 'failed') {
        draftOrFailed++;
      }
      if (job.status === 'completed') {
        completed++;
      }
      if (job.status === 'ready' || job.status === 'paused') {
        readyOrPaused++;
      }
      if (job.status === 'failed' || job.status === 'cancelled') {
        failed++;
      }
    }

    return {
      platforms: Array.from(platformSet),
      draftOrFailedCount: draftOrFailed,
      completedCount: completed,
      readyOrPausedCount: readyOrPaused,
      failedCount: failed,
    };
  }, [jobs]);

  const handleParseAll = () => {
    parseJobs();
  };

  return (
    <SpotlightCard className="p-5 rounded-2xl border border-border/80 bg-card/90 backdrop-blur-xl shadow-lg flex flex-col gap-4">
      {/* Search & Filters */}
      <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" aria-hidden="true" />
          <Input
            aria-label="Search title or URL…"
            placeholder="Search title or URL…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 text-xs rounded-xl bg-background/50 border-border/80 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all shadow-inner"
          />
        </div>

        <div className="flex gap-2 w-full md:w-auto justify-end">
          {/* Status Filter */}
          <Select
            value={statusFilter}
            onValueChange={(val) => setStatusFilter(val)}
          >
            <SelectTrigger aria-label="Filter by job status" className="w-full md:w-[140px] h-9 text-xs rounded-xl bg-background/50 border-border/80 shadow-2xs">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="parsing">Parsing</SelectItem>
              <SelectItem value="ready">Ready</SelectItem>
              <SelectItem value="queued">Queued</SelectItem>
              <SelectItem value="downloading">Downloading</SelectItem>
              <SelectItem value="processing">Processing</SelectItem>
              <SelectItem value="saving">Saving</SelectItem>
              <SelectItem value="paused">Paused</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>

          {/* Platform Filter */}
          <Select
            value={platformFilter}
            onValueChange={(val) => setPlatformFilter(val)}
          >
            <SelectTrigger aria-label="Filter by platform" className="w-full md:w-[140px] h-9 text-xs capitalize rounded-xl bg-background/50 border-border/80 shadow-2xs">
              <SelectValue placeholder="All Platforms" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="all">All Platforms</SelectItem>
              {platforms.map((p) => (
                <SelectItem key={p} value={p} className="capitalize">
                  {p}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2 items-center pt-1 border-t border-border/40">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={draftOrFailedCount === 0}
          onClick={handleParseAll}
          className="h-9 text-xs gap-1.5 px-3.5 rounded-xl border-border/60 bg-muted/30 hover:bg-muted/80 shadow-2xs"
        >
          <RefreshCw className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
          Parse All ({draftOrFailedCount})
        </Button>

        <div className="h-4 w-[1px] bg-border/80 mx-1 hidden sm:block" />

        {isQueueRunning ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={pauseQueue}
            className="h-9 text-xs gap-1.5 px-4 rounded-xl border-amber-500/40 text-amber-600 dark:text-amber-400 bg-amber-500/5 hover:bg-amber-500/15 font-semibold transition-all"
          >
            <Pause className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" aria-hidden="true" />
            Pause Queue
          </Button>
        ) : (
          <Button
            type="button"
            size="sm"
            disabled={readyOrPausedCount === 0}
            onClick={startQueue}
            className="h-9 text-xs gap-1.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-md shadow-emerald-600/25 hover:shadow-lg hover:shadow-emerald-500/40 border-0 transition-all duration-200 transform active:scale-98 cursor-pointer disabled:opacity-50"
          >
            <Play className="h-3.5 w-3.5 text-white fill-white" aria-hidden="true" />
            Start Queue
          </Button>
        )}

        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={failedCount === 0}
          onClick={retryFailedJobs}
          className="h-9 text-xs gap-1.5 px-3.5 rounded-xl border-amber-500/40 text-amber-600 dark:text-amber-400 bg-amber-500/5 hover:bg-amber-500/15 font-medium transition-all"
        >
          <RotateCcw className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" aria-hidden="true" />
          Retry ({failedCount})
        </Button>

        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={completedCount === 0}
          onClick={clearCompleted}
          className="h-9 text-xs gap-1.5 px-3.5 rounded-xl ml-auto text-rose-600 dark:text-rose-400 border-rose-500/30 bg-rose-500/5 hover:bg-rose-500/15 hover:border-rose-500/50 transition-all"
        >
          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
          Clear Completed ({completedCount})
        </Button>
      </div>
    </SpotlightCard>
  );
}
