import type { Dictionary } from "@/lib/i18n/types";

type PlatformSupportEntry = {
  name: string;
  summary: string;
  features?: string[];
};

export type PlatformSupportKey =
  | "bilibili"
  | "bilibiliTv"
  | "douyin"
  | "youtube"
  | "telegram"
  | "threads"
  | "wechat"
  | "niconico"
  | "weibo"
  | "xiaohongshu"
  | "tiktok"
  | "instagram"
  | "x"
  | "vimeo"
  | "dailymotion"
  | "streamable"
  | "reddit"
  | "newgrounds"
  | "tumblr"
  | "pinterest"
  | "vk"
  | "okru"
  | "twitch"
  | "soundcloud"
  | "applePodcasts"
  | "hls";

type PlatformSupportVisual = {
  src?: string;
  darkSrc?: string;
  fallbackLabel?: string;
  frameClassName: string;
  iconClassName?: string;
  badgeLabel?: string;
  badgeClassName?: string;
};

export type PlatformSupportItem = {
  key: PlatformSupportKey;
  name: string;
  features: string[];
  visual: PlatformSupportVisual;
};

type PlatformSupportDictionary = {
  guide: {
    platformSupport: Omit<Dictionary["guide"]["platformSupport"], "title">;
  };
};

export const HIDDEN_PLATFORM_SUPPORT_KEYS = new Set<PlatformSupportKey>([
  "wechat",
  "weibo",
  "xiaohongshu",
]);

const UNIFIED_FRAME_CLASS_NAME =
  "border-slate-200 bg-slate-100/70 dark:border-slate-300/40 dark:bg-slate-800/45";

const PLATFORM_SUPPORT_VISUALS: Record<
  PlatformSupportKey,
  PlatformSupportVisual
> = {
  bilibili: {
    src: "/platform-icons/bilibili.svg",
    frameClassName: UNIFIED_FRAME_CLASS_NAME,
  },
  bilibiliTv: {
    src: "/platform-icons/bilibili.svg",
    frameClassName: UNIFIED_FRAME_CLASS_NAME,
    badgeLabel: "TV",
    badgeClassName: "bg-primary text-primary-foreground",
  },
  douyin: {
    src: "/platform-icons/douyin.svg",
    frameClassName: UNIFIED_FRAME_CLASS_NAME,
  },
  youtube: {
    src: "/platform-icons/youtube.svg",
    frameClassName: UNIFIED_FRAME_CLASS_NAME,
  },
  telegram: {
    src: "/platform-icons/telegram.svg",
    frameClassName: UNIFIED_FRAME_CLASS_NAME,
  },
  threads: {
    src: "/platform-icons/threads.svg",
    darkSrc: "/platform-icons/threads-dark.svg",
    frameClassName: UNIFIED_FRAME_CLASS_NAME,
  },
  wechat: {
    src: "/platform-icons/wechat.svg",
    frameClassName: UNIFIED_FRAME_CLASS_NAME,
  },
  niconico: {
    src: "/platform-icons/niconico.svg",
    darkSrc: "/platform-icons/niconico-dark.svg",
    frameClassName: UNIFIED_FRAME_CLASS_NAME,
  },
  weibo: {
    src: "/platform-icons/weibo.svg",
    frameClassName: UNIFIED_FRAME_CLASS_NAME,
  },
  xiaohongshu: {
    src: "/platform-icons/xiaohongshu.svg",
    frameClassName: UNIFIED_FRAME_CLASS_NAME,
  },
  tiktok: {
    src: "/platform-icons/tiktok.svg",
    darkSrc: "/platform-icons/tiktok-dark.svg",
    frameClassName: UNIFIED_FRAME_CLASS_NAME,
  },
  instagram: {
    src: "/platform-icons/instagram.svg",
    frameClassName: UNIFIED_FRAME_CLASS_NAME,
  },
  x: {
    src: "/platform-icons/x.svg",
    darkSrc: "/platform-icons/x-dark.svg",
    frameClassName: UNIFIED_FRAME_CLASS_NAME,
  },
  vimeo: {
    src: "/platform-icons/vimeo.svg",
    frameClassName: UNIFIED_FRAME_CLASS_NAME,
  },
  dailymotion: {
    src: "/platform-icons/dailymotion.svg",
    darkSrc: "/platform-icons/dailymotion-dark.svg",
    frameClassName: UNIFIED_FRAME_CLASS_NAME,
  },
  streamable: {
    src: "/platform-icons/streamable.svg",
    frameClassName: UNIFIED_FRAME_CLASS_NAME,
  },
  reddit: {
    src: "/platform-icons/reddit.svg",
    frameClassName: UNIFIED_FRAME_CLASS_NAME,
  },
  newgrounds: {
    src: "/platform-icons/newgrounds.svg",
    frameClassName: UNIFIED_FRAME_CLASS_NAME,
  },
  tumblr: {
    src: "/platform-icons/tumblr.svg",
    frameClassName: UNIFIED_FRAME_CLASS_NAME,
  },
  pinterest: {
    src: "/platform-icons/pinterest.svg",
    frameClassName: UNIFIED_FRAME_CLASS_NAME,
  },
  vk: {
    src: "/platform-icons/vk.svg",
    frameClassName: UNIFIED_FRAME_CLASS_NAME,
  },
  okru: {
    src: "/platform-icons/okru.svg",
    frameClassName: UNIFIED_FRAME_CLASS_NAME,
  },
  twitch: {
    src: "/platform-icons/twitch.svg",
    frameClassName: UNIFIED_FRAME_CLASS_NAME,
  },
  soundcloud: {
    src: "/platform-icons/soundcloud.svg",
    frameClassName: UNIFIED_FRAME_CLASS_NAME,
  },
  applePodcasts: {
    src: "/platform-icons/apple-podcasts.svg",
    frameClassName: UNIFIED_FRAME_CLASS_NAME,
  },
  hls: {
    src: "/platform-icons/hls.svg",
    darkSrc: "/platform-icons/hls-dark.svg",
    frameClassName: UNIFIED_FRAME_CLASS_NAME,
    badgeLabel: "New",
    badgeClassName: "bg-primary text-primary-foreground",
  },
};

function buildPlatformSupportItem(
  key: PlatformSupportKey,
  entry: PlatformSupportEntry,
): PlatformSupportItem {
  return {
    key,
    name: entry.name,
    features: resolveFeatures(entry),
    visual: PLATFORM_SUPPORT_VISUALS[key],
  };
}

function resolveFeatures(entry: PlatformSupportEntry): string[] {
  if (entry.features && entry.features.length > 0) {
    return entry.features;
  }

  return entry.summary
    .split(/[、,，/&]/)
    .map((feature) => feature.trim())
    .filter(Boolean);
}

const DEFAULT_PLATFORM_ENTRIES: Record<
  PlatformSupportKey,
  PlatformSupportEntry
> = {
  bilibili: { name: "Bilibili", summary: "Video, Audio" },
  bilibiliTv: { name: "Bilibili TV", summary: "TV" },
  douyin: { name: "Douyin", summary: "Video, Image" },
  youtube: { name: "YouTube", summary: "Video, Short" },
  telegram: { name: "Telegram", summary: "Media" },
  threads: { name: "Threads", summary: "Post, Video" },
  wechat: { name: "WeChat", summary: "Article" },
  niconico: { name: "Niconico", summary: "Video" },
  weibo: { name: "Weibo", summary: "Media" },
  xiaohongshu: { name: "RED", summary: "Post" },
  tiktok: { name: "TikTok", summary: "Video, Audio" },
  instagram: { name: "Instagram", summary: "Reel, Photo" },
  x: { name: "X / Twitter", summary: "Video, GIF" },
  vimeo: { name: "Vimeo", summary: "HD Video" },
  dailymotion: { name: "Dailymotion", summary: "Video" },
  streamable: { name: "Streamable", summary: "Video" },
  reddit: { name: "Reddit", summary: "Video, Post" },
  newgrounds: { name: "Newgrounds", summary: "Audio, Animation" },
  tumblr: { name: "Tumblr", summary: "Media" },
  pinterest: { name: "Pinterest", summary: "Pin, Video" },
  vk: { name: "VK", summary: "Video" },
  okru: { name: "OK.ru", summary: "Video" },
  twitch: { name: "Twitch", summary: "Clip" },
  soundcloud: { name: "SoundCloud", summary: "Track" },
  applePodcasts: { name: "Apple Podcasts", summary: "Episode" },
  hls: { name: "M3U8 / HLS", summary: "Stream" },
};

export function getPlatformSupportItems(
  dict?: PlatformSupportDictionary | null,
): PlatformSupportItem[] {
  const support = dict?.guide?.platformSupport;

  const getItem = (key: PlatformSupportKey): PlatformSupportItem => {
    const entry =
      (support &&
        (support as unknown as Record<string, PlatformSupportEntry>)[key]) ||
      DEFAULT_PLATFORM_ENTRIES[key];
    return buildPlatformSupportItem(key, entry);
  };

  return [
    getItem("bilibili"),
    getItem("bilibiliTv"),
    getItem("douyin"),
    getItem("hls"),
    getItem("youtube"),
    getItem("telegram"),
    getItem("threads"),
    getItem("wechat"),
    getItem("niconico"),
    getItem("weibo"),
    getItem("xiaohongshu"),
    getItem("tiktok"),
    getItem("instagram"),
    getItem("x"),
    getItem("vimeo"),
    getItem("dailymotion"),
    getItem("streamable"),
    getItem("reddit"),
    getItem("newgrounds"),
    getItem("tumblr"),
    getItem("pinterest"),
    getItem("vk"),
    getItem("okru"),
    getItem("twitch"),
    getItem("soundcloud"),
    getItem("applePodcasts"),
  ].filter((item) => !HIDDEN_PLATFORM_SUPPORT_KEYS.has(item.key));
}
