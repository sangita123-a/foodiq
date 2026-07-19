import type { Metadata } from "next";
import {
  DEFAULT_OG_IMAGE,
  SITE_DESCRIPTION,
  SITE_KEYWORDS,
  SITE_NAME,
  absoluteUrl,
  getSiteUrl,
} from "./site";

export type PageSeoInput = {
  title: string;
  description?: string;
  path?: string;
  image?: string | null;
  keywords?: string[];
  noIndex?: boolean;
  type?: "website" | "article";
};

function resolveImage(image?: string | null): string {
  if (!image) return absoluteUrl(DEFAULT_OG_IMAGE);
  if (image.startsWith("http://") || image.startsWith("https://")) return image;
  return absoluteUrl(image);
}

/**
 * Build consistent Metadata for App Router pages/layouts.
 */
export function buildPageMetadata({
  title,
  description = SITE_DESCRIPTION,
  path = "/",
  image,
  keywords = SITE_KEYWORDS,
  noIndex = false,
  type = "website",
}: PageSeoInput): Metadata {
  const url = absoluteUrl(path);
  const ogTitle = title.includes(SITE_NAME) ? title : `${title} | ${SITE_NAME}`;
  const ogImage = resolveImage(image);

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
      url,
      title: ogTitle,
      description,
      siteName: SITE_NAME,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: ogTitle,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: ogTitle,
      description,
      images: [ogImage],
      creator: "@foodiq",
      site: "@foodiq",
    },
    metadataBase: new URL(getSiteUrl()),
  };
}

export const noIndexMetadata = buildPageMetadata({
  title: "Private",
  description: "This page is not indexed.",
  path: "/",
  noIndex: true,
});
