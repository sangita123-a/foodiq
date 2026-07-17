"use client";

import { CreditCard, Wallet, Smartphone, Banknote, Building, Landmark } from "lucide-react";

export type PaymentMethod = "UPI" | "Credit Card" | "Debit Card" | "Net Banking" | "Wallet" | "Cash on Delivery";

const paymentOptions: { id: PaymentMethod; label: string; icon: React.ReactNode }[] = [
  { id: "UPI", label: "UPI", icon: <Smartphone className="w-5 h-5" /> },
  { id: "Credit Card", label: "Credit Card", icon: <CreditCard className="w-5 h-5" /> },
  { id: "Debit Card", label: "Debit Card", icon: <CreditCard className="w-5 h-5" /> },
  { id: "Net Banking", label: "Net Banking", icon: <Landmark className="w-5 h-5" /> },
  { id: "Wallet", label: "Wallet", icon: <Wallet className="w-5 h-5" /> },
  { id: "Cash on Delivery", label: "Cash on Delivery", icon: <Banknote className="w-5 h-5" /> },
];

type Props = {
  selectedMethod: PaymentMethod;
  onSelect: (method: PaymentMethod) => void;
};

export default function PaymentMethodsSection({ selectedMethod, onSelect }: Props) {
  return (
    <div className="bg-[#F8FAFC] rounded-2xl p-6 border border-[#E5E7EB] mb-6">
      <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
        <CreditCard className="w-5 h-5 text-primary" />
        Payment Method
      </h3>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {paymentOptions.map((option) => {
          const isSelected = selectedMethod === option.id;
          return (
            <div 
              key={option.id}
              onClick={() => onSelect(option.id)}
              className={`p-4 rounded-xl border flex flex-col items-center justify-center gap-3 cursor-pointer transition-all duration-300 ${
                isSelected 
                ? 'border-primary bg-primary/5 text-primary shadow-[0_0_15px_rgba(252,128,25,0.15)]' 
                : 'border-[#E5E7EB] bg-white text-[#6B7280] hover:border-[#FC8019]/40 hover:text-[#111827]'
              }`}
            >
              {option.icon}
              <span className="font-bold text-sm text-center">{option.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
