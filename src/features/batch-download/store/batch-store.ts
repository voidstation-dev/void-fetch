/**
 * VoidFetch
 * Copyright (c) 2026 VoidStation.
 * All rights reserved.
 */

import { create } from 'zustand';
import type { 
  DownloadJob, 
  DownloadConfig, 
  DownloadProgress, 
  DownloadError, 
  BatchSettings, 
  DownloadJobStatus,
  OutputType
} from '../types/batch-download';
import { 
  saveJob, 
  saveJobs, 
  deleteJobs, 
  getAllJobs, 
  saveProject, 
  getProject, 
  clearJobs 
} from '../services/job-persistence';

interface BatchStoreState {
  jobs: DownloadJob[];
  selectedJobIds: string[];
  isQueueRunning: boolean;
  isInitialized: boolean;
  
  // Settings
  settings: BatchSettings;
  
  // Filters
  searchQuery: string;
  statusFilter: string; // "all" or DownloadJobStatus
  platformFilter: string; // "all" or platform name

  // Active UI states
  activeJobDrawerId: string | null;
  isSettingsOpen: boolean;
}

interface BatchStoreActions {
  initializeStore: () => Promise<void>;
  addJobs: (jobsToAdd: Omit<DownloadJob, 'createdAt' | 'updatedAt' | 'progress' | 'retryCount'>[]) => Promise<void>;
  removeJobs: (ids: string[]) => Promise<void>;
  clearCompleted: () => Promise<void>;
  updateJobConfig: (id: string, config: Partial<DownloadConfig>) => Promise<void>;
  updateJobStatus: (id: string, status: DownloadJobStatus, extra?: Partial<DownloadJob>) => Promise<void>;
  updateJobProgress: (id: string, progress: Partial<DownloadProgress>) => void;
  updateJobError: (id: string, error: DownloadError | undefined) => Promise<void>;
  
  // Selection
  toggleJobSelection: (id: string) => void;
  toggleAllSelection: (visibleJobIds: string[]) => void;
  clearSelection: () => void;
  
  // Bulk configuration
  applyConfigToSelected: (config: Partial<DownloadConfig>) => Promise<void>;
  applyConfigToAll: (config: Partial<DownloadConfig>) => Promise<void>;

  // Queue Operations
  startQueue: () => void;
  pauseQueue: () => void;
  retryFailedJobs: () => Promise<void>;
  retryJob: (id: string) => Promise<void>;
  
  // Settings & Filters
  updateSettings: (settings: Partial<BatchSettings>) => Promise<void>;
  setSearchQuery: (query: string) => void;
  setStatusFilter: (filter: string) => void;
  setPlatformFilter: (filter: string) => void;
  setActiveJobDrawerId: (id: string | null) => void;
  setIsSettingsOpen: (open: boolean) => void;
}

export type BatchStore = BatchStoreState & BatchStoreActions;

const DEFAULT_SETTINGS: BatchSettings = {
  parseConcurrency: 4,
  downloadConcurrency: 3,
  globalNetworkBudget: 18,
  defaultOutputType: 'mp4',
  defaultQuality: '1080p',
  filenameTemplate: '{index} - {title}',
  continueOnError: true,
  autoStartDownloads: false,
};

export const useBatchStore = create<BatchStore>((set, get) => ({
  jobs: [],
  selectedJobIds: [],
  isQueueRunning: false,
  isInitialized: true,
  settings: DEFAULT_SETTINGS,
  searchQuery: '',
  statusFilter: 'all',
  platformFilter: 'all',
  activeJobDrawerId: null,
  isSettingsOpen: false,

  setIsSettingsOpen: (open: boolean) => set({ isSettingsOpen: open }),

  initializeStore: async () => {
    if (get().isInitialized) return;
    const start = Date.now();
    try {
      const loadedJobs = await getAllJobs();
      
      // Load settings from a default project record or localStorage
      let loadedSettings = DEFAULT_SETTINGS;
      const projectRecord = await getProject('default-project');
      if (projectRecord) {
        loadedSettings = projectRecord.settings;
      } else {
        // Save initial default project
        await saveProject({
          id: 'default-project',
          name: 'Default Workspace',
          createdAt: Date.now(),
          updatedAt: Date.now(),
          settings: DEFAULT_SETTINGS,
          jobIds: loadedJobs.map(j => j.id),
        });
      }

      set({
        jobs: loadedJobs,
        settings: loadedSettings,
        isInitialized: true,
      });
    } catch (error) {
      console.error('Failed to initialize VoidFetch store:', error);
      set({ isInitialized: true });
    }
  },

  addJobs: async (jobsToAdd) => {
    const now = Date.now();
    const newJobs: DownloadJob[] = jobsToAdd.map((job) => ({
      ...job,
      createdAt: now,
      updatedAt: now,
      retryCount: 0,
      progress: {
        percent: 0,
        downloadedBytes: 0,
      },
    }));

    await saveJobs(newJobs);
    
    set((state) => ({
      jobs: [...state.jobs, ...newJobs],
    }));
  },

  removeJobs: async (ids) => {
    await deleteJobs(ids);
    set((state) => ({
      jobs: state.jobs.filter((job) => !ids.includes(job.id)),
      selectedJobIds: state.selectedJobIds.filter((id) => !ids.includes(id)),
    }));
  },

  clearCompleted: async () => {
    const completedJobIds = get().jobs
      .filter((job) => job.status === 'completed')
      .map((job) => job.id);
    
    await deleteJobs(completedJobIds);
    set((state) => ({
      jobs: state.jobs.filter((job) => job.status !== 'completed'),
      selectedJobIds: state.selectedJobIds.filter((id) => !completedJobIds.includes(id)),
    }));
  },

  updateJobConfig: async (id, configUpdates) => {
    const updatedJobs = get().jobs.map((job) => {
      if (job.id === id) {
        const updatedConfig = { ...job.config, ...configUpdates };
        const updatedJob = {
          ...job,
          config: updatedConfig,
          updatedAt: Date.now(),
        };
        saveJob(updatedJob); // fire & forget
        return updatedJob;
      }
      return job;
    });

    set({ jobs: updatedJobs });
  },

  updateJobStatus: async (id, status, extra) => {
    const now = Date.now();
    const updatedJobs = get().jobs.map((job) => {
      if (job.id === id) {
        const updatedJob: DownloadJob = {
          ...job,
          ...extra,
          status,
          updatedAt: now,
        };
        if (status === 'downloading' || status === 'resolving' || status === 'parsing') {
          if (!updatedJob.startedAt) {
            updatedJob.startedAt = now;
          }
        }
        if (status === 'completed' || status === 'failed' || status === 'cancelled') {
          updatedJob.completedAt = now;
        }
        saveJob(updatedJob); // fire & forget
        return updatedJob;
      }
      return job;
    });

    set({ jobs: updatedJobs });
  },

  updateJobProgress: (id, progressUpdates) => {
    // Keep updates clientside-only in memory to avoid constant IndexedDB disk thrashing.
    // The scheduler or periodic snapshot can sync final states.
    set((state) => {
      const targetJob = state.jobs.find((j) => j.id === id);
      if (!targetJob) return state;

      const newProgress = { ...targetJob.progress, ...progressUpdates };
      return {
        jobs: state.jobs.map((job) =>
          job.id === id ? { ...job, progress: newProgress } : job
        ),
      };
    });
  },

  updateJobError: async (id, error) => {
    const updatedJobs = get().jobs.map((job) => {
      if (job.id === id) {
        const updatedJob = {
          ...job,
          status: error ? ('failed' as const) : job.status,
          error,
          updatedAt: Date.now(),
        };
        saveJob(updatedJob);
        return updatedJob;
      }
      return job;
    });

    set({ jobs: updatedJobs });
  },

  toggleJobSelection: (id) => {
    set((state) => {
      const isSelected = state.selectedJobIds.includes(id);
      return {
        selectedJobIds: isSelected
          ? state.selectedJobIds.filter((jid) => jid !== id)
          : [...state.selectedJobIds, id],
      };
    });
  },

  toggleAllSelection: (visibleJobIds) => {
    set((state) => {
      const allSelected = visibleJobIds.every((id) => state.selectedJobIds.includes(id));
      if (allSelected) {
        // Deselect visible
        return {
          selectedJobIds: state.selectedJobIds.filter((id) => !visibleJobIds.includes(id)),
        };
      } else {
        // Select all visible (union)
        const newSelection = Array.from(new Set([...state.selectedJobIds, ...visibleJobIds]));
        return {
          selectedJobIds: newSelection,
        };
      }
    });
  },

  clearSelection: () => {
    set({ selectedJobIds: [] });
  },

  applyConfigToSelected: async (configUpdates) => {
    const selectedIds = get().selectedJobIds;
    if (selectedIds.length === 0) return;

    let overriddenCount = 0;
    const isAudioPlatform = ["soundcloud", "apple_podcasts"];

    const updatedJobs = get().jobs.map((job) => {
      if (selectedIds.includes(job.id)) {
        const finalUpdates = { ...configUpdates };
        const isAudioOnly = isAudioPlatform.includes(job.platform || '');
        if (isAudioOnly && configUpdates.outputType && configUpdates.outputType !== 'audio') {
          finalUpdates.outputType = 'audio';
          finalUpdates.extractAudio = true;
          overriddenCount++;
        }

        const updatedConfig = { ...job.config, ...finalUpdates };
        const updatedJob = {
          ...job,
          config: updatedConfig,
          updatedAt: Date.now(),
        };
        saveJob(updatedJob);
        return updatedJob;
      }
      return job;
    });

    set({ jobs: updatedJobs });

    if (overriddenCount > 0) {
      const { toast } = await import('@/lib/deferred-toast');
      toast.warning(
        `Auto-corrected ${overriddenCount} audio-only link(s)`,
        {
          description: "SoundCloud / Apple Podcasts were kept as Audio format to avoid download errors.",
        }
      );
    }
  },

  applyConfigToAll: async (configUpdates) => {
    let overriddenCount = 0;
    const isAudioPlatform = ["soundcloud", "apple_podcasts"];

    const updatedJobs = get().jobs.map((job) => {
      const finalUpdates = { ...configUpdates };
      const isAudioOnly = isAudioPlatform.includes(job.platform || '');
      if (isAudioOnly && configUpdates.outputType && configUpdates.outputType !== 'audio') {
        finalUpdates.outputType = 'audio';
        finalUpdates.extractAudio = true;
        overriddenCount++;
      }

      const updatedConfig = { ...job.config, ...finalUpdates };
      const updatedJob = {
        ...job,
        config: updatedConfig,
        updatedAt: Date.now(),
      };
      saveJob(updatedJob);
      return updatedJob;
    });

    set({ jobs: updatedJobs });

    if (overriddenCount > 0) {
      const { toast } = await import('@/lib/deferred-toast');
      toast.warning(
        `Auto-corrected ${overriddenCount} audio-only link(s)`,
        {
          description: "SoundCloud / Apple Podcasts were kept as Audio format to avoid download errors.",
        }
      );
    }
  },

  startQueue: () => {
    // Transition all 'paused' or 'ready' states to 'queued'
    set((state) => {
      const updatedJobs = state.jobs.map((job) => {
        if (job.status === 'paused' || job.status === 'ready') {
          const updatedJob = { ...job, status: 'queued' as const, updatedAt: Date.now() };
          saveJob(updatedJob);
          return updatedJob;
        }
        return job;
      });

      return {
        jobs: updatedJobs,
        isQueueRunning: true,
      };
    });
  },

  pauseQueue: () => {
    set((state) => {
      // Pause any queued jobs
      const updatedJobs = state.jobs.map((job) => {
        if (job.status === 'queued') {
          const updatedJob = { ...job, status: 'paused' as const, updatedAt: Date.now() };
          saveJob(updatedJob);
          return updatedJob;
        }
        return job;
      });

      return {
        jobs: updatedJobs,
        isQueueRunning: false,
      };
    });
  },

  retryFailedJobs: async () => {
    const parseJobIds: string[] = [];
    const downloadJobIds: string[] = [];
    
    const updatedJobs = get().jobs.map((job) => {
      if (job.status === 'failed') {
        const hasMetadata = Boolean(job.metadata?.rawParsedData);
        if (!hasMetadata) {
          parseJobIds.push(job.id);
          const updatedJob = {
            ...job,
            status: 'draft' as const,
            error: undefined,
            updatedAt: Date.now(),
          };
          saveJob(updatedJob);
          return updatedJob;
        } else {
          downloadJobIds.push(job.id);
          const updatedJob = {
            ...job,
            status: 'queued' as const,
            error: undefined,
            retryCount: 0,
            updatedAt: Date.now(),
          };
          saveJob(updatedJob);
          return updatedJob;
        }
      }
      return job;
    });

    set({
      jobs: updatedJobs,
      isQueueRunning: downloadJobIds.length > 0 ? true : get().isQueueRunning,
    });

    if (parseJobIds.length > 0) {
      const { parseJobs } = await import('../services/parse-worker-pool');
      parseJobs(parseJobIds);
    }
  },

  retryJob: async (id) => {
    const job = get().jobs.find((j) => j.id === id);
    if (!job) return;
    
    const hasMetadata = Boolean(job.metadata?.rawParsedData);
    if (!hasMetadata) {
      await get().updateJobStatus(id, 'draft', { error: undefined });
      const { parseJobs } = await import('../services/parse-worker-pool');
      parseJobs([id]);
    } else {
      const updatedJobs = get().jobs.map((j) => {
        if (j.id === id) {
          const updatedJob = {
            ...j,
            status: 'queued' as const,
            error: undefined,
            retryCount: 0,
            updatedAt: Date.now(),
          };
          saveJob(updatedJob);
          return updatedJob;
        }
        return j;
      });
      set({
        jobs: updatedJobs,
        isQueueRunning: true,
      });
    }
  },

  updateSettings: async (settingsUpdates) => {
    const newSettings = { ...get().settings, ...settingsUpdates };
    set({ settings: newSettings });

    await saveProject({
      id: 'default-project',
      name: 'Default Workspace',
      createdAt: Date.now(), // update time could be managed properly
      updatedAt: Date.now(),
      settings: newSettings,
      jobIds: get().jobs.map((j) => j.id),
    });
  },

  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setStatusFilter: (statusFilter) => set({ statusFilter }),
  setPlatformFilter: (platformFilter) => set({ platformFilter }),
  setActiveJobDrawerId: (activeJobDrawerId) => set({ activeJobDrawerId }),
}));
