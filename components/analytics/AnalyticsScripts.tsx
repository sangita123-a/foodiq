"use client";

import { useEffect, useState } from "react";
import Script from "next/script";
import { getClarityId, getGaId, getGtmId, isAnalyticsEnabled } from "@/lib/analytics/config";

/**
 * Loads GTM, GA4, and Microsoft Clarity only in production when IDs are set.
 * Client-gated so localhost never loads third-party tags.
 */
export default function AnalyticsScripts() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(isAnalyticsEnabled());
  }, []);

  if (!ready) return null;

  const gtmId = getGtmId();
  const gaId = getGaId();
  const clarityId = getClarityId();

  if (!gtmId && !gaId && !clarityId) return null;

  return (
    <>
      {gtmId ? (
        <>
          <Script id="gtm-init" strategy="lazyOnload">{`
            (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
            new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
            j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
            'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer','${gtmId}');
          `}</Script>
          <noscript>
            <iframe
              src={`https://www.googletagmanager.com/ns.html?id=${gtmId}`}
              height="0"
              width="0"
              style={{ display: "none", visibility: "hidden" }}
              title="Google Tag Manager"
            />
          </noscript>
        </>
      ) : null}

      {gaId ? (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
            strategy="lazyOnload"
          />
          <Script id="ga4-init" strategy="lazyOnload">{`
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
          `}</Script>
        </>
      ) : null}

      {clarityId ? (
        <Script id="ms-clarity" strategy="lazyOnload">{`
          (function(c,l,a,r,i,t,y){
            c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
            t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
            y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
          })(window, document, "clarity", "script", "${clarityId}");
        `}</Script>
      ) : null}
    </>
  );
}
