import {
  createSocialImageResponse,
  SOCIAL_IMAGE_CONTENT_TYPE,
  SOCIAL_IMAGE_SIZE,
} from "@/lib/seo/social-image";
import { getCollectionBySlug } from "@/lib/data/collectionsData";
import { SITE_NAME } from "@/lib/seo/site";

export const runtime = "edge";
export const alt = "Food collection on Foodiq";
export const size = SOCIAL_IMAGE_SIZE;
export const contentType = SOCIAL_IMAGE_CONTENT_TYPE;

export default async function OpenGraphImage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const collection = getCollectionBySlug(slug);

  return createSocialImageResponse({
    title: collection?.title || "Collection",
    subtitle: collection?.description || `Curated picks on ${SITE_NAME}.`,
    badge: "Collection",
    imageUrl: collection?.bannerImage,
  });
}
