"use client";

import { useEffect } from "react";
import { PREFETCH_ROUTES } from "@/lib/seo/site";

/**
 * Prefetches high-traffic routes after idle time instead of blocking initial load.
 */
export default function DeferredRoutePrefetch() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const prefetch = () => {
      for (const route of PREFETCH_ROUTES) {
        const link = document.createElement("link");
        link.rel = "prefetch";
        link.href = route;
        document.head.appendChild(link);
      }
    };

    let idleId: number | undefined;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    if ("requestIdleCallback" in window) {
      idleId = window.requestIdleCallback(prefetch, { timeout: 5000 });
    } else {
      timeoutId = setTimeout(prefetch, 3000);
    }

    return () => {
      if (idleId != null && "cancelIdleCallback" in window) {
        window.cancelIdleCallback(idleId);
      }
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

  return null;
}
