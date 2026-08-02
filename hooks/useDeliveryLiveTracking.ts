"use client";

import { useEffect, useRef, useState } from "react";
import { useSocket } from "@/hooks/useSocket";
import { SOCKET_EVENTS } from "@/lib/socketEvents";
import { updateDeliveryLocationDetailed } from "@/services/deliveryApi";

export type CurrentPosition = {
  lat: number;
  lng: number;
  accuracy: number | null;
  heading: number | null;
  speed: number | null;
};

type Options = {
  orderId?: string | null;
  intervalMs?: number;
  enabled?: boolean;
};

/**
 * Delivery partner: live navigation tracking for a single order.
 * Streams GPS via `delivery:location` (Socket.IO, HTTP fallback) and
 * announces `delivery:tracking:start` / `delivery:tracking:stop`.
 */
export function useDeliveryLiveTracking({ orderId = null, intervalMs = 4000, enabled = true }: Options = {}) {
  const { socket, connected, offline } = useSocket();
  const watchId = useRef<number | null>(null);
  const lastSent = useRef(0);
  const [position, setPosition] = useState<CurrentPosition | null>(null);
  const [distanceKm, setDistanceKm] = useState<number | null>(null);
  const [etaMinutes, setEtaMinutes] = useState<number | null>(null);
  const [geoError, setGeoError] = useState<string | null>(null);

  // Announce tracking start/stop for the active order.
  useEffect(() => {
    if (!socket || !connected || !orderId || !enabled) return;
    socket.emit(SOCKET_EVENTS.DELIVERY_TRACKING_START, { order_id: orderId });
    return () => {
      socket.emit(SOCKET_EVENTS.DELIVERY_TRACKING_STOP, { order_id: orderId });
    };
  }, [socket, connected, orderId, enabled]);

  // Listen for server-computed ETA updates (e.g. from other publishers of this order).
  useEffect(() => {
    if (!socket || !orderId) return;
    const onEta = (payload: { order_id?: string; eta_minutes?: number | null; distance_km?: number | null }) => {
      if (payload.order_id && payload.order_id !== orderId) return;
      if (payload.eta_minutes != null) setEtaMinutes(payload.eta_minutes);
      if (payload.distance_km != null) setDistanceKm(payload.distance_km);
    };
    socket.on(SOCKET_EVENTS.DELIVERY_ETA_UPDATE, onEta);
    return () => {
      socket.off(SOCKET_EVENTS.DELIVERY_ETA_UPDATE, onEta);
    };
  }, [socket, orderId]);

  // Stream device GPS.
  useEffect(() => {
    if (!enabled || offline || typeof navigator === "undefined" || !navigator.geolocation) {
      return;
    }

    const publish = (coords: GeolocationCoordinates) => {
      const now = Date.now();
      const point: CurrentPosition = {
        lat: coords.latitude,
        lng: coords.longitude,
        accuracy: coords.accuracy ?? null,
        heading: coords.heading != null && !Number.isNaN(coords.heading) ? coords.heading : null,
        speed: coords.speed != null && !Number.isNaN(coords.speed) ? coords.speed : null,
      };
      setPosition(point);

      if (now - lastSent.current < intervalMs - 200) return;
      lastSent.current = now;

      const payload = {
        latitude: point.lat,
        longitude: point.lng,
        accuracy: point.accuracy,
        heading: point.heading,
        speed: point.speed,
        order_id: orderId,
      };

      if (socket && connected) {
        socket.emit(
          SOCKET_EVENTS.DELIVERY_LOCATION,
          payload,
          (ack?: { ok?: boolean; distance_km?: number | null; eta_minutes?: number | null }) => {
            if (ack && ack.ok) {
              if (ack.distance_km != null) setDistanceKm(ack.distance_km);
              if (ack.eta_minutes != null) setEtaMinutes(ack.eta_minutes);
            } else {
              updateDeliveryLocationDetailed(payload)
                .then((res) => {
                  if (res.distance_km != null) setDistanceKm(res.distance_km);
                  if (res.eta_minutes != null) setEtaMinutes(res.eta_minutes);
                })
                .catch(() => {});
            }
          }
        );
      } else {
        updateDeliveryLocationDetailed(payload)
          .then((res) => {
            if (res.distance_km != null) setDistanceKm(res.distance_km);
            if (res.eta_minutes != null) setEtaMinutes(res.eta_minutes);
          })
          .catch(() => {});
      }
    };

    watchId.current = navigator.geolocation.watchPosition(
      (pos) => {
        setGeoError(null);
        publish(pos.coords);
      },
      (err) => {
        setGeoError(err.message || "Unable to access location");
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

  return { position, distanceKm, etaMinutes, geoError, connected, offline };
}
