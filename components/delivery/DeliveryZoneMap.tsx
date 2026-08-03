"use client";

import { useEffect, useRef } from "react";
import { getGoogleMapsApiKey, loadGoogleMapsScript } from "@/lib/googleMaps";
import type { DeliveryZone } from "@/services/zonesApi";

type LatLng = { lat: number; lng: number };

type RiderPoint = {
  lat: number;
  lng: number;
  heading?: number | null;
  accuracy?: number | null;
};

type RestaurantPoint = {
  id: string;
  name: string;
  lat: number;
  lng: number;
};

type Props = {
  zones: DeliveryZone[];
  activeZoneId?: string | null;
  rider?: RiderPoint | null;
  restaurants?: RestaurantPoint[];
  breadcrumb?: LatLng[];
  className?: string;
  heightClass?: string;
};

/** Normalizes a stored zone polygon (GeoJSON or raw point array) into google.maps LatLng-literal points. */
function normalizePolygonPoints(polygon: unknown): LatLng[] {
  if (!polygon) return [];
  const raw =
    typeof polygon === "object" && polygon !== null && "coordinates" in (polygon as Record<string, unknown>)
      ? (polygon as { coordinates?: unknown[][] }).coordinates?.[0]
      : (polygon as unknown[]);

  if (!Array.isArray(raw)) return [];

  return raw
    .map((pt): LatLng | null => {
      if (Array.isArray(pt)) {
        const [lng, lat] = pt as [number, number];
        if (typeof lat !== "number" || typeof lng !== "number") return null;
        return { lat, lng };
      }
      if (pt && typeof pt === "object") {
        const obj = pt as { lat?: number; lng?: number; latitude?: number; longitude?: number };
        const lat = obj.lat ?? obj.latitude;
        const lng = obj.lng ?? obj.longitude;
        if (typeof lat !== "number" || typeof lng !== "number") return null;
        return { lat, lng };
      }
      return null;
    })
    .filter((pt): pt is LatLng => pt !== null);
}

/**
 * Live geo-fencing map: renders assigned/nearby zone boundaries (polygon or circle),
 * the rider's live position with heading + GPS accuracy, and a trailing breadcrumb path.
 */
export default function DeliveryZoneMap({
  zones,
  activeZoneId = null,
  rider = null,
  restaurants = [],
  breadcrumb = [],
  className = "",
  heightClass = "h-[320px] md:h-[420px]",
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const zoneOverlaysRef = useRef<Array<google.maps.Polygon | google.maps.Circle>>([]);
  const riderMarkerRef = useRef<google.maps.Marker | null>(null);
  const accuracyCircleRef = useRef<google.maps.Circle | null>(null);
  const restaurantMarkersRef = useRef<google.maps.Marker[]>([]);
  const pathRef = useRef<google.maps.Polyline | null>(null);
  const apiKey = getGoogleMapsApiKey();

  useEffect(() => {
    if (!apiKey || !containerRef.current || mapRef.current) return;
    let cancelled = false;

    loadGoogleMapsScript(apiKey).then((loaded) => {
      if (!loaded || cancelled || !containerRef.current || !window.google?.maps) return;
      const center = rider || zones[0]
        ? { lat: rider?.lat ?? zones[0].center_latitude ?? 20.5937, lng: rider?.lng ?? zones[0].center_longitude ?? 78.9629 }
        : { lat: 20.5937, lng: 78.9629 };

      mapRef.current = new google.maps.Map(containerRef.current, {
        center,
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiKey]);

  // Render zone boundary overlays
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !window.google?.maps) return;

    zoneOverlaysRef.current.forEach((overlay) => overlay.setMap(null));
    zoneOverlaysRef.current = [];

    const bounds = new google.maps.LatLngBounds();
    let hasBounds = false;

    zones.forEach((zone) => {
      const isActive = zone.id === activeZoneId;
      const strokeColor = isActive ? "#0F766E" : "#94A3B8";
      const fillColor = isActive ? "#0F766E" : "#94A3B8";

      if (zone.zone_type === "circle" && zone.center_latitude != null && zone.center_longitude != null && zone.radius_km) {
        const center = { lat: zone.center_latitude, lng: zone.center_longitude };
        const circle = new google.maps.Circle({
          map,
          center,
          radius: zone.radius_km * 1000,
          strokeColor,
          strokeOpacity: 0.9,
          strokeWeight: isActive ? 3 : 1.5,
          fillColor,
          fillOpacity: isActive ? 0.12 : 0.05,
        });
        zoneOverlaysRef.current.push(circle);
        bounds.extend(center);
        hasBounds = true;
      } else if (zone.zone_type === "polygon") {
        const points = normalizePolygonPoints(zone.polygon);
        if (points.length >= 3) {
          const polygon = new google.maps.Polygon({
            map,
            paths: points,
            strokeColor,
            strokeOpacity: 0.9,
            strokeWeight: isActive ? 3 : 1.5,
            fillColor,
            fillOpacity: isActive ? 0.12 : 0.05,
          });
          zoneOverlaysRef.current.push(polygon);
          points.forEach((pt) => bounds.extend(pt));
          hasBounds = true;
        }
      }
    });

    if (hasBounds && !rider) {
      map.fitBounds(bounds, 48);
    }
  }, [zones, activeZoneId, rider]);

  // Rider marker + accuracy circle
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !window.google?.maps) return;

    if (!rider) {
      riderMarkerRef.current?.setMap(null);
      riderMarkerRef.current = null;
      accuracyCircleRef.current?.setMap(null);
      accuracyCircleRef.current = null;
      return;
    }

    const pos = { lat: rider.lat, lng: rider.lng };

    if (riderMarkerRef.current) {
      riderMarkerRef.current.setPosition(pos);
      riderMarkerRef.current.setIcon({
        path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
        scale: 6,
        rotation: rider.heading ?? 0,
        fillColor: "#111827",
        fillOpacity: 1,
        strokeColor: "#fff",
        strokeWeight: 2,
      } as google.maps.Symbol);
    } else {
      riderMarkerRef.current = new google.maps.Marker({
        map,
        position: pos,
        title: "You",
        icon: {
          path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
          scale: 6,
          rotation: rider.heading ?? 0,
          fillColor: "#111827",
          fillOpacity: 1,
          strokeColor: "#fff",
          strokeWeight: 2,
        } as google.maps.Symbol,
      });
      map.panTo(pos);
    }

    if (rider.accuracy && rider.accuracy > 0) {
      if (accuracyCircleRef.current) {
        accuracyCircleRef.current.setCenter(pos);
        accuracyCircleRef.current.setRadius(rider.accuracy);
      } else {
        accuracyCircleRef.current = new google.maps.Circle({
          map,
          center: pos,
          radius: rider.accuracy,
          strokeColor: "#3B82F6",
          strokeOpacity: 0.4,
          strokeWeight: 1,
          fillColor: "#3B82F6",
          fillOpacity: 0.08,
        });
      }
    } else {
      accuracyCircleRef.current?.setMap(null);
      accuracyCircleRef.current = null;
    }
  }, [rider]);

  // Restaurant markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !window.google?.maps) return;

    restaurantMarkersRef.current.forEach((m) => m.setMap(null));
    restaurantMarkersRef.current = restaurants.map(
      (r) =>
        new google.maps.Marker({
          map,
          position: { lat: r.lat, lng: r.lng },
          title: r.name,
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 6,
            fillColor: "#6B7280",
            fillOpacity: 1,
            strokeColor: "#fff",
            strokeWeight: 1.5,
          },
        })
    );
  }, [restaurants]);

  // Live breadcrumb path
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !window.google?.maps) return;

    pathRef.current?.setMap(null);
    if (breadcrumb.length >= 2) {
      pathRef.current = new google.maps.Polyline({
        map,
        path: breadcrumb,
        geodesic: true,
        strokeColor: "#0F766E",
        strokeOpacity: 0.7,
        strokeWeight: 3,
      });
    }
  }, [breadcrumb]);

  if (!apiKey) {
    return (
      <div
        className={`bg-section rounded-2xl w-full border border-border flex items-center justify-center text-xs font-bold text-gray-text ${heightClass} ${className}`}
      >
        Live map unavailable — Google Maps API key not configured.
      </div>
    );
  }

  return (
    <div
      className={`bg-white rounded-2xl w-full border border-border relative overflow-hidden ${heightClass} ${className}`}
    >
      <div ref={containerRef} className="absolute inset-0 z-0" />
      {!rider && zones.length === 0 && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-section/80 text-sm font-bold text-gray-text">
          Waiting for zone data…
        </div>
      )}
      <div className="absolute bottom-3 right-3 z-10 text-[10px] font-bold uppercase tracking-widest bg-white/90 text-gray-text px-2 py-1 rounded-lg border border-border">
        Live · Google Maps
      </div>
    </div>
  );
}
