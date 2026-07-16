export const CUISINE_SLUGS = [
  "chinese",
  "desserts",
  "fast-food",
  "burger",
  "healthy",
  "italian",
  "indian",
  "pizza",
  "biryani",
  "south-indian",
  "north-indian",
  "mexican",
  "street-food",
  "seafood",
  "bakery",
  "beverages",
] as const;

export type CuisineSlug = (typeof CUISINE_SLUGS)[number];

export function isValidCuisineSlug(slug: string): slug is CuisineSlug {
  return (CUISINE_SLUGS as readonly string[]).includes(slug);
}
