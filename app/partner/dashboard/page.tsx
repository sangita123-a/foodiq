"use client";

import { useMemo } from "react";
import PartnerSidebar from "@/components/partner/PartnerSidebar";
import PartnerHeader from "@/components/partner/PartnerHeader";
import PartnerWelcome from "@/components/partner/dashboard/PartnerWelcome";
import PartnerStats from "@/components/partner/dashboard/PartnerStats";
import QuickActions from "@/components/partner/dashboard/QuickActions";
import LiveOrders from "@/components/partner/dashboard/LiveOrders";
import PopularItems from "@/components/partner/dashboard/PopularItems";
import RevenueChart from "@/components/partner/dashboard/RevenueChart";
import RecentReviews from "@/components/partner/dashboard/RecentReviews";
import { usePartnerDashboard, usePartnerAnalytics } from "@/hooks/usePartnerData";
import { updatePartnerOrderStatus, formatCurrency } from "@/services/partnerApi";
import { mutate } from "swr";

export default function PartnerDashboardPage() {
  const { data, isLoading, error } = usePartnerDashboard();
  const { data: analytics } = usePartnerAnalytics();

  const restaurant = data?.restaurant as { name?: string; logo_url?: string; id?: string; is_active?: boolean } | undefined;
  const stats = data?.stats;

  const chartData = useMemo(() => {
    const daily = analytics?.daily || [];
    if (!daily.length) return undefined;
    const max = Math.max(...daily.map((d: { revenue: number }) => d.revenue), 1);
    return daily.slice(-7).map((d: { day: string; revenue: number }) => {
      const day = new Date(d.day).toLocaleDateString("en-US", { weekday: "short" });
      const pct = Math.max(8, Math.round((d.revenue / max) * 100));
      return {
        day,
        height: `${pct}%`,
        amount: formatCurrency(d.revenue),
      };
    });
  }, [analytics]);

  const avgOrder =
    stats && stats.totalOrders > 0
      ? Math.round(stats.totalRevenue / stats.totalOrders)
      : 0;

  const handleAccept = async (id: string) => {
    await updatePartnerOrderStatus(id, "Accepted");
    mutate("/api/partner/dashboard");
    mutate("/api/partner/orders");
  };

  const handleReject = async (id: string) => {
    await updatePartnerOrderStatus(id, "Rejected");
    mutate("/api/partner/dashboard");
    mutate("/api/partner/orders");
  };

  return (
    <div className="min-h-screen bg-section flex selection:bg-primary selection:text-white">
      
      <div className="hidden lg:block w-64 flex-shrink-0">
        <PartnerSidebar />
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        
        <PartnerHeader
          restaurantName={restaurant?.name}
          restaurantId={restaurant?.id}
          logoUrl={restaurant?.logo_url}
          isActive={restaurant?.is_active !== false}
        />

        <main className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
          <div className="max-w-7xl mx-auto">
            
            {error && (
              <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                Unable to load partner dashboard. Sign in as a restaurant partner.
              </div>
            )}

            {isLoading && !data && (
              <p className="text-gray-text mb-6 text-sm">Loading dashboard…</p>
            )}

            <PartnerWelcome restaurantName={restaurant?.name || "Partner"} />
            
            <PartnerStats
              totalOrders={stats?.totalOrders}
              todaysOrders={stats?.todaysOrders}
              todaysRevenue={stats?.todaysRevenue}
              pendingOrders={stats?.pendingOrders}
              completedOrders={stats?.completedOrders}
              activeMenuItems={stats?.activeMenuItems}
            />

            <QuickActions />

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
              
              <div className="xl:col-span-2 space-y-6">
                <LiveOrders
                  orders={data?.recentOrders}
                  onAccept={handleAccept}
                  onReject={handleReject}
                />
                <RevenueChart
                  chartData={chartData}
                  totalRevenue={stats?.totalRevenue}
                  avgOrder={avgOrder}
                />
              </div>

              <div className="space-y-6">
                <PopularItems
                  items={(data?.topDishes || []).map((d) => ({
                    name: d.name,
                    orders: d.orders_count,
                    revenue: d.revenue,
                    image: d.image_url,
                  }))}
                />
                <RecentReviews />
              </div>

            </div>
            
          </div>
        </main>
      </div>

    </div>
  );
}
