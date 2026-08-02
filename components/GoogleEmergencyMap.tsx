"use client";

import React, { useEffect, useRef } from "react";

interface GoogleEmergencyMapProps {
  riderLat: number;
  riderLng: number;
  restaurantLat?: number | null;
  restaurantLng?: number | null;
  customerAddress?: string | null;
  partnerName: string;
}

export default function GoogleEmergencyMap({
  riderLat,
  riderLng,
  restaurantLat,
  restaurantLng,
  partnerName,
}: GoogleEmergencyMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

    if (!mapRef.current) return;

    // Fallback if Google Maps script isn't dynamically loaded or key missing
    if (typeof window === "undefined" || !(window as any).google?.maps) {
      if (apiKey && !document.getElementById("google-maps-script")) {
        const script = document.createElement("script");
        script.id = "google-maps-script";
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
        script.async = true;
        script.onload = () => initMap();
        document.head.appendChild(script);
      }
      return;
    }

    initMap();

    function initMap() {
      if (!mapRef.current || !(window as any).google?.maps) return;
      const google = (window as any).google;

      const center = { lat: riderLat || 12.9716, lng: riderLng || 77.5946 };
      const map = new google.maps.Map(mapRef.current, {
        center,
        zoom: 14,
        styles: [
          { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
          { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
          { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
          {
            featureType: "administrative.locality",
            elementType: "labels.text.fill",
            stylers: [{ color: "#d59563" }],
          },
          {
            featureType: "poi",
            elementType: "labels.text.fill",
            stylers: [{ color: "#d59563" }],
          },
          {
            featureType: "road",
            elementType: "geometry",
            stylers: [{ color: "#38414e" }],
          },
          {
            featureType: "road",
            elementType: "geometry.stroke",
            stylers: [{ color: "#212a37" }],
          },
          {
            featureType: "road",
            elementType: "labels.text.fill",
            stylers: [{ color: "#9ca5b3" }],
          },
          {
            featureType: "water",
            elementType: "geometry",
            stylers: [{ color: "#17263c" }],
          },
        ],
      });

      // 1. Rider SOS Marker
      new google.maps.Marker({
        position: center,
        map,
        title: `Rider: ${partnerName}`,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 12,
          fillColor: "#ef4444",
          fillOpacity: 1,
          strokeWeight: 3,
          strokeColor: "#ffffff",
        },
      });

      // 2. Restaurant Marker (if available)
      if (restaurantLat && restaurantLng) {
        new google.maps.Marker({
          position: { lat: Number(restaurantLat), lng: Number(restaurantLng) },
          map,
          title: "Restaurant",
          icon: {
            path: google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
            scale: 7,
            fillColor: "#f59e0b",
            fillOpacity: 1,
            strokeWeight: 2,
            strokeColor: "#ffffff",
          },
        });
      }
    }
  }, [riderLat, riderLng, restaurantLat, restaurantLng, partnerName]);

  return (
    <div className="relative w-full h-full min-h-[300px] rounded-2xl overflow-hidden border border-slate-800 bg-slate-950">
      <div ref={mapRef} className="w-full h-full min-h-[300px]" />
      <div className="absolute top-3 left-3 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-700 text-xs font-semibold text-slate-200 flex items-center gap-2 shadow-lg">
        <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
        <span>Rider SOS: {partnerName}</span>
      </div>
    </div>
  );
}
