"use client";

import { useEffect, useState } from "react";
import Script from "next/script";
import { getClarityId, getGtmId, isAnalyticsEnabled } from "@/lib/analytics/config";

/**
 * Loads GTM and Microsoft Clarity only in production when IDs are set.
 * GA4 is loaded separately via GoogleAnalytics in app/layout.tsx.
 */
export default function AnalyticsScripts() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(isAnalyticsEnabled());
  }, []);

  if (!ready) return null;

  const gtmId = getGtmId();
  const clarityId = getClarityId();

  if (!gtmId && !clarityId) return null;

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
