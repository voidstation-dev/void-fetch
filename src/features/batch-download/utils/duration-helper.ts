/**
 * VoidFetch
 * Copyright (c) 2026 VoidStation.
 * All rights reserved.
 */

/**
 * Safely parses duration from various formats (seconds, milliseconds, ISO/time strings)
 */
export function parseMediaDuration(rawDuration: unknown): number | undefined {
  if (
    typeof rawDuration === "number" &&
    !isNaN(rawDuration) &&
    rawDuration > 0
  ) {
    // If greater than 100,000, it's in milliseconds
    return rawDuration > 100000
      ? Math.round(rawDuration / 1000)
      : Math.round(rawDuration);
  }
  if (typeof rawDuration === "string" && rawDuration.trim().length > 0) {
    const str = rawDuration.trim();
    if (str.includes(":")) {
      const parts = str.split(":").map(Number);
      if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
        return parts[0] * 60 + parts[1];
      }
      if (
        parts.length === 3 &&
        !isNaN(parts[0]) &&
        !isNaN(parts[1]) &&
        !isNaN(parts[2])
      ) {
        return parts[0] * 3600 + parts[1] * 60 + parts[2];
      }
    }
    const num = Number(str);
    if (!isNaN(num) && num > 0) {
      return num > 100000 ? Math.round(num / 1000) : Math.round(num);
    }
  }
  return undefined;
}

/**
 * Probes HTML5 media duration dynamically in browser when initial API response lacks duration metadata
 */
export function probeMediaDuration(
  url: string,
  isVideo = true,
): Promise<number | undefined> {
  return new Promise((resolve) => {
    if (!url || typeof window === "undefined") {
      resolve(undefined);
      return;
    }
    const element = document.createElement(isVideo ? "video" : "audio");
    element.preload = "metadata";

    const cleanup = () => {
      element.onloadedmetadata = null;
      element.onerror = null;
      element.remove();
    };

    element.onloadedmetadata = () => {
      const d = element.duration;
      cleanup();
      if (typeof d === "number" && isFinite(d) && d > 0) {
        resolve(Math.round(d));
      } else {
        resolve(undefined);
      }
    };

    element.onerror = () => {
      cleanup();
      resolve(undefined);
    };

    element.src = url;

    setTimeout(() => {
      cleanup();
      resolve(undefined);
    }, 4000);
  });
}

/**
 * Formats duration in seconds to M:SS or H:MM:SS
 */
export function formatDuration(seconds?: number | null): string | null {
  if (!seconds || seconds <= 0 || !isFinite(seconds)) return null;
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}
