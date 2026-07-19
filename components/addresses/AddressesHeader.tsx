"use client";

import { MapPin, Plus, Search } from "lucide-react";

type Props = {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onAddNew: () => void;
};

export default function AddressesHeader({ searchQuery, setSearchQuery, onAddNew }: Props) {
  return (
    <div className="mb-8 flex flex-col gap-6 border-b border-[#ECECEC] pb-8">
      
      {/* Top Row: Title & Add Button */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="mb-3 flex items-center gap-4 text-3xl font-black tracking-[-0.04em] text-[#1C1C1C] md:text-4xl lg:text-5xl">
            <MapPin className="w-10 h-10 md:w-12 md:h-12 text-[#E23744]" />
            Saved Addresses
          </h1>
          <p className="text-lg text-[#686B78]">
            Manage your delivery addresses for faster checkout.
          </p>
        </div>
        
        <button 
          onClick={onAddNew}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#E23744] px-6 py-4 font-bold text-white shadow-[0_10px_24px_rgba(226, 55, 68,0.20)] transition-all hover:-translate-y-1 hover:bg-[#E23744] md:w-auto"
        >
          <Plus className="w-5 h-5" />
          Add New Address
        </button>
      </div>

      {/* Bottom Row: Search */}
      <div className="relative w-full md:w-[400px]">
        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-[#686B78]" />
        </div>
        <input 
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search saved addresses..."
          className="w-full rounded-xl border border-[#ECECEC] bg-[#F8F9FA] py-3.5 pl-12 pr-4 text-[#1C1C1C] transition-all placeholder:text-[#686B78] focus:border-[#E23744] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#E23744]/15"
        />
      </div>

    </div>
  );
}
