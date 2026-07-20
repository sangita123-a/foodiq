import type { MetadataRoute } from "next";
import { CATEGORY_DISHES, CATEGORY_SLUGS } from "@/lib/data/categoryData";
import { COLLECTION_DISHES, COLLECTION_SLUGS } from "@/lib/data/collectionsData";
import { CUISINE_SLUGS } from "@/lib/cuisines";
import {
  ApiEnvelope,
  fetchApiJsonWithTimeout,
} from "@/lib/seo/jsonld";
import { absoluteUrl } from "@/lib/seo/site";
import { OFFER_IDS } from "@/lib/offers";

export const revalidate = 3600;

type SitemapEntry = MetadataRoute.Sitemap[number];

type StaticPage = {
  path: string;
  changeFrequency: SitemapEntry["changeFrequency"];
  priority: number;
};

const STATIC_PAGES: StaticPage[] = [
  { path: "/", changeFrequency: "daily", priority: 1 },
  { path: "/order-online", changeFrequency: "daily", priority: 0.85 },
  { path: "/restaurants", changeFrequency: "daily", priority: 0.9 },
  { path: "/popular-restaurants", changeFrequency: "daily", priority: 0.85 },
  { path: "/popular-cuisines", changeFrequency: "weekly", priority: 0.8 },
  { path: "/trending-dishes", changeFrequency: "daily", priority: 0.8 },
  { path: "/offers", changeFrequency: "daily", priority: 0.8 },
  { path: "/collections", changeFrequency: "weekly", priority: 0.75 },
  { path: "/search", changeFrequency: "weekly", priority: 0.6 },
  { path: "/help-support", changeFrequency: "monthly", priority: 0.5 },
  { path: "/about", changeFrequency: "monthly", priority: 0.5 },
  { path: "/contact", changeFrequency: "monthly", priority: 0.5 },
  { path: "/privacy-policy", changeFrequency: "yearly", priority: 0.3 },
  { path: "/terms-of-service", changeFrequency: "yearly", priority: 0.3 },
];

type RestaurantRow = { id: string; updated_at?: string };
type MenuItemRow = { id: string; updated_at?: string };

function toEntry(
  path: string,
  now: Date,
  changeFrequency: SitemapEntry["changeFrequency"],
  priority: number,
  lastModified?: string | Date
): SitemapEntry {
  return {
    url: absoluteUrl(path),
    lastModified: lastModified ? new Date(lastModified) : now,
    changeFrequency,
    priority,
  };
}

function dedupeEntries(entries: SitemapEntry[]): SitemapEntry[] {
  const seen = new Set<string>();
  return entries.filter((entry) => {
    if (seen.has(entry.url)) return false;
    seen.add(entry.url);
    return true;
  });
}

function unwrapList<T>(payload: ApiEnvelope<T[]> | T[] | null | undefined): T[] {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
}

function buildStaticEntries(now: Date): SitemapEntry[] {
  const entries: SitemapEntry[] = STATIC_PAGES.map((page) =>
    toEntry(page.path, now, page.changeFrequency, page.priority)
  );

  for (const slug of CATEGORY_SLUGS) {
    entries.push(toEntry(`/category/${slug}`, now, "weekly", 0.75));
  }

  for (const slug of CUISINE_SLUGS) {
    entries.push(toEntry(`/cuisine/${slug}`, now, "weekly", 0.7));
  }

  for (const slug of COLLECTION_SLUGS) {
    entries.push(toEntry(`/collections/${slug}`, now, "weekly", 0.7));
  }

  for (const slug of CATEGORY_SLUGS) {
    for (const dish of CATEGORY_DISHES[slug] ?? []) {
      entries.push(toEntry(`/food/${dish.id}`, now, "weekly", 0.65));
    }
  }

  for (const slug of COLLECTION_SLUGS) {
    for (const dish of COLLECTION_DISHES[slug] ?? []) {
      entries.push(toEntry(`/food/${dish.id}`, now, "weekly", 0.65));
    }
  }

  return entries;
}

async function buildDynamicEntries(now: Date): Promise<SitemapEntry[]> {
  const entries: SitemapEntry[] = [];

  const [restaurantsPayload, menuPayload] = await Promise.all([
    fetchApiJsonWithTimeout<ApiEnvelope<RestaurantRow[]>>(
      "/api/restaurants?limit=500",
      8000
    ),
    fetchApiJsonWithTimeout<ApiEnvelope<MenuItemRow[]>>(
      "/api/menu-items?limit=500",
      8000
    ),
  ]);

  for (const restaurant of unwrapList(restaurantsPayload)) {
    if (!restaurant?.id) continue;
    entries.push(
      toEntry(
        `/restaurant/${restaurant.id}`,
        now,
        "daily",
        0.8,
        restaurant.updated_at
      )
    );
  }

  for (const item of unwrapList(menuPayload)) {
    if (!item?.id) continue;
    entries.push(
      toEntry(`/food/${item.id}`, now, "weekly", 0.7, item.updated_at)
    );
  }

  for (const offerId of OFFER_IDS) {
    entries.push(toEntry(`/offers/${offerId}`, now, "daily", 0.6));
  }

  return entries;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  try {
    const staticEntries = buildStaticEntries(now);
    const dynamicEntries = await buildDynamicEntries(now);
    return dedupeEntries([...staticEntries, ...dynamicEntries]);
  } catch {
    return dedupeEntries(buildStaticEntries(now));
  }
}
