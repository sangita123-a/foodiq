"use client";

import { Search, Download, Star } from "lucide-react";

interface ReviewsFilterBarProps {
  search: string;
  setSearch: (val: string) => void;
  ratingFilter: string;
  setRatingFilter: (val: string) => void;
  dateRange: string;
  setDateRange: (val: string) => void;
  sortBy: string;
  setSortBy: (val: string) => void;
}

export default function ReviewsFilterBar({
  search, setSearch,
  ratingFilter, setRatingFilter,
  dateRange, setDateRange,
  sortBy, setSortBy
}: ReviewsFilterBarProps) {
  
  return (
    <div className="bg-[#FFFFFF] p-4 rounded-2xl border border-[#E5E7EB] flex flex-col xl:flex-row xl:items-center justify-between gap-4 mb-6 shadow-xl sticky top-24 z-30">
      
      <div className="flex flex-col md:flex-row items-center gap-4 flex-1 flex-wrap">
        <div className="relative w-full md:max-w-xs xl:max-w-md shrink-0">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9CA3AF]" />
          <input 
            type="text" 
            placeholder="Search Customer or Dish..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl pl-12 pr-4 py-2.5 text-[#111827] focus:outline-none focus:border-[#FC8019] transition-colors text-sm"
          />
        </div>
        
        <div className="relative w-full md:w-40 shrink-0">
          <Star className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-yellow-500" />
          <select 
            value={ratingFilter}
            onChange={(e) => setRatingFilter(e.target.value)}
            className="w-full bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl pl-10 pr-4 py-2.5 text-[#111827] focus:outline-none focus:border-[#FC8019] transition-colors appearance-none cursor-pointer text-sm"
          >
            <option value="All">All Ratings</option>
            <option value="5">5 Stars</option>
            <option value="4">4 Stars</option>
            <option value="3">3 Stars</option>
            <option value="2">2 Stars</option>
            <option value="1">1 Star</option>
          </select>
        </div>

        <select 
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value)}
          className="w-full md:w-36 bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl px-4 py-2.5 text-[#111827] focus:outline-none focus:border-[#FC8019] transition-colors appearance-none cursor-pointer text-sm shrink-0"
        >
          <option value="Today">Today</option>
          <option value="Last 7 Days">Last 7 Days</option>
          <option value="Last 30 Days">Last 30 Days</option>
          <option value="This Month">This Month</option>
          <option value="All Time">All Time</option>
        </select>
        
        <select 
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="w-full md:w-48 bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl px-4 py-2.5 text-[#111827] focus:outline-none focus:border-[#FC8019] transition-colors appearance-none cursor-pointer text-sm shrink-0"
        >
          <option value="Newest First">Newest First</option>
          <option value="Oldest First">Oldest First</option>
          <option value="Highest Rated">Highest Rated</option>
          <option value="Lowest Rated">Lowest Rated</option>
        </select>
      </div>

      <div className="self-end xl:self-auto shrink-0">
        <button 
          className="flex items-center gap-2 bg-[#F8FAFC] hover:bg-[#F8FAFC] border border-[#E5E7EB] text-[#111827] px-5 py-2.5 rounded-xl text-sm font-bold transition-colors group shadow-lg"
        >
          <Download className="w-4 h-4 text-[#6B7280] group-hover:text-[#FC8019] transition-colors" />
          Export Reviews
        </button>
      </div>

    </div>
  );
}
