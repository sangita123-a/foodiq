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
          className="w-full bg-[#0F172A] hover:bg-primary text-white p-4 rounded-2xl shadow-2xl flex items-center justify-between transition-all duration-300 group border border-white/10 backdrop-blur-xl"
        >
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary group-hover:bg-white group-hover:text-primary transition-colors">
              <ShoppingCart className="w-5 h-5 text-white group-hover:text-primary" />
              <span className="absolute -top-1.5 -right-1.5 bg-primary text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-[#0F172A]">
                {totalQuantity}
              </span>
            </div>
            <div className="text-left">
              <p className="text-xs text-[#94A3B8] font-bold uppercase tracking-wider">
                {totalQuantity} {totalQuantity === 1 ? "Item" : "Items"} in Cart
              </p>
              <p className="text-base font-black text-white">₹{subtotal}</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 bg-primary px-4 py-2 rounded-xl text-xs font-black text-white group-hover:bg-white group-hover:text-primary transition-colors shadow-md">
            <span>View Cart</span>
            <ArrowRight className="w-4 h-4" />
          </div>
        </button>
      </div>

      {drawerOpen ? <CartDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} /> : null}
    </>
  );
}
