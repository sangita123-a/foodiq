"use client";

import useSWR from "swr";
import { useAuthToken } from "@/hooks/useAuthToken";
import { useSocket } from "@/hooks/useSocket";
import { adminFetcher, type AdminDashboard } from "@/services/adminApi";

export function useAdminDashboard() {
  const hasToken = useAuthToken();
  const { connected } = useSocket();
  return useSWR<AdminDashboard>(
    hasToken ? "/api/admin/dashboard" : null,
    adminFetcher,
    {
      revalidateOnFocus: false,
      // Socket.IO drives live updates on /admin/live; keep a slow fallback here.
      refreshInterval: connected ? 60000 : 30000,
    }
  );
}

export function useAdminList<T = unknown>(path: string | null) {
  const hasToken = useAuthToken();
  return useSWR<T>(hasToken && path ? path : null, adminFetcher, {
    revalidateOnFocus: false,
  });
}
