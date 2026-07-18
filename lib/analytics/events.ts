import { getGaId, isAnalyticsEnabled } from "./config";

export type AnalyticsParams = Record<
  string,
  string | number | boolean | null | undefined
>;

declare global {
  interface Window {
    dataLayer?: Array<Record<string, unknown>>;
    gtag?: (...args: unknown[]) => void;
    clarity?: (...args: unknown[]) => void;
  }
}

/** Strip emails / phones / tokens from payloads (privacy). */
function sanitizeParams(params?: AnalyticsParams): Record<string, string | number | boolean> {
  if (!params) return {};
  const out: Record<string, string | number | boolean> = {};
  const blocked = /email|password|token|phone|mobile|address|card|cvv|secret|authorization/i;

  for (const [key, value] of Object.entries(params)) {
    if (value == null) continue;
    if (blocked.test(key)) continue;
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (!trimmed) continue;
      if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) continue;
      if (/^\+?\d{8,15}$/.test(trimmed.replace(/[\s-]/g, ""))) continue;
      out[key] = trimmed.slice(0, 200);
    } else if (typeof value === "number" || typeof value === "boolean") {
      out[key] = value;
    }
  }
  return out;
}

function pushDataLayer(payload: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push(payload);
}

/**
 * Fire a privacy-safe analytics event (GA4 + GTM dataLayer + Clarity custom tags).
 */
export function trackEvent(event: string, params?: AnalyticsParams): void {
  if (!isAnalyticsEnabled()) return;
  if (typeof window === "undefined") return;

  const safe = sanitizeParams(params);
  const gaId = getGaId();

  pushDataLayer({ event, ...safe });

  if (typeof window.gtag === "function") {
    window.gtag("event", event, {
      ...safe,
      send_to: gaId,
    });
  }

  if (typeof window.clarity === "function") {
    try {
      window.clarity("event", event);
      Object.entries(safe).forEach(([k, v]) => {
        window.clarity?.("set", k, String(v));
      });
    } catch {
      /* ignore */
    }
  }
}

export function trackPageView(path: string, title?: string): void {
  if (!isAnalyticsEnabled()) return;
  const gaId = getGaId();
  const page_path = path.split("?")[0] || "/";
  const page_title = title || (typeof document !== "undefined" ? document.title : undefined);

  pushDataLayer({
    event: "page_view",
    page_path,
    page_title,
  });

  if (typeof window !== "undefined" && typeof window.gtag === "function" && gaId) {
    window.gtag("event", "page_view", {
      page_path,
      page_title,
      send_to: gaId,
    });
  }
}

/** Named product events (GA4-friendly names). */
export const AnalyticsEvents = {
  signUp: "sign_up",
  login: "login",
  viewRestaurant: "view_restaurant",
  viewItem: "view_item",
  addToCart: "add_to_cart",
  removeFromCart: "remove_from_cart",
  beginCheckout: "begin_checkout",
  purchase: "purchase",
  paymentSuccess: "payment_success",
  paymentFailed: "payment_failed",
  apiError: "api_error",
  jsError: "exception",
  webVital: "web_vital",
} as const;
