import { CATEGORY_SLUGS } from "@/lib/data/categoryData";
import { CUISINE_SLUGS } from "@/lib/cuisines";
import {
  buildLegacyRedirects,
  CANONICAL_PATHS,
  isRedirectOnlyRoute,
  normalizePath,
  REDIRECT_ONLY_ROUTES,
} from "@/lib/seo/legacy-redirects";

export {
  buildLegacyRedirects,
  CANONICAL_PATHS,
  isRedirectOnlyRoute,
  normalizePath,
  REDIRECT_ONLY_ROUTES,
};

/** Cuisine slugs that share a dish category route — category URL is canonical. */
export const DUPLICATE_CUISINE_CATEGORY_SLUGS = CUISINE_SLUGS.filter((slug) =>
  (CATEGORY_SLUGS as readonly string[]).includes(slug)
);

export function isDuplicateCuisineSlug(slug: string): boolean {
  return (DUPLICATE_CUISINE_CATEGORY_SLUGS as readonly string[]).includes(
    normalizePath(slug).replace(/^\//, "")
  );
}

export function categoryPath(slug: string): string {
  return `/category/${normalizePath(slug).replace(/^\//, "")}`;
}

export function cuisinePath(slug: string): string {
  return `/cuisine/${normalizePath(slug).replace(/^\//, "")}`;
}

/** Preferred canonical for a cuisine slug (category wins when both exist). */
export function getCuisineCanonicalPath(slug: string): string {
  const normalized = normalizePath(slug).replace(/^\//, "");
  if (isDuplicateCuisineSlug(normalized)) {
    return categoryPath(normalized);
  }
  return cuisinePath(normalized);
}
