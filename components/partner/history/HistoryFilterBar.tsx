"use client";

import { Search, Download, FileText, ChevronDown } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface HistoryFilterBarProps {
  search: string;
  setSearch: (val: string) => void;
  statusFilter: string;
  setStatusFilter: (val: string) => void;
  dateRange: string;
  setDateRange: (val: string) => void;
  paymentFilter: string;
  setPaymentFilter: (val: string) => void;
  sortBy: string;
  setSortBy: (val: string) => void;
}

export default function HistoryFilterBar({
  search, setSearch,
  statusFilter, setStatusFilter,
  dateRange, setDateRange,
  paymentFilter, setPaymentFilter,
  sortBy, setSortBy
}: HistoryFilterBarProps) {
  
  const [showExportMenu, setShowExportMenu] = useState(false);

  return (
    <div className="bg-[#FFFFFF] p-4 rounded-2xl border border-[#E5E7EB] flex flex-col xl:flex-row xl:items-center justify-between gap-4 mb-6 shadow-xl sticky top-24 z-30">
      
      <div className="flex flex-col md:flex-row items-center gap-4 flex-1 flex-wrap">
        <div className="relative w-full md:max-w-xs xl:max-w-md shrink-0">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9CA3AF]" />
          <input 
            type="text" 
            placeholder="Search Order ID or Customer..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl pl-12 pr-4 py-2.5 text-[#111827] focus:outline-none focus:border-[#E23744] transition-colors text-sm"
          />
        </div>
        
        <select 
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value)}
          className="w-full md:w-36 bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl px-4 py-2.5 text-[#111827] focus:outline-none focus:border-[#E23744] transition-colors appearance-none cursor-pointer text-sm shrink-0"
        >
          <option value="Today">Today</option>
          <option value="Last 7 Days">Last 7 Days</option>
          <option value="Last 30 Days">Last 30 Days</option>
          <option value="This Month">This Month</option>
          <option value="All Time">All Time</option>
        </select>

        <select 
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-full md:w-36 bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl px-4 py-2.5 text-[#111827] focus:outline-none focus:border-[#E23744] transition-colors appearance-none cursor-pointer text-sm shrink-0"
        >
          <option value="All">All Statuses</option>
          <option value="Completed">Completed</option>
          <option value="Delivered">Delivered</option>
          <option value="Cancelled">Cancelled</option>
          <option value="Refunded">Refunded</option>
        </select>

        <select 
          value={paymentFilter}
          onChange={(e) => setPaymentFilter(e.target.value)}
          className="w-full md:w-36 bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl px-4 py-2.5 text-[#111827] focus:outline-none focus:border-[#E23744] transition-colors appearance-none cursor-pointer text-sm shrink-0"
        >
          <option value="All">All Payments</option>
          <option value="Card">Card</option>
          <option value="UPI">UPI</option>
          <option value="Cash on Delivery">Cash on Delivery</option>
          <option value="Wallet">Wallet</option>
        </select>
        
        <select 
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="w-full md:w-40 bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl px-4 py-2.5 text-[#111827] focus:outline-none focus:border-[#E23744] transition-colors appearance-none cursor-pointer text-sm shrink-0"
        >
          <option value="Date (Newest)">Date (Newest)</option>
          <option value="Date (Oldest)">Date (Oldest)</option>
          <option value="Amount (High to Low)">Amount (High to Low)</option>
          <option value="Amount (Low to High)">Amount (Low to High)</option>
        </select>
      </div>

      <div className="relative self-end xl:self-auto shrink-0">
        <button 
          onClick={() => setShowExportMenu(!showExportMenu)}
          className="flex items-center gap-2 bg-[#E23744] hover:bg-[#C81E34] text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-colors shadow-lg shadow-[#E23744]/20"
        >
          <Download className="w-4 h-4" />
          Export
          <ChevronDown className="w-4 h-4" />
        </button>

        <AnimatePresence>
          {showExportMenu && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute right-0 mt-2 w-48 bg-[#FFFFFF] border border-[#E5E7EB] rounded-xl shadow-2xl overflow-hidden z-50"
            >
              <button className="w-full text-left px-4 py-3 text-sm text-[#111827] hover:bg-[#F8FAFC] flex items-center gap-2 transition-colors border-b border-[#E5E7EB]">
                <FileText className="w-4 h-4 text-green-400" /> Export as CSV
              </button>
              <button className="w-full text-left px-4 py-3 text-sm text-[#111827] hover:bg-[#F8FAFC] flex items-center gap-2 transition-colors">
                <FileText className="w-4 h-4 text-red-400" /> Export as PDF
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

    </div>
  );
}
