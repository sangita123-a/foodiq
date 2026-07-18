"use client";

import { useEffect } from "react";
import { trackJsError } from "@/lib/monitoring/client";
import { isMonitoringEnabled } from "@/lib/analytics/config";

/**
 * Global window error + unhandledrejection listeners (production only).
 */
export default function GlobalErrorListeners() {
  useEffect(() => {
    if (!isMonitoringEnabled()) return;

    const onError = (event: ErrorEvent) => {
      trackJsError(event.error || new Error(event.message), {
        source: "window.onerror",
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      });
    };

    const onRejection = (event: PromiseRejectionEvent) => {
      trackJsError(event.reason, { source: "unhandledrejection" });
    };

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, []);

  return null;
}
