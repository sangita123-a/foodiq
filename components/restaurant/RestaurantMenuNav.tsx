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
    <div className="sticky top-[80px] z-40 bg-[#FFFFFF]/90 backdrop-blur-md border-b border-[#E5E7EB] pt-4 pb-0 w-full shadow-lg">
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
                    ? 'border-[#FC8019] text-[#FC8019]' 
                    : 'border-transparent text-[#6B7280] hover:text-[#111827]'
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
              className="w-full bg-[#F8FAFC] text-[#111827] border border-[#E5E7EB] rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-[#FC8019]/50 focus:ring-1 focus:ring-[#FC8019]/50 transition-all placeholder-gray-500"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
          </div>

        </div>
      </div>
    </div>
  );
}
