import type { MetadataRoute } from "next";
import { getTranslations } from "next-intl/server";

import { i18n } from "@/lib/i18n/config";
import { localeToHtmlLang } from "@/lib/seo";

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const tMeta = await getTranslations({
    locale: i18n.defaultLocale,
    namespace: "metadata",
  });
  const tUnified = await getTranslations({
    locale: i18n.defaultLocale,
    namespace: "unified",
  });

  return {
    id: "/",
    name: tMeta("siteName"),
    short_name: "UM Downloader",
    description: tUnified("pageDescription"),
    lang: localeToHtmlLang(i18n.defaultLocale),
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#000000",
    theme_color: "#000000",
    icons: [
      {
        src: "/icons/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icons/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/icons/maskable-icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
