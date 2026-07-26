export const i18n = {
    defaultLocale: 'en',
    locales: ['zh', 'zh-tw', 'en', 'ja', 'es', 'ru', 'vi']
} as const

export type Locale = (typeof i18n)['locales'][number] 
