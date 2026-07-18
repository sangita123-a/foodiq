"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { trackPageView } from "@/lib/analytics/events";
import { isAnalyticsEnabled } from "@/lib/analytics/config";

/**
 * Fires page_view on App Router navigations (production only).
 */
export default function PageViewTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const last = useRef<string>("");

  useEffect(() => {
    if (!isAnalyticsEnabled()) return;
    const qs = searchParams?.toString();
    const path = qs ? `${pathname}?${qs}` : pathname || "/";
    if (path === last.current) return;
    last.current = path;
    trackPageView(path);
  }, [pathname, searchParams]);

  return null;
}
