"use client";

import { Heart, Search } from "lucide-react";

type Props = {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
};

export default function FavoritesHeader({ searchQuery, setSearchQuery }: Props) {
  return (
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 border-b border-white/5 pb-8">
      <div>
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-white mb-3 flex items-center gap-4">
          <Heart className="w-10 h-10 md:w-12 md:h-12 text-[#FF2D3B] fill-[#FF2D3B]" />
          Your Favorites
        </h1>
        <p className="text-[#A1A1A1] text-lg">
          Quickly access the restaurants and dishes you love the most.
        </p>
      </div>

      <div className="relative w-full md:w-[350px]">
        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
          <Search className="w-5 h-5 text-gray-400" />
        </div>
        <input 
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search your favorite restaurants or dishes..."
          className="w-full bg-[#171717] text-white border border-white/10 rounded-xl py-3.5 pl-12 pr-4 focus:outline-none focus:border-[#FF2D3B] focus:ring-1 focus:ring-[#FF2D3B] transition-all placeholder:text-gray-500"
        />
      </div>
    </div>
  );
}
