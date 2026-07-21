import {
  createSocialImageResponse,
  SOCIAL_IMAGE_CONTENT_TYPE,
  SOCIAL_IMAGE_SIZE,
} from "@/lib/seo/social-image";
import { ApiEnvelope, fetchApiJson } from "@/lib/seo/jsonld";
import { SITE_NAME } from "@/lib/seo/site";

export const runtime = "edge";
export const alt = "Cuisine on Foodiq";
export const size = SOCIAL_IMAGE_SIZE;
export const contentType = SOCIAL_IMAGE_CONTENT_TYPE;

type Cuisine = {
  name?: string;
  description?: string | null;
  image_url?: string | null;
};

function titleCaseSlug(slug: string) {
  return slug
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export default async function OpenGraphImage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const res = await fetchApiJson<ApiEnvelope<Cuisine>>(`/api/cuisines/${slug}`);
  const cuisine = res?.data;
  const name = cuisine?.name || titleCaseSlug(slug);

  return createSocialImageResponse({
    title: `${name} Cuisine`,
    subtitle:
      cuisine?.description?.slice(0, 120) ||
      `Explore ${name} restaurants and dishes on ${SITE_NAME}.`,
    badge: "Cuisine",
    imageUrl: cuisine?.image_url,
  });
}
