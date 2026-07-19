import type { Metadata } from "next";
import type { ReactNode } from "react";
import JsonLd from "@/components/seo/JsonLd";
import {
  ApiEnvelope,
  fetchApiJson,
  restaurantListJsonLd,
} from "@/lib/seo/jsonld";
import { publicMetadata } from "@/lib/seo/pages";

type RestaurantRow = { id: string; name: string; image_url?: string | null };

export const metadata: Metadata = publicMetadata("restaurants");

export default async function RestaurantsSeoLayout({
  children,
}: {
  children: ReactNode;
}) {
  const res = await fetchApiJson<ApiEnvelope<RestaurantRow[]>>(
    "/api/restaurants?limit=50"
  );
  const restaurants = Array.isArray(res?.data) ? res.data : [];

  return (
    <>
      {restaurants.length > 0 ? (
        <JsonLd data={restaurantListJsonLd(restaurants)} />
      ) : null}
      {children}
    </>
  );
}
