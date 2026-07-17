"use client";

import PartnerSidebar from "@/components/partner/PartnerSidebar";
import PartnerHeader from "@/components/partner/PartnerHeader";
import PartnerWelcome from "@/components/partner/dashboard/PartnerWelcome";
import PartnerStats from "@/components/partner/dashboard/PartnerStats";
import QuickActions from "@/components/partner/dashboard/QuickActions";
import LiveOrders from "@/components/partner/dashboard/LiveOrders";
import PopularItems from "@/components/partner/dashboard/PopularItems";
import RevenueChart from "@/components/partner/dashboard/RevenueChart";
import RecentReviews from "@/components/partner/dashboard/RecentReviews";

export default function PartnerDashboardPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex selection:bg-[#FC8019] selection:text-white">
      
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
            
            <PartnerWelcome />
            
            <PartnerStats />

            <QuickActions />

            {/* Grid Layout for Complex Data */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
              
              {/* Left Column (Takes up 2/3 space on huge screens) */}
              <div className="xl:col-span-2 space-y-6">
                <LiveOrders />
                <RevenueChart />
              </div>

              {/* Right Column (Takes up 1/3 space) */}
              <div className="space-y-6">
                <PopularItems />
                <RecentReviews />
              </div>

            </div>
            
          </div>
        </main>
      </div>

    </div>
  );
}
