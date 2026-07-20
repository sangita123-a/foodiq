"use client";

import { TRENDING_DISHES_60 } from "@/lib/data/30restaurantsData";
import { getCategoryDishById } from "@/lib/data/categoryData";
import { getCollectionDishById } from "@/lib/data/collectionsData";

const FAVORITES_KEY = "foodiq_local_favorites";
const FAVORITES_META_KEY = "foodiq_local_favorites_meta";

export type LocalFavoriteDishMeta = {
  id: string;
  name: string;
  restaurant: string;
  image: string;
  price: number;
  rating: string;
  isVeg: boolean;
};

export function getLocalFavoriteIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((id) => typeof id === "string") : [];
  } catch {
    return [];
  }
}

function getLocalFavoriteMetaMap(): Record<string, LocalFavoriteDishMeta> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(FAVORITES_META_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function saveLocalFavoriteMetaMap(map: Record<string, LocalFavoriteDishMeta>) {
  if (typeof window === "undefined") return;
  localStorage.setItem(FAVORITES_META_KEY, JSON.stringify(map));
}

export function saveLocalFavoriteIds(ids: string[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(ids));
  window.dispatchEvent(new CustomEvent("foodiq:favorites-updated", { detail: ids }));
}

export function toggleLocalFavorite(
  id: string,
  meta?: Omit<LocalFavoriteDishMeta, "id">
): boolean {
  const ids = getLocalFavoriteIds();
  const exists = ids.includes(id);
  const next = exists ? ids.filter((itemId) => itemId !== id) : [...ids, id];
  saveLocalFavoriteIds(next);

  const metaMap = getLocalFavoriteMetaMap();
  if (exists) {
    delete metaMap[id];
  } else if (meta) {
    metaMap[id] = { id, ...meta };
  }
  saveLocalFavoriteMetaMap(metaMap);

  return !exists;
}

export function isLocalFavorite(id: string): boolean {
  return getLocalFavoriteIds().includes(id);
}

export function resolveLocalFavoriteDishes(): LocalFavoriteDishMeta[] {
  const ids = getLocalFavoriteIds();
  const metaMap = getLocalFavoriteMetaMap();

  return ids
    .map((id) => {
      if (metaMap[id]) return metaMap[id];

      const trending = TRENDING_DISHES_60.find((d) => d.id === id);
      if (trending) {
        return {
          id,
          name: trending.name,
          restaurant: trending.restaurantName,
          image: trending.image,
          price: trending.price,
          rating: trending.rating,
          isVeg: trending.isVeg,
        };
      }

      const category = getCategoryDishById(id);
      if (category) {
        return {
          id,
          name: category.name,
          restaurant: category.restaurantName,
          image: category.image,
          price: category.price,
          rating: category.rating,
          isVeg: category.isVeg,
        };
      }

      const collection = getCollectionDishById(id);
      if (collection) {
        return {
          id,
          name: collection.name,
          restaurant: collection.restaurantName,
          image: collection.image,
          price: collection.price,
          rating: collection.rating,
          isVeg: collection.isVeg,
        };
      }

      return null;
    })
    .filter((d): d is LocalFavoriteDishMeta => d !== null);
}
