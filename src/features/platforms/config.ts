import { PlatformConfig } from './types';

export const PLATFORMS: Record<string, PlatformConfig> = {
  pinterest: {
    id: 'pinterest',
    name: 'Pinterest',
    matchUrl: (url) => url.hostname.includes('pinterest.com') || url.hostname.includes('pin.it'),
    ui: {
      badgeColor: 'bg-red-600/15 text-red-400 border-red-500/30',
    },
    buildFallbackMetadata: (url) => {
      const match = new URL(url).pathname.match(/\/pin\/(\d+)/);
      const pinId = match ? match[1] : "Media";
      return {
        title: `Pinterest Pin #${pinId}`,
        desc: `Pinterest Pin Item (${url})`,
        cover: null,
        platform: "pinterest",
        images: [url],
        rawParsedData: {},
      };
    }
  },
  douyin: {
    id: 'douyin',
    name: 'Douyin',
    matchUrl: (url) => url.hostname.includes('douyin.com') || url.hostname.includes('iesdouyin.com'),
    ui: { badgeColor: 'bg-pink-500/15 text-pink-500 border-pink-500/30' },
    buildFallbackMetadata: (url) => ({
      title: `Douyin Video / Post`,
      desc: `Douyin Item (${url})`,
      cover: null,
      platform: "douyin",
      rawParsedData: {
        downloadVideoUrl: url,
        videoUrl: url,
      },
    })
  },
  tiktok: {
    id: 'tiktok',
    name: 'TikTok',
    matchUrl: (url) => url.hostname.includes('tiktok.com'),
    ui: { badgeColor: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30' }
  },
  youtube: {
    id: 'youtube',
    name: 'YouTube',
    matchUrl: (url) => url.hostname.includes('youtube.com') || url.hostname.includes('youtu.be'),
    ui: { badgeColor: 'bg-red-500/15 text-red-500 border-red-500/30' }
  },
  soundcloud: {
    id: 'soundcloud',
    name: 'SoundCloud',
    matchUrl: (url) => url.hostname.includes('soundcloud.com'),
    ui: { badgeColor: 'bg-orange-500/15 text-orange-500 border-orange-500/30' }
  },
  bilibili: {
    id: 'bilibili',
    name: 'Bilibili',
    matchUrl: (url) => url.hostname.includes('bilibili.com'),
    ui: { badgeColor: 'bg-sky-500/15 text-sky-400 border-sky-500/30' }
  },
  instagram: {
    id: 'instagram',
    name: 'Instagram',
    matchUrl: (url) => url.hostname.includes('instagram.com'),
    ui: { badgeColor: 'bg-purple-500/15 text-purple-400 border-purple-500/30' }
  },
  apple: {
    id: 'apple',
    name: 'Apple Podcasts',
    matchUrl: (url) => url.hostname.includes('podcasts.apple.com'),
    ui: { badgeColor: 'bg-purple-600/15 text-purple-300 border-purple-500/30' }
  },
  threads: {
    id: 'threads',
    name: 'Threads',
    matchUrl: (url) => url.hostname.includes('threads.com') || url.hostname.includes('threads.net'),
    ui: { badgeColor: 'bg-zinc-500/15 text-zinc-200 border-zinc-500/30' },
    buildFallbackMetadata: (url) => ({
      title: `Threads Post`,
      desc: `Threads Media Item (${url})`,
      cover: null,
      platform: "threads",
      rawParsedData: {
        downloadVideoUrl: url,
      },
    })
  }
};
