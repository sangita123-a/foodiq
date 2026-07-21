/** @architecture UNUSED — not imported by any route. Active home trending: components/TrendingDishes.tsx */
"use client";

import { motion } from "framer-motion";
import { ArrowDown } from "lucide-react";

export default function ScrollButton() {
  const scrollToContent = () => {
    window.scrollTo({
      top: window.innerHeight,
      behavior: "smooth"
    });
  };

  return (
    <motion.button
      type="button"
      onClick={scrollToContent}
      aria-label="Scroll to content"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 1, duration: 1 }}
      className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex items-center justify-center w-14 h-14 rounded-full border border-border bg-white/90 backdrop-blur-md shadow-card hover:shadow-[0_8px_28px_rgba(0,0,0,0.12)] hover:bg-section transition-all group"
    >
      <motion.div
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
      >
        <ArrowDown className="text-foreground w-6 h-6 group-hover:text-[var(--color-primary)] transition-colors" aria-hidden="true" />
      </motion.div>
    </motion.button>
  );
}
