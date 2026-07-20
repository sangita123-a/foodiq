"use client";

import { useEffect, useRef } from "react";
import { getGoogleMapsApiKey, loadGoogleMapsScript } from "@/lib/googleMaps";
import type { MapPoint } from "./LiveTrackingMap";

type Props = {
  restaurant?: MapPoint | null;
  customer?: MapPoint | null;
  rider?: MapPoint | null;
  className?: string;
  heightClass?: string;
};

type GMap = google.maps.Map;
type GMarker = google.maps.Marker;
type GPolyline = google.maps.Polyline;

/**
 * Google Maps live tracking (lazy-loaded). Falls back to empty state if no API key.
 */
export default function GoogleTrackingMap({
  restaurant,
  customer,
  rider,
  className = "",
  heightClass = "h-[300px] md:h-[400px]",
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<GMap | null>(null);
  const markersRef = useRef<{ restaurant?: GMarker; customer?: GMarker; rider?: GMarker }>({});
  const routeRef = useRef<GPolyline | null>(null);
  const apiKey = getGoogleMapsApiKey();

  useEffect(() => {
    if (!apiKey || !containerRef.current || mapRef.current) return;
    let cancelled = false;

    loadGoogleMapsScript(apiKey).then((ok) => {
      if (!ok || cancelled || !containerRef.current || !window.google?.maps) return;
      const center = rider || restaurant || customer || { lat: 17.385, lng: 78.4867 };
      mapRef.current = new google.maps.Map(containerRef.current, {
        center: { lat: center.lat, lng: center.lng },
        zoom: 13,
        disableDefaultUI: false,
        zoomControl: true,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true,
      });
    });

    return () => {
      cancelled = true;
    };
  }, [apiKey]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !window.google?.maps) return;

    const bounds = new google.maps.LatLngBounds();
    let hasPoint = false;

    const upsert = (
      key: "restaurant" | "customer" | "rider",
      point: MapPoint | null | undefined,
      color: string,
      label: string
    ) => {
      if (!point?.lat || point?.lng == null) {
        markersRef.current[key]?.setMap(null);
        markersRef.current[key] = undefined;
        return;
      }
      const pos = { lat: point.lat, lng: point.lng };
      bounds.extend(pos);
      hasPoint = true;
      if (markersRef.current[key]) {
        markersRef.current[key]!.setPosition(pos);
      } else {
        markersRef.current[key] = new google.maps.Marker({
          map,
          position: pos,
          title: point.label || label,
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 10,
            fillColor: color,
            fillOpacity: 1,
            strokeColor: "#fff",
            strokeWeight: 2,
          },
        });
      }
    };

    upsert("restaurant", restaurant, "#6B7280", "Restaurant");
    upsert("customer", customer, "#E23744", "You");
    upsert("rider", rider, "#111827", "Rider");

    routeRef.current?.setMap(null);
    const path: google.maps.LatLngLiteral[] = [];
    if (restaurant?.lat != null) path.push({ lat: restaurant.lat, lng: restaurant.lng });
    if (rider?.lat != null) path.push({ lat: rider.lat, lng: rider.lng });
    if (customer?.lat != null) path.push({ lat: customer.lat, lng: customer.lng });
    if (path.length >= 2) {
      routeRef.current = new google.maps.Polyline({
        path,
        geodesic: true,
        strokeColor: "#E23744",
        strokeOpacity: 0.85,
        strokeWeight: 4,
        map,
      });
    }

    if (hasPoint) {
      map.fitBounds(bounds, 48);
    }
  }, [restaurant, customer, rider]);

  if (!apiKey) {
    return null;
  }

  const hasAny = restaurant || customer || rider;

  return (
    <div
      className={`bg-white rounded-3xl w-full border border-[#E5E7EB] relative overflow-hidden mb-8 ${heightClass} ${className}`}
    >
      <div ref={containerRef} className="absolute inset-0 z-0" />
      {!hasAny && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#F8FAFC]/80 text-sm font-bold text-[#6B7280]">
          Waiting for live location…
        </div>
      )}
      <div className="absolute bottom-3 right-3 z-10 text-[10px] font-bold uppercase tracking-widest bg-white/90 text-[#6B7280] px-2 py-1 rounded-lg border border-[#E5E7EB]">
        Live · Google Maps
      </div>
    </div>
  );
}
