
'use client'

import { AlertCircle, CheckCircle2, ListVideo, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { formatEta, formatSpeed } from '@/lib/utils'

export interface HlsBrowserDownloadPanelViewProps {
    failed: boolean
    isBusy: boolean
    progress: number
    status: string
    speedBytesPerSecond?: number
    etaSeconds?: number
    autorun?: boolean
    tHls: any
    handleStart: () => void
}

export function HlsBrowserDownloadPanelView(props: HlsBrowserDownloadPanelViewProps) {
    const {
        failed, isBusy, progress, status, speedBytesPerSecond, etaSeconds, autorun, tHls, handleStart
    } = props;

return () => {
            mountedRef.current = false
            activeAbortControllerRef.current?.abort()
        }
    }, [])

    const startTask = useCallback(() => {
        activeAbortControllerRef.current?.abort()
        const controller = new AbortController()
        activeAbortControllerRef.current = controller
        return controller
    }, [])

    const finishTask = useCallback((controller: AbortController) => {
        if (activeAbortControllerRef.current === controller) {
            activeAbortControllerRef.current = null
        }
    }, [])

    const cancelActiveTask = useCallback(() => {
        activeAbortControllerRef.current?.abort()
    }, [])

    useEffect(() => {
        onCancelReady?.(cancelActiveTask)

        return () => {
            onCancelReady?.(null)
        }
    }, [cancelActiveTask, onCancelReady])

    const handleStart = useCallback(async (): Promise<void> => {
        const controller = startTask()
        const directFetchModes = new Map<string, DirectFetchMode>()

        setResolveLoading(true)
        setDownloadLoading(false)
        setFailed(false)
        setProgress(0)
        setSpeedBytesPerSecond(null)
        setEtaSeconds(null)
        downloadSamplesRef.current = []
        setStatus(tHls('resolvingStatus'))

        try {
            const resolution = await resolvePlaylist(
                initialSourceUrl.trim(),
                controller.signal,
                directFetchModes,
                initialRefererUrl.trim(),
                initialTitle.trim()
            )

            if (!mountedRef.current) {
                return
            }

            if (shouldBlockLargeHlsDownloadWithoutStreamingSave(
                resolution.selectedSegments.length,
                supportsStreamingFileSave
            )) {
                setStatus(tHls('largeVideoBrowserLimitedStatus'))
                setFailed(true)
                return
            }

            await probePlaylistHosts(resolution, controller.signal, directFetchModes)

            setResolveLoading(false)
            setDownloadLoading(true)
            setStatus(tHls('downloadingStatus'))

            const targets = [
                ...(resolution.mapUrl
                    ? [{
                        url: resolution.mapUrl,
                        byterange: resolution.mapByterange,
                    }]
                    : []),
                ...resolution.selectedSegments,
            ]
            let completed = 0
            let downloadedBytes = 0
            const extension = inferHlsOutputExtension(resolution.mapUrl, resolution.selectedSegments)
            const baseTitle = sanitizeFilename(initialTitle || resolution.title || tHistory('unknownTitle'))
            const outputName = `${baseTitle || 'hls-browser-download'}-${resolution.selectedSegments.length}-segments.${extension}`
            const mimeType = extension === 'mp4' ? 'video/mp4' : 'video/mp2t'

            const response = createStreamingDownloadResponse({
                targets,
                resolution,
                signal: controller.signal,
                directFetchModes,
                onChunkDownloaded: (bytes) => {
                    completed += 1
                    downloadedBytes += bytes

                    if (!mountedRef.current) {
                        return
                    }

                    const now = Date.now()
                    downloadSamplesRef.current = [
                        ...downloadSamplesRef.current.filter((sample) => now - sample.timestamp <= 8000),
                        { bytes, timestamp: now },
                    ]

                    const samples = downloadSamplesRef.current
                    let nextSpeed: number | null = null

                    if (samples.length >= 2) {
                        const elapsedSeconds = (samples[samples.length - 1].timestamp - samples[0].timestamp) / 1000
                        if (elapsedSeconds > 0) {
                            nextSpeed = samples.reduce((sum, sample) => sum + sample.bytes, 0) / elapsedSeconds
                        }
                    } else if (samples.length === 1 && samples[0].timestamp > now - 1500) {
                        nextSpeed = samples[0].bytes
                    }

                    const averageBytesPerResource = downloadedBytes / completed
                    const remainingResources = targets.length - completed

                    setProgress(Math.round((completed * 100) / targets.length))
                    setSpeedBytesPerSecond(nextSpeed)
                    setEtaSeconds(
                        nextSpeed && averageBytesPerResource > 0
                            ? (remainingResources * averageBytesPerResource) / nextSpeed
                            : null
                    )
                },
            })

            await fileSave(response, {
                fileName: outputName,
                extensions: [`.${extension}`],
                mimeTypes: [mimeType],
            })

            if (!mountedRef.current) {
                return
            }

            setProgress(100)
            setEtaSeconds(0)
            setStatus(tHls('downloadCompletedStatus'))
        } catch (error) {
            if (!mountedRef.current) {
                return
            }

            if (isAbortError(error)) {
                setStatus(tHls('idleStatus'))
                return
            }

            setStatus(tHls('downloadFailedStatus'))
            setFailed(true)
            console.error('Browser HLS download failed:', error)
        } finally {
            finishTask(controller)
            if (mountedRef.current) {
                setResolveLoading(false)
                setDownloadLoading(false)
            }
        }
    }, [tHistory, tHls, finishTask, initialRefererUrl, initialSourceUrl, initialTitle, startTask])

    useEffect(() => {
        if (autorun && initialSourceUrl && !autorunTriggeredRef.current) {
            autorunTriggeredRef.current = true
            window.setTimeout(() => {
                void handleStart()
            }, 0)
        }
    }, [autorun, handleStart, initialSourceUrl])

    return (
        <div className="space-y-5">
            <div className="rounded-md border bg-muted/30 p-3 space-y-3">
                <div className="flex items-start gap-2 text-sm">
                    {failed ? (
                        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                    ) : isBusy ? (
                        <Loader2 className="mt-0.5 h-4 w-4 shrink-0 animate-spin" />
                    ) : progress === 100 ? (
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                    ) : (
                        <ListVideo className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                    )}
                    <div className="min-w-0 space-y-1">
                        <div className="font-medium">{tHls('statusLabel')}</div>
                        <p className="break-words text-muted-foreground">{status}</p>
                    </div>
                </div>
                <Progress value={progress} />
                <div className="grid grid-cols-3 gap-3 text-xs text-muted-foreground sm:text-sm">
                    <div className="rounded-md bg-background/60 px-3 py-2">
                        <div>{tHls('progressLabel')}</div>
                        <div className="mt-1 font-medium text-foreground">{progress}%</div>
                    </div>
                    <div className="rounded-md bg-background/60 px-3 py-2">
                        <div>{tHls('speedLabel')}</div>
                        <div className="mt-1 font-medium text-foreground">
                            {speedBytesPerSecond
                                ? formatSpeed(speedBytesPerSecond)
                                : tHls('calculatingLabel')}
                        </div>
                    </div>
                    <div className="rounded-md bg-background/60 px-3 py-2">
                        <div>{tHls('etaLabel')}</div>
                        <div className="mt-1 font-medium text-foreground">
                            {etaSeconds == null
                                ? tHls('calculatingLabel')
                                : formatEta(etaSeconds)}
                        </div>
                    </div>
                </div>
            </div>

            {failed || (!autorun && !isBusy && progress === 0) ? (
                <div className="flex justify-end">
                    <Button onClick={() => void handleStart()} disabled={isBusy}>
                        {isBusy ? tHls('downloadingButton') : tHls('downloadButton')}
                    </Button>
                </div>
            ) : null}
        </div>
    )
}
