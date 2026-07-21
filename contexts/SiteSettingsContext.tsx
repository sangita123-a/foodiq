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

function siteSettingsEqual(a?: SiteSettings, b?: SiteSettings): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  return JSON.stringify(a) === JSON.stringify(b);
}

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
    compare: siteSettingsEqual,
  });

  const settingsSnapshot = JSON.stringify(data ?? bootstrapSettings);
  const settings = useMemo(
    () => mergeSiteSettings(data ?? bootstrapSettings),
    [settingsSnapshot]
  );

  const value = useMemo(
    () => ({ settings, isLoading }),
    [settings, isLoading]
  );

  const themeColor = settings.theme_color || DEFAULT_SITE_SETTINGS.theme_color;

  useEffect(() => {
    const isDefault =
      themeColor.toLowerCase() === DEFAULT_SITE_SETTINGS.theme_color.toLowerCase();

    if (isDefault) {
      document.documentElement.style.removeProperty("--color-primary");
      document.documentElement.style.removeProperty("--color-primary-hover");
      return;
    }

    document.documentElement.style.setProperty("--color-primary", themeColor);
    document.documentElement.style.setProperty("--color-primary-hover", themeColor);
  }, [themeColor]);

  return (
    <SiteSettingsContext.Provider value={value}>
      {children}
    </SiteSettingsContext.Provider>
  );
}

export function useSiteSettings() {
  return useContext(SiteSettingsContext);
}
