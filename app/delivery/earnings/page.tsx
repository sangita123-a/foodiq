"use client";

import DeliveryShell from "@/components/delivery/DeliveryShell";
import { useDeliveryDashboard, useDeliveryEarnings } from "@/hooks/useDeliveryData";
import { formatCurrency, formatRelativeTime } from "@/services/deliveryApi";

export default function DeliveryEarningsPage() {
  const { data: dashboard } = useDeliveryDashboard();
  const { data, error, isLoading } = useDeliveryEarnings();
  const summary = data?.summary;

  const cards = [
    { label: "Today", value: formatCurrency(summary?.daily || 0) },
    { label: "This Week", value: formatCurrency(summary?.weekly || 0) },
    { label: "This Month", value: formatCurrency(summary?.monthly || 0) },
    { label: "Total Earnings", value: formatCurrency(summary?.total || 0) },
  ];

  return (
    <DeliveryShell title="Earnings" online={dashboard?.is_online}>
      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Unable to load earnings.
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cards.map((card) => (
          <div key={card.label} className="bg-white border border-border rounded-2xl p-5">
            <p className="text-xs font-bold uppercase tracking-widest text-[#9CA3AF] mb-2">
              {card.label}
            </p>
            <p className="text-2xl font-black text-foreground">{card.value}</p>
          </div>
        ))}
      </div>

      <section className="bg-white border border-border rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h2 className="text-lg font-black text-foreground">Delivery History</h2>
        </div>
        {isLoading && !data && (
          <p className="p-6 text-sm text-gray-text">Loading history...</p>
        )}
        <div className="divide-y divide-[#F3F4F6]">
          {(data?.history || []).map((row) => (
            <div
              key={row.id}
              className="px-5 py-4 flex flex-wrap items-center justify-between gap-3"
            >
              <div>
                <p className="font-bold text-foreground">
                  {row.restaurant_name || `Order #${row.order_id.slice(0, 8)}`}
                </p>
                <p className="text-xs text-gray-text mt-1">
                  {row.note || "Delivery fee"} · {formatRelativeTime(row.earned_at)}
                </p>
              </div>
              <div className="text-right">
                <p className="font-black text-foreground">{formatCurrency(Number(row.amount))}</p>
                {Number(row.incentive) > 0 && (
                  <p className="text-xs font-bold text-emerald-600">
                    +{formatCurrency(Number(row.incentive))} incentive
                  </p>
                )}
              </div>
            </div>
          ))}
          {!data?.history?.length && !isLoading && (
            <p className="p-8 text-sm text-gray-text text-center">
              Complete deliveries to see earnings here.
            </p>
          )}
        </div>
      </section>
    </DeliveryShell>
  );
}
