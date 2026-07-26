import { describe, expect, it } from 'vitest'

import {
    buildPrimaryResultPreview,
    canPreviewResultAudio,
    canPreviewResultVideo,
    canSharePlayResult,
} from '../src/components/downloader/media-preview.ts'

describe('media preview helpers', () => {
it('keeps share play enabled for audio-only results', () => {
    const result = {
        title: 'Audio only',
        platform: 'soundcloud',
        url: 'https://soundcloud.com/example/track',
        downloadAudioUrl: 'https://cdn.example.com/audio.mp3',
        downloadVideoUrl: null,
        originDownloadAudioUrl: null,
        originDownloadVideoUrl: null,
        mediaActions: {
            video: 'hide' as const,
            audio: 'direct-download' as const,
        },
    }

    expect(canPreviewResultVideo(result)).toBe(false)
    expect(canPreviewResultAudio(result)).toBe(true)
    expect(canSharePlayResult(result)).toBe(true)
    expect(buildPrimaryResultPreview(result)).toEqual({
        mediaType: 'audio',
        sourceUrl: 'https://soundcloud.com/example/track',
        title: 'Audio only',
        autoplay: undefined,
    })
})

it('keeps share play enabled for muxed video results without a separate audio stream', () => {
    const result = {
        title: 'Muxed video',
        platform: 'bili',
        url: 'https://www.bilibili.com/video/BV1muxed/',
        downloadAudioUrl: null,
        downloadVideoUrl: 'https://cdn.example.com/video.mp4',
        originDownloadAudioUrl: null,
        originDownloadVideoUrl: null,
        videoAudioMode: 'muxed' as const,
    }

    expect(canPreviewResultVideo(result)).toBe(true)
    expect(canPreviewResultAudio(result)).toBe(false)
    expect(canSharePlayResult(result)).toBe(true)
    expect(buildPrimaryResultPreview(result)).toEqual({
        mediaType: 'video',
        sourceUrl: 'https://www.bilibili.com/video/BV1muxed/',
        title: 'Muxed video',
        autoplay: undefined,
    })
})
})
