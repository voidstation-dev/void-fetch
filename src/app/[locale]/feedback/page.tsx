import type { Metadata } from "next";
import {
  getMessages,
  getTranslations,
  setRequestLocale,
} from "next-intl/server";
import { MessageSquare, MessageCircle } from "lucide-react";
import { GiscusFeedback } from "@/components/giscus-feedback";
import { FeedbackEmailCard } from "@/components/feedback-email-card";
import { PageStructuredData } from "@/components/page-structured-data";
import { Footer } from "@/components/layout/footer";
import { BackgroundGrid } from "@/components/ui/background-grid";
import { i18n, type Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/types";

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

const FEEDBACK_EMAIL = "feedback@bhwa233.com";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const tFeedback = await getTranslations({
    locale,
    namespace: "feedbackPage",
  });
  const tMeta = await getTranslations({ locale, namespace: "metadata" });
  const title = tFeedback("metaTitle");
  const description = tFeedback("metaDescription");
  const url = buildLocaleUrl(locale, "/feedback");

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
  };
}

export default async function FeedbackPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const tFeedback = await getTranslations({
    locale,
    namespace: "feedbackPage",
  });
  const tCommon = await getTranslations({ locale, namespace: "common" });
  const dict = (await getMessages({ locale })) as Dictionary;

  const emailSubject = encodeURIComponent(`[Feedback] VoidFetch`);
  const emailBody = encodeURIComponent(tFeedback("emailTemplateBody") || "");
  const feedbackMailto = `mailto:${FEEDBACK_EMAIL}?subject=${emailSubject}&body=${emailBody}`;

  return (
    <BackgroundGrid>
      <main className="min-h-screen text-foreground flex flex-col">
        <div className="flex-1 w-full mx-auto max-w-5xl px-4 py-8 sm:px-6 md:px-8 space-y-8">
          {/* Header Title Section */}
          <div className="flex flex-col gap-2 p-6 rounded-2xl border border-border/80 bg-card/60 backdrop-blur-xl shadow-xl">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20 text-primary">
                <MessageSquare className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                  {tFeedback("title")}
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                  {tFeedback("metaDescription")}
                </p>
              </div>
            </div>
          </div>

          {/* Section 1: Private Email Feedback */}
          <FeedbackEmailCard
            email={FEEDBACK_EMAIL}
            title={tFeedback("privateFeedbackTitle")}
            description={tFeedback("privateFeedbackDescription")}
            emailAction={tFeedback("emailAction")}
            mailtoUrl={feedbackMailto}
          />

          {/* Section 2: Public Community Discussions (Giscus) */}
          <section className="relative overflow-hidden rounded-2xl border border-border/80 bg-card/80 backdrop-blur-xl p-6 sm:p-8 shadow-2xl space-y-6">
            {/* Top Glow Ambient Line */}
            <div className="absolute -top-px inset-x-8 h-px bg-linear-to-r from-transparent via-emerald-500/40 to-transparent" />

            <div className="flex items-center justify-between pb-4 border-b border-border/60">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500">
                  <MessageCircle className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-foreground">
                    {tFeedback("communityDiscussionsTitle")}
                  </h2>
                  <p className="text-[11px] text-muted-foreground">
                    {tFeedback("communityDiscussionsSubtitle")}
                  </p>
                </div>
              </div>

              <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-muted/40 border border-border/60 text-[11px] font-mono font-medium text-muted-foreground">
                <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                </svg>
                {tFeedback("poweredByGiscus")}
              </span>
            </div>

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
    </BackgroundGrid>
  );
}
