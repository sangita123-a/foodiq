import { absoluteUrl } from "./site";

export type SocialImageUrlInput = {
  title: string;
  subtitle?: string;
  image?: string | null;
};

/** Builds the dynamic social preview image URL (Open Graph, Twitter, Facebook, LinkedIn). */
export function buildSocialImageUrl({
  title,
  subtitle,
  image,
}: SocialImageUrlInput): string {
  const params = new URLSearchParams();
  params.set("title", title.slice(0, 100));
  if (subtitle) params.set("subtitle", subtitle.slice(0, 160));
  if (image) {
    params.set(
      "image",
      image.startsWith("http") ? image : absoluteUrl(image)
    );
  }
  return absoluteUrl(`/api/social-image?${params.toString()}`);
}

export function resolveSocialPreviewImageUrl(
  socialTitle: string,
  socialDescription: string,
  image?: string | null
): string {
  if (image) {
    return buildSocialImageUrl({
      title: socialTitle,
      subtitle: socialDescription,
      image,
    });
  }

  return buildSocialImageUrl({
    title: socialTitle,
    subtitle: socialDescription,
  });
}
