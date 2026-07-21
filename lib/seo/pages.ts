import { buildPageMetadata } from "@/lib/seo/metadata";
import { SITE_KEYWORDS, SITE_NAME, SITE_OG_TITLE } from "@/lib/seo/site";

type PageSeoEntry = {
  title: string;
  description: string;
  path: string;
  keywords?: readonly string[];
  noIndex?: boolean;
  socialTitle?: string;
  socialDescription?: string;
};

/** Static public route SEO copy (titles, descriptions, and social previews). */
export const PUBLIC_PAGE_SEO = {
  home: {
    title: SITE_OG_TITLE,
    description:
      "Order delicious food from top restaurants with fast delivery, exciting offers, and premium dining experience.",
    path: "/",
    keywords: SITE_KEYWORDS,
    socialTitle: SITE_OG_TITLE,
    socialDescription:
      "Order delicious food from top restaurants with fast delivery, exciting offers, and premium dining experience.",
  },
  popularCuisines: {
    title: "Popular Cuisines",
    description:
      "Explore popular cuisines on Foodiq — Indian, Chinese, Italian, pizza, biryani, desserts, and more.",
    path: "/popular-cuisines",
    socialTitle: "Popular Cuisines on Foodiq",
    socialDescription:
      "From biryani to pizza — browse popular cuisines and order your favorite meals on Foodiq.",
  },
  trendingDishes: {
    title: "Trending Dishes",
    description:
      "Discover trending dishes on Foodiq. Order the most popular meals people are craving right now.",
    path: "/trending-dishes",
    socialTitle: "Trending Dishes on Foodiq",
    socialDescription:
      "See what's hot right now. Order the most popular and trending dishes delivered to your door on Foodiq.",
  },
  offers: {
    title: "Offers & Deals",
    description:
      "Save with Foodiq offers and deals. Exclusive restaurant discounts and food delivery promotions.",
    path: "/offers",
    socialTitle: "Foodiq Offers & Deals",
    socialDescription:
      "Save on every order with exclusive Foodiq offers, restaurant discounts, and limited-time delivery deals.",
  },
  collections: {
    title: "Food Collections",
    description:
      "Browse curated food collections on Foodiq — handpicked restaurants and dishes for every craving.",
    path: "/collections",
    socialTitle: "Curated Food Collections | Foodiq",
    socialDescription:
      "Browse handpicked food collections on Foodiq — curated restaurants and dishes for every craving.",
  },
  search: {
    title: "Search Food & Restaurants",
    description:
      "Search restaurants and dishes on Foodiq. Find meals, cuisines, and places to order from quickly.",
    path: "/search",
    socialTitle: "Search Food & Restaurants | Foodiq",
    socialDescription:
      "Find restaurants, cuisines, and dishes fast. Search and order your next meal on Foodiq.",
  },
  orderOnline: {
    title: "Order Food Online",
    description:
      "Order food online from top restaurants on Foodiq. Fast delivery, live tracking, and exclusive offers in Hyderabad.",
    path: "/order-online",
    keywords: [...SITE_KEYWORDS, "Foodiq Online Food Delivery", "order food online Hyderabad"],
    socialTitle: "Order Food Online | Foodiq",
    socialDescription:
      "Order from top restaurants with fast delivery, live tracking, and exclusive offers on Foodiq.",
  },
  liveCricket: {
    title: "Live Cricket & Match Day Food",
    description:
      "Watch live cricket with real-time scores on Foodiq and order match day food combos delivered fast.",
    path: "/live-cricket",
    noIndex: false,
    socialTitle: "Live Cricket & Match Day Food | Foodiq",
    socialDescription:
      "Follow live cricket scores and order match day food combos delivered fast on Foodiq.",
  },
  blog: {
    title: "Foodiq Blog",
    description:
      "Read the Foodiq blog for food delivery tips, restaurant stories, trending dishes, and platform updates.",
    path: "/blog",
    socialTitle: "Foodiq Blog — Food Delivery Insights",
    socialDescription:
      "Stories, tips, and updates from Foodiq about restaurants, trending dishes, and online food delivery.",
  },
  careers: {
    title: "Careers at Foodiq",
    description:
      "Explore careers at Foodiq. Join our team building India's online food delivery experience.",
    path: "/careers",
    socialTitle: "Careers at Foodiq",
    socialDescription:
      "Discover open roles at Foodiq and help shape the future of online food delivery in India.",
  },
  press: {
    title: "Foodiq Press",
    description:
      "Foodiq press resources, company news, and media contact information.",
    path: "/press",
    socialTitle: "Foodiq Press & Media",
    socialDescription:
      "Find Foodiq press releases, brand assets, and media contact details.",
  },
  refundPolicy: {
    title: "Refund Policy",
    description:
      "Read the Foodiq Refund Policy for eligible refund scenarios, timelines, and how to request support.",
    path: "/refund-policy",
    socialTitle: "Foodiq Refund Policy",
    socialDescription:
      "Understand when Foodiq orders qualify for refunds and how to contact support for order issues.",
  },
  about: {
    title: "About Foodiq",
    description:
      "Learn about Foodiq — the official online food delivery platform helping you discover and order delicious food in Hyderabad.",
    path: "/about",
    keywords: [...SITE_KEYWORDS, "Foodiq Official Website"],
    socialTitle: "About Foodiq — Online Food Delivery Platform",
    socialDescription:
      "Discover the story behind Foodiq and how we connect you with the best restaurants and fastest food delivery in Hyderabad.",
  },
  contact: {
    title: "Contact Us",
    description:
      "Contact Foodiq support. We're here to help with orders, restaurants, and account questions.",
    path: "/contact",
    socialTitle: "Contact Foodiq Support",
    socialDescription:
      "Need help with an order or account? Reach Foodiq support for fast assistance with deliveries, payments, and restaurants.",
  },
  helpSupport: {
    title: "Help & Support",
    description:
      "Get help with Foodiq orders, deliveries, payments, and account issues. Find answers and contact support.",
    path: "/help-support",
    socialTitle: "Foodiq Help & Support",
    socialDescription:
      "Find answers about orders, deliveries, payments, and accounts. Get help from Foodiq support.",
  },
  privacy: {
    title: "Privacy Policy",
    description:
      "Read the Foodiq Privacy Policy to understand how we collect, use, and protect your personal information.",
    path: "/privacy-policy",
    socialTitle: "Foodiq Privacy Policy",
    socialDescription:
      "Learn how Foodiq collects, uses, and protects your personal information and order data.",
  },
  terms: {
    title: "Terms of Service",
    description:
      "Read the Foodiq Terms of Service governing use of our restaurant ordering platform and services.",
    path: "/terms-of-service",
    socialTitle: "Foodiq Terms of Service",
    socialDescription:
      "Review the terms and conditions for using the Foodiq food ordering platform and delivery services.",
  },
  login: {
    title: "Log In",
    description:
      "Log in to your Foodiq account to order food, track deliveries, and manage favorites.",
    path: "/login",
    noIndex: true,
    socialTitle: "Log In to Foodiq",
    socialDescription:
      "Access your Foodiq account to track orders, reorder favorites, and manage your profile securely.",
  },
  register: {
    title: "Sign Up",
    description:
      "Create a free Foodiq account to order from restaurants, save favorites, and unlock exclusive offers.",
    path: "/register",
    noIndex: true,
    socialTitle: "Sign Up for Foodiq",
    socialDescription:
      "Join Foodiq in seconds. Create your account to order food online, earn rewards, and get personalized offers.",
  },
  forgotPassword: {
    title: "Forgot Password",
    description: "Reset your Foodiq account password securely.",
    path: "/forgot-password",
    noIndex: true,
    socialTitle: "Reset Your Foodiq Password",
    socialDescription:
      "Securely reset your Foodiq account password and get back to ordering your favorite meals.",
  },
  cart: {
    title: "Your Cart",
    description:
      "Review items in your Foodiq cart. Update quantities, apply offers, and proceed to checkout.",
    path: "/cart",
    noIndex: true,
    socialTitle: "Your Cart | Foodiq",
    socialDescription:
      "Check your selected dishes and restaurant order before checkout on Foodiq.",
  },
  wishlist: {
    title: "Your Wishlist",
    description:
      "Save and manage your favorite dishes and restaurants on your Foodiq wishlist.",
    path: "/wishlist",
    noIndex: true,
    socialTitle: "Your Wishlist | Foodiq",
    socialDescription:
      "Keep track of dishes and restaurants you love. Access your saved favorites anytime on Foodiq.",
  },
  orders: {
    title: "Your Orders",
    description:
      "View and track your Foodiq order history. Reorder past meals and check delivery status.",
    path: "/my-orders",
    noIndex: true,
    socialTitle: "Your Orders | Foodiq",
    socialDescription:
      "See past and active Foodiq orders, track deliveries, and reorder your favorite meals quickly.",
  },
} as const satisfies Record<string, PageSeoEntry>;

function resolveSocialTitle(title: string, override?: string): string {
  if (override) return override;
  if (title.includes(SITE_NAME)) return title;
  return `${title} | ${SITE_NAME}`;
}

function resolveSocialDescription(description: string, override?: string): string {
  const text = override ?? description;
  return text.length > 155 ? `${text.slice(0, 152)}...` : text;
}

export function publicMetadata(key: keyof typeof PUBLIC_PAGE_SEO) {
  const seo = PUBLIC_PAGE_SEO[key];

  return buildPageMetadata({
    title: seo.title,
    description: seo.description,
    path: seo.path,
    keywords: "keywords" in seo && seo.keywords ? [...seo.keywords] : undefined,
    noIndex: "noIndex" in seo ? Boolean(seo.noIndex) : false,
    socialTitle: resolveSocialTitle(seo.title, seo.socialTitle),
    socialDescription: resolveSocialDescription(seo.description, seo.socialDescription),
  });
}
