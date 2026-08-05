"use client";

import useSWR from "swr";
import { Award, Star } from "lucide-react";
import { useAuthToken } from "@/hooks/useAuthToken";
import { fetchAdminDeliveryAnalytics, formatCurrency } from "@/services/adminApi";
import { PanelSkeleton } from "./Skeleton";

export default function TopDeliveryPartnersPanel() {
  const hasToken = useAuthToken();
  const { data, isLoading } = useSWR(
    hasToken ? "/admin/dashboard/top-delivery-partners" : null,
    () => fetchAdminDeliveryAnalytics({ limit: 5 }),
    { revalidateOnFocus: false, refreshInterval: 60000 }
  );

  const riders = data?.top_riders || [];

  return (
    <section className="bg-white border border-border rounded-2xl p-5 sm:p-6 shadow-[var(--shadow-admin-soft)] hover:shadow-[var(--shadow-admin-lifted)] transition-shadow duration-200">
      <h2 className="text-lg font-black text-foreground mb-4 flex items-center gap-2">
        <Award className="w-4 h-4 text-primary" /> Top Delivery Partners
      </h2>
      {isLoading ? (
        <PanelSkeleton rows={4} />
      ) : riders.length === 0 ? (
        <p className="text-sm text-gray-text">No delivery performance data yet.</p>
      ) : (
        <div className="space-y-2">
          {riders.slice(0, 5).map((r, i) => (
            <div key={r.id} className="flex items-center justify-between gap-2 rounded-xl border border-border bg-section px-3 py-2.5">
              <div className="flex items-center gap-3 min-w-0">
                <span className="w-6 h-6 rounded-lg bg-primary/10 text-primary text-xs font-black flex items-center justify-center shrink-0">
                  {i + 1}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-foreground truncate">{r.full_name}</p>
                  <p className="text-[11px] text-gray-text capitalize">
                    {r.vehicle_type || "bike"} · {r.completed_orders} deliveries
                  </p>
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-black text-foreground">{formatCurrency(r.total_earnings)}</p>
                <p className="text-[11px] font-bold text-gray-text inline-flex items-center gap-0.5">
                  <Star className="w-3 h-3 text-yellow-500" /> {Number(r.rating || 0).toFixed(1)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
