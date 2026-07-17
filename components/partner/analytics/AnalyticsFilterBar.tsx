"use client";

import { useState } from "react";
import { Download, Calendar, ArrowRightLeft, FileText, FileSpreadsheet } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface AnalyticsFilterBarProps {
  dateRange: string;
  setDateRange: (val: string) => void;
  comparePeriod: boolean;
  setComparePeriod: (val: boolean) => void;
}

export default function AnalyticsFilterBar({
  dateRange, setDateRange,
  comparePeriod, setComparePeriod
}: AnalyticsFilterBarProps) {
  
  const [showExportMenu, setShowExportMenu] = useState(false);

  return (
    <div className="bg-[#FFFFFF] p-4 rounded-2xl border border-[#E5E7EB] flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 shadow-xl sticky top-24 z-30">
      
      <div className="flex items-center gap-4 flex-wrap">
        
        {/* Date Range Picker (Simulated via Select for layout purposes) */}
        <div className="relative shrink-0">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#FC8019]" />
          <select 
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="w-48 bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl pl-10 pr-4 py-2.5 text-[#111827] focus:outline-none focus:border-[#FC8019] transition-colors appearance-none cursor-pointer text-sm font-bold"
          >
            <option value="Today">Today</option>
            <option value="Last 7 Days">Last 7 Days</option>
            <option value="Last 30 Days">Last 30 Days</option>
            <option value="This Month">This Month</option>
            <option value="This Year">This Year</option>
          </select>
        </div>

        {/* Compare Period Toggle */}
        <button 
          onClick={() => setComparePeriod(!comparePeriod)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-colors border ${comparePeriod ? 'bg-[#FC8019]/10 border-[#FC8019]/30 text-[#FC8019]' : 'bg-[#F8FAFC] border-[#E5E7EB] text-[#6B7280] hover:text-[#111827] hover:border-[#E5E7EB]'}`}
        >
          <ArrowRightLeft className="w-4 h-4" />
          Compare Period
        </button>
      </div>

      {/* Export Action */}
      <div className="relative self-end md:self-auto shrink-0">
        <button 
          onClick={() => setShowExportMenu(!showExportMenu)}
          className="flex items-center gap-2 bg-[#F8FAFC] hover:bg-[#F8FAFC] border border-[#E5E7EB] text-[#111827] px-5 py-2.5 rounded-xl text-sm font-bold transition-colors group shadow-lg"
        >
          <Download className="w-4 h-4 text-[#6B7280] group-hover:text-[#FC8019] transition-colors" />
          Export Report
        </button>

        <AnimatePresence>
          {showExportMenu && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute right-0 mt-2 w-48 bg-[#FFFFFF] border border-[#E5E7EB] rounded-xl shadow-2xl overflow-hidden z-50"
            >
              <button onClick={() => setShowExportMenu(false)} className="w-full text-left px-4 py-3 text-sm text-[#111827] hover:bg-[#F8FAFC] flex items-center gap-2 transition-colors border-b border-[#E5E7EB]">
                <FileText className="w-4 h-4 text-red-400" /> Download PDF
              </button>
              <button onClick={() => setShowExportMenu(false)} className="w-full text-left px-4 py-3 text-sm text-[#111827] hover:bg-[#F8FAFC] flex items-center gap-2 transition-colors">
                <FileSpreadsheet className="w-4 h-4 text-green-400" /> Download CSV
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

    </div>
  );
}
