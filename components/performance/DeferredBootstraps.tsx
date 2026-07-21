"use client";

import { useEffect, useState, type ReactNode } from "react";
import { scheduleIdleWork } from "@/lib/performance/media";
import AuthBootstrap from "@/components/AuthBootstrap";
import PushNotificationProvider from "@/components/notifications/PushNotificationProvider";

/** Runs auth refresh after idle so first interactions stay responsive. */
export function DeferredAuthBootstrap() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    return scheduleIdleWork(() => setReady(true), 2500);
  }, []);

  if (!ready) return null;
  return <AuthBootstrap />;
}

/** Defers push SDK registration until after idle. */
export function DeferredPushNotificationProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    return scheduleIdleWork(() => setReady(true), 3500);
  }, []);

  if (!ready) return <>{children}</>;
  return <PushNotificationProvider>{children}</PushNotificationProvider>;
}
