import type { MetadataRoute } from "next";
import { CATEGORY_DISHES, CATEGORY_SLUGS } from "@/lib/data/categoryData";
import { COLLECTION_DISHES, COLLECTION_SLUGS } from "@/lib/data/collectionsData";
import { CUISINE_SLUGS } from "@/lib/cuisines";
import { DUPLICATE_CUISINE_CATEGORY_SLUGS } from "@/lib/seo/urls";
import {
  ApiEnvelope,
  fetchApiJsonWithTimeout,
} from "@/lib/seo/jsonld";
import { getStaticSitemapEntries, isPrivateRoute } from "@/lib/seo/public-routes";
import { absoluteUrl } from "@/lib/seo/site";
import { isRedirectOnlyRoute } from "@/lib/seo/urls";
import { OFFER_IDS } from "@/lib/offers";

export type SitemapEntry = MetadataRoute.Sitemap[number];

type RestaurantRow = { id: string; updated_at?: string };
type MenuItemRow = { id: string; updated_at?: string };

export function toSitemapEntry(
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

export function dedupeSitemapEntries(entries: SitemapEntry[]): SitemapEntry[] {
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

export function buildStaticSitemapEntries(now = new Date()): SitemapEntry[] {
  const entries: SitemapEntry[] = getStaticSitemapEntries().map((page) =>
    toSitemapEntry(page.path, now, page.changeFrequency, page.priority)
  );

  for (const slug of CATEGORY_SLUGS) {
    entries.push(toSitemapEntry(`/category/${slug}`, now, "weekly", 0.75));
  }

  for (const slug of CUISINE_SLUGS) {
    if ((DUPLICATE_CUISINE_CATEGORY_SLUGS as readonly string[]).includes(slug)) {
      continue;
    }
    entries.push(toSitemapEntry(`/cuisine/${slug}`, now, "weekly", 0.7));
  }

  for (const slug of COLLECTION_SLUGS) {
    entries.push(toSitemapEntry(`/collections/${slug}`, now, "weekly", 0.7));
  }

  for (const slug of CATEGORY_SLUGS) {
    for (const dish of CATEGORY_DISHES[slug] ?? []) {
      entries.push(toSitemapEntry(`/food/${dish.id}`, now, "weekly", 0.65));
    }
  }

  for (const slug of COLLECTION_SLUGS) {
    for (const dish of COLLECTION_DISHES[slug] ?? []) {
      entries.push(toSitemapEntry(`/food/${dish.id}`, now, "weekly", 0.65));
    }
  }

  for (const offerId of OFFER_IDS) {
    entries.push(toSitemapEntry(`/offers/${offerId}`, now, "daily", 0.6));
  }

  return entries;
}

async function buildDynamicSitemapEntries(now: Date): Promise<SitemapEntry[]> {
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
      toSitemapEntry(
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
      toSitemapEntry(`/food/${item.id}`, now, "weekly", 0.7, item.updated_at)
    );
  }

  return entries;
}

export async function buildFullSitemapEntries(now = new Date()): Promise<SitemapEntry[]> {
  try {
    const staticEntries = buildStaticSitemapEntries(now);
    const dynamicEntries = await buildDynamicSitemapEntries(now);
    return dedupeSitemapEntries([...staticEntries, ...dynamicEntries]);
  } catch {
    return dedupeSitemapEntries(buildStaticSitemapEntries(now));
  }
}

export function assertPublicSitemapEntry(entry: SitemapEntry): void {
  const site = absoluteUrl("/");
  if (!entry.url.startsWith("http://") && !entry.url.startsWith("https://")) {
    throw new Error(`Sitemap URL must be absolute: ${entry.url}`);
  }

  if (!entry.url.startsWith(site)) {
    throw new Error(`Sitemap URL must use site origin ${site}: ${entry.url}`);
  }

  const pathname = entry.url.slice(site.length) || "/";
  if (isPrivateRoute(pathname)) {
    throw new Error(`Private route must not appear in sitemap: ${pathname}`);
  }
  if (isRedirectOnlyRoute(pathname)) {
    throw new Error(`Redirect-only route must not appear in sitemap: ${pathname}`);
  }

  const priority = entry.priority ?? 0.5;
  if (priority < 0 || priority > 1) {
    throw new Error(`Sitemap priority out of range for ${pathname}: ${priority}`);
  }
}
