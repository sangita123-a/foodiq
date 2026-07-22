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
import { useIsMobile, usePrefersReducedMotion } from "@/hooks/useMediaQuery";

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
  const isMobile = useIsMobile(768);
  const reducedMotion = usePrefersReducedMotion();

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

  const springTransition = reducedMotion
    ? { duration: 0.15 }
    : { type: "spring" as const, stiffness: 350, damping: 32 };

  const panelMotion = isMobile
    ? { initial: { y: "100%" }, animate: { y: 0 }, exit: { y: "100%" } }
    : { initial: { x: "100%" }, animate: { x: 0 }, exit: { x: "100%" } };

  const panelClass = isMobile
    ? "fixed bottom-0 left-0 right-0 z-[70] max-h-[90dvh] rounded-t-xl bg-white shadow-2xl flex flex-col safe-bottom"
    : "fixed top-0 right-0 z-[70] h-full w-full max-w-[460px] bg-white shadow-2xl flex flex-col";

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reducedMotion ? 0.1 : 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-[60] bg-[#1C1C1C]/45 backdrop-blur-[3px]"
          />

          <motion.aside
            {...panelMotion}
            transition={springTransition}
            className={panelClass}
            role="dialog"
            aria-modal="true"
            aria-label="Shopping cart"
          >
            {isMobile && (
              <div className="flex justify-center pt-3 pb-1 shrink-0">
                <div className="h-1 w-10 rounded-full bg-[#E5E7EB]" />
              </div>
            )}

            {/* Header */}
            <div className="flex items-center justify-between px-3 py-3 sm:px-6 sm:py-5 border-b border-border shrink-0 max-md:px-3 max-md:py-3">
              <div className="flex items-center gap-2 min-w-0 sm:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold shrink-0">
                  <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-base sm:text-xl font-black text-[#0F172A] truncate max-md:text-base">Your Order</h2>
                  <p className="text-[10px] sm:text-xs text-[#64748B] font-medium max-md:text-[10px]">
                    {items.length} {items.length === 1 ? "item" : "items"} selected
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="touch-target w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-[#F1F5F9] text-[#64748B] hover:bg-[#E2E8F0] hover:text-[#0F172A] flex items-center justify-center transition-colors shrink-0 max-md:h-9 max-md:w-9"
                aria-label="Close cart drawer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Items List */}
            <div className="flex-1 overflow-y-auto overscroll-contain p-3 sm:p-6 space-y-2 sm:space-y-4 max-md:p-3 max-md:space-y-2">
              {items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center py-12">
                  <div className="w-20 h-20 rounded-full bg-section flex items-center justify-center text-[#94A3B8] mb-4">
                    <ShoppingBag className="w-10 h-10" />
                  </div>
                  <h3 className="text-lg font-bold text-[#0F172A] mb-1">Your cart is empty</h3>
                  <p className="text-sm text-[#64748B] max-w-[240px] mb-6">
                    Explore our top restaurants and add delicious meals to your cart.
                  </p>
                  <button
                    type="button"
                    onClick={onClose}
                    className="touch-target px-6 py-3 rounded-xl bg-primary text-white font-bold text-sm hover:bg-primary-hover transition-colors"
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
                      className="flex items-center justify-between p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl bg-section border border-[#E2E8F0] gap-2 sm:gap-3 max-md:p-2.5 max-md:rounded-xl"
                    >
                      <div className="relative w-12 h-12 sm:w-16 sm:h-16 rounded-lg sm:rounded-xl overflow-hidden bg-white shrink-0 max-md:h-12 max-md:w-12">
                        <SafeImage
                          src={getFoodImage(item.image)}
                          fallback={FOOD_FALLBACK}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs sm:text-sm font-extrabold text-[#0F172A] truncate mb-0.5 max-md:text-xs">
                          {item.name}
                        </h4>
                        <p className="text-[10px] sm:text-xs font-black text-primary max-md:text-[10px]">₹{item.price}</p>
                      </div>

                      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                        <div className="flex items-center gap-1 sm:gap-1.5 bg-white border border-[#CBD5E1] rounded-lg px-1 sm:px-2 py-0.5 sm:py-1 max-md:rounded-lg">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.menu_item_id, -1)}
                            disabled={isUpdating}
                            className="touch-target w-7 h-7 sm:w-6 sm:h-6 rounded-md bg-[#F1F5F9] text-primary flex items-center justify-center font-bold hover:bg-primary hover:text-white transition-colors disabled:opacity-50 max-md:h-7 max-md:w-7"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-[10px] sm:text-xs font-black text-[#0F172A] min-w-[14px] text-center max-md:text-[10px]">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.menu_item_id, 1)}
                            disabled={isUpdating}
                            className="touch-target w-7 h-7 sm:w-6 sm:h-6 rounded-md bg-[#F1F5F9] text-primary flex items-center justify-center font-bold hover:bg-primary hover:text-white transition-colors disabled:opacity-50 max-md:h-7 max-md:w-7"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => updateQuantity(item.menu_item_id, -item.quantity)}
                          disabled={isUpdating}
                          className="touch-target w-8 h-8 sm:w-8 sm:h-8 rounded-lg bg-red-50 text-red-500 hover:bg-red-500 hover:text-white flex items-center justify-center transition-colors disabled:opacity-50 max-md:h-8 max-md:w-8"
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
              <div className="p-3 sm:p-6 border-t border-border bg-white space-y-3 shrink-0 safe-bottom max-md:p-3 max-md:space-y-3">
                <div className="flex items-center gap-2">
                  <div className="relative flex-1 min-w-0">
                    <Tag className="w-4 h-4 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Coupon Code"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-[11px] rounded-lg bg-section border border-[#E2E8F0] uppercase font-bold focus:outline-none focus:border-primary max-md:py-2 max-md:text-[11px] md:rounded-xl md:py-2.5 md:text-xs"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={applyCoupon}
                    className="touch-target px-3 py-2 bg-[#0F172A] text-white text-[10px] font-extrabold rounded-lg hover:bg-primary transition-colors shrink-0 max-md:py-2 max-md:text-[10px] md:px-4 md:py-2.5 md:rounded-xl md:text-xs"
                  >
                    Apply
                  </button>
                </div>
                {couponError && <p className="text-[11px] text-red-500 font-medium">{couponError}</p>}

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
                  <div className="flex justify-between text-base font-black text-[#0F172A] pt-2 border-t border-border">
                    <span>Total Amount</span>
                    <span className="text-primary">₹{grandTotal}</span>
                  </div>
                </div>

                <Link
                  href="/checkout"
                  onClick={onClose}
                  className="block w-full py-3 bg-primary text-white text-center font-extrabold rounded-lg text-xs shadow-md hover:bg-primary-hover transition-colors touch-target max-md:py-3 max-md:text-xs md:rounded-xl md:py-4 md:text-sm"
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
