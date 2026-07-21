import type { Metadata } from "next";
import {
  DEFAULT_OG_IMAGE,
  DEFAULT_TWITTER_IMAGE,
  SITE_DESCRIPTION,
  SITE_KEYWORDS,
  SITE_LOCALE,
  SITE_NAME,
  SITE_OG_DESCRIPTION,
  SITE_OG_IMAGE_ALT,
  SITE_OG_LOCALE,
  SITE_OG_TITLE,
  SITE_TWITTER_HANDLE,
  absoluteUrl,
  getSiteUrl,
} from "./site";

export type PageSeoInput = {
  title: string;
  description?: string;
  path?: string;
  image?: string | null;
  twitterImage?: string | null;
  keywords?: string[];
  noIndex?: boolean;
  type?: "website" | "article";
  /** Override default Open Graph title (e.g. home social share). */
  socialTitle?: string;
  /** Override default Open Graph / Twitter description. */
  socialDescription?: string;
};

function resolveImage(image?: string | null): string {
  if (!image) return absoluteUrl(DEFAULT_OG_IMAGE);
  if (image.startsWith("http://") || image.startsWith("https://")) return image;
  return absoluteUrl(image);
}

function resolveTwitterImage(image?: string | null, fallback?: string | null): string {
  if (image) return resolveImage(image);
  if (fallback) return resolveImage(fallback);
  return absoluteUrl(DEFAULT_TWITTER_IMAGE);
}

export function buildOpenGraphImages(ogImage: string, alt: string) {
  return [
    {
      url: ogImage,
      secureUrl: ogImage,
      width: 1200,
      height: 630,
      alt,
      type: "image/png",
    },
  ];
}

function buildLanguageAlternates(path: string) {
  const pageUrl = absoluteUrl(path);
  return {
    [SITE_LOCALE]: pageUrl,
    en: pageUrl,
    "x-default": pageUrl,
  };
}

/**
 * Open Graph tags power WhatsApp, LinkedIn, Telegram, and Facebook previews.
 */
export function buildPageMetadata({
  title,
  description = SITE_DESCRIPTION,
  path = "/",
  image,
  twitterImage,
  keywords = SITE_KEYWORDS,
  noIndex = false,
  type = "website",
  socialTitle,
  socialDescription,
}: PageSeoInput): Metadata {
  const url = absoluteUrl(path);
  const ogTitle = socialTitle || (title.includes(SITE_NAME) ? title : `${title} | ${SITE_NAME}`);
  const ogDescription = socialDescription || description;
  const ogImage = resolveImage(image);
  const twitterImageUrl = resolveTwitterImage(twitterImage, image);
  const imageAlt = `${ogTitle} — ${SITE_OG_IMAGE_ALT}`;

  return {
    title: title.includes(SITE_NAME) ? { absolute: title } : title,
    description,
    keywords,
    authors: [{ name: SITE_NAME, url: absoluteUrl("/") }],
    creator: SITE_NAME,
    publisher: SITE_NAME,
    applicationName: SITE_NAME,
    category: "food",
    alternates: {
      canonical: url,
      languages: buildLanguageAlternates(path),
    },
    robots: noIndex
      ? {
          index: false,
          follow: false,
          googleBot: { index: false, follow: false },
        }
      : {
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
      type,
      locale: SITE_OG_LOCALE,
      alternateLocale: ["en"],
      url,
      title: ogTitle,
      description: ogDescription,
      siteName: SITE_NAME,
      images: buildOpenGraphImages(ogImage, imageAlt),
    },
    twitter: {
      card: "summary_large_image",
      title: ogTitle,
      description: ogDescription,
      images: [
        {
          url: twitterImageUrl,
          width: 1200,
          height: 630,
          alt: imageAlt,
        },
      ],
      creator: SITE_TWITTER_HANDLE,
      site: SITE_TWITTER_HANDLE,
    },
    other: {
      "og:image:alt": imageAlt,
      "twitter:image:alt": imageAlt,
      "content-language": SITE_LOCALE,
    },
    metadataBase: new URL(getSiteUrl()),
    referrer: "origin-when-cross-origin",
  };
}

/** Default site-wide social metadata for the home page and fallbacks. */
export function buildDefaultSocialMetadata(): Metadata {
  return buildPageMetadata({
    title: SITE_OG_TITLE,
    description: SITE_OG_DESCRIPTION,
    path: "/",
    socialTitle: SITE_OG_TITLE,
    socialDescription: SITE_OG_DESCRIPTION,
    image: DEFAULT_OG_IMAGE,
    twitterImage: DEFAULT_TWITTER_IMAGE,
  });
}

export const noIndexMetadata = buildPageMetadata({
  title: "Private",
  description: "This page is not indexed.",
  path: "/private",
  noIndex: true,
});

const ROOT_ICON_SIZES = [16, 32, 72, 96, 128, 192, 512] as const;

export function buildRootIcons(): NonNullable<Metadata["icons"]> {
  const pngIcons = ROOT_ICON_SIZES.map((size) => ({
    url: `/icons/${size <= 32 ? `favicon-${size}` : `icon-${size}`}.png`,
    sizes: `${size}x${size}`,
    type: "image/png" as const,
  }));

  return {
    icon: pngIcons,
    apple: [
      {
        url: "/icons/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
    shortcut: ["/icons/favicon-32.png"],
    other: [
      {
        rel: "mask-icon",
        url: "/icons/icon-maskable-512.png",
        color: "#E23744",
      },
    ],
  };
}

/**
 * Site-wide root layout metadata: defaults, social previews, icons, and manifest.
 * Child routes override title, description, canonical, and social tags as needed.
 */
export function buildRootLayoutMetadata(): Metadata {
  const siteUrl = getSiteUrl();
  const canonicalUrl = absoluteUrl("/");
  const ogImage = absoluteUrl(DEFAULT_OG_IMAGE);
  const twitterImage = absoluteUrl(DEFAULT_TWITTER_IMAGE);
  const imageAlt = `${SITE_OG_TITLE} — ${SITE_OG_IMAGE_ALT}`;

  return {
    metadataBase: new URL(siteUrl),
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
      site: "@foodiq",
      creator: "@foodiq",
      images: [
        {
          url: twitterImage,
          width: 1200,
          height: 630,
          alt: imageAlt,
        },
      ],
    },
    other: {
      "og:image:alt": imageAlt,
      "twitter:image:alt": imageAlt,
      "content-language": SITE_LOCALE,
    },
    icons: buildRootIcons(),
    manifest: "/manifest.webmanifest",
    referrer: "origin-when-cross-origin",
  };
}
