import { LatLng, TurnInstruction } from "./types";

/**
 * Calculates Haversine distance in kilometers between two lat/lng points.
 */
export function haversineDistanceKm(p1: LatLng, p2: LatLng): number {
  const R = 6371; // Earth radius in km
  const dLat = ((p2.lat - p1.lat) * Math.PI) / 180;
  const dLng = ((p2.lng - p1.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((p1.lat * Math.PI) / 180) *
      Math.cos((p2.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Estimate travel time in minutes based on distance and average city driving speed (~25 km/h).
 */
export function estimateDurationMin(distanceKm: number, speedKmH = 25): number {
  if (distanceKm <= 0) return 0;
  return Math.max(1, Math.round((distanceKm / speedKmH) * 60));
}

/**
 * Encodes array of LatLng into polyline string (simplified format for SVG/map rendering).
 */
export function encodeCoordinatesToPolyline(points: LatLng[]): string {
  return points.map((p) => `${p.lat.toFixed(6)},${p.lng.toFixed(6)}`).join(";");
}

/**
 * Decodes polyline string back to LatLng array.
 */
export function decodePolylineToCoordinates(polylineStr: string): LatLng[] {
  if (!polylineStr) return [];
  if (polylineStr.includes(";")) {
    return polylineStr
      .split(";")
      .map((pair) => {
        const [latStr, lngStr] = pair.split(",");
        const lat = parseFloat(latStr);
        const lng = parseFloat(lngStr);
        return !isNaN(lat) && !isNaN(lng) ? { lat, lng } : null;
      })
      .filter((p): p is LatLng => p !== null);
  }
  return [];
}

export interface OsrmRouteResult {
  distanceKm: number;
  durationMin: number;
  coordinates: LatLng[];
  polyline: string;
  turnInstructions: TurnInstruction[];
}

/**
 * Fetch directions from OSRM public routing API with graceful fallback to Haversine straight line path.
 */
export async function fetchOsrmDirections(points: LatLng[]): Promise<OsrmRouteResult> {
  if (points.length < 2) {
    return {
      distanceKm: 0,
      durationMin: 0,
      coordinates: points,
      polyline: encodeCoordinatesToPolyline(points),
      turnInstructions: [],
    };
  }

  // Calculate direct fallback first
  let totalDistance = 0;
  for (let i = 0; i < points.length - 1; i++) {
    totalDistance += haversineDistanceKm(points[i], points[i + 1]);
  }
  const fallbackDuration = estimateDurationMin(totalDistance);

  // Try OSRM demo server
  try {
    const coordsString = points.map((p) => `${p.lng},${p.lat}`).join(";");
    const url = `https://router.project-osrm.org/route/v1/driving/${coordsString}?overview=full&geometries=geojson&steps=true`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000); // 4 second timeout

    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data.code === "Ok" && data.routes && data.routes[0]) {
        const route = data.routes[0];
        const distKm = Math.round((route.distance / 1000) * 10) / 10;
        const durMin = Math.round(route.duration / 60);

        const coords: LatLng[] = (route.geometry?.coordinates || []).map((c: [number, number]) => ({
          lat: c[1],
          lng: c[0],
        }));

        const instructions: TurnInstruction[] = [];
        if (route.legs) {
          for (const leg of route.legs) {
            for (const step of leg.steps || []) {
              if (step.maneuver) {
                instructions.push({
                  instruction: `${step.maneuver.type} ${step.name ? `onto ${step.name}` : ""}`.trim(),
                  distanceKm: Math.round((step.distance / 1000) * 10) / 10,
                  durationMin: Math.round(step.duration / 60),
                  type: step.maneuver.type,
                  location: {
                    lat: step.maneuver.location[1],
                    lng: step.maneuver.location[0],
                  },
                });
              }
            }
          }
        }

        return {
          distanceKm: distKm,
          durationMin: durMin,
          coordinates: coords.length > 0 ? coords : points,
          polyline: encodeCoordinatesToPolyline(coords.length > 0 ? coords : points),
          turnInstructions: instructions,
        };
      }
    }
  } catch {
    // Network / timeout error fallback
  }

  // Generate turn-by-turn fallback instructions
  const fallbackInstructions: TurnInstruction[] = [];
  for (let i = 0; i < points.length - 1; i++) {
    const legDist = haversineDistanceKm(points[i], points[i + 1]);
    const legDur = estimateDurationMin(legDist);
    fallbackInstructions.push({
      instruction: i === 0 ? "Head toward first stop" : `Proceed to waypoint ${i + 1}`,
      distanceKm: Math.round(legDist * 10) / 10,
      durationMin: legDur,
      type: "depart",
      location: points[i],
    });
  }

  return {
    distanceKm: Math.round(totalDistance * 10) / 10,
    durationMin: fallbackDuration,
    coordinates: points,
    polyline: encodeCoordinatesToPolyline(points),
    turnInstructions: fallbackInstructions,
  };
}
