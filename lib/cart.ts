"use client";

import { calcBill, DELIVERY_FEE, PLATFORM_FEE, calcGst } from "@/lib/pricing";

export type LocalCartItem = {
  cart_item_id: string;
  restaurant_id: string;
  menu_item_id: string;
  name: string;
  price: number;
  quantity: number;
  subtotal: number;
  image?: string;
  isVeg?: boolean;
};

export type LocalCart = {
  items: LocalCartItem[];
  totalQuantity: number;
  subtotal: number;
  deliveryFee: number;
  platformFee: number;
  tax: number;
  total: number;
};

const CART_KEY = "foodiq_local_cart";

function emptyCart(): LocalCart {
  return {
    items: [],
    totalQuantity: 0,
    subtotal: 0,
    deliveryFee: 0,
    platformFee: 0,
    tax: 0,
    total: 0,
  };
}

function recompute(items: LocalCartItem[]): LocalCart {
  const normalized = items.filter((item) => item.quantity > 0);
  const totalQuantity = normalized.reduce((sum, i) => sum + i.quantity, 0);
  const subtotal = normalized.reduce((sum, i) => sum + (i.subtotal || i.price * i.quantity), 0);
  const bill = calcBill({ subtotal });
  return {
    items: normalized,
    totalQuantity,
    subtotal: bill.subtotal,
    deliveryFee: bill.deliveryFee,
    platformFee: bill.platformFee,
    tax: bill.tax,
    total: bill.grandTotal,
  };
}

export function getLocalCart(): LocalCart {
  if (typeof window === "undefined") {
    return emptyCart();
  }
  try {
    const raw = localStorage.getItem(CART_KEY);
    if (!raw) return emptyCart();
    const parsed = JSON.parse(raw);
    const items: LocalCartItem[] = Array.isArray(parsed.items) ? parsed.items : [];
    return recompute(items);
  } catch {
    return emptyCart();
  }
}

export function saveLocalCart(cartItems: LocalCartItem[]) {
  if (typeof window === "undefined") return;
  const payload = recompute(cartItems);
  localStorage.setItem(CART_KEY, JSON.stringify(payload));
  window.dispatchEvent(new CustomEvent("foodiq:cart-updated", { detail: payload }));
}

export function updateLocalCartQuantity(
  menuItemId: string,
  delta: number,
  itemDetails?: {
    restaurant_id?: string;
    name?: string;
    price?: number;
    image?: string;
    isVeg?: boolean;
  }
): LocalCart {
  const cart = getLocalCart();
  const existingIndex = cart.items.findIndex((i) => i.menu_item_id === menuItemId);

  if (existingIndex > -1) {
    const existing = cart.items[existingIndex];
    const newQty = existing.quantity + delta;
    if (newQty <= 0) {
      cart.items.splice(existingIndex, 1);
    } else {
      cart.items[existingIndex] = {
        ...existing,
        quantity: newQty,
        subtotal: existing.price * newQty,
      };
    }
  } else if (delta > 0) {
    const price = itemDetails?.price || 199;
    cart.items.push({
      cart_item_id: `cart_item_${menuItemId}_${Date.now()}`,
      restaurant_id: itemDetails?.restaurant_id || "rest_1",
      menu_item_id: menuItemId,
      name: itemDetails?.name || "Delicious Food Item",
      price,
      quantity: delta,
      subtotal: price * delta,
      image: itemDetails?.image,
      isVeg: itemDetails?.isVeg ?? true,
    });
  }

  saveLocalCart(cart.items);
  return getLocalCart();
}

export function clearLocalCart() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(CART_KEY);
  window.dispatchEvent(new CustomEvent("foodiq:cart-updated", { detail: emptyCart() }));
}

/** Legacy helpers for callers that still reference flat fee constants */
export { DELIVERY_FEE, PLATFORM_FEE, calcGst };
