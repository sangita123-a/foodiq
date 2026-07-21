import { type HeroCity, getRestaurantCity, restaurantMatchesCity } from "@/lib/heroLocation";

export type HeroSearchResult = {
  type: "restaurant" | "dish" | "category" | "collection";
  id: string;
  name: string;
  subtitle?: string;
  href: string;
};

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

function searchWithCatalog(
  query: string,
  city: HeroCity,
  data: CatalogData
): HeroSearchResult[] {
  const q = normalizeSearchQuery(query);
  if (q.length < 1) return [];

  const results: HeroSearchResult[] = [];
  const seen = new Set<string>();

  const push = (item: HeroSearchResult) => {
    const key = `${item.type}:${item.id}`;
    if (seen.has(key)) return;
    seen.add(key);
    results.push(item);
  };

  for (const restaurant of data.restaurants) {
    if (!restaurantMatchesCity(restaurant.id, city)) continue;
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
        href: `/restaurant/${restaurant.id}?city=${encodeURIComponent(city)}`,
      });
    }
  }

  for (const dish of data.dishes) {
    if (!restaurantMatchesCity(dish.restaurantId, city)) continue;
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

  return results.slice(0, 10);
}

/** Sync search when catalog is already loaded; otherwise returns []. */
export function searchHeroCatalog(query: string, city: HeroCity): HeroSearchResult[] {
  if (!catalog) return [];
  return searchWithCatalog(query, city, catalog);
}

export async function searchHeroCatalogAsync(
  query: string,
  city: HeroCity
): Promise<HeroSearchResult[]> {
  const data = await ensureCatalog();
  return searchWithCatalog(query, city, data);
}

export async function mapApiSuggestion(
  row: { type: string; id: string; name: string; subtitle?: string },
  city: HeroCity
): Promise<HeroSearchResult | null> {
  if (row.type === "restaurant" && !restaurantMatchesCity(row.id, city)) {
    return null;
  }
  if (row.type === "menu_item" || row.type === "dish") {
    const data = await ensureCatalog();
    const dish = data.dishes.find((entry) => entry.id === row.id);
    if (dish && !restaurantMatchesCity(dish.restaurantId, city)) return null;
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
      href: `/restaurant/${row.id}?city=${encodeURIComponent(city)}`,
    };
  }
  if (row.type === "cuisine" || row.type === "category") {
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
    href: `/search?q=${encodeURIComponent(row.name)}&city=${encodeURIComponent(city)}`,
  };
}

/** Best single destination when user submits search. */
export function resolveHeroSearchTarget(
  query: string,
  city: HeroCity,
  results: HeroSearchResult[]
): string {
  const q = normalizeSearchQuery(query);
  if (!q) return `/order-online?city=${encodeURIComponent(city)}`;

  if (results.length === 1) return results[0].href;

  const exactRestaurant = results.find(
    (r) => r.type === "restaurant" && normalizeSearchQuery(r.name) === q
  );
  if (exactRestaurant) return exactRestaurant.href;

  const exactDish = results.find(
    (r) => r.type === "dish" && normalizeSearchQuery(r.name) === q
  );
  if (exactDish) return exactDish.href;

  const exactCategory = results.find(
    (r) => r.type === "category" && normalizeSearchQuery(r.name) === q
  );
  if (exactCategory) return exactCategory.href;

  return `/search?q=${encodeURIComponent(query.trim())}&city=${encodeURIComponent(city)}`;
}

export { getRestaurantCity };
