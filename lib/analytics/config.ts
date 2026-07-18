/**
 * Production-only analytics configuration.
 * Missing IDs → no-op (safe for local/dev).
 */

export function isAnalyticsEnabled(): boolean {
  if (typeof process === "undefined") return false;
  if (process.env.NODE_ENV !== "production") return false;
  if (process.env.NEXT_PUBLIC_ANALYTICS_ENABLED === "false") return false;

  // Never run on localhost even if NODE_ENV was mis-set
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    if (host === "localhost" || host === "127.0.0.1" || host.endsWith(".local")) {
      return false;
    }
  }

  return (
    Boolean(process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID) ||
    Boolean(process.env.NEXT_PUBLIC_GTM_ID) ||
    Boolean(process.env.NEXT_PUBLIC_CLARITY_ID) ||
    process.env.NEXT_PUBLIC_ANALYTICS_ENABLED === "true"
  );
}

export function getGaId(): string | undefined {
  const id = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim();
  return id || undefined;
}

export function getGtmId(): string | undefined {
  const id = process.env.NEXT_PUBLIC_GTM_ID?.trim();
  return id || undefined;
}

export function getClarityId(): string | undefined {
  const id = process.env.NEXT_PUBLIC_CLARITY_ID?.trim();
  return id || undefined;
}

export function isMonitoringEnabled(): boolean {
  if (process.env.NODE_ENV !== "production") return false;
  if (process.env.NEXT_PUBLIC_MONITORING_ENABLED === "false") return false;
  return true;
}
