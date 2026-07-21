import { isMonitoringEnabled } from "@/lib/analytics/config";
import { AnalyticsEvents, trackEvent } from "@/lib/analytics/events";
import { reportClientError } from "@/services/monitoringApi";

type LogLevel = "info" | "warn" | "error";

function shouldLog(): boolean {
  return isMonitoringEnabled();
}

/**
 * Production client logger — forwards warn/error to backend monitoring.
 * Never logs secrets or full request bodies.
 */
export const prodLog = {
  info(message: string, meta?: Record<string, unknown>) {
    if (process.env.NODE_ENV !== "production") {
      console.info(`[Foodiq] ${message}`, meta || "");
      return;
    }
    if (!shouldLog()) return;
    // info stays local in prod to reduce noise
    if (process.env.NEXT_PUBLIC_VERBOSE_LOGGING === "true") {
      console.info(`[Foodiq] ${message}`, meta || "");
    }
  },
  warn(message: string, meta?: Record<string, unknown>) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(`[Foodiq] ${message}`, meta || "");
      return;
    }
    if (!shouldLog()) return;
    console.warn(`[Foodiq] ${message}`);
    void reportClientError({
      message: `[warn] ${message}`,
      path: typeof window !== "undefined" ? window.location.pathname : undefined,
      meta: { level: "warn" as LogLevel, ...(meta || {}) },
    });
  },
  error(message: string, meta?: Record<string, unknown>) {
    if (process.env.NODE_ENV !== "production") {
      console.error(`[Foodiq] ${message}`, meta || "");
      return;
    }
    if (!shouldLog()) return;
    console.error(`[Foodiq] ${message}`);
    void reportClientError({
      message: `[error] ${message}`,
      path: typeof window !== "undefined" ? window.location.pathname : undefined,
      meta: { level: "error" as LogLevel, ...(meta || {}) },
    });
  },
};

export function trackJsError(error: unknown, meta?: Record<string, unknown>) {
  const err = error instanceof Error ? error : new Error(String(error));
  if (!isMonitoringEnabled()) return;

  trackEvent(AnalyticsEvents.jsError, {
    description: err.message.slice(0, 200),
    fatal: false,
  });

  void reportClientError({
    message: err.message,
    stack: err.stack,
    path: typeof window !== "undefined" ? window.location.pathname : undefined,
    meta: { source: "js_error", ...(meta || {}) },
  });
}

export function trackApiFailure(payload: {
  url?: string;
  method?: string;
  status?: number;
  message?: string;
  code?: string;
}) {
  if (!isMonitoringEnabled()) return;

  const pathOnly = (payload.url || "").split("?")[0].slice(0, 180);
  if (pathOnly.includes("/api/monitoring/")) return;
  trackEvent(AnalyticsEvents.apiError, {
    api_path: pathOnly,
    method: payload.method,
    status: payload.status,
    code: payload.code,
  });

  // Skip noisy expected auth failures
  if (payload.status === 401 || payload.status === 403 || payload.status === 404) return;

  void reportClientError({
    message: payload.message || `API ${payload.status || "error"}: ${pathOnly}`,
    path: typeof window !== "undefined" ? window.location.pathname : undefined,
    meta: {
      source: "api_failure",
      api_path: pathOnly,
      method: payload.method,
      status: payload.status,
      code: payload.code,
    },
  });
}

export function trackWebVital(metric: {
  name: string;
  value: number;
  id: string;
  rating?: string;
  navigationType?: string;
}) {
  if (!isMonitoringEnabled() && process.env.NODE_ENV !== "production") return;

  const value =
    metric.name === "CLS"
      ? Math.round(metric.value * 1000) / 1000
      : Math.round(metric.value);

  trackEvent(AnalyticsEvents.webVital, {
    metric_name: metric.name,
    value,
    metric_id: metric.id,
    rating: metric.rating,
  });

  if (isMonitoringEnabled() && (metric.rating === "poor" || metric.name === "INP")) {
    void reportClientError({
      message: `WebVital ${metric.name}=${value} (${metric.rating || "unknown"})`,
      path: typeof window !== "undefined" ? window.location.pathname : undefined,
      meta: {
        source: "web_vital",
        name: metric.name,
        value,
        id: metric.id,
        rating: metric.rating,
        navigationType: metric.navigationType,
      },
    });
  }
}
