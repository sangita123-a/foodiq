import { HERO_POSTER_WEBP } from "@/lib/performance/assets";

/**
 * @deprecated LCP preload is hoisted in app/layout.tsx `<head>`.
 * Kept for backwards compatibility if imported elsewhere.
 */
export default function HomeCriticalPreloads() {
  return (
    <link
      rel="preload"
      as="image"
      href={HERO_POSTER_WEBP}
      type="image/webp"
      fetchPriority="high"
    />
  );
}
