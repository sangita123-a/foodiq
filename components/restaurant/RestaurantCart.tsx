"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag, ChevronRight } from "lucide-react";
import Link from "next/link";

type RestaurantCartProps = {
  totalItems: number;
  totalPrice: number;
};

export default function RestaurantCart({ totalItems, totalPrice }: RestaurantCartProps) {
  return (
    <AnimatePresence>
      {totalItems > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.9 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="fixed bottom-6 right-4 md:right-8 z-50 w-[calc(100%-2rem)] md:w-auto"
        >
          <Link href="/checkout" className="bg-[#FC8019] text-white rounded-2xl shadow-[0_10px_40px_rgba(252,128,25,0.4)] flex items-center justify-between px-6 py-4 border border-[#E5E7EB] md:min-w-[320px] overflow-hidden group cursor-pointer hover:bg-[#E76F0B] transition-colors block">
            
            {/* Ambient background glow */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>

            <div className="flex flex-col relative z-10">
              <span className="text-sm font-medium text-[#111827]/80">
                {totalItems} {totalItems === 1 ? 'Item' : 'Items'}
              </span>
              <span className="font-bold text-lg">
                ₹{totalPrice}
              </span>
            </div>

            <div className="flex items-center gap-2 font-bold relative z-10">
              Order Now
              <div className="w-8 h-8 rounded-full bg-[#F8FAFC] flex items-center justify-center transform group-hover:translate-x-1 transition-transform">
                <ChevronRight className="w-5 h-5" />
              </div>
            </div>

            <ShoppingBag className="absolute -right-4 -bottom-4 w-24 h-24 text-black/10 rotate-12 pointer-events-none" />
          </Link>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
