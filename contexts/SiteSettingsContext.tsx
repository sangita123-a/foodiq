"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import api from "@/services/api";
import {
  DEFAULT_SITE_SETTINGS,
  mergeSiteSettings,
  type SiteSettings,
} from "@/lib/siteSettings";

type SiteSettingsContextValue = {
  settings: SiteSettings;
  isLoading: boolean;
};

const SiteSettingsContext = createContext<SiteSettingsContextValue>({
  settings: DEFAULT_SITE_SETTINGS,
  isLoading: false,
});

async function fetchSiteSettings(): Promise<SiteSettings> {
  try {
    const res = await api.get("/api/site-settings");
    const data = res.data?.data ?? res.data;
    return mergeSiteSettings(data);
  } catch {
    return DEFAULT_SITE_SETTINGS;
  }
}

function readBootstrapSettings(): SiteSettings | undefined {
  if (typeof document === "undefined") return undefined;
  const node = document.getElementById("foodiq-site-settings");
  if (!node?.textContent) return undefined;
  try {
    return mergeSiteSettings(JSON.parse(node.textContent));
  } catch {
    return undefined;
  }
}

export function SiteSettingsProvider({
  children,
  initialSettings,
}: {
  children: React.ReactNode;
  initialSettings?: SiteSettings;
}) {
  const [bootstrapSettings] = useState(() =>
    mergeSiteSettings(initialSettings ?? readBootstrapSettings())
  );

  const { data, isLoading } = useSWR("site-settings", fetchSiteSettings, {
    fallbackData: bootstrapSettings,
    revalidateOnFocus: false,
    revalidateOnMount: false,
    dedupingInterval: 60000,
  });

  const settings = useMemo(
    () => mergeSiteSettings(data ?? bootstrapSettings),
    [data, bootstrapSettings]
  );

  const value = useMemo(
    () => ({ settings, isLoading }),
    [settings, isLoading]
  );

  useEffect(() => {
    const color = settings.theme_color || DEFAULT_SITE_SETTINGS.theme_color;
    const isDefault =
      color.toLowerCase() === DEFAULT_SITE_SETTINGS.theme_color.toLowerCase();

    if (isDefault) {
      // Let app/globals.css own primary + hover tokens when using the default theme.
      document.documentElement.style.removeProperty("--color-primary");
      document.documentElement.style.removeProperty("--color-primary-hover");
      return;
    }

    document.documentElement.style.setProperty("--color-primary", color);
    document.documentElement.style.setProperty("--color-primary-hover", color);
  }, [settings.theme_color]);

  return (
    <SiteSettingsContext.Provider value={value}>
      {children}
    </SiteSettingsContext.Provider>
  );
}

export function useSiteSettings() {
  return useContext(SiteSettingsContext);
}
