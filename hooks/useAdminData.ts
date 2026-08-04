"use client";

import useSWR from "swr";
import { useAuthToken } from "@/hooks/useAuthToken";
import { useSocket } from "@/hooks/useSocket";
import {
  adminFetcher,
  buildOrdersQuery,
  buildRestaurantsQuery,
  type AdminDashboard,
  type AdminOrderFilters,
  type AdminOrdersResponse,
  type AdminOrderStats,
  type AdminRestaurantFilters,
  type AdminRestaurantsResponse,
  type AdminRestaurantStats,
  type AdminRestaurantDetail,
} from "@/services/adminApi";

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

/** Server-side paginated + filtered + sorted admin order list. */
export function useAdminOrders(filters: AdminOrderFilters) {
  const hasToken = useAuthToken();
  const qs = buildOrdersQuery(filters);
  const path = `/api/admin/orders${qs ? `?${qs}` : ""}`;
  const swr = useSWR<AdminOrdersResponse>(hasToken ? path : null, adminFetcher, {
    revalidateOnFocus: false,
    keepPreviousData: true,
  });
  return { ...swr, path };
}

/** KPI strip for the admin order management page. */
export function useAdminOrderStats() {
  const hasToken = useAuthToken();
  return useSWR<AdminOrderStats>(hasToken ? "/api/admin/orders/stats" : null, adminFetcher, {
    revalidateOnFocus: false,
    refreshInterval: 60000,
  });
}

/** Server-side paginated + filtered + sorted admin restaurant list. */
export function useAdminRestaurants(filters: AdminRestaurantFilters) {
  const hasToken = useAuthToken();
  const qs = buildRestaurantsQuery(filters);
  const path = `/api/admin/restaurants${qs ? `?${qs}` : ""}`;
  const swr = useSWR<AdminRestaurantsResponse>(hasToken ? path : null, adminFetcher, {
    revalidateOnFocus: false,
    keepPreviousData: true,
  });
  return { ...swr, path };
}

/** KPI strip for the admin restaurant management page. */
export function useAdminRestaurantStats() {
  const hasToken = useAuthToken();
  return useSWR<AdminRestaurantStats>(hasToken ? "/api/admin/restaurants/stats" : null, adminFetcher, {
    revalidateOnFocus: false,
    refreshInterval: 60000,
  });
}

/** Full drawer payload for a single restaurant. */
export function useAdminRestaurantDetail(id: string | null) {
  const hasToken = useAuthToken();
  return useSWR<AdminRestaurantDetail>(
    hasToken && id ? `/api/admin/restaurants/${id}` : null,
    adminFetcher,
    { revalidateOnFocus: false }
  );
}
