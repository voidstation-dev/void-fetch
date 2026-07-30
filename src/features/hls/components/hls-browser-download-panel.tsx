'use client'

import { HlsBrowserDownloadPanelView } from './hls-browser-download-panel-ui'

import { fileSave, supported as supportsStreamingFileSave } from 'browser-fs-access'
import { useCallback, useEffect, useRef, useState } from 'react'
import { AlertCircle, CheckCircle2, Loader2, ListVideo } from 'lucide-react'
import pRetry from 'p-retry'

import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { useTranslations } from 'next-intl'
import type { ByteRange, HlsSegment } from '@/infrastructure/hls-browser-download'
import {
    buildHlsHostProbeTargets,
    buildRangeHeader,
    decryptAes128Cbc,
    importAes128Key,
    inferHlsOutputExtension,
    parseHlsMediaPlaylist,
    pickBestVariant,
    shouldBlockLargeHlsDownloadWithoutStreamingSave,
    sliceHlsSegments,
} from '@/infrastructure/hls-browser-download'
import { HLS_PLAYLIST_ACCEPT } from '@/lib/hls-playback'
import { requestUnifiedParse } from '@/lib/unified-parse'
import { sanitizeFilename, formatEta } from '@/lib/utils'

const DOWNLOAD_CONCURRENCY = 8
const SEGMENT_DOWNLOAD_RETRIES = 3
const HOST_PROBE_CONCURRENCY = 2
const HOST_PROBE_TIMEOUT_MS = 2500

class HttpStatusError extends Error {
    status: number

    constructor(status: number, message: string) {
        super(message)
        this.name = 'HttpStatusError'
        this.status = status
    }
}

type PlaylistResolution = {
    title: string
    pageUrl: string
    playlistUrl: string
    variantCount: number
    totalSegments: number
    selectedSegments: HlsSegment[]
    mapUrl: string | null
    mapByterange?: ByteRange
    encrypted: boolean
}

type DownloadSample = {
    bytes: number
    timestamp: number
}

type DirectFetchMode = 'probe' | 'direct-ok' | 'proxy-only'

export interface HlsBrowserDownloadPanelProps {
    initialSourceUrl: string
    initialRefererUrl: string
    initialTitle?: string
    autorun?: boolean
    onBusyChange?: (busy: boolean) => void
    onCancelReady?: (cancel: (() => void) | null) => void
}

function buildProxyUrl(target: string, referer: string, accept?: string): string {
    const params = new URLSearchParams({ target, referer })
    if (accept) {
        params.set('accept', accept)
    }

    return `/api/hls-download-proxy?${params.toString()}`
}

function buildFetchHeaders(accept?: string, byterange?: ByteRange): HeadersInit | undefined {
    const headers: Record<string, string> = {}
    if (accept) {
        headers.Accept = accept
    }

    const range = buildRangeHeader(byterange)
    if (range) {
        headers.Range = range
    }

    return Object.keys(headers).length > 0 ? headers : undefined
}

function isAbortError(error: unknown): boolean {
    return error instanceof DOMException && error.name === 'AbortError'
}

function isRetryableStatus(status: number): boolean {
    return status === 408 || status === 425 || status === 429 || (status >= 500 && status < 600)
}

function shouldRetryDownload(error: unknown): boolean {
    if (isAbortError(error)) {
        return false
    }

    if (error instanceof HttpStatusError) {
        return isRetryableStatus(error.status)
    }

    return true
}

function resolveHost(url: string): string | null {
    try {
        return new URL(url).host
    } catch {
        return null
    }
}

async function fetchProxyText(
    target: string,
    referer: string,
    signal: AbortSignal,
    accept?: string
): Promise<string> {
    const response = await fetch(buildProxyUrl(target, referer, accept), {
        cache: 'no-store',
        signal,
    })

    if (!response.ok) {
        throw new HttpStatusError(response.status, `Proxy request failed with HTTP ${response.status}`)
    }

    return response.text()
}

async function fetchProxyBytes(
    target: string,
    referer: string,
    signal: AbortSignal,
    byterange?: ByteRange
): Promise<Uint8Array> {
    const response = await fetch(buildProxyUrl(target, referer), {
        cache: 'no-store',
        headers: buildFetchHeaders(undefined, byterange),
        signal,
    })

    if (!response.ok) {
        throw new HttpStatusError(response.status, `Proxy request failed with HTTP ${response.status}`)
    }

    return new Uint8Array(await response.arrayBuffer())
}

async function fetchDirectText(
    target: string,
    signal: AbortSignal,
    accept?: string
): Promise<string> {
    const response = await fetch(target, {
        cache: 'no-store',
        headers: buildFetchHeaders(accept),
        signal,
    })

    if (!response.ok) {
        throw new HttpStatusError(response.status, `Direct request failed with HTTP ${response.status}`)
    }

    return response.text()
}

async function fetchDirectBytes(
    target: string,
    signal: AbortSignal,
    byterange?: ByteRange
): Promise<Uint8Array> {
    const response = await fetch(target, {
        cache: 'no-store',
        headers: buildFetchHeaders(undefined, byterange),
        signal,
    })

    if (!response.ok) {
        throw new HttpStatusError(response.status, `Direct request failed with HTTP ${response.status}`)
    }

    return new Uint8Array(await response.arrayBuffer())
}

async function fetchTextWithFallback(
    target: string,
    referer: string,
    signal: AbortSignal,
    directFetchModes: Map<string, DirectFetchMode>,
    accept?: string
): Promise<string> {
    const host = resolveHost(target)
    const directFetchMode = host ? directFetchModes.get(host) ?? 'probe' : 'probe'

    if (directFetchMode === 'proxy-only') {
        return fetchProxyText(target, referer, signal, accept)
    }

    try {
        const text = await fetchDirectText(target, signal, accept)
        if (host) {
            directFetchModes.set(host, 'direct-ok')
        }

        return text
    } catch (error) {
        if (isAbortError(error)) {
            throw error
        }

        if (host) {
            directFetchModes.set(host, 'proxy-only')
        }

        return fetchProxyText(target, referer, signal, accept)
    }
}

async function fetchBytesWithFallback(
    target: string,
    referer: string,
    signal: AbortSignal,
    directFetchModes: Map<string, DirectFetchMode>,
    byterange?: ByteRange
): Promise<Uint8Array> {
    const host = resolveHost(target)
    const directFetchMode = host ? directFetchModes.get(host) ?? 'probe' : 'probe'

    if (directFetchMode === 'proxy-only') {
        return fetchProxyBytes(target, referer, signal, byterange)
    }

    try {
        const bytes = await fetchDirectBytes(target, signal, byterange)
        if (host) {
            directFetchModes.set(host, 'direct-ok')
        }

        return bytes
    } catch (error) {
        if (isAbortError(error)) {
            throw error
        }

        if (host) {
            directFetchModes.set(host, 'proxy-only')
        }

        return fetchProxyBytes(target, referer, signal, byterange)
    }
}

async function fetchBytesWithRetry(
    target: string,
    referer: string,
    signal: AbortSignal,
    directFetchModes: Map<string, DirectFetchMode>,
    byterange?: ByteRange
): Promise<Uint8Array> {
    return pRetry(
        () => fetchBytesWithFallback(target, referer, signal, directFetchModes, byterange),
        {
            retries: SEGMENT_DOWNLOAD_RETRIES,
            factor: 2,
            minTimeout: 500,
            maxTimeout: 4000,
            randomize: true,
            signal,
            shouldRetry: ({ error }) => shouldRetryDownload(error),
        }
    )
}

async function resolvePlaylist(
    sourceUrl: string,
    signal: AbortSignal,
    directFetchModes: Map<string, DirectFetchMode>,
    refererOverride?: string,
    titleOverride?: string
): Promise<PlaylistResolution> {
    let pageUrl = sourceUrl
    let playlistUrl = sourceUrl
    let title = titleOverride?.trim() || ''

    if (/\.m3u8(?:[?#]|$)/i.test(sourceUrl)) {
        pageUrl = refererOverride?.trim() || sourceUrl
    } else {
        const parsed = await requestUnifiedParse(sourceUrl)
        playlistUrl = parsed.data.originDownloadVideoUrl || parsed.data.downloadVideoUrl || ''
        pageUrl = parsed.data.url

        if (!playlistUrl) {
            throw new Error('No playlist URL was returned by /api/parse')
        }

        title = title || parsed.data.title || parsed.data.desc || ''
    }

    let activePlaylistUrl = playlistUrl
    let playlistText = await fetchTextWithFallback(
        activePlaylistUrl,
        pageUrl,
        signal,
        directFetchModes,
        HLS_PLAYLIST_ACCEPT
    )
    const bestVariant = pickBestVariant(playlistText, activePlaylistUrl)

    if (bestVariant) {
        activePlaylistUrl = bestVariant.url
        playlistText = await fetchTextWithFallback(
            activePlaylistUrl,
            pageUrl,
            signal,
            directFetchModes,
            HLS_PLAYLIST_ACCEPT
        )
    }

    const mediaPlaylist = parseHlsMediaPlaylist(playlistText, activePlaylistUrl)
    const selectedSegments = sliceHlsSegments(mediaPlaylist.segments)

    return {
        title,
        pageUrl,
        playlistUrl: activePlaylistUrl,
        variantCount: bestVariant ? 1 : 0,
        totalSegments: mediaPlaylist.segments.length,
        selectedSegments,
        mapUrl: mediaPlaylist.mapUrl,
        mapByterange: mediaPlaylist.mapByterange,
        encrypted: mediaPlaylist.encrypted,
    }
}

async function runWithConcurrency<T>(
    items: T[],
    concurrency: number,
    worker: (item: T, index: number) => Promise<void>
): Promise<void> {
    let nextIndex = 0

    async function runWorker(): Promise<void> {
        while (nextIndex < items.length) {
            const currentIndex = nextIndex
            nextIndex += 1
            await worker(items[currentIndex], currentIndex)
        }
    }

    await Promise.all(
        Array.from({ length: Math.min(concurrency, items.length) }, () => runWorker())
    )
}

function createProbeSignal(signal: AbortSignal, timeoutMs: number): {
    signal: AbortSignal
    cleanup: () => void
} {
    const controller = new AbortController()
    const forwardAbort = () => {
        controller.abort(signal.reason)
    }

    if (signal.aborted) {
        controller.abort(signal.reason)
    } else {
        signal.addEventListener('abort', forwardAbort, { once: true })
    }

    const timeoutId = setTimeout(() => {
        controller.abort(new DOMException('Timed out', 'AbortError'))
    }, timeoutMs)

    return {
        signal: controller.signal,
        cleanup: () => {
            clearTimeout(timeoutId)
            signal.removeEventListener('abort', forwardAbort)
        },
    }
}

async function probeHostDirectAccess(
    target: string,
    signal: AbortSignal,
    byterange?: ByteRange
): Promise<boolean> {
    const { signal: probeSignal, cleanup } = createProbeSignal(signal, HOST_PROBE_TIMEOUT_MS)

    try {
        const response = await fetch(target, {
            cache: 'no-store',
            headers: buildFetchHeaders(undefined, byterange),
            signal: probeSignal,
        })

        if (!response.ok) {
            throw new HttpStatusError(response.status, `Direct probe failed with HTTP ${response.status}`)
        }

        await response.body?.cancel()
        return true
    } catch (error) {
        if (signal.aborted && isAbortError(error)) {
            throw error
        }

        return false
    } finally {
        cleanup()
    }
}

async function probePlaylistHosts(
    resolution: PlaylistResolution,
    signal: AbortSignal,
    directFetchModes: Map<string, DirectFetchMode>
): Promise<void> {
    const probeTargets = buildHlsHostProbeTargets(
        resolution.mapUrl,
        resolution.mapByterange,
        resolution.selectedSegments
    )

    await runWithConcurrency(probeTargets, HOST_PROBE_CONCURRENCY, async (probeTarget) => {
        const currentMode = directFetchModes.get(probeTarget.host)
        if (currentMode === 'direct-ok' || currentMode === 'proxy-only') {
            return
        }

        const directAccessible = await probeHostDirectAccess(
            probeTarget.url,
            signal,
            probeTarget.byterange
        )

        directFetchModes.set(probeTarget.host, directAccessible ? 'direct-ok' : 'proxy-only')
    })
}

function createStreamingDownloadResponse({
    targets,
    resolution,
    signal,
    directFetchModes,
    onChunkDownloaded,
}: {
    targets: Array<{ url: string; byterange?: ByteRange; keyUrl?: string; iv?: Uint8Array }>
    resolution: PlaylistResolution
    signal: AbortSignal
    directFetchModes: Map<string, DirectFetchMode>
    onChunkDownloaded: (bytes: number) => void
}): Response {
    const keyCache = new Map<string, Promise<CryptoKey>>()
    let started = false

    const stream = new ReadableStream<Uint8Array>({
        pull(controller) {
            if (started) {
                return
            }

            started = true

            void (async () => {
                const pendingChunks = new Map<number, Uint8Array>()
                let nextWriteIndex = 0

                const flushReadyChunks = () => {
                    while (pendingChunks.has(nextWriteIndex)) {
                        const chunk = pendingChunks.get(nextWriteIndex)
                        pendingChunks.delete(nextWriteIndex)
                        nextWriteIndex += 1

                        if (!chunk) {
                            continue
                        }

                        controller.enqueue(chunk)
                    }
                }

                try {
                    await runWithConcurrency(targets, DOWNLOAD_CONCURRENCY, async (target, index) => {
                        const bytes = await fetchBytesWithRetry(
                            target.url,
                            resolution.pageUrl,
                            signal,
                            directFetchModes,
                            target.byterange
                        )

                        let outputChunk = bytes
                        if (target.keyUrl) {
                            if (!target.iv) {
                                throw new Error('Encrypted HLS segment is missing IV')
                            }

                            if (!keyCache.has(target.keyUrl)) {
                                keyCache.set(target.keyUrl, (async () => {
                                    const rawKey = await fetchBytesWithRetry(
                                        target.keyUrl!,
                                        resolution.pageUrl,
                                        signal,
                                        directFetchModes
                                    )
                                    return importAes128Key(rawKey)
                                })())
                            }

                            const cryptoKey = await keyCache.get(target.keyUrl)!
                            outputChunk = await decryptAes128Cbc(bytes, cryptoKey, target.iv)
                        }

                        pendingChunks.set(index, outputChunk)
                        onChunkDownloaded(outputChunk.byteLength)
                        flushReadyChunks()
                    })

                    flushReadyChunks()
                    controller.close()
                } catch (error) {
                    controller.error(error)
                }
            })()
        },
    })

    return new Response(stream)
}

function formatSpeed(bytesPerSecond: number): string {
    if (!Number.isFinite(bytesPerSecond) || bytesPerSecond <= 0) {
        return '--'
    }

    return `${(bytesPerSecond / (1024 * 1024)).toFixed(1)} mb/s`
}

export function HlsBrowserDownloadPanel({
    initialSourceUrl,
    initialRefererUrl,
    initialTitle = '',
    autorun = false,
    onBusyChange,
    onCancelReady,
}: HlsBrowserDownloadPanelProps) {
    const tHls = useTranslations('hlsDownload')
    const tHistory = useTranslations('history')
    const [status, setStatus] = useState(tHls('idleStatus'))
    const [resolveLoading, setResolveLoading] = useState(false)
    const [downloadLoading, setDownloadLoading] = useState(false)
    const [progress, setProgress] = useState(0)
    const [failed, setFailed] = useState(false)
    const [speedBytesPerSecond, setSpeedBytesPerSecond] = useState<number | null>(null)
    const [etaSeconds, setEtaSeconds] = useState<number | null>(null)
    const autorunTriggeredRef = useRef(false)
    const mountedRef = useRef(true)
    const activeAbortControllerRef = useRef<AbortController | null>(null)
    const downloadSamplesRef = useRef<DownloadSample[]>([])
    const isBusy = resolveLoading || downloadLoading

    useEffect(() => {
        onBusyChange?.(isBusy)
    }, [isBusy, onBusyChange])

    useEffect(() => {
        
    return (
        <HlsBrowserDownloadPanelView
            failed={failed}
            isBusy={isBusy}
            progress={progress}
            status={status}
            speedBytesPerSecond={speedBytesPerSecond}
            etaSeconds={etaSeconds}
            autorun={autorun}
            tHls={tHls}
            handleStart={() => void handleStart()}
        />
    )
}
