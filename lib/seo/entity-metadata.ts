import type { Metadata } from "next";
import { buildPageMetadata, type PageSeoInput } from "./metadata";
import { SITE_DESCRIPTION } from "./site";

type EntityMetadataInput = PageSeoInput & {
  entityName: string;
  keywords: string[];
  socialTitle?: string;
  socialDescription?: string;
  /** Entity routes use file-based opengraph-image.tsx for dynamic previews. */
  socialImageMode?: "api" | "file" | "static";
  canonicalPath?: string;
  noIndex?: boolean;
};

/** Build indexable metadata for catalog entities with unique keywords and social copy. */
export function buildEntityMetadata({
  entityName: _entityName,
  keywords,
  title,
  description,
  path,
  image,
  type = "website",
  socialTitle: socialTitleOverride,
  socialDescription: socialDescriptionOverride,
  socialImageMode = "file",
  canonicalPath,
  noIndex = false,
}: EntityMetadataInput): Metadata {
  const resolvedDescription = description ?? SITE_DESCRIPTION;
  const socialTitle =
    socialTitleOverride ??
    (title.includes("Foodiq") ? title : `${title} | Foodiq`);
  const socialDescription =
    socialDescriptionOverride ??
    (resolvedDescription.length > 155
      ? `${resolvedDescription.slice(0, 152)}...`
      : resolvedDescription);

  return buildPageMetadata({
    title,
    description: resolvedDescription,
    path,
    canonicalPath,
    image,
    keywords,
    type,
    noIndex,
    socialTitle,
    socialDescription,
    socialImageMode,
  });
}

type PrivateMetadataInput = {
  title: string;
  path: string;
  description?: string;
  socialTitle?: string;
  socialDescription?: string;
};

/** Canonical private-route metadata — correct path, never indexed. */
export function buildPrivatePageMetadata({
  title,
  path,
  description = "Private Foodiq page. Not indexed by search engines.",
  socialTitle,
  socialDescription,
}: PrivateMetadataInput): Metadata {
  const resolvedSocialTitle =
    socialTitle ?? (title.includes("Foodiq") ? title : `${title} | Foodiq`);
  const resolvedSocialDescription =
    socialDescription ??
    (description.length > 155 ? `${description.slice(0, 152)}...` : description);

  return buildPageMetadata({
    title,
    description,
    path,
    noIndex: true,
    socialTitle: resolvedSocialTitle,
    socialDescription: resolvedSocialDescription,
  });
}
