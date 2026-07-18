"use client";

import { useEffect } from "react";
import useSWR, { mutate } from "swr";
import { useAuthToken } from "@/hooks/useAuthToken";
import { useSocket } from "@/hooks/useSocket";
import { SOCKET_EVENTS } from "@/lib/socketEvents";
import {
  partnerFetcher,
  type PartnerDashboardData,
  type PartnerAnalytics,
  type PartnerMenuItem,
} from "@/services/partnerApi";
import type { Order } from "@/components/partner/orders/types";

export function usePartnerDashboard() {
  const hasToken = useAuthToken();
  const { connected, socket } = useSocket();

  useEffect(() => {
    if (!socket || !connected) return;
    const refresh = () => {
      mutate("/api/partner/dashboard");
      mutate("/api/partner/orders");
    };
    socket.on(SOCKET_EVENTS.ORDER_CREATED, refresh);
    socket.on(SOCKET_EVENTS.ORDER_STATUS, refresh);
    socket.on(SOCKET_EVENTS.PAYMENT_COMPLETED, refresh);
    socket.on(SOCKET_EVENTS.LOCATION_UPDATED, refresh);
    return () => {
      socket.off(SOCKET_EVENTS.ORDER_CREATED, refresh);
      socket.off(SOCKET_EVENTS.ORDER_STATUS, refresh);
      socket.off(SOCKET_EVENTS.PAYMENT_COMPLETED, refresh);
      socket.off(SOCKET_EVENTS.LOCATION_UPDATED, refresh);
    };
  }, [socket, connected]);

  return useSWR<PartnerDashboardData>(
    hasToken ? "/api/partner/dashboard" : null,
    partnerFetcher,
    { revalidateOnFocus: false, refreshInterval: connected ? 0 : 30000 }
  );
}

export function usePartnerOrders() {
  const hasToken = useAuthToken();
  const { connected } = useSocket();
  return useSWR<Order[]>(
    hasToken ? "/api/partner/orders" : null,
    partnerFetcher,
    { revalidateOnFocus: false, refreshInterval: connected ? 0 : 20000 }
  );
}

export function usePartnerMenu() {
  const hasToken = useAuthToken();
  return useSWR<{ items: PartnerMenuItem[]; categories: Array<{ id: string; name: string }> }>(
    hasToken ? "/api/partner/menu" : null,
    partnerFetcher,
    { revalidateOnFocus: false }
  );
}

export function usePartnerProfile() {
  const hasToken = useAuthToken();
  return useSWR<Record<string, unknown>>(
    hasToken ? "/api/partner/profile" : null,
    partnerFetcher,
    { revalidateOnFocus: false }
  );
}

export function usePartnerAnalytics() {
  const hasToken = useAuthToken();
  return useSWR<PartnerAnalytics>(
    hasToken ? "/api/partner/analytics" : null,
    partnerFetcher,
    { revalidateOnFocus: false }
  );
}

export function usePartnerNotifications() {
  const hasToken = useAuthToken();
  const { connected } = useSocket();
  return useSWR<
    Array<{
      id: string;
      title: string;
      message: string;
      is_read: boolean;
      created_at: string;
    }>
  >(hasToken ? "/api/partner/notifications" : null, partnerFetcher, {
    revalidateOnFocus: false,
    refreshInterval: connected ? 0 : 30000,
  });
}
