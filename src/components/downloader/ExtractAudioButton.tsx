'use client';

import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Loader2, Music, AlertCircle, CheckCircle } from 'lucide-react';
import { useFFmpeg, FFmpegStatus } from '@/hooks/use-ffmpeg';
import { useTranslations } from 'next-intl';
import { formatBytes } from '@/lib/utils';

interface ExtractAudioButtonProps {
  videoUrl: string;
  title: string;
}

export function ExtractAudioButton({ videoUrl, title }: ExtractAudioButtonProps) {
  const tExtractAudio = useTranslations('extractAudio');
  const { status, progress, progressInfo, error, extractAudio, reset } = useFFmpeg();

  const handleClick = () => {
    if (status === 'error') {
      reset();
      return;
    }
    if (status === 'idle') {
      extractAudio(videoUrl, title);
    }
  };

  const getButtonContent = () => {
    switch (status) {
      case 'loading':
        return (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            {tExtractAudio('loading')}
          </>
        );
      case 'downloading':
        // Compact version: show percentage and size
        if (progressInfo?.loaded && progressInfo?.total) {
          return tExtractAudio('downloadingWithSize', {
            progress: Math.floor(progress),
            loaded: formatBytes(progressInfo.loaded),
            total: formatBytes(progressInfo.total),
          });
        }
        return tExtractAudio('downloading', { progress: Math.floor(progress) });
      case 'converting':
        return tExtractAudio('converting', { progress: Math.floor(progress) });
      case 'completed':
        return (
          <>
            <CheckCircle className="h-4 w-4" />
            {tExtractAudio('completed')}
          </>
        );
      case 'error':
        return (
          <>
            <AlertCircle className="h-4 w-4" />
            {tExtractAudio('retry')}
          </>
        );
      default:
        return tExtractAudio('button');
    }
  };

  const isProcessing = (['loading', 'downloading', 'converting'] as FFmpegStatus[]).includes(status);
  const showProgress = (['downloading', 'converting'] as FFmpegStatus[]).includes(status);

  return (
    <div className="space-y-2">
      <Button
        variant={status === 'error' ? 'destructive' : 'outline'}
        className="w-full flex items-center justify-center gap-2"
        onClick={handleClick}
        disabled={isProcessing}
      >
        {getButtonContent()}
      </Button>

      {showProgress && (
        <Progress value={Math.floor(progress)} className="h-2" />
      )}

      {error && (
        <p className="text-xs text-destructive text-center">{error}</p>
      )}
    </div>
  );
}
