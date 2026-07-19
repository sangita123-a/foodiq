"use client";

import Link from "next/link";
import { mutate } from "swr";
import { MapPin, Package, Star, Wallet } from "lucide-react";
import DeliveryShell from "@/components/delivery/DeliveryShell";
import {
  useDeliveryDashboard,
} from "@/hooks/useDeliveryData";
import {
  acceptDeliveryOrder,
  rejectDeliveryOrder,
  formatCurrency,
  STATUS_LABELS,
} from "@/services/deliveryApi";

export default function DeliveryDashboardPage() {
  const { data, error, isLoading } = useDeliveryDashboard();

  const refresh = () => {
    mutate("/api/delivery/dashboard");
    mutate("/api/delivery/orders/available");
    mutate("/api/delivery/orders/assigned");
  };

  const handleAccept = async (id: string) => {
    await acceptDeliveryOrder(id);
    refresh();
  };

  const handleReject = async (id: string) => {
    await rejectDeliveryOrder(id);
    refresh();
  };

  const stats = [
    {
      label: "Earnings Today",
      value: formatCurrency(data?.earnings_today || 0),
      icon: Wallet,
    },
    {
      label: "Weekly Earnings",
      value: formatCurrency(data?.earnings_weekly || 0),
      icon: Wallet,
    },
    {
      label: "Completed",
      value: String(data?.completed_total || 0),
      icon: Package,
    },
    {
      label: "Rating",
      value: (data?.rating || 0).toFixed(1),
      icon: Star,
    },
  ];

  return (
    <DeliveryShell online={data?.is_online}>
      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Unable to load delivery dashboard. Sign in as a delivery partner.
        </div>
      )}

      {isLoading && !data && (
        <p className="text-[#6B7280] text-sm mb-6">Loading dashboard...</p>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-white border border-[#E5E7EB] rounded-2xl p-5"
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-bold uppercase tracking-widest text-[#9CA3AF]">
                {stat.label}
              </p>
              <stat.icon className="w-4 h-4 text-[#E23744]" />
            </div>
            <p className="text-2xl font-black text-[#111827]">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <section className="bg-white border border-[#E5E7EB] rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-black text-[#111827]">Assigned Orders</h2>
            <Link href="/delivery/orders" className="text-sm font-bold text-[#E23744]">
              View all
            </Link>
          </div>
          <div className="space-y-3">
            {(data?.assigned_orders || []).slice(0, 5).map((order) => (
              <Link
                key={order.id}
                href={`/delivery/orders/${order.id}`}
                className="block border border-[#E5E7EB] rounded-xl p-4 hover:bg-[#F8FAFC] transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-bold text-[#111827]">{order.restaurant.name}</p>
                    <p className="text-xs text-[#6B7280] mt-1 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {order.customer.address || "Customer address"}
                    </p>
                  </div>
                  <span className="text-xs font-bold px-2 py-1 rounded-lg bg-[#E23744]/10 text-[#E23744]">
                    {STATUS_LABELS[order.assignment_status || ""] ||
                      order.assignment_status}
                  </span>
                </div>
              </Link>
            ))}
            {!data?.assigned_orders?.length && (
              <p className="text-sm text-[#6B7280] py-6 text-center">
                No assigned orders right now
              </p>
            )}
          </div>
        </section>

        <section className="bg-white border border-[#E5E7EB] rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-black text-[#111827]">Available Nearby</h2>
            <span className="text-xs font-bold text-[#9CA3AF]">
              {data?.available_orders?.length || 0} orders
            </span>
          </div>
          <div className="space-y-3">
            {(data?.available_orders || []).slice(0, 5).map((order) => (
              <div
                key={order.id}
                className="border border-[#E5E7EB] rounded-xl p-4"
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <p className="font-bold text-[#111827]">{order.restaurant.name}</p>
                    <p className="text-xs text-[#6B7280] mt-1">
                      Fee {formatCurrency(order.delivery_fee)} · Order{" "}
                      {formatCurrency(order.total_amount)}
                    </p>
                  </div>
                  <Link
                    href={`/delivery/orders/${order.id}`}
                    className="text-xs font-bold text-[#E23744]"
                  >
                    Details
                  </Link>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleAccept(order.id)}
                    className="flex-1 bg-[#E23744] hover:bg-[#C81E34] text-white text-sm font-bold py-2 rounded-lg"
                  >
                    Accept
                  </button>
                  <button
                    type="button"
                    onClick={() => handleReject(order.id)}
                    className="flex-1 bg-[#F8FAFC] hover:bg-[#F3F4F6] text-[#6B7280] text-sm font-bold py-2 rounded-lg border border-[#E5E7EB]"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
            {!data?.available_orders?.length && (
              <p className="text-sm text-[#6B7280] py-6 text-center">
                No nearby orders available. Go online to receive requests.
              </p>
            )}
          </div>
        </section>
      </div>
    </DeliveryShell>
  );
}
