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
  SITE_OG_TITLE,
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

function buildOpenGraphImages(ogImage: string, alt: string) {
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
      locale: "en_IN",
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
      creator: "@foodiq",
      site: "@foodiq",
    },
    other: {
      "og:image:alt": imageAlt,
      "twitter:image:alt": imageAlt,
      "content-language": SITE_LOCALE,
    },
    metadataBase: new URL(getSiteUrl()),
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
