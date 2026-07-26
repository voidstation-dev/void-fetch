/**
 * VoidFetch
 * Copyright (c) 2026 VoidStation.
 * All rights reserved.
 */

import { useBatchStore } from '../store/batch-store';
import { runJob } from './download-runner';
import type { DownloadJob } from '../types/batch-download';

class DownloadScheduler {
  private activeJobs = new Map<string, AbortController>();
  private isProcessing = false;

  /**
   * Main scheduling loop. Allocates slots and executes queued jobs.
   */
  public schedule(): void {
    if (this.isProcessing) return;
    this.isProcessing = true;

    try {
      const store = useBatchStore.getState();
      
      // Stop scheduling if queue is paused
      if (!store.isQueueRunning) {
        this.isProcessing = false;
        return;
      }

      const maxActive = store.settings.downloadConcurrency || 3;
      const activeCount = this.activeJobs.size;
      const availableSlots = maxActive - activeCount;

      if (availableSlots <= 0) {
        this.isProcessing = false;
        return;
      }

      // Grab ready/queued jobs and sort them by priority (higher priority first) then createdAt
      const queuedJobs = store.jobs
        .filter((job) => job.status === 'queued')
        .sort((a, b) => {
          if (b.priority !== a.priority) return b.priority - a.priority;
          return a.createdAt - b.createdAt;
        });

      const jobsToStart = queuedJobs.slice(0, availableSlots);

      for (const job of jobsToStart) {
        this.startJob(job);
      }
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Spawns a downloader for a specific job.
   */
  private async startJob(job: DownloadJob): Promise<void> {
    const store = useBatchStore.getState();
    
    // Safety check: don't double start
    if (this.activeJobs.has(job.id)) return;

    const controller = new AbortController();
    this.activeJobs.set(job.id, controller);

    try {
      // Execute the job runner
      await runJob(job, controller.signal);
    } catch (error) {
      console.error(`Scheduler caught runner exception for job ${job.id}:`, error);
    } finally {
      this.activeJobs.delete(job.id);
      
      // Trigger next job in the queue
      this.schedule();
    }
  }

  /**
   * Cancels a running or queued job.
   */
  public cancelJob(jobId: string): void {
    const controller = this.activeJobs.get(jobId);
    if (controller) {
      controller.abort();
      this.activeJobs.delete(jobId);
    }

    const store = useBatchStore.getState();
    const job = store.jobs.find((j) => j.id === jobId);
    if (job) {
      if (job.status === 'queued' || job.status === 'downloading' || job.status === 'resolving' || job.status === 'processing' || job.status === 'saving') {
        store.updateJobStatus(jobId, 'cancelled');
      }
    }
    this.schedule();
  }

  /**
   * Pauses an active job or reverts a queued job to paused.
   */
  public pauseJob(jobId: string): void {
    const controller = this.activeJobs.get(jobId);
    if (controller) {
      controller.abort();
      this.activeJobs.delete(jobId);
    }

    const store = useBatchStore.getState();
    const job = store.jobs.find((j) => j.id === jobId);
    if (job) {
      store.updateJobStatus(jobId, 'paused');
    }
    this.schedule();
  }

  /**
   * Aborts all active jobs and halts scheduling.
   */
  public stopAll(): void {
    this.activeJobs.forEach((controller) => {
      controller.abort();
    });
    this.activeJobs.clear();
  }
}

// Export a singleton scheduler instance
export const downloadScheduler = new DownloadScheduler();

// Subscribe to store changes to trigger scheduling when queue status changes
if (typeof window !== 'undefined') {
  useBatchStore.subscribe((state) => {
    if (state.isQueueRunning && state.jobs.some((j) => j.status === 'queued')) {
      downloadScheduler.schedule();
    }
  });
}
