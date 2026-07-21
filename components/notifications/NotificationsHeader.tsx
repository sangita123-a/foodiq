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
    <div className="mb-12 flex flex-col justify-between gap-6 border-b border-border pb-8 md:flex-row md:items-end">
      
      {/* Title */}
      <div>
        <h1 className="relative mb-3 flex items-center gap-4 text-3xl font-black tracking-[-0.04em] text-foreground md:text-4xl lg:text-5xl">
          <div className="relative">
            <Bell className="w-10 h-10 md:w-12 md:h-12 text-primary fill-primary/20" />
            {hasUnread && (
              <span className="absolute top-0 right-0 w-3.5 h-3.5 bg-primary border-2 border-[#FFFFFF] rounded-full"></span>
            )}
          </div>
          Notifications
        </h1>
        <p className="text-lg text-muted">
          Stay updated with your orders, offers, and account activity.
        </p>
      </div>

      {/* Top Action Bar */}
      <div className="flex flex-wrap items-center gap-3">
        
        <button 
          onClick={onMarkAllAsRead}
          className="flex items-center gap-2 rounded-xl border border-border bg-[#F8F9FA] px-4 py-2.5 text-sm font-bold text-foreground transition-all hover:border-primary/30 hover:bg-white"
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
            className="flex w-[140px] items-center justify-between gap-2 rounded-xl border border-border bg-white px-4 py-2.5 text-sm font-bold text-foreground transition-colors hover:bg-section"
          >
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-primary" />
              {activeFilter}
            </div>
            <motion.div animate={{ rotate: isFilterOpen ? 180 : 0 }}>
              <ChevronDown className="h-4 w-4 text-muted" />
            </motion.div>
          </button>

          <AnimatePresence>
            {isFilterOpen && (
              <motion.div 
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-full z-50 mt-2 w-48 overflow-hidden rounded-2xl border border-border bg-white py-2 shadow-[0_16px_36px_rgba(28,28,28,0.12)]"
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
                        : "border-l-2 border-transparent text-muted hover:bg-section hover:text-foreground"
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
