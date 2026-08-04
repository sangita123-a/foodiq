"use client";

import {
  ShoppingBag,
  Clock,
  CheckCircle2,
  ChefHat,
  PackageCheck,
  Bike,
  Truck,
  Home,
  XCircle,
  RotateCcw,
  AlertTriangle,
  CalendarClock,
} from "lucide-react";
import StatCard from "@/components/admin/dashboard/StatCard";
import type { AdminOrderStats } from "@/services/adminApi";

export default function OrderStatsStrip({
  stats,
  loading,
}: {
  stats?: AdminOrderStats;
  loading: boolean;
}) {
  const tiles: Array<{
    key: keyof AdminOrderStats;
    label: string;
    icon: typeof ShoppingBag;
    color?: string;
    bg?: string;
  }> = [
    { key: "today_orders", label: "Today's Orders", icon: ShoppingBag, color: "text-primary", bg: "bg-primary/10" },
    { key: "pending", label: "Pending", icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
    { key: "accepted", label: "Accepted", icon: CheckCircle2, color: "text-blue-600", bg: "bg-blue-50" },
    { key: "preparing", label: "Preparing", icon: ChefHat, color: "text-orange-600", bg: "bg-orange-50" },
    { key: "ready", label: "Ready", icon: PackageCheck, color: "text-indigo-600", bg: "bg-indigo-50" },
    { key: "picked_up", label: "Picked Up", icon: Bike, color: "text-cyan-600", bg: "bg-cyan-50" },
    { key: "out_for_delivery", label: "Out for Delivery", icon: Truck, color: "text-purple-600", bg: "bg-purple-50" },
    { key: "delivered", label: "Delivered", icon: Home, color: "text-emerald-600", bg: "bg-emerald-50" },
    { key: "cancelled", label: "Cancelled", icon: XCircle, color: "text-red-600", bg: "bg-red-50" },
    { key: "refunded", label: "Refunded", icon: RotateCcw, color: "text-rose-600", bg: "bg-rose-50" },
    { key: "failed_payments", label: "Failed Payments", icon: AlertTriangle, color: "text-red-700", bg: "bg-red-50" },
    { key: "scheduled_orders", label: "Scheduled Orders", icon: CalendarClock, color: "text-teal-600", bg: "bg-teal-50" },
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
          loading={loading}
        />
      ))}
    </div>
  );
}
