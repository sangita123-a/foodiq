"use client";

import { motion } from "framer-motion";
import { HeartOff } from "lucide-react";
import Link from "next/link";

export default function FavoritesEmptyState() {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#F8FAFC] rounded-3xl p-12 flex flex-col items-center justify-center text-center border border-[#E5E7EB] min-h-[400px]"
    >
      <div className="w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center mb-6 relative">
        <HeartOff className="w-10 h-10 text-red-500" />
      </div>
      
      <h3 className="text-2xl font-bold text-white mb-3">You haven't added any favorites yet.</h3>
      <p className="text-[#6B7280] max-w-sm mb-8">
        Hit the heart icon on your favorite restaurants and dishes to save them here for quick access later.
      </p>

      <Link 
        href="/"
        className="bg-primary hover:bg-[#C81E34] text-white px-8 py-4 rounded-xl font-bold transition-colors shadow-[0_0_20px_rgba(226, 55, 68,0.3)] hover:-translate-y-1 block"
      >
        Explore Restaurants
      </Link>
    </motion.div>
  );
}
