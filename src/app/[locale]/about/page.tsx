/**
 * VoidFetch
 * Copyright (c) 2026 VoidStation.
 * All rights reserved.
 */

import React from "react";
import { i18n } from "@/lib/i18n/config";
import { WorkspaceLayout } from "@/features/batch-download/components/WorkspaceLayout";
import { Shield, Copyright, FileText, Globe } from "lucide-react";

export async function generateStaticParams() {
  return i18n.locales.map((locale) => ({ locale }));
}

export const dynamic = "force-static";

export default function AboutPage() {
  return (
    <>
      <div className="flex items-center justify-between p-4 border rounded-xl bg-card border-border/80">
        <div className="flex flex-col gap-0.5">
          <h1 className="text-sm font-bold text-foreground">About VoidFetch</h1>
          <span className="text-[10px] text-muted-foreground uppercase">
            VoidStation product information
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Product specs */}
        <div className="md:col-span-2 border rounded-xl bg-card border-border/80 p-5 flex flex-col gap-4 text-xs leading-relaxed text-foreground">
          <div className="flex items-center gap-2 pb-2 border-b border-border/40">
            <Globe className="h-4 w-4 text-primary" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Product Information
            </h2>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <span className="text-muted-foreground">Product Name</span>
            <span className="col-span-2 font-semibold">VoidFetch</span>

            <span className="text-muted-foreground">Publisher</span>
            <span className="col-span-2 font-semibold">VoidStation</span>

            <span className="text-muted-foreground">Application Version</span>
            <span className="col-span-2 font-mono">v1.0.0-release</span>

            <span className="text-muted-foreground">Target Runtime</span>
            <span className="col-span-2 font-mono">
              Next.js App Router (SPA compatible)
            </span>

            <span className="text-muted-foreground">Compilation Build</span>
            <span className="col-span-2 font-mono">main-b3917a2</span>
          </div>

          <div className="flex flex-col gap-2 mt-2">
            <span className="font-semibold text-foreground/90">
              Third-Party Libraries & Acknowledgements
            </span>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              VoidFetch is built with gratitude on top of the open source
              community: Next.js, React 19, Tailwind CSS, Radix UI, Zustand
              state manager, IndexedDB, FFmpeg.wasm (GPL/LGPL v3+), JSZip, and
              browser-fs-access APIs.
            </p>
          </div>
        </div>

        {/* Copyright notice sidebar */}
        <div className="border rounded-xl bg-card border-border/80 p-5 flex flex-col gap-4 text-xs leading-relaxed text-foreground">
          <div className="flex items-center gap-2 pb-2 border-b border-border/40">
            <Copyright className="h-4 w-4 text-primary" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Copyright Notice
            </h2>
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-0.5">
              <span className="font-bold text-foreground">
                VoidFetch © 2026 VoidStation.
              </span>
              <span className="text-muted-foreground">
                All rights reserved.
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Media rights (video streams, audio files, images) remain strictly
              with their respective platform owners and creators. Attributions
              are preserved in saved metadata.
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
              Privacy Policy
            </h2>
          </div>
          <p className="text-muted-foreground leading-relaxed">
            VoidFetch prioritizes user privacy. All link parsing requests are
            directed to the unified API to retrieve metadata. Media segment
            downloads, decryption, and final buffer compilation happen entirely
            client-side inside your browser sandbox. No downloaded media content
            ever touches or is cached on VoidStation servers.
          </p>
        </div>

        {/* Responsible use */}
        <div className="border rounded-xl bg-card border-border/80 p-5 flex flex-col gap-4 text-xs leading-relaxed text-foreground">
          <div className="flex items-center gap-2 pb-2 border-b border-border/40">
            <FileText className="h-4 w-4 text-amber-500" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Responsible Use Policy
            </h2>
          </div>
          <p className="text-muted-foreground leading-relaxed">
            VoidFetch is an orchestration downloader designed to archive public
            media. Users must have the legal right or permission to download the
            content they input. VoidFetch does not circumvent digital rights
            management (DRM) or download geo-blocked private streams. Please
            respect creator copyright terms.
          </p>
        </div>
      </div>
    </>
  );
}
