"use client";

import { useEffect, useMemo, useState } from "react";
import Cookies from "js-cookie";
import useSWR, { mutate as globalMutate } from "swr";
import api from "@/services/api";
import { useToast } from "@/contexts/ToastContext";

type CartItem = {
  cart_item_id: string;
  menu_item_id: string;
  quantity: number;
};

export function useCartActions() {
  const { showToast } = useToast();
  const [authenticated, setAuthenticated] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    setAuthenticated(Boolean(Cookies.get("token")));
  }, []);

  const { data: cart, mutate } = useSWR(authenticated ? "/api/cart" : null);
  const items: CartItem[] = cart?.items || [];
  const quantities = useMemo(
    () => new Map(items.map((item) => [item.menu_item_id, item.quantity])),
    [items]
  );

  const updateQuantity = async (menuItemId: string, delta: number) => {
    if (!Cookies.get("token")) {
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
      } else if (!existing && quantity > 0) {
        await api.post("/api/cart/add", { menu_item_id: menuItemId, quantity });
        showToast("Item Added Successfully", "success");
      } else if (existing && quantity > 0) {
        await api.put(`/api/cart/update/${existing.cart_item_id}`, { quantity });
      }
      await Promise.all([mutate(), globalMutate("/api/cart")]);
      return true;
    } catch (error: any) {
      showToast(error.response?.data?.message || "Could not update your cart", "error");
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
