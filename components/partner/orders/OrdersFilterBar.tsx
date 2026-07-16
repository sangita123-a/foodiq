"use client";

import { Search, RefreshCw, LayoutList, LayoutGrid } from "lucide-react";

interface OrdersFilterBarProps {
  viewMode: "list" | "kanban";
  setViewMode: (mode: "list" | "kanban") => void;
  search: string;
  setSearch: (val: string) => void;
  statusFilter: string;
  setStatusFilter: (val: string) => void;
}

export default function OrdersFilterBar({ viewMode, setViewMode, search, setSearch, statusFilter, setStatusFilter }: OrdersFilterBarProps) {
  return (
    <div className="bg-[#171717] p-4 rounded-2xl border border-white/5 flex flex-col xl:flex-row xl:items-center justify-between gap-4 mb-6 shadow-xl sticky top-24 z-30">
      
      <div className="flex flex-col md:flex-row items-center gap-4 flex-1">
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input 
            type="text" 
            placeholder="Search Order ID or Customer..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#111] border border-white/10 rounded-xl pl-12 pr-4 py-2.5 text-white focus:outline-none focus:border-primary transition-colors text-sm"
          />
        </div>
        
        <select 
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-full md:w-auto bg-[#111] border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-primary transition-colors appearance-none cursor-pointer text-sm"
        >
          <option value="All">All Statuses</option>
          <option value="New">New Orders</option>
          <option value="Accepted">Accepted</option>
          <option value="Preparing">Preparing</option>
          <option value="Ready for Pickup">Ready for Pickup</option>
        </select>

        <select 
          className="w-full md:w-auto bg-[#111] border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-primary transition-colors appearance-none cursor-pointer text-sm"
        >
          <option value="All">All Payments</option>
          <option value="Paid">Paid Online</option>
          <option value="COD">Cash on Delivery</option>
        </select>
        
        <select 
          className="w-full md:w-auto bg-[#111] border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-primary transition-colors appearance-none cursor-pointer text-sm"
        >
          <option value="Today">Today</option>
          <option value="Yesterday">Yesterday</option>
        </select>
      </div>

      <div className="flex items-center gap-4 self-end xl:self-auto flex-shrink-0">
        
        <button className="flex items-center gap-2 bg-[#111] hover:bg-white/5 border border-white/10 text-white px-4 py-2.5 rounded-xl text-sm font-bold transition-colors group">
          <RefreshCw className="w-4 h-4 text-gray-400 group-hover:text-primary transition-colors group-hover:animate-spin" />
          Refresh
        </button>

        <div className="flex items-center bg-[#111] p-1 rounded-xl border border-white/10">
          <button 
            onClick={() => setViewMode("list")}
            className={`p-2 rounded-lg transition-colors ${viewMode === "list" ? "bg-white/10 text-white" : "text-gray-500 hover:text-white"}`}
          >
            <LayoutList className="w-4 h-4" />
          </button>
          <button 
            onClick={() => setViewMode("kanban")}
            className={`p-2 rounded-lg transition-colors ${viewMode === "kanban" ? "bg-white/10 text-white" : "text-gray-500 hover:text-white"}`}
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
        </div>

      </div>

    </div>
  );
}
