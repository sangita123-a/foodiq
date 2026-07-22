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
    <div className="sticky top-[64px] md:top-[72px] lg:top-[80px] z-40 bg-background/90 backdrop-blur-md border-b border-border pt-3 sm:pt-4 pb-0 w-full shadow-lg">
      <div className="container mx-auto px-3 sm:px-4 md:px-8">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
          
          <div className="flex scroll-row flex-1 order-2 md:order-1">
            {categories.map((category) => {
              const isActive = activeCategory === category;
              return (
                <button
                  key={category}
                  onClick={() => onCategoryClick(category)}
                  className={`touch-target whitespace-nowrap pb-3 sm:pb-4 px-1 text-xs sm:text-sm md:text-base font-semibold border-b-2 transition-colors duration-300 ${
                    isActive 
                    ? 'border-primary text-primary' 
                    : 'border-transparent text-gray-text hover:text-foreground'
                  }`}
                >
                  {category}
                </button>
              );
            })}
          </div>

          <div className="relative w-full md:w-64 flex-shrink-0 mb-2 md:mb-0 order-1 md:order-2">
            <input 
              type="text" 
              placeholder="Search dishes..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full bg-section text-foreground border border-border rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all placeholder-gray-500 min-h-[44px]"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
          </div>

        </div>
      </div>
    </div>
  );
}
