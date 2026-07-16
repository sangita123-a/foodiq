"use client";

import { Tag, Plus } from "lucide-react";
import { motion } from "framer-motion";

interface OffersEmptyStateProps {
  onCreateNew: () => void;
}

export default function OffersEmptyState({ onCreateNew }: OffersEmptyStateProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-[#171717] rounded-3xl border border-white/5 p-12 flex flex-col items-center justify-center text-center shadow-xl mb-8"
    >
      <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mb-6 border border-white/10 relative">
        <Tag className="w-10 h-10 text-gray-500" />
        {/* Decorative elements */}
        <div className="absolute top-0 -right-2 w-4 h-4 bg-primary/20 rounded-full animate-ping"></div>
        <div className="absolute bottom-4 -left-4 w-6 h-6 bg-blue-500/20 rounded-full animate-pulse"></div>
      </div>
      
      <h3 className="text-2xl font-black text-white mb-3">No promotional offers found.</h3>
      <p className="text-gray-400 max-w-md mb-8 leading-relaxed">
        You haven't created any campaigns matching these filters. Create a new offer to boost your sales and attract more customers!
      </p>

      <button 
        onClick={onCreateNew}
        className="px-6 py-3 bg-primary hover:bg-[#e02633] text-white rounded-xl font-bold flex items-center gap-2 transition-colors shadow-lg shadow-primary/20"
      >
        <Plus className="w-4 h-4" />
        Create Your First Offer
      </button>
    </motion.div>
  );
}
