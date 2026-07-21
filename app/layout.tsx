import type { Metadata, Viewport } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import GoogleAnalytics from "@/components/analytics/GoogleAnalytics";
import DeferredRoutePrefetch from "@/components/performance/DeferredRoutePrefetch";
import InternalSeoLinks from "@/components/seo/InternalSeoLinks";
import JsonLd from "@/components/seo/JsonLd";
import {
  faqJsonLd,
  foodDeliveryServiceJsonLd,
  localBusinessJsonLd,
  organizationJsonLd,
  siteNavigationJsonLd,
  websiteJsonLd,
} from "@/lib/seo/jsonld";
import { HOME_FAQS } from "@/lib/seo/faq";
import { SEO_HUB_LINKS } from "@/lib/seo/internal-links";
import { buildRootLayoutMetadata } from "@/lib/seo/metadata";
import { getApiBaseUrl, SITE_NAME } from "@/lib/seo/site";
import { HERO_POSTER_WEBP } from "@/lib/performance/assets";
import { fetchSiteSettingsServer } from "@/lib/siteSettings.server";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  preload: true,
  adjustFontFallback: true,
});

const apiBase = getApiBaseUrl();

function buildSiteVerification(): Metadata["verification"] | undefined {
  const google = process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION;
  const bing = process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION;
  const yandex = process.env.NEXT_PUBLIC_YANDEX_SITE_VERIFICATION;
  if (!google && !bing && !yandex) return undefined;
  return {
    ...(google ? { google } : {}),
    ...(bing ? { other: { "msvalidate.01": bing } } : {}),
    ...(yandex ? { yandex } : {}),
  };
}

export const metadata: Metadata = {
  ...buildRootLayoutMetadata(),
  verification: buildSiteVerification(),
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: SITE_NAME,
    startupImage: [
      {
        url: "/splash/iphone-se.png",
        media:
          "(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2)",
      },
      {
        url: "/splash/iphone-14.png",
        media:
          "(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3)",
      },
      {
        url: "/splash/iphone-14-pro-max.png",
        media:
          "(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3)",
      },
      {
        url: "/splash/ipad.png",
        media:
          "(device-width: 768px) and (device-height: 1024px) and (-webkit-device-pixel-ratio: 2)",
      },
    ],
  },
  formatDetection: {
    telephone: false,
    email: false,
    address: false,
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FFFFFF" },
    { media: "(prefers-color-scheme: dark)", color: "#FFFFFF" },
  ],
  colorScheme: "light",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const initialSiteSettings = await fetchSiteSettingsServer();

  return (
    <html
      lang="en"
      className={`${poppins.variable} h-full antialiased`}
    >
      <head>
        <link
          rel="preload"
          as="image"
          href={HERO_POSTER_WEBP}
          type="image/webp"
          fetchPriority="high"
        />
        {apiBase ? (
          <>
            <link rel="preconnect" href={apiBase} crossOrigin="anonymous" />
            <link rel="dns-prefetch" href={apiBase} />
          </>
        ) : null}
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        <DeferredRoutePrefetch />
        <GoogleAnalytics />
        <JsonLd
          data={[
            organizationJsonLd(),
            websiteJsonLd(),
            localBusinessJsonLd(),
            foodDeliveryServiceJsonLd(),
            siteNavigationJsonLd(),
            faqJsonLd(HOME_FAQS),
          ]}
        />
        <InternalSeoLinks
          links={SEO_HUB_LINKS}
          label="Foodiq primary navigation"
        />
        <script
          id="foodiq-site-settings"
          type="application/json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(initialSiteSettings).replace(/</g, "\\u003c"),
          }}
        />
        <Providers initialSiteSettings={initialSiteSettings}>{children}</Providers>
      </body>
    </html>
  );
}
