"use client";

import {
  Users,
  UserCheck,
  UserPlus,
  UserX,
  ShieldCheck,
  Crown,
  Calendar,
  TrendingUp,
  ShoppingBag,
  IndianRupee,
} from "lucide-react";
import StatCard from "@/components/admin/dashboard/StatCard";
import type { CustomerStats as CustomerStatsType } from "@/services/customerAdminApi";

type Props = {
  stats?: CustomerStatsType;
  isLoading?: boolean;
};

export default function CustomerStats({ stats, isLoading }: Props) {
  const cards = [
    {
      label: "Total Customers",
      value: stats?.totalCustomers ?? 0,
      format: (n: number) => n.toLocaleString("en-IN"),
      icon: Users,
      color: "text-blue-600",
      bg: "bg-blue-500/10",
    },
    {
      label: "Active Customers",
      value: stats?.activeCustomers ?? 0,
      format: (n: number) => n.toLocaleString("en-IN"),
      icon: UserCheck,
      color: "text-emerald-600",
      bg: "bg-emerald-500/10",
    },
    {
      label: "New Customers",
      value: stats?.newCustomers ?? 0,
      format: (n: number) => n.toLocaleString("en-IN"),
      icon: UserPlus,
      color: "text-indigo-600",
      bg: "bg-indigo-500/10",
    },
    {
      label: "Blocked Customers",
      value: stats?.blockedCustomers ?? 0,
      format: (n: number) => n.toLocaleString("en-IN"),
      icon: UserX,
      color: "text-rose-600",
      bg: "bg-rose-500/10",
    },
    {
      label: "Verified Customers",
      value: stats?.verifiedCustomers ?? 0,
      format: (n: number) => n.toLocaleString("en-IN"),
      icon: ShieldCheck,
      color: "text-teal-600",
      bg: "bg-teal-500/10",
    },
    {
      label: "Premium Customers",
      value: stats?.premiumCustomers ?? 0,
      format: (n: number) => n.toLocaleString("en-IN"),
      icon: Crown,
      color: "text-amber-600",
      bg: "bg-amber-500/10",
    },
    {
      label: "Today's Registrations",
      value: stats?.todaysRegistrations ?? 0,
      format: (n: number) => n.toLocaleString("en-IN"),
      icon: Calendar,
      color: "text-sky-600",
      bg: "bg-sky-500/10",
    },
    {
      label: "Monthly Registrations",
      value: stats?.monthlyRegistrations ?? 0,
      format: (n: number) => n.toLocaleString("en-IN"),
      icon: TrendingUp,
      color: "text-purple-600",
      bg: "bg-purple-500/10",
    },
    {
      label: "Average Orders",
      value: stats?.averageOrders ?? 0,
      format: (n: number) => `${n} / user`,
      icon: ShoppingBag,
      color: "text-orange-600",
      bg: "bg-orange-500/10",
    },
    {
      label: "Total Revenue Generated",
      value: stats?.totalRevenueGenerated ?? 0,
      format: (n: number) => `₹${n.toLocaleString("en-IN")}`,
      icon: IndianRupee,
      color: "text-primary",
      bg: "bg-primary/10",
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 mb-6">
      {cards.map((card) => (
        <StatCard
          key={card.label}
          label={card.label}
          value={card.value}
          icon={card.icon}
          color={card.color}
          bg={card.bg}
          format={card.format}
          loading={isLoading}
        />
      ))}
    </div>
  );
}
