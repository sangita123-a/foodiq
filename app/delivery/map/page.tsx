"use client";

import Link from "next/link";
import DeliveryShell from "@/components/delivery/DeliveryShell";
import DeliveryMap from "@/components/delivery/DeliveryMap";
import {
  useAssignedOrders,
  useDeliveryDashboard,
  useDeliveryRoute,
} from "@/hooks/useDeliveryData";
import { useState } from "react";

export default function DeliveryMapPage() {
  const { data: dashboard } = useDeliveryDashboard();
  const { data: assigned } = useAssignedOrders();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const activeId = selectedId || assigned?.[0]?.id || null;
  const { data: route } = useDeliveryRoute(activeId);
  const activeOrder = assigned?.find((o) => o.id === activeId) || assigned?.[0];

  return (
    <DeliveryShell title="Navigation" online={dashboard?.is_online}>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-3">
          <h2 className="text-lg font-black text-[#111827]">Active Routes</h2>
          {(assigned || []).map((order) => (
            <button
              key={order.id}
              type="button"
              onClick={() => setSelectedId(order.id)}
              className={`w-full text-left border rounded-xl p-4 transition-colors ${
                activeId === order.id
                  ? "border-[#E23744] bg-[#E23744]/5"
                  : "border-[#E5E7EB] bg-white hover:bg-[#F8FAFC]"
              }`}
            >
              <p className="font-bold text-[#111827]">{order.restaurant.name}</p>
              <p className="text-xs text-[#6B7280] mt-1 line-clamp-2">
                {order.customer.address}
              </p>
              <Link
                href={`/delivery/orders/${order.id}`}
                className="inline-block mt-2 text-xs font-bold text-[#E23744]"
                onClick={(e) => e.stopPropagation()}
              >
                Order details
              </Link>
            </button>
          ))}
          {!assigned?.length && (
            <p className="text-sm text-[#6B7280] bg-white border border-[#E5E7EB] rounded-xl p-6 text-center">
              Accept an order to see navigation.
            </p>
          )}
        </div>

        <div className="lg:col-span-2">
          <DeliveryMap
            embedUrl={route?.osm_embed_url}
            directionsUrl={route?.osm_directions_url}
            distanceKm={route?.distance_km}
            durationMin={route?.duration_min}
            restaurantName={activeOrder?.restaurant.name}
            customerAddress={activeOrder?.customer.address}
          />
        </div>
      </div>
    </DeliveryShell>
  );
}
