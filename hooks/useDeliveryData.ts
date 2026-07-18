"use client";

import { useEffect } from "react";
import useSWR, { mutate } from "swr";
import { useAuthToken } from "@/hooks/useAuthToken";
import { useSocket } from "@/hooks/useSocket";
import { SOCKET_EVENTS } from "@/lib/socketEvents";
import {
  deliveryFetcher,
  type DeliveryDashboard,
  type DeliveryEarnings,
  type DeliveryNotification,
  type DeliveryOrder,
  type DeliveryRoute,
} from "@/services/deliveryApi";

function useSocketAwareInterval(fallbackMs: number) {
  const { connected } = useSocket();
  return connected ? 0 : fallbackMs;
}

export function useDeliveryDashboard() {
  const hasToken = useAuthToken();
  const refreshInterval = useSocketAwareInterval(20000);
  const { socket, connected } = useSocket();

  useEffect(() => {
    if (!socket || !connected) return;
    const refresh = () => {
      mutate("/api/delivery/dashboard");
      mutate("/api/delivery/orders/available");
      mutate("/api/delivery/orders/assigned");
    };
    socket.on(SOCKET_EVENTS.ORDER_READY, refresh);
    socket.on(SOCKET_EVENTS.ORDER_STATUS, refresh);
    socket.on(SOCKET_EVENTS.NOTIFICATION, refresh);
    return () => {
      socket.off(SOCKET_EVENTS.ORDER_READY, refresh);
      socket.off(SOCKET_EVENTS.ORDER_STATUS, refresh);
      socket.off(SOCKET_EVENTS.NOTIFICATION, refresh);
    };
  }, [socket, connected]);

  return useSWR<DeliveryDashboard>(
    hasToken ? "/api/delivery/dashboard" : null,
    deliveryFetcher,
    { revalidateOnFocus: false, refreshInterval }
  );
}

export function useDeliveryMe() {
  const hasToken = useAuthToken();
  return useSWR<{
    user: { id: string; full_name: string; email: string; role: string };
    partner: Record<string, unknown>;
  }>(hasToken ? "/api/delivery/me" : null, deliveryFetcher, {
    revalidateOnFocus: false,
  });
}

export function useAvailableOrders() {
  const hasToken = useAuthToken();
  const refreshInterval = useSocketAwareInterval(15000);
  return useSWR<DeliveryOrder[]>(
    hasToken ? "/api/delivery/orders/available" : null,
    deliveryFetcher,
    { revalidateOnFocus: false, refreshInterval }
  );
}

export function useAssignedOrders() {
  const hasToken = useAuthToken();
  const refreshInterval = useSocketAwareInterval(15000);
  return useSWR<DeliveryOrder[]>(
    hasToken ? "/api/delivery/orders/assigned" : null,
    deliveryFetcher,
    { revalidateOnFocus: false, refreshInterval }
  );
}

export function useDeliveryOrder(orderId: string | null) {
  const hasToken = useAuthToken();
  const refreshInterval = useSocketAwareInterval(15000);
  return useSWR<DeliveryOrder>(
    hasToken && orderId ? `/api/delivery/orders/${orderId}` : null,
    deliveryFetcher,
    { revalidateOnFocus: false, refreshInterval }
  );
}

export function useDeliveryRoute(orderId: string | null) {
  const hasToken = useAuthToken();
  return useSWR<DeliveryRoute>(
    hasToken && orderId ? `/api/delivery/orders/${orderId}/route` : null,
    deliveryFetcher,
    { revalidateOnFocus: false }
  );
}

export function useDeliveryEarnings() {
  const hasToken = useAuthToken();
  return useSWR<DeliveryEarnings>(
    hasToken ? "/api/delivery/earnings" : null,
    deliveryFetcher,
    { revalidateOnFocus: false }
  );
}

export function useDeliveryNotifications() {
  const hasToken = useAuthToken();
  const refreshInterval = useSocketAwareInterval(30000);
  return useSWR<DeliveryNotification[]>(
    hasToken ? "/api/delivery/notifications" : null,
    deliveryFetcher,
    { revalidateOnFocus: false, refreshInterval }
  );
}
