import {
  type HeroCity,
  getRestaurantCity,
  restaurantMatchesCity,
  resolveCityKey,
} from "@/lib/heroLocation";

export type HeroSearchResult = {
  type: "restaurant" | "dish" | "category" | "collection" | "cuisine" | "popular" | "recent" | "trending";
  id: string;
  name: string;
  subtitle?: string;
  href: string;
};

export const POPULAR_SEARCHES = [
  "Pizza",
  "Burger",
  "Biryani",
  "Momos",
  "Chinese",
  "South Indian",
  "North Indian",
  "Ice Cream",
] as const;

export const TRENDING_SEARCHES = [
  "Biryani",
  "Pizza",
  "Burger",
  "Momos",
  "Chinese",
] as const;

const RECENT_STORAGE_KEY = "foodiq_recent_searches";
const MAX_RECENT = 8;

type CatalogData = {
  restaurants: Array<{
    id: string;
    name: string;
    category: string;
    cuisine: string;
    location: string;
  }>;
  dishes: Array<{
    id: string;
    name: string;
    category: string;
    restaurantId: string;
    restaurantName: string;
  }>;
  categories: Array<{ id: string; name: string; description: string }>;
  collections: Array<{ slug: string; title: string; description: string }>;
};

let catalog: CatalogData | null = null;
let catalogPromise: Promise<CatalogData> | null = null;

export function normalizeSearchQuery(raw: string): string {
  return raw.trim().replace(/\s+/g, " ").toLowerCase();
}

function matchesQuery(text: string, query: string): boolean {
  return normalizeSearchQuery(text).includes(query);
}

function ensureCatalog(): Promise<CatalogData> {
  if (catalog) return Promise.resolve(catalog);
  if (!catalogPromise) {
    catalogPromise = Promise.all([
      import("@/lib/data/30restaurantsData"),
      import("@/lib/data/categoryData"),
      import("@/lib/data/collectionsData"),
    ]).then(([restaurantsModule, categoryModule, collectionsModule]) => {
      catalog = {
        restaurants: restaurantsModule.POPULAR_RESTAURANTS_30,
        dishes: restaurantsModule.TRENDING_DISHES_60,
        categories: categoryModule.CATEGORIES,
        collections: collectionsModule.FEATURED_COLLECTIONS,
      };
      return catalog;
    });
  }
  return catalogPromise;
}

/** Warm the search catalog chunk during idle time or on first interaction. */
export function preloadHeroSearchCatalog(): void {
  void ensureCatalog();
}

export function getRecentSearches(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(RECENT_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((item): item is string => typeof item === "string" && item.trim().length > 0)
      .map((item) => item.trim())
      .slice(0, MAX_RECENT);
  } catch {
    return [];
  }
}

export function pushRecentSearch(query: string): void {
  if (typeof window === "undefined") return;
  const trimmed = query.trim().replace(/\s+/g, " ");
  if (!trimmed) return;
  const next = [
    trimmed,
    ...getRecentSearches().filter(
      (item) => item.toLowerCase() !== trimmed.toLowerCase()
    ),
  ].slice(0, MAX_RECENT);
  try {
    localStorage.setItem(RECENT_STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
}

function listingHref(query: string, city: string): string {
  const cityKey = resolveCityKey(city);
  return `/search?q=${encodeURIComponent(query.trim())}&city=${encodeURIComponent(cityKey)}`;
}

function buildQuickSuggestions(city: string): HeroSearchResult[] {
  const cityKey = resolveCityKey(city);
  const results: HeroSearchResult[] = [];
  const seen = new Set<string>();

  const push = (item: HeroSearchResult) => {
    const key = `${item.type}:${item.id}`;
    if (seen.has(key)) return;
    seen.add(key);
    results.push(item);
  };

  for (const term of getRecentSearches()) {
    push({
      type: "recent",
      id: `recent-${term}`,
      name: term,
      subtitle: "Recent",
      href: listingHref(term, cityKey),
    });
  }

  for (const term of TRENDING_SEARCHES) {
    push({
      type: "trending",
      id: `trending-${term}`,
      name: term,
      subtitle: "Trending",
      href: listingHref(term, cityKey),
    });
  }

  for (const term of POPULAR_SEARCHES) {
    push({
      type: "popular",
      id: `popular-${term}`,
      name: term,
      subtitle: "Popular",
      href: listingHref(term, cityKey),
    });
  }

  return results.slice(0, 12);
}

function searchWithCatalog(
  query: string,
  city: string,
  data: CatalogData
): HeroSearchResult[] {
  const q = normalizeSearchQuery(query);
  if (q.length < 1) return [];

  const cityKey = resolveCityKey(city);
  const results: HeroSearchResult[] = [];
  const seen = new Set<string>();
  const cuisinesSeen = new Set<string>();

  const push = (item: HeroSearchResult) => {
    const key = `${item.type}:${item.id}`;
    if (seen.has(key)) return;
    seen.add(key);
    results.push(item);
  };

  for (const restaurant of data.restaurants) {
    if (!restaurantMatchesCity(restaurant.id, cityKey)) continue;
    if (
      matchesQuery(restaurant.name, q) ||
      matchesQuery(restaurant.category, q) ||
      matchesQuery(restaurant.cuisine, q) ||
      matchesQuery(restaurant.location, q)
    ) {
      push({
        type: "restaurant",
        id: restaurant.id,
        name: restaurant.name,
        subtitle: restaurant.cuisine,
        href: `/restaurant/${restaurant.id}?city=${encodeURIComponent(cityKey)}`,
      });
    }

    if (matchesQuery(restaurant.cuisine, q)) {
      const cuisineKey = normalizeSearchQuery(restaurant.cuisine);
      if (!cuisinesSeen.has(cuisineKey)) {
        cuisinesSeen.add(cuisineKey);
        push({
          type: "cuisine",
          id: `cuisine-${cuisineKey}`,
          name: restaurant.cuisine,
          subtitle: "Cuisine",
          href: listingHref(restaurant.cuisine, cityKey),
        });
      }
    }
  }

  for (const dish of data.dishes) {
    if (!restaurantMatchesCity(dish.restaurantId, cityKey)) continue;
    if (
      matchesQuery(dish.name, q) ||
      matchesQuery(dish.category, q) ||
      matchesQuery(dish.restaurantName, q)
    ) {
      push({
        type: "dish",
        id: dish.id,
        name: dish.name,
        subtitle: dish.restaurantName,
        href: `/food/${dish.id}`,
      });
    }
  }

  for (const category of data.categories) {
    if (matchesQuery(category.name, q) || matchesQuery(category.description, q)) {
      push({
        type: "category",
        id: category.id,
        name: category.name,
        subtitle: "Category",
        href: `/category/${category.id}`,
      });
    }
  }

  for (const collection of data.collections) {
    if (matchesQuery(collection.title, q) || matchesQuery(collection.description, q)) {
      push({
        type: "collection",
        id: collection.slug,
        name: collection.title,
        subtitle: "Collection",
        href: `/collections/${collection.slug}`,
      });
    }
  }

  for (const term of POPULAR_SEARCHES) {
    if (matchesQuery(term, q)) {
      push({
        type: "popular",
        id: `popular-${term}`,
        name: term,
        subtitle: "Popular",
        href: listingHref(term, cityKey),
      });
    }
  }

  return results.slice(0, 10);
}

/** Sync search when catalog is already loaded; otherwise returns []. */
export function searchHeroCatalog(query: string, city: string): HeroSearchResult[] {
  if (!catalog) return [];
  return searchWithCatalog(query, city, catalog);
}

export async function searchHeroCatalogAsync(
  query: string,
  city: string
): Promise<HeroSearchResult[]> {
  const data = await ensureCatalog();
  return searchWithCatalog(query, city, data);
}

/** Empty-query autocomplete: recent, trending, popular. */
export function getHeroEmptySuggestions(city: string): HeroSearchResult[] {
  return buildQuickSuggestions(city);
}

export async function mapApiSuggestion(
  row: { type: string; id: string; name: string; subtitle?: string },
  city: string
): Promise<HeroSearchResult | null> {
  const cityKey = resolveCityKey(city);
  if (row.type === "restaurant" && !restaurantMatchesCity(row.id, cityKey)) {
    return null;
  }
  if (row.type === "menu_item" || row.type === "dish") {
    const data = await ensureCatalog();
    const dish = data.dishes.find((entry) => entry.id === row.id);
    if (dish && !restaurantMatchesCity(dish.restaurantId, cityKey)) return null;
    return {
      type: "dish",
      id: row.id,
      name: row.name,
      subtitle: row.subtitle,
      href: `/food/${row.id}`,
    };
  }
  if (row.type === "restaurant") {
    return {
      type: "restaurant",
      id: row.id,
      name: row.name,
      subtitle: row.subtitle,
      href: `/restaurant/${row.id}?city=${encodeURIComponent(cityKey)}`,
    };
  }
  if (row.type === "cuisine") {
    return {
      type: "cuisine",
      id: row.id,
      name: row.name,
      subtitle: row.subtitle || "Cuisine",
      href: listingHref(row.name, cityKey),
    };
  }
  if (row.type === "category") {
    const slug = row.subtitle?.toLowerCase().replace(/\s+/g, "-") || row.id;
    return {
      type: "category",
      id: row.id,
      name: row.name,
      subtitle: row.subtitle || "Category",
      href: `/category/${slug}`,
    };
  }
  if (row.type === "collection") {
    return {
      type: "collection",
      id: row.id,
      name: row.name,
      subtitle: row.subtitle || "Collection",
      href: `/collections/${row.id}`,
    };
  }
  return {
    type: "dish",
    id: row.id,
    name: row.name,
    subtitle: row.subtitle,
    href: listingHref(row.name, cityKey),
  };
}

/** Best single destination when user submits search. */
export function resolveHeroSearchTarget(
  query: string,
  city: string,
  results: HeroSearchResult[]
): string {
  const cityKey = resolveCityKey(city);
  const q = normalizeSearchQuery(query);
  if (!q) return `/order-online?city=${encodeURIComponent(cityKey)}`;

  const actionable = results.filter(
    (r) =>
      r.type === "restaurant" ||
      r.type === "dish" ||
      r.type === "category" ||
      r.type === "collection" ||
      r.type === "cuisine"
  );

  if (actionable.length === 1) return actionable[0].href;

  const exactRestaurant = actionable.find(
    (r) => r.type === "restaurant" && normalizeSearchQuery(r.name) === q
  );
  if (exactRestaurant) return exactRestaurant.href;

  const exactDish = actionable.find(
    (r) => r.type === "dish" && normalizeSearchQuery(r.name) === q
  );
  if (exactDish) return exactDish.href;

  const exactCategory = actionable.find(
    (r) => r.type === "category" && normalizeSearchQuery(r.name) === q
  );
  if (exactCategory) return exactCategory.href;

  return listingHref(query, cityKey);
}

export { getRestaurantCity };
export type { HeroCity };
