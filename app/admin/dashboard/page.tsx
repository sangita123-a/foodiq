"use client";

import { useMemo } from "react";
import AdminShell from "@/components/admin/AdminShell";
import { useAdminLive } from "@/hooks/useAdminLive";
import { formatCurrency } from "@/services/adminApi";
import StatCard from "@/components/admin/dashboard/StatCard";
import LiveOrderStatusPipeline from "@/components/admin/dashboard/LiveOrderStatusPipeline";
import RecentOrdersTable from "@/components/admin/dashboard/RecentOrdersTable";
import LiveDeliveryPartnersPanel from "@/components/admin/dashboard/LiveDeliveryPartnersPanel";
import LiveRestaurantsPanel from "@/components/admin/dashboard/LiveRestaurantsPanel";
import SalesAnalyticsPanel from "@/components/admin/dashboard/SalesAnalyticsPanel";
import TopRestaurantsPanel from "@/components/admin/dashboard/TopRestaurantsPanel";
import TopDeliveryPartnersPanel from "@/components/admin/dashboard/TopDeliveryPartnersPanel";
import CustomerInsightsPanel from "@/components/admin/dashboard/CustomerInsightsPanel";
import NotificationsActivityPanel from "@/components/admin/dashboard/NotificationsActivityPanel";
import SystemHealthPanel from "@/components/admin/dashboard/SystemHealthPanel";
import {
  ShoppingBag,
  Clock,
  CheckCircle2,
  XCircle,
  DollarSign,
  CalendarDays,
  CalendarRange,
  Store,
  Bike,
  UserPlus,
  Headphones,
  Star,
  Wifi,
  WifiOff,
  Undo2,
  Ticket,
  Wallet,
  Landmark,
  UtensilsCrossed,
  Truck,
  PiggyBank,
} from "lucide-react";

export default function AdminDashboardPage() {
  const { data: stats, error: errorMsg, isLoading: loading, connected, offline } = useAdminLive();

  const statCards = useMemo(
    () => [
      {
        label: "Today's Orders",
        value: stats?.todaysOrders ?? 0,
        icon: ShoppingBag,
        color: "text-sky-600",
        bg: "bg-sky-500/10",
      },
      {
        label: "Pending Orders",
        value: stats?.orderStatusToday?.pending ?? 0,
        icon: Clock,
        color: "text-amber-600",
        bg: "bg-amber-500/10",
      },
      {
        label: "Completed Orders",
        value: stats?.deliveredOrders ?? 0,
        icon: CheckCircle2,
        color: "text-emerald-600",
        bg: "bg-emerald-500/10",
      },
      {
        label: "Cancelled Orders",
        value: stats?.cancelledOrders ?? 0,
        icon: XCircle,
        color: "text-red-500",
        bg: "bg-red-500/10",
      },
      {
        label: "Today's Revenue",
        value: stats?.todaysRevenue ?? 0,
        icon: DollarSign,
        color: "text-primary",
        bg: "bg-primary/10",
        format: formatCurrency,
      },
      {
        label: "Weekly Revenue",
        value: stats?.weeklyRevenue ?? 0,
        icon: CalendarDays,
        color: "text-primary",
        bg: "bg-primary/10",
        format: formatCurrency,
      },
      {
        label: "Monthly Revenue",
        value: stats?.monthlyRevenue ?? 0,
        icon: CalendarRange,
        color: "text-primary",
        bg: "bg-primary/10",
        format: formatCurrency,
      },
      {
        label: "Active Restaurants",
        value: stats?.restaurantStatus?.active ?? stats?.totalRestaurants ?? 0,
        icon: Store,
        color: "text-violet-600",
        bg: "bg-violet-500/10",
      },
      {
        label: "Online Delivery Partners",
        value: stats?.activeDeliveryPartners ?? 0,
        icon: Bike,
        color: "text-cyan-600",
        bg: "bg-cyan-500/10",
      },
      {
        label: "New Customers",
        value: stats?.customerInsights?.new_today ?? 0,
        icon: UserPlus,
        color: "text-blue-600",
        bg: "bg-blue-500/10",
      },
      {
        label: "Support Tickets",
        value: stats?.openSupportTickets ?? 0,
        icon: Headphones,
        color: "text-orange-600",
        bg: "bg-orange-500/10",
      },
      {
        label: "Average Rating",
        value: stats?.customerSatisfaction ?? 0,
        icon: Star,
        color: "text-yellow-600",
        bg: "bg-yellow-500/10",
        format: (n: number) => `${n.toFixed(1)} ★`,
      },
      {
        label: "Today's Profit",
        value: stats?.profitToday ?? 0,
        icon: PiggyBank,
        color: "text-emerald-600",
        bg: "bg-emerald-500/10",
        format: formatCurrency,
      },
      {
        label: "Refund Amount Today",
        value: stats?.refundAmountToday ?? 0,
        icon: Undo2,
        color: "text-rose-600",
        bg: "bg-rose-500/10",
        format: formatCurrency,
      },
      {
        label: "Active Coupons",
        value: stats?.activeCoupons ?? 0,
        icon: Ticket,
        color: "text-fuchsia-600",
        bg: "bg-fuchsia-500/10",
      },
      {
        label: "Wallet Balance",
        value: stats?.walletBalance ?? 0,
        icon: Wallet,
        color: "text-indigo-600",
        bg: "bg-indigo-500/10",
        format: formatCurrency,
      },
      {
        label: "Platform Earnings Today",
        value: stats?.platformEarningsToday ?? 0,
        icon: Landmark,
        color: "text-primary",
        bg: "bg-primary/10",
        format: formatCurrency,
      },
      {
        label: "Restaurant Earnings Today",
        value: stats?.restaurantEarningsToday ?? 0,
        icon: UtensilsCrossed,
        color: "text-orange-600",
        bg: "bg-orange-500/10",
        format: formatCurrency,
      },
      {
        label: "Delivery Earnings Today",
        value: stats?.deliveryEarningsToday ?? 0,
        icon: Truck,
        color: "text-cyan-600",
        bg: "bg-cyan-500/10",
        format: formatCurrency,
      },
    ],
    [stats]
  );

  return (
    <AdminShell title="Enterprise Dashboard">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-black text-foreground mb-1">Enterprise Overview</h1>
          <p className="text-gray-text">
            Real-time platform analytics across revenue, orders, and operations.
          </p>
        </div>
        <div
          className={`inline-flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-full border ${
            connected && !offline
              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
              : "bg-amber-50 text-amber-700 border-amber-200"
          }`}
        >
          {connected && !offline ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
          {offline ? "Offline" : connected ? "Live" : "Reconnecting…"}
        </div>
      </div>

      {errorMsg && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Unable to load admin dashboard. Sign in as an admin.
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
        {statCards.map((c) => (
          <StatCard
            key={c.label}
            label={c.label}
            value={c.value}
            icon={c.icon}
            color={c.color}
            bg={c.bg}
            format={c.format}
            loading={loading && !stats}
          />
        ))}
      </div>

      <div className="mb-6">
        <LiveOrderStatusPipeline statusCounts={stats?.orderStatusToday} loading={loading && !stats} />
      </div>

      <div className="mb-6">
        <RecentOrdersTable />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <LiveDeliveryPartnersPanel />
        <LiveRestaurantsPanel restaurants={stats?.liveRestaurants} loading={loading && !stats} />
      </div>

      <div className="mb-6">
        <SalesAnalyticsPanel stats={stats} loading={loading && !stats} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <TopRestaurantsPanel restaurants={stats?.topRestaurants} loading={loading && !stats} />
        <TopDeliveryPartnersPanel />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <CustomerInsightsPanel insights={stats?.customerInsights} loading={loading && !stats} />
        <NotificationsActivityPanel />
      </div>

      <div className="mb-6">
        <SystemHealthPanel />
      </div>
    </AdminShell>
  );
}
