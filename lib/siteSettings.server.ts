import { mergeSiteSettings, type SiteSettings } from "@/lib/siteSettings";

/** SSR: load public site settings from the backend so Footer/contact match on hydrate. */
export async function fetchSiteSettingsServer(): Promise<SiteSettings> {
  const base = (
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.API_PROXY_TARGET ||
    "http://localhost:4000"
  ).replace(/\/$/, "");

  try {
    const res = await fetch(`${base}/api/site-settings`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return mergeSiteSettings(null);
    const body = await res.json();
    const data = body?.data ?? body;
    return mergeSiteSettings(data);
  } catch {
    return mergeSiteSettings(null);
  }
}
