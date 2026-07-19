import type { Metadata } from "next";
import FoodDetailView from "@/components/food/FoodDetailView";
import JsonLd from "@/components/seo/JsonLd";
import {
  ApiEnvelope,
  breadcrumbJsonLd,
  fetchApiJson,
  menuItemJsonLd,
} from "@/lib/seo/jsonld";
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
};

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
      return buildPageMetadata({
        title: dish.name,
        description: dish.description.slice(0, 160),
        path: `/food/${dish.id}`,
        image: dish.image,
      });
    }
  }

  if (isCategoryDishId(id)) {
    const dish = getCategoryDishById(id);
    if (dish) {
      return buildPageMetadata({
        title: dish.name,
        description: dish.description.slice(0, 160),
        path: `/food/${dish.id}`,
        image: dish.image,
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
    });
  }

  const description =
    item.description?.trim() ||
    `Order ${item.name}${item.restaurant_name ? ` from ${item.restaurant_name}` : ""} on Foodiq.`;

  return buildPageMetadata({
    title: item.name,
    description: description.slice(0, 160),
    path: `/food/${item.id}`,
    image: item.image_url,
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
            menuItemJsonLd(item),
          ]}
        />
      ) : null}
      <FoodDetailView id={id} />
    </>
  );
}
