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
      className="group flex flex-col items-center justify-between gap-4 rounded-2xl border border-[#ECECEC] bg-white p-4 shadow-[0_6px_18px_rgba(28,28,28,0.05)] transition-all duration-300 hover:border-[#FC8019]/30 hover:shadow-[0_10px_26px_rgba(28,28,28,0.08)] sm:flex-row md:p-6"
    >
      <div className="flex items-center gap-4 w-full sm:w-auto">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-[#ECECEC] bg-[#F8F9FA] transition-colors group-hover:border-primary/50">
          <Smartphone className="h-6 w-6 text-[#686B78] transition-colors group-hover:text-primary" />
        </div>
        <div>
          <h4 className="text-lg font-bold text-[#1C1C1C]">{upi.upiId}</h4>
          <p className="mt-0.5 text-xs uppercase tracking-widest text-[#686B78]">Verified UPI ID</p>
        </div>
      </div>

      <div className="flex items-center gap-3 w-full sm:w-auto">
        <button 
          onClick={() => onEdit(upi)}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-[#ECECEC] bg-[#F8F9FA] px-4 py-2.5 text-sm font-bold text-[#1C1C1C] transition-all hover:border-[#FC8019]/30 hover:bg-white sm:flex-none"
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
