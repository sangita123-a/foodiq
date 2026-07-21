"use client";

import { useState, useMemo } from "react";
import PartnerSidebar from "@/components/partner/PartnerSidebar";
import PartnerHeader from "@/components/partner/PartnerHeader";
import OffersHeader from "@/components/partner/offers/OffersHeader";
import OffersSummary from "@/components/partner/offers/OffersSummary";
import OffersFilterBar from "@/components/partner/offers/OffersFilterBar";
import FeaturedOfferBanner from "@/components/partner/offers/FeaturedOfferBanner";
import OffersList from "@/components/partner/offers/OffersList";
import OffersEmptyState from "@/components/partner/offers/OffersEmptyState";
import OffersAnalytics from "@/components/partner/offers/OffersAnalytics";
import CreateOfferModal from "@/components/partner/offers/CreateOfferModal";
import { Offer, OffersAnalyticsData } from "@/components/partner/offers/types";

// --- Mock Dataset ---
const INITIAL_OFFERS: Offer[] = [
  {
    id: "OFF-1001",
    name: "Summer Weekend Blast",
    code: "SUMMER20",
    type: "Percentage Discount",
    value: 20,
    minOrderValue: 500,
    startDate: "2026-07-01",
    endDate: "2026-07-31",
    usageLimit: 500,
    usageCount: 420,
    applicableCategories: ["All"],
    applicableDishes: [],
    description: "Get 20% off on all orders above ₹500 during the summer weekends.",
    status: "Active",
    bannerImage: "/images/catalog/cuisines/pizza.webp"
  },
  {
    id: "OFF-1002",
    name: "New User Flat Discount",
    code: "FLAT50",
    type: "Flat Discount",
    value: 50,
    minOrderValue: 200,
    startDate: "2026-07-15",
    endDate: "2026-08-15",
    usageLimit: 1000,
    usageCount: 150,
    applicableCategories: ["All"],
    applicableDishes: [],
    description: "Flat ₹50 off on your first order. Valid for new users only.",
    status: "Active"
  },
  {
    id: "OFF-1003",
    name: "Midnight Cravings",
    code: "FREEDEL",
    type: "Free Delivery",
    value: 0,
    minOrderValue: 300,
    startDate: "2026-07-20",
    endDate: "2026-07-30",
    usageLimit: 200,
    usageCount: 0,
    applicableCategories: ["Snacks", "Desserts"],
    applicableDishes: [],
    description: "Free delivery on orders above ₹300 placed between 11 PM and 3 AM.",
    status: "Scheduled"
  },
  {
    id: "OFF-1004",
    name: "Biryani Festival BOGO",
    code: "BIRYANI1",
    type: "Buy One Get One (BOGO)",
    value: 0,
    minOrderValue: 0,
    startDate: "2026-06-01",
    endDate: "2026-06-30",
    usageLimit: 300,
    usageCount: 300,
    applicableCategories: ["Biryani"],
    applicableDishes: ["Hyderabadi Chicken Dum Biryani"],
    description: "Buy one Hyderabadi Chicken Dum Biryani and get another one absolutely free!",
    status: "Expired"
  }
];

const ANALYTICS_DATA: OffersAnalyticsData = {
  activeOffers: 2,
  scheduledOffers: 1,
  expiredOffers: 15,
  totalRedemptions: 2450,
  revenueFromPromotions: 125000
};

export default function PartnerOffersPage() {
  const [offers, setOffers] = useState<Offer[]>(INITIAL_OFFERS);
  
  // Filter States
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [dateRange, setDateRange] = useState("All Time");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Handlers
  const handleUpdateStatus = (id: string, newStatus: Offer["status"]) => {
    setOffers(prev => prev.map(offer => offer.id === id ? { ...offer, status: newStatus } : offer));
  };

  const handleDelete = (id: string) => {
    setOffers(prev => prev.filter(offer => offer.id !== id));
  };

  const handleSaveOffer = (newOffer: Offer) => {
    setOffers(prev => [newOffer, ...prev]);
    setIsModalOpen(false);
  };

  // Derived Data
  const filteredOffers = useMemo(() => {
    return offers.filter(offer => {
      const matchesSearch = offer.code.toLowerCase().includes(search.toLowerCase());
      const matchesType = typeFilter === "All" || offer.type === typeFilter;
      const matchesStatus = statusFilter === "All" || offer.status === statusFilter;
      // Date range filtering is simulated
      return matchesSearch && matchesType && matchesStatus;
    });
  }, [offers, search, typeFilter, statusFilter]);

  const featuredOffer = offers.find(o => o.status === "Active" && o.bannerImage);

  return (
    <div className="min-h-screen bg-section flex selection:bg-primary selection:text-white">
      
      {/* Sidebar - Fixed on left for desktop */}
      <div className="hidden lg:block w-64 flex-shrink-0">
        <PartnerSidebar />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Sticky Header */}
        <PartnerHeader />

        {/* Scrollable Dashboard Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar relative">
          <div className="max-w-7xl mx-auto">
            
            <OffersHeader />
            
            <OffersSummary data={ANALYTICS_DATA} />

            <OffersFilterBar 
              search={search} setSearch={setSearch}
              typeFilter={typeFilter} setTypeFilter={setTypeFilter}
              statusFilter={statusFilter} setStatusFilter={setStatusFilter}
              dateRange={dateRange} setDateRange={setDateRange}
              onCreateNew={() => setIsModalOpen(true)}
            />

            {/* Only show featured banner if no filters are active, just to keep UI clean */}
            {search === "" && typeFilter === "All" && statusFilter === "All" && (
              <FeaturedOfferBanner offer={featuredOffer} />
            )}

            {filteredOffers.length > 0 ? (
              <OffersList 
                offers={filteredOffers} 
                onUpdateStatus={handleUpdateStatus}
                onDelete={handleDelete}
              />
            ) : (
              <OffersEmptyState onCreateNew={() => setIsModalOpen(true)} />
            )}

            <OffersAnalytics data={ANALYTICS_DATA} />

          </div>
        </main>
      </div>

      {/* Create Offer Modal */}
      <CreateOfferModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveOffer}
      />

    </div>
  );
}
