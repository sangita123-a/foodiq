"use client";

import { useEffect, useRef } from "react";
import { AnalyticsEvents, trackEvent } from "@/lib/analytics/events";

type Props = {
  type: "restaurant" | "menu_item";
  id?: string | null;
  name?: string | null;
  restaurantId?: string | null;
  price?: number | null;
  ready: boolean;
};

/**
 * Fires view_restaurant / view_item once when data is ready. No UI.
 */
export default function CatalogViewTracker({
  type,
  id,
  name,
  restaurantId,
  price,
  ready,
}: Props) {
  const keyRef = useRef<string>("");

  useEffect(() => {
    if (!ready || !id) return;
    const key = `${type}:${id}`;
    if (keyRef.current === key) return;
    keyRef.current = key;

    if (type === "restaurant") {
      trackEvent(AnalyticsEvents.viewRestaurant, {
        restaurant_id: id,
        restaurant_name: name || undefined,
      });
    } else {
      trackEvent(AnalyticsEvents.viewItem, {
        item_id: id,
        item_name: name || undefined,
        restaurant_id: restaurantId || undefined,
        price: price ?? undefined,
      });
    }
  }, [ready, type, id, name, restaurantId, price]);

  return null;
}
