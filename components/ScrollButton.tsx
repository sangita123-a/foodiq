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
      onClick={scrollToContent}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 1, duration: 1 }}
      className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex items-center justify-center w-14 h-14 rounded-full border border-white/20 bg-black/30 backdrop-blur-md shadow-[0_0_20px_rgba(255,45,59,0.3)] hover:shadow-[0_0_30px_rgba(255,45,59,0.6)] hover:bg-[var(--color-primary)]/20 transition-all group"
    >
      <motion.div
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
      >
        <ArrowDown className="text-white w-6 h-6 group-hover:text-[var(--color-primary)] transition-colors" />
      </motion.div>
    </motion.button>
  );
}
