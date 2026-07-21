import {
  createSocialImageResponse,
  SOCIAL_IMAGE_CONTENT_TYPE,
  SOCIAL_IMAGE_SIZE,
} from "@/lib/seo/social-image";
import { ApiEnvelope, fetchApiJson } from "@/lib/seo/jsonld";

export const runtime = "edge";
export const alt = "Restaurant on Foodiq";
export const size = SOCIAL_IMAGE_SIZE;
export const contentType = SOCIAL_IMAGE_CONTENT_TYPE;

type Restaurant = {
  name?: string;
  description?: string | null;
  image_url?: string | null;
};

export default async function OpenGraphImage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const res = await fetchApiJson<ApiEnvelope<Restaurant>>(`/api/restaurants/${id}`);
  const restaurant = res?.data;

  return createSocialImageResponse({
    title: restaurant?.name || "Restaurant",
    subtitle:
      restaurant?.description?.slice(0, 120) ||
      "Browse the menu and order online on Foodiq.",
    badge: "Restaurant",
    imageUrl: restaurant?.image_url,
  });
}
