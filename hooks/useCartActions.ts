"use client";

import { useEffect, useMemo, useState } from "react";
import useSWR, { mutate as globalMutate } from "swr";
import api from "@/services/api";
import { useToast } from "@/contexts/ToastContext";
import { useAuthToken } from "@/hooks/useAuthToken";
import { getLocalCart, updateLocalCartQuantity, LocalCartItem } from "@/lib/cart";

export function useCartActions() {
  const { showToast } = useToast();
  const authenticated = useAuthToken();
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [localCart, setLocalCart] = useState(getLocalCart());

  // Listen for local cart updates across tabs/components
  useEffect(() => {
    setLocalCart(getLocalCart());
    const handler = (e: any) => {
      if (e.detail) {
        setLocalCart(e.detail);
      } else {
        setLocalCart(getLocalCart());
      }
    };
    window.addEventListener("foodiq:cart-updated", handler);
    return () => window.removeEventListener("foodiq:cart-updated", handler);
  }, []);

  const { data: apiCart, mutate } = useSWR(authenticated ? "/api/cart" : null);
  const apiCartObj = (apiCart as any)?.data || apiCart;
  const apiItems: any[] = useMemo(() => apiCartObj?.items || [], [apiCartObj?.items]);

  // Combine local and API items
  const items: LocalCartItem[] = useMemo(() => {
    if (authenticated && apiItems.length > 0) {
      return apiItems.map((item) => ({
        cart_item_id: String(item.cart_item_id || item.id),
        restaurant_id: String(item.restaurant_id || "rest_1"),
        menu_item_id: String(item.menu_item_id || item.id),
        name: item.name || "Dish Item",
        price: Number(item.price || 199),
        quantity: Number(item.quantity || 1),
        subtotal: Number(item.subtotal || item.price * item.quantity),
        image: item.image_url || item.image,
        isVeg: item.is_veg ?? true,
      }));
    }
    return localCart.items;
  }, [authenticated, apiItems, localCart.items]);

  const quantities = useMemo(
    () => new Map(items.map((item) => [item.menu_item_id, item.quantity])),
    [items]
  );

  const totalQuantity = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items]
  );

  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + (item.subtotal || item.price * item.quantity), 0),
    [items]
  );

  const updateQuantity = async (
    menuItemId: string,
    delta: number,
    itemDetails?: {
      restaurant_id?: string;
      name?: string;
      price?: number;
      image?: string;
      isVeg?: boolean;
    }
  ) => {
    if (updatingId) return false;

    try {
      setUpdatingId(menuItemId);
      const existing = items.find((item) => item.menu_item_id === menuItemId);
      const newQty = (existing?.quantity || 0) + delta;

      // Always update local cart first for instant UI response
      const updatedLocal = updateLocalCartQuantity(menuItemId, delta, itemDetails);
      setLocalCart(updatedLocal);

      if (delta > 0 && !existing) {
        showToast("Added to Cart", "success");
      }

      // If authenticated, sync with backend in background
      if (authenticated) {
        try {
          if (newQty <= 0 && existing?.cart_item_id) {
            await api.delete(`/api/cart/remove/${existing.cart_item_id}`);
          } else if (!existing && newQty > 0) {
            await api.post("/api/cart/add", { menu_item_id: menuItemId, quantity: newQty });
          } else if (existing?.cart_item_id && newQty > 0) {
            await api.put(`/api/cart/update/${existing.cart_item_id}`, { quantity: newQty });
          }
          await Promise.all([mutate(), globalMutate("/api/cart")]);
        } catch (_) {
          // Fallback to local storage cart on backend error
        }
      }

      return true;
    } catch (error: unknown) {
      showToast("Could not update cart", "error");
      return false;
    } finally {
      setUpdatingId(null);
    }
  };

  const addAndCheckout = async (
    menuItemId: string,
    router: { push: (path: string) => void },
    itemDetails?: any
  ) => {
    await updateQuantity(menuItemId, 1, itemDetails);
    router.push("/checkout");
  };

  return {
    authenticated,
    cart: { items, totalQuantity, subtotal },
    items,
    quantities,
    totalQuantity,
    subtotal,
    updatingId,
    updateQuantity,
    addAndCheckout,
  };
}
