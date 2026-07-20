"use client";

import { useEffect, useState } from "react";
import useSWR, { mutate } from "swr";
import PartnerSidebar from "@/components/partner/PartnerSidebar";
import PartnerHeader from "@/components/partner/PartnerHeader";
import { inventoryFetcher, type KitchenOrder } from "@/services/partnerInventoryApi";
import { updatePartnerOrderStatus } from "@/services/partnerApi";
import type { OrderStatus } from "@/components/partner/orders/types";
import { Clock, ChefHat, CheckCircle, Flame } from "lucide-react";

type KitchenData = {
  orders: KitchenOrder[];
  stats: {
    new_orders: number;
    preparing: number;
    ready: number;
    completed_today: number;
    avg_prep_minutes: number;
  };
};

const COLUMNS = [
  { key: "new", label: "New Orders", statuses: ["Pending", "Accepted"] },
  { key: "preparing", label: "Preparing", statuses: ["Preparing"] },
  { key: "ready", label: "Ready", statuses: ["Ready for Pickup"] },
  { key: "done", label: "Completed", statuses: ["Delivered"] },
];

export default function PartnerKitchenPage() {
  const { data, isLoading } = useSWR<KitchenData>("/api/partner/inventory/kitchen", inventoryFetcher, {
    refreshInterval: 15000,
  });
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(id);
  }, []);

  const advance = async (order: KitchenOrder) => {
    const next: Record<string, OrderStatus> = {
      Pending: "Accepted",
      Accepted: "Preparing",
      Preparing: "Ready for Pickup",
      "Ready for Pickup": "Delivered",
    };
    const uiNext = next[order.status];
    if (!uiNext) return;
    await updatePartnerOrderStatus(order.id, uiNext);
    mutate("/api/partner/inventory/kitchen");
    mutate("/api/partner/orders");
  };

  const elapsed = (started?: string) => {
    if (!started) return null;
    const mins = Math.floor((now - new Date(started).getTime()) / 60000);
    return `${mins}m`;
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex">
      <div className="hidden lg:block w-64 flex-shrink-0">
        <PartnerSidebar />
      </div>
      <div className="flex-1 flex flex-col min-w-0">
        <PartnerHeader />
        <main className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
          <div className="max-w-7xl mx-auto space-y-6">
            <div>
              <h1 className="text-3xl font-black text-[#111827] flex items-center gap-2">
                <ChefHat className="w-8 h-8 text-[#E23744]" /> Kitchen Dashboard
              </h1>
              <p className="text-[#6B7280]">Live order queue with prep timers.</p>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
              {[
                { label: "New", value: data?.stats?.new_orders ?? 0, icon: Flame },
                { label: "Preparing", value: data?.stats?.preparing ?? 0, icon: Clock },
                { label: "Ready", value: data?.stats?.ready ?? 0, icon: CheckCircle },
                { label: "Completed Today", value: data?.stats?.completed_today ?? 0, icon: CheckCircle },
                { label: "Avg Prep (min)", value: Number(data?.stats?.avg_prep_minutes || 0).toFixed(0), icon: Clock },
              ].map((s) => (
                <div key={s.label} className="bg-white rounded-2xl border border-[#E5E7EB] p-4">
                  <p className="text-xs font-bold uppercase text-[#9CA3AF]">{s.label}</p>
                  <p className="text-2xl font-black text-[#111827]">{s.value}</p>
                </div>
              ))}
            </div>

            {isLoading && <p className="text-sm text-[#6B7280]">Loading kitchen queue…</p>}

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              {COLUMNS.map((col) => {
                const colOrders = (data?.orders || []).filter((o) => col.statuses.includes(o.status));
                return (
                  <div key={col.key} className="bg-white rounded-3xl border border-[#E5E7EB] p-4 min-h-[320px]">
                    <h2 className="font-black text-[#111827] mb-3 text-sm uppercase tracking-wide">{col.label}</h2>
                    <div className="space-y-3">
                      {colOrders.map((order) => (
                        <div key={order.id} className="border border-[#E5E7EB] rounded-xl p-3">
                          <div className="flex justify-between items-start mb-2">
                            <p className="font-bold text-sm">#{String(order.id).slice(0, 8)}</p>
                            {order.started_at && col.key === "preparing" && (
                              <span className="text-xs font-bold text-[#E23744] flex items-center gap-1">
                                <Clock className="w-3 h-3" /> {elapsed(order.started_at)}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-[#6B7280] mb-2">{order.customer_name}</p>
                          <ul className="text-xs space-y-0.5 mb-3">
                            {(Array.isArray(order.items) ? order.items : []).map((it, i) => (
                              <li key={i}>{it.quantity}× {it.name}</li>
                            ))}
                          </ul>
                          {col.key !== "done" && (
                            <button
                              type="button"
                              onClick={() => advance(order)}
                              className="w-full bg-[#111827] text-white text-xs font-black py-2 rounded-lg"
                            >
                              Advance
                            </button>
                          )}
                          {order.prep_minutes != null && col.key === "done" && (
                            <p className="text-[10px] text-[#9CA3AF]">Prep: {order.prep_minutes} min</p>
                          )}
                        </div>
                      ))}
                      {!colOrders.length && (
                        <p className="text-xs text-[#9CA3AF] text-center py-8">No orders</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
