"use client";

import dynamic from "next/dynamic";
import { getGoogleMapsApiKey } from "@/lib/googleMaps";
import type { MapPoint } from "./LiveTrackingMap";

const LiveTrackingMap = dynamic(() => import("./LiveTrackingMap"), { ssr: false });
const GoogleTrackingMap = dynamic(() => import("./GoogleTrackingMap"), { ssr: false });

type Props = {
  restaurant?: MapPoint | null;
  customer?: MapPoint | null;
  rider?: MapPoint | null;
  className?: string;
  heightClass?: string;
};

/** Prefer Google Maps when API key is configured; otherwise OpenStreetMap/Leaflet. */
export default function UnifiedTrackingMap(props: Props) {
  const useGoogle = Boolean(getGoogleMapsApiKey());
  if (useGoogle) {
    return <GoogleTrackingMap {...props} />;
  }
  return <LiveTrackingMap {...props} />;
}
