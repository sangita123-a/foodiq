"use client";

import { motion } from "framer-motion";

export type FavoriteTab = "All Favorites" | "Restaurants" | "Dishes";

type Props = {
  activeTab: FavoriteTab;
  setActiveTab: (tab: FavoriteTab) => void;
};

const tabs: FavoriteTab[] = ["All Favorites", "Restaurants", "Dishes"];

export default function FavoritesFilterTabs({ activeTab, setActiveTab }: Props) {
  return (
    <div className="flex overflow-x-auto custom-scrollbar-hide mb-8 border-b border-[#E5E7EB]">
      <div className="flex gap-8 relative">
        {tabs.map((tab) => {
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`relative pb-4 text-lg font-bold transition-colors whitespace-nowrap ${
                isActive ? "text-[#111827]" : "text-[#9CA3AF] hover:text-[#111827]"
              }`}
            >
              {tab}
              {isActive && (
                <motion.div
                  layoutId="favActiveTabUnderline"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#E23744] shadow-[0_0_10px_rgba(226, 55, 68,0.8)]"
                  initial={false}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
