import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { PageStructuredData } from "@/components/page-structured-data";
import { i18n, type Locale } from "@/lib/i18n/config";

export async function generateStaticParams() {
  return i18n.locales.map((locale) => ({ locale }));
}

export const dynamic = "force-static";
import {
  buildLanguageAlternates,
  buildLocaleUrl,
  buildOpenGraphLocaleAlternates,
  localeToOpenGraphLocale,
} from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const tContact = await getTranslations({ locale, namespace: "contactPage" });
  const tMeta = await getTranslations({ locale, namespace: "metadata" });
  const title = tContact("metaTitle");
  const description = tContact("metaDescription");
  const url = buildLocaleUrl(locale, "/contact");

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
  };
}

export default async function ContactPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const tContact = await getTranslations({ locale, namespace: "contactPage" });
  const tCommon = await getTranslations({ locale, namespace: "common" });
  const tFeedback = await getTranslations({
    locale,
    namespace: "feedbackPage",
  });

  return (
    <main className="min-h-screen bg-background/50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 md:px-8 py-10 space-y-4">
        {/* Header Block */}
        <div className="flex items-center justify-between p-4 border rounded-xl bg-card border-border/80 shadow-sm">
          <div className="flex flex-col gap-0.5">
            <h1 className="text-sm font-bold text-foreground">
              {tContact("title")}
            </h1>
            <span className="text-[10px] text-muted-foreground uppercase">
              {tContact("intro")}
            </span>
          </div>
        </div>

        {/* Content Block */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="border rounded-xl bg-card border-border/80 p-5 flex flex-col gap-2 text-xs text-foreground shadow-sm">
            <Link
              href={`/${locale}/feedback`}
              className="font-semibold text-sm hover:text-primary transition-colors underline underline-offset-2"
            >
              {tContact("feedback")}
            </Link>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {tContact("feedbackHint")}
            </p>
          </div>
          <div className="border rounded-xl bg-card border-border/80 p-5 flex flex-col gap-2 text-xs text-foreground shadow-sm">
            <a
              href="https://github.com/voidstation-dev/void-fetch/issues/new"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-sm hover:text-primary transition-colors underline underline-offset-2"
            >
              {tContact("github")}
            </a>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {tContact("githubHint")}
            </p>
          </div>
        </div>

        {/* Footer Block */}
        <div className="flex flex-col gap-2 p-5 border rounded-xl bg-card border-border/80 shadow-sm">
          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <span className="font-bold text-foreground/80">
              {tCommon("relatedPages")}
            </span>
            <Link
              className="hover:text-primary transition-colors underline underline-offset-2"
              href={`/${locale}`}
            >
              {tCommon("home")}
            </Link>
            <span className="opacity-50">·</span>
            <Link
              className="hover:text-primary transition-colors underline underline-offset-2"
              href={`/${locale}/feedback`}
            >
              {tFeedback("title")}
            </Link>
            <span className="opacity-50">·</span>
            <Link
              className="hover:text-primary transition-colors underline underline-offset-2"
              href={`/${locale}/privacy`}
            >
              {tCommon("privacy")}
            </Link>
            <span className="opacity-50">·</span>
            <Link
              className="hover:text-primary transition-colors underline underline-offset-2"
              href={`/${locale}/terms`}
            >
              {tCommon("terms")}
            </Link>
          </div>
        </div>
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
  );
}
