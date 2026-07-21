import {
  createSocialImageResponse,
  SOCIAL_IMAGE_CONTENT_TYPE,
  SOCIAL_IMAGE_SIZE,
} from "@/lib/seo/social-image";
import { getCategoryBySlug } from "@/lib/data/categoryData";
import { SITE_NAME } from "@/lib/seo/site";

export const runtime = "edge";
export const alt = "Food category on Foodiq";
export const size = SOCIAL_IMAGE_SIZE;
export const contentType = SOCIAL_IMAGE_CONTENT_TYPE;

export default async function OpenGraphImage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const category = getCategoryBySlug(slug);
  const name = category?.name ?? slug;

  return createSocialImageResponse({
    title: `${name} Collection`,
    subtitle: category?.description || `Explore ${name} dishes on ${SITE_NAME}.`,
    badge: "Category",
    imageUrl: category?.image,
  });
}
