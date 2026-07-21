import type { Metadata } from "next";
import FoodDetailView from "@/components/food/FoodDetailView";
import JsonLd from "@/components/seo/JsonLd";
import {
  ApiEnvelope,
  breadcrumbJsonLd,
  fetchApiJson,
  foodItemJsonLd,
  productJsonLd,
} from "@/lib/seo/jsonld";
import { buildEntityMetadata } from "@/lib/seo/entity-metadata";
import { foodItemKeywords } from "@/lib/seo/keywords";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { getCategoryDishById, isCategoryDishId } from "@/lib/data/categoryData";
import { getCollectionDishById, isCollectionDishId } from "@/lib/data/collectionsData";

type MenuItem = {
  id: string;
  name: string;
  description?: string | null;
  price?: number | string | null;
  image_url?: string | null;
  restaurant_id?: string | null;
  restaurant_name?: string | null;
  rating?: number | string | null;
  review_count?: number | string | null;
};

function parseRating(value?: string | number | null): number | undefined {
  if (value == null) return undefined;
  const parsed = Number(String(value).replace(/[^\d.]/g, ""));
  return Number.isFinite(parsed) ? parsed : undefined;
}

type PageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;

  if (isCollectionDishId(id)) {
    const dish = getCollectionDishById(id);
    if (dish) {
      const description = dish.description.slice(0, 160);
      return buildEntityMetadata({
        entityName: dish.name,
        title: dish.name,
        description,
        path: `/food/${dish.id}`,
        image: dish.image,
        keywords: foodItemKeywords(dish.name, dish.restaurantName, dish.collection),
        socialTitle: `Order ${dish.name} on Foodiq`,
        socialDescription: description,
      });
    }
  }

  if (isCategoryDishId(id)) {
    const dish = getCategoryDishById(id);
    if (dish) {
      const description = dish.description.slice(0, 160);
      return buildEntityMetadata({
        entityName: dish.name,
        title: dish.name,
        description,
        path: `/food/${dish.id}`,
        image: dish.image,
        keywords: foodItemKeywords(dish.name, dish.restaurantName, dish.category),
        socialTitle: `Order ${dish.name} on Foodiq`,
        socialDescription: description,
      });
    }
  }

  const res = await fetchApiJson<ApiEnvelope<MenuItem>>(`/api/menu-items/${id}`);
  const item = res?.data;

  if (!item?.name) {
    return buildPageMetadata({
      title: "Dish",
      description: "View dish details and order online on Foodiq.",
      path: `/food/${id}`,
      socialTitle: "Dish Details | Foodiq",
      socialDescription:
        "View dish details, pricing, and restaurant info before ordering on Foodiq.",
    });
  }

  const description =
    item.description?.trim() ||
    `Order ${item.name}${item.restaurant_name ? ` from ${item.restaurant_name}` : ""} on Foodiq.`;
  const trimmedDescription = description.slice(0, 160);

  return buildEntityMetadata({
    entityName: item.name,
    title: item.name,
    description: trimmedDescription,
    path: `/food/${item.id}`,
    image: item.image_url,
    keywords: foodItemKeywords(item.name, item.restaurant_name),
    socialTitle: `Order ${item.name} on Foodiq`,
    socialDescription: trimmedDescription,
  });
}

export default async function FoodPage({ params }: PageProps) {
  const { id } = await params;

  if (isCollectionDishId(id)) {
    const dish = getCollectionDishById(id);
    return (
      <>
        {dish ? (
          <JsonLd
            data={[
              breadcrumbJsonLd([
                { name: "Home", path: "/" },
                { name: dish.collection, path: `/collections/${dish.collection}` },
                { name: dish.name, path: `/food/${dish.id}` },
              ]),
              productJsonLd({
                id: dish.id,
                name: dish.name,
                description: dish.description,
                price: dish.price,
                image: dish.image,
                restaurant_name: dish.restaurantName,
                rating: parseRating(dish.rating),
              }),
              foodItemJsonLd({
                id: dish.id,
                name: dish.name,
                description: dish.description,
                price: dish.price,
                image: dish.image,
                restaurant_id: dish.restaurantId,
                restaurant_name: dish.restaurantName,
                rating: parseRating(dish.rating),
              }),
            ]}
          />
        ) : null}
        <FoodDetailView id={id} />
      </>
    );
  }

  if (isCategoryDishId(id)) {
    const dish = getCategoryDishById(id);
    return (
      <>
        {dish ? (
          <JsonLd
            data={[
              breadcrumbJsonLd([
                { name: "Home", path: "/" },
                { name: dish.category, path: `/category/${dish.category}` },
                { name: dish.name, path: `/food/${dish.id}` },
              ]),
              productJsonLd({
                id: dish.id,
                name: dish.name,
                description: dish.description,
                price: dish.price,
                image: dish.image,
                restaurant_name: dish.restaurantName,
                rating: parseRating(dish.rating),
              }),
              foodItemJsonLd({
                id: dish.id,
                name: dish.name,
                description: dish.description,
                price: dish.price,
                image: dish.image,
                restaurant_id: dish.restaurantId,
                restaurant_name: dish.restaurantName,
                rating: parseRating(dish.rating),
              }),
            ]}
          />
        ) : null}
        <FoodDetailView id={id} />
      </>
    );
  }

  const res = await fetchApiJson<ApiEnvelope<MenuItem>>(`/api/menu-items/${id}`);
  const item = res?.data;

  return (
    <>
      {item?.name ? (
        <JsonLd
          data={[
            breadcrumbJsonLd([
              { name: "Home", path: "/" },
              { name: "Trending Dishes", path: "/trending-dishes" },
              { name: item.name, path: `/food/${item.id}` },
            ]),
            foodItemJsonLd(item),
            productJsonLd(item),
          ]}
        />
      ) : null}
      <FoodDetailView id={id} />
    </>
  );
}
