"use client";

import { CreditCard, Plus } from "lucide-react";

type Props = {
  onAddNew: () => void;
};

export default function PaymentsHeader({ onAddNew }: Props) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12 border-b border-white/5 pb-8">
      <div>
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-white mb-3 flex items-center gap-4">
          <CreditCard className="w-10 h-10 md:w-12 md:h-12 text-[#FF2D3B]" />
          Payment Methods
        </h1>
        <p className="text-[#A1A1A1] text-lg">
          Securely manage your payment options for faster checkout.
        </p>
      </div>
      
      <button 
        onClick={onAddNew}
        className="bg-primary hover:bg-[#e02633] text-white px-6 py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors shadow-[0_0_20px_rgba(255,45,59,0.3)] hover:-translate-y-1 w-full md:w-auto"
      >
        <Plus className="w-5 h-5" />
        Add New Payment Method
      </button>
    </div>
  );
}
