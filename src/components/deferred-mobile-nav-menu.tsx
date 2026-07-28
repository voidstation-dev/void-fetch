'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTranslations } from 'next-intl'

const MobileNavMenu = dynamic(
    () => import('@/components/mobile-nav-menu').then((m) => m.MobileNavMenu),
    { ssr: false }
)

export function DeferredMobileNavMenu() {
    const tPage = useTranslations('page')
    const [mounted, setMounted] = useState(false)

    if (mounted) {
        return <MobileNavMenu defaultOpen />
    }

    return (
        <Button
            variant="ghost"
            size="icon"
            onClick={() => setMounted(true)}
            aria-label={tPage('openMenuLabel')}
        >
            <Menu className="h-5 w-5" />
        </Button>
    )
}
