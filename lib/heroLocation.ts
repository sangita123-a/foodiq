"use client";

import { POPULAR_RESTAURANTS_30 } from "@/lib/data/30restaurantsData";

export const HERO_LOCATIONS = [
  { label: "Hyderabad, Telangana", city: "Hyderabad" },
  { label: "Bengaluru, Karnataka", city: "Bengaluru" },
  { label: "Mumbai, Maharashtra", city: "Mumbai" },
  { label: "Delhi", city: "Delhi" },
  { label: "Chennai", city: "Chennai" },
  { label: "Kolkata", city: "Kolkata" },
  { label: "Pune", city: "Pune" },
  { label: "Bhubaneswar", city: "Bhubaneswar" },
  { label: "Visakhapatnam", city: "Visakhapatnam" },
] as const;

/** Short city keys used for restaurant catalog matching. */
export const HERO_CITIES = [
  "Hyderabad",
  "Bengaluru",
  "Mumbai",
  "Delhi",
  "Chennai",
  "Pune",
  "Kolkata",
  "Bhubaneswar",
  "Visakhapatnam",
] as const;

export type HeroCity = (typeof HERO_CITIES)[number];

/** Display location string (preset label or custom typed value). */
export type HeroLocation = string;

const STORAGE_KEY = "foodiq_selected_city";
const LOCATION_STORAGE_KEY = "foodiq_selected_location";

/** Cities that have restaurant catalog coverage. */
const CATALOG_CITIES = new Set<string>([
  "Hyderabad",
  "Bengaluru",
  "Mumbai",
  "Delhi",
  "Chennai",
  "Pune",
  "Kolkata",
]);

/** Map restaurant area labels to service cities for hero filtering. */
const AREA_TO_CITY: Record<string, HeroCity> = {
  "Jubilee Hills": "Hyderabad",
  "Old City": "Hyderabad",
  Indiranagar: "Bengaluru",
  Koramangala: "Bengaluru",
  "HSR Layout": "Bengaluru",
  Whitefield: "Bengaluru",
  "Frazer Town": "Bengaluru",
  "MG Road": "Bengaluru",
  Bandra: "Mumbai",
  "Bandra West": "Mumbai",
  Juhu: "Mumbai",
  Powai: "Mumbai",
  "Marine Drive": "Mumbai",
  Mylapore: "Chennai",
  "Kalyani Nagar": "Pune",
  "Park Street": "Kolkata",
  Ballygunge: "Kolkata",
  "Salt Lake": "Kolkata",
  "Connaught Place": "Delhi",
  "Vasant Kunj": "Delhi",
  "Vasant Vihar": "Delhi",
  "Karol Bagh": "Delhi",
  "Chandni Chowk": "Delhi",
  "Khan Market": "Delhi",
  "Cyber City": "Delhi",
  "Sector 18 Noida": "Delhi",
  Dharamsala: "Delhi",
  "Jaipur Highway": "Delhi",
  "Civil Lines": "Delhi",
};

export function getDefaultCity(): HeroCity {
  return "Hyderabad";
}

export function getDefaultLocation(): HeroLocation {
  return HERO_LOCATIONS[0].label;
}

export function isKnownHeroCity(value: string): value is HeroCity {
  return (HERO_CITIES as readonly string[]).includes(value);
}

/** Resolve a display location (or short city) to a filter city key. */
export function resolveCityKey(location: string): string {
  const trimmed = location.trim();
  if (!trimmed) return getDefaultCity();

  const preset = HERO_LOCATIONS.find(
    (loc) =>
      loc.label.toLowerCase() === trimmed.toLowerCase() ||
      loc.city.toLowerCase() === trimmed.toLowerCase()
  );
  if (preset) return preset.city;

  // "Hyderabad, Telangana" style custom paste of a known city
  const beforeComma = trimmed.split(",")[0]?.trim() || trimmed;
  if (isKnownHeroCity(beforeComma)) return beforeComma;

  return trimmed;
}

export function getStoredCity(): HeroCity {
  if (typeof window === "undefined") return getDefaultCity();
  try {
    const location = localStorage.getItem(LOCATION_STORAGE_KEY);
    if (location) {
      const key = resolveCityKey(location);
      if (isKnownHeroCity(key)) return key;
    }
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw && isKnownHeroCity(raw)) return raw;
  } catch {
    /* ignore */
  }
  return getDefaultCity();
}

export function getStoredLocation(): HeroLocation {
  if (typeof window === "undefined") return getDefaultLocation();
  try {
    const location = localStorage.getItem(LOCATION_STORAGE_KEY)?.trim();
    if (location) return location;
    const city = localStorage.getItem(STORAGE_KEY)?.trim();
    if (city) {
      const preset = HERO_LOCATIONS.find((loc) => loc.city === city);
      return preset?.label || city;
    }
  } catch {
    /* ignore */
  }
  return getDefaultLocation();
}

export function setStoredLocation(location: HeroLocation) {
  if (typeof window === "undefined") return;
  const trimmed = location.trim();
  if (!trimmed) return;

  const cityKey = resolveCityKey(trimmed);
  localStorage.setItem(LOCATION_STORAGE_KEY, trimmed);
  localStorage.setItem(STORAGE_KEY, cityKey);
  window.dispatchEvent(
    new CustomEvent("foodiq:city-updated", { detail: cityKey })
  );
  window.dispatchEvent(
    new CustomEvent("foodiq:location-updated", { detail: trimmed })
  );
}

/** @deprecated Prefer setStoredLocation — kept for callers that store short city names. */
export function setStoredCity(city: HeroCity | string) {
  const preset = HERO_LOCATIONS.find((loc) => loc.city === city);
  setStoredLocation(preset?.label || String(city));
}

export function getRestaurantCity(restaurantId: string): HeroCity {
  const restaurant = POPULAR_RESTAURANTS_30.find((r) => r.id === restaurantId);
  if (!restaurant) return getDefaultCity();
  return AREA_TO_CITY[restaurant.location] || getDefaultCity();
}

/**
 * Match restaurants to a selected location.
 * Unknown / custom cities (and cities without catalog coverage) skip hard filtering.
 */
export function restaurantMatchesCity(
  restaurantId: string,
  city: string
): boolean {
  const key = resolveCityKey(city);
  if (!CATALOG_CITIES.has(key)) return true;
  return getRestaurantCity(restaurantId) === key;
}

export function filterLocations(query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return [...HERO_LOCATIONS];
  return HERO_LOCATIONS.filter(
    (loc) =>
      loc.label.toLowerCase().includes(q) || loc.city.toLowerCase().includes(q)
  );
}
