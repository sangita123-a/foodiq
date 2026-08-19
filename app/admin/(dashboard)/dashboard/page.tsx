"use client";

import React, { useEffect, useState } from "react";
import { IndianRupee, ShoppingBag, Users, Bike, AlertCircle, CheckCircle, Clock } from "lucide-react";

interface AnalyticsData {
  totalRevenue: number;
  activeOrdersCount: number;
  totalCustomers: number;
  totalRiders: number;
  recentOrders: any[];
}

export default function AdminDashboard() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await fetch("/api/admin/analytics");
        const json = await res.json();
        if (json.success) {
          setData(json.data);
        }
      } catch (error) {
        console.error("Failed to fetch analytics:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  const kpis = [
    { 
      name: "Total Revenue", 
      value: loading ? "..." : `₹${data?.totalRevenue?.toLocaleString() || 0}`, 
      icon: IndianRupee, 
      color: "text-green-500", 
      bg: "bg-green-500/10" 
    },
    { 
      name: "Live Orders", 
      value: loading ? "..." : data?.activeOrdersCount || 0, 
      icon: ShoppingBag, 
      color: "text-blue-500", 
      bg: "bg-blue-500/10" 
    },
    { 
      name: "Total Customers", 
      value: loading ? "..." : data?.totalCustomers || 0, 
      icon: Users, 
      color: "text-purple-500", 
      bg: "bg-purple-500/10" 
    },
    { 
      name: "Total Riders", 
      value: loading ? "..." : data?.totalRiders || 0, 
      icon: Bike, 
      color: "text-orange-500", 
      bg: "bg-orange-500/10" 
    },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "DELIVERED":
        return <span className="px-2.5 py-1 text-xs font-medium bg-green-500/10 text-green-500 rounded-full">Delivered</span>;
      case "CANCELLED":
        return <span className="px-2.5 py-1 text-xs font-medium bg-red-500/10 text-red-500 rounded-full">Cancelled</span>;
      case "PENDING":
        return <span className="px-2.5 py-1 text-xs font-medium bg-yellow-500/10 text-yellow-500 rounded-full">Pending</span>;
      default:
        return <span className="px-2.5 py-1 text-xs font-medium bg-blue-500/10 text-blue-500 rounded-full">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard Overview</h1>
        <p className="text-gray-400">Welcome back. Here is what's happening today.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <div key={kpi.name} className="bg-gray-900 border border-gray-800 rounded-xl p-6 flex items-center gap-4">
            <div className={`p-4 rounded-lg ${kpi.bg}`}>
              <kpi.icon className={`h-6 w-6 ${kpi.color}`} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-400">{kpi.name}</p>
              <h3 className="text-2xl font-bold text-white mt-1">
                {loading ? (
                  <span className="inline-block h-6 w-16 bg-gray-800 rounded animate-pulse"></span>
                ) : (
                  kpi.value
                )}
              </h3>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders */}
        <div className="lg:col-span-2 bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <div className="p-6 border-b border-gray-800 flex justify-between items-center">
            <h2 className="text-lg font-bold text-white">Recent Orders</h2>
            {loading && <div className="h-4 w-4 rounded-full border-2 border-orange-500 border-t-transparent animate-spin" />}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-800/50 text-gray-400 text-sm">
                <tr>
                  <th className="px-6 py-3 font-medium">Order ID</th>
                  <th className="px-6 py-3 font-medium">Customer</th>
                  <th className="px-6 py-3 font-medium">Amount</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {loading ? (
                  [1, 2, 3].map((i) => (
                    <tr key={i}>
                      <td colSpan={4} className="px-6 py-4">
                        <div className="h-4 bg-gray-800 rounded animate-pulse w-full"></div>
                      </td>
                    </tr>
                  ))
                ) : data?.recentOrders?.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                      No recent orders found.
                    </td>
                  </tr>
                ) : (
                  data?.recentOrders?.map((order: any) => (
                    <tr key={order.id} className="text-gray-300 hover:bg-gray-800/30 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <span className="font-medium">#{order.id.slice(-6).toUpperCase()}</span>
                          <div className="text-xs text-gray-500 flex items-center mt-1">
                            <Clock className="h-3 w-3 mr-1" />
                            {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </td>
                        <td className="px-6 py-4">
                        <div className="font-medium text-gray-200">{order.user?.name || "Guest"}</div>
                        <div className="text-xs text-gray-500">{order.restaurant?.name}</div>
                      </td>
                      <td className="px-6 py-4 font-medium text-gray-200">
                        ₹{Number(order.totalAmount || 0).toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(order.status)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Operational Alerts & System Health */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl">
          <div className="p-6 border-b border-gray-800">
            <h2 className="text-lg font-bold text-white">System Health</h2>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="text-sm font-medium text-gray-300">API Gateway</span>
              </div>
              <span className="text-xs font-medium text-green-500">Online</span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="text-sm font-medium text-gray-300">Database Engine</span>
              </div>
              <span className="text-xs font-medium text-green-500">14ms ping</span>
            </div>

            <div className="flex gap-3 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg mt-4">
              <AlertCircle className="h-5 w-5 text-yellow-500 shrink-0" />
              <div>
                <p className="text-sm font-medium text-yellow-500">Elevated Traffic</p>
                <p className="text-xs text-yellow-400 mt-1">Order volume is 15% higher than usual for this hour.</p>
              </div>
            </div>
            
            <div className="flex gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
              <AlertCircle className="h-5 w-5 text-red-500 shrink-0" />
              <div>
                <p className="text-sm font-medium text-red-500">High Delivery Time</p>
                <p className="text-xs text-red-400 mt-1">Orders in Zone B are experiencing delays &gt; 45 mins.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
