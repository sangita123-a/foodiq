"use client";

import { Bike, ShoppingBag } from "lucide-react";
import { SettingsState } from "../types";
import { motion } from "framer-motion";

interface DeliverySettingsProps {
  data: SettingsState["delivery"];
  onChange: (data: Partial<SettingsState["delivery"]>) => void;
}

export default function DeliverySettings({ data, onChange }: DeliverySettingsProps) {
  
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-black text-[#111827] flex items-center gap-2 mb-2">
          <Bike className="w-6 h-6 text-[#E23744]" /> Delivery Settings
        </h2>
        <p className="text-[#6B7280] text-sm mb-6">Configure your delivery radius, minimums, and order types.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div>
          <label className="block text-xs font-bold text-[#6B7280] uppercase tracking-wider mb-2">Delivery Radius (km)</label>
          <input 
            type="number" 
            value={data.radius}
            onChange={(e) => onChange({ radius: Number(e.target.value) })}
            className="w-full bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl px-4 py-3 text-[#111827] focus:outline-none focus:border-[#E23744] transition-colors text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-[#6B7280] uppercase tracking-wider mb-2">Minimum Order Amount (₹)</label>
          <input 
            type="number" 
            value={data.minOrderAmount}
            onChange={(e) => onChange({ minOrderAmount: Number(e.target.value) })}
            className="w-full bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl px-4 py-3 text-[#111827] focus:outline-none focus:border-[#E23744] transition-colors text-sm"
          />
        </div>
        <div className="md:col-span-2 lg:col-span-1">
          <label className="block text-xs font-bold text-[#6B7280] uppercase tracking-wider mb-2">Est. Delivery Time (Mins)</label>
          <input 
            type="number" 
            value={data.estimatedTime}
            onChange={(e) => onChange({ estimatedTime: Number(e.target.value) })}
            className="w-full bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl px-4 py-3 text-[#111827] focus:outline-none focus:border-[#E23744] transition-colors text-sm"
          />
        </div>
      </div>

      <div className="w-full h-px bg-[#F8FAFC] my-8"></div>

      <div className="space-y-4">
        
        {/* Accept Online Orders Toggle */}
        <div className="bg-[#F8FAFC] border border-[#E5E7EB] rounded-2xl p-5 flex items-center justify-between cursor-pointer group hover:border-[#E5E7EB] transition-colors" onClick={() => onChange({ acceptOnlineOrders: !data.acceptOnlineOrders })}>
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${data.acceptOnlineOrders ? 'bg-[#E23744]/20 border border-[#E23744]/30' : 'bg-[#FFFFFF] border border-[#E5E7EB]'}`}>
              <Bike className={`w-6 h-6 ${data.acceptOnlineOrders ? 'text-[#E23744]' : 'text-[#9CA3AF]'}`} />
            </div>
            <div>
              <h4 className="text-[#111827] font-bold mb-1">Accept Delivery Orders</h4>
              <p className="text-[#6B7280] text-xs">Allow customers to place orders for home delivery.</p>
            </div>
          </div>
          
          <div className={`w-12 h-6 rounded-full p-1 transition-colors ${data.acceptOnlineOrders ? 'bg-[#E23744]' : 'bg-[#FFFFFF] border border-[#E5E7EB]'}`}>
            <motion.div 
              layout
              className="w-4 h-4 rounded-full bg-white shadow-md"
              animate={{ x: data.acceptOnlineOrders ? 24 : 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            />
          </div>
        </div>

        {/* Accept Pickup Orders Toggle */}
        <div className="bg-[#F8FAFC] border border-[#E5E7EB] rounded-2xl p-5 flex items-center justify-between cursor-pointer group hover:border-[#E5E7EB] transition-colors" onClick={() => onChange({ acceptPickupOrders: !data.acceptPickupOrders })}>
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${data.acceptPickupOrders ? 'bg-[#E23744]/20 border border-[#E23744]/30' : 'bg-[#FFFFFF] border border-[#E5E7EB]'}`}>
              <ShoppingBag className={`w-6 h-6 ${data.acceptPickupOrders ? 'text-[#E23744]' : 'text-[#9CA3AF]'}`} />
            </div>
            <div>
              <h4 className="text-[#111827] font-bold mb-1">Accept Pickup Orders</h4>
              <p className="text-[#6B7280] text-xs">Allow customers to order online and pick up in store.</p>
            </div>
          </div>
          
          <div className={`w-12 h-6 rounded-full p-1 transition-colors ${data.acceptPickupOrders ? 'bg-[#E23744]' : 'bg-[#FFFFFF] border border-[#E5E7EB]'}`}>
            <motion.div 
              layout
              className="w-4 h-4 rounded-full bg-white shadow-md"
              animate={{ x: data.acceptPickupOrders ? 24 : 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            />
          </div>
        </div>

      </div>
    </div>
  );
}
