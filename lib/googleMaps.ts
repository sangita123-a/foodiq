/** Lazy-load Google Maps JavaScript API (production tracking). */
export function loadGoogleMapsScript(apiKey: string): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") {
      resolve(false);
      return;
    }
    if ((window as Window & { google?: { maps?: unknown } }).google?.maps) {
      resolve(true);
      return;
    }
    const existing = document.querySelector('script[data-foodiq-gmaps="1"]');
    if (existing) {
      existing.addEventListener("load", () => resolve(true));
      existing.addEventListener("error", () => resolve(false));
      return;
    }
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&libraries=geometry`;
    script.async = true;
    script.defer = true;
    script.dataset.foodiqGmaps = "1";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.head.appendChild(script);
  });
}

export function getGoogleMapsApiKey(): string | null {
  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.trim();
  return key || null;
}
