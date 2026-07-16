"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { X, Home, Briefcase, MapPin, Check } from "lucide-react";
import { AddressType } from "./AddressCard";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSave: (address: AddressType) => void;
  initialData?: AddressType | null;
};

export default function AddressFormModal({ isOpen, onClose, onSave, initialData }: Props) {
  const [formData, setFormData] = useState<Partial<AddressType>>({
    type: "Home",
    isDefault: false,
  });

  // Populate form when editing
  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      setFormData({ type: "Home", isDefault: false }); // Reset for new
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Generate an ID if it's a new address
    const finalAddress = {
      ...formData,
      id: formData.id || `addr_${Date.now()}`
    } as AddressType;
    
    onSave(finalAddress);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="bg-[#171717] rounded-3xl w-full max-w-2xl border border-white/10 shadow-[0_20px_60px_rgba(255,45,59,0.15)] overflow-hidden max-h-[90vh] flex flex-col"
      >
        {/* Modal Header */}
        <div className="p-6 md:p-8 border-b border-white/10 flex justify-between items-center bg-[#111]">
          <h2 className="text-2xl font-bold text-white">
            {initialData ? "Edit Address" : "Add New Address"}
          </h2>
          <button 
            onClick={onClose}
            className="w-10 h-10 bg-white/5 hover:bg-white/10 rounded-full flex items-center justify-center text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body / Form */}
        <form onSubmit={handleSubmit} className="p-6 md:p-8 overflow-y-auto custom-scrollbar">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div>
              <label className="block text-sm font-bold text-gray-400 mb-2">Full Name</label>
              <input required type="text" name="name" value={formData.name || ''} onChange={handleChange} className="w-full bg-[#111] text-white border border-white/10 rounded-xl px-4 py-3.5 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors" placeholder="e.g. John Doe" />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-400 mb-2">Mobile Number</label>
              <input required type="text" name="phone" value={formData.phone || ''} onChange={handleChange} className="w-full bg-[#111] text-white border border-white/10 rounded-xl px-4 py-3.5 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors" placeholder="e.g. 9876543210" />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 mb-8">
            <div>
              <label className="block text-sm font-bold text-gray-400 mb-2">House / Flat No.</label>
              <input required type="text" name="flat" value={formData.flat || ''} onChange={handleChange} className="w-full bg-[#111] text-white border border-white/10 rounded-xl px-4 py-3.5 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors" placeholder="e.g. Flat 402, Block A" />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-400 mb-2">Street / Area</label>
              <input required type="text" name="street" value={formData.street || ''} onChange={handleChange} className="w-full bg-[#111] text-white border border-white/10 rounded-xl px-4 py-3.5 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors" placeholder="e.g. MG Road" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div>
              <label className="block text-sm font-bold text-gray-400 mb-2">Landmark (Optional)</label>
              <input type="text" name="landmark" value={formData.landmark || ''} onChange={handleChange} className="w-full bg-[#111] text-white border border-white/10 rounded-xl px-4 py-3.5 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors" placeholder="e.g. Near City Mall" />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-400 mb-2">Pincode</label>
              <input required type="text" name="pincode" value={formData.pincode || ''} onChange={handleChange} className="w-full bg-[#111] text-white border border-white/10 rounded-xl px-4 py-3.5 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors" placeholder="e.g. 560001" />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-400 mb-2">City</label>
              <input required type="text" name="city" value={formData.city || ''} onChange={handleChange} className="w-full bg-[#111] text-white border border-white/10 rounded-xl px-4 py-3.5 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors" placeholder="e.g. Bangalore" />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-400 mb-2">State</label>
              <input required type="text" name="state" value={formData.state || ''} onChange={handleChange} className="w-full bg-[#111] text-white border border-white/10 rounded-xl px-4 py-3.5 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors" placeholder="e.g. Karnataka" />
            </div>
          </div>

          {/* Address Type Selection */}
          <div className="mb-8">
            <label className="block text-sm font-bold text-gray-400 mb-4">Save Address As</label>
            <div className="flex flex-wrap gap-4">
              {['Home', 'Work', 'Other'].map((type) => {
                const isSelected = formData.type === type;
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, type: type as any }))}
                    className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all border ${
                      isSelected 
                        ? 'bg-primary/10 border-primary text-primary' 
                        : 'bg-[#111] border-white/10 text-gray-400 hover:border-white/30 hover:text-white'
                    }`}
                  >
                    {type === 'Home' && <Home className="w-4 h-4" />}
                    {type === 'Work' && <Briefcase className="w-4 h-4" />}
                    {type === 'Other' && <MapPin className="w-4 h-4" />}
                    {type}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Default Checkbox */}
          <div className="mb-8">
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
                onChange={(e) => setFormData(prev => ({ ...prev, isDefault: e.target.checked }))}
              />
              <span className="text-white font-bold select-none">Set as Default Address</span>
            </label>
          </div>

          {/* Form Actions */}
          <div className="flex gap-4 pt-6 border-t border-white/10">
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
              Save Address
            </button>
          </div>

        </form>
      </motion.div>
    </div>
  );
}
