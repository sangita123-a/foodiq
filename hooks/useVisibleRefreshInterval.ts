"use client";

import { useEffect, useState } from "react";

/**
 * SWR refreshInterval that pauses when the tab is hidden (saves API load).
 * Returns 0 when hidden so SWR stops polling.
 */
export function useVisibleRefreshInterval(intervalMs: number): number {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const sync = () => setVisible(document.visibilityState === "visible");
    sync();
    document.addEventListener("visibilitychange", sync);
    return () => document.removeEventListener("visibilitychange", sync);
  }, []);

  return visible ? intervalMs : 0;
}
