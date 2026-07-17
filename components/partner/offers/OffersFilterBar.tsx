"use client";

import { Search, Download, Plus, Tag } from "lucide-react";

interface OffersFilterBarProps {
  search: string;
  setSearch: (val: string) => void;
  typeFilter: string;
  setTypeFilter: (val: string) => void;
  statusFilter: string;
  setStatusFilter: (val: string) => void;
  dateRange: string;
  setDateRange: (val: string) => void;
  onCreateNew: () => void;
}

export default function OffersFilterBar({
  search, setSearch,
  typeFilter, setTypeFilter,
  statusFilter, setStatusFilter,
  dateRange, setDateRange,
  onCreateNew
}: OffersFilterBarProps) {
  
  return (
    <div className="bg-[#FFFFFF] p-4 rounded-2xl border border-[#E5E7EB] flex flex-col xl:flex-row xl:items-center justify-between gap-4 mb-6 shadow-xl sticky top-24 z-30">
      
      <div className="flex flex-col md:flex-row items-center gap-4 flex-1 flex-wrap">
        <div className="relative w-full md:max-w-xs shrink-0">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9CA3AF]" />
          <input 
            type="text" 
            placeholder="Search Coupon Code..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl pl-12 pr-4 py-2.5 text-[#111827] focus:outline-none focus:border-[#FC8019] transition-colors text-sm uppercase placeholder:normal-case"
          />
        </div>
        
        <div className="relative w-full md:w-48 shrink-0">
          <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#FC8019]" />
          <select 
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-full bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl pl-10 pr-4 py-2.5 text-[#111827] focus:outline-none focus:border-[#FC8019] transition-colors appearance-none cursor-pointer text-sm"
          >
            <option value="All">All Types</option>
            <option value="Flat Discount">Flat Discount</option>
            <option value="Percentage Discount">Percentage Discount</option>
            <option value="Free Delivery">Free Delivery</option>
            <option value="Buy One Get One (BOGO)">BOGO</option>
          </select>
        </div>

        <select 
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-full md:w-36 bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl px-4 py-2.5 text-[#111827] focus:outline-none focus:border-[#FC8019] transition-colors appearance-none cursor-pointer text-sm shrink-0"
        >
          <option value="All">All Statuses</option>
          <option value="Active">Active</option>
          <option value="Scheduled">Scheduled</option>
          <option value="Paused">Paused</option>
          <option value="Expired">Expired</option>
        </select>
        
        <select 
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value)}
          className="w-full md:w-36 bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl px-4 py-2.5 text-[#111827] focus:outline-none focus:border-[#FC8019] transition-colors appearance-none cursor-pointer text-sm shrink-0"
        >
          <option value="All Time">All Time</option>
          <option value="Active Now">Active Now</option>
          <option value="This Month">This Month</option>
        </select>
      </div>

      <div className="flex items-center gap-3 self-end xl:self-auto shrink-0">
        <button 
          className="flex items-center gap-2 bg-[#F8FAFC] hover:bg-[#F8FAFC] border border-[#E5E7EB] text-[#111827] px-4 py-2.5 rounded-xl text-sm font-bold transition-colors group"
        >
          <Download className="w-4 h-4 text-[#6B7280] group-hover:text-[#FC8019] transition-colors" />
          <span className="hidden sm:inline">Export</span>
        </button>
        
        <button 
          onClick={onCreateNew}
          className="flex items-center gap-2 bg-[#FC8019] hover:bg-[#E66F0D] text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-colors shadow-lg shadow-[#FC8019]/20"
        >
          <Plus className="w-4 h-4" />
          Create New Offer
        </button>
      </div>

    </div>
  );
}
