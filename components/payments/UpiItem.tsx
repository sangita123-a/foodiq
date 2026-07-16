"use client";

import { motion } from "framer-motion";
import { Smartphone, Edit2, Trash2 } from "lucide-react";

export type UpiType = {
  id: string;
  upiId: string;
};

type Props = {
  upi: UpiType;
  onEdit: (upi: UpiType) => void;
  onRemove: (id: string) => void;
};

export default function UpiItem({ upi, onEdit, onRemove }: Props) {
  return (
    <motion.div 
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="bg-[#111] border border-white/5 hover:border-white/20 transition-all duration-300 rounded-2xl p-4 md:p-6 flex flex-col sm:flex-row items-center justify-between gap-4 group"
    >
      <div className="flex items-center gap-4 w-full sm:w-auto">
        <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center border border-white/10 group-hover:border-primary/50 transition-colors">
          <Smartphone className="w-6 h-6 text-gray-400 group-hover:text-primary transition-colors" />
        </div>
        <div>
          <h4 className="text-white font-bold text-lg">{upi.upiId}</h4>
          <p className="text-gray-500 text-xs uppercase tracking-widest mt-0.5">Verified UPI ID</p>
        </div>
      </div>

      <div className="flex items-center gap-3 w-full sm:w-auto">
        <button 
          onClick={() => onEdit(upi)}
          className="flex-1 sm:flex-none bg-white/5 hover:bg-white/10 text-white px-4 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors border border-white/5"
        >
          <Edit2 className="w-4 h-4" /> Edit
        </button>
        <button 
          onClick={() => onRemove(upi.id)}
          className="flex-1 sm:flex-none bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 px-4 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors border border-red-500/10"
        >
          <Trash2 className="w-4 h-4" /> Remove
        </button>
      </div>
    </motion.div>
  );
}
