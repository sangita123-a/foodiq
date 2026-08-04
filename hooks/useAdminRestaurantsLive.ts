"use client";

import { useEffect, useState } from "react";
import { mutate } from "swr";
import { useSocket } from "@/hooks/useSocket";
import { SOCKET_EVENTS } from "@/lib/socketEvents";

type AdminLivePayload = {
  type?: string;
  restaurant_id?: string;
  approval_status?: string;
  is_active?: boolean;
  action?: string;
};

/**
 * Restaurant-module-local live refresh, mirroring useAdminOrdersLive. Listens
 * on the same shared admin socket connection and invalidates every
 * /api/admin/restaurants* SWR key (list, stats, detail, any filter/page
 * variant) whenever the backend emits an ADMIN_LIVE tick with
 * type: 'restaurant_status' (see socket/emitters.js emitRestaurantStatus).
 */
export function useAdminRestaurantsLive() {
  const { socket, connected } = useSocket();
  const [lastEvent, setLastEvent] = useState<AdminLivePayload | null>(null);

  useEffect(() => {
    if (!socket) return;

    const refreshRestaurants = () => {
      mutate(
        (key) => typeof key === "string" && key.startsWith("/api/admin/restaurants"),
        undefined,
        { revalidate: true }
      );
    };

    const onAdminLive = (payload: AdminLivePayload) => {
      if (payload?.type === "restaurant_status") {
        setLastEvent(payload);
        refreshRestaurants();
      }
    };

    socket.on(SOCKET_EVENTS.ADMIN_LIVE, onAdminLive);

    return () => {
      socket.off(SOCKET_EVENTS.ADMIN_LIVE, onAdminLive);
    };
  }, [socket]);

  return { connected, lastEvent };
}
