import type { NextConfig } from "next";
import { buildProductionSecurityHeaders, getSecurityHeadersOptions } from "./lib/security/headers";
import { buildLegacyRedirects } from "./lib/seo/legacy-redirects";

const securityHeaders = buildProductionSecurityHeaders(getSecurityHeadersOptions());

const nextConfig: NextConfig = {
  // Allow automated/browser testing via 127.0.0.1 in local dev (Next.js 16 default blocks cross-origin HMR)
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  // Enables Docker/CI artifact packaging without changing app behavior
  output: "standalone",
  compress: true,
  poweredByHeader: false,
  reactStrictMode: true,
  trailingSlash: false,
  compiler: {
    removeConsole:
      process.env.NODE_ENV === "production"
        ? { exclude: ["error", "warn"] }
        : false,
  },
  // Optional CDN for static assets (Foodiq 3.0) — leave unset for same-origin
  ...(process.env.CDN_ASSET_PREFIX
    ? { assetPrefix: process.env.CDN_ASSET_PREFIX }
    : {}),
  images: {
    formats: ["image/avif", "image/webp"],
    // Next.js 16: quality 72 is used by SafeImage; local backend images need private IP in dev
    qualities: [72, 75, 100],
    ...(process.env.NODE_ENV === "development" ? { dangerouslyAllowLocalIP: true } : {}),
    minimumCacheTTL: 60 * 60 * 24 * 30,
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "upload.wikimedia.org",
      },
      {
        protocol: "https",
        hostname: "logo.clearbit.com",
      },
      {
        protocol: "https",
        hostname: "images.crunchbase.com",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      {
        protocol: "https",
        hostname: "**.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "**.cloudfront.net",
      },
      {
        protocol: "https",
        hostname: "**.onrender.com",
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "4000",
      },
      {
        protocol: "http",
        hostname: "127.0.0.1",
        port: "4000",
      },
    ],
  },
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "framer-motion",
      "date-fns",
      "swr",
      "firebase/app",
      "firebase/messaging",
    ],
  },
  async headers() {
    return [
      {
        source: "/_next/static/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/images/catalog/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=2592000, stale-while-revalidate=86400",
          },
        ],
      },
      {
        source: "/images/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=86400, stale-while-revalidate=604800",
          },
        ],
      },
      {
        source: "/icons/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=86400, stale-while-revalidate=604800",
          },
        ],
      },
      {
        source: "/fonts/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/hero-video.mp4",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/default-:name.webp",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/opengraph-image.png",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=604800, stale-while-revalidate=86400",
          },
        ],
      },
      {
        source: "/twitter-image.png",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=604800, stale-while-revalidate=86400",
          },
        ],
      },
      {
        source: "/splash/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      // Public marketing / SEO pages — short CDN cache (auth cookies still vary)
      {
        source: "/",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=0, s-maxage=30, stale-while-revalidate=120",
          },
        ],
      },
      {
        source: "/popular-restaurants",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=0, s-maxage=60, stale-while-revalidate=300",
          },
        ],
      },
      {
        source: "/offers",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=0, s-maxage=60, stale-while-revalidate=300",
          },
        ],
      },
      {
        source: "/sw.js",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=0, must-revalidate",
          },
          {
            key: "Service-Worker-Allowed",
            value: "/",
          },
        ],
      },
      {
        source: "/manifest.webmanifest",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=86400, stale-while-revalidate=604800",
          },
          {
            key: "Content-Type",
            value: "application/manifest+json",
          },
        ],
      },
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
  async redirects() {
    return buildLegacyRedirects();
  },
  async rewrites() {
    const backend = (
      process.env.NEXT_PUBLIC_API_URL ||
      process.env.API_PROXY_TARGET ||
      "http://localhost:4000"
    ).replace(/\/$/, "");

    return [
      {
        source: "/firebase-messaging-sw.js",
        destination: "/api/firebase-messaging-sw",
      },
      // Dev/local: proxy API through Next.js to avoid browser CORS errors
      {
        source: "/backend-api/:path*",
        destination: `${backend}/:path*`,
      },
    ];
  },
};

let exportedConfig: NextConfig = nextConfig;
if (process.env.ANALYZE === "true") {
  try {
    // Optional: npm i -D @next/bundle-analyzer
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const withBundleAnalyzer = require("@next/bundle-analyzer")({
      enabled: true,
    });
    exportedConfig = withBundleAnalyzer(nextConfig);
  } catch {
    console.warn(
      "[foodiq] ANALYZE=true but @next/bundle-analyzer is not installed"
    );
  }
}

export default exportedConfig;
