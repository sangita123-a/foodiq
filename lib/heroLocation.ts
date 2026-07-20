"use client";

import { POPULAR_RESTAURANTS_30 } from "@/lib/data/30restaurantsData";

export const HERO_CITIES = [
  "Hyderabad",
  "Bengaluru",
  "Mumbai",
  "Delhi",
  "Chennai",
  "Pune",
  "Kolkata",
] as const;

export type HeroCity = (typeof HERO_CITIES)[number];

const STORAGE_KEY = "foodiq_selected_city";

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

export function getStoredCity(): HeroCity {
  if (typeof window === "undefined") return getDefaultCity();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw && HERO_CITIES.includes(raw as HeroCity)) return raw as HeroCity;
  } catch {
    /* ignore */
  }
  return getDefaultCity();
}

export function setStoredCity(city: HeroCity) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, city);
  window.dispatchEvent(new CustomEvent("foodiq:city-updated", { detail: city }));
}

export function getRestaurantCity(restaurantId: string): HeroCity {
  const restaurant = POPULAR_RESTAURANTS_30.find((r) => r.id === restaurantId);
  if (!restaurant) return getDefaultCity();
  return AREA_TO_CITY[restaurant.location] || getDefaultCity();
}

export function restaurantMatchesCity(restaurantId: string, city: HeroCity): boolean {
  return getRestaurantCity(restaurantId) === city;
}
