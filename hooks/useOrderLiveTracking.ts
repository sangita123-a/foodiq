"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import { useSocket } from "@/hooks/useSocket";
import { SOCKET_EVENTS } from "@/lib/socketEvents";

export type LiveLocation = {
  lat: number;
  lng: number;
  eta_minutes?: number | null;
  distance_km?: number | null;
  heading?: number | null;
  at?: string;
};

export type TrackingPayload = {
  current_status?: string;
  order_status?: string;
  estimated_delivery_time?: string;
  location_lat?: number | null;
  location_lng?: number | null;
  restaurant?: {
    id?: string;
    name?: string;
    address?: string;
    lat?: number | null;
    lng?: number | null;
  };
  customer?: {
    lat?: number | null;
    lng?: number | null;
    address?: string;
    phone?: string;
  };
  rider?: {
    id?: string;
    name?: string;
    phone?: string;
    vehicle_details?: string;
    vehicle_type?: string;
    rating?: number;
    lat?: number | null;
    lng?: number | null;
  } | null;
  distance_km?: number | null;
  eta_minutes?: number | null;
  live?: boolean;
};

/** Map any order/tracking status string → timeline stage 1–7 (or 0 cancelled). */
export function getTimelineStage(status: string): number {
  if (!status) return 1;
  const s = status.toLowerCase().replace(/_/g, " ").trim();
  if (s === "cancelled" || s === "rejected") return 0;
  if (s === "pending" || s === "confirmed") return 1;
  if (s === "accepted" || s === "assigned") return 2;
  if (s === "preparing") return 3;
  if (s === "ready for pickup" || s === "reached restaurant") return 4;
  if (s === "picked up") return 5;
  if (s === "on the way" || s === "out for delivery") return 6;
  if (s === "delivered") return 7;
  return 1;
}

/**
 * Live order tracking: SWR bootstrap + Socket.IO updates (no aggressive polling).
 */
export function useOrderLiveTracking(orderId: string | null) {
  const { socket, connected, offline } = useSocket();
  const [liveStatus, setLiveStatus] = useState<string | null>(null);
  const [liveLocation, setLiveLocation] = useState<LiveLocation | null>(null);
  const [lastEvent, setLastEvent] = useState<string | null>(null);

  const {
    data: orderData,
    isLoading: orderLoading,
    error: orderError,
    mutate: mutateOrder,
  } = useSWR(orderId ? `/api/orders/${orderId}` : null, {
    refreshInterval: connected ? 0 : 20000,
    revalidateOnFocus: true,
  });

  const {
    data: trackingData,
    isLoading: trackingLoading,
    mutate: mutateTracking,
  } = useSWR<TrackingPayload>(orderId ? `/api/orders/${orderId}/tracking` : null, {
    refreshInterval: connected ? 0 : 20000,
    revalidateOnFocus: true,
  });

  const joinOrder = useCallback(() => {
    if (!socket || !orderId || !connected) return;
    socket.emit(SOCKET_EVENTS.JOIN_ORDER, { order_id: orderId }, (ack?: { ok?: boolean }) => {
      if (ack && !ack.ok) {
        console.warn("[socket] joinOrder failed", ack);
      }
    });
  }, [socket, orderId, connected]);

  useEffect(() => {
    joinOrder();
  }, [joinOrder]);

  useEffect(() => {
    if (!socket || !orderId) return;

    const onStatus = (payload: { order_id?: string; status?: string; event?: string }) => {
      if (payload.order_id !== orderId) return;
      if (payload.status) setLiveStatus(payload.status);
      if (payload.event) setLastEvent(payload.event);
      mutateOrder();
      mutateTracking();
    };

    const onLocation = (payload: LiveLocation & { order_id?: string }) => {
      if (payload.order_id && payload.order_id !== orderId) return;
      if (payload.lat == null || payload.lng == null) return;
      setLiveLocation({
        lat: payload.lat,
        lng: payload.lng,
        eta_minutes: payload.eta_minutes,
        distance_km: payload.distance_km,
        heading: payload.heading,
        at: payload.at,
      });
    };

    const events = [
      SOCKET_EVENTS.ORDER_STATUS,
      SOCKET_EVENTS.ORDER_CREATED,
      SOCKET_EVENTS.ORDER_ACCEPTED,
      SOCKET_EVENTS.ORDER_PREPARING,
      SOCKET_EVENTS.ORDER_READY,
      SOCKET_EVENTS.PICKUP_COMPLETED,
      SOCKET_EVENTS.OUT_FOR_DELIVERY,
      SOCKET_EVENTS.ORDER_DELIVERED,
      SOCKET_EVENTS.ORDER_CANCELLED,
    ];

    events.forEach((e) => socket.on(e, onStatus));
    socket.on(SOCKET_EVENTS.LOCATION_UPDATED, onLocation);
    socket.on("connect", joinOrder);

    return () => {
      events.forEach((e) => socket.off(e, onStatus));
      socket.off(SOCKET_EVENTS.LOCATION_UPDATED, onLocation);
      socket.off("connect", joinOrder);
      socket.emit(SOCKET_EVENTS.LEAVE_ORDER, { order_id: orderId });
    };
  }, [socket, orderId, mutateOrder, mutateTracking, joinOrder]);

  const status = liveStatus || trackingData?.current_status || trackingData?.order_status || orderData?.status || "";
  const stage = useMemo(() => getTimelineStage(status), [status]);

  const location: LiveLocation | null = useMemo(() => {
    if (liveLocation) return liveLocation;
    const lat = trackingData?.location_lat ?? trackingData?.rider?.lat;
    const lng = trackingData?.location_lng ?? trackingData?.rider?.lng;
    if (lat == null || lng == null) return null;
    return {
      lat: Number(lat),
      lng: Number(lng),
      eta_minutes: trackingData?.eta_minutes,
      distance_km: trackingData?.distance_km,
    };
  }, [liveLocation, trackingData]);

  return {
    orderData,
    trackingData,
    status,
    stage,
    location,
    lastEvent,
    connected,
    offline,
    isLoading: orderLoading || trackingLoading,
    error: orderError,
    mutateOrder,
    mutateTracking,
  };
}
