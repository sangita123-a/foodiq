"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import useSWR, { mutate as globalMutate } from "swr";
import { Minus, Plus, ShoppingBag, Tag, Trash2, X } from "lucide-react";
import api from "@/services/api";
import { useToast } from "@/contexts/ToastContext";
import SafeImage from "@/components/ui/SafeImage";
import { FOOD_FALLBACK, getFoodImage } from "@/lib/images";

type CartDrawerProps = {
  open: boolean;
  onClose: () => void;
};

export default function CartDrawer({ open, onClose }: CartDrawerProps) {
  const { data, mutate } = useSWR(open ? "/api/cart" : null);
  const { showToast } = useToast();
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [couponCode, setCouponCode] = useState("");
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponError, setCouponError] = useState("");

  const items = data?.items || [];
  const totals = data?.totals || {
    subtotal: 0,
    deliveryCharge: 0,
    tax: 0,
    discount: 0,
    grandTotal: 0,
  };
  const discount = (Number(totals.discount) || 0) + couponDiscount;
  const grandTotal =
    Number(totals.subtotal) + Number(totals.deliveryCharge) + Number(totals.tax) - discount;

  const refresh = async () => {
    await Promise.all([mutate(), globalMutate("/api/cart")]);
  };

  const updateQuantity = async (cartItemId: string, quantity: number) => {
    if (updatingId) return;
    try {
      setUpdatingId(cartItemId);
      if (quantity < 1) {
        await api.delete(`/api/cart/remove/${cartItemId}`);
        showToast("Item removed from cart", "success");
      } else {
        await api.put(`/api/cart/update/${cartItemId}`, { quantity });
      }
      await refresh();
    } catch {
      showToast("Could not update your cart", "error");
    } finally {
      setUpdatingId(null);
    }
  };

  const removeItem = async (cartItemId: string) => {
    if (updatingId) return;
    try {
      setUpdatingId(cartItemId);
      await api.delete(`/api/cart/remove/${cartItemId}`);
      showToast("Item removed from cart", "success");
      await refresh();
    } catch {
      showToast("Could not remove item", "error");
    } finally {
      setUpdatingId(null);
    }
  };

  const applyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponError("");
    try {
      const res = await api.post("/api/coupons/apply", { code: couponCode.trim() });
      setCouponDiscount(parseFloat(res.data.data.discount));
      showToast("Coupon applied", "success");
    } catch (err: any) {
      setCouponDiscount(0);
      setCouponError(err.response?.data?.message || "Invalid or expired coupon code.");
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-[60] bg-[#1C1C1C]/45 backdrop-blur-[3px]"
          />

          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 34 }}
            className="fixed right-0 top-0 z-[70] flex h-full w-full max-w-[420px] flex-col border-l border-[#ECECEC] bg-white shadow-[-24px_0_70px_rgba(28,28,28,0.14)]"
            role="dialog"
            aria-label="Cart drawer"
          >
            <div className="flex items-center justify-between border-b border-[#ECECEC] px-5 py-4">
              <h2 className="flex items-center gap-2 text-lg font-bold tracking-[-0.02em] text-[#1C1C1C]">
                <ShoppingBag className="h-5 w-5 text-[#FC8019]" />
                Your Cart
                {items.length > 0 && (
                  <span className="rounded-full bg-[#FC8019]/10 px-2 py-0.5 text-xs font-bold text-[#FC8019]">
                    {items.length} {items.length === 1 ? "item" : "items"}
                  </span>
                )}
              </h2>
              <button
                onClick={onClose}
                aria-label="Close cart"
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#ECECEC] text-[#686B78] transition-all hover:border-[#FC8019]/30 hover:bg-[#F8F9FA] hover:text-[#1C1C1C]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {items.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
                <div className="text-5xl">🛒</div>
                <p className="text-base font-bold text-[#1C1C1C]">Your cart is empty</p>
                <p className="text-sm text-[#686B78]">
                  Add something delicious from the live deals!
                </p>
                <button
                  onClick={onClose}
                  className="mt-2 rounded-xl bg-[#FC8019] px-6 py-2.5 text-sm font-bold text-white shadow-[0_7px_18px_rgba(252,128,25,0.24)] transition-all hover:-translate-y-0.5 hover:bg-[var(--color-primary-hover)]"
                >
                  Browse Food
                </button>
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto p-4">
                  <div className="flex flex-col gap-3">
                    {items.map((item: any) => {
                      const price = item.discount_price
                        ? parseFloat(item.discount_price)
                        : parseFloat(item.price);
                      const busy = updatingId === item.cart_item_id;
                      return (
                        <div
                          key={item.cart_item_id}
                          className="flex gap-3 rounded-2xl border border-[#ECECEC] bg-[#F8F9FA] p-3.5 transition-colors hover:border-[#FC8019]/20"
                        >
                          <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-[#ECECEC] shadow-sm">
                            <SafeImage
                              src={getFoodImage(item.image_url)}
                              fallback={FOOD_FALLBACK}
                              alt={item.name}
                              className="h-full w-full object-cover"
                            />
                          </div>
                          <div className="flex min-w-0 flex-1 flex-col">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <p className="line-clamp-1 text-sm font-semibold text-[#1C1C1C]">
                                  {item.name}
                                </p>
                                <p className="line-clamp-1 text-xs text-[#686B78]">
                                  {item.restaurant_name || "Foodiq Kitchen"}
                                </p>
                              </div>
                              <button
                                onClick={() => removeItem(item.cart_item_id)}
                                disabled={busy}
                                aria-label={`Remove ${item.name}`}
                                className="shrink-0 rounded-md p-1 text-[#9CA3AF] transition-colors hover:bg-white hover:text-red-500 disabled:opacity-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                            <div className="mt-auto flex items-center justify-between pt-1.5">
                              <span className="text-sm font-bold text-[#1C1C1C]">
                                ₹{(price * item.quantity).toFixed(0)}
                              </span>
                              <div className="flex items-center gap-2 rounded-xl border border-[#ECECEC] bg-white px-1.5 py-1 shadow-sm">
                                <button
                                  onClick={() =>
                                    updateQuantity(item.cart_item_id, item.quantity - 1)
                                  }
                                  disabled={busy}
                                  aria-label="Decrease quantity"
                                  className="text-[#6B7280] transition-colors hover:text-[#111827] disabled:opacity-50"
                                >
                                  <Minus className="h-3.5 w-3.5" />
                                </button>
                                <span className="min-w-4 text-center text-xs font-bold text-[#111827]">
                                  {item.quantity}
                                </span>
                                <button
                                  onClick={() =>
                                    updateQuantity(item.cart_item_id, item.quantity + 1)
                                  }
                                  disabled={busy}
                                  aria-label="Increase quantity"
                                  className="text-[#6B7280] transition-colors hover:text-[#111827] disabled:opacity-50"
                                >
                                  <Plus className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="border-t border-[#ECECEC] bg-white p-4 shadow-[0_-10px_30px_rgba(28,28,28,0.04)]">
                  <div className="mb-3 flex gap-2">
                    <div className="relative flex-1">
                      <Tag className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA3AF]" />
                      <input
                        type="text"
                        placeholder="Coupon code"
                        value={couponCode}
                        onChange={(e) => {
                          setCouponCode(e.target.value);
                          setCouponError("");
                        }}
                        className="w-full rounded-[14px] border border-[#ECECEC] bg-white py-2.5 pl-9 pr-3 text-sm uppercase text-[#1C1C1C] placeholder:normal-case placeholder:text-[#686B78] focus:border-[#FC8019]/60 focus:outline-none focus:ring-4 focus:ring-[#FC8019]/10"
                      />
                    </div>
                    <button
                      onClick={applyCoupon}
                      className="rounded-xl border border-[#ECECEC] bg-[#F8F9FA] px-4 text-sm font-bold text-[#1C1C1C] transition-all hover:border-[#FC8019]/30 hover:bg-white"
                    >
                      Apply
                    </button>
                  </div>
                  {couponError && <p className="mb-2 text-xs text-red-500">{couponError}</p>}

                  <div className="mb-3 flex flex-col gap-1.5 text-sm text-[#686B78]">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span className="font-medium text-[#111827]">₹{totals.subtotal}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>GST (5%)</span>
                      <span className="font-medium text-[#111827]">₹{totals.tax}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Delivery Charge</span>
                      <span className="font-medium text-[#111827]">₹{totals.deliveryCharge}</span>
                    </div>
                    {discount > 0 && (
                      <div className="flex justify-between font-medium text-green-400">
                        <span>Coupon Discount</span>
                        <span>-₹{discount}</span>
                      </div>
                    )}
                    <div className="mt-1 flex justify-between border-t border-[#ECECEC] pt-2 text-base font-bold text-[#1C1C1C]">
                      <span>Grand Total</span>
                      <span className="text-[#FC8019]">₹{grandTotal.toFixed(0)}</span>
                    </div>
                  </div>

                  <Link
                    href="/checkout"
                    onClick={onClose}
                    className="flex w-full items-center justify-center rounded-xl bg-[#FC8019] py-3 text-sm font-bold text-white shadow-[0_8px_20px_rgba(252,128,25,0.24)] transition-all hover:-translate-y-0.5 hover:bg-[var(--color-primary-hover)] hover:shadow-[0_12px_26px_rgba(252,128,25,0.3)]"
                  >
                    Proceed to Checkout
                  </Link>
                </div>
              </>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
