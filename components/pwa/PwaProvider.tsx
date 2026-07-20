"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  PWA_SW_PATH,
  type BeforeInstallPromptEvent,
  isMobileViewport,
  isStandaloneMode,
} from "@/lib/pwa/config";
import MobileInstallBanner from "@/components/pwa/MobileInstallBanner";

type PwaContextValue = {
  canInstall: boolean;
  isInstalled: boolean;
  isMobile: boolean;
  installApp: () => Promise<boolean>;
};

const PwaContext = createContext<PwaContextValue>({
  canInstall: false,
  isInstalled: false,
  isMobile: false,
  installApp: async () => false,
});

export function usePwaInstall() {
  return useContext(PwaContext);
}

export default function PwaProvider({ children }: { children: ReactNode }) {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsInstalled(isStandaloneMode());
    setIsMobile(isMobileViewport());

    const media = window.matchMedia("(max-width: 767px)");
    const onViewportChange = () => setIsMobile(media.matches);
    media.addEventListener("change", onViewportChange);

    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };

    const onAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    const onDisplayModeChange = () => {
      setIsInstalled(isStandaloneMode());
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onAppInstalled);
    window
      .matchMedia("(display-mode: standalone)")
      .addEventListener("change", onDisplayModeChange);

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register(PWA_SW_PATH, { scope: "/" })
        .then((registration) => {
          registration.addEventListener("updatefound", () => {
            const nextWorker = registration.installing;
            if (!nextWorker) return;

            nextWorker.addEventListener("statechange", () => {
              if (
                nextWorker.state === "installed" &&
                navigator.serviceWorker.controller
              ) {
                nextWorker.postMessage({ type: "SKIP_WAITING" });
              }
            });
          });
        })
        .catch(() => {
          /* ignore registration errors in unsupported browsers */
        });
    }

    return () => {
      media.removeEventListener("change", onViewportChange);
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onAppInstalled);
      window
        .matchMedia("(display-mode: standalone)")
        .removeEventListener("change", onDisplayModeChange);
    };
  }, []);

  const installApp = useCallback(async () => {
    if (!deferredPrompt || isInstalled) return false;

    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    setDeferredPrompt(null);

    if (choice.outcome === "accepted") {
      setIsInstalled(true);
      return true;
    }

    return false;
  }, [deferredPrompt, isInstalled]);

  const value = useMemo(
    () => ({
      canInstall: Boolean(deferredPrompt) && !isInstalled,
      isInstalled,
      isMobile,
      installApp,
    }),
    [deferredPrompt, isInstalled, isMobile, installApp]
  );

  return (
    <PwaContext.Provider value={value}>
      {children}
      <MobileInstallBanner />
    </PwaContext.Provider>
  );
}
