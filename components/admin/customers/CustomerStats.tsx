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
      color: "bg-blue-50 text-blue-600 border-blue-100",
    },
    {
      label: "Active Customers",
      value: stats?.activeCustomers ?? 0,
      format: (n: number) => n.toLocaleString("en-IN"),
      icon: UserCheck,
      color: "bg-emerald-50 text-emerald-600 border-emerald-100",
    },
    {
      label: "New Customers",
      value: stats?.newCustomers ?? 0,
      format: (n: number) => n.toLocaleString("en-IN"),
      icon: UserPlus,
      color: "bg-indigo-50 text-indigo-600 border-indigo-100",
    },
    {
      label: "Blocked Customers",
      value: stats?.blockedCustomers ?? 0,
      format: (n: number) => n.toLocaleString("en-IN"),
      icon: UserX,
      color: "bg-rose-50 text-rose-600 border-rose-100",
    },
    {
      label: "Verified Customers",
      value: stats?.verifiedCustomers ?? 0,
      format: (n: number) => n.toLocaleString("en-IN"),
      icon: ShieldCheck,
      color: "bg-teal-50 text-teal-600 border-teal-100",
    },
    {
      label: "Premium Customers",
      value: stats?.premiumCustomers ?? 0,
      format: (n: number) => n.toLocaleString("en-IN"),
      icon: Crown,
      color: "bg-amber-50 text-amber-600 border-amber-100",
    },
    {
      label: "Today's Registrations",
      value: stats?.todaysRegistrations ?? 0,
      format: (n: number) => n.toLocaleString("en-IN"),
      icon: Calendar,
      color: "bg-sky-50 text-sky-600 border-sky-100",
    },
    {
      label: "Monthly Registrations",
      value: stats?.monthlyRegistrations ?? 0,
      format: (n: number) => n.toLocaleString("en-IN"),
      icon: TrendingUp,
      color: "bg-purple-50 text-purple-600 border-purple-100",
    },
    {
      label: "Average Orders",
      value: stats?.averageOrders ?? 0,
      format: (n: number) => `${n} / user`,
      icon: ShoppingBag,
      color: "bg-orange-50 text-orange-600 border-orange-100",
    },
    {
      label: "Total Revenue Generated",
      value: stats?.totalRevenueGenerated ?? 0,
      format: (n: number) => `₹${n.toLocaleString("en-IN")}`,
      icon: IndianRupee,
      color: "bg-red-50 text-[#E23744] border-red-100",
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 mb-6">
        {Array.from({ length: 10 }).map((_, i) => (
          <div
            key={i}
            className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm animate-pulse flex flex-col justify-between h-24"
          >
            <div className="h-4 bg-gray-200 rounded w-2/3" />
            <div className="h-6 bg-gray-300 rounded w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 mb-6">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div
            key={idx}
            className="bg-white border border-gray-100 hover:border-red-200 rounded-2xl p-4 shadow-sm transition-all duration-200 hover:shadow-md flex flex-col justify-between group"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-gray-500 truncate">{card.label}</span>
              <div
                className={`w-7 h-7 rounded-xl flex items-center justify-center border shrink-0 ${card.color}`}
              >
                <Icon className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-lg md:text-xl font-black text-gray-900 tracking-tight">
                {card.format(card.value)}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
