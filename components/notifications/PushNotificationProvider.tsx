"use client";

import { useEffect, useState } from "react";
import { useAuthToken } from "@/hooks/useAuthToken";
import RealtimeBridge from "./RealtimeBridge";

/**
 * Defers Socket.IO + FCM until after idle so customer pages stay light.
 * Children render immediately; realtime mounts only when authenticated.
 */
export default function PushNotificationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const hasToken = useAuthToken();
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
