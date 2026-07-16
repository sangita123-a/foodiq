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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="bg-[#171717] rounded-3xl w-full max-w-lg border border-white/10 shadow-[0_20px_60px_rgba(255,45,59,0.15)] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="p-6 md:p-8 border-b border-white/10 flex justify-between items-center bg-[#111]">
          <h2 className="text-2xl font-bold text-white">
            {initialData ? "Edit Payment Method" : "Add Payment Method"}
          </h2>
          <button 
            onClick={onClose}
            className="w-10 h-10 bg-white/5 hover:bg-white/10 rounded-full flex items-center justify-center text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 md:p-8">
          
          {/* Method Toggle (Only show if adding new) */}
          {!initialData && (
            <div className="flex bg-[#111] rounded-xl p-1 mb-8 border border-white/5">
              <button
                type="button"
                onClick={() => setMethodType("Card")}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-bold text-sm transition-colors ${
                  methodType === "Card" ? "bg-primary text-white shadow-lg" : "text-gray-400 hover:text-white"
                }`}
              >
                <CreditCard className="w-4 h-4" /> Card
              </button>
              <button
                type="button"
                onClick={() => setMethodType("UPI")}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-bold text-sm transition-colors ${
                  methodType === "UPI" ? "bg-primary text-white shadow-lg" : "text-gray-400 hover:text-white"
                }`}
              >
                <Smartphone className="w-4 h-4" /> UPI ID
              </button>
            </div>
          )}

          {methodType === "Card" ? (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-gray-400 mb-2">Card Holder Name</label>
                <input required type="text" name="name" value={formData.name || ''} onChange={handleChange} className="w-full bg-[#111] text-white border border-white/10 rounded-xl px-4 py-3.5 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors" placeholder="e.g. John Doe" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-400 mb-2">Card Number</label>
                <input required type="text" name="cardNumber" value={formData.cardNumber || (formData.maskedNumber ? formData.maskedNumber.replace(/\*/g, '').trim() : '')} onChange={handleChange} className="w-full bg-[#111] text-white border border-white/10 rounded-xl px-4 py-3.5 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors" placeholder="xxxx xxxx xxxx xxxx" maxLength={16} />
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-400 mb-2">Expiry Date</label>
                  <input required type="text" name="expiry" value={formData.expiry || ''} onChange={handleChange} className="w-full bg-[#111] text-white border border-white/10 rounded-xl px-4 py-3.5 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors" placeholder="MM/YY" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-400 mb-2">CVV</label>
                  <input required={!initialData} type="password" name="cvv" maxLength={3} className="w-full bg-[#111] text-white border border-white/10 rounded-xl px-4 py-3.5 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors" placeholder="***" />
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-gray-400 mb-2">UPI ID</label>
                <input required type="text" name="upiId" value={formData.upiId || ''} onChange={handleChange} className="w-full bg-[#111] text-white border border-white/10 rounded-xl px-4 py-3.5 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors" placeholder="e.g. name@bank" />
              </div>
            </div>
          )}

          {/* Default Checkbox (Only for Cards) */}
          {methodType === "Card" && (
            <div className="mt-8 mb-4">
              <label className="flex items-center gap-3 cursor-pointer group w-max">
                <div className={`w-6 h-6 rounded border flex items-center justify-center transition-colors ${
                  formData.isDefault ? 'bg-primary border-primary' : 'border-white/20 group-hover:border-white/50 bg-[#111]'
                }`}>
                  {formData.isDefault && <Check className="w-4 h-4 text-white" />}
                </div>
                <input 
                  type="checkbox" 
                  className="hidden" 
                  checked={formData.isDefault}
                  onChange={(e) => setFormData((prev: any) => ({ ...prev, isDefault: e.target.checked }))}
                />
                <span className="text-white font-bold select-none">Set as Default Card</span>
              </label>
            </div>
          )}

          <div className="flex gap-4 pt-8 mt-4 border-t border-white/10">
            <button 
              type="button" 
              onClick={onClose}
              className="flex-1 bg-white/5 hover:bg-white/10 text-white py-4 rounded-xl font-bold transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit"
              className="flex-1 bg-primary hover:bg-[#e02633] text-white py-4 rounded-xl font-bold transition-colors shadow-[0_0_20px_rgba(255,45,59,0.3)]"
            >
              Save
            </button>
          </div>

        </form>
      </motion.div>
    </div>
  );
}
