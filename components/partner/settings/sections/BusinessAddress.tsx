"use client";

import { MapPin } from "lucide-react";
import { SettingsState } from "../types";
import { motion } from "framer-motion";

interface BusinessAddressProps {
  data: SettingsState["address"];
  onChange: (data: Partial<SettingsState["address"]>) => void;
}

export default function BusinessAddress({ data, onChange }: BusinessAddressProps) {
  
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-black text-[#111827] flex items-center gap-2 mb-2">
          <MapPin className="w-6 h-6 text-[#E23744]" /> Business Address
        </h2>
        <p className="text-[#6B7280] text-sm mb-6">Set your restaurant's physical location for delivery and pickup.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="md:col-span-2">
          <label className="block text-xs font-bold text-[#6B7280] uppercase tracking-wider mb-2">Street Address</label>
          <input 
            type="text" 
            value={data.street}
            onChange={(e) => onChange({ street: e.target.value })}
            className="w-full bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl px-4 py-3 text-[#111827] focus:outline-none focus:border-[#E23744] transition-colors text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-[#6B7280] uppercase tracking-wider mb-2">City</label>
          <input 
            type="text" 
            value={data.city}
            onChange={(e) => onChange({ city: e.target.value })}
            className="w-full bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl px-4 py-3 text-[#111827] focus:outline-none focus:border-[#E23744] transition-colors text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-[#6B7280] uppercase tracking-wider mb-2">State</label>
          <input 
            type="text" 
            value={data.state}
            onChange={(e) => onChange({ state: e.target.value })}
            className="w-full bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl px-4 py-3 text-[#111827] focus:outline-none focus:border-[#E23744] transition-colors text-sm"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-xs font-bold text-[#6B7280] uppercase tracking-wider mb-2">Pincode</label>
          <input 
            type="text" 
            value={data.pincode}
            onChange={(e) => onChange({ pincode: e.target.value })}
            className="w-full md:w-1/2 bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl px-4 py-3 text-[#111827] focus:outline-none focus:border-[#E23744] transition-colors text-sm"
          />
        </div>
      </div>

      <div className="mt-8">
        <label className="block text-xs font-bold text-[#6B7280] uppercase tracking-wider mb-2">Pin Location on Map</label>
        
        <div className="w-full h-64 bg-[#F8FAFC] border border-[#E5E7EB] rounded-3xl relative overflow-hidden group">
          {/* Abstract map pattern simulation */}
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white/20 via-transparent to-transparent bg-[length:20px_20px]"></div>
          
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div 
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              <MapPin className="w-10 h-10 text-[#E23744] drop-shadow-[0_10px_10px_rgba(226, 55, 68,0.5)]" />
            </motion.div>
          </div>

          <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center">
            <button className="px-6 py-3 bg-white text-black rounded-xl font-bold text-sm hover:bg-[#F8FAFC] transition-colors shadow-lg">
              Open Google Maps Integration
            </button>
            <p className="text-[#6B7280] text-xs mt-3">API configuration required.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
