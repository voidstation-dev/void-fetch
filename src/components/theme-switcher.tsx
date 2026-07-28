'use client'

import { useSyncExternalStore } from 'react'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'
import { Moon, Sun } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useLocale } from 'next-intl'
import type { Locale } from '@/lib/i18n/config'

interface ThemeSwitcherProps {
    compact?: boolean
    fullWidth?: boolean
}

const THEME_LABELS = {
    zh: { title: '切换主题', light: '浅色', dark: '深色' },
    'zh-tw': { title: '切換主題', light: '淺色', dark: '深色' },
    en: { title: 'Toggle Theme', light: 'Light', dark: 'Dark' },
    ja: { title: 'テーマ切替', light: 'ライト', dark: 'ダーク' },
    es: { title: 'Cambiar Tema', light: 'Claro', dark: 'Oscuro' },
    ru: { title: 'Переключить тему', light: 'Светлая', dark: 'Темная' },
    vi: { title: 'Đổi giao diện', light: 'Sáng', dark: 'Tối' },
} as const

function subscribeToHydration() {
    return () => {}
}

function getClientSnapshot() {
    return true
}

function getServerSnapshot() {
    return false
}

export function ThemeSwitcher({ compact = false, fullWidth = false }: ThemeSwitcherProps) {
    const locale = useLocale() as Locale
    const labels = THEME_LABELS[locale] || THEME_LABELS.en
    const mounted = useSyncExternalStore(subscribeToHydration, getClientSnapshot, getServerSnapshot)
    const { resolvedTheme, setTheme } = useTheme()

    const isDark = mounted ? resolvedTheme === 'dark' : false

    const toggleTheme = () => {
        setTheme(isDark ? 'light' : 'dark')
    }

    if (!mounted) {
        return (
            <Button
                variant="ghost"
                size={compact ? 'icon' : 'sm'}
                className={cn('flex items-center gap-2 text-sm rounded-xl', compact && 'h-9 w-9 p-0', fullWidth && 'w-full justify-between')}
                aria-label={labels.title}
                disabled
            >
                <Sun className="h-4 w-4" />
                {!compact && <span>{labels.light}</span>}
            </Button>
        )
    }

    return (
        <Button
            variant="ghost"
            size={compact ? 'icon' : 'sm'}
            onClick={toggleTheme}
            className={cn('flex items-center gap-2 text-sm rounded-xl transition-all cursor-pointer', compact && 'h-9 w-9 p-0', fullWidth && 'w-full justify-between')}
            aria-label={labels.title}
            title={labels.title}
        >
            {isDark ? (
                <>
                    <Sun className="h-4 w-4 text-amber-400 transition-transform duration-300 hover:rotate-45" />
                    {!compact && <span>{labels.light}</span>}
                </>
            ) : (
                <>
                    <Moon className="h-4 w-4 text-slate-700 dark:text-slate-200 transition-transform duration-300 hover:-rotate-12" />
                    {!compact && <span>{labels.dark}</span>}
                </>
            )}
        </Button>
    )
}
