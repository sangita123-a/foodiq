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
  SITE_DESCRIPTION,
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
  }),
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: homeSeo.title,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  icons: {
    icon: [
      { url: "/icons/favicon-16.png", sizes: "16x16", type: "image/png" },
      { url: "/icons/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
    shortcut: ["/icons/favicon-32.png"],
  },
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: SITE_NAME,
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
        <link rel="preload" as="image" href="/icons/og-default.png" type="image/png" />
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
