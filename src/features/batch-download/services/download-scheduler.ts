/**
 * VoidFetch
 * Copyright (c) 2026 VoidStation.
 * All rights reserved.
 */

import type {
  DownloadJob,
  BatchSettings,
  DownloadProgress,
  DownloadJobStatus,
  DownloadError,
} from "../types/batch-download";
import type { RunnerContext } from "./download-runner";

export interface SchedulerCallbacks {
  getJobs: () => DownloadJob[];
  getSettings: () => BatchSettings;
  isQueueRunning: () => boolean;
  checkQueueFinished: () => void;
  updateJobStatus: (
    id: string,
    status: DownloadJobStatus,
    extra?: Partial<DownloadJob>,
  ) => Promise<void>;
  updateJobProgress: (id: string, progress: Partial<DownloadProgress>) => void;
  updateJobError: (
    id: string,
    error: DownloadError | undefined,
  ) => Promise<void>;
}
import { runJob } from "./download-runner";

class DownloadScheduler {
  private callbacks: SchedulerCallbacks | null = null;

  public init(callbacks: SchedulerCallbacks) {
    this.callbacks = callbacks;
    this.schedule();
  }
  private activeJobs = new Map<string, AbortController>();
  private isProcessing = false;

  /**
   * Main scheduling loop. Allocates slots and executes queued jobs.
   */
  public schedule(): void {
    if (this.isProcessing) return;
    this.isProcessing = true;

    try {
      if (!this.callbacks) {
        this.isProcessing = false;
        return;
      }

      // Stop scheduling if queue is paused
      if (!this.callbacks.isQueueRunning()) {
        this.isProcessing = false;
        return;
      }

      const maxActive = this.callbacks.getSettings().downloadConcurrency || 3;
      const activeCount = this.activeJobs.size;
      const availableSlots = maxActive - activeCount;

      if (availableSlots <= 0) {
        this.isProcessing = false;
        return;
      }

      // Grab ready/queued jobs and sort them by priority (higher priority first) then createdAt
      const queuedJobs = this.callbacks
        .getJobs()
        .filter((job) => job.status === "queued")
        .sort((a, b) => {
          if (b.priority !== a.priority) return b.priority - a.priority;
          return a.createdAt - b.createdAt;
        });

      const jobsToStart = queuedJobs.slice(0, availableSlots);

      // We make the schedule function async to allow staggering, but we don't want to block the caller.
      // So we use an IIFE (Immediately Invoked Function Expression) to handle the staggering.
      (async () => {
        for (const job of jobsToStart) {
          if (!this.callbacks?.isQueueRunning()) break;
          this.startJob(job);
          // 50ms stagger to avoid network/DNS spikes when starting multiple jobs simultaneously
          await new Promise((r) => setTimeout(r, 50));
        }

        if (queuedJobs.length === 0 && this.activeJobs.size === 0) {
          this.callbacks?.checkQueueFinished();
        }
      })();
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Spawns a downloader for a specific job.
   */
  private async startJob(job: DownloadJob): Promise<void> {
    if (!this.callbacks) return;

    // Safety check: don't double start
    if (this.activeJobs.has(job.id)) return;

    const controller = new AbortController();
    this.activeJobs.set(job.id, controller);

    try {
      // Execute the job runner
      const context: RunnerContext = {
        settings: this.callbacks.getSettings(),
        activeJobsCount: this.activeJobs.size,
        jobIndex: this.callbacks.getJobs().findIndex((j) => j.id === job.id),
        updateJobStatus: this.callbacks.updateJobStatus,
        updateJobProgress: this.callbacks.updateJobProgress,
        updateJobError: this.callbacks.updateJobError,
      };
      await runJob(job, controller.signal, context);
    } catch (error) {
      console.error(
        `Scheduler caught runner exception for job ${job.id}:`,
        error,
      );
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

    if (!this.callbacks) return;
    const job = this.callbacks.getJobs().find((j) => j.id === jobId);
    if (job) {
      if (
        job.status === "queued" ||
        job.status === "downloading" ||
        job.status === "resolving" ||
        job.status === "processing" ||
        job.status === "saving"
      ) {
        this.callbacks.updateJobStatus(jobId, "cancelled");
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

    if (!this.callbacks) return;
    const job = this.callbacks.getJobs().find((j) => j.id === jobId);
    if (job) {
      this.callbacks.updateJobStatus(jobId, "paused");
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

// Scheduler will be explicitly triggered by the store instead of subscribing directly.
