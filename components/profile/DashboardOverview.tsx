"use client";

import { Package, Heart, IndianRupee, Award, ArrowRight, Bell } from "lucide-react";
import { motion } from "framer-motion";
import useSWR from "swr";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ProfileTab } from "./ProfileSidebar";
import FavoritesPanel from "./FavoritesPanel";

type Props = {
  onNavigate?: (tab: ProfileTab) => void;
};

export default function DashboardOverview({ onNavigate }: Props) {
  const { data: dash, isLoading: loadingDash } = useSWR("/api/profile/dashboard");
  const { data: authData, isLoading: isLoadingAuth } = useSWR("/api/profile");
  const { data: bi } = useSWR("/api/analytics/customer?days=90");

  const user = authData || { full_name: "User" };
  const orders = dash?.recent_orders || [];
  const notifications = dash?.recent_notifications || [];
  const totalOrders = dash?.total_orders ?? bi?.summary?.orders ?? 0;
  const totalSpending = dash?.total_spending ?? bi?.summary?.clv ?? 0;
  const rewardPoints = dash?.reward_points ?? 0;
  const aov = bi?.summary?.aov ?? 0;
  const clv = bi?.summary?.clv ?? totalSpending;

  const statCards = [
    {
      id: 1,
      title: "Total Orders",
      value: totalOrders.toString(),
      icon: <Package className="w-6 h-6 text-blue-400" />,
      color: "bg-blue-500/10 border-blue-500/20",
    },
    {
      id: 2,
      title: "Lifetime value (CLV)",
      value: `₹${Number(clv).toFixed(0)}`,
      icon: <IndianRupee className="w-6 h-6 text-green-400" />,
      color: "bg-green-500/10 border-green-500/20",
    },
    {
      id: 3,
      title: "Avg order (AOV)",
      value: `₹${Number(aov || (totalOrders ? totalSpending / totalOrders : 0)).toFixed(0)}`,
      icon: <Award className="w-6 h-6 text-yellow-400" />,
      color: "bg-yellow-500/10 border-yellow-500/20",
    },
    {
      id: 4,
      title: "Reward Points",
      value: rewardPoints.toString(),
      icon: <Heart className="w-6 h-6 text-red-400" />,
      color: "bg-red-500/10 border-red-500/20",
    },
  ];

  const recentOrders = orders.slice(0, 3).map((o: any) => ({
    id: o.id,
    restaurant: o.restaurant_name,
    date: new Date(o.created_at).toLocaleDateString(),
    price: `₹${o.total_amount}`,
    status: o.status ? o.status.charAt(0).toUpperCase() + o.status.slice(1) : "Pending",
  }));

  const [userName, setUserName] = useState("User");
  useEffect(() => {
    if (user.full_name && user.full_name !== "User") {
      setUserName(user.full_name.split(" ")[0]);
    } else {
      const userStr = localStorage.getItem("user");
      if (userStr) {
        try {
          const u = JSON.parse(userStr);
          setUserName(u.full_name?.split(" ")[0] || "User");
        } catch (_) {}
      }
    }
  }, [user.full_name]);

  if (loadingDash || isLoadingAuth) {
    return (
      <div className="flex flex-col gap-8">
        <div className="h-28 bg-[#F8FAFC] animate-pulse rounded-[24px]"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-[#F8FAFC] animate-pulse rounded-2xl"></div>
          ))}
        </div>
        <div className="h-64 bg-[#F8FAFC] animate-pulse rounded-[24px]"></div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col gap-8"
    >
      <div className="bg-[#F8FAFC] rounded-[24px] p-6 md:p-8 border border-[#E5E7EB] flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-white mb-2">Hello, {userName} 👋</h1>
          <p className="text-[#6B7280]">Welcome back to Foodiq. Ready for your next meal?</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {statCards.map((stat) => (
          <div
            key={stat.id}
            className="bg-[#F8FAFC] rounded-2xl p-6 border border-[#E5E7EB] hover:border-[#E5E7EB] transition-colors"
          >
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 border ${stat.color}`}
            >
              {stat.icon}
            </div>
            <p className="text-[#6B7280] text-sm font-medium mb-1">{stat.title}</p>
            <h3 className="text-2xl font-bold text-[#111827]">{stat.value}</h3>
          </div>
        ))}
      </div>

      <div className="bg-[#F8FAFC] rounded-[24px] p-6 md:p-8 border border-[#E5E7EB]">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-[#111827]">Recent Orders</h2>
          <button
            onClick={() => onNavigate?.("My Orders")}
            className="text-primary text-sm font-bold flex items-center gap-1 hover:text-[#111827] transition-colors"
          >
            View All <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-[#6B7280] text-sm border-b border-[#E5E7EB]">
                <th className="pb-4 font-medium">Order ID</th>
                <th className="pb-4 font-medium">Restaurant</th>
                <th className="pb-4 font-medium">Date</th>
                <th className="pb-4 font-medium">Amount</th>
                <th className="pb-4 font-medium text-right">Status</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-[#9CA3AF]">
                    No orders yet
                  </td>
                </tr>
              ) : (
                recentOrders.map((order: any, idx: number) => (
                  <tr
                    key={order.id}
                    className={idx !== recentOrders.length - 1 ? "border-b border-[#E5E7EB]" : ""}
                  >
                    <td className="py-4 text-white font-medium font-mono text-xs">
                      {order.id.slice(0, 8)}…
                    </td>
                    <td className="py-4 text-[#111827]">{order.restaurant}</td>
                    <td className="py-4 text-[#6B7280]">{order.date}</td>
                    <td className="py-4 text-white font-bold">{order.price}</td>
                    <td className="py-4 text-right">
                      <span className="bg-green-500/10 text-green-400 text-xs font-bold px-3 py-1 rounded-full border border-green-500/20">
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-[#F8FAFC] rounded-[24px] p-6 md:p-8 border border-[#E5E7EB]">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-[#111827] flex items-center gap-2">
            <Bell className="w-5 h-5 text-primary" /> Recent Notifications
          </h2>
          <button
            onClick={() => onNavigate?.("Notifications")}
            className="text-primary text-sm font-bold flex items-center gap-1 hover:text-[#111827]"
          >
            View All <ArrowRight className="w-4 h-4" />
          </button>
        </div>
        {notifications.length === 0 ? (
          <p className="text-[#9CA3AF]">No recent notifications.</p>
        ) : (
          <div className="space-y-3">
            {notifications.map((n: any) => (
              <div
                key={n.id}
                className="bg-white rounded-xl px-4 py-3 border border-[#E5E7EB] flex justify-between gap-4"
              >
                <div>
                  <p className="text-white font-bold text-sm">{n.title}</p>
                  <p className="text-[#9CA3AF] text-xs line-clamp-1">{n.message}</p>
                </div>
                {!n.is_read && (
                  <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-2" />
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-[#F8FAFC] rounded-[24px] p-6 md:p-8 border border-[#E5E7EB]">
        <h2 className="mb-6 text-xl font-bold text-[#222222]">Quick Links</h2>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/order-online"
            className="rounded-xl bg-[#E23744]/10 px-4 py-2 text-sm font-bold text-[#E23744] hover:bg-[#E23744]/20"
          >
            Order Food
          </Link>
          <button
            type="button"
            onClick={() => onNavigate?.("Wishlist")}
            className="rounded-xl border border-[#E5E7EB] bg-white px-4 py-2 text-sm font-bold text-[#222222] hover:bg-[#F8F9FA]"
          >
            Wishlist
          </button>
          <Link
            href="/coupons-rewards"
            className="rounded-xl border border-[#E5E7EB] bg-white px-4 py-2 text-sm font-bold text-[#222222] hover:bg-[#F8F9FA]"
          >
            Rewards
          </Link>
        </div>
      </div>

      <div className="mt-8">
        <FavoritesPanel />
      </div>
    </motion.div>
  );
}
