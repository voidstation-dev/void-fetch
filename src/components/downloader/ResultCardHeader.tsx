import { Share2, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { CardHeader, CardTitle } from '@/components/ui/card';
import { useTranslations } from 'next-intl';
import { formatDuration } from '@/lib/utils';

interface ResultCardHeaderProps {
    title: string;
    duration?: number | null;
    canSharePlayLink: boolean;
    onCopyShareLink: () => void;
    onClose: () => void;
}

export function ResultCardHeader({
    title,
    duration,
    canSharePlayLink,
    onCopyShareLink,
    onClose,
}: ResultCardHeaderProps) {
    const tResult = useTranslations('result');

    return (
        <CardHeader className="p-3 pb-2">
            <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-base">{tResult('title')}</CardTitle>
                <div className="flex items-center gap-1.5">
                    {canSharePlayLink && (
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-8 gap-1.5 text-xs"
                            onClick={onCopyShareLink}
                            title={tResult('sharePlayLink')}
                        >
                            <Share2 className="h-4 w-4" />
                            <span>{tResult('sharePlayLink')}</span>
                        </Button>
                    )}
                    <Button
                        variant="ghost"
                        size="sm"
                        aria-label="Close result card"
                        className="h-8 w-8 px-0"
                        onClick={onClose}
                    >
                        <X className="h-4 w-4" aria-hidden="true" />
                    </Button>
                </div>
            </div>
            <p
                className="line-clamp-2 text-[13px] leading-snug text-foreground/80 break-words"
                title={title}
            >
                {title}
                {duration != null && (
                    <span className="ml-2 text-xs text-foreground/70">({formatDuration(duration)})</span>
                )}
            </p>
        </CardHeader>
    );
}
