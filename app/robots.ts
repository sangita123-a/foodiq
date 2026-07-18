import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/seo/site";

export default function robots(): MetadataRoute.Robots {
  const site = getSiteUrl();
  let host = site;
  try {
    host = new URL(site).host;
  } catch {
    host = site.replace(/^https?:\/\//, "").replace(/\/$/, "");
  }
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin",
          "/admin/",
          "/partner",
          "/partner/",
          "/delivery",
          "/delivery/",
          "/cart",
          "/checkout",
          "/payment",
          "/payment/",
          "/order-success",
          "/track-order",
          "/order-tracking",
          "/profile",
          "/profile/",
          "/my-orders",
          "/my-orders/",
          "/orders",
          "/favorites",
          "/saved-addresses",
          "/payment-methods",
          "/notifications",
          "/notification-preferences",
          "/settings",
          "/coupons-rewards",
          "/coupons",
          "/rewards",
          "/api/",
          "/login",
          "/register",
          "/forgot-password",
        ],
      },
    ],
    sitemap: `${site}/sitemap.xml`,
    host,
  };
}
