"use client";

import { use } from "react";
import Link from "next/link";
import { mutate } from "swr";
import { Phone, Navigation } from "lucide-react";
import DeliveryShell from "@/components/delivery/DeliveryShell";
import DeliveryMap from "@/components/delivery/DeliveryMap";
import OrderExpiryCountdown from "@/components/delivery/OrderExpiryCountdown";
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
    mutate("/api/delivery/wallet");
    mutate("/api/delivery/history");
  };

  const status = order?.assignment_status || "";
  const next = NEXT_STATUS[status];
  const navUrl =
    status === "accepted" || status === "reached_restaurant" || status === "assigned"
      ? route?.google_maps_pickup_url || route?.google_maps_url
      : route?.google_maps_dropoff_url || route?.google_maps_url;

  return (
    <DeliveryShell title="Active Delivery" online={dashboard?.is_online}>
      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Unable to load this order.
        </div>
      )}
      {isLoading && !order && (
        <p className="text-sm text-gray-text">Loading order...</p>
      )}

      {order && (
        <div className="space-y-6">
          <div className="bg-white border border-border rounded-2xl p-5">
            <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
              <div>
                <p className="text-xs font-bold text-[#9CA3AF] uppercase tracking-widest">
                  Order #{order.id.slice(0, 8)}
                </p>
                <h2 className="text-2xl font-black text-foreground mt-1">
                  {order.restaurant.name}
                </h2>
                <p className="text-sm text-gray-text mt-1">{order.restaurant.address}</p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className="text-sm font-bold px-3 py-1.5 rounded-xl bg-primary/10 text-primary">
                  {STATUS_LABELS[status] || status || "Unassigned"}
                </span>
                {status === "offered" && (
                  <OrderExpiryCountdown expiresAt={order.expires_at} onExpired={refresh} />
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="rounded-xl bg-section border border-border p-4">
                <p className="text-xs font-bold uppercase tracking-widest text-[#9CA3AF] mb-2">
                  Restaurant
                </p>
                <p className="font-bold text-foreground">{order.restaurant.name}</p>
                <p className="text-sm text-gray-text mt-1">{order.restaurant.address}</p>
                {order.restaurant.phone && (
                  <a
                    href={`tel:${order.restaurant.phone}`}
                    className="inline-flex items-center gap-1 text-sm font-bold text-primary mt-2"
                  >
                    <Phone className="w-4 h-4" />
                    Call Restaurant
                  </a>
                )}
              </div>
              <div className="rounded-xl bg-section border border-border p-4">
                <p className="text-xs font-bold uppercase tracking-widest text-[#9CA3AF] mb-2">
                  Customer
                </p>
                <p className="font-bold text-foreground">{order.customer.name}</p>
                <p className="text-sm text-gray-text mt-1">{order.customer.address}</p>
                {order.customer.phone && (
                  <a
                    href={`tel:${order.customer.phone}`}
                    className="inline-flex items-center gap-1 text-sm font-bold text-primary mt-2"
                  >
                    <Phone className="w-4 h-4" />
                    Call Customer
                  </a>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-4 text-sm mb-4">
              <span className="font-bold text-foreground">
                Order {formatCurrency(order.total_amount)}
              </span>
              <span className="font-bold text-primary">
                Fee {formatCurrency(order.delivery_fee)}
              </span>
              {order.delivery_instructions && (
                <span className="text-gray-text">
                  Note: {order.delivery_instructions}
                </span>
              )}
            </div>

            {!!order.items?.length && (
              <div className="border-t border-border pt-4 mb-4">
                <p className="text-sm font-bold text-foreground mb-2">Items</p>
                <ul className="space-y-1">
                  {order.items.map((item, idx) => (
                    <li key={`${item.name}-${idx}`} className="text-sm text-gray-text">
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
                    className="bg-primary hover:bg-primary-hover text-white font-bold px-4 py-2.5 rounded-xl"
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
                      className="border border-border text-gray-text font-bold px-4 py-2.5 rounded-xl"
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
                  className="bg-primary hover:bg-primary-hover text-white font-bold px-4 py-2.5 rounded-xl"
                >
                  Mark: {STATUS_LABELS[next]}
                </button>
              )}
              {navUrl && (
                <a
                  href={navUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 border border-primary/30 text-primary font-bold px-4 py-2.5 rounded-xl"
                >
                  <Navigation className="w-4 h-4" />
                  Google Maps
                </a>
              )}
              <Link
                href="/delivery/map"
                className="border border-border text-gray-text font-bold px-4 py-2.5 rounded-xl"
              >
                Open Map
              </Link>
            </div>
          </div>

          <DeliveryMap
            embedUrl={route?.osm_embed_url}
            directionsUrl={route?.google_maps_url || route?.osm_directions_url}
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
