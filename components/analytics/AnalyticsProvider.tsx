"use client";

import AnalyticsScripts from "./AnalyticsScripts";
import WebVitalsReporter from "./WebVitalsReporter";
import GlobalErrorListeners from "./GlobalErrorListeners";

/**
 * Mounts GTM/Clarity scripts and monitoring listeners. GA4 lives in layout via GoogleAnalytics.
 */
export default function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AnalyticsScripts />
      <WebVitalsReporter />
      <GlobalErrorListeners />
      {children}
    </>
  );
}
