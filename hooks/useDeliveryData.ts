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
  type DeliveryNotificationCategory,
  type DeliveryNotificationsResponse,
  type DeliveryNotificationType,
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

export function useDeliveryNotifications(params?: {
  page?: number;
  limit?: number;
  unread?: boolean;
  type?: DeliveryNotificationType | "";
  category?: DeliveryNotificationCategory | "All" | "";
}) {
  const hasToken = useAuthToken();
  const refreshInterval = useSocketAwareInterval(30000);
  const { socket, connected } = useSocket();

  const sp = new URLSearchParams();
  if (params?.page) sp.set("page", String(params.page));
  if (params?.limit) sp.set("limit", String(params.limit));
  if (params?.unread) sp.set("unread", "true");
  if (params?.type) sp.set("type", params.type);
  if (params?.category && params.category !== "All") sp.set("category", params.category);
  const qs = sp.toString();
  const key = hasToken ? `/api/delivery/notifications${qs ? `?${qs}` : ""}` : null;

  const result = useSWR<DeliveryNotificationsResponse>(key, deliveryFetcher, {
    revalidateOnFocus: false,
    refreshInterval,
  });

  useEffect(() => {
    if (!socket || !connected) return;
    const refresh = () => result.mutate();
    socket.on(SOCKET_EVENTS.DELIVERY_NOTIFICATION, refresh);
    socket.on(SOCKET_EVENTS.DELIVERY_NOTIFICATION_READ, refresh);
    socket.on(SOCKET_EVENTS.DELIVERY_NOTIFICATION_ALL_READ, refresh);
    return () => {
      socket.off(SOCKET_EVENTS.DELIVERY_NOTIFICATION, refresh);
      socket.off(SOCKET_EVENTS.DELIVERY_NOTIFICATION_READ, refresh);
      socket.off(SOCKET_EVENTS.DELIVERY_NOTIFICATION_ALL_READ, refresh);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, connected]);

  return result;
}
