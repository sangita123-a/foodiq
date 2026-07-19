import type { MetadataRoute } from "next";
import { CATEGORY_DISHES, CATEGORY_SLUGS } from "@/lib/data/categoryData";
import { COLLECTION_DISHES, COLLECTION_SLUGS } from "@/lib/data/collectionsData";
import { CUISINE_SLUGS } from "@/lib/cuisines";
import {
  ApiEnvelope,
  fetchApiJson,
} from "@/lib/seo/jsonld";
import {
  getKnownDynamicRoutePatterns,
  getStaticSitemapEntries,
} from "@/lib/seo/public-routes";
import { absoluteUrl } from "@/lib/seo/site";

type RestaurantRow = { id: string; updated_at?: string };
type MenuItemRow = { id: string; updated_at?: string };
type OfferRow = { id: string; updated_at?: string };

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const entries: MetadataRoute.Sitemap = getStaticSitemapEntries().map((item) => ({
    url: absoluteUrl(item.path),
    lastModified: now,
    changeFrequency: item.changeFrequency,
    priority: item.priority,
  }));

  for (const routePath of getKnownDynamicRoutePatterns()) {
    entries.push({
      url: absoluteUrl(routePath),
      lastModified: now,
      changeFrequency: "weekly",
      priority: routePath.startsWith("/collections/") ? 0.7 : 0.75,
    });
  }

  for (const slug of CUISINE_SLUGS) {
    if (entries.some((entry) => entry.url === absoluteUrl(`/cuisine/${slug}`))) continue;
    entries.push({
      url: absoluteUrl(`/cuisine/${slug}`),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.7,
    });
  }

  for (const slug of CATEGORY_SLUGS) {
    for (const dish of CATEGORY_DISHES[slug]) {
      entries.push({
        url: absoluteUrl(`/food/${dish.id}`),
        lastModified: now,
        changeFrequency: "weekly",
        priority: 0.65,
      });
    }
  }

  for (const slug of COLLECTION_SLUGS) {
    for (const dish of COLLECTION_DISHES[slug]) {
      entries.push({
        url: absoluteUrl(`/food/${dish.id}`),
        lastModified: now,
        changeFrequency: "weekly",
        priority: 0.65,
      });
    }
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

  const seen = new Set<string>();
  return entries.filter((entry) => {
    if (seen.has(entry.url)) return false;
    seen.add(entry.url);
    return true;
  });
}
