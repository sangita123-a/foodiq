import { buildPageMetadata } from "@/lib/seo/metadata";

/** Static public route SEO copy (titles/descriptions). */
export const PUBLIC_PAGE_SEO = {
  home: {
    title: "Foodiq - Restaurant Ordering Platform",
    description:
      "Discover amazing restaurants and delicious food delivered straight to your doorstep. Browse menus, trending dishes, and exclusive offers on Foodiq.",
    path: "/",
  },
  restaurants: {
    title: "Restaurants Near You",
    description:
      "Browse restaurants on Foodiq. Explore menus, ratings, delivery times, and order your favorites online.",
    path: "/restaurants",
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
  about: {
    title: "About Foodiq",
    description:
      "Learn about Foodiq — the restaurant ordering platform helping you discover and order delicious food.",
    path: "/about",
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

export function publicMetadata(
  key: keyof typeof PUBLIC_PAGE_SEO
) {
  const seo = PUBLIC_PAGE_SEO[key];
  return buildPageMetadata({
    title: seo.title,
    description: seo.description,
    path: seo.path,
    noIndex: "noIndex" in seo ? Boolean(seo.noIndex) : false,
  });
}
