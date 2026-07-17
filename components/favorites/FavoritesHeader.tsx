"use client";

import { Heart, Search } from "lucide-react";

type Props = {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
};

export default function FavoritesHeader({ searchQuery, setSearchQuery }: Props) {
  return (
    <div className="mb-8 flex flex-col justify-between gap-6 border-b border-[#ECECEC] pb-8 md:flex-row md:items-end">
      <div>
        <h1 className="mb-3 flex items-center gap-4 text-3xl font-black tracking-[-0.04em] text-[#1C1C1C] md:text-4xl lg:text-5xl">
          <Heart className="h-10 w-10 fill-[#EF4F5F] text-[#EF4F5F] md:h-12 md:w-12" />
          Your Favorites
        </h1>
        <p className="text-lg text-[#686B78]">
          Quickly access the restaurants and dishes you love the most.
        </p>
      </div>

      <div className="relative w-full md:w-[350px]">
        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-[#686B78]" />
        </div>
        <input 
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search your favorite restaurants or dishes..."
          className="w-full rounded-xl border border-[#ECECEC] bg-[#F8F9FA] py-3.5 pl-12 pr-4 text-[#1C1C1C] transition-all placeholder:text-[#686B78] focus:border-[#FC8019] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FC8019]/15"
        />
      </div>
    </div>
  );
}
