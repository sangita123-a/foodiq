"use client";

const FAVORITES_KEY = "foodiq_local_favorites";

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

export function saveLocalFavoriteIds(ids: string[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(ids));
  window.dispatchEvent(new CustomEvent("foodiq:favorites-updated", { detail: ids }));
}

export function toggleLocalFavorite(id: string): boolean {
  const ids = getLocalFavoriteIds();
  const exists = ids.includes(id);
  const next = exists ? ids.filter((itemId) => itemId !== id) : [...ids, id];
  saveLocalFavoriteIds(next);
  return !exists;
}

export function isLocalFavorite(id: string): boolean {
  return getLocalFavoriteIds().includes(id);
}
