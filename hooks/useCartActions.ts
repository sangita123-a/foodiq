"use client";

import { useMemo, useState } from "react";
import useSWR, { mutate as globalMutate } from "swr";
import api from "@/services/api";
import { useToast } from "@/contexts/ToastContext";
import { useAuthToken } from "@/hooks/useAuthToken";

type CartItem = {
  cart_item_id: string;
  menu_item_id: string;
  quantity: number;
};

export function useCartActions() {
  const { showToast } = useToast();
  const authenticated = useAuthToken();
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const { data: cart, mutate } = useSWR(authenticated ? "/api/cart" : null);
  const cartObj = (cart as any)?.data || cart;
  const items: CartItem[] = useMemo(() => cartObj?.items || [], [cartObj?.items]);
  const quantities = useMemo(
    () => new Map(items.map((item) => [item.menu_item_id, item.quantity])),
    [items]
  );

  const updateQuantity = async (menuItemId: string, delta: number) => {
    if (!authenticated) {
      showToast("Please login to add items to your cart", "error");
      return false;
    }
    if (updatingId) return false;

    const existing = items.find((item) => item.menu_item_id === menuItemId);
    const quantity = (existing?.quantity || 0) + delta;
    try {
      setUpdatingId(menuItemId);
      if (quantity <= 0 && existing) {
        await api.delete(`/api/cart/remove/${existing.cart_item_id}`);
        void import("@/lib/analytics/events").then(({ AnalyticsEvents, trackEvent }) => {
          trackEvent(AnalyticsEvents.removeFromCart, {
            item_id: menuItemId,
            quantity: existing.quantity,
          });
        });
      } else if (!existing && quantity > 0) {
        await api.post("/api/cart/add", { menu_item_id: menuItemId, quantity });
        showToast("Item Added Successfully", "success");
        void import("@/lib/analytics/events").then(({ AnalyticsEvents, trackEvent }) => {
          trackEvent(AnalyticsEvents.addToCart, {
            item_id: menuItemId,
            quantity,
          });
        });
      } else if (existing && quantity > 0) {
        await api.put(`/api/cart/update/${existing.cart_item_id}`, { quantity });
        if (delta < 0) {
          void import("@/lib/analytics/events").then(({ AnalyticsEvents, trackEvent }) => {
            trackEvent(AnalyticsEvents.removeFromCart, {
              item_id: menuItemId,
              quantity: 1,
            });
          });
        } else if (delta > 0) {
          void import("@/lib/analytics/events").then(({ AnalyticsEvents, trackEvent }) => {
            trackEvent(AnalyticsEvents.addToCart, {
              item_id: menuItemId,
              quantity: delta,
            });
          });
        }
      }
      await Promise.all([mutate(), globalMutate("/api/cart")]);
      return true;
    } catch (error: unknown) {
      const message =
        error && typeof error === "object" && "response" in error
          ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      showToast(message || "Could not update your cart", "error");
      return false;
    } finally {
      setUpdatingId(null);
    }
  };

  const addAndCheckout = async (menuItemId: string, router: { push: (path: string) => void }) => {
    const added = await updateQuantity(menuItemId, 1);
    if (added) router.push("/checkout");
  };

  return {
    authenticated,
    cart,
    quantities,
    updatingId,
    updateQuantity,
    addAndCheckout,
  };
}
