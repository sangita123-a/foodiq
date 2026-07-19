import type { MetadataRoute } from "next";
import { PRIVATE_ROUTE_PREFIXES } from "@/lib/seo/public-routes";
import { getSiteUrl } from "@/lib/seo/site";

export default function robots(): MetadataRoute.Robots {
  const site = getSiteUrl();
  let host = site;
  try {
    host = new URL(site).host;
  } catch {
    host = site.replace(/^https?:\/\//, "").replace(/\/$/, "");
  }

  const disallow = [
    ...PRIVATE_ROUTE_PREFIXES.map((prefix) =>
      prefix.endsWith("/") ? prefix : `${prefix}/`
    ),
    ...PRIVATE_ROUTE_PREFIXES.filter((prefix) => !prefix.endsWith("/")),
  ];

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/"],
        disallow,
      },
      {
        userAgent: "Googlebot",
        allow: ["/"],
        disallow,
      },
    ],
    sitemap: `${site}/sitemap.xml`,
    host,
  };
}
