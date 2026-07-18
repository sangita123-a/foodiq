"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { fetchFeatureFlags } from "@/services/featuresApi";

type Flags = Record<string, boolean>;

const FeatureFlagContext = createContext<Flags>({});

export function FeatureFlagProvider({ children }: { children: ReactNode }) {
  const [flags, setFlags] = useState<Flags>({});

  useEffect(() => {
    let cancelled = false;
    void fetchFeatureFlags().then((f) => {
      if (!cancelled) setFlags(f);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <FeatureFlagContext.Provider value={flags}>
      {children}
    </FeatureFlagContext.Provider>
  );
}

export function useFeatureFlag(key: string, fallback = true) {
  const flags = useContext(FeatureFlagContext);
  if (!(key in flags)) return fallback;
  return !!flags[key];
}

export function useFeatureFlags() {
  return useContext(FeatureFlagContext);
}
