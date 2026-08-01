import type { Metadata, Viewport } from "next";
import "../globals.css";
import { DeferredRuntimeServices } from "@/components/deferred-runtime-services";
import { ThemeProvider } from "@/components/theme-provider";
import { DeferredToaster } from "@/components/deferred-toaster";
import { NextIntlClientProvider } from "next-intl";
import {
  getMessages,
  getTranslations,
  setRequestLocale,
} from "next-intl/server";
import { AppTopBar } from "@/components/layout/app-top-bar";
import { TopBarActionsProvider } from "@/components/layout/top-bar-actions";
import { WorkspaceLayout } from "@/features/batch-download/components/WorkspaceLayout";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/types";
import { i18n } from "@/lib/i18n/config";
import {
  buildOpenGraphLocaleAlternates,
  IS_INDEXABLE,
  SITE_URL,
  buildLanguageAlternates,
  buildLocaleUrl,
  localeToHtmlLang,
  localeToOpenGraphLocale,
  resolvePublicMetadataDescription,
} from "@/lib/seo";

// Generate static params
export async function generateStaticParams() {
  return i18n.locales.map((locale) => ({ locale }));
}

// Dynamically generate metadata
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "metadata" });
  const localeUrl = buildLocaleUrl(locale);
  const publicDescription = resolvePublicMetadataDescription(locale);

  return {
    title: t("title"),
    description: publicDescription,
    authors: [{ name: t("siteName") }],
    creator: t("siteName"),
    publisher: t("siteName"),
    applicationName: t("siteName"),
    generator: "Next.js",
    referrer: "origin-when-cross-origin",
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
    other: {
      "google-adsense-account": "ca-pub-1581472267398547",
      "mobile-web-app-capable": "yes",
      "msapplication-TileColor": "#000000",
    },
    metadataBase: new URL(SITE_URL),
    category: "utilities",
    icons: {
      icon: [
        { url: "/favicon.ico" },
        { url: "/favicon.svg", type: "image/svg+xml" },
      ],
      apple: [{ url: "/icons/apple-touch-icon.png" }],
    },
    openGraph: {
      title: t("ogTitle"),
      description: t("ogDescription"),
      url: localeUrl,
      siteName: t("siteName"),
      locale: localeToOpenGraphLocale(locale),
      alternateLocale: buildOpenGraphLocaleAlternates(locale),
      type: "website",
      images: [
        {
          url: "/og/home.png",
          width: 1200,
          height: 630,
          alt: t("siteName"),
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: t("ogTitle"),
      description: t("ogDescription"),
      images: ["/og/home.png"],
    },
    robots: {
      index: IS_INDEXABLE,
      follow: IS_INDEXABLE,
      googleBot: {
        index: IS_INDEXABLE,
        follow: IS_INDEXABLE,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    alternates: {
      canonical: localeUrl,
      languages: buildLanguageAlternates(),
    },
    manifest: "/manifest.webmanifest",
    appleWebApp: {
      capable: true,
      statusBarStyle: "black-translucent",
      title: t("siteName"),
    },
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#000000",
  colorScheme: "dark light",
};

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const dict = (await getMessages({ locale })) as Dictionary;
  const htmlLang = localeToHtmlLang(locale);

  return (
    <html lang={htmlLang} className="dark" suppressHydrationWarning>
      <body className="antialiased bg-background text-foreground selection:bg-primary/20 selection:text-primary min-h-screen">
        <NextIntlClientProvider locale={locale} messages={dict}>
          <DeferredRuntimeServices />
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem={true}
            disableTransitionOnChange
          >
            <TopBarActionsProvider>
              <AppTopBar />
              <WorkspaceLayout>{children}</WorkspaceLayout>
            </TopBarActionsProvider>
            <DeferredToaster />
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
