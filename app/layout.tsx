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
import { buildOpenGraphImages, buildRootIcons } from "@/lib/seo/metadata";
import {
  absoluteUrl,
  DEFAULT_OG_IMAGE,
  DEFAULT_TWITTER_IMAGE,
  getSiteUrl,
  PREFETCH_ROUTES,
  SITE_KEYWORDS,
  SITE_LOCALE,
  SITE_NAME,
  SITE_OG_DESCRIPTION,
  SITE_OG_IMAGE_ALT,
  SITE_OG_LOCALE,
  SITE_OG_TITLE,
  SITE_TWITTER_HANDLE,
  getApiBaseUrl,
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
const siteUrl = getSiteUrl();
const metadataBase = new URL(siteUrl);
const canonicalUrl = absoluteUrl("/");
const ogImage = absoluteUrl(DEFAULT_OG_IMAGE);
const twitterImage = absoluteUrl(DEFAULT_TWITTER_IMAGE);
const imageAlt = `${SITE_OG_TITLE} — ${SITE_OG_IMAGE_ALT}`;

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
  metadataBase,
  title: {
    default: SITE_OG_TITLE,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_OG_DESCRIPTION,
  keywords: [...SITE_KEYWORDS],
  authors: [{ name: SITE_NAME, url: canonicalUrl }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  applicationName: SITE_NAME,
  category: "food",
  alternates: {
    canonical: canonicalUrl,
    languages: {
      [SITE_LOCALE]: canonicalUrl,
      en: canonicalUrl,
      "x-default": canonicalUrl,
    },
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: SITE_OG_LOCALE,
    alternateLocale: ["en"],
    url: canonicalUrl,
    title: SITE_OG_TITLE,
    description: SITE_OG_DESCRIPTION,
    siteName: SITE_NAME,
    images: buildOpenGraphImages(ogImage, imageAlt),
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_OG_TITLE,
    description: SITE_OG_DESCRIPTION,
    site: SITE_TWITTER_HANDLE,
    creator: SITE_TWITTER_HANDLE,
    images: [
      {
        url: twitterImage,
        width: 1200,
        height: 630,
        alt: imageAlt,
      },
    ],
  },
  icons: buildRootIcons(),
  manifest: "/manifest.webmanifest",
  referrer: "origin-when-cross-origin",
  other: {
    "og:image:alt": imageAlt,
    "twitter:image:alt": imageAlt,
    "content-language": SITE_LOCALE,
  },
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
