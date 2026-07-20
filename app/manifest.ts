import type { MetadataRoute } from "next";
import { PWA_BACKGROUND_COLOR, PWA_DESCRIPTION, PWA_THEME_COLOR } from "@/lib/pwa/config";
import { SITE_NAME } from "@/lib/seo/site";

const ICON_SIZES = [72, 96, 128, 144, 152, 192, 384, 512] as const;

export default function manifest(): MetadataRoute.Manifest {
  const icons: MetadataRoute.Manifest["icons"] = ICON_SIZES.map((size) => ({
    src: `/icons/icon-${size}.png`,
    sizes: `${size}x${size}`,
    type: "image/png",
    purpose: "any",
  }));

  icons.push(
    {
      src: "/icons/icon-maskable-192.png",
      sizes: "192x192",
      type: "image/png",
      purpose: "maskable",
    },
    {
      src: "/icons/icon-maskable-512.png",
      sizes: "512x512",
      type: "image/png",
      purpose: "maskable",
    }
  );

  return {
    id: "/",
    name: SITE_NAME,
    short_name: SITE_NAME,
    description: PWA_DESCRIPTION,
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: PWA_BACKGROUND_COLOR,
    theme_color: PWA_THEME_COLOR,
    lang: "en-IN",
    dir: "ltr",
    categories: ["food", "lifestyle", "shopping"],
    icons,
  };
}
