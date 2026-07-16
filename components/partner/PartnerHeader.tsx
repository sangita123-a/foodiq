"use client";

import { useState } from "react";
import { Bell, ChevronDown, Menu } from "lucide-react";
import Image from "next/image";

export default function PartnerHeader() {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="h-20 bg-[#171717] border-b border-white/5 flex items-center justify-between px-4 lg:px-8 sticky top-0 z-30">
      
      {/* Left: Mobile Menu & Restaurant Info */}
      <div className="flex items-center gap-4">
        <button className="lg:hidden text-gray-400 hover:text-white transition-colors">
          <Menu className="w-6 h-6" />
        </button>
        
        <div className="hidden sm:flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center overflow-hidden border-2 border-white/10">
            <img 
              src="https://images.crunchbase.com/image/upload/c_pad,h_256,w_256,f_auto,q_auto:eco,dpr_1/g1uompslbfswsnhm8pys" 
              alt="Restaurant Logo" 
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <h2 className="text-white font-black leading-none">Paradise Biryani</h2>
            <p className="text-gray-500 text-xs mt-1">ID: #RES-8924</p>
          </div>
        </div>
      </div>

      {/* Right: Controls & Profile */}
      <div className="flex items-center gap-6">
        
        {/* Status Toggle */}
        <div className="flex items-center gap-3 bg-[#111] px-4 py-2 rounded-full border border-white/5">
          <span className={`text-xs font-bold uppercase tracking-wider ${isOpen ? 'text-green-400' : 'text-gray-500'}`}>
            {isOpen ? 'Accepting Orders' : 'Closed'}
          </span>
          <button 
            onClick={() => setIsOpen(!isOpen)}
            className={`w-12 h-6 rounded-full transition-colors relative ${isOpen ? 'bg-green-500/20 border border-green-500/50' : 'bg-gray-700 border border-gray-600'}`}
          >
            <div className={`w-4 h-4 rounded-full bg-white absolute top-0.5 transition-all ${isOpen ? 'left-7 shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'left-1'}`}></div>
          </button>
        </div>

        {/* Notifications */}
        <button className="relative text-gray-400 hover:text-white transition-colors">
          <Bell className="w-6 h-6" />
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-[9px] font-bold text-white rounded-full flex items-center justify-center border-2 border-[#171717]">
            3
          </span>
        </button>

        {/* Profile Dropdown */}
        <div className="flex items-center gap-2 cursor-pointer group">
          <div className="w-9 h-9 rounded-full bg-[#111] border border-white/10 overflow-hidden">
            <img 
              src="https://randomuser.me/api/portraits/men/32.jpg" 
              alt="Owner" 
              className="w-full h-full object-cover"
            />
          </div>
          <ChevronDown className="w-4 h-4 text-gray-500 group-hover:text-white transition-colors hidden sm:block" />
        </div>

      </div>

    </div>
  );
}
