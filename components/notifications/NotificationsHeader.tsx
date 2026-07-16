"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, CheckCircle2, Trash2, Filter, ChevronDown } from "lucide-react";

export type NotificationFilter = "All" | "Orders" | "Offers" | "Payments" | "Account";

type Props = {
  activeFilter: NotificationFilter;
  setActiveFilter: (filter: NotificationFilter) => void;
  onMarkAllAsRead: () => void;
  onClearAll: () => void;
  hasUnread: boolean;
};

const filterOptions: NotificationFilter[] = ["All", "Orders", "Offers", "Payments", "Account"];

export default function NotificationsHeader({ activeFilter, setActiveFilter, onMarkAllAsRead, onClearAll, hasUnread }: Props) {
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  return (
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 border-b border-white/5 pb-8">
      
      {/* Title */}
      <div>
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-white mb-3 flex items-center gap-4 relative">
          <div className="relative">
            <Bell className="w-10 h-10 md:w-12 md:h-12 text-[#FF2D3B] fill-[#FF2D3B]/20" />
            {hasUnread && (
              <span className="absolute top-0 right-0 w-3.5 h-3.5 bg-[#FF2D3B] border-2 border-[#0B0B0B] rounded-full"></span>
            )}
          </div>
          Notifications
        </h1>
        <p className="text-[#A1A1A1] text-lg">
          Stay updated with your orders, offers, and account activity.
        </p>
      </div>

      {/* Top Action Bar */}
      <div className="flex flex-wrap items-center gap-3">
        
        <button 
          onClick={onMarkAllAsRead}
          className="bg-white/5 hover:bg-white/10 text-white px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors border border-white/5"
        >
          <CheckCircle2 className="w-4 h-4 text-green-400" />
          Mark all as read
        </button>

        <button 
          onClick={onClearAll}
          className="bg-red-500/10 hover:bg-red-500/20 text-red-400 px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors border border-red-500/10"
        >
          <Trash2 className="w-4 h-4" />
          Clear all
        </button>

        {/* Custom Filter Dropdown */}
        <div className="relative">
          <button 
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className="bg-[#111] hover:bg-[#1a1a1a] text-white px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors border border-white/10 w-[140px] justify-between"
          >
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-primary" />
              {activeFilter}
            </div>
            <motion.div animate={{ rotate: isFilterOpen ? 180 : 0 }}>
              <ChevronDown className="w-4 h-4 text-gray-500" />
            </motion.div>
          </button>

          <AnimatePresence>
            {isFilterOpen && (
              <motion.div 
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-full mt-2 w-48 bg-[#171717] border border-white/10 rounded-2xl shadow-[0_20px_40px_rgba(0,0,0,0.5)] overflow-hidden z-50 py-2"
              >
                {filterOptions.map(option => (
                  <button
                    key={option}
                    onClick={() => {
                      setActiveFilter(option);
                      setIsFilterOpen(false);
                    }}
                    className={`w-full text-left px-5 py-3 text-sm font-bold transition-colors ${
                      activeFilter === option 
                        ? "bg-primary/10 text-primary border-l-2 border-primary pl-[18px]" 
                        : "text-gray-300 hover:bg-white/5 hover:text-white border-l-2 border-transparent"
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>

    </div>
  );
}
