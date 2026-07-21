import type { Metadata } from "next";
import { resolveSocialPreviewImageUrl } from "./social-image-url";
import {
  DEFAULT_OG_IMAGE,
  DEFAULT_TWITTER_IMAGE,
  getFacebookAppId,
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
import { normalizePath } from "./urls";

export type PageSeoInput = {
  title: string;
  description?: string;
  path?: string;
  image?: string | null;
  twitterImage?: string | null;
  keywords?: string[];
  noIndex?: boolean;
  type?: "website" | "article";
  /** When set, overrides `path` for rel=canonical (page may live at a different URL). */
  canonicalPath?: string;
  /** Override default Open Graph title (e.g. home social share). */
  socialTitle?: string;
  /** Override default Open Graph / Twitter description. */
  socialDescription?: string;
  /**
   * - `api`: dynamic /api/social-image URL (static landing pages)
   * - `file`: rely on route opengraph-image.tsx (entity routes)
   * - `static`: use provided image path or default PNG fallback
   */
  socialImageMode?: "api" | "file" | "static";
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

function buildSocialOtherTags(imageAlt: string, ogImage: string): Record<string, string> {
  const tags: Record<string, string> = {
    "og:image:alt": imageAlt,
    "og:image:width": "1200",
    "og:image:height": "630",
    "og:image:type": "image/png",
    "og:image:secure_url": ogImage,
    "twitter:image:alt": imageAlt,
    "twitter:card": "summary_large_image",
    "content-language": SITE_LOCALE,
  };

  const facebookAppId = getFacebookAppId();
  if (facebookAppId) {
    tags["fb:app_id"] = facebookAppId;
  }

  return tags;
}

function resolveSocialImages({
  socialImageMode,
  ogTitle,
  ogDescription,
  image,
  twitterImage,
  imageAlt,
}: {
  socialImageMode: "api" | "file" | "static";
  ogTitle: string;
  ogDescription: string;
  image?: string | null;
  twitterImage?: string | null;
  imageAlt: string;
}): { ogImage: string; twitterImageUrl: string; includeImages: boolean } {
  if (socialImageMode === "file") {
    return { ogImage: "", twitterImageUrl: "", includeImages: false };
  }

  if (socialImageMode === "static") {
    const ogImage = resolveImage(image);
    const twitterImageUrl = resolveTwitterImage(twitterImage, image);
    return { ogImage, twitterImageUrl, includeImages: true };
  }

  const ogImage = resolveSocialPreviewImageUrl(ogTitle, ogDescription, image);
  const twitterImageUrl = twitterImage
    ? resolveSocialPreviewImageUrl(ogTitle, ogDescription, twitterImage)
    : ogImage;

  return { ogImage, twitterImageUrl, includeImages: true };
}

/**
 * Open Graph tags power Facebook, LinkedIn, WhatsApp, and Telegram previews.
 * Twitter Card tags power X (Twitter) previews.
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
  socialImageMode = "api",
  canonicalPath,
}: PageSeoInput): Metadata {
  const normalizedPath = normalizePath(path);
  const normalizedCanonical = normalizePath(canonicalPath ?? path);
  const url = absoluteUrl(normalizedCanonical);
  const ogTitle = socialTitle || (title.includes(SITE_NAME) ? title : `${title} | ${SITE_NAME}`);
  const ogDescription = socialDescription || description;
  const imageAlt = `${ogTitle} — ${SITE_OG_IMAGE_ALT}`;
  const { ogImage, twitterImageUrl, includeImages } = resolveSocialImages({
    socialImageMode,
    ogTitle,
    ogDescription,
    image,
    twitterImage,
    imageAlt,
  });

  const metadata: Metadata = {
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
      languages: buildLanguageAlternates(normalizedCanonical),
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
    },
    twitter: {
      card: "summary_large_image",
      title: ogTitle,
      description: ogDescription,
      creator: SITE_TWITTER_HANDLE,
      site: SITE_TWITTER_HANDLE,
    },
    other: includeImages
      ? buildSocialOtherTags(imageAlt, ogImage)
      : {
          "twitter:card": "summary_large_image",
          "content-language": SITE_LOCALE,
        },
    metadataBase: new URL(getSiteUrl()),
    referrer: "origin-when-cross-origin",
  };

  if (includeImages) {
    metadata.openGraph = {
      ...metadata.openGraph,
      images: buildOpenGraphImages(ogImage, imageAlt),
    };
    metadata.twitter = {
      ...metadata.twitter,
      images: [
        {
          url: twitterImageUrl,
          width: 1200,
          height: 630,
          alt: imageAlt,
        },
      ],
    };
  }

  return metadata;
}

/** Default site-wide social metadata for the home page and fallbacks. */
export function buildDefaultSocialMetadata(): Metadata {
  return buildPageMetadata({
    title: SITE_OG_TITLE,
    description: SITE_OG_DESCRIPTION,
    path: "/",
    socialTitle: SITE_OG_TITLE,
    socialDescription: SITE_OG_DESCRIPTION,
    socialImageMode: "file",
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
    },
    twitter: {
      card: "summary_large_image",
      title: SITE_OG_TITLE,
      description: SITE_OG_DESCRIPTION,
      site: SITE_TWITTER_HANDLE,
      creator: SITE_TWITTER_HANDLE,
    },
    other: {
      "og:image:alt": imageAlt,
      "twitter:image:alt": imageAlt,
      "twitter:card": "summary_large_image",
      "content-language": SITE_LOCALE,
      ...(getFacebookAppId() ? { "fb:app_id": getFacebookAppId()! } : {}),
    },
    icons: buildRootIcons(),
    manifest: "/manifest.webmanifest",
    referrer: "origin-when-cross-origin",
  };
}
