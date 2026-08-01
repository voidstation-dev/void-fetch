/**
 * VoidFetch
 * Copyright (c) 2026 VoidStation.
 * All rights reserved.
 */

import React from "react";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { i18n } from "@/lib/i18n/config";
import { Shield, Copyright, FileText, Globe } from "lucide-react";

export async function generateStaticParams() {
  return i18n.locales.map((locale) => ({ locale }));
}

export const dynamic = "force-static";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "aboutPage" });

  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  };
}

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const tAbout = await getTranslations("aboutPage");

  return (
    <>
      <div className="flex items-center justify-between p-4 border rounded-xl bg-card border-border/80">
        <div className="flex flex-col gap-0.5">
          <h1 className="text-sm font-bold text-foreground">
            {tAbout("title")}
          </h1>
          <span className="text-[10px] text-muted-foreground uppercase">
            {tAbout("subtitle")}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Product specs */}
        <div className="md:col-span-2 border rounded-xl bg-card border-border/80 p-5 flex flex-col gap-4 text-xs leading-relaxed text-foreground">
          <div className="flex items-center gap-2 pb-2 border-b border-border/40">
            <Globe className="h-4 w-4 text-primary" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              {tAbout("productInfo")}
            </h2>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <span className="text-muted-foreground">
              {tAbout("productName")}
            </span>
            <span className="col-span-2 font-semibold">VoidFetch</span>

            <span className="text-muted-foreground">{tAbout("publisher")}</span>
            <span className="col-span-2 font-semibold">VoidStation</span>

            <span className="text-muted-foreground">
              {tAbout("appVersion")}
            </span>
            <span className="col-span-2 font-mono">v1.0.0-release</span>

            <span className="text-muted-foreground">
              {tAbout("targetRuntime")}
            </span>
            <span className="col-span-2 font-mono">
              Next.js App Router (SPA compatible)
            </span>

            <span className="text-muted-foreground">
              {tAbout("compilationBuild")}
            </span>
            <span className="col-span-2 font-mono">main-b3917a2</span>
          </div>

          <div className="flex flex-col gap-2 mt-2">
            <span className="font-semibold text-foreground/90">
              {tAbout("thirdPartyLibraries")}
            </span>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              {tAbout("thirdPartyDesc")}
            </p>
          </div>
        </div>

        {/* Copyright notice sidebar */}
        <div className="border rounded-xl bg-card border-border/80 p-5 flex flex-col gap-4 text-xs leading-relaxed text-foreground">
          <div className="flex items-center gap-2 pb-2 border-b border-border/40">
            <Copyright className="h-4 w-4 text-primary" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              {tAbout("copyrightNotice")}
            </h2>
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-0.5">
              <span className="font-bold text-foreground">
                {tAbout("copyrightTitle")}
              </span>
              <span className="text-muted-foreground">
                {tAbout("copyrightSub")}
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground">
              {tAbout("copyrightDesc")}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Privacy Notice */}
        <div className="border rounded-xl bg-card border-border/80 p-5 flex flex-col gap-4 text-xs leading-relaxed text-foreground">
          <div className="flex items-center gap-2 pb-2 border-b border-border/40">
            <Shield className="h-4 w-4 text-emerald-500" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              {tAbout("privacyPolicy")}
            </h2>
          </div>
          <p className="text-muted-foreground leading-relaxed">
            {tAbout("privacyDesc")}
          </p>
        </div>

        {/* Responsible use */}
        <div className="border rounded-xl bg-card border-border/80 p-5 flex flex-col gap-4 text-xs leading-relaxed text-foreground">
          <div className="flex items-center gap-2 pb-2 border-b border-border/40">
            <FileText className="h-4 w-4 text-amber-500" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              {tAbout("responsibleUse")}
            </h2>
          </div>
          <p className="text-muted-foreground leading-relaxed">
            {tAbout("responsibleUseDesc")}
          </p>
        </div>
      </div>
    </>
  );
}
