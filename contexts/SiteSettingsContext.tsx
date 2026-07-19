"use client";

import { createContext, useContext, useEffect, useMemo } from "react";
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

export function SiteSettingsProvider({ children }: { children: React.ReactNode }) {
  const { data, isLoading } = useSWR("site-settings", fetchSiteSettings, {
    revalidateOnFocus: false,
    dedupingInterval: 60000,
  });

  const settings = useMemo(() => mergeSiteSettings(data), [data]);

  useEffect(() => {
    const color = settings.theme_color || "#E23744";
    document.documentElement.style.setProperty("--color-primary", color);
    document.documentElement.style.setProperty("--color-primary-hover", color);
  }, [settings.theme_color]);

  return (
    <SiteSettingsContext.Provider value={{ settings, isLoading }}>
      {children}
    </SiteSettingsContext.Provider>
  );
}

export function useSiteSettings() {
  return useContext(SiteSettingsContext);
}
