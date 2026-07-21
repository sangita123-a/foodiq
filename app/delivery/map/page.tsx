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
          <h2 className="text-lg font-black text-foreground">Active Routes</h2>
          {(assigned || []).map((order) => (
            <button
              key={order.id}
              type="button"
              onClick={() => setSelectedId(order.id)}
              className={`w-full text-left border rounded-xl p-4 transition-colors ${
                activeId === order.id
                  ? "border-primary bg-primary/5"
                  : "border-border bg-white hover:bg-section"
              }`}
            >
              <p className="font-bold text-foreground">{order.restaurant.name}</p>
              <p className="text-xs text-gray-text mt-1 line-clamp-2">
                {order.customer.address}
              </p>
              <Link
                href={`/delivery/orders/${order.id}`}
                className="inline-block mt-2 text-xs font-bold text-primary"
                onClick={(e) => e.stopPropagation()}
              >
                Order details
              </Link>
            </button>
          ))}
          {!assigned?.length && (
            <p className="text-sm text-gray-text bg-white border border-border rounded-xl p-6 text-center">
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
