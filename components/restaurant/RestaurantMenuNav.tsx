"use client";

import { Search } from "lucide-react";

type RestaurantMenuNavProps = {
  categories: string[];
  activeCategory: string;
  onCategoryClick: (category: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
};

export default function RestaurantMenuNav({ 
  categories, 
  activeCategory, 
  onCategoryClick,
  searchQuery,
  onSearchChange
}: RestaurantMenuNavProps) {
  return (
    <div className="sticky top-[80px] z-40 bg-[#0B0B0B]/90 backdrop-blur-md border-b border-white/10 pt-4 pb-0 w-full shadow-lg">
      <div className="container mx-auto px-4 md:px-8">
        
        {/* Search Bar - Mobile: Top, Desktop: Right aligned with nav */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Scrollable Categories Navigation */}
          <div className="flex-1 overflow-x-auto custom-scrollbar-hide flex gap-6" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            {categories.map((category) => {
              const isActive = activeCategory === category;
              return (
                <button
                  key={category}
                  onClick={() => onCategoryClick(category)}
                  className={`whitespace-nowrap pb-4 px-1 text-sm md:text-base font-semibold border-b-2 transition-colors duration-300 ${
                    isActive 
                    ? 'border-[#FF2D3B] text-[#FF2D3B]' 
                    : 'border-transparent text-gray-400 hover:text-white'
                  }`}
                >
                  {category}
                </button>
              );
            })}
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-64 flex-shrink-0 mb-4 md:mb-0">
            <input 
              type="text" 
              placeholder="Search dishes..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full bg-[#1A1A1A] text-white border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-[#FF2D3B]/50 focus:ring-1 focus:ring-[#FF2D3B]/50 transition-all placeholder-gray-500"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          </div>

        </div>
      </div>
    </div>
  );
}
