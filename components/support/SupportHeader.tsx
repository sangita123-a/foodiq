"use client";

import { HelpCircle, Search } from "lucide-react";

export default function SupportHeader() {
  return (
    <div className="mb-16 text-center">
      <h1 className="mb-4 flex items-center justify-center gap-4 text-4xl font-black tracking-[-0.045em] text-[#1C1C1C] md:text-5xl lg:text-6xl">
        <HelpCircle className="w-12 h-12 md:w-16 md:h-16 text-[#E23744]" />
        Help & Support
      </h1>
      <p className="mx-auto mb-12 max-w-2xl text-lg leading-relaxed text-[#686B78] md:text-xl">
        Need help? We're here to assist you 24/7. Search our knowledge base or get in touch.
      </p>

      {/* Large Search Bar */}
      <div className="max-w-3xl mx-auto relative group">
        <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
          <Search className="h-6 w-6 text-[#686B78] transition-colors group-focus-within:text-primary" />
        </div>
        <input 
          type="text" 
          placeholder="Search for help articles, order issues, refunds..." 
          className="w-full rounded-full border border-[#ECECEC] bg-white py-5 pl-16 pr-6 text-lg text-[#1C1C1C] shadow-[0_12px_32px_rgba(28,28,28,0.08)] transition-all focus:border-primary focus:bg-[#F8F9FA] focus:outline-none focus:ring-2 focus:ring-[#E23744]/15"
        />
        <button className="absolute inset-y-2 right-2 rounded-full bg-[#E23744] px-8 font-bold text-white shadow-[0_8px_18px_rgba(226, 55, 68,0.18)] transition-all hover:bg-[#E23744]">
          Search
        </button>
      </div>
    </div>
  );
}
