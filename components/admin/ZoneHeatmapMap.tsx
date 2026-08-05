"use client";

import { useEffect, useRef } from "react";
import { getGoogleMapsApiKey, loadGoogleMapsScript } from "@/lib/googleMaps";

type HeatPoint = { lat: number; lng: number; weight: number };

type Props = {
  activityPoints: HeatPoint[];
  violationPoints: HeatPoint[];
  className?: string;
  heightClass?: string;
};

/** Renders GPS activity + zone-violation density as two Google Maps heatmap layers. */
export default function ZoneHeatmapMap({
  activityPoints,
  violationPoints,
  className = "",
  heightClass = "h-[360px] md:h-[440px]",
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const activityLayerRef = useRef<google.maps.visualization.HeatmapLayer | null>(null);
  const violationLayerRef = useRef<google.maps.visualization.HeatmapLayer | null>(null);
  const apiKey = getGoogleMapsApiKey();

  useEffect(() => {
    if (!apiKey || !containerRef.current || mapRef.current) return;
    let cancelled = false;

    loadGoogleMapsScript(apiKey).then((loaded) => {
      if (!loaded || cancelled || !containerRef.current || !window.google?.maps?.visualization) return;
      mapRef.current = new google.maps.Map(containerRef.current, {
        center: { lat: 20.5937, lng: 78.9629 },
        zoom: 5,
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
    if (!map || !window.google?.maps?.visualization) return;

    activityLayerRef.current?.setMap(null);
    violationLayerRef.current?.setMap(null);

    const bounds = new google.maps.LatLngBounds();
    let hasBounds = false;

    if (activityPoints.length > 0) {
      activityLayerRef.current = new google.maps.visualization.HeatmapLayer({
        map,
        data: activityPoints.map((p) => {
          bounds.extend({ lat: p.lat, lng: p.lng });
          hasBounds = true;
          return { location: { lat: p.lat, lng: p.lng }, weight: p.weight };
        }),
        radius: 24,
        gradient: [
          "rgba(15, 118, 110, 0)",
          "rgba(15, 118, 110, 0.6)",
          "rgba(15, 118, 110, 1)",
        ],
      });
    }

    if (violationPoints.length > 0) {
      violationLayerRef.current = new google.maps.visualization.HeatmapLayer({
        map,
        data: violationPoints.map((p) => {
          bounds.extend({ lat: p.lat, lng: p.lng });
          hasBounds = true;
          return { location: { lat: p.lat, lng: p.lng }, weight: p.weight };
        }),
        radius: 30,
        gradient: [
          "rgba(220, 38, 38, 0)",
          "rgba(220, 38, 38, 0.7)",
          "rgba(153, 27, 27, 1)",
        ],
      });
    }

    if (hasBounds) {
      map.fitBounds(bounds, 48);
    }
  }, [activityPoints, violationPoints]);

  if (!apiKey) {
    return (
      <div
        className={`bg-section rounded-2xl w-full border border-border flex items-center justify-center text-xs font-bold text-gray-text ${heightClass} ${className}`}
      >
        Heatmap unavailable — Google Maps API key not configured.
      </div>
    );
  }

  const hasAny = activityPoints.length > 0 || violationPoints.length > 0;

  return (
    <div className={`bg-white rounded-2xl w-full border border-border shadow-[var(--shadow-admin-soft)] relative overflow-hidden ${heightClass} ${className}`}>
      <div ref={containerRef} className="absolute inset-0 z-0" />
      {!hasAny && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-section/80 text-sm font-bold text-gray-text">
          No GPS activity recorded in this window yet.
        </div>
      )}
      <div className="absolute bottom-3 left-3 z-10 flex items-center gap-3 text-[10px] font-bold bg-white/90 px-2 py-1 rounded-lg border border-border">
        <span className="flex items-center gap-1 text-teal-700">
          <span className="w-2.5 h-2.5 rounded-full bg-teal-600 inline-block" /> Activity
        </span>
        <span className="flex items-center gap-1 text-red-700">
          <span className="w-2.5 h-2.5 rounded-full bg-red-600 inline-block" /> Violations
        </span>
      </div>
    </div>
  );
}
