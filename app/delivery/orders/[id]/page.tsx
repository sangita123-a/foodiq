"use client";

import { use } from "react";
import Link from "next/link";
import { mutate } from "swr";
import DeliveryShell from "@/components/delivery/DeliveryShell";
import DeliveryMap from "@/components/delivery/DeliveryMap";
import {
  useDeliveryDashboard,
  useDeliveryOrder,
  useDeliveryRoute,
} from "@/hooks/useDeliveryData";
import {
  acceptDeliveryOrder,
  rejectDeliveryOrder,
  updateDeliveryStatus,
  formatCurrency,
  STATUS_LABELS,
  NEXT_STATUS,
} from "@/services/deliveryApi";

export default function DeliveryOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: dashboard } = useDeliveryDashboard();
  const { data: order, error, isLoading } = useDeliveryOrder(id);
  const { data: route } = useDeliveryRoute(id);

  const refresh = () => {
    mutate(`/api/delivery/orders/${id}`);
    mutate(`/api/delivery/orders/${id}/route`);
    mutate("/api/delivery/dashboard");
    mutate("/api/delivery/orders/assigned");
    mutate("/api/delivery/orders/available");
    mutate("/api/delivery/earnings");
  };

  const status = order?.assignment_status || "";
  const next = NEXT_STATUS[status];

  return (
    <DeliveryShell title="Order Details" online={dashboard?.is_online}>
      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Unable to load this order.
        </div>
      )}
      {isLoading && !order && (
        <p className="text-sm text-[#6B7280]">Loading order...</p>
      )}

      {order && (
        <div className="space-y-6">
          <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5">
            <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
              <div>
                <p className="text-xs font-bold text-[#9CA3AF] uppercase tracking-widest">
                  Order #{order.id.slice(0, 8)}
                </p>
                <h2 className="text-2xl font-black text-[#111827] mt-1">
                  {order.restaurant.name}
                </h2>
                <p className="text-sm text-[#6B7280] mt-1">{order.restaurant.address}</p>
              </div>
              <span className="text-sm font-bold px-3 py-1.5 rounded-xl bg-[#E23744]/10 text-[#E23744]">
                {STATUS_LABELS[status] || status || "Unassigned"}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="rounded-xl bg-[#F8FAFC] border border-[#E5E7EB] p-4">
                <p className="text-xs font-bold uppercase tracking-widest text-[#9CA3AF] mb-2">
                  Pickup
                </p>
                <p className="font-bold text-[#111827]">{order.restaurant.name}</p>
                <p className="text-sm text-[#6B7280] mt-1">{order.restaurant.address}</p>
                {order.restaurant.phone && (
                  <p className="text-sm text-[#6B7280] mt-1">{order.restaurant.phone}</p>
                )}
              </div>
              <div className="rounded-xl bg-[#F8FAFC] border border-[#E5E7EB] p-4">
                <p className="text-xs font-bold uppercase tracking-widest text-[#9CA3AF] mb-2">
                  Drop-off
                </p>
                <p className="font-bold text-[#111827]">{order.customer.name}</p>
                <p className="text-sm text-[#6B7280] mt-1">{order.customer.address}</p>
                {order.customer.phone && (
                  <p className="text-sm text-[#6B7280] mt-1">{order.customer.phone}</p>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-4 text-sm mb-4">
              <span className="font-bold text-[#111827]">
                Order {formatCurrency(order.total_amount)}
              </span>
              <span className="font-bold text-[#E23744]">
                Fee {formatCurrency(order.delivery_fee)}
              </span>
              {order.delivery_instructions && (
                <span className="text-[#6B7280]">
                  Note: {order.delivery_instructions}
                </span>
              )}
            </div>

            {!!order.items?.length && (
              <div className="border-t border-[#E5E7EB] pt-4 mb-4">
                <p className="text-sm font-bold text-[#111827] mb-2">Items</p>
                <ul className="space-y-1">
                  {order.items.map((item, idx) => (
                    <li key={`${item.name}-${idx}`} className="text-sm text-[#6B7280]">
                      {item.quantity}× {item.name}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              {(status === "offered" || !status) && (
                <>
                  <button
                    type="button"
                    onClick={async () => {
                      await acceptDeliveryOrder(order.id);
                      refresh();
                    }}
                    className="bg-[#E23744] hover:bg-[#C81E34] text-white font-bold px-4 py-2.5 rounded-xl"
                  >
                    Accept Order
                  </button>
                  {status === "offered" && (
                    <button
                      type="button"
                      onClick={async () => {
                        await rejectDeliveryOrder(order.id);
                        refresh();
                      }}
                      className="border border-[#E5E7EB] text-[#6B7280] font-bold px-4 py-2.5 rounded-xl"
                    >
                      Reject
                    </button>
                  )}
                </>
              )}
              {next && status !== "offered" && (
                <button
                  type="button"
                  onClick={async () => {
                    await updateDeliveryStatus(order.id, next);
                    refresh();
                  }}
                  className="bg-[#E23744] hover:bg-[#C81E34] text-white font-bold px-4 py-2.5 rounded-xl"
                >
                  Mark: {STATUS_LABELS[next]}
                </button>
              )}
              <Link
                href="/delivery/map"
                className="border border-[#E23744]/30 text-[#E23744] font-bold px-4 py-2.5 rounded-xl"
              >
                Open Map
              </Link>
            </div>
          </div>

          <DeliveryMap
            embedUrl={route?.osm_embed_url}
            directionsUrl={route?.osm_directions_url}
            distanceKm={route?.distance_km}
            durationMin={route?.duration_min}
            restaurantName={order.restaurant.name}
            customerAddress={order.customer.address}
          />
        </div>
      )}
    </DeliveryShell>
  );
}
