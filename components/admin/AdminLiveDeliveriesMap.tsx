"use client";

import { useEffect, useRef } from "react";
import { getGoogleMapsApiKey, loadGoogleMapsScript } from "@/lib/googleMaps";

export type RiderMarker = {
  id: string;
  lat: number;
  lng: number;
  label: string;
  status?: string;
};

type Props = {
  riders: RiderMarker[];
  className?: string;
  heightClass?: string;
};

/** Admin ops: plots every active rider on a single Google Map, live-updated. */
export default function AdminLiveDeliveriesMap({
  riders,
  className = "",
  heightClass = "h-[360px] md:h-[520px]",
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<Map<string, google.maps.Marker>>(new Map());
  const apiKey = getGoogleMapsApiKey();

  useEffect(() => {
    if (!apiKey || !containerRef.current || mapRef.current) return;
    let cancelled = false;

    loadGoogleMapsScript(apiKey).then((ok) => {
      if (!ok || cancelled || !containerRef.current || !window.google?.maps) return;
      const first = riders[0];
      mapRef.current = new google.maps.Map(containerRef.current, {
        center: first ? { lat: first.lat, lng: first.lng } : { lat: 17.385, lng: 78.4867 },
        zoom: 12,
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiKey]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !window.google?.maps) return;

    const seen = new Set<string>();
    const bounds = new google.maps.LatLngBounds();

    riders.forEach((rider) => {
      if (rider.lat == null || rider.lng == null) return;
      seen.add(rider.id);
      const pos = { lat: rider.lat, lng: rider.lng };
      bounds.extend(pos);

      const existing = markersRef.current.get(rider.id);
      if (existing) {
        existing.setPosition(pos);
        existing.setTitle(rider.label);
      } else {
        const marker = new google.maps.Marker({
          map,
          position: pos,
          title: rider.label,
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 9,
            fillColor: "#F97316",
            fillOpacity: 1,
            strokeColor: "#fff",
            strokeWeight: 2,
          },
        });
        markersRef.current.set(rider.id, marker);
      }
    });

    // Remove markers for riders no longer active.
    markersRef.current.forEach((marker, id) => {
      if (!seen.has(id)) {
        marker.setMap(null);
        markersRef.current.delete(id);
      }
    });

    if (riders.length) {
      map.fitBounds(bounds, 64);
    }
  }, [riders]);

  if (!apiKey) {
    return (
      <div
        className={`bg-white rounded-2xl w-full border border-border shadow-[var(--shadow-admin-soft)] relative overflow-hidden flex items-center justify-center ${heightClass} ${className}`}
      >
        <p className="text-sm font-bold text-gray-text px-6 text-center">
          Set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to enable the live riders map.
        </p>
      </div>
    );
  }

  return (
    <div
      className={`bg-white rounded-2xl w-full border border-border shadow-[var(--shadow-admin-soft)] relative overflow-hidden ${heightClass} ${className}`}
    >
      <div ref={containerRef} className="absolute inset-0 z-0" />
      {riders.length === 0 && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-section/80 text-sm font-bold text-gray-text">
          No active riders right now.
        </div>
      )}
      <div className="absolute bottom-3 right-3 z-10 text-[10px] font-bold uppercase tracking-widest bg-white/90 text-gray-text px-2 py-1 rounded-lg border border-border">
        Live · {riders.length} rider{riders.length === 1 ? "" : "s"}
      </div>
    </div>
  );
}
