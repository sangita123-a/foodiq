"use client";

import useSWR from "swr";
import DeliveryShell from "@/components/delivery/DeliveryShell";
import api from "@/services/api";
import { BarChart3 } from "lucide-react";

export default function DeliveryAnalyticsPage() {
  const { data, isLoading } = useSWR("/api/analytics/delivery?days=30", (url) =>
    api.get(url).then((r) => r.data.data)
  );
  const summary = data?.summary;

  return (
    <DeliveryShell>
      <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#FC8019]/10 flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-[#FC8019]" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-[#111827]">
              Delivery analytics
            </h1>
            <p className="text-sm text-[#6B7280]">
              Performance over the last 30 days
            </p>
          </div>
        </div>

        {isLoading ? (
          <p className="text-sm text-[#6B7280]">Loading…</p>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "Delivered", value: summary?.delivered ?? 0 },
              { label: "Cancelled", value: summary?.cancelled ?? 0 },
              {
                label: "Avg minutes",
                value: Math.round(summary?.avg_delivery_minutes || 0),
              },
              { label: "Active riders", value: summary?.active_riders ?? 0 },
            ].map((k) => (
              <div
                key={k.label}
                className="bg-white rounded-3xl border border-[#E5E7EB] p-5"
              >
                <p className="text-xs font-bold text-[#9CA3AF] uppercase">
                  {k.label}
                </p>
                <p className="text-2xl font-black text-[#111827] mt-1">
                  {k.value}
                </p>
              </div>
            ))}
          </div>
        )}

        <div className="bg-white rounded-3xl border border-[#E5E7EB] p-6">
          <h2 className="font-bold text-lg mb-4">Top partners</h2>
          <div className="space-y-2">
            {(data?.top_partners || []).map(
              (p: {
                id: string;
                full_name: string;
                delivered: number;
                rating: number;
              }) => (
                <div
                  key={p.id}
                  className="flex justify-between text-sm border-b border-[#E5E7EB] py-2"
                >
                  <span className="font-bold">{p.full_name}</span>
                  <span className="text-[#6B7280]">
                    {p.delivered} delivered · ★ {Number(p.rating || 0).toFixed(1)}
                  </span>
                </div>
              )
            )}
            {!data?.top_partners?.length && (
              <p className="text-sm text-[#6B7280]">No partner stats yet.</p>
            )}
          </div>
        </div>
      </div>
    </DeliveryShell>
  );
}
