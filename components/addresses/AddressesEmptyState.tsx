"use client";

import { motion } from "framer-motion";
import { Map, Plus } from "lucide-react";

type Props = {
  onAddNew: () => void;
};

export default function AddressesEmptyState({ onAddNew }: Props) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex min-h-[400px] flex-col items-center justify-center rounded-2xl border border-[#ECECEC] bg-white p-12 text-center shadow-[0_8px_24px_rgba(28,28,28,0.06)]"
    >
      <div className="relative mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-[#F8F9FA]">
        <Map className="h-10 w-10 text-[#E23744]" />
      </div>
      
      <h3 className="mb-3 text-2xl font-bold text-[#1C1C1C]">No saved addresses yet.</h3>
      <p className="mb-8 max-w-sm leading-relaxed text-[#686B78]">
        Add your home, work, or other addresses to speed up the checkout process on your next order.
      </p>

      <button 
        onClick={onAddNew}
        className="flex items-center gap-2 rounded-xl bg-[#E23744] px-8 py-4 font-bold text-white shadow-[0_10px_24px_rgba(226, 55, 68,0.20)] transition-all hover:-translate-y-1 hover:bg-[#E23744]"
      >
        <Plus className="w-5 h-5" />
        Add Your First Address
      </button>
    </motion.div>
  );
}
