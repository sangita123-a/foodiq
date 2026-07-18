"use client";

import { Suspense } from "react";
import AnalyticsScripts from "./AnalyticsScripts";
import PageViewTracker from "./PageViewTracker";
import WebVitalsReporter from "./WebVitalsReporter";
import GlobalErrorListeners from "./GlobalErrorListeners";

/**
 * Mounts all analytics + monitoring listeners. Zero UI impact.
 */
export default function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AnalyticsScripts />
      <Suspense fallback={null}>
        <PageViewTracker />
      </Suspense>
      <WebVitalsReporter />
      <GlobalErrorListeners />
      {children}
    </>
  );
}
