"use client";

import { CreditCard, Plus } from "lucide-react";

type Props = {
  onAddNew: () => void;
};

export default function PaymentsHeader({ onAddNew }: Props) {
  return (
    <div className="mb-12 flex flex-col justify-between gap-6 border-b border-[#ECECEC] pb-8 md:flex-row md:items-center">
      <div>
        <h1 className="mb-3 flex items-center gap-4 text-3xl font-black tracking-[-0.04em] text-[#1C1C1C] md:text-4xl lg:text-5xl">
          <CreditCard className="w-10 h-10 md:w-12 md:h-12 text-[#E23744]" />
          Payment Methods
        </h1>
        <p className="text-lg text-[#686B78]">
          Securely manage your payment options for faster checkout.
        </p>
      </div>
      
      <button 
        onClick={onAddNew}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#E23744] px-6 py-4 font-bold text-white shadow-[0_10px_24px_rgba(226, 55, 68,0.20)] transition-all hover:-translate-y-1 hover:bg-[#E23744] md:w-auto"
      >
        <Plus className="w-5 h-5" />
        Add New Payment Method
      </button>
    </div>
  );
}
