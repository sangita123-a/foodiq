import { SITE_CITY, SITE_KEYWORDS, SITE_NAME } from "./site";

function unique(values: string[]): string[] {
  return [...new Set(values.map((v) => v.trim()).filter(Boolean))];
}

export function restaurantKeywords(name: string, cuisine?: string | null): string[] {
  return unique([
    ...SITE_KEYWORDS,
    name,
    `${name} menu`,
    `${name} ${SITE_CITY}`,
    `${name} delivery`,
    `order from ${name}`,
    cuisine ? `${cuisine} ${SITE_CITY}` : "",
    `${SITE_NAME} restaurant`,
  ]);
}

export function categoryKeywords(name: string, slug: string): string[] {
  return unique([
    ...SITE_KEYWORDS,
    name,
    `${name} delivery`,
    `${name} ${SITE_CITY}`,
    `${name} online order`,
    `${slug} food`,
    `${SITE_NAME} ${name}`,
  ]);
}

export function collectionKeywords(title: string, slug: string): string[] {
  return unique([
    ...SITE_KEYWORDS,
    title,
    `${title} collection`,
    `${title} ${SITE_CITY}`,
    `${slug} food collection`,
    `${SITE_NAME} collections`,
  ]);
}

export function foodItemKeywords(
  name: string,
  restaurantName?: string | null,
  category?: string | null
): string[] {
  return unique([
    ...SITE_KEYWORDS,
    name,
    `${name} delivery`,
    `${name} ${SITE_CITY}`,
    restaurantName ? `${name} ${restaurantName}` : "",
    restaurantName ? `order ${name} from ${restaurantName}` : "",
    category ? `${category} ${SITE_CITY}` : "",
    `${SITE_NAME} food`,
  ]);
}

export function offerKeywords(title: string, offerId: string): string[] {
  return unique([
    ...SITE_KEYWORDS,
    title,
    `${title} offer`,
    `${title} coupon`,
    `${offerId} deal`,
    `${SITE_NAME} offers`,
    `food delivery offers ${SITE_CITY}`,
  ]);
}

export function cuisineKeywords(name: string, slug: string): string[] {
  return unique([
    ...SITE_KEYWORDS,
    name,
    `${name} cuisine`,
    `${name} restaurants ${SITE_CITY}`,
    `${slug} food delivery`,
    `${SITE_NAME} ${name}`,
  ]);
}
