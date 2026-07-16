"use client";

import { HelpCircle, Search } from "lucide-react";

export default function SupportHeader() {
  return (
    <div className="mb-16 text-center">
      <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white mb-4 flex items-center justify-center gap-4">
        <HelpCircle className="w-12 h-12 md:w-16 md:h-16 text-[#FF2D3B]" />
        Help & Support
      </h1>
      <p className="text-[#A1A1A1] text-lg md:text-xl mb-12 max-w-2xl mx-auto">
        Need help? We're here to assist you 24/7. Search our knowledge base or get in touch.
      </p>

      {/* Large Search Bar */}
      <div className="max-w-3xl mx-auto relative group">
        <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
          <Search className="w-6 h-6 text-gray-400 group-focus-within:text-primary transition-colors" />
        </div>
        <input 
          type="text" 
          placeholder="Search for help articles, order issues, refunds..." 
          className="w-full bg-[#111] text-white border-2 border-white/10 rounded-full py-5 pl-16 pr-6 text-lg focus:outline-none focus:border-primary focus:bg-[#1a1a1a] transition-all shadow-2xl"
        />
        <button className="absolute inset-y-2 right-2 bg-primary hover:bg-[#e02633] text-white px-8 rounded-full font-bold transition-colors">
          Search
        </button>
      </div>
    </div>
  );
}
