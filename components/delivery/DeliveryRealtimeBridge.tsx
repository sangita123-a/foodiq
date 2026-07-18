"use client";

import { useAssignedOrders } from "@/hooks/useDeliveryData";
import { useLiveLocationPublisher } from "@/hooks/useLiveLocationPublisher";
import { useDeliveryMe } from "@/hooks/useDeliveryData";

/**
 * Mount once in delivery shell — streams GPS while partner is online.
 */
export default function DeliveryRealtimeBridge() {
  const { data: me } = useDeliveryMe();
  const { data: assigned } = useAssignedOrders();
  const online = Boolean(me?.partner?.is_available);
  const activeOrderId =
    assigned?.find((o) =>
      ["accepted", "assigned", "reached_restaurant", "picked_up", "on_the_way"].includes(
        String(o.assignment_status || o.order_status || "").toLowerCase()
      )
    )?.id || null;

  useLiveLocationPublisher({
    enabled: online,
    orderId: activeOrderId,
    intervalMs: 4000,
  });

  return null;
}
