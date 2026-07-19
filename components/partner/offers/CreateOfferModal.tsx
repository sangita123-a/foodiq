"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Save, Tag } from "lucide-react";
import { Offer, DiscountType } from "./types";

interface CreateOfferModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (offer: Offer) => void;
}

export default function CreateOfferModal({ isOpen, onClose, onSave }: CreateOfferModalProps) {
  
  const [formData, setFormData] = useState<Partial<Offer>>({
    name: "",
    code: "",
    type: "Percentage Discount",
    value: 10,
    minOrderValue: 200,
    startDate: "",
    endDate: "",
    usageLimit: 100,
    description: ""
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Generate mock ID and complete the object
    const newOffer: Offer = {
      id: `OFF-${Math.floor(Math.random() * 10000)}`,
      name: formData.name || "New Offer",
      code: formData.code?.toUpperCase() || "NEW10",
      type: formData.type as DiscountType,
      value: formData.value || 0,
      minOrderValue: formData.minOrderValue || 0,
      startDate: formData.startDate || "2026-07-16",
      endDate: formData.endDate || "2026-07-31",
      usageLimit: formData.usageLimit || 100,
      usageCount: 0,
      applicableCategories: [],
      applicableDishes: [],
      description: formData.description || "",
      status: "Active"
    };

    onSave(newOffer);
    
    // Reset Form
    setFormData({
      name: "",
      code: "",
      type: "Percentage Discount",
      value: 10,
      minOrderValue: 200,
      startDate: "",
      endDate: "",
      usageLimit: 100,
      description: ""
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#F8FAFC] backdrop-blur-sm z-40"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed inset-0 m-auto w-full max-w-3xl h-[90vh] md:h-auto md:max-h-[85vh] bg-[#FFFFFF] rounded-3xl border border-[#E5E7EB] shadow-2xl z-50 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="p-6 border-b border-[#E5E7EB] flex items-center justify-between bg-[#F8FAFC]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#E23744]/20 flex items-center justify-center border border-[#E23744]/30">
                  <Tag className="w-5 h-5 text-[#E23744]" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-[#111827]">Create New Offer</h2>
                  <p className="text-[#6B7280] text-xs mt-1">Configure your promotional campaign</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="w-10 h-10 rounded-xl bg-[#FFFFFF] flex items-center justify-center text-[#6B7280] hover:text-[#111827] hover:bg-[#F8FAFC] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Content */}
            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
              <form id="offerForm" onSubmit={handleSubmit} className="space-y-6">
                
                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-[#6B7280] uppercase tracking-wider mb-2">Offer Name</label>
                    <input 
                      required
                      type="text" 
                      value={formData.name}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                      placeholder="e.g. Summer Special 20%"
                      className="w-full bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl px-4 py-3 text-[#111827] focus:outline-none focus:border-[#E23744] transition-colors text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#6B7280] uppercase tracking-wider mb-2">Coupon Code</label>
                    <input 
                      required
                      type="text" 
                      value={formData.code}
                      onChange={e => setFormData({...formData, code: e.target.value})}
                      placeholder="e.g. SUMMER20"
                      className="w-full bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl px-4 py-3 text-[#111827] focus:outline-none focus:border-[#E23744] transition-colors text-sm uppercase placeholder:normal-case font-bold tracking-widest"
                    />
                  </div>
                </div>

                {/* Configuration */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-[#F8FAFC] p-5 rounded-2xl border border-[#E5E7EB]">
                  <div>
                    <label className="block text-xs font-bold text-[#6B7280] uppercase tracking-wider mb-2">Discount Type</label>
                    <select 
                      value={formData.type}
                      onChange={e => setFormData({...formData, type: e.target.value as DiscountType})}
                      className="w-full bg-[#FFFFFF] border border-[#E5E7EB] rounded-xl px-4 py-3 text-[#111827] focus:outline-none focus:border-[#E23744] transition-colors appearance-none text-sm cursor-pointer"
                    >
                      <option value="Percentage Discount">Percentage (%)</option>
                      <option value="Flat Discount">Flat Amount (₹)</option>
                      <option value="Free Delivery">Free Delivery</option>
                      <option value="Buy One Get One (BOGO)">BOGO</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#6B7280] uppercase tracking-wider mb-2">Discount Value</label>
                    <input 
                      type="number" 
                      value={formData.value}
                      onChange={e => setFormData({...formData, value: Number(e.target.value)})}
                      className="w-full bg-[#FFFFFF] border border-[#E5E7EB] rounded-xl px-4 py-3 text-[#111827] focus:outline-none focus:border-[#E23744] transition-colors text-sm"
                      disabled={formData.type === 'Free Delivery' || formData.type === 'Buy One Get One (BOGO)'}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#6B7280] uppercase tracking-wider mb-2">Min Order (₹)</label>
                    <input 
                      type="number" 
                      value={formData.minOrderValue}
                      onChange={e => setFormData({...formData, minOrderValue: Number(e.target.value)})}
                      className="w-full bg-[#FFFFFF] border border-[#E5E7EB] rounded-xl px-4 py-3 text-[#111827] focus:outline-none focus:border-[#E23744] transition-colors text-sm"
                    />
                  </div>
                </div>

                {/* Limits & Dates */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-[#6B7280] uppercase tracking-wider mb-2">Usage Limit</label>
                    <input 
                      type="number" 
                      value={formData.usageLimit}
                      onChange={e => setFormData({...formData, usageLimit: Number(e.target.value)})}
                      className="w-full bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl px-4 py-3 text-[#111827] focus:outline-none focus:border-[#E23744] transition-colors text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#6B7280] uppercase tracking-wider mb-2">Start Date</label>
                    <input 
                      type="date" 
                      value={formData.startDate}
                      onChange={e => setFormData({...formData, startDate: e.target.value})}
                      className="w-full bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl px-4 py-3 text-[#111827] focus:outline-none focus:border-[#E23744] transition-colors text-sm cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#6B7280] uppercase tracking-wider mb-2">End Date</label>
                    <input 
                      type="date" 
                      value={formData.endDate}
                      onChange={e => setFormData({...formData, endDate: e.target.value})}
                      className="w-full bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl px-4 py-3 text-[#111827] focus:outline-none focus:border-[#E23744] transition-colors text-sm cursor-pointer"
                    />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-bold text-[#6B7280] uppercase tracking-wider mb-2">Description / T&C</label>
                  <textarea 
                    value={formData.description}
                    onChange={e => setFormData({...formData, description: e.target.value})}
                    placeholder="Enter offer terms and conditions..."
                    rows={3}
                    className="w-full bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl px-4 py-3 text-[#111827] focus:outline-none focus:border-[#E23744] transition-colors text-sm resize-none"
                  />
                </div>

              </form>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-[#E5E7EB] bg-[#F8FAFC] flex justify-end gap-4">
              <button 
                onClick={onClose}
                className="px-6 py-3 rounded-xl font-bold text-[#6B7280] hover:text-[#111827] transition-colors"
              >
                Cancel
              </button>
              <button 
                type="submit"
                form="offerForm"
                className="px-8 py-3 bg-[#E23744] hover:bg-[#C81E34] text-white rounded-xl font-bold flex items-center gap-2 transition-colors shadow-lg shadow-[#E23744]/20"
              >
                <Save className="w-4 h-4" /> Save Offer
              </button>
            </div>

          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
