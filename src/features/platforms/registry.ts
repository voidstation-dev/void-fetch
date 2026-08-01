import { MediaMetadata } from "../batch-download/types/batch-download";
import { PLATFORMS } from "./config";
import { normalizePlatform } from "@/lib/platforms";

/**
 * Get Platform Configuration by parsing the URL
 */
export function getPlatformByUrl(urlString: string) {
  try {
    const url = new URL(urlString);
    return Object.values(PLATFORMS).find((p) => p.matchUrl(url));
  } catch {
    return undefined;
  }
}

/**
 * Smart Fallback Metadata builder using platform configs
 */
export function buildFallbackMetadata(url: string): MediaMetadata | null {
  const config = getPlatformByUrl(url);
  if (config?.buildFallbackMetadata) {
    return config.buildFallbackMetadata(url);
  }

  // Generic fallback
  try {
    const urlObj = new URL(url);
    const host = urlObj.hostname.toLowerCase();
    const pathname = urlObj.pathname;
    const lastSegment =
      pathname.split("/").filter(Boolean).pop() || "Media Item";

    return {
      title: decodeURIComponent(lastSegment),
      desc: url,
      cover: null,
      platform: normalizePlatform(host),
      rawParsedData: {
        downloadVideoUrl: url,
      },
    };
  } catch {
    return null;
  }
}
