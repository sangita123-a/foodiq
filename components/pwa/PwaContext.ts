"use client";

import { createContext, useContext } from "react";

export type PwaContextValue = {
  canInstall: boolean;
  isInstalled: boolean;
  isMobile: boolean;
  installApp: () => Promise<boolean>;
};

export const PwaContext = createContext<PwaContextValue>({
  canInstall: false,
  isInstalled: false,
  isMobile: false,
  installApp: async () => false,
});

export function usePwaInstall() {
  return useContext(PwaContext);
}
