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
    const tContact = await getTranslations({ locale, namespace: "contactPage" })
    const tMeta = await getTranslations({ locale, namespace: "metadata" })
    const title = tContact("metaTitle")
    const description = tContact("metaDescription")
    const url = buildLocaleUrl(locale, "/contact")

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
            images: ["/og/contact.png"],
        },
        twitter: {
            card: "summary_large_image",
            title,
            description,
            images: ["/og/contact.png"],
        },
        alternates: {
            canonical: url,
            languages: buildLanguageAlternates("/contact"),
        },
    }
}

export default async function ContactPage({
    params,
}: {
    params: Promise<{ locale: Locale }>
}) {
    const { locale } = await params
    setRequestLocale(locale)
    const tContact = await getTranslations({ locale, namespace: "contactPage" })
    const tCommon = await getTranslations({ locale, namespace: "common" })
    const tFeedback = await getTranslations({ locale, namespace: "feedbackPage" })

    return (
        <main className="min-h-screen bg-background">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 md:px-8 py-10 space-y-6">
                <h1 className="text-3xl font-semibold tracking-tight">{tContact("title")}</h1>
                <p className="text-sm text-muted-foreground leading-6">{tContact("intro")}</p>
                <div className="rounded-md border bg-card p-5 space-y-2">
                    <Link
                        href={`/${locale}/feedback`}
                        className="text-sm underline"
                    >
                        {tContact("feedback")}
                    </Link>
                    <p className="text-sm text-muted-foreground">{tContact("feedbackHint")}</p>
                </div>
                <div className="rounded-md border bg-card p-5 space-y-2">
                    <a
                        href="https://github.com/voidstation-dev/void-fetch/issues/new"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm underline"
                    >
                        {tContact("github")}
                    </a>
                    <p className="text-sm text-muted-foreground">{tContact("githubHint")}</p>
                </div>
                <p className="text-sm text-muted-foreground">
                    {tCommon("relatedPages")}
                    {": "}
                    <Link className="underline" href={`/${locale}`}>{tCommon("home")}</Link>
                    {' · '}
                    <Link className="underline" href={`/${locale}/feedback`}>{tFeedback("title")}</Link>
                    {' · '}
                    <Link className="underline" href={`/${locale}/privacy`}>{tCommon("privacy")}</Link>
                    {' · '}
                    <Link className="underline" href={`/${locale}/terms`}>{tCommon("terms")}</Link>
                </p>
            </div>
            <PageStructuredData
                locale={locale}
                pageTitle={tContact("title")}
                pageDescription={tContact("intro")}
                path="/contact"
                breadcrumbs={[
                    { name: tCommon("home"), path: "" },
                    { name: tContact("title"), path: "/contact" },
                ]}
            />
        </main>
    )
}
