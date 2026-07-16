"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import PartnerSidebar from "@/components/partner/PartnerSidebar";
import PartnerHeader from "@/components/partner/PartnerHeader";
import AddDishForm from "@/components/partner/menu/AddDishForm";
import DishPreviewCard from "@/components/partner/menu/DishPreviewCard";
import { DishState, initialDishState } from "@/components/partner/menu/types";

export default function AddDishPage() {
  const [dish, setDish] = useState<DishState>(initialDishState);

  return (
    <div className="min-h-screen bg-[#0B0B0B] flex selection:bg-[var(--color-primary)] selection:text-white">
      
      {/* Sidebar - Fixed on left for desktop */}
      <div className="hidden lg:block w-64 flex-shrink-0">
        <PartnerSidebar />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Sticky Header */}
        <PartnerHeader />

        {/* Scrollable Dashboard Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
          <div className="max-w-7xl mx-auto">
            
            {/* Page Header */}
            <div className="mb-8">
              <div className="flex items-center gap-2 text-sm text-gray-500 font-bold uppercase tracking-wider mb-4">
                <Link href="/partner/dashboard" className="hover:text-primary transition-colors">Dashboard</Link>
                <ChevronRight className="w-4 h-4" />
                <Link href="/partner/menu" className="hover:text-primary transition-colors">Menu Management</Link>
                <ChevronRight className="w-4 h-4" />
                <span className="text-white">Add New Dish</span>
              </div>
              
              <h1 className="text-3xl md:text-4xl font-black text-white mb-2 flex items-center gap-3">
                🍽️ Add New Dish
              </h1>
              <p className="text-gray-400">
                Create and manage delicious menu items for your restaurant.
              </p>
            </div>

            {/* Split Layout */}
            <div className="flex flex-col xl:flex-row gap-8">
              
              {/* Left Side: Form (65%) */}
              <div className="w-full xl:w-[65%]">
                <AddDishForm dish={dish} setDish={setDish} />
              </div>

              {/* Right Side: Live Preview (35%) */}
              <div className="w-full xl:w-[35%] xl:relative">
                {/* The DishPreviewCard component handles its own sticky positioning internally */}
                <DishPreviewCard dish={dish} />
              </div>

            </div>

          </div>
        </main>
      </div>

    </div>
  );
}
