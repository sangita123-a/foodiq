"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { X, Check, CreditCard, Smartphone } from "lucide-react";
import { CardType } from "./CreditCardItem";
import { UpiType } from "./UpiItem";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSaveCard: (card: CardType) => void;
  onSaveUpi: (upi: UpiType) => void;
  initialData?: any;
  initialType?: "Card" | "UPI";
};

export default function PaymentFormModal({ isOpen, onClose, onSaveCard, onSaveUpi, initialData, initialType = "Card" }: Props) {
  const [methodType, setMethodType] = useState<"Card" | "UPI">(initialType);
  const [formData, setFormData] = useState<any>({ isDefault: false });

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
      setMethodType(initialType);
    } else {
      setFormData({ isDefault: false });
    }
  }, [initialData, initialType, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev: any) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (methodType === "Card") {
      const card: CardType = {
        ...formData,
        id: formData.id || `card_${Date.now()}`,
        network: formData.network || "Visa", // Mock assigning network
        maskedNumber: formData.cardNumber ? `**** **** **** ${formData.cardNumber.slice(-4)}` : "**** **** **** 1234"
      };
      onSaveCard(card);
    } else {
      const upi: UpiType = {
        ...formData,
        id: formData.id || `upi_${Date.now()}`,
      };
      onSaveUpi(upi);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#F8FAFC] backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="flex w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-[#ECECEC] bg-white shadow-[0_24px_64px_rgba(28,28,28,0.16)]"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#ECECEC] bg-[#F8F9FA] p-6 md:p-8">
          <h2 className="text-2xl font-bold text-[#1C1C1C]">
            {initialData ? "Edit Payment Method" : "Add Payment Method"}
          </h2>
          <button 
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#686B78] transition-all hover:text-[#1C1C1C]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 md:p-8">
          
          {/* Method Toggle (Only show if adding new) */}
          {!initialData && (
            <div className="mb-8 flex rounded-xl border border-[#ECECEC] bg-[#F8F9FA] p-1">
              <button
                type="button"
                onClick={() => setMethodType("Card")}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-bold text-sm transition-colors ${
                  methodType === "Card" ? "bg-primary text-white shadow-[0_6px_16px_rgba(252,128,25,0.18)]" : "text-[#686B78] hover:text-[#1C1C1C]"
                }`}
              >
                <CreditCard className="w-4 h-4" /> Card
              </button>
              <button
                type="button"
                onClick={() => setMethodType("UPI")}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-bold text-sm transition-colors ${
                  methodType === "UPI" ? "bg-primary text-white shadow-[0_6px_16px_rgba(252,128,25,0.18)]" : "text-[#686B78] hover:text-[#1C1C1C]"
                }`}
              >
                <Smartphone className="w-4 h-4" /> UPI ID
              </button>
            </div>
          )}

          {methodType === "Card" ? (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-[#6B7280] mb-2">Card Holder Name</label>
                <input required type="text" name="name" value={formData.name || ''} onChange={handleChange} className="w-full bg-white text-[#111827] border border-[#E5E7EB] rounded-xl px-4 py-3.5 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors" placeholder="e.g. John Doe" />
              </div>
              <div>
                <label className="block text-sm font-bold text-[#6B7280] mb-2">Card Number</label>
                <input required type="text" name="cardNumber" value={formData.cardNumber || (formData.maskedNumber ? formData.maskedNumber.replace(/\*/g, '').trim() : '')} onChange={handleChange} className="w-full bg-white text-[#111827] border border-[#E5E7EB] rounded-xl px-4 py-3.5 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors" placeholder="xxxx xxxx xxxx xxxx" maxLength={16} />
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-[#6B7280] mb-2">Expiry Date</label>
                  <input required type="text" name="expiry" value={formData.expiry || ''} onChange={handleChange} className="w-full bg-white text-[#111827] border border-[#E5E7EB] rounded-xl px-4 py-3.5 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors" placeholder="MM/YY" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-[#6B7280] mb-2">CVV</label>
                  <input required={!initialData} type="password" name="cvv" maxLength={3} className="w-full bg-white text-[#111827] border border-[#E5E7EB] rounded-xl px-4 py-3.5 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors" placeholder="***" />
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-[#6B7280] mb-2">UPI ID</label>
                <input required type="text" name="upiId" value={formData.upiId || ''} onChange={handleChange} className="w-full bg-white text-[#111827] border border-[#E5E7EB] rounded-xl px-4 py-3.5 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors" placeholder="e.g. name@bank" />
              </div>
            </div>
          )}

          {/* Default Checkbox (Only for Cards) */}
          {methodType === "Card" && (
            <div className="mt-8 mb-4">
              <label className="flex items-center gap-3 cursor-pointer group w-max">
                <div className={`w-6 h-6 rounded border flex items-center justify-center transition-colors ${
                  formData.isDefault ? 'bg-primary border-primary' : 'border-[#E5E7EB] group-hover:border-[#FC8019]/40 bg-white'
                }`}>
                  {formData.isDefault && <Check className="w-4 h-4 text-[#111827]" />}
                </div>
                <input 
                  type="checkbox" 
                  className="hidden" 
                  checked={formData.isDefault}
                  onChange={(e) => setFormData((prev: any) => ({ ...prev, isDefault: e.target.checked }))}
                />
                <span className="select-none font-bold text-[#1C1C1C]">Set as Default Card</span>
              </label>
            </div>
          )}

          <div className="mt-4 flex gap-4 border-t border-[#ECECEC] pt-8">
            <button 
              type="button" 
              onClick={onClose}
              className="flex-1 rounded-xl border border-[#ECECEC] bg-[#F8F9FA] py-4 font-bold text-[#1C1C1C] transition-all hover:border-[#FC8019]/30 hover:bg-white"
            >
              Cancel
            </button>
            <button 
              type="submit"
              className="flex-1 rounded-xl bg-[#FC8019] py-4 font-bold text-white shadow-[0_10px_24px_rgba(252,128,25,0.20)] transition-all hover:bg-[#EF4F5F]"
            >
              Save
            </button>
          </div>

        </form>
      </motion.div>
    </div>
  );
}
