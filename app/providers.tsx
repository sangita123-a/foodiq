"use client";

import { SWRConfig } from "swr";
import dynamic from "next/dynamic";
import { fetcher } from "@/services/api";
import { ToastProvider, useToast } from "@/contexts/ToastContext";
import ErrorBoundary from "@/components/monitoring/ErrorBoundary";
import AnalyticsProvider from "@/components/analytics/AnalyticsProvider";
import AuthBootstrap from "@/components/AuthBootstrap";
import React from "react";

const PushNotificationProvider = dynamic(
  () => import("@/components/notifications/PushNotificationProvider"),
  { ssr: false }
);

function SWRGlobalConfig({ children }: { children: React.ReactNode }) {
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

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <ErrorBoundary>
        <AnalyticsProvider>
          <AuthBootstrap />
          <SWRGlobalConfig>
            <PushNotificationProvider>{children}</PushNotificationProvider>
          </SWRGlobalConfig>
        </AnalyticsProvider>
      </ErrorBoundary>
    </ToastProvider>
  );
}
