import type { Metadata } from "next";
import { buildPageMetadata, buildRootLayoutMetadata } from "./metadata";
import { publicMetadata } from "./pages";
import { buildEntityMetadata } from "./entity-metadata";
import { buildSocialImageUrl } from "./social-image-url";
import { absoluteUrl, SITE_OG_TITLE } from "./site";

export type SocialMetadataValidationResult = {
  label: string;
  valid: boolean;
  errors: string[];
};

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isAbsoluteUrl(value: unknown): boolean {
  return isNonEmptyString(value) && /^https?:\/\//.test(value);
}

function requireField(
  errors: string[],
  label: string,
  value: unknown,
  predicate: (value: unknown) => boolean
): void {
  if (!predicate(value)) {
    errors.push(`${label} is missing or invalid`);
  }
}

function firstImageUrl(images: unknown): string | undefined {
  if (!images) return undefined;
  if (typeof images === "string") return images;
  if (Array.isArray(images)) {
    const first = images[0];
    if (typeof first === "string") return first;
    if (first && typeof first === "object" && "url" in first) {
      const url = (first as { url?: unknown }).url;
      return typeof url === "string" ? url : undefined;
    }
  }
  if (typeof images === "object" && images !== null && "url" in images) {
    const url = (images as { url?: unknown }).url;
    return typeof url === "string" ? url : undefined;
  }
  return undefined;
}

export function validateSocialMetadata(
  label: string,
  metadata: Metadata,
  options: { requireImages?: boolean } = {}
): SocialMetadataValidationResult {
  const requireImages = options.requireImages ?? true;
  const errors: string[] = [];
  const openGraph = metadata.openGraph as
    | (NonNullable<Metadata["openGraph"]> & { type?: string })
    | undefined;
  const twitter = metadata.twitter as
    | (NonNullable<Metadata["twitter"]> & { card?: string })
    | undefined;
  const other = metadata.other ?? {};

  requireField(errors, "description", metadata.description, isNonEmptyString);
  requireField(errors, "openGraph.title", openGraph?.title, isNonEmptyString);
  requireField(
    errors,
    "openGraph.description",
    openGraph?.description,
    isNonEmptyString
  );
  requireField(errors, "openGraph.url", openGraph?.url, isAbsoluteUrl);
  requireField(errors, "openGraph.siteName", openGraph?.siteName, isNonEmptyString);
  requireField(errors, "openGraph.locale", openGraph?.locale, isNonEmptyString);
  requireField(errors, "openGraph.type", openGraph?.type, isNonEmptyString);

  requireField(errors, "twitter.card", twitter?.card, (value) => value === "summary_large_image");
  requireField(errors, "twitter.title", twitter?.title, isNonEmptyString);
  requireField(
    errors,
    "twitter.description",
    twitter?.description,
    isNonEmptyString
  );
  requireField(errors, "twitter.site", twitter?.site, isNonEmptyString);
  requireField(errors, "twitter.creator", twitter?.creator, isNonEmptyString);

  const ogImage = firstImageUrl(openGraph?.images);
  const twitterImage = firstImageUrl(twitter?.images);

  if (requireImages && ogImage) {
    requireField(errors, "openGraph.images[0].url", ogImage, isAbsoluteUrl);
    requireField(errors, "other.og:image:width", other["og:image:width"], (value) => value === "1200");
    requireField(errors, "other.og:image:height", other["og:image:height"], (value) => value === "630");
    requireField(errors, "other.og:image:alt", other["og:image:alt"], isNonEmptyString);
  } else if (requireImages) {
    errors.push("openGraph.images must include at least one absolute URL");
  }

  if (requireImages && twitterImage) {
    requireField(errors, "twitter.images[0].url", twitterImage, isAbsoluteUrl);
    requireField(errors, "other.twitter:image:alt", other["twitter:image:alt"], isNonEmptyString);
  } else if (requireImages) {
    errors.push("twitter.images must include at least one absolute URL");
  }

  requireField(
    errors,
    "other.twitter:card",
    other["twitter:card"],
    (value) => value === "summary_large_image"
  );

  return { label, valid: errors.length === 0, errors };
}

export function validateSampleSocialMetadata(): SocialMetadataValidationResult[] {
  const samples: Array<{
    label: string;
    metadata: Metadata;
    requireImages?: boolean;
  }> = [
    { label: "Root layout", metadata: buildRootLayoutMetadata(), requireImages: false },
    { label: "Home page", metadata: publicMetadata("home"), requireImages: false },
    { label: "Order online", metadata: publicMetadata("orderOnline") },
    { label: "Search page", metadata: publicMetadata("search") },
    {
      label: "Entity page",
      metadata: buildEntityMetadata({
        entityName: "Margherita Pizza",
        title: "Margherita Pizza",
        description: "Classic cheese pizza with fresh basil.",
        path: "/food/dish_pizza_1",
        image: "/default-food.webp",
        keywords: ["pizza", "margherita"],
        socialTitle: "Order Margherita Pizza on Foodiq",
        socialDescription: "Classic cheese pizza with fresh basil.",
      }),
      requireImages: false,
    },
    {
      label: "Private page",
      metadata: buildPageMetadata({
        title: "Your Cart",
        description: "Review your cart on Foodiq.",
        path: "/cart",
        noIndex: true,
        socialImageMode: "api",
      }),
    },
  ];

  return samples.map(({ label, metadata, requireImages }) =>
    validateSocialMetadata(label, metadata, { requireImages })
  );
}

export function assertValidSocialMetadata(
  results: SocialMetadataValidationResult[]
): asserts results is SocialMetadataValidationResult[] {
  const failures = results.filter((result) => !result.valid);
  if (failures.length === 0) return;

  const message = failures
    .map((failure) => `${failure.label}: ${failure.errors.join("; ")}`)
    .join("\n");
  throw new Error(`Social metadata validation failed:\n${message}`);
}

export function validateSocialImageUrlBuilder(): void {
  const url = buildSocialImageUrl({
    title: SITE_OG_TITLE,
    subtitle: "Order delicious food online.",
    image: absoluteUrl("/default-food.webp"),
  });

  if (!isAbsoluteUrl(url)) {
    throw new Error("Social image URL must be absolute");
  }

  if (!url.includes("/api/social-image?")) {
    throw new Error("Social image URL must target /api/social-image");
  }
}

export function validateSocialSeo(): void {
  validateSocialImageUrlBuilder();
  assertValidSocialMetadata(validateSampleSocialMetadata());
}
