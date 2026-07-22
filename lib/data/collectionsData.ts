import {
  POPULAR_RESTAURANTS_30,
  TRENDING_DISHES_60,
  type Dish60,
  type Restaurant30,
} from "@/lib/data/30restaurantsData";

export interface CollectionMeta {
  slug: string;
  emoji: string;
  title: string;
  description: string;
  itemCount: string;
  coverImage: string;
  bannerImage: string;
}

export interface CollectionDishItem {
  id: string;
  name: string;
  collection: string;
  restaurantName: string;
  restaurantId: string;
  price: number;
  originalPrice: number;
  rating: string;
  deliveryTime: string;
  isVeg: boolean;
  image: string;
  description: string;
}

export const COLLECTION_SLUGS = [
  "most-loved",
  "express-delivery",
  "family-feast",
  "late-night",
  "meals-under-199",
  "weekend-specials",
] as const;

export type CollectionSlug = (typeof COLLECTION_SLUGS)[number];

export const FEATURED_COLLECTIONS: CollectionMeta[] = [
  {
    slug: "most-loved",
    emoji: "❤️",
    title: "Most Loved Near You",
    description: "The highest-rated restaurants loved by thousands of customers.",
    itemCount: "120+ Restaurants",
    coverImage: "/images/catalog/restaurants/rest-north-indian.jpg",
    bannerImage: "/images/catalog/restaurants/rest-pizza.jpg",
  },
  {
    slug: "express-delivery",
    emoji: "⚡",
    title: "15-Min Express Delivery",
    description: "Fresh food delivered in 15 minutes or less.",
    itemCount: "85+ Restaurants",
    coverImage: "/images/catalog/restaurants/rest-fast-food.jpg",
    bannerImage: "/images/catalog/restaurants/rest-cold-drinks.jpg",
  },
  {
    slug: "family-feast",
    emoji: "👨‍👩‍👧",
    title: "Family Feast",
    description: "Perfect meal combos for families and groups.",
    itemCount: "60+ Combos",
    coverImage: "/images/catalog/dishes/biryani/family-biryani-feast.webp",
    bannerImage: "/images/catalog/restaurants/rest-biryani.jpg",
  },
  {
    slug: "late-night",
    emoji: "🌙",
    title: "Late Night Cravings",
    description: "Restaurants open late for midnight hunger.",
    itemCount: "70+ Spots",
    coverImage: "/images/catalog/restaurants/rest-street-food.jpg",
    bannerImage: "/images/catalog/restaurants/rest-bbq.jpg",
  },
  {
    slug: "meals-under-199",
    emoji: "💰",
    title: "Meals Under ₹199",
    description: "Delicious meals at pocket-friendly prices.",
    itemCount: "150+ Meals",
    coverImage: "/images/catalog/restaurants/rest-salads.jpg",
    bannerImage: "/images/catalog/restaurants/rest-healthy.jpg",
  },
  {
    slug: "weekend-specials",
    emoji: "🎉",
    title: "Weekend Specials",
    description: "Exclusive weekend discounts and chef specials.",
    itemCount: "90+ Offers",
    coverImage: "/images/catalog/dishes/desserts/assorted-pastries.webp",
    bannerImage: "/images/catalog/restaurants/rest-desserts.jpg",
  },
];

function getRestaurant(restaurantId: string): Restaurant30 {
  return (
    POPULAR_RESTAURANTS_30.find((r) => r.id === restaurantId) ??
    POPULAR_RESTAURANTS_30[0]
  );
}

function parseMaxDeliveryMinutes(time: string): number {
  const match = time.match(/(\d+)\s*-\s*(\d+)/);
  if (match) return Number(match[2]);
  const single = time.match(/(\d+)/);
  return single ? Number(single[1]) : 30;
}

function toCollectionItem(
  slug: CollectionSlug,
  dish: Dish60,
  restaurant: Restaurant30,
  index: number
): CollectionDishItem {
  return {
    id: `coll_${slug.replace(/-/g, "_")}_${index + 1}`,
    name: restaurant.name,
    collection: slug,
    restaurantName: restaurant.name,
    restaurantId: restaurant.id,
    price: dish.price,
    originalPrice: dish.originalPrice ?? Math.round(dish.price * 1.3),
    rating: restaurant.rating,
    deliveryTime: restaurant.time,
    isVeg: dish.isVeg,
    image: dish.image,
    description: `${dish.name} · ${restaurant.cuisine}`,
  };
}

function buildFromDishes(
  slug: CollectionSlug,
  dishes: Dish60[],
  minCount = 22
): CollectionDishItem[] {
  const items: CollectionDishItem[] = [];
  let pool = [...dishes];
  if (pool.length === 0) pool = [...TRENDING_DISHES_60];

  let index = 0;
  while (items.length < minCount) {
    const dish = pool[index % pool.length];
    const restaurant = getRestaurant(dish.restaurantId);
    items.push(toCollectionItem(slug, dish, restaurant, index));
    index += 1;
  }
  return items;
}

function buildMostLoved(): CollectionDishItem[] {
  const restaurants = [...POPULAR_RESTAURANTS_30].sort(
    (a, b) =>
      Number(b.rating) - Number(a.rating) || b.reviewsCount - a.reviewsCount
  );
  const dishes: Dish60[] = [];
  restaurants.forEach((restaurant) => {
    const restDishes = TRENDING_DISHES_60.filter(
      (d) => d.restaurantId === restaurant.id
    );
    dishes.push(...(restDishes.length ? restDishes : TRENDING_DISHES_60.slice(0, 2)));
  });
  return buildFromDishes("most-loved", dishes);
}

function buildExpressDelivery(): CollectionDishItem[] {
  const fastRestaurants = POPULAR_RESTAURANTS_30.filter(
    (r) => parseMaxDeliveryMinutes(r.time) <= 20
  );
  const dishes = TRENDING_DISHES_60.filter((d) =>
    fastRestaurants.some((r) => r.id === d.restaurantId)
  );
  return buildFromDishes("express-delivery", dishes);
}

function buildFamilyFeast(): CollectionDishItem[] {
  const familyIds = new Set(
    POPULAR_RESTAURANTS_30.filter((r) =>
      /biryani|thali|north indian|bbq|seafood/i.test(
        `${r.category} ${r.cuisine} ${r.name}`
      )
    ).map((r) => r.id)
  );
  const dishes = TRENDING_DISHES_60.filter(
    (d) =>
      familyIds.has(d.restaurantId) ||
      /biryani|thali|family|combo|feast/i.test(d.name)
  );
  return buildFromDishes("family-feast", dishes);
}

function buildLateNight(): CollectionDishItem[] {
  const lateIds = new Set(
    POPULAR_RESTAURANTS_30.filter((r) =>
      /street|fast|bbq|shawarma|momos|burger|pizza|snacks|rolls/i.test(
        `${r.category} ${r.cuisine}`
      )
    ).map((r) => r.id)
  );
  const dishes = TRENDING_DISHES_60.filter((d) => lateIds.has(d.restaurantId));
  return buildFromDishes("late-night", dishes);
}

function buildMealsUnder199(): CollectionDishItem[] {
  const dishes = TRENDING_DISHES_60.filter((d) => d.price < 199);
  return buildFromDishes("meals-under-199", dishes);
}

function buildWeekendSpecials(): CollectionDishItem[] {
  const offerIds = new Set(
    POPULAR_RESTAURANTS_30.filter((r) => Boolean(r.offer)).map((r) => r.id)
  );
  const dishes = TRENDING_DISHES_60.filter((d) => offerIds.has(d.restaurantId));
  return buildFromDishes("weekend-specials", dishes);
}

export const COLLECTION_DISHES: Record<CollectionSlug, CollectionDishItem[]> = {
  "most-loved": buildMostLoved(),
  "express-delivery": buildExpressDelivery(),
  "family-feast": buildFamilyFeast(),
  "late-night": buildLateNight(),
  "meals-under-199": buildMealsUnder199(),
  "weekend-specials": buildWeekendSpecials(),
};

const ALL_COLLECTION_DISHES = Object.values(COLLECTION_DISHES).flat();
const DISH_BY_ID = new Map(ALL_COLLECTION_DISHES.map((dish) => [dish.id, dish]));

/** Featured dish metadata keyed by collection item id (for cart / quick view). */
const FEATURED_DISH_BY_ITEM_ID = new Map<string, Dish60>();

function indexFeaturedDishes() {
  (Object.keys(COLLECTION_DISHES) as CollectionSlug[]).forEach((slug) => {
    const sourcePools: Record<CollectionSlug, Dish60[]> = {
      "most-loved": TRENDING_DISHES_60,
      "express-delivery": TRENDING_DISHES_60.filter((d) =>
        POPULAR_RESTAURANTS_30.some(
          (r) => r.id === d.restaurantId && parseMaxDeliveryMinutes(r.time) <= 20
        )
      ),
      "family-feast": TRENDING_DISHES_60.filter((d) =>
        /biryani|thali|family|combo|feast/i.test(d.name)
      ),
      "late-night": TRENDING_DISHES_60,
      "meals-under-199": TRENDING_DISHES_60.filter((d) => d.price < 199),
      "weekend-specials": TRENDING_DISHES_60,
    };

    COLLECTION_DISHES[slug].forEach((item, index) => {
      const pool = sourcePools[slug].length ? sourcePools[slug] : TRENDING_DISHES_60;
      const byRestaurant = pool.find((d) => d.restaurantId === item.restaurantId);
      FEATURED_DISH_BY_ITEM_ID.set(item.id, byRestaurant ?? pool[index % pool.length]);
    });
  });
}

indexFeaturedDishes();

export function getCollectionFeaturedDish(itemId: string): Dish60 | undefined {
  return FEATURED_DISH_BY_ITEM_ID.get(itemId);
}

export function isCollectionSlug(slug: string): slug is CollectionSlug {
  return (COLLECTION_SLUGS as readonly string[]).includes(slug);
}

export function getCollectionBySlug(slug: string): CollectionMeta | undefined {
  return FEATURED_COLLECTIONS.find((c) => c.slug === slug);
}

export function getCollectionDishes(slug: string): CollectionDishItem[] {
  if (!isCollectionSlug(slug)) return [];
  return COLLECTION_DISHES[slug];
}

export function getCollectionDishById(id: string): CollectionDishItem | undefined {
  const item = DISH_BY_ID.get(id);
  if (!item) return undefined;

  const featured = getCollectionFeaturedDish(id);
  if (!featured) return item;

  return {
    ...item,
    price: featured.price,
    originalPrice: featured.originalPrice ?? Math.round(featured.price * 1.3),
    isVeg: featured.isVeg,
    description: featured.description,
  };
}

export function isCollectionDishId(id: string): boolean {
  return DISH_BY_ID.has(id);
}

export function getCollectionDishImage(id: string): string {
  const featured = getCollectionFeaturedDish(id);
  return featured?.image ?? getCollectionDishById(id)?.image ?? "";
}
