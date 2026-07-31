'use client'

import type { ReactNode } from 'react'

import { Button } from '@/components/ui/button'
import { useTranslations } from 'next-intl'

import type { AudioExtractTask, AudioToolStage } from './types'

interface ResultAutoExtractPanelProps {
    task: AudioExtractTask
    stage: AudioToolStage
    isBusy: boolean
    statusPanel: ReactNode
    onRetry: () => void
}

export function ResultAutoExtractPanel({
    task,
    stage,
    isBusy,
    statusPanel,
    onRetry,
}: ResultAutoExtractPanelProps) {
    const tExtractAudio = useTranslations('extractAudio')

    return (
        <div className="space-y-4">
            <div className="rounded-md border bg-muted/20 px-3 py-2 text-xs text-muted-foreground break-all">
                {task.sourceUrl || task.videoUrl || task.audioUrl}
            </div>

            {stage === 'error' && (
                <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={onRetry}
                    disabled={isBusy}
                >
                    {tExtractAudio('retry')}
                </Button>
            )}

            {statusPanel}
        </div>
    )
}
