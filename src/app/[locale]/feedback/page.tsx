import type { Metadata } from "next"
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server"
import { Mail } from "lucide-react"
import { GiscusFeedback } from "@/components/giscus-feedback"
import { Button } from "@/components/ui/button"
import { PageStructuredData } from "@/components/page-structured-data"
import { Footer } from "@/components/layout/footer"
import { i18n, type Locale } from "@/lib/i18n/config"
import type { Dictionary } from "@/lib/i18n/types"

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

const FEEDBACK_EMAIL = "feedback@bhwa233.com"

export async function generateMetadata({
    params,
}: {
    params: Promise<{ locale: Locale }>
}): Promise<Metadata> {
    const { locale } = await params
    const tFeedback = await getTranslations({ locale, namespace: "feedbackPage" })
    const tMeta = await getTranslations({ locale, namespace: "metadata" })
    const title = tFeedback("metaTitle")
    const description = tFeedback("metaDescription")
    const url = buildLocaleUrl(locale, "/feedback")

    return {
        title,
        description,
        robots: {
            index: false,
            follow: true,
            googleBot: {
                index: false,
                follow: true,
            },
        },
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
            languages: buildLanguageAlternates("/feedback"),
        },
    }
}

export default async function FeedbackPage({
    params,
}: {
    params: Promise<{ locale: Locale }>
}) {
    const { locale } = await params
    setRequestLocale(locale)
    const tFeedback = await getTranslations({ locale, namespace: "feedbackPage" })
    const tCommon = await getTranslations({ locale, namespace: "common" })
    const dict = await getMessages({ locale }) as Dictionary

    const emailSubject = encodeURIComponent(`[Feedback] VoidFetch`)
    const emailBody = encodeURIComponent(tFeedback("emailTemplateBody") || '')
    const feedbackMailto = `mailto:${FEEDBACK_EMAIL}?subject=${emailSubject}&body=${emailBody}`

    return (
        <main className="min-h-screen bg-background flex flex-col">
            <div className="flex-1 w-full mx-auto max-w-7xl px-4 py-10 sm:px-6 md:px-8">
                <div>
                    <h1 className="text-3xl font-semibold tracking-tight">{tFeedback("title")}</h1>
                </div>

                <section className="mt-8 rounded-md border bg-card p-5 sm:p-6">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div className="space-y-2">
                            <h2 className="text-lg font-semibold tracking-tight">{tFeedback("privateFeedbackTitle")}</h2>
                            <p className="text-sm leading-6 text-muted-foreground whitespace-pre-wrap">{tFeedback("privateFeedbackDescription")}</p>
                            <p className="break-all rounded-md border bg-muted/30 px-3 py-2 text-sm font-medium">
                                {FEEDBACK_EMAIL}
                            </p>
                        </div>
                        <Button asChild className="shrink-0">
                            <a href={feedbackMailto}>
                                <Mail className="h-4 w-4" />
                                {tFeedback("emailAction")}
                            </a>
                        </Button>
                    </div>
                </section>

                <section className="mt-6 rounded-md border bg-card p-4 sm:p-6 mb-10">
                    <GiscusFeedback locale={locale} />
                </section>
            </div>

            <Footer locale={locale} dict={dict} />

            <PageStructuredData
                locale={locale}
                pageTitle={tFeedback("title")}
                pageDescription={tFeedback("metaDescription")}
                path="/feedback"
                breadcrumbs={[
                    { name: tCommon("home"), path: "" },
                    { name: tFeedback("title"), path: "/feedback" },
                ]}
            />
        </main>
    )
}
