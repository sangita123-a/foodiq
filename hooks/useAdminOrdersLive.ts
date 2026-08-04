"use client";

import { useEffect, useState } from "react";
import { mutate } from "swr";
import { useSocket } from "@/hooks/useSocket";
import { SOCKET_EVENTS } from "@/lib/socketEvents";

type AdminLivePayload = {
  type?: string;
  order_id?: string;
  status?: string;
};

/**
 * Order-module-local live refresh. Does not touch the shared useAdminLive
 * (dashboard) hook — listens on the same existing socket connection and
 * invalidates every /api/admin/orders* SWR key (list, stats, any filter/page
 * variant) instead of a single literal key, since the orders page uses
 * dynamic paginated/filtered keys.
 */
export function useAdminOrdersLive() {
  const { socket, connected } = useSocket();
  const [lastEvent, setLastEvent] = useState<AdminLivePayload | null>(null);

  useEffect(() => {
    if (!socket) return;

    const refreshOrders = () => {
      mutate(
        (key) => typeof key === "string" && key.startsWith("/api/admin/orders"),
        undefined,
        { revalidate: true }
      );
    };

    const onAdminLive = (payload: AdminLivePayload) => {
      if (payload?.type === "order_status") {
        setLastEvent(payload);
        refreshOrders();
      }
    };

    const onOrderStatus = (payload: AdminLivePayload) => {
      setLastEvent(payload);
      refreshOrders();
    };

    socket.on(SOCKET_EVENTS.ADMIN_LIVE, onAdminLive);
    socket.on(SOCKET_EVENTS.ORDER_STATUS, onOrderStatus);

    return () => {
      socket.off(SOCKET_EVENTS.ADMIN_LIVE, onAdminLive);
      socket.off(SOCKET_EVENTS.ORDER_STATUS, onOrderStatus);
    };
  }, [socket]);

  return { connected, lastEvent };
}
