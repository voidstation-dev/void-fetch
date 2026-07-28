'use client'

import type { ChangeEvent, DragEvent, ReactNode } from 'react'

import { Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { useTranslations } from 'next-intl'
import { formatBytes } from '@/lib/utils'

import { FileDropzone } from './file-dropzone'

interface MergePanelProps {
    mergeVideoFile: File | null
    mergeAudioFile: File | null
    videoInputId: string
    audioInputId: string
    isBusy: boolean
    statusPanel: ReactNode
    onVideoSelect: (event: ChangeEvent<HTMLInputElement>) => void
    onAudioSelect: (event: ChangeEvent<HTMLInputElement>) => void
    onVideoDrop: (event: DragEvent<HTMLDivElement>) => void
    onAudioDrop: (event: DragEvent<HTMLDivElement>) => void
    onDragOver: (event: DragEvent<HTMLDivElement>) => void
    onClearVideo: () => void
    onClearAudio: () => void
    onSubmit: () => void
}

export function MergePanel({
    mergeVideoFile,
    mergeAudioFile,
    videoInputId,
    audioInputId,
    isBusy,
    statusPanel,
    onVideoSelect,
    onAudioSelect,
    onVideoDrop,
    onAudioDrop,
    onDragOver,
    onClearVideo,
    onClearAudio,
    onSubmit,
}: MergePanelProps) {
    const tAudioTool = useTranslations('audioTool')

    return (
        <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
                <FileDropzone
                    acceptedFile={mergeVideoFile}
                    title={tAudioTool('videoFile')}
                    hint={tAudioTool('dropHint')}
                    limitText={tAudioTool('videoSizeLimit')}
                    emptyButtonLabel={mergeVideoFile ? tAudioTool('changeVideoButton') : tAudioTool('selectVideoButton')}
                    selectedLabel={mergeVideoFile
                        ? tAudioTool('videoSelected', {
                            name: mergeVideoFile.name,
                            size: formatBytes(mergeVideoFile.size),
                        })
                        : ''}
                    inputId={videoInputId}
                    accept="video/*,.mp4,.webm,.mov,.mkv,.avi,.mpeg,.mpg"
                    isBusy={isBusy}
                    onSelect={onVideoSelect}
                    onDrop={onVideoDrop}
                    onDragOver={onDragOver}
                    onClear={onClearVideo}
                />

                <FileDropzone
                    acceptedFile={mergeAudioFile}
                    title={tAudioTool('audioFile')}
                    hint={tAudioTool('dropHint')}
                    limitText={tAudioTool('audioSizeLimit')}
                    emptyButtonLabel={mergeAudioFile ? tAudioTool('changeAudioButton') : tAudioTool('selectAudioButton')}
                    selectedLabel={mergeAudioFile
                        ? tAudioTool('audioSelected', {
                            name: mergeAudioFile.name,
                            size: formatBytes(mergeAudioFile.size),
                        })
                        : ''}
                    inputId={audioInputId}
                    accept="audio/*,.mp3,.aac,.wav,.ogg,.flac,.m4a"
                    isBusy={isBusy}
                    onSelect={onAudioSelect}
                    onDrop={onAudioDrop}
                    onDragOver={onDragOver}
                    onClear={onClearAudio}
                />
            </div>

            {statusPanel}

            <Button
                type="button"
                className="w-full flex items-center justify-center gap-2"
                onClick={onSubmit}
                disabled={isBusy || !mergeVideoFile || !mergeAudioFile}
            >
                {isBusy && <Loader2 className="h-4 w-4 animate-spin" />}
                {isBusy ? tAudioTool('processingButton') : tAudioTool('mergeButton')}
            </Button>
        </div>
    )
}
