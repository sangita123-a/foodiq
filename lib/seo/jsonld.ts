import {
  absoluteUrl,
  getApiBaseUrl,
  getSiteUrl,
  ORGANIZATION_SAME_AS,
  SITE_ADDRESS_COUNTRY,
  SITE_ADDRESS_REGION,
  SITE_CITY,
  SITE_DESCRIPTION,
  SITE_GEO_LATITUDE,
  SITE_GEO_LONGITUDE,
  SITE_NAME,
  SITE_POSTAL_CODE,
  SITE_STREET_ADDRESS,
  SITE_SUPPORT_EMAIL,
  SITE_SUPPORT_PHONE,
} from "./site";
import type { FaqEntry } from "./faq";
import { SEO_HUB_LINKS } from "./internal-links";
import {
  assertValidJsonLdSchemas,
  validateJsonLdSchemas,
  type SchemaValidationResult,
} from "./jsonld-validate";

type JsonLd = Record<string, unknown>;

function compact<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function logoImageObject() {
  return {
    "@type": "ImageObject",
    url: absoluteUrl("/icons/icon-512.png"),
    width: 512,
    height: 512,
  };
}

function postalAddress(streetAddress?: string | null) {
  return {
    "@type": "PostalAddress",
    streetAddress: streetAddress || SITE_STREET_ADDRESS,
    addressLocality: SITE_CITY,
    addressRegion: SITE_ADDRESS_REGION,
    postalCode: SITE_POSTAL_CODE,
    addressCountry: SITE_ADDRESS_COUNTRY,
  };
}

export function searchActionJsonLd(): JsonLd {
  return {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: `${absoluteUrl("/search")}?q={search_term_string}`,
    },
    "query-input": "required name=search_term_string",
  };
}

function buildAggregateRating(
  rating?: number | string | null,
  reviewCount?: number | string | null
): JsonLd | undefined {
  const ratingValue = rating != null ? Number(rating) : null;
  const count =
    reviewCount != null
      ? Number(reviewCount)
      : ratingValue != null
        ? 1
        : null;

  if (ratingValue == null || count == null || count <= 0 || Number.isNaN(ratingValue)) {
    return undefined;
  }

  return {
    "@type": "AggregateRating",
    ratingValue,
    reviewCount: count,
    bestRating: 5,
    worstRating: 1,
  };
}

function foodOffer(path: string, price?: number | string | null): JsonLd {
  const parsedPrice = price != null ? Number(price) : NaN;
  return compact({
    "@type": "Offer",
    price: Number.isFinite(parsedPrice) && parsedPrice >= 0 ? parsedPrice : 0,
    priceCurrency: "INR",
    availability: "https://schema.org/InStock",
    url: absoluteUrl(path),
    seller: {
      "@id": `${getSiteUrl()}/#organization`,
    },
  });
}

export function organizationJsonLd(): JsonLd {
  return compact({
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${absoluteUrl("/")}#organization`,
    name: SITE_NAME,
    url: absoluteUrl("/"),
    logo: logoImageObject(),
    image: absoluteUrl("/icons/og-default.png"),
    description: SITE_DESCRIPTION,
    email: SITE_SUPPORT_EMAIL,
    telephone: SITE_SUPPORT_PHONE,
    address: postalAddress(),
    sameAs: [...ORGANIZATION_SAME_AS],
    areaServed: {
      "@type": "City",
      name: SITE_CITY,
      containedInPlace: {
        "@type": "Country",
        name: "India",
      },
    },
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer support",
      telephone: SITE_SUPPORT_PHONE,
      email: SITE_SUPPORT_EMAIL,
      url: absoluteUrl("/contact"),
      availableLanguage: ["English", "Hindi"],
    },
  });
}

export function websiteJsonLd(): JsonLd {
  return compact({
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${absoluteUrl("/")}#website`,
    name: SITE_NAME,
    url: absoluteUrl("/"),
    description: SITE_DESCRIPTION,
    inLanguage: "en-IN",
    publisher: {
      "@id": `${absoluteUrl("/")}#organization`,
    },
    potentialAction: searchActionJsonLd(),
  });
}

export function localBusinessJsonLd(): JsonLd {
  return compact({
    "@context": "https://schema.org",
    "@type": ["LocalBusiness", "FoodEstablishment"],
    "@id": `${absoluteUrl("/")}#local-business`,
    name: SITE_NAME,
    url: absoluteUrl("/"),
    image: absoluteUrl("/icons/og-default.png"),
    logo: logoImageObject(),
    description: SITE_DESCRIPTION,
    telephone: SITE_SUPPORT_PHONE,
    email: SITE_SUPPORT_EMAIL,
    priceRange: "₹₹",
    servesCuisine: "Indian",
    address: postalAddress(),
    geo: {
      "@type": "GeoCoordinates",
      latitude: SITE_GEO_LATITUDE,
      longitude: SITE_GEO_LONGITUDE,
    },
    areaServed: {
      "@type": "City",
      name: SITE_CITY,
    },
    openingHoursSpecification: {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday",
      ],
      opens: "00:00",
      closes: "23:59",
    },
    parentOrganization: {
      "@id": `${absoluteUrl("/")}#organization`,
    },
  });
}

export function foodDeliveryServiceJsonLd(): JsonLd {
  return compact({
    "@context": "https://schema.org",
    "@type": "FoodDeliveryService",
    "@id": `${absoluteUrl("/")}#food-delivery`,
    name: `${SITE_NAME} Food Delivery`,
    url: absoluteUrl("/"),
    description: SITE_DESCRIPTION,
    provider: {
      "@id": `${absoluteUrl("/")}#organization`,
    },
    areaServed: {
      "@type": "City",
      name: SITE_CITY,
    },
    serviceType: "Online food delivery",
    availableChannel: {
      "@type": "ServiceChannel",
      serviceUrl: absoluteUrl("/order-online"),
      serviceType: "Online ordering",
    },
  });
}

export function faqJsonLd(faqs: FaqEntry[]): JsonLd {
  return compact({
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  });
}

export function breadcrumbJsonLd(
  items: Array<{ name: string; path: string }>
): JsonLd {
  return compact({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  });
}

/** Site-wide primary navigation hubs for crawlers (mirrors sr-only internal links). */
export function siteNavigationJsonLd(): JsonLd {
  return compact({
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `${SITE_NAME} site navigation`,
    numberOfItems: SEO_HUB_LINKS.length,
    itemListElement: SEO_HUB_LINKS.map((link, index) => ({
      "@type": "SiteNavigationElement",
      position: index + 1,
      name: link.anchor,
      url: absoluteUrl(link.href),
    })),
  });
}

/** Home → page breadcrumb for static public landing routes. */
export function publicPageBreadcrumbJsonLd(pageName: string, path: string): JsonLd {
  return breadcrumbJsonLd([
    { name: "Home", path: "/" },
    { name: pageName, path },
  ]);
}

export function restaurantListJsonLd(
  restaurants: Array<{ id: string; name: string; image_url?: string | null }>
): JsonLd {
  return compact({
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `Restaurants on ${SITE_NAME}`,
    url: absoluteUrl("/order-online"),
    numberOfItems: restaurants.length,
    itemListElement: restaurants.slice(0, 50).map((restaurant, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: restaurant.name,
      url: absoluteUrl(`/restaurant/${restaurant.id}`),
      image: restaurant.image_url || absoluteUrl("/icons/og-default.png"),
    })),
  });
}

export function restaurantJsonLd(restaurant: {
  id: string;
  name: string;
  description?: string | null;
  image_url?: string | null;
  address?: string | null;
  phone?: string | null;
  rating?: number | string | null;
  review_count?: number | string | null;
  estimated_delivery_time?: number | string | null;
  price_range?: number | string | null;
}): JsonLd {
  const path = `/restaurant/${restaurant.id}`;
  const aggregateRating = buildAggregateRating(
    restaurant.rating,
    restaurant.review_count
  );

  return compact({
    "@context": "https://schema.org",
    "@type": ["Restaurant", "LocalBusiness", "FoodEstablishment"],
    "@id": absoluteUrl(path),
    name: restaurant.name,
    description:
      restaurant.description ||
      `Order from ${restaurant.name} on ${SITE_NAME}.`,
    image: restaurant.image_url || absoluteUrl("/icons/og-default.png"),
    url: absoluteUrl(path),
    telephone: restaurant.phone || undefined,
    priceRange:
      restaurant.price_range != null
        ? "₹".repeat(Math.min(Math.max(Number(restaurant.price_range), 1), 4))
        : "₹₹",
    address: postalAddress(restaurant.address),
    aggregateRating,
    servesCuisine: "Multi-cuisine",
    hasMenu: absoluteUrl(path),
  });
}

export function foodMenuJsonLd(
  restaurant: { id: string; name: string },
  items: Array<{
    id?: string;
    name: string;
    description?: string | null;
    price?: number | string | null;
    image_url?: string | null;
  }>
): JsonLd {
  return compact({
    "@context": "https://schema.org",
    "@type": "Menu",
    name: `${restaurant.name} Menu`,
    url: absoluteUrl(`/restaurant/${restaurant.id}`),
    inLanguage: "en-IN",
    hasMenuSection: [
      {
        "@type": "MenuSection",
        name: "Full Menu",
        hasMenuItem: items.slice(0, 50).map((item) => ({
          "@type": "MenuItem",
          name: item.name,
          description: item.description || undefined,
          image: item.image_url || undefined,
          url: item.id ? absoluteUrl(`/food/${item.id}`) : undefined,
          offers: item.id
            ? foodOffer(`/food/${item.id}`, item.price)
            : foodOffer(`/restaurant/${restaurant.id}`, item.price),
        })),
      },
    ],
  });
}

/** Schema.org MenuItem structured data for individual food/dish pages. */
export function foodItemJsonLd(item: {
  id: string;
  name: string;
  description?: string | null;
  price?: number | string | null;
  image?: string | null;
  image_url?: string | null;
  restaurant_id?: string | null;
  restaurant_name?: string | null;
  rating?: number | string | null;
  review_count?: number | string | null;
}): JsonLd {
  const path = `/food/${item.id}`;
  const image = item.image || item.image_url || absoluteUrl("/icons/og-default.png");
  const aggregateRating = buildAggregateRating(item.rating, item.review_count);
  const resolvedImage = image.startsWith("http") ? image : absoluteUrl(image);

  return compact({
    "@context": "https://schema.org",
    "@type": "MenuItem",
    "@id": absoluteUrl(path),
    name: item.name,
    description: item.description || `Order ${item.name} on ${SITE_NAME}.`,
    image: resolvedImage,
    url: absoluteUrl(path),
    offers: foodOffer(path, item.price),
    aggregateRating,
    provider: item.restaurant_name
      ? {
          "@type": "Restaurant",
          name: item.restaurant_name,
          url: item.restaurant_id
            ? absoluteUrl(`/restaurant/${item.restaurant_id}`)
            : undefined,
        }
      : undefined,
  });
}

export function menuItemJsonLd(item: {
  id: string;
  name: string;
  description?: string | null;
  price?: number | string | null;
  image_url?: string | null;
  restaurant_id?: string | null;
  restaurant_name?: string | null;
  rating?: number | string | null;
  review_count?: number | string | null;
}): JsonLd {
  return foodItemJsonLd(item);
}

export function productJsonLd(item: {
  id: string;
  name: string;
  description?: string | null;
  price?: number | string | null;
  image?: string | null;
  image_url?: string | null;
  restaurant_name?: string | null;
  rating?: number | string | null;
  review_count?: number | string | null;
}): JsonLd {
  const path = `/food/${item.id}`;
  const image = item.image || item.image_url || absoluteUrl("/icons/og-default.png");
  const aggregateRating = buildAggregateRating(item.rating, item.review_count);
  const resolvedImage = image.startsWith("http") ? image : absoluteUrl(image);

  return compact({
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `${absoluteUrl(path)}#product`,
    name: item.name,
    sku: item.id,
    category: "Food & Beverage",
    description:
      item.description || `Order ${item.name} online on ${SITE_NAME}.`,
    image: resolvedImage,
    url: absoluteUrl(path),
    brand: item.restaurant_name
      ? { "@type": "Brand", name: item.restaurant_name }
      : { "@type": "Brand", name: SITE_NAME },
    offers: foodOffer(path, item.price),
    aggregateRating,
  });
}

/** Validates all required Schema.org JSON-LD builders used across the site. */
export function validateSampleJsonLdSchemas(): SchemaValidationResult[] {
  const website = websiteJsonLd();
  const nestedSearchAction =
    typeof website.potentialAction === "object" && website.potentialAction !== null
      ? (website.potentialAction as JsonLd)
      : {};

  return validateJsonLdSchemas({
    organization: organizationJsonLd(),
    website,
    localBusiness: localBusinessJsonLd(),
    restaurant: restaurantJsonLd({
      id: "rest-pizza",
      name: "Pizza Italia Oven",
      description: "Wood-fired pizzas and Italian favorites.",
      image_url: absoluteUrl("/default-restaurant.webp"),
      address: "Jubilee Hills, Hyderabad",
      phone: SITE_SUPPORT_PHONE,
      rating: 4.9,
      review_count: 1280,
      price_range: 2,
    }),
    breadcrumb: breadcrumbJsonLd([
      { name: "Home", path: "/" },
      { name: "Restaurants", path: "/order-online" },
      { name: "Pizza Italia Oven", path: "/restaurant/rest-pizza" },
    ]),
    searchAction: nestedSearchAction,
    product: productJsonLd({
      id: "dish_pizza_1",
      name: "Margherita Pizza",
      description: "Classic cheese pizza with fresh basil.",
      price: 299,
      image: absoluteUrl("/default-food.webp"),
      restaurant_name: "Pizza Italia Oven",
      rating: 4.8,
      review_count: 420,
    }),
  });
}

export function ensureValidSampleJsonLdSchemas(): void {
  assertValidJsonLdSchemas(validateSampleJsonLdSchemas());
}

export { assertValidJsonLdSchemas, validateJsonLdSchemas };
export type { SchemaValidationResult };

/** Lightweight server fetch for SEO metadata (never throws). */
export async function fetchApiJson<T = unknown>(
  path: string,
  revalidateSeconds = 300
): Promise<T | null> {
  return fetchApiJsonWithTimeout<T>(path, 15000, revalidateSeconds);
}

/** Same as fetchApiJson but with an explicit timeout (for sitemap generation). */
export async function fetchApiJsonWithTimeout<T = unknown>(
  path: string,
  timeoutMs = 8000,
  revalidateSeconds = 300
): Promise<T | null> {
  const base = getApiBaseUrl();
  if (!base) return null;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(`${base}${path.startsWith("/") ? path : `/${path}`}`, {
      next: { revalidate: revalidateSeconds },
      headers: { Accept: "application/json" },
      signal: controller.signal,
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export type ApiEnvelope<T> = {
  success?: boolean;
  data?: T;
  message?: string;
};
