"use client";

import { useEffect, useMemo, useState } from "react";
import Cookies from "js-cookie";
import useSWR from "swr";
import api from "@/services/api";
import { useToast } from "@/contexts/ToastContext";

export function useFavoriteActions() {
  const { showToast } = useToast();
  const [authenticated, setAuthenticated] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    setAuthenticated(Boolean(Cookies.get("token")));
  }, []);

  const { data, mutate } = useSWR(authenticated ? "/api/favorites" : null);
  const itemIds = useMemo(
    () => new Set<string>((data?.items || []).map((item: any) => item.menu_item_id || item.id)),
    [data]
  );
  const restaurantIds = useMemo(
    () => new Set<string>((data?.restaurants || []).map((item: any) => item.restaurant_id || item.id)),
    [data]
  );

  const toggleItem = async (id: string) => {
    if (!Cookies.get("token")) {
      showToast("Please login to save favorites", "error");
      return;
    }
    try {
      setUpdatingId(id);
      if (itemIds.has(id)) await api.delete(`/api/favorites/${id}`);
      else await api.post(`/api/favorites/${id}`);
      await mutate();
      showToast(itemIds.has(id) ? "Removed from favorites" : "Added to favorites", "success");
    } catch (error: any) {
      showToast(error.response?.data?.message || "Could not update favorites", "error");
    } finally {
      setUpdatingId(null);
    }
  };

  const toggleRestaurant = async (id: string) => {
    if (!Cookies.get("token")) {
      showToast("Please login to save restaurants", "error");
      return;
    }
    try {
      setUpdatingId(id);
      if (restaurantIds.has(id)) await api.delete(`/api/favorites/restaurants/${id}`);
      else await api.post(`/api/favorites/restaurants/${id}`);
      await mutate();
      showToast(restaurantIds.has(id) ? "Restaurant removed from favorites" : "Restaurant saved", "success");
    } catch (error: any) {
      showToast(error.response?.data?.message || "Could not update favorites", "error");
    } finally {
      setUpdatingId(null);
    }
  };

  return { itemIds, restaurantIds, updatingId, toggleItem, toggleRestaurant };
}
