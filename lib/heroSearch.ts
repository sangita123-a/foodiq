import { CATEGORIES } from "@/lib/data/categoryData";
import { FEATURED_COLLECTIONS } from "@/lib/data/collectionsData";
import { POPULAR_RESTAURANTS_30, TRENDING_DISHES_60 } from "@/lib/data/30restaurantsData";
import { type HeroCity, getRestaurantCity, restaurantMatchesCity } from "@/lib/heroLocation";

export type HeroSearchResult = {
  type: "restaurant" | "dish" | "category" | "collection";
  id: string;
  name: string;
  subtitle?: string;
  href: string;
};

export function normalizeSearchQuery(raw: string): string {
  return raw.trim().replace(/\s+/g, " ").toLowerCase();
}

function matchesQuery(text: string, query: string): boolean {
  return normalizeSearchQuery(text).includes(query);
}

export function searchHeroCatalog(query: string, city: HeroCity): HeroSearchResult[] {
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

  for (const restaurant of POPULAR_RESTAURANTS_30) {
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

  for (const dish of TRENDING_DISHES_60) {
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

  for (const category of CATEGORIES) {
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

  for (const collection of FEATURED_COLLECTIONS) {
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

export function mapApiSuggestion(
  row: { type: string; id: string; name: string; subtitle?: string },
  city: HeroCity
): HeroSearchResult | null {
  if (row.type === "restaurant" && !restaurantMatchesCity(row.id, city)) {
    return null;
  }
  if (row.type === "menu_item" || row.type === "dish") {
    const dish = TRENDING_DISHES_60.find((d) => d.id === row.id);
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
  if (!q) return `/restaurants?city=${encodeURIComponent(city)}`;

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
