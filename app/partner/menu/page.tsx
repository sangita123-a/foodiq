"use client";

import PartnerSidebar from "@/components/partner/PartnerSidebar";
import PartnerHeader from "@/components/partner/PartnerHeader";
import MenuHeader from "@/components/partner/menu/MenuHeader";
import MenuSummary from "@/components/partner/menu/MenuSummary";
import MenuBestSellers from "@/components/partner/menu/MenuBestSellers";
import MenuTable from "@/components/partner/menu/MenuTable";

export default function PartnerMenuPage() {
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
            
            <MenuHeader />
            
            <MenuSummary />

            <MenuBestSellers />

            <MenuTable />

          </div>
        </main>
      </div>

    </div>
  );
}
