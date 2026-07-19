/**
 * Writes SEO layout.tsx files for static segments (metadata only — no UI).
 */
const fs = require("fs");
const path = require("path");

const publicLayouts = [
  ["restaurants", "restaurants"],
  ["popular-restaurants", "popularRestaurants"],
  ["popular-cuisines", "popularCuisines"],
  ["trending-dishes", "trendingDishes"],
  ["offers", "offers"],
  ["collections", "collections"],
  ["search", "search"],
  ["about", "about"],
  ["contact", "contact"],
  ["help-support", "helpSupport"],
  ["privacy-policy", "privacy"],
  ["terms-of-service", "terms"],
  ["login", "login"],
  ["register", "register"],
  ["order-online", "orderOnline"],
  ["live-cricket", "liveCricket"],
  ["forgot-password", "forgotPassword"],
];

const privateDirs = [
  "cart",
  "checkout",
  "payment",
  "order-success",
  "track-order",
  "order-tracking",
  "profile",
  "my-orders",
  "orders",
  "favorites",
  "wishlist",
  "saved-addresses",
  "payment-methods",
  "notifications",
  "notification-preferences",
  "settings",
  "coupons-rewards",
  "coupons",
  "rewards",
  "admin",
];

function publicLayout(key) {
  return `import type { Metadata } from "next";
import type { ReactNode } from "react";
import { publicMetadata } from "@/lib/seo/pages";

export const metadata: Metadata = publicMetadata("${key}");

export default function SeoLayout({ children }: { children: ReactNode }) {
  return children;
}
`;
}

function privateLayout(title) {
  return `import type { Metadata } from "next";
import type { ReactNode } from "react";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "${title}",
  description: "Private Foodiq page. Not indexed by search engines.",
  path: "/",
  noIndex: true,
});

export default function PrivateSeoLayout({ children }: { children: ReactNode }) {
  return children;
}
`;
}

const root = path.join(__dirname, "..", "app");

for (const [dir, key] of publicLayouts) {
  const file = path.join(root, dir, "layout.tsx");
  fs.mkdirSync(path.dirname(file), { recursive: true });
  // Don't overwrite layouts that already have real UI wrappers except we know these don't
  if (fs.existsSync(file) && !["offers"].includes(dir)) {
    // offers has no layout yet
  }
  fs.writeFileSync(file, publicLayout(key));
  console.log("public", dir);
}

for (const dir of privateDirs) {
  const file = path.join(root, dir, "layout.tsx");
  if (fs.existsSync(file)) {
    console.log("skip existing", dir);
    continue;
  }
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const title = dir
    .split("-")
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(" ");
  fs.writeFileSync(file, privateLayout(title));
  console.log("private", dir);
}

console.log("done");
