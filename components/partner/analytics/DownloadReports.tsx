"use client";

import { Download, FileText, FileSpreadsheet, Printer } from "lucide-react";
import { motion } from "framer-motion";

export default function DownloadReports() {
  return (
    <div className="bg-[#FFFFFF] rounded-3xl p-6 md:p-8 border border-[#E5E7EB] shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
      
      <div>
        <h3 className="text-xl font-black text-[#111827] flex items-center gap-2 mb-2">
          <Download className="w-6 h-6 text-[#6B7280]" /> Download Reports
        </h3>
        <p className="text-[#6B7280] text-sm">Export your analytics data for accounting or offline review.</p>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <motion.button 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="flex items-center gap-2 bg-[#F8FAFC] hover:bg-[#F8FAFC] border border-[#E5E7EB] text-[#111827] px-6 py-3 rounded-xl font-bold transition-colors shadow-lg"
        >
          <FileText className="w-5 h-5 text-red-400" />
          PDF Report
        </motion.button>

        <motion.button 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="flex items-center gap-2 bg-[#F8FAFC] hover:bg-[#F8FAFC] border border-[#E5E7EB] text-[#111827] px-6 py-3 rounded-xl font-bold transition-colors shadow-lg"
        >
          <FileSpreadsheet className="w-5 h-5 text-green-400" />
          CSV Export
        </motion.button>

        <motion.button 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="flex items-center gap-2 bg-[#F8FAFC] hover:bg-[#F8FAFC] border border-[#E5E7EB] text-[#111827] px-6 py-3 rounded-xl font-bold transition-colors shadow-lg"
        >
          <Printer className="w-5 h-5 text-[#6B7280]" />
          Print
        </motion.button>
      </div>

    </div>
  );
}
