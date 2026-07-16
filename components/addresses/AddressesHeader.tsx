"use client";

import { MapPin, Plus, Search } from "lucide-react";

type Props = {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onAddNew: () => void;
};

export default function AddressesHeader({ searchQuery, setSearchQuery, onAddNew }: Props) {
  return (
    <div className="flex flex-col gap-6 mb-8 border-b border-white/5 pb-8">
      
      {/* Top Row: Title & Add Button */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-white mb-3 flex items-center gap-4">
            <MapPin className="w-10 h-10 md:w-12 md:h-12 text-[#FF2D3B]" />
            Saved Addresses
          </h1>
          <p className="text-[#A1A1A1] text-lg">
            Manage your delivery addresses for faster checkout.
          </p>
        </div>
        
        <button 
          onClick={onAddNew}
          className="bg-primary hover:bg-[#e02633] text-white px-6 py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors shadow-[0_0_20px_rgba(255,45,59,0.3)] hover:-translate-y-1 w-full md:w-auto"
        >
          <Plus className="w-5 h-5" />
          Add New Address
        </button>
      </div>

      {/* Bottom Row: Search */}
      <div className="relative w-full md:w-[400px]">
        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
          <Search className="w-5 h-5 text-gray-400" />
        </div>
        <input 
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search saved addresses..."
          className="w-full bg-[#171717] text-white border border-white/10 rounded-xl py-3.5 pl-12 pr-4 focus:outline-none focus:border-[#FF2D3B] focus:ring-1 focus:ring-[#FF2D3B] transition-all placeholder:text-gray-500"
        />
      </div>

    </div>
  );
}
