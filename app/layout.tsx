import type { Metadata, Viewport } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import GoogleAnalytics from "@/components/analytics/GoogleAnalytics";
import JsonLd from "@/components/seo/JsonLd";
import {
  faqJsonLd,
  foodDeliveryServiceJsonLd,
  localBusinessJsonLd,
  organizationJsonLd,
  websiteJsonLd,
} from "@/lib/seo/jsonld";
import { HOME_FAQS } from "@/lib/seo/faq";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { PUBLIC_PAGE_SEO } from "@/lib/seo/pages";
import {
  DEFAULT_OG_IMAGE,
  PREFETCH_ROUTES,
  SITE_NAME,
  getApiBaseUrl,
  getSiteUrl,
} from "@/lib/seo/site";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  preload: true,
  adjustFontFallback: true,
});

const apiBase = getApiBaseUrl();
const homeSeo = PUBLIC_PAGE_SEO.home;

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
  ...buildPageMetadata({
    title: homeSeo.title,
    description: homeSeo.description,
    path: homeSeo.path,
    keywords: homeSeo.keywords,
    socialTitle: homeSeo.title,
    socialDescription: homeSeo.description,
  }),
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: homeSeo.title,
    template: `%s | ${SITE_NAME}`,
  },
  description: homeSeo.description,
  icons: {
    icon: [
      { url: "/icons/favicon-16.png", sizes: "16x16", type: "image/png" },
      { url: "/icons/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/icon-72.png", sizes: "72x72", type: "image/png" },
      { url: "/icons/icon-96.png", sizes: "96x96", type: "image/png" },
      { url: "/icons/icon-128.png", sizes: "128x128", type: "image/png" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    shortcut: ["/icons/favicon-32.png"],
    other: [
      { rel: "mask-icon", url: "/icons/icon-maskable-512.png", color: "#E23744" },
    ],
  },
  manifest: "/manifest.webmanifest",
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
  other: {
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "default",
    "apple-mobile-web-app-title": SITE_NAME,
    "msapplication-TileColor": "#E23744",
    "msapplication-config": "/browserconfig.xml",
  },
  formatDetection: {
    telephone: false,
    email: false,
    address: false,
  },
  verification: buildSiteVerification(),
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#E23744" },
    { media: "(prefers-color-scheme: dark)", color: "#E23744" },
  ],
  colorScheme: "light",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${poppins.variable} h-full antialiased`}
    >
      <head>
        {apiBase ? (
          <>
            <link rel="preconnect" href={apiBase} crossOrigin="anonymous" />
            <link rel="dns-prefetch" href={apiBase} />
          </>
        ) : null}
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://fonts.gstatic.com" />
        <link rel="preload" as="image" href={DEFAULT_OG_IMAGE} type="image/png" />
        {PREFETCH_ROUTES.map((route) => (
          <link key={route} rel="prefetch" href={route} />
        ))}
        <link rel="preload" as="image" href="/default-restaurant.webp" type="image/webp" />
        <link rel="preload" as="image" href="/default-food.webp" type="image/webp" />
      </head>
      <body className="min-h-full flex flex-col bg-white text-[#1C1C1C]">
        <GoogleAnalytics />
        <JsonLd
          data={[
            organizationJsonLd(),
            websiteJsonLd(),
            localBusinessJsonLd(),
            foodDeliveryServiceJsonLd(),
            faqJsonLd(HOME_FAQS),
          ]}
        />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
