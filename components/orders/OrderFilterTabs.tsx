"use client";

import { motion } from "framer-motion";

export type OrderFilter = "All Orders" | "Active" | "Delivered" | "Cancelled";

type Props = {
  filters: OrderFilter[];
  activeFilter: OrderFilter;
  onFilterChange: (filter: OrderFilter) => void;
};

export default function OrderFilterTabs({ filters, activeFilter, onFilterChange }: Props) {
  return (
    <div className="flex overflow-x-auto custom-scrollbar-hide mb-8 bg-[#F8FAFC] p-2 rounded-2xl border border-[#E5E7EB] w-max max-w-full">
      <div className="flex gap-2 relative">
        {filters.map((filter) => {
          const isActive = activeFilter === filter;
          return (
            <button
              key={filter}
              onClick={() => onFilterChange(filter)}
              className={`relative px-6 py-2.5 rounded-xl text-sm font-bold transition-colors whitespace-nowrap z-10 ${
                isActive ? "text-[#111827]" : "text-[#6B7280] hover:text-[#111827] hover:bg-[#F8FAFC]"
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="activeFilterBg"
                  className="absolute inset-0 bg-[#E23744] rounded-xl -z-10 shadow-[0_0_15px_rgba(226, 55, 68,0.4)]"
                  initial={false}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              {filter}
            </button>
          );
        })}
      </div>
    </div>
  );
}
