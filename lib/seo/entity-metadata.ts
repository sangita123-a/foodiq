import type { Metadata } from "next";
import { buildPageMetadata, type PageSeoInput } from "./metadata";
import { SITE_DESCRIPTION } from "./site";

type EntityMetadataInput = PageSeoInput & {
  entityName: string;
  keywords: string[];
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
}: EntityMetadataInput): Metadata {
  const resolvedDescription = description ?? SITE_DESCRIPTION;
  const socialTitle = title.includes("Foodiq") ? title : `${title} | Foodiq`;
  const socialDescription =
    resolvedDescription.length > 155
      ? `${resolvedDescription.slice(0, 152)}...`
      : resolvedDescription;

  return buildPageMetadata({
    title,
    description: resolvedDescription,
    path,
    image,
    keywords,
    type,
    socialTitle,
    socialDescription,
  });
}

type PrivateMetadataInput = {
  title: string;
  path: string;
  description?: string;
};

/** Canonical private-route metadata — correct path, never indexed. */
export function buildPrivatePageMetadata({
  title,
  path,
  description = "Private Foodiq page. Not indexed by search engines.",
}: PrivateMetadataInput): Metadata {
  return buildPageMetadata({
    title,
    description,
    path,
    noIndex: true,
  });
}
