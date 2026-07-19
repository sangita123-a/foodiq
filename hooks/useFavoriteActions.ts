"use client";

import { useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import api from "@/services/api";
import { useToast } from "@/contexts/ToastContext";
import { useAuthToken } from "@/hooks/useAuthToken";
import { isCategoryDishId } from "@/lib/data/categoryData";
import { isCollectionDishId } from "@/lib/data/collectionsData";
import { getLocalFavoriteIds, toggleLocalFavorite } from "@/lib/favorites";

export function useFavoriteActions() {
  const { showToast } = useToast();
  const authenticated = useAuthToken();
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [localFavoriteIds, setLocalFavoriteIds] = useState<string[]>([]);

  useEffect(() => {
    setLocalFavoriteIds(getLocalFavoriteIds());
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<string[]>).detail;
      setLocalFavoriteIds(Array.isArray(detail) ? detail : getLocalFavoriteIds());
    };
    window.addEventListener("foodiq:favorites-updated", handler);
    return () => window.removeEventListener("foodiq:favorites-updated", handler);
  }, []);

  const { data, mutate } = useSWR(authenticated ? "/api/favorites" : null);
  const dataObj = (data as any)?.data || data;
  const apiItemIds = useMemo(
    () =>
      new Set<string>(
        (dataObj?.items || (Array.isArray(dataObj) ? dataObj : [])).map(
          (item: { menu_item_id?: string; id?: string }) => item.menu_item_id || item.id || ""
        )
      ),
    [dataObj]
  );
  const itemIds = useMemo(() => {
    const merged = new Set(apiItemIds);
    localFavoriteIds.forEach((id) => merged.add(id));
    return merged;
  }, [apiItemIds, localFavoriteIds]);
  const restaurantIds = useMemo(
    () =>
      new Set<string>(
        (dataObj?.restaurants || []).map(
          (item: { restaurant_id?: string; id?: string }) => item.restaurant_id || item.id || ""
        )
      ),
    [dataObj]
  );

  const toggleItem = async (id: string) => {
    if (isCategoryDishId(id) || isCollectionDishId(id)) {
      const added = toggleLocalFavorite(id);
      setLocalFavoriteIds(getLocalFavoriteIds());
      showToast(added ? "Added to favorites" : "Removed from favorites", "success");
      return;
    }

    if (!authenticated) {
      showToast("Please login to save favorites", "error");
      return;
    }
    try {
      setUpdatingId(id);
      if (itemIds.has(id)) await api.delete(`/api/favorites/${id}`);
      else await api.post(`/api/favorites/${id}`);
      await mutate();
      showToast(itemIds.has(id) ? "Removed from favorites" : "Added to favorites", "success");
    } catch (error: unknown) {
      const message =
        error && typeof error === "object" && "response" in error
          ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      showToast(message || "Could not update favorites", "error");
    } finally {
      setUpdatingId(null);
    }
  };

  const toggleRestaurant = async (id: string) => {
    if (!authenticated) {
      showToast("Please login to save restaurants", "error");
      return;
    }
    try {
      setUpdatingId(id);
      if (restaurantIds.has(id)) await api.delete(`/api/favorites/restaurants/${id}`);
      else await api.post(`/api/favorites/restaurants/${id}`);
      await mutate();
      showToast(restaurantIds.has(id) ? "Restaurant removed from favorites" : "Restaurant saved", "success");
    } catch (error: unknown) {
      const message =
        error && typeof error === "object" && "response" in error
          ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      showToast(message || "Could not update favorites", "error");
    } finally {
      setUpdatingId(null);
    }
  };

  return { itemIds, restaurantIds, updatingId, toggleItem, toggleRestaurant };
}
