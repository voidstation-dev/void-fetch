import type { Dictionary } from '@/lib/i18n/types';
import { PLATFORMS } from '@/features/platforms';

export type CanonicalPlatform =
    | 'bilibili'
    | 'bilibili_tv'
    | 'dailymotion'
    | 'douyin'
    | 'kuaishou'
    | 'newgrounds'
    | 'okru'
    | 'pinterest'
    | 'reddit'
    | 'soundcloud'
    | 'streamable'
    | 'twitch'
    | 'tumblr'
    | 'youtube'
    | 'telegram'
    | 'threads'
    | 'vk'
    | 'vimeo'
    | 'wechat'
    | 'niconico'
    | 'weibo'
    | 'xiaohongshu'
    | 'tiktok'
    | 'instagram'
    | 'x'
    | 'apple_podcasts'
    | 'generic'
    | 'unknown'

const PLATFORM_ALIASES: Record<string, CanonicalPlatform> = {
    bili: 'bilibili',
    bilibili: 'bilibili',
    bilibili_tv: 'bilibili_tv',
    dailymotion: 'dailymotion',
    douyin: 'douyin',
    kuaishou: 'kuaishou',
    newgrounds: 'newgrounds',
    okru: 'okru',
    pinterest: 'pinterest',
    reddit: 'reddit',
    soundcloud: 'soundcloud',
    streamable: 'streamable',
    twitch: 'twitch',
    tumblr: 'tumblr',
    youtube: 'youtube',
    telegram: 'telegram',
    threads: 'threads',
    vk: 'vk',
    vimeo: 'vimeo',
    wechat: 'wechat',
    niconico: 'niconico',
    nico: 'niconico',
    weibo: 'weibo',
    xiaohongshu: 'xiaohongshu',
    tiktok: 'tiktok',
    instagram: 'instagram',
    ins: 'instagram',
    x: 'x',
    twitter: 'x',
    generic: 'generic',
    unknown: 'unknown',
    apple_podcasts: 'apple_podcasts',
}

const AUDIO_EXTRACTION_PLATFORMS = new Set<CanonicalPlatform>([
    'douyin',
    'threads',
    'weibo',
    'xiaohongshu',
    'tiktok',
    'instagram',
    'x',
])

const CANONICAL_SET = new Set<CanonicalPlatform>([
    'bilibili',
    'bilibili_tv',
    'dailymotion',
    'douyin',
    'kuaishou',
    'newgrounds',
    'okru',
    'pinterest',
    'reddit',
    'soundcloud',
    'streamable',
    'twitch',
    'tumblr',
    'youtube',
    'telegram',
    'threads',
    'vk',
    'vimeo',
    'wechat',
    'niconico',
    'weibo',
    'xiaohongshu',
    'tiktok',
    'instagram',
    'x',
    'apple_podcasts',
])

export function isCanonicalPlatform(val: string): val is CanonicalPlatform {
    return CANONICAL_SET.has(val as CanonicalPlatform)
}

export function getPlatformBadgeStyle(platform?: string): string {
  const p = (platform || "generic").toLowerCase();
  
  // Find exact ID match, or partial match for legacy fallback strings
  const config = PLATFORMS[p] || Object.values(PLATFORMS).find(c => p.includes(c.id));
  
  return config?.ui.badgeColor || "bg-primary/10 text-primary border-primary/20";
}

export function normalizePlatform(platform?: string | null): CanonicalPlatform {
    if (!platform) {
        return 'unknown'
    }

    return PLATFORM_ALIASES[platform.trim().toLowerCase()] ?? 'unknown'
}

export function getPlatformLabel(
    platform: string | null | undefined,
    t: ((key: string) => string) | Pick<Dictionary, 'history'>
): string {
    const get = typeof t === 'function'
        ? t
        : (k: string) => ((t as Pick<Dictionary, 'history'>).history.platforms as Record<string, string>)[k] ?? k

    switch (normalizePlatform(platform)) {
        case 'bilibili':
            return get('bilibili')
        case 'bilibili_tv':
            return get('bilibiliTv')
        case 'dailymotion':
            return get('dailymotion')
        case 'douyin':
            return get('douyin')
        case 'kuaishou':
            return get('kuaishou')
        case 'newgrounds':
            return get('newgrounds')
        case 'okru':
            return get('okru')
        case 'pinterest':
            return get('pinterest')
        case 'reddit':
            return get('reddit')
        case 'soundcloud':
            return get('soundcloud')
        case 'streamable':
            return get('streamable')
        case 'twitch':
            return get('twitch')
        case 'tumblr':
            return get('tumblr')
        case 'youtube':
            return get('youtube')
        case 'telegram':
            return get('telegram')
        case 'threads':
            return get('threads')
        case 'vk':
            return get('vk')
        case 'vimeo':
            return get('vimeo')
        case 'wechat':
            return get('wechat')
        case 'niconico':
            return get('niconico')
        case 'weibo':
            return get('weibo')
        case 'xiaohongshu':
            return get('xiaohongshu')
        case 'tiktok':
            return get('tiktok')
        case 'instagram':
            return get('instagram')
        case 'x':
            return get('x')
        case 'apple_podcasts':
            return 'Apple Podcasts'
        case 'generic':
            return get('generic')
        default:
            return get('unknown')
    }
}

export function getPlatformBadge(
    platform: string | null | undefined,
    t: ((key: string) => string) | Pick<Dictionary, 'history'>
) {
    return {
        text: getPlatformLabel(platform, t),
    }
}

export function supportsAudioExtraction(platform: string | null | undefined): boolean {
    return AUDIO_EXTRACTION_PLATFORMS.has(normalizePlatform(platform))
}
