import {
  absoluteUrl,
  getApiBaseUrl,
  SITE_CITY,
  SITE_DESCRIPTION,
  SITE_NAME,
} from "./site";
import type { FaqEntry } from "./faq";

type JsonLd = Record<string, unknown>;

export function organizationJsonLd(): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${absoluteUrl("/")}#organization`,
    name: SITE_NAME,
    url: absoluteUrl("/"),
    logo: absoluteUrl("/icons/icon-512.png"),
    description: SITE_DESCRIPTION,
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
      url: absoluteUrl("/contact"),
      availableLanguage: ["English", "Hindi"],
    },
  };
}

export function websiteJsonLd(): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${absoluteUrl("/")}#website`,
    name: SITE_NAME,
    url: absoluteUrl("/"),
    description: SITE_DESCRIPTION,
    publisher: {
      "@id": `${absoluteUrl("/")}#organization`,
    },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${absoluteUrl("/search")}?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

export function foodDeliveryServiceJsonLd(): JsonLd {
  return {
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
  };
}

export function faqJsonLd(faqs: FaqEntry[]): JsonLd {
  return {
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
  };
}

export function breadcrumbJsonLd(
  items: Array<{ name: string; path: string }>
): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function restaurantListJsonLd(
  restaurants: Array<{ id: string; name: string; image_url?: string | null }>
): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `Restaurants on ${SITE_NAME}`,
    url: absoluteUrl("/restaurants"),
    numberOfItems: restaurants.length,
    itemListElement: restaurants.slice(0, 50).map((restaurant, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: restaurant.name,
      url: absoluteUrl(`/restaurant/${restaurant.id}`),
      image: restaurant.image_url || absoluteUrl("/icons/og-default.png"),
    })),
  };
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
}): JsonLd {
  const path = `/restaurant/${restaurant.id}`;
  const ratingValue =
    restaurant.rating != null ? Number(restaurant.rating) : null;
  const reviewCount =
    restaurant.review_count != null
      ? Number(restaurant.review_count)
      : ratingValue != null
        ? 1
        : null;

  return {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    "@id": absoluteUrl(path),
    name: restaurant.name,
    description:
      restaurant.description ||
      `Order from ${restaurant.name} on ${SITE_NAME}.`,
    image: restaurant.image_url || absoluteUrl("/icons/og-default.png"),
    url: absoluteUrl(path),
    telephone: restaurant.phone || undefined,
    address: restaurant.address
      ? {
          "@type": "PostalAddress",
          streetAddress: restaurant.address,
          addressLocality: SITE_CITY,
          addressCountry: "IN",
        }
      : {
          "@type": "PostalAddress",
          addressLocality: SITE_CITY,
          addressCountry: "IN",
        },
    aggregateRating:
      ratingValue != null && reviewCount != null && reviewCount > 0
        ? {
            "@type": "AggregateRating",
            ratingValue,
            reviewCount,
            bestRating: 5,
            worstRating: 1,
          }
        : undefined,
    servesCuisine: "Multi-cuisine",
  };
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
  return {
    "@context": "https://schema.org",
    "@type": "Menu",
    name: `${restaurant.name} Menu`,
    url: absoluteUrl(`/restaurant/${restaurant.id}`),
    hasMenuSection: {
      "@type": "MenuSection",
      name: "Full Menu",
      hasMenuItem: items.slice(0, 50).map((item) => ({
        "@type": "MenuItem",
        name: item.name,
        description: item.description || undefined,
        image: item.image_url || undefined,
        offers: {
          "@type": "Offer",
          price: item.price != null ? Number(item.price) : undefined,
          priceCurrency: "INR",
          url: item.id ? absoluteUrl(`/food/${item.id}`) : undefined,
          availability: "https://schema.org/InStock",
        },
      })),
    },
  };
}

export function menuItemJsonLd(item: {
  id: string;
  name: string;
  description?: string | null;
  price?: number | string | null;
  image_url?: string | null;
  restaurant_id?: string | null;
  restaurant_name?: string | null;
}): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "MenuItem",
    "@id": absoluteUrl(`/food/${item.id}`),
    name: item.name,
    description: item.description || `Order ${item.name} on ${SITE_NAME}.`,
    image: item.image_url || absoluteUrl("/icons/og-default.png"),
    url: absoluteUrl(`/food/${item.id}`),
    offers: {
      "@type": "Offer",
      price: item.price != null ? Number(item.price) : undefined,
      priceCurrency: "INR",
      availability: "https://schema.org/InStock",
      url: absoluteUrl(`/food/${item.id}`),
    },
    menuAddOn: item.restaurant_name
      ? {
          "@type": "Restaurant",
          name: item.restaurant_name,
          url: item.restaurant_id
            ? absoluteUrl(`/restaurant/${item.restaurant_id}`)
            : undefined,
        }
      : undefined,
  };
}

export function productJsonLd(item: {
  id: string;
  name: string;
  description?: string | null;
  price?: number | string | null;
  image?: string | null;
  image_url?: string | null;
  restaurant_name?: string | null;
}): JsonLd {
  const image = item.image || item.image_url || absoluteUrl("/icons/og-default.png");
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `${absoluteUrl(`/food/${item.id}`)}#product`,
    name: item.name,
    description:
      item.description || `Order ${item.name} online on ${SITE_NAME}.`,
    image,
    url: absoluteUrl(`/food/${item.id}`),
    brand: item.restaurant_name
      ? { "@type": "Brand", name: item.restaurant_name }
      : { "@type": "Brand", name: SITE_NAME },
    offers: {
      "@type": "Offer",
      price: item.price != null ? Number(item.price) : undefined,
      priceCurrency: "INR",
      availability: "https://schema.org/InStock",
      url: absoluteUrl(`/food/${item.id}`),
    },
  };
}

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
