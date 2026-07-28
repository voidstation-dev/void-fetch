import type { Metadata } from "next"
import Link from "next/link"
import { getTranslations, setRequestLocale } from "next-intl/server"
import { PageStructuredData } from "@/components/page-structured-data"
import { i18n, type Locale } from "@/lib/i18n/config"

export async function generateStaticParams() {
    return i18n.locales.map((locale) => ({ locale }))
}

export const dynamic = "force-static"
import {
    buildLanguageAlternates,
    buildLocaleUrl,
    buildOpenGraphLocaleAlternates,
    localeToOpenGraphLocale,
} from "@/lib/seo"

export async function generateMetadata({
    params,
}: {
    params: Promise<{ locale: Locale }>
}): Promise<Metadata> {
    const { locale } = await params
    const tPrivacy = await getTranslations({ locale, namespace: "privacyPage" })
    const tMeta = await getTranslations({ locale, namespace: "metadata" })
    const title = tPrivacy("metaTitle")
    const description = tPrivacy("metaDescription")
    const url = buildLocaleUrl(locale, "/privacy")

    return {
        title,
        description,
        openGraph: {
            title,
            description,
            url,
            siteName: tMeta("siteName"),
            locale: localeToOpenGraphLocale(locale),
            alternateLocale: buildOpenGraphLocaleAlternates(locale),
            type: "website",
            images: ["/og/privacy.png"],
        },
        twitter: {
            card: "summary_large_image",
            title,
            description,
            images: ["/og/privacy.png"],
        },
        alternates: {
            canonical: url,
            languages: buildLanguageAlternates("/privacy"),
        },
    }
}

export default async function PrivacyPage({
    params,
}: {
    params: Promise<{ locale: Locale }>
}) {
    const { locale } = await params
    setRequestLocale(locale)
    const tPrivacy = await getTranslations({ locale, namespace: "privacyPage" })
    const tCommon = await getTranslations({ locale, namespace: "common" })
    const points = tPrivacy.raw("points") as string[]

    return (
        <main className="min-h-screen bg-background">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 md:px-8 py-10 space-y-6">
                <h1 className="text-3xl font-semibold tracking-tight">{tPrivacy("title")}</h1>
                <p className="text-sm text-muted-foreground leading-6">{tPrivacy("intro")}</p>
                <ul className="space-y-2 text-sm text-muted-foreground leading-6">
                    {points.map((point) => (
                        <li key={point} className="rounded-md border bg-card p-4">
                            {point}
                        </li>
                    ))}
                </ul>
                <p className="text-xs text-muted-foreground">{tPrivacy("updated")}</p>
                <p className="text-sm text-muted-foreground">
                    {tCommon("relatedPages")}
                    {": "}
                    <Link className="underline" href={`/${locale}/terms`}>{tCommon("terms")}</Link>
                    {' · '}
                    <Link className="underline" href={`/${locale}/contact`}>{tCommon("contact")}</Link>
                </p>
            </div>
            <PageStructuredData
                locale={locale}
                pageTitle={tPrivacy("title")}
                pageDescription={tPrivacy("intro")}
                path="/privacy"
                breadcrumbs={[
                    { name: tCommon("home"), path: "" },
                    { name: tPrivacy("title"), path: "/privacy" },
                ]}
            />
        </main>
    )
}
