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
      className="bg-[#FFFFFF] rounded-3xl border border-[#E5E7EB] p-12 flex flex-col items-center justify-center text-center shadow-xl mb-8"
    >
      <div className="w-24 h-24 bg-[#F8FAFC] rounded-full flex items-center justify-center mb-6 border border-[#E5E7EB] relative">
        <Tag className="w-10 h-10 text-[#9CA3AF]" />
        {/* Decorative elements */}
        <div className="absolute top-0 -right-2 w-4 h-4 bg-[#FC8019]/20 rounded-full animate-ping"></div>
        <div className="absolute bottom-4 -left-4 w-6 h-6 bg-blue-500/20 rounded-full animate-pulse"></div>
      </div>
      
      <h3 className="text-2xl font-black text-[#111827] mb-3">No promotional offers found.</h3>
      <p className="text-[#6B7280] max-w-md mb-8 leading-relaxed">
        You haven't created any campaigns matching these filters. Create a new offer to boost your sales and attract more customers!
      </p>

      <button 
        onClick={onCreateNew}
        className="px-6 py-3 bg-[#FC8019] hover:bg-[#E66F0D] text-white rounded-xl font-bold flex items-center gap-2 transition-colors shadow-lg shadow-[#FC8019]/20"
      >
        <Plus className="w-4 h-4" />
        Create Your First Offer
      </button>
    </motion.div>
  );
}
