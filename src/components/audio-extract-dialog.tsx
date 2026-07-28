'use client'

import { useCallback, useEffect, useId, useState, type ChangeEvent, type DragEvent } from 'react'

import { AlertCircle, CheckCircle2, Loader2, Music } from 'lucide-react'
import * as Tabs from '@radix-ui/react-tabs'

import { FileExtractPanel } from '@/components/audio-tool/file-extract-panel'
import { MergePanel } from '@/components/audio-tool/merge-panel'
import { ResultAutoExtractPanel } from '@/components/audio-tool/result-auto-extract-panel'
import type { AudioExtractTask, AudioToolStage, ExtractMode, ResultTaskAction } from '@/components/audio-tool/types'
import { getResultMediaActions } from '@/components/downloader/result-card-visibility'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'
import { useFFmpeg, type FFmpegStatus } from '@/hooks/use-ffmpeg'
import { useTranslations } from 'next-intl'
import { isApiRequestError, resolveApiErrorMessage } from '@/lib/api-errors'
import { toast } from '@/lib/deferred-toast'
import { UnifiedParseReloadError, requestUnifiedParse } from '@/lib/unified-parse'
import { cn, downloadFile, formatBytes, sanitizeFilename } from '@/lib/utils'

interface AudioExtractDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    entry?: 'toolbar' | 'result'
    autoExtractTask?: AudioExtractTask | null
}

const MAX_VIDEO_FILE_SIZE = 500 * 1024 * 1024
const MAX_AUDIO_FILE_SIZE = 100 * 1024 * 1024
const MAX_TOTAL_MERGE_SIZE = 800 * 1024 * 1024

const SUPPORTED_VIDEO_TYPES = new Set([
    'video/mp4',
    'video/webm',
    'video/quicktime',
    'video/x-matroska',
    'video/avi',
    'video/mpeg',
])

const SUPPORTED_AUDIO_TYPES = new Set([
    'audio/mpeg',
    'audio/mp3',
    'audio/aac',
    'audio/x-aac',
    'audio/wav',
    'audio/x-wav',
    'audio/wave',
    'audio/ogg',
    'audio/flac',
    'audio/x-flac',
    'audio/mp4',
    'audio/x-m4a',
])

const VIDEO_EXTENSIONS = new Set(['mp4', 'webm', 'mov', 'mkv', 'avi', 'mpeg', 'mpg'])
const AUDIO_EXTENSIONS = new Set(['mp3', 'aac', 'wav', 'ogg', 'flac', 'm4a'])
const PROCESSING_STATUSES = new Set<FFmpegStatus>([
    'loading',
    'downloading',
    'converting',
    'reading-video',
    'reading-audio',
    'merging',
])

function getFileExtension(file: File): string {
    const match = /\.([a-z0-9]+)$/i.exec(file.name)
    return match?.[1]?.toLowerCase() ?? ''
}

function isSupportedVideoFile(file: File): boolean {
    const extension = getFileExtension(file)
    if (VIDEO_EXTENSIONS.has(extension)) {
        return true
    }

    return !!file.type && (SUPPORTED_VIDEO_TYPES.has(file.type) || file.type.startsWith('video/'))
}

function isSupportedAudioFile(file: File): boolean {
    const extension = getFileExtension(file)
    if (AUDIO_EXTENSIONS.has(extension)) {
        return true
    }

    return !!file.type && (SUPPORTED_AUDIO_TYPES.has(file.type) || file.type.startsWith('audio/'))
}

function getExtensionFromUrl(url: string): string | null {
    try {
        const pathname = new URL(url).pathname
        const match = /\.([a-z0-9]+)$/i.exec(pathname)
        return match?.[1]?.toLowerCase() ?? null
    } catch {
        return null
    }
}

function getExtensionFromContentType(contentType: string | null, fallback: string): string {
    const normalized = contentType?.split(';')[0]?.trim().toLowerCase() ?? ''

    if (!normalized) {
        return fallback
    }

    const extensionMap: Record<string, string> = {
        'video/mp4': 'mp4',
        'video/webm': 'webm',
        'video/quicktime': 'mov',
        'video/x-matroska': 'mkv',
        'video/avi': 'avi',
        'audio/mpeg': 'mp3',
        'audio/mp3': 'mp3',
        'audio/mp4': 'm4a',
        'audio/x-m4a': 'm4a',
        'audio/aac': 'aac',
        'audio/x-aac': 'aac',
        'audio/wav': 'wav',
        'audio/x-wav': 'wav',
        'audio/ogg': 'ogg',
        'audio/flac': 'flac',
        'audio/x-flac': 'flac',
    }

    return extensionMap[normalized] ?? fallback
}

function resolveResultTaskAction(task: AudioExtractTask | null | undefined): ResultTaskAction | null {
    if (!task) {
        return null
    }

    if (task.action) {
        return task.action
    }

    const actions = getResultMediaActions({
        mediaActions: task.mediaActions,
        videoDownloadUrl: task.videoUrl,
        audioDownloadUrl: task.audioUrl,
    })

    if (actions.videoAction === 'merge-then-download') {
        return 'merge-video'
    }

    if (actions.audioAction === 'extract-audio') {
        return 'extract-audio'
    }

    return null
}

export function AudioExtractDialog({
    open,
    onOpenChange,
    entry = 'toolbar',
    autoExtractTask = null,
}: AudioExtractDialogProps) {
    const tAudioTool = useTranslations('audioTool')
    const tExtractAudio = useTranslations('extractAudio')
    const tErrors = useTranslations('errors')
    const tHistory = useTranslations('history')
    const tResult = useTranslations('result')
    const extractFileInputId = useId()
    const mergeVideoInputId = useId()
    const mergeAudioInputId = useId()
    const [mode, setMode] = useState<ExtractMode>('file')
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [mergeVideoFile, setMergeVideoFile] = useState<File | null>(null)
    const [mergeAudioFile, setMergeAudioFile] = useState<File | null>(null)
    const [stage, setStage] = useState<AudioToolStage>('idle')
    const [errorMessage, setErrorMessage] = useState('')
    const { status, progress, progressInfo, error, extractAudio, extractAudioFromFile, mergeVideoAndAudio, reset, cancel } = useFFmpeg()
    const resultTaskAction = resolveResultTaskAction(autoExtractTask)
    const autoTaskKey = autoExtractTask
        ? `${autoExtractTask.action ?? ''}::${autoExtractTask.mediaActions?.video ?? ''}::${autoExtractTask.mediaActions?.audio ?? ''}::${autoExtractTask.audioUrl ?? ''}::${autoExtractTask.videoUrl ?? ''}::${autoExtractTask.sourceUrl ?? ''}::${autoExtractTask.title ?? ''}`
        : null

    const ffmpegProcessing = PROCESSING_STATUSES.has(status)
    const showProgress = ffmpegProcessing
    const isBusy = stage === 'parsing' || stage === 'preparing-merge' || stage === 'direct-downloading' || stage === 'reading-file' || ffmpegProcessing
    const toolbarDescription = mode === 'merge'
        ? tAudioTool('mergeDescription')
        : tAudioTool('extractDescription')

    const setValidationError = useCallback((message: string) => {
        setStage('error')
        setErrorMessage(message)
        toast.error(message)
    }, [])

    const validateMergeTotalSize = useCallback((videoFile: File | null, audioFile: File | null): boolean => {
        const totalSize = (videoFile?.size ?? 0) + (audioFile?.size ?? 0)
        if (totalSize > MAX_TOTAL_MERGE_SIZE) {
            setValidationError(tErrors('totalSizeTooLarge'))
            return false
        }

        return true
    }, [tErrors, setValidationError])

    const validateExtractVideoFile = useCallback((file: File): boolean => {
        if (file.size > MAX_VIDEO_FILE_SIZE) {
            setValidationError(tErrors('fileTooLarge'))
            return false
        }

        if (file.size === 0) {
            setValidationError(tErrors('fileEmpty'))
            return false
        }

        if (!isSupportedVideoFile(file)) {
            setValidationError(tErrors('fileFormatNotSupported'))
            return false
        }

        return true
    }, [tErrors, setValidationError])

    const validateMergeVideoFile = useCallback((file: File): boolean => {
        if (file.size > MAX_VIDEO_FILE_SIZE) {
            setValidationError(tErrors('videoFileTooLarge'))
            return false
        }

        if (file.size === 0) {
            setValidationError(tErrors('fileEmpty'))
            return false
        }

        if (!isSupportedVideoFile(file)) {
            setValidationError(tErrors('fileFormatNotSupported'))
            return false
        }

        return true
    }, [tErrors, setValidationError])

    const validateMergeAudioFile = useCallback((file: File): boolean => {
        if (file.size > MAX_AUDIO_FILE_SIZE) {
            setValidationError(tErrors('audioFileTooLarge'))
            return false
        }

        if (file.size === 0) {
            setValidationError(tErrors('fileEmpty'))
            return false
        }

        if (!isSupportedAudioFile(file)) {
            setValidationError(tErrors('audioFormatNotSupported'))
            return false
        }

        return true
    }, [tErrors, setValidationError])

    const fetchRemoteFile = useCallback(async (
        sourceUrl: string,
        fileKind: 'video' | 'audio',
        title: string
    ): Promise<File> => {
        const response = await fetch(sourceUrl, {
            cache: 'no-store',
        })

        if (!response.ok) {
            throw new Error(tErrors('downloadError'))
        }

        const blob = await response.blob()
        if (blob.size === 0) {
            throw new Error(tErrors('fileEmpty'))
        }

        const fallbackExtension = fileKind === 'video' ? 'mp4' : 'm4a'
        const extension = getExtensionFromUrl(sourceUrl)
            ?? getExtensionFromContentType(response.headers.get('content-type'), fallbackExtension)
        const filename = `${sanitizeFilename(title || tHistory('unknownTitle'))}-${fileKind}.${extension}`

        return new File([blob], filename, {
            type: blob.type || response.headers.get('content-type') || undefined,
        })
    }, [tErrors, tHistory])

    const statusText = (() => {
        if (stage === 'parsing') {
            return tAudioTool('statusParsing')
        }

        if (stage === 'preparing-merge') {
            return tAudioTool('statusPreparingMerge')
        }

        if (stage === 'direct-downloading') {
            return tAudioTool('statusDirectDownloading')
        }

        if (stage === 'fallback-extracting') {
            return tAudioTool('statusFallbackExtracting')
        }

        if (status === 'reading-video') {
            return tAudioTool('statusReadingVideo')
        }

        if (status === 'reading-audio') {
            return tAudioTool('statusReadingAudio')
        }

        if (status === 'merging') {
            return tAudioTool('statusMerging')
        }

        if (mode === 'merge' && status === 'idle' && !mergeVideoFile && !mergeAudioFile) {
            return tAudioTool('statusMergeIdle')
        }

        if (mode === 'file') {
            if (stage === 'reading-file') {
                return tAudioTool('statusReadingFile')
            }

            if (selectedFile && stage === 'idle' && status === 'idle') {
                return tAudioTool('statusFileReady')
            }
        }

        if (status === 'loading') {
            return tExtractAudio('loading')
        }

        if (status === 'downloading') {
            if (progressInfo?.loaded && progressInfo?.total) {
                return tExtractAudio('downloadingWithSize', {
                    progress: Math.floor(progress),
                    loaded: formatBytes(progressInfo.loaded),
                    total: formatBytes(progressInfo.total),
                })
            }

            return tExtractAudio('downloading', { progress: Math.floor(progress) })
        }

        if (status === 'converting') {
            return tExtractAudio('converting', { progress: Math.floor(progress) })
        }

        if (stage === 'completed' || status === 'completed') {
            return tAudioTool('statusCompleted')
        }

        if (stage === 'error' || status === 'error') {
            return errorMessage || error || tErrors('downloadError')
        }

        return (entry === 'result' && resultTaskAction === 'merge-video') || mode === 'merge'
            ? tAudioTool('statusMergeIdle')
            : tAudioTool('statusIdle')
    })()

    useEffect(() => {
        if (!open) {
            const timer = window.setTimeout(() => {
                setSelectedFile(null)
                setMergeVideoFile(null)
                setMergeAudioFile(null)
                setStage('idle')
                setErrorMessage('')
                setMode('file')
                reset()
            }, 150)

            return () => window.clearTimeout(timer)
        }
    }, [open, reset])

    const runAutoExtractTask = useCallback(async (task: AudioExtractTask) => {
        if (status === 'error') {
            reset()
        }

        setErrorMessage('')

        try {
            const outputTitle = task.title || tHistory('unknownTitle')
            const initialTaskAction = resolveResultTaskAction(task)

            if (initialTaskAction === 'extract-audio' && task.videoUrl) {
                setStage('fallback-extracting')
                await extractAudio(task.videoUrl, outputTitle)
                return
            }

            if (initialTaskAction === 'merge-video' && task.videoUrl && task.audioUrl) {
                setStage('preparing-merge')
                const [videoFile, audioFile] = await Promise.all([
                    fetchRemoteFile(task.videoUrl, 'video', outputTitle),
                    fetchRemoteFile(task.audioUrl, 'audio', outputTitle),
                ])

                if (
                    !validateMergeVideoFile(videoFile)
                    || !validateMergeAudioFile(audioFile)
                    || !validateMergeTotalSize(videoFile, audioFile)
                ) {
                    return
                }

                setStage('idle')
                await mergeVideoAndAudio(videoFile, audioFile, outputTitle)
                return
            }

            if (!initialTaskAction && task.audioUrl) {
                setStage('direct-downloading')
                downloadFile(task.audioUrl)
                setStage('completed')
                return
            }

            if (!initialTaskAction && task.videoUrl) {
                setStage('fallback-extracting')
                await extractAudio(task.videoUrl, outputTitle)
                return
            }

            if (!task.sourceUrl?.trim()) {
                setValidationError(tAudioTool('noAudioSource'))
                return
            }

            setStage('parsing')
            const apiResult = await requestUnifiedParse(task.sourceUrl.trim())
            const parsed = apiResult.data
            const audioDownloadUrl = parsed.downloadAudioUrl || parsed.originDownloadAudioUrl || null
            const videoDownloadUrl = parsed.downloadVideoUrl || parsed.originDownloadVideoUrl || null
            const resolvedTitle = parsed.title || parsed.desc || outputTitle
            const parsedActions = getResultMediaActions({
                mediaActions: parsed.mediaActions,
                videoDownloadUrl,
                audioDownloadUrl,
            })
            const resolvedTaskAction = initialTaskAction
                ?? (parsedActions.videoAction === 'merge-then-download'
                    ? 'merge-video'
                    : parsedActions.audioAction === 'extract-audio'
                        ? 'extract-audio'
                        : null)

            if (!resolvedTaskAction && parsedActions.audioAction === 'direct-download' && audioDownloadUrl) {
                setStage('direct-downloading')
                downloadFile(audioDownloadUrl)
                setStage('completed')
                return
            }

            if (resolvedTaskAction === 'merge-video') {
                if (!videoDownloadUrl || !audioDownloadUrl) {
                    throw new Error(tAudioTool('noMergeSource'))
                }

                setStage('preparing-merge')
                const [videoFile, audioFile] = await Promise.all([
                    fetchRemoteFile(videoDownloadUrl, 'video', resolvedTitle),
                    fetchRemoteFile(audioDownloadUrl, 'audio', resolvedTitle),
                ])

                if (
                    !validateMergeVideoFile(videoFile)
                    || !validateMergeAudioFile(audioFile)
                    || !validateMergeTotalSize(videoFile, audioFile)
                ) {
                    return
                }

                setStage('idle')
                await mergeVideoAndAudio(videoFile, audioFile, resolvedTitle)
                return
            }

            if (resolvedTaskAction === 'extract-audio') {
                if (!videoDownloadUrl) {
                    throw new Error(tAudioTool('noAudioSource'))
                }

                setStage('fallback-extracting')
                await extractAudio(videoDownloadUrl, resolvedTitle)
                return
            }

            if (videoDownloadUrl) {
                setStage('fallback-extracting')
                await extractAudio(videoDownloadUrl, resolvedTitle)
                return
            }

            if (audioDownloadUrl) {
                setStage('direct-downloading')
                downloadFile(audioDownloadUrl)
                setStage('completed')
                return
            }

            throw new Error(tAudioTool('noAudioSource'))
        } catch (err) {
            if (err instanceof UnifiedParseReloadError) {
                setStage('idle')
                return
            }

            if (isApiRequestError(err)) {
                console.error('Audio tool auto parse failed', {
                    code: err.code,
                    status: err.status,
                    requestId: err.requestId,
                    details: err.details,
                })
            }

            const resolvedMessage = resolveApiErrorMessage(err, {
                api: {
                    networkError: tErrors('api.networkError'),
                    rateLimit: tErrors('api.rateLimit'),
                    serverError: tErrors('api.serverError'),
                    serviceUnavailable: tErrors('api.serviceUnavailable'),
                    unknownError: tErrors('api.unknownError'),
                },
                downloadError: tErrors('downloadError'),
            })
            setStage('error')
            setErrorMessage(resolvedMessage)
            toast.error(tErrors('downloadFailed'), {
                description: resolvedMessage,
            })
        }
    }, [
        tAudioTool,
        tErrors,
        tHistory,
        extractAudio,
        fetchRemoteFile,
        mergeVideoAndAudio,
        reset,
        setValidationError,
        status,
        validateMergeAudioFile,
        validateMergeTotalSize,
        validateMergeVideoFile,
    ])

    const handleExtractFileSelect = useCallback((event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (!file) return

        setErrorMessage('')
        setStage('idle')

        if (!validateExtractVideoFile(file)) {
            setSelectedFile(null)
            event.target.value = ''
            return
        }

        setSelectedFile(file)
    }, [validateExtractVideoFile])

    const handleExtractFileDrop = useCallback((event: DragEvent<HTMLDivElement>) => {
        event.preventDefault()
        event.stopPropagation()

        const file = event.dataTransfer.files?.[0]
        if (!file) return

        setErrorMessage('')
        setStage('idle')

        if (!validateExtractVideoFile(file)) {
            setSelectedFile(null)
            return
        }

        setSelectedFile(file)
    }, [validateExtractVideoFile])

    const handleMergeVideoSelect = useCallback((event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (!file) return

        setErrorMessage('')
        setStage('idle')

        if (!validateMergeVideoFile(file) || !validateMergeTotalSize(file, mergeAudioFile)) {
            event.target.value = ''
            return
        }

        setMergeVideoFile(file)
    }, [mergeAudioFile, validateMergeTotalSize, validateMergeVideoFile])

    const handleMergeAudioSelect = useCallback((event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (!file) return

        setErrorMessage('')
        setStage('idle')

        if (!validateMergeAudioFile(file) || !validateMergeTotalSize(mergeVideoFile, file)) {
            event.target.value = ''
            return
        }

        setMergeAudioFile(file)
    }, [mergeVideoFile, validateMergeAudioFile, validateMergeTotalSize])

    const handleMergeVideoDrop = useCallback((event: DragEvent<HTMLDivElement>) => {
        event.preventDefault()
        event.stopPropagation()

        const file = event.dataTransfer.files?.[0]
        if (!file) return

        setErrorMessage('')
        setStage('idle')

        if (!validateMergeVideoFile(file) || !validateMergeTotalSize(file, mergeAudioFile)) {
            return
        }

        setMergeVideoFile(file)
    }, [mergeAudioFile, validateMergeTotalSize, validateMergeVideoFile])

    const handleMergeAudioDrop = useCallback((event: DragEvent<HTMLDivElement>) => {
        event.preventDefault()
        event.stopPropagation()

        const file = event.dataTransfer.files?.[0]
        if (!file) return

        setErrorMessage('')
        setStage('idle')

        if (!validateMergeAudioFile(file) || !validateMergeTotalSize(mergeVideoFile, file)) {
            return
        }

        setMergeAudioFile(file)
    }, [mergeVideoFile, validateMergeAudioFile, validateMergeTotalSize])

    const handleDragOver = useCallback((event: DragEvent<HTMLDivElement>) => {
        event.preventDefault()
        event.stopPropagation()
    }, [])

    const handleClearExtractFile = useCallback(() => {
        setSelectedFile(null)
        setErrorMessage('')
        setStage('idle')
        reset()
    }, [reset])

    const handleClearMergeVideo = useCallback(() => {
        setMergeVideoFile(null)
        setErrorMessage('')
        setStage('idle')
        reset()
    }, [reset])

    const handleClearMergeAudio = useCallback(() => {
        setMergeAudioFile(null)
        setErrorMessage('')
        setStage('idle')
        reset()
    }, [reset])

    const handleExtractFile = async () => {
        if (!selectedFile) {
            setValidationError(tErrors('emptyUrl'))
            return
        }

        if (status === 'error') {
            reset()
        }

        setStage('reading-file')
        setErrorMessage('')
        await extractAudioFromFile(selectedFile, selectedFile.name.replace(/\.[^.]+$/, ''))
    }

    const handleMerge = async () => {
        if (!mergeVideoFile) {
            setValidationError(tErrors('noVideoSelected'))
            return
        }

        if (!mergeAudioFile) {
            setValidationError(tErrors('noAudioSelected'))
            return
        }

        if (!validateMergeTotalSize(mergeVideoFile, mergeAudioFile)) {
            return
        }

        if (status === 'error') {
            reset()
        }

        setStage('idle')
        setErrorMessage('')
        await mergeVideoAndAudio(mergeVideoFile, mergeAudioFile, mergeVideoFile.name.replace(/\.[^.]+$/, ''))
    }

    useEffect(() => {
        if (!open || entry !== 'result' || !autoExtractTask || !autoTaskKey) {
            return
        }

        if (stage !== 'idle' || ffmpegProcessing || status === 'completed') {
            return
        }

        const timer = window.setTimeout(() => {
            void runAutoExtractTask(autoExtractTask)
        }, 0)

        return () => window.clearTimeout(timer)
    }, [autoExtractTask, autoTaskKey, entry, ffmpegProcessing, open, runAutoExtractTask, stage, status])

    const handleDialogOpenChange = useCallback((nextOpen: boolean) => {
        if (!nextOpen) {
            cancel()
        }

        onOpenChange(nextOpen)
    }, [cancel, onOpenChange])

    const statusPanel = (
        <div className="rounded-md border bg-muted/30 p-3 space-y-2">
            <div className="flex items-start gap-2 text-sm">
                {(stage === 'error' || status === 'error') ? (
                    <AlertCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                ) : (stage === 'completed' || status === 'completed') ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                ) : ffmpegProcessing || stage === 'parsing' || stage === 'preparing-merge' || stage === 'direct-downloading' || stage === 'reading-file' ? (
                    <Loader2 className="h-4 w-4 animate-spin mt-0.5 shrink-0" />
                ) : (
                    <Music className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                )}
                <p className={(stage === 'error' || status === 'error') ? 'text-destructive' : 'text-foreground/80'}>
                    {statusText}
                </p>
            </div>

            {showProgress && (
                <Progress value={Math.floor(progress)} className="h-2" />
            )}
        </div>
    )

    return (
        <Dialog open={open} onOpenChange={handleDialogOpenChange}>
            <DialogContent
                className="flex max-h-[calc(100vh-2rem)] max-w-2xl flex-col overflow-hidden p-4 sm:max-h-[90vh] sm:p-6"
                onInteractOutside={(event) => {
                    event.preventDefault()
                }}
            >
                <DialogHeader>
                    <DialogTitle>
                        {entry === 'result'
                            ? (resultTaskAction === 'merge-video'
                                ? tResult('mergeDownloadVideo')
                                : tExtractAudio('button'))
                            : tAudioTool('title')}
                    </DialogTitle>
                    <DialogDescription>
                        {entry === 'result'
                            ? (autoExtractTask?.title || autoExtractTask?.videoUrl || tHistory('unknownTitle'))
                            : toolbarDescription}
                    </DialogDescription>
                </DialogHeader>

                <div
                    className="flex-1 min-h-0 overflow-y-auto pr-1"
                    style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 0px)' }}
                >
                    {entry === 'result' && autoExtractTask ? (
                        <ResultAutoExtractPanel
                            task={autoExtractTask}
                            stage={stage}
                            isBusy={isBusy}
                            statusPanel={statusPanel}
                            onRetry={() => void runAutoExtractTask(autoExtractTask)}
                        />
                    ) : (
                        <Tabs.Root value={mode} onValueChange={(value) => setMode(value as ExtractMode)} className="space-y-4">
                            <Tabs.List className="grid grid-cols-2 rounded-lg bg-muted p-1">
                                <Tabs.Trigger
                                    value="file"
                                    className={cn(
                                        'inline-flex items-center justify-center rounded-md px-3 py-1.5 text-sm font-medium transition-all',
                                        mode === 'file'
                                            ? 'bg-background text-foreground shadow-sm'
                                            : 'text-muted-foreground hover:text-foreground'
                                    )}
                                >
                                    {tAudioTool('fileTab')}
                                </Tabs.Trigger>
                                <Tabs.Trigger
                                    value="merge"
                                    className={cn(
                                        'inline-flex items-center justify-center rounded-md px-3 py-1.5 text-sm font-medium transition-all',
                                        mode === 'merge'
                                            ? 'bg-background text-foreground shadow-sm'
                                            : 'text-muted-foreground hover:text-foreground'
                                    )}
                                >
                                    {tAudioTool('mergeTab')}
                                </Tabs.Trigger>
                            </Tabs.List>

                            <Tabs.Content value="file" className="space-y-4 focus:outline-none">
                                <FileExtractPanel
                                    selectedFile={selectedFile}
                                    inputId={extractFileInputId}
                                    isBusy={isBusy}
                                    statusPanel={statusPanel}
                                    onSelect={handleExtractFileSelect}
                                    onDrop={handleExtractFileDrop}
                                    onDragOver={handleDragOver}
                                    onClear={handleClearExtractFile}
                                    onSubmit={() => void handleExtractFile()}
                                />
                            </Tabs.Content>

                            <Tabs.Content value="merge" className="space-y-4 focus:outline-none">
                                <MergePanel
                                    mergeVideoFile={mergeVideoFile}
                                    mergeAudioFile={mergeAudioFile}
                                    videoInputId={mergeVideoInputId}
                                    audioInputId={mergeAudioInputId}
                                    isBusy={isBusy}
                                    statusPanel={statusPanel}
                                    onVideoSelect={handleMergeVideoSelect}
                                    onAudioSelect={handleMergeAudioSelect}
                                    onVideoDrop={handleMergeVideoDrop}
                                    onAudioDrop={handleMergeAudioDrop}
                                    onDragOver={handleDragOver}
                                    onClearVideo={handleClearMergeVideo}
                                    onClearAudio={handleClearMergeAudio}
                                    onSubmit={() => void handleMerge()}
                                />
                            </Tabs.Content>
                        </Tabs.Root>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}
