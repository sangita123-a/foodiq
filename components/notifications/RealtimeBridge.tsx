"use client";

import { useEffect, useState } from "react";
import { mutate } from "swr";
import {
  listenForegroundMessages,
  registerPushDevice,
} from "@/lib/firebaseMessaging";
import { useSocket } from "@/hooks/useSocket";
import { SOCKET_EVENTS } from "@/lib/socketEvents";
import { useToast } from "@/contexts/ToastContext";

/**
 * Socket + FCM bridge — loaded only after idle when the user is authenticated.
 */
export default function RealtimeBridge() {
  const { socket, connected } = useSocket();
  const { showToast } = useToast();
  const [registered, setRegistered] = useState(false);

  useEffect(() => {
    if (registered) return;
    let cancelled = false;

    (async () => {
      if (typeof Notification !== "undefined" && Notification.permission === "granted") {
        const result = await registerPushDevice();
        if (!cancelled && result.ok) setRegistered(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [registered]);

  useEffect(() => {
    let unsub: (() => void) | void;

    listenForegroundMessages((payload) => {
      const title = payload.title || "Foodiq";
      const body = payload.body || "";
      showToast(`${title}: ${body}`, "success");
      mutate("/api/notifications");
      mutate("/api/notifications/unread-count");
      mutate("/api/partner/notifications");
      mutate("/api/delivery/notifications");
    }).then((u) => {
      unsub = u;
    });

    return () => {
      if (typeof unsub === "function") unsub();
    };
  }, [showToast]);

  useEffect(() => {
    if (!socket || !connected) return;
    const onNotif = () => {
      mutate("/api/notifications");
      mutate("/api/notifications/unread-count");
      mutate("/api/partner/notifications");
      mutate("/api/delivery/notifications");
    };
    socket.on(SOCKET_EVENTS.NOTIFICATION, onNotif);
    socket.on(SOCKET_EVENTS.ORDER_STATUS, onNotif);
    socket.on(SOCKET_EVENTS.PAYMENT_COMPLETED, onNotif);
    return () => {
      socket.off(SOCKET_EVENTS.NOTIFICATION, onNotif);
      socket.off(SOCKET_EVENTS.ORDER_STATUS, onNotif);
      socket.off(SOCKET_EVENTS.PAYMENT_COMPLETED, onNotif);
    };
  }, [socket, connected]);

  return null;
}
