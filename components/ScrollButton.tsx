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
      className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex items-center justify-center w-14 h-14 rounded-full border border-[#E5E7EB] bg-white/90 backdrop-blur-md shadow-[0_0_20px_rgba(252,128,25,0.25)] hover:shadow-[0_0_30px_rgba(252,128,25,0.45)] hover:bg-[#FFF7ED] transition-all group"
    >
      <motion.div
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
      >
        <ArrowDown className="text-[#111827] w-6 h-6 group-hover:text-[var(--color-primary)] transition-colors" />
      </motion.div>
    </motion.button>
  );
}
