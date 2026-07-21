/**
 * Canonical hub routes and descriptive anchor text for internal SEO linking.
 * Used by sr-only navigation and SiteNavigationElement JSON-LD (no visible UI).
 */
import { CANONICAL_PATHS } from "./urls";

export type InternalLink = {
  href: string;
  anchor: string;
};

export type InternalLinkPage =
  | "home"
  | "restaurants"
  | "categories"
  | "categoryDetail"
  | "trendingDishes"
  | "offers"
  | "contact";

/** Primary hub destinations with keyword-rich anchor text. */
export const SEO_HUB_LINKS: InternalLink[] = [
  {
    href: CANONICAL_PATHS.home,
    anchor: "Foodiq home — order food online in Hyderabad",
  },
  {
    href: CANONICAL_PATHS.orderOnline,
    anchor: "Browse restaurants for online food delivery",
  },
  {
    href: CANONICAL_PATHS.popularCuisines,
    anchor: "Explore food categories and cuisines",
  },
  {
    href: CANONICAL_PATHS.trendingDishes,
    anchor: "Discover trending dishes near you",
  },
  {
    href: CANONICAL_PATHS.offers,
    anchor: "Food delivery offers and discount deals",
  },
  {
    href: CANONICAL_PATHS.contact,
    anchor: "Contact Foodiq customer support",
  },
];

const PAGE_EXCLUDED_HREFS: Record<InternalLinkPage, string[]> = {
  home: [CANONICAL_PATHS.home],
  restaurants: [CANONICAL_PATHS.orderOnline],
  categories: [CANONICAL_PATHS.popularCuisines],
  categoryDetail: [CANONICAL_PATHS.popularCuisines],
  trendingDishes: [CANONICAL_PATHS.trendingDishes],
  offers: [CANONICAL_PATHS.offers],
  contact: [CANONICAL_PATHS.contact],
};

/** Contextual cross-links for a hub page (excludes the current page). */
export function getContextualInternalLinks(page: InternalLinkPage): InternalLink[] {
  const excluded = new Set(PAGE_EXCLUDED_HREFS[page]);
  return SEO_HUB_LINKS.filter((link) => !excluded.has(link.href));
}

/** Nav aria-label per hub page. */
export function getInternalLinksNavLabel(page: InternalLinkPage): string {
  const labels: Record<InternalLinkPage, string> = {
    home: "Explore Foodiq food delivery",
    restaurants: "More ways to order on Foodiq",
    categories: "Related Foodiq pages",
    categoryDetail: "Related Foodiq pages",
    trendingDishes: "More from Foodiq",
    offers: "Save more on Foodiq",
    contact: "Explore Foodiq while you reach us",
  };
  return labels[page];
}
