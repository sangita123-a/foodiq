"use client";

import {
  Store,
  CheckCircle2,
  Clock,
  XCircle,
  Ban,
  MoonStar,
  DoorOpen,
  Flame,
  Star,
  ShoppingBag,
  IndianRupee,
} from "lucide-react";
import StatCard from "@/components/admin/dashboard/StatCard";
import { formatCurrency, type AdminRestaurantStats } from "@/services/adminApi";

export default function RestaurantStatsStrip({
  stats,
  loading,
}: {
  stats?: AdminRestaurantStats;
  loading: boolean;
}) {
  const tiles: Array<{
    key: keyof AdminRestaurantStats;
    label: string;
    icon: typeof Store;
    color?: string;
    bg?: string;
    format?: (n: number) => string;
  }> = [
    { key: "total", label: "Total Restaurants", icon: Store, color: "text-primary", bg: "bg-primary/10" },
    { key: "active", label: "Active", icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50" },
    { key: "pending_approval", label: "Pending Approval", icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
    { key: "rejected", label: "Rejected", icon: XCircle, color: "text-red-600", bg: "bg-red-50" },
    { key: "suspended", label: "Suspended", icon: Ban, color: "text-rose-600", bg: "bg-rose-50" },
    { key: "temporarily_closed", label: "Temporarily Closed", icon: MoonStar, color: "text-slate-600", bg: "bg-slate-100" },
    { key: "open_now", label: "Open Now", icon: DoorOpen, color: "text-blue-600", bg: "bg-blue-50" },
    { key: "busy", label: "Busy", icon: Flame, color: "text-orange-600", bg: "bg-orange-50" },
    { key: "avg_rating", label: "Average Rating", icon: Star, color: "text-yellow-600", bg: "bg-yellow-50", format: (n) => n.toFixed(1) },
    { key: "today_orders", label: "Today's Orders", icon: ShoppingBag, color: "text-indigo-600", bg: "bg-indigo-50" },
    { key: "today_revenue", label: "Today's Revenue", icon: IndianRupee, color: "text-green-600", bg: "bg-green-50", format: (n) => formatCurrency(n) },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 mb-6">
      {tiles.map((tile) => (
        <StatCard
          key={tile.key}
          label={tile.label}
          value={stats ? Number(stats[tile.key] || 0) : 0}
          icon={tile.icon}
          color={tile.color}
          bg={tile.bg}
          format={tile.format}
          loading={loading}
        />
      ))}
    </div>
  );
}
