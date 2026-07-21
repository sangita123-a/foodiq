import type { MetadataRoute } from "next";
import { buildRobotsConfig } from "@/lib/seo/robots-config";

export default function robots(): MetadataRoute.Robots {
  return buildRobotsConfig();
}
