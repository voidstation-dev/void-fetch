"use client";

import dynamic from "next/dynamic";
import { ServiceWorkerRegistration } from "@/components/service-worker-registration";

const DeferredAdSenseScript = dynamic(
  () =>
    import("@/components/deferred-adsense-script").then(
      (mod) => mod.DeferredAdSenseScript,
    ),
  { ssr: false },
);

const DeferredGoogleAnalyticsScript = dynamic(
  () =>
    import("@/components/deferred-google-analytics-script").then(
      (mod) => mod.DeferredGoogleAnalyticsScript,
    ),
  { ssr: false },
);

const WebVitalsTracker = dynamic(
  () =>
    import("@/components/web-vitals-tracker").then(
      (mod) => mod.WebVitalsTracker,
    ),
  { ssr: false },
);

export function RuntimeServices() {
  return (
    <>
      <ServiceWorkerRegistration />
      <DeferredAdSenseScript />
      <DeferredGoogleAnalyticsScript />
      <WebVitalsTracker />
    </>
  );
}
