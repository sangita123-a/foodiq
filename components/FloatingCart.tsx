"use client";

import { useState } from "react";
import { ArrowRight, ShoppingCart } from "lucide-react";
import dynamic from "next/dynamic";
import { useCartActions } from "@/hooks/useCartActions";

const CartDrawer = dynamic(() => import("@/components/cart/CartDrawer"), {
  ssr: false,
});

export default function FloatingCart() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { totalQuantity, subtotal } = useCartActions();

  if (totalQuantity <= 0) return null;

  return (
    <>
      <div className="floating-cart-enter fixed left-1/2 z-50 w-[calc(100%-24px)] sm:w-[90%] max-w-md -translate-x-1/2 bottom-[max(1rem,env(safe-area-inset-bottom,0px))] sm:bottom-[max(1.5rem,env(safe-area-inset-bottom,0px))]">
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          aria-label={`View cart, ${totalQuantity} ${totalQuantity === 1 ? "item" : "items"}, total ₹${subtotal}`}
          className="w-full bg-[#0F172A] hover:bg-primary text-white p-2.5 sm:p-4 rounded-xl sm:rounded-2xl shadow-2xl flex items-center justify-between transition-all duration-300 group border border-white/10 backdrop-blur-xl max-md:p-2.5 max-md:rounded-xl"
        >
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="relative w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-primary/20 flex items-center justify-center text-primary group-hover:bg-white group-hover:text-primary transition-colors max-md:h-8 max-md:w-8">
              <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5 text-white group-hover:text-primary" />
              <span className="absolute -top-1 -right-1 bg-primary text-white text-[9px] font-black w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center border-2 border-[#0F172A] max-md:text-[9px]">
                {totalQuantity}
              </span>
            </div>
            <div className="text-left">
              <p className="text-[10px] sm:text-xs text-[#94A3B8] font-bold uppercase tracking-wider max-md:text-[10px]">
                {totalQuantity} {totalQuantity === 1 ? "Item" : "Items"} in Cart
              </p>
              <p className="text-sm sm:text-base font-black text-white max-md:text-sm">₹{subtotal}</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 bg-primary px-2.5 py-1 sm:px-4 sm:py-2 rounded-lg sm:rounded-xl text-[9px] sm:text-xs font-black text-white group-hover:bg-white group-hover:text-primary transition-colors shadow-md max-md:px-2.5 max-md:py-1 max-md:text-[9px]">
            <span>View Cart</span>
            <ArrowRight className="w-4 h-4" />
          </div>
        </button>
      </div>

      {drawerOpen ? <CartDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} /> : null}
    </>
  );
}
