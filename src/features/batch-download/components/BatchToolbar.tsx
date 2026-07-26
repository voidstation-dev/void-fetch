/**
 * VoidFetch
 * Copyright (c) 2026 VoidStation.
 * All rights reserved.
 */

import React from 'react';
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
  const store = useBatchStore();
  
  // Extract unique platforms from active jobs
  const platforms = Array.from(
    new Set(store.jobs.map((job) => job.platform).filter(Boolean))
  ) as string[];

  const draftOrFailedCount = store.jobs.filter(
    (job) => job.status === 'draft' || job.status === 'failed'
  ).length;

  const completedCount = store.jobs.filter(
    (job) => job.status === 'completed'
  ).length;

  const handleParseAll = () => {
    parseJobs();
  };

  return (
    <SpotlightCard className="p-5 rounded-2xl border border-border/80 bg-card/90 backdrop-blur-xl shadow-lg flex flex-col gap-4">
      {/* Search & Filters */}
      <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search title or URL..."
            value={store.searchQuery}
            onChange={(e) => store.setSearchQuery(e.target.value)}
            className="pl-9 h-9 text-xs rounded-xl bg-background/50 border-border/80 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all shadow-inner"
          />
        </div>

        <div className="flex gap-2 w-full md:w-auto justify-end">
          {/* Status Filter */}
          <Select
            value={store.statusFilter}
            onValueChange={(val) => store.setStatusFilter(val)}
          >
            <SelectTrigger className="w-full md:w-[140px] h-9 text-xs rounded-xl bg-background/50 border-border/80 shadow-2xs">
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
            value={store.platformFilter}
            onValueChange={(val) => store.setPlatformFilter(val)}
          >
            <SelectTrigger className="w-full md:w-[140px] h-9 text-xs capitalize rounded-xl bg-background/50 border-border/80 shadow-2xs">
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
          <RefreshCw className="h-3.5 w-3.5 text-primary" />
          Parse All ({draftOrFailedCount})
        </Button>

        <div className="h-4 w-[1px] bg-border/80 mx-1 hidden sm:block" />

        {store.isQueueRunning ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={store.pauseQueue}
            className="h-9 text-xs gap-1.5 px-4 rounded-xl border-amber-500/40 text-amber-600 dark:text-amber-400 bg-amber-500/5 hover:bg-amber-500/15 font-semibold transition-all"
          >
            <Pause className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
            Pause Queue
          </Button>
        ) : (
          <Button
            type="button"
            size="sm"
            disabled={store.jobs.filter((j) => j.status === 'ready' || j.status === 'paused').length === 0}
            onClick={store.startQueue}
            className="h-9 text-xs gap-1.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-md shadow-emerald-600/25 hover:shadow-lg hover:shadow-emerald-500/40 border-0 transition-all duration-200 transform active:scale-98 cursor-pointer disabled:opacity-50"
          >
            <Play className="h-3.5 w-3.5 text-white fill-white" />
            Start Queue
          </Button>
        )}

        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={store.jobs.filter((j) => j.status === 'failed').length === 0}
          onClick={store.retryFailedJobs}
          className="h-9 text-xs gap-1.5 px-3.5 rounded-xl border-amber-500/40 text-amber-600 dark:text-amber-400 bg-amber-500/5 hover:bg-amber-500/15 font-medium transition-all"
        >
          <RotateCcw className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
          Retry Failed
        </Button>

        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={completedCount === 0}
          onClick={store.clearCompleted}
          className="h-9 text-xs gap-1.5 px-3.5 rounded-xl ml-auto text-rose-600 dark:text-rose-400 border-rose-500/30 bg-rose-500/5 hover:bg-rose-500/15 hover:border-rose-500/50 transition-all"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Clear Completed ({completedCount})
        </Button>
      </div>
    </SpotlightCard>
  );
}
