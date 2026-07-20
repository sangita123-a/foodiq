import type { Metadata } from "next";
import type { ReactNode } from "react";
import JsonLd from "@/components/seo/JsonLd";
import {
  ApiEnvelope,
  breadcrumbJsonLd,
  fetchApiJson,
  foodMenuJsonLd,
  restaurantJsonLd,
} from "@/lib/seo/jsonld";
import { buildPageMetadata } from "@/lib/seo/metadata";

type Restaurant = {
  id: string;
  name: string;
  description?: string | null;
  image_url?: string | null;
  address?: string | null;
  phone?: string | null;
  rating?: number | string | null;
  review_count?: number | string | null;
  price_range?: number | string | null;
};

type MenuItem = {
  id?: string;
  name: string;
  description?: string | null;
  price?: number | string | null;
  image_url?: string | null;
};

type LayoutProps = {
  children: ReactNode;
  params: Promise<{ id: string }>;
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const res = await fetchApiJson<ApiEnvelope<Restaurant>>(
    `/api/restaurants/${id}`
  );
  const restaurant = res?.data;

  if (!restaurant?.name) {
    return buildPageMetadata({
      title: "Restaurant",
      description: "View restaurant menu and order online on Foodiq.",
      path: `/restaurant/${id}`,
    });
  }

  const description =
    restaurant.description?.trim() ||
    `Order from ${restaurant.name} on Foodiq. Browse the full menu, ratings, and delivery options.`;

  return buildPageMetadata({
    title: restaurant.name,
    description: description.slice(0, 160),
    path: `/restaurant/${restaurant.id}`,
    image: restaurant.image_url,
  });
}

export default async function RestaurantLayout({
  children,
  params,
}: LayoutProps) {
  const { id } = await params;
  const [restaurantRes, menuRes] = await Promise.all([
    fetchApiJson<ApiEnvelope<Restaurant>>(`/api/restaurants/${id}`),
    fetchApiJson<ApiEnvelope<MenuItem[]>>(`/api/restaurants/${id}/menu`),
  ]);

  const restaurant = restaurantRes?.data;
  const menuItems = Array.isArray(menuRes?.data) ? menuRes.data : [];

  const schemas = [];
  if (restaurant?.name) {
    schemas.push(
      breadcrumbJsonLd([
        { name: "Home", path: "/" },
        { name: "Restaurants", path: "/restaurants" },
        { name: restaurant.name, path: `/restaurant/${restaurant.id}` },
      ]),
      restaurantJsonLd(restaurant),
      foodMenuJsonLd(
        { id: restaurant.id, name: restaurant.name },
        menuItems
      )
    );
  }

  return (
    <>
      {schemas.length > 0 ? <JsonLd data={schemas} /> : null}
      {children}
    </>
  );
}
