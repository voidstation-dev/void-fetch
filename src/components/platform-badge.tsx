'use client'

import { useTranslations } from 'next-intl'
import { Badge } from '@/components/ui/badge'
import { getPlatformBadge } from '@/lib/platforms'

interface PlatformBadgeProps {
    platform: string | null | undefined
}

export function PlatformBadge({ platform }: PlatformBadgeProps) {
    const tPlatforms = useTranslations('history.platforms')
    const badge = getPlatformBadge(platform, tPlatforms)

    return (
        <Badge  variant="outline">
            {badge.text}
        </Badge>
    )
}
