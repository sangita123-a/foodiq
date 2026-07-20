"use client";

import type { ReactNode } from "react";
import { SWRConfig } from "swr";
import dynamic from "next/dynamic";
import { fetcher } from "@/services/api";
import { ToastProvider, useToast } from "@/contexts/ToastContext";
import ErrorBoundary from "@/components/monitoring/ErrorBoundary";
import AnalyticsProvider from "@/components/analytics/AnalyticsProvider";
import PwaProvider from "@/components/pwa/PwaProvider";
import AuthBootstrap from "@/components/AuthBootstrap";
import { FeatureFlagProvider } from "@/lib/featureFlags";
import { SiteSettingsProvider } from "@/contexts/SiteSettingsContext";

const PushNotificationProvider = dynamic(
  () => import("@/components/notifications/PushNotificationProvider"),
  { ssr: false }
);

function SWRGlobalConfig({ children }: { children: ReactNode }) {
  const { showToast } = useToast();

  return (
    <SWRConfig
      value={{
        fetcher,
        revalidateOnFocus: false,
        dedupingInterval: 4000,
        onError: (error) => {
          const status = error.response?.status;

          if (status === 401 || status === 403 || status === 404) {
            return;
          }
          if (status >= 500) {
            showToast("Server error. Please try again later.", "error");
          } else if (error.message === "Network Error" || error.code === "ECONNABORTED") {
            showToast(error.message || "Network error. Please check your connection.", "error");
          }
        },
      }}
    >
      {children}
    </SWRConfig>
  );
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
      <ErrorBoundary>
        <AnalyticsProvider>
          <PwaProvider>
            <AuthBootstrap />
            <SWRGlobalConfig>
              <FeatureFlagProvider>
                <SiteSettingsProvider>
                  <PushNotificationProvider>{children}</PushNotificationProvider>
                </SiteSettingsProvider>
              </FeatureFlagProvider>
            </SWRGlobalConfig>
          </PwaProvider>
        </AnalyticsProvider>
      </ErrorBoundary>
    </ToastProvider>
  );
}
