"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { Minus, Plus, ShoppingBag, Tag, Trash2, X } from "lucide-react";
import api from "@/services/api";
import { useToast } from "@/contexts/ToastContext";
import SafeImage from "@/components/ui/SafeImage";
import { FOOD_FALLBACK, getFoodImage } from "@/lib/images";
import { useCartActions } from "@/hooks/useCartActions";
import { getOfferByCode } from "@/lib/data/20offersData";

type CartDrawerProps = {
  open: boolean;
  onClose: () => void;
};

export default function CartDrawer({ open, onClose }: CartDrawerProps) {
  const { showToast } = useToast();
  const { items, subtotal, updatingId, updateQuantity } = useCartActions();
  const [couponCode, setCouponCode] = useState("");
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponError, setCouponError] = useState("");

  const deliveryFee = items.length > 0 ? 35 : 0;
  const tax = Math.round(subtotal * 0.05);
  const discount = couponDiscount;
  const grandTotal = Math.max(0, subtotal + deliveryFee + tax - discount);

  const applyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponError("");
    try {
      const res = await api.post("/api/coupons/apply", { code: couponCode.trim() });
      const disc = Number(res.data?.data?.discount || res.data?.discount || 50);
      setCouponDiscount(disc);
      showToast("Coupon applied successfully!", "success");
    } catch (err: any) {
      const localOffer = getOfferByCode(couponCode.trim());
      if (localOffer) {
        let disc = localOffer.discountAmount;
        if (localOffer.discountType === "percentage") {
          disc = Math.round(subtotal * (localOffer.discountAmount / 100));
          if (localOffer.maxDiscount && disc > localOffer.maxDiscount) {
            disc = localOffer.maxDiscount;
          }
        }
        setCouponDiscount(disc);
        showToast(`Coupon ${localOffer.code} applied!`, "success");
        return;
      }
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
            transition={{ type: "spring", stiffness: 350, damping: 32 }}
            className="fixed top-0 right-0 z-[70] h-full w-full max-w-[460px] bg-white shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-[#ECECEC]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-[#0F172A]">Your Order</h2>
                  <p className="text-xs text-[#64748B] font-medium">
                    {items.length} {items.length === 1 ? "item" : "items"} selected
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="w-9 h-9 rounded-full bg-[#F1F5F9] text-[#64748B] hover:bg-[#E2E8F0] hover:text-[#0F172A] flex items-center justify-center transition-colors"
                aria-label="Close cart drawer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Items List */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center py-12">
                  <div className="w-20 h-20 rounded-full bg-[#F8FAFC] flex items-center justify-center text-[#94A3B8] mb-4">
                    <ShoppingBag className="w-10 h-10" />
                  </div>
                  <h3 className="text-lg font-bold text-[#0F172A] mb-1">Your cart is empty</h3>
                  <p className="text-sm text-[#64748B] max-w-[240px] mb-6">
                    Explore our top restaurants and add delicious meals to your cart.
                  </p>
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-6 py-2.5 rounded-xl bg-primary text-white font-bold text-sm hover:bg-primary-hover transition-colors"
                  >
                    Start Ordering
                  </button>
                </div>
              ) : (
                items.map((item) => {
                  const isUpdating = updatingId === item.menu_item_id;
                  return (
                    <div
                      key={item.cart_item_id}
                      className="flex items-center justify-between p-3.5 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] gap-3"
                    >
                      <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-white shrink-0">
                        <SafeImage
                          src={getFoodImage(item.image)}
                          fallback={FOOD_FALLBACK}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-extrabold text-[#0F172A] truncate mb-0.5">
                          {item.name}
                        </h4>
                        <p className="text-xs font-black text-primary">₹{item.price}</p>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1.5 bg-white border border-[#CBD5E1] rounded-xl px-2 py-1">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.menu_item_id, -1)}
                            disabled={isUpdating}
                            className="w-6 h-6 rounded-lg bg-[#F1F5F9] text-primary flex items-center justify-center font-bold hover:bg-primary hover:text-white transition-colors disabled:opacity-50"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="text-xs font-black text-[#0F172A] min-w-[16px] text-center">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.menu_item_id, 1)}
                            disabled={isUpdating}
                            className="w-6 h-6 rounded-lg bg-[#F1F5F9] text-primary flex items-center justify-center font-bold hover:bg-primary hover:text-white transition-colors disabled:opacity-50"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => updateQuantity(item.menu_item_id, -item.quantity)}
                          disabled={isUpdating}
                          className="w-8 h-8 rounded-xl bg-red-50 text-red-500 hover:bg-red-500 hover:text-white flex items-center justify-center transition-colors disabled:opacity-50"
                          aria-label="Remove item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Coupon Code & Totals Footer */}
            {items.length > 0 && (
              <div className="p-6 border-t border-[#ECECEC] bg-white space-y-4">
                {/* Coupon input */}
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Tag className="w-4 h-4 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Coupon Code"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] uppercase font-bold focus:outline-none focus:border-primary"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={applyCoupon}
                    className="px-4 py-2 bg-[#0F172A] text-white text-xs font-extrabold rounded-xl hover:bg-primary transition-colors"
                  >
                    Apply
                  </button>
                </div>
                {couponError && <p className="text-[11px] text-red-500 font-medium">{couponError}</p>}

                {/* Summary Rows */}
                <div className="space-y-1.5 text-xs text-[#64748B] pt-2 border-t border-[#F1F5F9]">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span className="font-bold text-[#0F172A]">₹{subtotal}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Delivery Fee</span>
                    <span className="font-bold text-[#0F172A]">₹{deliveryFee}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Taxes & Charges (5% GST)</span>
                    <span className="font-bold text-[#0F172A]">₹{tax}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-emerald-600 font-bold">
                      <span>Discount</span>
                      <span>-₹{discount}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-base font-black text-[#0F172A] pt-2 border-t border-[#ECECEC]">
                    <span>Total Amount</span>
                    <span className="text-primary">₹{grandTotal}</span>
                  </div>
                </div>

                {/* Checkout Link */}
                <Link
                  href="/checkout"
                  onClick={onClose}
                  className="block w-full py-3.5 bg-primary text-white text-center font-extrabold rounded-xl text-sm shadow-md hover:bg-primary-hover transition-colors"
                >
                  Proceed to Checkout
                </Link>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
