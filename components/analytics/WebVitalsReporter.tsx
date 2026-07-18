"use client";

import { useReportWebVitals } from "next/web-vitals";
import { isAnalyticsEnabled, isMonitoringEnabled } from "@/lib/analytics/config";
import { trackWebVital } from "@/lib/monitoring/client";

/**
 * Reports Core Web Vitals (CLS, LCP, INP, FCP, TTFB) to analytics + monitoring.
 */
export default function WebVitalsReporter() {
  useReportWebVitals((metric) => {
    if (!isAnalyticsEnabled() && !isMonitoringEnabled()) return;
    trackWebVital({
      name: metric.name,
      value: metric.value,
      id: metric.id,
      rating: metric.rating,
      navigationType: metric.navigationType,
    });
  });

  return null;
}
