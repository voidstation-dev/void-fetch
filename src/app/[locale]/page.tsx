/**
 * VoidFetch
 * Copyright (c) 2026 VoidStation.
 * All rights reserved.
 */

import { getMessages } from "next-intl/server";
import { StructuredData } from "@/components/structured-data";
import { i18n } from "@/lib/i18n/config";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/types";
import { WorkspaceLayout } from "@/features/batch-download/components/WorkspaceLayout";
import { BatchWorkspaceClient } from "@/features/batch-download/components/BatchWorkspaceClient";

export async function generateStaticParams() {
    return i18n.locales.map((locale) => ({ locale }));
}

export const dynamic = "force-static";

export default async function HomePage({
    params,
}: {
    params: Promise<{ locale: Locale }>;
}) {
    const { locale } = await params;
    const dict = (await getMessages({ locale })) as Dictionary;

    return (
        <>
            <StructuredData locale={locale} dict={dict} />
            <BatchWorkspaceClient />
        </>
    );
}
