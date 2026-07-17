"use client";

import { motion } from "framer-motion";
import { CreditCard, Plus } from "lucide-react";

type Props = {
  onAddNew: () => void;
};

export default function PaymentsEmptyState({ onAddNew }: Props) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex min-h-[400px] flex-col items-center justify-center rounded-2xl border border-[#ECECEC] bg-white p-12 text-center shadow-[0_8px_24px_rgba(28,28,28,0.06)]"
    >
      <div className="relative mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-[#F8F9FA]">
        <CreditCard className="h-10 w-10 text-[#FC8019]" />
      </div>
      
      <h3 className="mb-3 text-2xl font-bold text-[#1C1C1C]">No payment methods added yet.</h3>
      <p className="mb-8 max-w-sm leading-relaxed text-[#686B78]">
        Add a credit card, debit card, or UPI ID to speed up your checkout process on future orders.
      </p>

      <button 
        onClick={onAddNew}
        className="flex items-center gap-2 rounded-xl bg-[#FC8019] px-8 py-4 font-bold text-white shadow-[0_10px_24px_rgba(252,128,25,0.20)] transition-all hover:-translate-y-1 hover:bg-[#EF4F5F]"
      >
        <Plus className="w-5 h-5" />
        Add Payment Method
      </button>
    </motion.div>
  );
}
