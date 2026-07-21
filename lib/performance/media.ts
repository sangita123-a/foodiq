/** Client-side media hints for performance (no UI change). */

type NetworkInformation = {
  saveData?: boolean;
  effectiveType?: string;
};

function getConnection(): NetworkInformation | undefined {
  if (typeof navigator === "undefined") return undefined;
  return (navigator as Navigator & { connection?: NetworkInformation }).connection;
}

export function prefersReducedMotionMedia(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;
}

export function isMobileViewport(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia?.("(max-width: 767px)")?.matches ?? false;
}

export function hasSaveDataEnabled(): boolean {
  return getConnection()?.saveData === true;
}

/** Hero background video competes with LCP on mobile and save-data connections. */
export function shouldLoadHeroVideo(): boolean {
  if (typeof window === "undefined") return false;
  if (prefersReducedMotionMedia()) return false;
  if (isMobileViewport()) return false;
  if (hasSaveDataEnabled()) return false;
  return true;
}

export function scheduleIdleWork(callback: () => void, timeoutMs = 3000): () => void {
  if (typeof window === "undefined") return () => undefined;

  let idleId: number | undefined;
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  const run = () => callback();

  if ("requestIdleCallback" in window) {
    idleId = window.requestIdleCallback(run, { timeout: timeoutMs });
  } else {
    timeoutId = setTimeout(run, Math.min(timeoutMs, 1500));
  }

  return () => {
    if (idleId != null && "cancelIdleCallback" in window) {
      window.cancelIdleCallback(idleId);
    }
    if (timeoutId) clearTimeout(timeoutId);
  };
}
