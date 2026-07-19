"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import PartnerSidebar from "@/components/partner/PartnerSidebar";
import PartnerHeader from "@/components/partner/PartnerHeader";
import AnalyticsHeader from "@/components/partner/analytics/AnalyticsHeader";
import AnalyticsFilterBar from "@/components/partner/analytics/AnalyticsFilterBar";
import KPICards from "@/components/partner/analytics/KPICards";
import { FullAnalyticsData } from "@/components/partner/analytics/types";
import { usePartnerAnalytics, usePartnerDashboard } from "@/hooks/usePartnerData";
import { formatCurrency } from "@/services/partnerApi";
import { FOOD_FALLBACK } from "@/lib/images";

const PanelSkeleton = () => (
  <div className="mb-8 h-64 animate-pulse rounded-2xl bg-white border border-[#E5E7EB]" aria-hidden />
);

const RevenueAnalytics = dynamic(
  () => import("@/components/partner/analytics/RevenueAnalytics"),
  { loading: () => <PanelSkeleton /> }
);
const OrderAnalytics = dynamic(
  () => import("@/components/partner/analytics/OrderAnalytics"),
  { loading: () => <PanelSkeleton /> }
);
const MenuPerformance = dynamic(
  () => import("@/components/partner/analytics/MenuPerformance"),
  { loading: () => <PanelSkeleton /> }
);
const CustomerInsights = dynamic(
  () => import("@/components/partner/analytics/CustomerInsights"),
  { loading: () => <PanelSkeleton /> }
);
const PaymentAnalytics = dynamic(
  () => import("@/components/partner/analytics/PaymentAnalytics"),
  { loading: () => <PanelSkeleton /> }
);
const LocationInsights = dynamic(
  () => import("@/components/partner/analytics/LocationInsights"),
  { loading: () => <PanelSkeleton /> }
);
const AIInsights = dynamic(
  () => import("@/components/partner/analytics/AIInsights"),
  { loading: () => <PanelSkeleton /> }
);
const DownloadReports = dynamic(
  () => import("@/components/partner/analytics/DownloadReports"),
  { ssr: false }
);

const FALLBACK: FullAnalyticsData = {
  kpis: {
    totalOrders: 0,
    totalOrdersGrowth: 0,
    totalRevenue: 0,
    revenueGrowth: 0,
    newCustomers: 0,
    newCustomersGrowth: 0,
    averageRating: 0,
    averageRatingGrowth: 0,
    bestSellingDish: "—",
    bestSellingDishSales: 0,
    avgDeliveryTime: 30,
    avgDeliveryTimeGrowth: 0,
    averageOrderValue: 0,
    aovGrowth: 0,
  },
  revenue: {
    daily: [],
    weekly: [],
    monthly: [],
    yearly: [],
  },
  orders: {
    completionRate: 0,
    cancellationRate: 0,
    peakHour: "—",
    ordersByHour: [],
  },
  menu: {
    topSelling: [],
    leastOrdered: [],
    highestRevenue: {
      id: "0",
      name: "—",
      image: FOOD_FALLBACK,
      metricLabel: "Revenue",
      metricValue: "₹0",
    },
    fastestPrep: {
      id: "0",
      name: "—",
      image: FOOD_FALLBACK,
      metricLabel: "Prep Time",
      metricValue: "—",
    },
  },
  customers: {
    newPercentage: 0,
    returningPercentage: 0,
    satisfaction: 0,
    repeatPercentage: 0,
  },
  payments: [
    { method: "UPI", percentage: 0, color: "#a855f7" },
    { method: "Credit Card", percentage: 0, color: "#3b82f6" },
    { method: "Cash on Delivery", percentage: 0, color: "#eab308" },
    { method: "Wallet", percentage: 0, color: "#ec4899" },
  ],
  locations: [],
  aiInsights: [
    "Connect your live orders to unlock personalized insights.",
  ],
};

function toBars(
  rows: Array<{ label: string; value: number }>
): Array<{ label: string; value: number; height: string }> {
  const max = Math.max(...rows.map((r) => r.value), 1);
  return rows.map((r) => ({
    ...r,
    height: `${Math.max(8, Math.round((r.value / max) * 100))}%`,
  }));
}

export default function PartnerAnalyticsPage() {
  const [dateRange, setDateRange] = useState("This Month");
  const [comparePeriod, setComparePeriod] = useState(false);
  const { data: analytics } = usePartnerAnalytics();
  const { data: dashboard } = usePartnerDashboard();

  const data: FullAnalyticsData = useMemo(() => {
    if (!analytics && !dashboard) return FALLBACK;

    const stats = dashboard?.stats;
    const top = analytics?.top_dishes || dashboard?.topDishes || [];
    const best = top[0];

    const daily = toBars(
      (analytics?.daily || []).map((d: { day: string; revenue: number }) => ({
        label: new Date(d.day).toLocaleDateString("en-US", { weekday: "short" }),
        value: Number(d.revenue),
      }))
    );

    const weekly = toBars(
      (analytics?.weekly || []).map((d: { revenue: number }, i: number) => ({
        label: `Week ${i + 1}`,
        value: Number(d.revenue),
      }))
    );

    const monthly = toBars(
      (analytics?.monthly || []).map((d: { month_start: string; revenue: number }) => ({
        label: new Date(d.month_start).toLocaleDateString("en-US", { month: "short" }),
        value: Number(d.revenue),
      }))
    );

    const totalOrders = stats?.totalOrders || 0;
    const totalRevenue = stats?.totalRevenue || 0;
    const completed = stats?.completedOrders || 0;
    const aov = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;

    return {
      ...FALLBACK,
      kpis: {
        ...FALLBACK.kpis,
        totalOrders,
        totalRevenue,
        averageRating: stats?.averageRating || 0,
        bestSellingDish: best?.name || "—",
        bestSellingDishSales: best?.orders_count || 0,
        averageOrderValue: aov,
        avgDeliveryTime: Number(
          (dashboard?.restaurant as { estimated_delivery_time?: number } | undefined)
            ?.estimated_delivery_time || 30
        ),
      },
      revenue: {
        daily: daily.length ? daily : FALLBACK.revenue.daily,
        weekly: weekly.length ? weekly : FALLBACK.revenue.weekly,
        monthly: monthly.length ? monthly : FALLBACK.revenue.monthly,
        yearly: FALLBACK.revenue.yearly,
      },
      orders: {
        completionRate:
          totalOrders > 0 ? Math.round((completed / totalOrders) * 1000) / 10 : 0,
        cancellationRate: 0,
        peakHour: "—",
        ordersByHour: (analytics?.daily || []).slice(-8).map((d: { day: string; orders: number }) => {
          const count = d.orders;
          const max = Math.max(...(analytics?.daily || []).map((x: { orders: number }) => x.orders), 1);
          return {
            hour: new Date(d.day).toLocaleDateString("en-US", { weekday: "short" }),
            count,
            height: `${Math.max(8, Math.round((count / max) * 100))}%`,
          };
        }),
      },
      menu: {
        topSelling: top.slice(0, 4).map((d: { id: string; name: string; image_url?: string; orders_count: number }) => ({
          id: d.id,
          name: d.name,
          image: d.image_url || FOOD_FALLBACK,
          metricLabel: "Orders",
          metricValue: d.orders_count,
        })),
        leastOrdered: [...top]
          .sort((a, b) => a.orders_count - b.orders_count)
          .slice(0, 3)
          .map((d: { id: string; name: string; image_url?: string; orders_count: number }) => ({
            id: d.id,
            name: d.name,
            image: d.image_url || FOOD_FALLBACK,
            metricLabel: "Orders",
            metricValue: d.orders_count,
          })),
        highestRevenue: best
          ? {
              id: best.id,
              name: best.name,
              image: best.image_url || FOOD_FALLBACK,
              metricLabel: "Revenue",
              metricValue: formatCurrency(best.revenue),
            }
          : FALLBACK.menu.highestRevenue,
        fastestPrep: FALLBACK.menu.fastestPrep,
      },
      aiInsights: [
        best
          ? `${best.name} is your top seller with ${best.orders_count} orders.`
          : "Add menu items and fulfill orders to unlock insights.",
        `Total revenue to date: ${formatCurrency(totalRevenue)}.`,
        `Completed orders: ${completed} of ${totalOrders}.`,
      ],
    };
  }, [analytics, dashboard]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex selection:bg-[#E23744] selection:text-white">
      
      <div className="hidden lg:block w-64 flex-shrink-0">
        <PartnerSidebar />
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        
        <PartnerHeader />

        <main className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar relative">
          <div className="max-w-7xl mx-auto">
            
            <AnalyticsHeader />
            
            <AnalyticsFilterBar 
              dateRange={dateRange} setDateRange={setDateRange}
              comparePeriod={comparePeriod} setComparePeriod={setComparePeriod}
            />

            <KPICards data={data.kpis} />

            <AIInsights insights={data.aiInsights} />

            <RevenueAnalytics data={data.revenue} />

            <OrderAnalytics data={data.orders} />

            <MenuPerformance data={data.menu} />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <CustomerInsights data={data.customers} />
              <PaymentAnalytics data={data.payments} />
            </div>

            <LocationInsights data={data.locations} />

            <DownloadReports />

          </div>
        </main>
      </div>

    </div>
  );
}
