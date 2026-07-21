"use client";

import { MapPin, Plus, Search } from "lucide-react";

type Props = {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onAddNew: () => void;
};

export default function AddressesHeader({ searchQuery, setSearchQuery, onAddNew }: Props) {
  return (
    <div className="mb-8 flex flex-col gap-6 border-b border-border pb-8">
      
      {/* Top Row: Title & Add Button */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="mb-3 flex items-center gap-4 text-3xl font-black tracking-[-0.04em] text-foreground md:text-4xl lg:text-5xl">
            <MapPin className="w-10 h-10 md:w-12 md:h-12 text-primary" />
            Saved Addresses
          </h1>
          <p className="text-lg text-muted">
            Manage your delivery addresses for faster checkout.
          </p>
        </div>
        
        <button 
          onClick={onAddNew}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 py-4 font-bold text-white shadow-[0_10px_24px_rgba(226, 55, 68,0.20)] transition-all hover:-translate-y-1 hover:bg-primary md:w-auto"
        >
          <Plus className="w-5 h-5" />
          Add New Address
        </button>
      </div>

      {/* Bottom Row: Search */}
      <div className="relative w-full md:w-[400px]">
        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-muted" />
        </div>
        <input 
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search saved addresses..."
          className="w-full rounded-xl border border-border bg-[#F8F9FA] py-3.5 pl-12 pr-4 text-foreground transition-all placeholder:text-muted focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/15"
        />
      </div>

    </div>
  );
}
