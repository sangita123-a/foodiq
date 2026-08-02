"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useAuthToken } from "@/hooks/useAuthToken";
import RealtimeBridge from "./RealtimeBridge";

/**
 * Defers Socket.IO + FCM until after idle so customer pages stay light.
 * Children render immediately; realtime mounts only when authenticated.
 *
 * Delivery partners authenticate against a separate `delivery_partners`
 * table/JWT (not `users`), so the customer-scoped push-config endpoint this
 * bridge depends on always 401s there. That 401 used to trip the global
 * axios interceptor's "session expired" handler and force-navigate a
 * perfectly valid delivery session to /delivery/login. Delivery already has
 * its own realtime + notification stack (DeliveryRealtimeBridge /
 * NotificationBell), so this bridge is skipped there entirely.
 */
export default function PushNotificationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isDeliveryRoute = Boolean(pathname?.startsWith("/delivery"));
  const hasToken = useAuthToken() && !isDeliveryRoute;
  const [mountRealtime, setMountRealtime] = useState(false);

  useEffect(() => {
    if (!hasToken) {
      setMountRealtime(false);
      return;
    }

    let idleId: number | undefined;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    const enable = () => setMountRealtime(true);

    if (typeof window !== "undefined" && "requestIdleCallback" in window) {
      idleId = window.requestIdleCallback(enable, { timeout: 4000 });
    } else {
      timeoutId = setTimeout(enable, 2000);
    }

    return () => {
      if (idleId != null && typeof window !== "undefined" && "cancelIdleCallback" in window) {
        window.cancelIdleCallback(idleId);
      }
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [hasToken]);

  return (
    <>
      {children}
      {hasToken && mountRealtime ? <RealtimeBridge /> : null}
    </>
  );
}
