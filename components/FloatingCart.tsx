"use client";

import { motion } from "framer-motion";
import { ShoppingCart } from "lucide-react";
import useSWR from "swr";
import Cookies from "js-cookie";
import { useEffect, useState } from "react";
import CartDrawer from "@/components/cart/CartDrawer";

export default function FloatingCart() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    setIsLoggedIn(!!Cookies.get("token"));
  }, []);

  const { data } = useSWR(isLoggedIn ? "/api/cart" : null);
  const items = data?.items || [];
  const count = items.reduce((sum: number, item: { quantity: number }) => sum + item.quantity, 0);

  if (!isLoggedIn) return null;

  return (
    <>
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 1.2, type: "spring", stiffness: 200, damping: 15 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setDrawerOpen(true)}
        className="fixed bottom-5 right-5 sm:bottom-8 sm:right-8 z-50 flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-full border-4 border-white bg-[var(--color-primary)] text-white shadow-[0_12px_30px_rgba(252,128,25,0.36)] hover:bg-[var(--color-primary-hover)] transition-colors"
        aria-label={`Open cart with ${count} items`}
      >
        <ShoppingCart className="w-7 h-7" />

        {count > 0 && (
          <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[24px] h-6 px-1 text-xs font-bold text-[var(--color-primary)] bg-white rounded-full border-2 border-[#E5E7EB]">
            {count > 99 ? "99+" : count}
          </span>
        )}
      </motion.button>

      <CartDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </>
  );
}
