import { useBatchStore } from '../store/batch-store';

export const DEFAULT_GLOBAL_NETWORK_BUDGET = 18;
export const DEFAULT_SEGMENT_CONCURRENCY = 6;
export const MAX_ACTIVE_JOBS = 3;

/**
 * Calculates adaptive segment concurrency for a single job given the number of active jobs.
 * This guarantees the global request count does not exceed the network budget limit.
 */
export function calculateSegmentConcurrency(activeJobCount: number, customJobConcurrency?: number): number {
  if (customJobConcurrency && customJobConcurrency > 0) {
    return customJobConcurrency;
  }

  const globalBudget = useBatchStore.getState().settings?.globalNetworkBudget || DEFAULT_GLOBAL_NETWORK_BUDGET;
  if (activeJobCount <= 0) return DEFAULT_SEGMENT_CONCURRENCY;
  return Math.max(2, Math.floor(globalBudget / activeJobCount));
}
