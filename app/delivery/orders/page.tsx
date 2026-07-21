"use client";

import Link from "next/link";
import { mutate } from "swr";
import DeliveryShell from "@/components/delivery/DeliveryShell";
import { useAssignedOrders, useAvailableOrders, useDeliveryDashboard } from "@/hooks/useDeliveryData";
import {
  acceptDeliveryOrder,
  rejectDeliveryOrder,
  formatCurrency,
  STATUS_LABELS,
} from "@/services/deliveryApi";

export default function DeliveryOrdersPage() {
  const { data: dashboard } = useDeliveryDashboard();
  const { data: assigned } = useAssignedOrders();
  const { data: available } = useAvailableOrders();

  const refresh = () => {
    mutate("/api/delivery/dashboard");
    mutate("/api/delivery/orders/available");
    mutate("/api/delivery/orders/assigned");
  };

  return (
    <DeliveryShell title="Orders" online={dashboard?.is_online}>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="bg-white border border-border rounded-2xl p-5">
          <h2 className="text-lg font-black text-foreground mb-4">My Assignments</h2>
          <div className="space-y-3">
            {(assigned || []).map((order) => (
              <Link
                key={order.id}
                href={`/delivery/orders/${order.id}`}
                className="block border border-border rounded-xl p-4 hover:bg-section"
              >
                <div className="flex justify-between gap-3">
                  <div>
                    <p className="font-bold text-foreground">{order.restaurant.name}</p>
                    <p className="text-xs text-gray-text mt-1">{order.customer.address}</p>
                    <p className="text-xs text-[#9CA3AF] mt-2">
                      #{order.id.slice(0, 8)} · {formatCurrency(order.delivery_fee)} fee
                    </p>
                  </div>
                  <span className="text-xs font-bold h-fit px-2 py-1 rounded-lg bg-primary/10 text-primary">
                    {STATUS_LABELS[order.assignment_status || ""] || order.assignment_status}
                  </span>
                </div>
              </Link>
            ))}
            {!assigned?.length && (
              <p className="text-sm text-gray-text text-center py-8">No active assignments</p>
            )}
          </div>
        </section>

        <section className="bg-white border border-border rounded-2xl p-5">
          <h2 className="text-lg font-black text-foreground mb-4">Available Orders</h2>
          <div className="space-y-3">
            {(available || []).map((order) => (
              <div key={order.id} className="border border-border rounded-xl p-4">
                <p className="font-bold text-foreground">{order.restaurant.name}</p>
                <p className="text-xs text-gray-text mt-1">{order.restaurant.address}</p>
                <p className="text-xs text-[#9CA3AF] mt-2">
                  Drop: {order.customer.address || "—"}
                </p>
                <div className="flex gap-2 mt-4">
                  <button
                    type="button"
                    onClick={async () => {
                      await acceptDeliveryOrder(order.id);
                      refresh();
                    }}
                    className="flex-1 bg-primary text-white text-sm font-bold py-2 rounded-lg"
                  >
                    Accept
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      await rejectDeliveryOrder(order.id);
                      refresh();
                    }}
                    className="flex-1 border border-border text-gray-text text-sm font-bold py-2 rounded-lg"
                  >
                    Reject
                  </button>
                  <Link
                    href={`/delivery/orders/${order.id}`}
                    className="px-3 py-2 text-sm font-bold text-primary border border-primary/30 rounded-lg"
                  >
                    View
                  </Link>
                </div>
              </div>
            ))}
            {!available?.length && (
              <p className="text-sm text-gray-text text-center py-8">
                No available orders nearby
              </p>
            )}
          </div>
        </section>
      </div>
    </DeliveryShell>
  );
}
