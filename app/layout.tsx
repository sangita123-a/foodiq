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
import { buildRootLayoutMetadata } from "@/lib/seo/metadata";
import {
  DEFAULT_OG_IMAGE,
  PREFETCH_ROUTES,
  SITE_NAME,
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
