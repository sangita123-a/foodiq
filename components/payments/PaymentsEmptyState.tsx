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
      className="bg-[#171717] rounded-3xl p-12 flex flex-col items-center justify-center text-center border border-white/5 min-h-[400px]"
    >
      <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mb-6 relative">
        <CreditCard className="w-10 h-10 text-gray-400" />
      </div>
      
      <h3 className="text-2xl font-bold text-white mb-3">No payment methods added yet.</h3>
      <p className="text-gray-400 max-w-sm mb-8">
        Add a credit card, debit card, or UPI ID to speed up your checkout process on future orders.
      </p>

      <button 
        onClick={onAddNew}
        className="bg-primary hover:bg-[#e02633] text-white px-8 py-4 rounded-xl font-bold flex items-center gap-2 transition-colors shadow-[0_0_20px_rgba(255,45,59,0.3)] hover:-translate-y-1"
      >
        <Plus className="w-5 h-5" />
        Add Payment Method
      </button>
    </motion.div>
  );
}
