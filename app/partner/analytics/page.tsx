"use client";

import { useState } from "react";
import PartnerSidebar from "@/components/partner/PartnerSidebar";
import PartnerHeader from "@/components/partner/PartnerHeader";
import AnalyticsHeader from "@/components/partner/analytics/AnalyticsHeader";
import AnalyticsFilterBar from "@/components/partner/analytics/AnalyticsFilterBar";
import KPICards from "@/components/partner/analytics/KPICards";
import RevenueAnalytics from "@/components/partner/analytics/RevenueAnalytics";
import OrderAnalytics from "@/components/partner/analytics/OrderAnalytics";
import MenuPerformance from "@/components/partner/analytics/MenuPerformance";
import CustomerInsights from "@/components/partner/analytics/CustomerInsights";
import PaymentAnalytics from "@/components/partner/analytics/PaymentAnalytics";
import LocationInsights from "@/components/partner/analytics/LocationInsights";
import AIInsights from "@/components/partner/analytics/AIInsights";
import DownloadReports from "@/components/partner/analytics/DownloadReports";
import { FullAnalyticsData } from "@/components/partner/analytics/types";

// --- Massive Mock Dataset ---
const MOCK_ANALYTICS_DATA: FullAnalyticsData = {
  kpis: {
    totalOrders: 14250,
    totalOrdersGrowth: 12.5,
    totalRevenue: 2850000,
    revenueGrowth: 18.2,
    newCustomers: 3400,
    newCustomersGrowth: 8.4,
    averageRating: 4.8,
    averageRatingGrowth: 0.2,
    bestSellingDish: "Hyderabadi Dum Biryani",
    bestSellingDishSales: 4200,
    avgDeliveryTime: 28,
    avgDeliveryTimeGrowth: -2.5, // Faster by 2.5%
    averageOrderValue: 450,
    aovGrowth: 5.1
  },
  revenue: {
    daily: [
      { label: "Mon", value: 12000, height: "40%" },
      { label: "Tue", value: 15000, height: "50%" },
      { label: "Wed", value: 14000, height: "45%" },
      { label: "Thu", value: 22000, height: "70%" },
      { label: "Fri", value: 28000, height: "90%" },
      { label: "Sat", value: 32000, height: "100%" },
      { label: "Sun", value: 30000, height: "95%" },
    ],
    weekly: [
      { label: "Week 1", value: 85000, height: "70%" },
      { label: "Week 2", value: 92000, height: "80%" },
      { label: "Week 3", value: 110000, height: "95%" },
      { label: "Week 4", value: 115000, height: "100%" },
    ],
    monthly: [
      { label: "Jan", value: 380000, height: "75%" },
      { label: "Feb", value: 410000, height: "80%" },
      { label: "Mar", value: 450000, height: "85%" },
      { label: "Apr", value: 480000, height: "90%" },
      { label: "May", value: 520000, height: "95%" },
      { label: "Jun", value: 550000, height: "100%" },
    ],
    yearly: [
      { label: "2023", value: 4200000, height: "70%" },
      { label: "2024", value: 5800000, height: "85%" },
      { label: "2025", value: 6500000, height: "95%" },
      { label: "2026", value: 7200000, height: "100%" },
    ]
  },
  orders: {
    completionRate: 94.5,
    cancellationRate: 2.1,
    peakHour: "20:00 - 21:00",
    ordersByHour: [
      { hour: "12 PM", count: 85, height: "40%" },
      { hour: "1 PM", count: 120, height: "60%" },
      { hour: "2 PM", count: 95, height: "50%" },
      { hour: "5 PM", count: 60, height: "30%" },
      { hour: "7 PM", count: 180, height: "85%" },
      { hour: "8 PM", count: 240, height: "100%" }, // Peak
      { hour: "9 PM", count: 210, height: "90%" },
      { hour: "10 PM", count: 150, height: "70%" }
    ]
  },
  menu: {
    topSelling: [
      { id: "M1", name: "Hyderabadi Dum Biryani", image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?q=80&w=800&auto=format&fit=crop", metricLabel: "Orders", metricValue: "4.2K" }
    ],
    leastOrdered: [
      { id: "M2", name: "Tofu Salad", image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=800&auto=format&fit=crop", metricLabel: "Orders", metricValue: "120" }
    ],
    highestRevenue: { id: "M3", name: "Family Combo Pack", image: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?q=80&w=800&auto=format&fit=crop", metricLabel: "Revenue", metricValue: "₹4.5L" },
    fastestPrep: { id: "M4", name: "Cold Coffee", image: "https://images.unsplash.com/photo-1579992357154-faf4bde95b3d?q=80&w=800&auto=format&fit=crop", metricLabel: "Prep Time", metricValue: "3m" }
  },
  customers: {
    newPercentage: 35,
    returningPercentage: 65,
    satisfaction: 92,
    repeatPercentage: 48
  },
  payments: [
    { method: "UPI", percentage: 55, color: "#a855f7" },
    { method: "Credit Card", percentage: 25, color: "#3b82f6" },
    { method: "Cash on Delivery", percentage: 12, color: "#eab308" },
    { method: "Wallet", percentage: 8, color: "#ec4899" }
  ],
  locations: [
    { area: "Koramangala", orders: 4200, percentage: 35 },
    { area: "Indiranagar", orders: 3600, percentage: 30 },
    { area: "HSR Layout", orders: 2400, percentage: 20 },
    { area: "BTM Layout", orders: 1800, percentage: 15 }
  ],
  aiInsights: [
    "📈 Revenue increased by 18.2% this week compared to last week.",
    "🍗 Hyderabadi Dum Biryani remains your most profitable dish.",
    "⭐ Customer ratings improved from 4.6 to 4.8 this month.",
    "⏰ Peak ordering time shifted to 8 PM - 9 PM on weekends."
  ]
};

export default function PartnerAnalyticsPage() {
  
  // Filter States
  const [dateRange, setDateRange] = useState("This Month");
  const [comparePeriod, setComparePeriod] = useState(false);

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
        <main className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar relative">
          <div className="max-w-7xl mx-auto">
            
            <AnalyticsHeader />
            
            <AnalyticsFilterBar 
              dateRange={dateRange} setDateRange={setDateRange}
              comparePeriod={comparePeriod} setComparePeriod={setComparePeriod}
            />

            <KPICards data={MOCK_ANALYTICS_DATA.kpis} />

            <AIInsights insights={MOCK_ANALYTICS_DATA.aiInsights} />

            <RevenueAnalytics data={MOCK_ANALYTICS_DATA.revenue} />

            <OrderAnalytics data={MOCK_ANALYTICS_DATA.orders} />

            <MenuPerformance data={MOCK_ANALYTICS_DATA.menu} />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <CustomerInsights data={MOCK_ANALYTICS_DATA.customers} />
              <PaymentAnalytics data={MOCK_ANALYTICS_DATA.payments} />
            </div>

            <LocationInsights data={MOCK_ANALYTICS_DATA.locations} />

            <DownloadReports />

          </div>
        </main>
      </div>

    </div>
  );
}
