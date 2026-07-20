"use client";

import { useState } from "react";
import Link from "next/link";
import DeliveryShell from "@/components/delivery/DeliveryShell";
import { useDeliveryDashboard } from "@/hooks/useDeliveryData";
import useSWR from "swr";
import { useAuthToken } from "@/hooks/useAuthToken";
import {
  deliveryFetcher,
  formatCurrency,
  formatRelativeTime,
  STATUS_LABELS,
  type DeliveryHistoryItem,
} from "@/services/deliveryApi";
import { Star } from "lucide-react";

export default function DeliveryHistoryPage() {
  const { data: dashboard } = useDeliveryDashboard();
  const hasToken = useAuthToken();
  const [tab, setTab] = useState<"all" | "completed" | "cancelled">("all");
  const path = `/api/delivery/history?status=${tab}`;
  const { data, error, isLoading } = useSWR<DeliveryHistoryItem[]>(
    hasToken ? path : null,
    deliveryFetcher
  );

  const tabs = [
    { id: "all" as const, label: "All" },
    { id: "completed" as const, label: "Completed" },
    { id: "cancelled" as const, label: "Cancelled" },
  ];

  return (
    <DeliveryShell title="Delivery History" online={dashboard?.is_online}>
      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Unable to load delivery history.
        </div>
      )}

      <div className="flex gap-2 mb-6">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-xl text-sm font-bold ${
              tab === t.id
                ? "bg-[#E23744] text-white"
                : "bg-white border border-[#E5E7EB] text-[#6B7280]"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <section className="bg-white border border-[#E5E7EB] rounded-2xl overflow-hidden">
        {isLoading && !data && (
          <p className="p-6 text-sm text-[#6B7280]">Loading history...</p>
        )}
        <div className="divide-y divide-[#F3F4F6]">
          {(data || []).map((row) => (
            <div key={row.id} className="px-5 py-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <Link
                    href={`/delivery/orders/${row.order_id}`}
                    className="font-bold text-[#111827] hover:text-[#E23744]"
                  >
                    {row.restaurant_name}
                  </Link>
                  <p className="text-xs text-[#6B7280] mt-1">
                    {row.customer_name} · {row.customer_address || "Delivery address"}
                  </p>
                  <p className="text-xs text-[#9CA3AF] mt-1">
                    {formatRelativeTime(row.updated_at)} · Fee{" "}
                    {formatCurrency(Number(row.delivery_fee))}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold px-2 py-1 rounded-lg bg-[#F8FAFC] text-[#6B7280]">
                    {STATUS_LABELS[row.status] || row.status}
                  </span>
                  {row.customer_rating != null && (
                    <p className="text-xs font-bold text-amber-600 mt-2 flex items-center justify-end gap-1">
                      <Star className="w-3 h-3 fill-current" />
                      {Number(row.customer_rating).toFixed(1)}
                    </p>
                  )}
                </div>
              </div>
              {row.customer_comment && (
                <p className="text-sm text-[#6B7280] mt-2 italic">&ldquo;{row.customer_comment}&rdquo;</p>
              )}
            </div>
          ))}
          {!data?.length && !isLoading && (
            <p className="p-8 text-sm text-[#6B7280] text-center">No deliveries in this category.</p>
          )}
        </div>
      </section>
    </DeliveryShell>
  );
}
