/**
 * VoidFetch
 * Copyright (c) 2026 VoidStation.
 * All rights reserved.
 */

// Regular expression to extract URLs from text
const URL_REGEX = /https?:\/\/[^\s"<>]+/g;

export interface ExtractedUrl {
  original: string;
  normalized: string;
  status: "valid" | "duplicate" | "unsupported" | "malformed";
  platform: string;
}

const TRACKING_PARAMS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "spm_id_from",
  "spm",
  "vd_source",
  "click_id",
  "fbclid",
  "gclid",
  "_hsenc",
  "_hsmi",
  "ref",
  "referer",
];

/**
 * Normalizes a URL by removing common tracking parameters.
 */
export function normalizeUrl(rawUrl: string): string {
  try {
    let cleaned = rawUrl.trim();
    cleaned = cleaned.replace(/[.,!?;:)\]}"'，。！？；：）】》]+$/g, "");
    cleaned = cleaned.replace(/([\x20-\x7E]+)[^\x20-\x7E]+$/g, "$1");

    const urlObj = new URL(cleaned);

    // Remove common tracking search params
    TRACKING_PARAMS.forEach((param) => {
      urlObj.searchParams.delete(param);
    });

    return urlObj.toString();
  } catch {
    return rawUrl.trim();
  }
}

/**
 * Detects the platform from the URL host name.
 */
export function detectPlatform(urlStr: string): string {
  try {
    const host = new URL(urlStr).hostname.toLowerCase();

    if (
      host.includes("bilibili.com") ||
      host.includes("bili.live") ||
      host.includes("b23.tv")
    )
      return "bilibili";
    if (host.includes("youtube.com") || host.includes("youtu.be"))
      return "youtube";
    if (host.includes("tiktok.com")) return "tiktok";
    if (host.includes("douyin.com")) return "douyin";
    if (
      host.includes("kuaishou.com") ||
      host.includes("gifshow.com") ||
      host.includes("kuaishouapp.com")
    )
      return "kuaishou";
    if (host.includes("xiaohongshu.com") || host.includes("xhslink.com"))
      return "xiaohongshu";
    if (host.includes("reddit.com") || host.includes("redd.it"))
      return "reddit";
    if (host.includes("instagram.com") || host.includes("instagr.am"))
      return "instagram";
    if (host.includes("twitter.com") || host.includes("x.com")) return "x";
    if (host.includes("apple.com") || host.includes("podcasts.apple.com"))
      return "apple_podcasts";
    if (host.includes("pinterest.com") || host.includes("pin.it"))
      return "pinterest";
    if (host.includes("soundcloud.com")) return "soundcloud";
    if (host.includes("vimeo.com")) return "vimeo";
    if (host.includes("twitch.tv")) return "twitch";
    if (host.includes("tumblr.com")) return "tumblr";
    if (host.includes("vk.com") || host.includes("vk.video")) return "vk";
    if (host.includes("dailymotion.com") || host.includes("dai.ly"))
      return "dailymotion";
    if (host.includes("weibo.com") || host.includes("weibo.cn")) return "weibo";
    if (host.includes("threads.com") || host.includes("threads.net"))
      return "threads";
    if (host.includes("telegram.org") || host.includes("t.me"))
      return "telegram";

    return "generic"; // fallback to generic or unknown
  } catch {
    return "unknown";
  }
}

/**
 * Extracts and processes URLs from arbitrary text block.
 */
export function extractAndNormalizeUrls(
  text: string,
  existingUrls: string[] = [],
): ExtractedUrl[] {
  if (!text) return [];

  const foundUrls = text.match(URL_REGEX) || [];
  const processed: ExtractedUrl[] = [];
  const seenInBatch = new Set<string>();

  for (const rawUrl of foundUrls) {
    const normalized = normalizeUrl(rawUrl);
    const platform = detectPlatform(normalized);

    let status: ExtractedUrl["status"] = "valid";

    if (platform === "unknown") {
      status = "malformed";
    } else if (
      seenInBatch.has(normalized) ||
      existingUrls.includes(normalized)
    ) {
      status = "duplicate";
    }

    seenInBatch.add(normalized);

    processed.push({
      original: rawUrl,
      normalized,
      status,
      platform,
    });
  }

  return processed;
}
