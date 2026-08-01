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
  const tTerms = await getTranslations({ locale, namespace: "termsPage" });
  const tMeta = await getTranslations({ locale, namespace: "metadata" });
  const title = tTerms("metaTitle");
  const description = tTerms("metaDescription");
  const url = buildLocaleUrl(locale, "/terms");

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
      images: ["/og/terms.png"],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/og/terms.png"],
    },
    alternates: {
      canonical: url,
      languages: buildLanguageAlternates("/terms"),
    },
  };
}

export default async function TermsPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const tTerms = await getTranslations({ locale, namespace: "termsPage" });
  const tCommon = await getTranslations({ locale, namespace: "common" });
  const points = tTerms.raw("points") as string[];

  return (
    <main className="min-h-screen bg-background/50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 md:px-8 py-10 space-y-4">
        {/* Header Block */}
        <div className="flex items-center justify-between p-4 border rounded-xl bg-card border-border/80 shadow-sm">
          <div className="flex flex-col gap-0.5">
            <h1 className="text-sm font-bold text-foreground">
              {tTerms("title")}
            </h1>
            <span className="text-[10px] text-muted-foreground uppercase">
              {tTerms("intro")}
            </span>
          </div>
        </div>

        {/* Content Block */}
        <div className="border rounded-xl bg-card border-border/80 p-6 flex flex-col gap-5 text-xs text-foreground shadow-sm">
          <ul className="space-y-4 text-xs text-muted-foreground leading-relaxed">
            {points.map((point) => (
              <li
                key={point}
                className="flex flex-col gap-1 border-b border-border/40 pb-4 last:border-0 last:pb-0"
              >
                {point}
              </li>
            ))}
          </ul>
        </div>

        {/* Footer Block */}
        <div className="flex flex-col gap-2 p-5 border rounded-xl bg-card border-border/80 shadow-sm">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase">
            {tTerms("updated")}
          </p>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="font-bold text-foreground/80">
              {tCommon("relatedPages")}
            </span>
            <Link
              className="hover:text-primary transition-colors underline underline-offset-2"
              href={`/${locale}/privacy`}
            >
              {tCommon("privacy")}
            </Link>
            <span className="opacity-50">·</span>
            <Link
              className="hover:text-primary transition-colors underline underline-offset-2"
              href={`/${locale}/contact`}
            >
              {tCommon("contact")}
            </Link>
          </div>
        </div>
      </div>
      <PageStructuredData
        locale={locale}
        pageTitle={tTerms("title")}
        pageDescription={tTerms("intro")}
        path="/terms"
        breadcrumbs={[
          { name: tCommon("home"), path: "" },
          { name: tTerms("title"), path: "/terms" },
        ]}
      />
    </main>
  );
}
