"use client";

import { Suspense, useEffect, useState } from "react";
import Script from "next/script";
import PageViewTracker from "@/components/analytics/PageViewTracker";
import { getGaId, isAnalyticsEnabled } from "@/lib/analytics/config";

/**
 * Loads GA4 via next/script in production only. Tracks page_view on route changes.
 */
export default function GoogleAnalytics() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    setEnabled(isAnalyticsEnabled());
  }, []);

  const gaId = getGaId();

  return (
    <>
      {enabled && gaId ? (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
            strategy="lazyOnload"
          />
          <Script id="google-analytics" strategy="lazyOnload">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              window.gtag = gtag;
              gtag('js', new Date());
              gtag('config', '${gaId}', {
                anonymize_ip: true,
                allow_google_signals: false,
                allow_ad_personalization_signals: false,
                send_page_view: false
              });
            `}
          </Script>
        </>
      ) : null}
      <Suspense fallback={null}>
        <PageViewTracker />
      </Suspense>
    </>
  );
}
