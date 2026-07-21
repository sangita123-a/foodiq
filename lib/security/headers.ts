/**
 * Production security headers — centralized for next.config and middleware.
 *
 * SEO compatibility:
 * - Referrer-Policy sends origin/referrer data to analytics and search tools
 * - CSP keeps `unsafe-inline` for JSON-LD structured data scripts
 * - img-src allows https: for restaurant/catalog and social preview images
 * - Same-origin robots.txt, sitemap.xml, and OG routes are unrestricted
 */

export type SecurityHeadersOptions = {
  isProduction: boolean;
  apiOrigin?: string;
};

export const SECURITY_HEADER_NAMES = {
  CSP: "Content-Security-Policy",
  HSTS: "Strict-Transport-Security",
  X_FRAME_OPTIONS: "X-Frame-Options",
  REFERRER_POLICY: "Referrer-Policy",
  PERMISSIONS_POLICY: "Permissions-Policy",
  X_CONTENT_TYPE_OPTIONS: "X-Content-Type-Options",
} as const;

/** Google-recommended policy — preserves referrer for same-origin SEO/analytics. */
export const REFERRER_POLICY = "strict-origin-when-cross-origin";

export const X_FRAME_OPTIONS = "DENY";

const ANALYTICS_SCRIPT_ORIGINS = [
  "https://www.googletagmanager.com",
  "https://www.google-analytics.com",
  "https://www.clarity.ms",
];

const PAYMENT_ORIGINS = [
  "https://checkout.razorpay.com",
  "https://api.razorpay.com",
  "https://lumberjack.razorpay.com",
];

const CONNECT_ORIGINS = [
  "https://www.google-analytics.com",
  "https://region1.google-analytics.com",
  "https://www.googletagmanager.com",
  "https://www.clarity.ms",
  "https://*.clarity.ms",
  "https://api.razorpay.com",
  "https://lumberjack.razorpay.com",
  "https://fcm.googleapis.com",
  "https://firebaseinstallations.googleapis.com",
  "https://*.googleapis.com",
  "https://*.firebaseio.com",
  "https://*.openstreetmap.org",
  "wss:",
  "ws:",
];

export function resolveApiOrigin(): string {
  try {
    const raw = process.env.NEXT_PUBLIC_API_URL || "";
    if (!raw) return "";
    return new URL(raw).origin;
  } catch {
    return "";
  }
}

export function getSecurityHeadersOptions(
  isProduction = process.env.NODE_ENV === "production"
): SecurityHeadersOptions {
  return {
    isProduction,
    apiOrigin: resolveApiOrigin(),
  };
}

/** Production CSP — allows Next.js bundles, JSON-LD, analytics, maps, Firebase, Razorpay. */
export function buildContentSecurityPolicy(options: SecurityHeadersOptions): string {
  const devConnect = !options.isProduction
    ? "http://localhost:4000 http://127.0.0.1:4000 ws://localhost:4000"
    : "";

  const connectSrc = [
    "connect-src 'self'",
    ...CONNECT_ORIGINS,
    options.apiOrigin,
    devConnect,
  ]
    .filter(Boolean)
    .join(" ");

  return [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "form-action 'self'",
    "img-src 'self' data: blob: https:",
    "media-src 'self' blob:",
    "font-src 'self' data: https://fonts.gstatic.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    [
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      ...ANALYTICS_SCRIPT_ORIGINS,
      "https://checkout.razorpay.com",
      "https://www.gstatic.com",
    ].join(" "),
    connectSrc,
    [
      "frame-src 'self'",
      "https://api.razorpay.com",
      "https://checkout.razorpay.com",
      "https://www.openstreetmap.org",
      "https://www.googletagmanager.com",
    ].join(" "),
    "worker-src 'self' blob:",
    "manifest-src 'self'",
    options.isProduction ? "upgrade-insecure-requests" : "",
  ]
    .filter(Boolean)
    .join("; ");
}

export function buildPermissionsPolicy(): string {
  return [
    "accelerometer=()",
    "camera=()",
    "microphone=()",
    "geolocation=(self)",
    'payment=(self "https://checkout.razorpay.com")',
    "usb=()",
    "interest-cohort=()",
  ].join(", ");
}

export function buildStrictTransportSecurity(isProduction: boolean): string | null {
  if (!isProduction) return null;
  return "max-age=63072000; includeSubDomains; preload";
}

export type SecurityHeader = {
  key: string;
  value: string;
};

export function buildProductionSecurityHeaders(
  options: SecurityHeadersOptions
): SecurityHeader[] {
  const headers: SecurityHeader[] = [
    {
      key: SECURITY_HEADER_NAMES.X_CONTENT_TYPE_OPTIONS,
      value: "nosniff",
    },
    {
      key: SECURITY_HEADER_NAMES.REFERRER_POLICY,
      value: REFERRER_POLICY,
    },
    {
      key: SECURITY_HEADER_NAMES.X_FRAME_OPTIONS,
      value: X_FRAME_OPTIONS,
    },
    {
      key: SECURITY_HEADER_NAMES.PERMISSIONS_POLICY,
      value: buildPermissionsPolicy(),
    },
    {
      key: SECURITY_HEADER_NAMES.CSP,
      value: buildContentSecurityPolicy(options),
    },
  ];

  const hsts = buildStrictTransportSecurity(options.isProduction);
  if (hsts) {
    headers.push({
      key: SECURITY_HEADER_NAMES.HSTS,
      value: hsts,
    });
  }

  return headers;
}

export function applySecurityHeaders(
  target: Headers,
  options: SecurityHeadersOptions
): void {
  for (const { key, value } of buildProductionSecurityHeaders(options)) {
    target.set(key, value);
  }
}
