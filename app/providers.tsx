"use client";

import { SWRConfig } from "swr";
import { fetcher } from "@/services/api";
import { ToastProvider, useToast } from "@/contexts/ToastContext";
import React from "react";

function SWRGlobalConfig({ children }: { children: React.ReactNode }) {
  const { showToast } = useToast();

  return (
    <SWRConfig 
      value={{ 
        fetcher,
        onError: (error) => {
          const status = error.response?.status;
          if (status === 401 || status === 403 || status === 404) {
            // Auth redirects / missing optional resources — handled locally
            return;
          }
          if (status >= 500) {
            showToast("Server error. Please try again later.", "error");
          } else if (error.message === "Network Error" || error.code === "ECONNABORTED") {
            showToast(error.message || "Network error. Please check your connection.", "error");
          }
        }
      }}
    >
      {children}
    </SWRConfig>
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <SWRGlobalConfig>
        {children}
      </SWRGlobalConfig>
    </ToastProvider>
  );
}
