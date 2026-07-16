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
    <div className="flex overflow-x-auto custom-scrollbar-hide mb-8 bg-[#171717] p-2 rounded-2xl border border-white/5 w-max max-w-full">
      <div className="flex gap-2 relative">
        {filters.map((filter) => {
          const isActive = activeFilter === filter;
          return (
            <button
              key={filter}
              onClick={() => onFilterChange(filter)}
              className={`relative px-6 py-2.5 rounded-xl text-sm font-bold transition-colors whitespace-nowrap z-10 ${
                isActive ? "text-white" : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="activeFilterBg"
                  className="absolute inset-0 bg-[#FF2D3B] rounded-xl -z-10 shadow-[0_0_15px_rgba(255,45,59,0.4)]"
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
