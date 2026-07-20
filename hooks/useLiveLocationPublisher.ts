"use client";

import { useEffect, useRef } from "react";
import { useSocket } from "@/hooks/useSocket";
import { SOCKET_EVENTS } from "@/lib/socketEvents";
import { updateDeliveryLocation } from "@/services/deliveryApi";

type Options = {
  /** Active order being delivered — location is linked to tracking */
  orderId?: string | null;
  /** Publish interval in ms (default 4s) */
  intervalMs?: number;
  enabled?: boolean;
};

/**
 * Delivery partner: stream GPS every few seconds via Socket.IO (HTTP fallback).
 */
export function useLiveLocationPublisher({
  orderId = null,
  intervalMs = 5000,
  enabled = true,
}: Options = {}) {
  const { socket, connected, offline } = useSocket();
  const watchId = useRef<number | null>(null);
  const lastSent = useRef(0);

  useEffect(() => {
    if (!enabled || offline || typeof navigator === "undefined" || !navigator.geolocation) {
      return;
    }

    const publish = async (lat: number, lng: number, heading?: number | null) => {
      const now = Date.now();
      if (now - lastSent.current < intervalMs - 200) return;
      lastSent.current = now;

      if (socket && connected) {
        socket.emit(
          SOCKET_EVENTS.UPDATE_LOCATION,
          { lat, lng, order_id: orderId, heading },
          (ack?: { ok?: boolean }) => {
            if (ack && !ack.ok) {
              // Fallback HTTP
              updateDeliveryLocation(lat, lng).catch(() => {});
            }
          }
        );
      } else {
        try {
          await updateDeliveryLocation(lat, lng);
        } catch {
          /* ignore */
        }
      }
    };

    watchId.current = navigator.geolocation.watchPosition(
      (pos) => {
        publish(
          pos.coords.latitude,
          pos.coords.longitude,
          pos.coords.heading != null && !Number.isNaN(pos.coords.heading)
            ? pos.coords.heading
            : null
        );
      },
      () => {
        /* permission denied / unavailable — silent */
      },
      { enableHighAccuracy: true, maximumAge: 2000, timeout: 10000 }
    );

    return () => {
      if (watchId.current != null) {
        navigator.geolocation.clearWatch(watchId.current);
        watchId.current = null;
      }
    };
  }, [enabled, offline, socket, connected, orderId, intervalMs]);
}
