"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

export type MapPoint = {
  lat: number;
  lng: number;
  label?: string;
};

type Props = {
  restaurant?: MapPoint | null;
  customer?: MapPoint | null;
  rider?: MapPoint | null;
  className?: string;
  heightClass?: string;
};

function makeIcon(color: string, glyph: string) {
  return L.divIcon({
    className: "",
    html: `<div style="
      width:36px;height:36px;border-radius:9999px;display:flex;align-items:center;justify-content:center;
      background:${color};color:#fff;font-size:14px;font-weight:800;
      box-shadow:0 4px 14px rgba(0,0,0,.25);border:2px solid #fff;
    ">${glyph}</div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  });
}

/**
 * Live OpenStreetMap (Leaflet) showing restaurant → rider → customer.
 */
export default function LiveTrackingMap({
  restaurant,
  customer,
  rider,
  className = "",
  heightClass = "h-[300px] md:h-[400px]",
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<{
    restaurant?: L.Marker;
    customer?: L.Marker;
    rider?: L.Marker;
    route?: L.Polyline;
  }>({});

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const center =
      rider ||
      restaurant ||
      customer ||
      ({ lat: 28.6139, lng: 77.209 } as MapPoint);

    const map = L.map(containerRef.current, {
      zoomControl: true,
      attributionControl: true,
    }).setView([center.lat, center.lng], 13);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>',
    }).addTo(map);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      markersRef.current = {};
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const pts: L.LatLngExpression[] = [];

    const upsert = (
      key: "restaurant" | "customer" | "rider",
      point: MapPoint | null | undefined,
      color: string,
      glyph: string
    ) => {
      if (!point || point.lat == null || point.lng == null) {
        if (markersRef.current[key]) {
          map.removeLayer(markersRef.current[key]!);
          markersRef.current[key] = undefined;
        }
        return;
      }
      const latlng: L.LatLngExpression = [point.lat, point.lng];
      pts.push(latlng);
      if (markersRef.current[key]) {
        markersRef.current[key]!.setLatLng(latlng);
      } else {
        markersRef.current[key] = L.marker(latlng, {
          icon: makeIcon(color, glyph),
          title: point.label || key,
        })
          .addTo(map)
          .bindTooltip(point.label || key, { permanent: false });
      }
    };

    upsert("restaurant", restaurant, "#6B7280", "R");
    upsert("customer", customer, "#FC8019", "H");
    upsert("rider", rider, "#111827", "🛵");

    // Route line restaurant → rider → customer (when available)
    const linePts: L.LatLngExpression[] = [];
    if (restaurant?.lat != null) linePts.push([restaurant.lat, restaurant.lng]);
    if (rider?.lat != null) linePts.push([rider.lat, rider.lng]);
    if (customer?.lat != null) linePts.push([customer.lat, customer.lng]);

    if (markersRef.current.route) {
      map.removeLayer(markersRef.current.route);
      markersRef.current.route = undefined;
    }
    if (linePts.length >= 2) {
      markersRef.current.route = L.polyline(linePts, {
        color: "#FC8019",
        weight: 4,
        opacity: 0.75,
        dashArray: "8 10",
      }).addTo(map);
    }

    if (pts.length > 0) {
      const bounds = L.latLngBounds(pts);
      map.fitBounds(bounds.pad(0.35), { animate: true, maxZoom: 15 });
    }
  }, [restaurant, customer, rider]);

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
        Live · OpenStreetMap
      </div>
    </div>
  );
}
