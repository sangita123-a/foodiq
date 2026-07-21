import {
  createSocialImageResponse,
  SOCIAL_IMAGE_CONTENT_TYPE,
  SOCIAL_IMAGE_SIZE,
} from "@/lib/seo/social-image";
import { getCategoryDishById, isCategoryDishId } from "@/lib/data/categoryData";
import {
  getCollectionDishById,
  isCollectionDishId,
} from "@/lib/data/collectionsData";
import { ApiEnvelope, fetchApiJson } from "@/lib/seo/jsonld";

export const runtime = "edge";
export const alt = "Food dish on Foodiq";
export const size = SOCIAL_IMAGE_SIZE;
export const contentType = SOCIAL_IMAGE_CONTENT_TYPE;

type MenuItem = {
  name?: string;
  description?: string | null;
  image_url?: string | null;
  restaurant_name?: string | null;
};

export default async function OpenGraphImage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  if (isCollectionDishId(id)) {
    const dish = getCollectionDishById(id);
    if (dish) {
      return createSocialImageResponse({
        title: dish.name,
        subtitle: dish.description.slice(0, 120),
        badge: dish.restaurantName,
        imageUrl: dish.image,
      });
    }
  }

  if (isCategoryDishId(id)) {
    const dish = getCategoryDishById(id);
    if (dish) {
      return createSocialImageResponse({
        title: dish.name,
        subtitle: dish.description.slice(0, 120),
        badge: dish.restaurantName,
        imageUrl: dish.image,
      });
    }
  }

  const res = await fetchApiJson<ApiEnvelope<MenuItem>>(`/api/menu-items/${id}`);
  const item = res?.data;

  return createSocialImageResponse({
    title: item?.name || "Dish",
    subtitle:
      item?.description?.slice(0, 120) ||
      `Order ${item?.name || "this dish"} on Foodiq.`,
    badge: item?.restaurant_name || "Foodiq",
    imageUrl: item?.image_url,
  });
}
