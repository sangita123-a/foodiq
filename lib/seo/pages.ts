import { buildPageMetadata } from "@/lib/seo/metadata";
import { SITE_KEYWORDS, SITE_OG_TITLE } from "@/lib/seo/site";

/** Static public route SEO copy (titles/descriptions). */
export const PUBLIC_PAGE_SEO = {
  home: {
    title: SITE_OG_TITLE,
    description:
      "Order delicious food from top restaurants with fast delivery, exciting offers, and premium dining experience.",
    path: "/",
    keywords: SITE_KEYWORDS,
  },
  restaurants: {
    title: "Restaurants Near You",
    description:
      "Browse restaurants on Foodiq. Explore menus, ratings, delivery times, and order your favorites online in Hyderabad.",
    path: "/restaurants",
    keywords: [...SITE_KEYWORDS, "Foodiq Restaurant", "restaurants Hyderabad"],
  },
  popularRestaurants: {
    title: "Popular Restaurants",
    description:
      "See the most popular restaurants on Foodiq. Top-rated places loved by food lovers near you.",
    path: "/popular-restaurants",
  },
  popularCuisines: {
    title: "Popular Cuisines",
    description:
      "Explore popular cuisines on Foodiq — Indian, Chinese, Italian, pizza, biryani, desserts, and more.",
    path: "/popular-cuisines",
  },
  trendingDishes: {
    title: "Trending Dishes",
    description:
      "Discover trending dishes on Foodiq. Order the most popular meals people are craving right now.",
    path: "/trending-dishes",
  },
  offers: {
    title: "Offers & Deals",
    description:
      "Save with Foodiq offers and deals. Exclusive restaurant discounts and food delivery promotions.",
    path: "/offers",
  },
  collections: {
    title: "Food Collections",
    description:
      "Browse curated food collections on Foodiq — handpicked restaurants and dishes for every craving.",
    path: "/collections",
  },
  search: {
    title: "Search Food & Restaurants",
    description:
      "Search restaurants and dishes on Foodiq. Find meals, cuisines, and places to order from quickly.",
    path: "/search",
  },
  orderOnline: {
    title: "Order Food Online",
    description:
      "Order food online from top restaurants on Foodiq. Fast delivery, live tracking, and exclusive offers in Hyderabad.",
    path: "/order-online",
    keywords: [...SITE_KEYWORDS, "Foodiq Online Food Delivery", "order food online Hyderabad"],
  },
  liveCricket: {
    title: "Live Cricket & Match Day Food",
    description:
      "Watch live cricket with real-time scores on Foodiq and order match day food combos delivered fast.",
    path: "/live-cricket",
    noIndex: false,
  },
  about: {
    title: "About Foodiq",
    description:
      "Learn about Foodiq — the official online food delivery platform helping you discover and order delicious food in Hyderabad.",
    path: "/about",
    keywords: [...SITE_KEYWORDS, "Foodiq Official Website"],
  },
  contact: {
    title: "Contact Us",
    description:
      "Contact Foodiq support. We're here to help with orders, restaurants, and account questions.",
    path: "/contact",
  },
  helpSupport: {
    title: "Help & Support",
    description:
      "Get help with Foodiq orders, deliveries, payments, and account issues. Find answers and contact support.",
    path: "/help-support",
  },
  privacy: {
    title: "Privacy Policy",
    description:
      "Read the Foodiq Privacy Policy to understand how we collect, use, and protect your personal information.",
    path: "/privacy-policy",
  },
  terms: {
    title: "Terms of Service",
    description:
      "Read the Foodiq Terms of Service governing use of our restaurant ordering platform and services.",
    path: "/terms-of-service",
  },
  login: {
    title: "Log In",
    description: "Log in to your Foodiq account to order food, track deliveries, and manage favorites.",
    path: "/login",
    noIndex: true,
  },
  register: {
    title: "Create Account",
    description: "Create a Foodiq account to order from restaurants and unlock offers and rewards.",
    path: "/register",
    noIndex: true,
  },
  forgotPassword: {
    title: "Forgot Password",
    description: "Reset your Foodiq account password securely.",
    path: "/forgot-password",
    noIndex: true,
  },
} as const;

export function publicMetadata(key: keyof typeof PUBLIC_PAGE_SEO) {
  const seo = PUBLIC_PAGE_SEO[key];
  return buildPageMetadata({
    title: seo.title,
    description: seo.description,
    path: seo.path,
    keywords: "keywords" in seo ? [...seo.keywords] : undefined,
    noIndex: "noIndex" in seo ? Boolean(seo.noIndex) : false,
    socialTitle: seo.path === "/" ? seo.title : undefined,
    socialDescription: seo.path === "/" ? seo.description : undefined,
  });
}
