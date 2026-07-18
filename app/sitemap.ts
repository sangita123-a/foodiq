import type { MetadataRoute } from "next";
import { CUISINE_SLUGS } from "@/lib/cuisines";
import {
  ApiEnvelope,
  fetchApiJson,
} from "@/lib/seo/jsonld";
import { absoluteUrl } from "@/lib/seo/site";

type RestaurantRow = { id: string; updated_at?: string };
type MenuItemRow = { id: string; updated_at?: string };
type OfferRow = { id: string; updated_at?: string };

const STATIC_PATHS: Array<{ path: string; changeFrequency: MetadataRoute.Sitemap[0]["changeFrequency"]; priority: number }> = [
  { path: "/", changeFrequency: "daily", priority: 1 },
  { path: "/restaurants", changeFrequency: "daily", priority: 0.9 },
  { path: "/popular-restaurants", changeFrequency: "daily", priority: 0.8 },
  { path: "/popular-cuisines", changeFrequency: "weekly", priority: 0.8 },
  { path: "/trending-dishes", changeFrequency: "daily", priority: 0.8 },
  { path: "/offers", changeFrequency: "daily", priority: 0.8 },
  { path: "/collections", changeFrequency: "weekly", priority: 0.7 },
  { path: "/search", changeFrequency: "weekly", priority: 0.6 },
  { path: "/about", changeFrequency: "monthly", priority: 0.5 },
  { path: "/contact", changeFrequency: "monthly", priority: 0.5 },
  { path: "/help-support", changeFrequency: "monthly", priority: 0.5 },
  { path: "/privacy-policy", changeFrequency: "yearly", priority: 0.3 },
  { path: "/terms-of-service", changeFrequency: "yearly", priority: 0.3 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const entries: MetadataRoute.Sitemap = STATIC_PATHS.map((item) => ({
    url: absoluteUrl(item.path),
    lastModified: now,
    changeFrequency: item.changeFrequency,
    priority: item.priority,
  }));

  for (const slug of CUISINE_SLUGS) {
    entries.push({
      url: absoluteUrl(`/cuisine/${slug}`),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.7,
    });
  }

  const restaurants = await fetchApiJson<ApiEnvelope<RestaurantRow[]>>(
    "/api/restaurants?limit=500"
  );
  const restaurantList = Array.isArray(restaurants?.data)
    ? restaurants.data
    : Array.isArray(restaurants)
      ? (restaurants as unknown as RestaurantRow[])
      : [];

  for (const r of restaurantList) {
    if (!r?.id) continue;
    entries.push({
      url: absoluteUrl(`/restaurant/${r.id}`),
      lastModified: r.updated_at ? new Date(r.updated_at) : now,
      changeFrequency: "daily",
      priority: 0.8,
    });
  }

  const menu = await fetchApiJson<ApiEnvelope<MenuItemRow[]>>(
    "/api/menu-items?limit=500"
  );
  const menuList = Array.isArray(menu?.data)
    ? menu.data
    : Array.isArray(menu)
      ? (menu as unknown as MenuItemRow[])
      : [];

  for (const item of menuList) {
    if (!item?.id) continue;
    entries.push({
      url: absoluteUrl(`/food/${item.id}`),
      lastModified: item.updated_at ? new Date(item.updated_at) : now,
      changeFrequency: "weekly",
      priority: 0.7,
    });
  }

  const offers = await fetchApiJson<ApiEnvelope<OfferRow[]>>("/api/offers");
  const offerList = Array.isArray(offers?.data)
    ? offers.data
    : Array.isArray(offers)
      ? (offers as unknown as OfferRow[])
      : [];

  for (const offer of offerList) {
    if (!offer?.id) continue;
    entries.push({
      url: absoluteUrl(`/offers/${offer.id}`),
      lastModified: offer.updated_at ? new Date(offer.updated_at) : now,
      changeFrequency: "daily",
      priority: 0.6,
    });
  }

  return entries;
}
