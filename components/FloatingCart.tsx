"use client";

import { motion } from "framer-motion";
import { ShoppingCart } from "lucide-react";
import Link from "next/link";
import useSWR from "swr";
import Cookies from "js-cookie";
import { useEffect, useState } from "react";

export default function FloatingCart() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    setIsLoggedIn(!!Cookies.get("token"));
  }, []);

  const { data } = useSWR(isLoggedIn ? "/api/cart" : null);
  const items = data?.items || [];
  const count = items.reduce((sum: number, item: { quantity: number }) => sum + item.quantity, 0);

  if (!isLoggedIn) return null;

  return (
    <Link href="/cart">
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 1.2, type: "spring", stiffness: 200, damping: 15 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-8 right-8 z-50 flex items-center justify-center w-16 h-16 rounded-full bg-[var(--color-primary)] text-white shadow-[0_10px_25px_rgba(255,45,59,0.5)] hover:bg-[var(--color-primary-hover)] transition-colors"
        aria-label={`Open cart with ${count} items`}
      >
        <ShoppingCart className="w-7 h-7" />

        {count > 0 && (
          <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[24px] h-6 px-1 text-xs font-bold text-[var(--color-primary)] bg-white rounded-full border-2 border-black">
            {count > 99 ? "99+" : count}
          </span>
        )}
      </motion.button>
    </Link>
  );
}
