"use client";

import { useEffect, useRef } from "react";
import { getGoogleMapsApiKey, loadGoogleMapsScript } from "@/lib/googleMaps";

type LatLng = { lat: number; lng: number };

type Props = {
  zoneType: "polygon" | "circle";
  polygonPoints: LatLng[];
  onPolygonPointsChange: (points: LatLng[]) => void;
  center: LatLng | null;
  onCenterChange: (center: LatLng) => void;
  radiusKm: number;
  className?: string;
  heightClass?: string;
};

/**
 * Interactive zone-boundary editor: click-to-add polygon vertices, or click/drag
 * to place a circle center (radius is controlled separately by the parent form).
 */
export default function ZoneDrawMap({
  zoneType,
  polygonPoints,
  onPolygonPointsChange,
  center,
  onCenterChange,
  radiusKm,
  className = "",
  heightClass = "h-[280px] md:h-[360px]",
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const clickListenerRef = useRef<google.maps.MapsEventListener | null>(null);
  const polygonOverlayRef = useRef<google.maps.Polygon | null>(null);
  const vertexMarkersRef = useRef<google.maps.Marker[]>([]);
  const circleOverlayRef = useRef<google.maps.Circle | null>(null);
  const centerMarkerRef = useRef<google.maps.Marker | null>(null);
  const apiKey = getGoogleMapsApiKey();

  // Keep latest callbacks/values in refs so the map click listener (bound once) always sees fresh state.
  const stateRef = useRef({ zoneType, polygonPoints, onPolygonPointsChange, center, onCenterChange, radiusKm });
  stateRef.current = { zoneType, polygonPoints, onPolygonPointsChange, center, onCenterChange, radiusKm };

  useEffect(() => {
    if (!apiKey || !containerRef.current || mapRef.current) return;
    let cancelled = false;

    loadGoogleMapsScript(apiKey).then((loaded) => {
      if (!loaded || cancelled || !containerRef.current || !window.google?.maps) return;
      const startCenter = center || (polygonPoints[0] ?? { lat: 20.5937, lng: 78.9629 });
      const map = new google.maps.Map(containerRef.current, {
        center: startCenter,
        zoom: 12,
        disableDefaultUI: false,
        zoomControl: true,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
      });
      mapRef.current = map;

      clickListenerRef.current = map.addListener("click", (e: google.maps.MapMouseEvent) => {
        if (!e.latLng) return;
        const point = { lat: e.latLng.lat(), lng: e.latLng.lng() };
        const s = stateRef.current;
        if (s.zoneType === "polygon") {
          s.onPolygonPointsChange([...s.polygonPoints, point]);
        } else {
          s.onCenterChange(point);
        }
      });
    });

    return () => {
      cancelled = true;
      clickListenerRef.current?.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiKey]);

  // Render polygon vertices + outline
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !window.google?.maps) return;

    polygonOverlayRef.current?.setMap(null);
    vertexMarkersRef.current.forEach((m) => m.setMap(null));
    vertexMarkersRef.current = [];

    if (zoneType !== "polygon") return;

    vertexMarkersRef.current = polygonPoints.map(
      (pt, idx) =>
        new google.maps.Marker({
          map,
          position: pt,
          label: String(idx + 1),
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 7,
            fillColor: "#0F766E",
            fillOpacity: 1,
            strokeColor: "#fff",
            strokeWeight: 2,
          },
        })
    );

    if (polygonPoints.length >= 3) {
      polygonOverlayRef.current = new google.maps.Polygon({
        map,
        paths: polygonPoints,
        strokeColor: "#0F766E",
        strokeOpacity: 0.9,
        strokeWeight: 2,
        fillColor: "#0F766E",
        fillOpacity: 0.15,
      });
    }
  }, [zoneType, polygonPoints]);

  // Render circle + draggable center marker
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !window.google?.maps) return;

    circleOverlayRef.current?.setMap(null);
    centerMarkerRef.current?.setMap(null);
    circleOverlayRef.current = null;
    centerMarkerRef.current = null;

    if (zoneType !== "circle" || !center) return;

    centerMarkerRef.current = new google.maps.Marker({
      map,
      position: center,
      draggable: true,
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 7,
        fillColor: "#0F766E",
        fillOpacity: 1,
        strokeColor: "#fff",
        strokeWeight: 2,
      },
    });
    centerMarkerRef.current.addListener("dragend", (e: google.maps.MapMouseEvent) => {
      if (!e.latLng) return;
      stateRef.current.onCenterChange({ lat: e.latLng.lat(), lng: e.latLng.lng() });
    });

    circleOverlayRef.current = new google.maps.Circle({
      map,
      center,
      radius: Math.max(0.01, radiusKm) * 1000,
      strokeColor: "#0F766E",
      strokeOpacity: 0.9,
      strokeWeight: 2,
      fillColor: "#0F766E",
      fillOpacity: 0.12,
    });
  }, [zoneType, center, radiusKm]);

  if (!apiKey) {
    return (
      <div
        className={`bg-section rounded-xl w-full border border-border flex items-center justify-center text-xs font-bold text-muted-foreground p-4 text-center ${heightClass} ${className}`}
      >
        Map drawing unavailable — Google Maps API key not configured. Coordinates can still be entered manually below.
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-xl w-full border border-border relative overflow-hidden ${heightClass} ${className}`}>
      <div ref={containerRef} className="absolute inset-0 z-0" />
      <div className="absolute top-2 left-2 z-10 text-[10px] font-bold bg-white/95 text-muted-foreground px-2 py-1 rounded-lg border border-border">
        {zoneType === "polygon"
          ? `Click the map to add points (${polygonPoints.length} added, 3+ required)`
          : "Click the map to set the center, drag the pin to reposition"}
      </div>
    </div>
  );
}
