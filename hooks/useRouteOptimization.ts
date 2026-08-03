"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import useSWR from "swr";
import { useAuthToken } from "@/hooks/useAuthToken";
import { useSocket } from "@/hooks/useSocket";
import { routeEngine } from "@/lib/routeOptimization/engine";
import { LatLng, OptimizedRoute, RouteOptimizationMode } from "@/lib/routeOptimization/types";
import { SOCKET_EVENTS } from "@/lib/socketEvents";
import { fetchOptimizedRoute, recalculateRouteApi } from "@/services/routeApi";

export function useRouteOptimization(
  orderIds: string[] = [],
  currentPos?: LatLng | null,
  mode: RouteOptimizationMode["type"] = "fastest"
) {
  const hasToken = useAuthToken();
  const { socket, connected } = useSocket();
  const [route, setRoute] = useState<OptimizedRoute | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const isOptimizingRef = useRef(false);

  const orderKey = orderIds.join(",");

  const swrKey = hasToken && orderKey
    ? `/api/delivery/route/optimized?order_ids=${encodeURIComponent(orderKey)}&mode=${mode}${currentPos ? `&lat=${currentPos.lat}&lng=${currentPos.lng}` : ""}`
    : null;

  const { data, isLoading, mutate } = useSWR<OptimizedRoute>(
    swrKey,
    async () => {
      const res = await fetchOptimizedRoute({
        orderIds,
        mode,
        lat: currentPos?.lat,
        lng: currentPos?.lng,
      });
      return res;
    },
    {
      revalidateOnFocus: false,
      refreshInterval: 30000,
      onSuccess: (swrData) => {
        setRoute(swrData);
      },
    }
  );

  // Sync route if data arrives and route is not yet set
  useEffect(() => {
    if (data && !route) {
      setRoute(data);
    }
  }, [data, route]);

  // Handle Socket.IO events for route updates
  useEffect(() => {
    if (!socket || !connected) return;

    const onRouteUpdate = (updatedRoute: OptimizedRoute) => {
      setRoute(updatedRoute);
    };

    const onEtaChanged = (payload: { etaMinutes: number; remainingDistanceKm: number }) => {
      setRoute((prev) =>
        prev
          ? {
              ...prev,
              remainingDurationMin: payload.etaMinutes,
              remainingDistanceKm: payload.remainingDistanceKm,
            }
          : null
      );
    };

    socket.on(SOCKET_EVENTS.DELIVERY_ROUTE_UPDATE, onRouteUpdate);
    socket.on(SOCKET_EVENTS.DELIVERY_ROUTE_OPTIMIZED, onRouteUpdate);
    socket.on(SOCKET_EVENTS.DELIVERY_ROUTE_REROUTED, onRouteUpdate);
    socket.on(SOCKET_EVENTS.DELIVERY_ETA_CHANGED, onEtaChanged);

    return () => {
      socket.off(SOCKET_EVENTS.DELIVERY_ROUTE_UPDATE, onRouteUpdate);
      socket.off(SOCKET_EVENTS.DELIVERY_ROUTE_OPTIMIZED, onRouteUpdate);
      socket.off(SOCKET_EVENTS.DELIVERY_ROUTE_REROUTED, onRouteUpdate);
      socket.off(SOCKET_EVENTS.DELIVERY_ETA_CHANGED, onEtaChanged);
    };
  }, [socket, connected]);

  // Recalculate route function
  const triggerRecalculate = useCallback(
    async (
      reason: "manual" | "deviation" | "traffic" | "restaurant_delay" | "new_order" = "manual"
    ) => {
      if (!currentPos || isOptimizingRef.current) return;
      isOptimizingRef.current = true;
      setIsOptimizing(true);

      try {
        const newRoute = await recalculateRouteApi({
          partnerId: route?.partnerId || "partner_demo",
          currentLat: currentPos.lat,
          currentLng: currentPos.lng,
          orderIds,
          reason,
        });
        setRoute(newRoute);
        if (socket && connected) {
          socket.emit(SOCKET_EVENTS.DELIVERY_ROUTE_REROUTED, newRoute);
        }
      } catch {
        // Graceful fallback: optimize locally
        if (route) {
          const localReopt = await routeEngine.recalculateRoute(currentPos, route, reason);
          setRoute(localReopt);
        }
      } finally {
        isOptimizingRef.current = false;
        setIsOptimizing(false);
      }
    },
    [currentPos, orderIds, route, socket, connected]
  );

  // Automatic deviation detection & dynamic re-routing
  const routeCoords = route?.coordinates;
  useEffect(() => {
    if (!currentPos || !routeCoords || routeCoords.length === 0 || isOptimizingRef.current) {
      return;
    }

    const hasDeviated = routeEngine.shouldReroute(currentPos, routeCoords, 0.35); // 350 meters
    if (hasDeviated) {
      void triggerRecalculate("deviation");
    }
  }, [currentPos, routeCoords, triggerRecalculate]);

  return {
    route: route || data || null,
    isLoading: isLoading || isOptimizing,
    isOptimizing,
    mutate,
    triggerRecalculate,
  };
}
