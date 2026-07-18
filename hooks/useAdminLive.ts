"use client";

import { useEffect, useState } from "react";
import { mutate } from "swr";
import { useSocket } from "@/hooks/useSocket";
import { SOCKET_EVENTS } from "@/lib/socketEvents";
import { useAdminDashboard } from "@/hooks/useAdminData";

export type LiveTick = {
  type: string;
  order_id?: string;
  status?: string;
  event?: string;
  total_amount?: number;
  online_count?: number;
  amount?: number;
  at?: string;
};

/**
 * Admin live feed — listens to Socket.IO and soft-refreshes dashboard SWR cache.
 */
export function useAdminLive() {
  const { socket, connected, offline } = useSocket();
  const dashboard = useAdminDashboard();
  const [ticks, setTicks] = useState<LiveTick[]>([]);
  const [onlineRiders, setOnlineRiders] = useState<number>(0);
  const [liveRevenueDelta, setLiveRevenueDelta] = useState(0);
  const [activeOrdersDelta, setActiveOrdersDelta] = useState(0);

  useEffect(() => {
    if (!socket) return;

    const onLive = (payload: LiveTick) => {
      setTicks((prev) => [payload, ...prev].slice(0, 40));

      if (payload.type === "rider_presence" && payload.online_count != null) {
        setOnlineRiders(payload.online_count);
      }
      if (payload.type === "payment" && payload.amount) {
        setLiveRevenueDelta((n) => n + Number(payload.amount));
      }
      if (payload.type === "order_status") {
        setActiveOrdersDelta((n) => n + 1);
        mutate("/api/admin/dashboard");
        mutate("/api/admin/orders");
      }
    };

    const onPresence = (payload: { online_count?: number }) => {
      if (payload.online_count != null) setOnlineRiders(payload.online_count);
    };

    const onPayment = (payload: { amount?: number }) => {
      if (payload.amount) setLiveRevenueDelta((n) => n + Number(payload.amount));
      mutate("/api/admin/dashboard");
    };

    socket.on(SOCKET_EVENTS.ADMIN_LIVE, onLive);
    socket.on(SOCKET_EVENTS.RIDER_PRESENCE, onPresence);
    socket.on(SOCKET_EVENTS.PAYMENT_COMPLETED, onPayment);
    socket.on(SOCKET_EVENTS.ORDER_CREATED, () => {
      setActiveOrdersDelta((n) => n + 1);
      mutate("/api/admin/dashboard");
    });

    return () => {
      socket.off(SOCKET_EVENTS.ADMIN_LIVE, onLive);
      socket.off(SOCKET_EVENTS.RIDER_PRESENCE, onPresence);
      socket.off(SOCKET_EVENTS.PAYMENT_COMPLETED, onPayment);
    };
  }, [socket]);

  return {
    ...dashboard,
    ticks,
    onlineRiders:
      onlineRiders || dashboard.data?.activeDeliveryPartners || 0,
    liveRevenueDelta,
    activeOrdersDelta,
    connected,
    offline,
  };
}
