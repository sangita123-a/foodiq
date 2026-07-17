"use client";

import { useState } from "react";
import { Bell, ChevronDown, Menu, User } from "lucide-react";
import SafeImage from "@/components/ui/SafeImage";
import { RESTAURANT_FALLBACK } from "@/lib/images";

export default function PartnerHeader() {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="h-20 bg-[#FFFFFF] border-b border-[#E5E7EB] flex items-center justify-between px-4 lg:px-8 sticky top-0 z-30">

      {/* Left: Mobile Menu & Restaurant Info */}
      <div className="flex items-center gap-4">
        <button className="lg:hidden text-[#6B7280] hover:text-[#111827] transition-colors">
          <Menu className="w-6 h-6" />
        </button>

        <div className="hidden sm:flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center overflow-hidden border-2 border-[#E5E7EB]">
            <SafeImage
              src="/images/catalog/logos/biryani.webp"
              fallback={RESTAURANT_FALLBACK}
              alt="Restaurant Logo"
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <h2 className="text-[#111827] font-black leading-none">Paradise Biryani</h2>
            <p className="text-[#9CA3AF] text-xs mt-1">ID: #RES-8924</p>
          </div>
        </div>
      </div>

      {/* Right: Controls & Profile */}
      <div className="flex items-center gap-6">

        {/* Status Toggle */}
        <div className="flex items-center gap-3 bg-[#F8FAFC] px-4 py-2 rounded-full border border-[#E5E7EB]">
          <span className={`text-xs font-bold uppercase tracking-wider ${isOpen ? 'text-green-400' : 'text-[#9CA3AF]'}`}>
            {isOpen ? 'Accepting Orders' : 'Closed'}
          </span>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className={`w-12 h-6 rounded-full transition-colors relative ${isOpen ? 'bg-green-500/20 border border-green-500/50' : 'bg-[#F8FAFC] border border-[#E5E7EB]'}`}
          >
            <div className={`w-4 h-4 rounded-full bg-white absolute top-0.5 transition-all ${isOpen ? 'left-7 shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'left-1'}`}></div>
          </button>
        </div>

        {/* Notifications */}
        <button className="relative text-[#6B7280] hover:text-[#111827] transition-colors">
          <Bell className="w-6 h-6" />
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#FC8019] text-[9px] font-bold text-white rounded-full flex items-center justify-center border-2 border-[#E5E7EB]">
            3
          </span>
        </button>

        {/* Profile Dropdown */}
        <div className="flex items-center gap-2 cursor-pointer group">
          <div className="w-9 h-9 rounded-full bg-[#F8FAFC] border border-[#E5E7EB] overflow-hidden flex items-center justify-center">
            <User className="w-5 h-5 text-[#6B7280]" aria-label="Owner" />
          </div>
          <ChevronDown className="w-4 h-4 text-[#9CA3AF] group-hover:text-[#111827] transition-colors hidden sm:block" />
        </div>

      </div>

    </div>
  );
}
