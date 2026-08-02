"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Bell, X } from "lucide-react";
import { mutate as globalMutate } from "swr";
import { useAuthToken } from "@/hooks/useAuthToken";
import { useSocket } from "@/hooks/useSocket";
import { useDeliveryNotifications } from "@/hooks/useDeliveryData";
import { SOCKET_EVENTS } from "@/lib/socketEvents";
import { playNotificationSound } from "@/lib/notificationSound";
import { getNotificationMeta } from "@/lib/deliveryNotificationTypes";
import type { DeliveryNotificationItem } from "@/services/deliveryApi";
import DeliveryNotificationDrawer from "@/components/delivery/DeliveryNotificationDrawer";

/**
 * Delivery-partner notification bell: unread badge, dropdown drawer, and a
 * live popup + chime whenever the server pushes `delivery:notification`.
 */
export default function NotificationBell() {
  const hasToken = useAuthToken();
  const { socket, connected } = useSocket();
  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState<DeliveryNotificationItem | null>(null);
  const { data } = useDeliveryNotifications({ limit: 1 });
  const unread = data?.unread_count || 0;

  useEffect(() => {
    if (!socket || !connected) return;
    const onNew = (notification: DeliveryNotificationItem) => {
      setToast(notification);
      playNotificationSound();
      globalMutate(
        (key) => typeof key === "string" && key.startsWith("/api/delivery/notifications"),
        undefined,
        { revalidate: true }
      );
    };
    socket.on(SOCKET_EVENTS.DELIVERY_NOTIFICATION, onNew);
    return () => {
      socket.off(SOCKET_EVENTS.DELIVERY_NOTIFICATION, onNew);
    };
  }, [socket, connected]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 6000);
    return () => clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  if (!hasToken) return null;

  const toastMeta = toast ? getNotificationMeta(toast.type) : null;
  const ToastIcon = toastMeta?.icon;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative h-10 w-10 rounded-xl border border-border bg-white hover:border-primary/30 hover:bg-section text-foreground flex items-center justify-center transition-all"
        aria-label="Notifications"
        aria-expanded={open}
      >
        <Bell className="w-4 h-4" />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 bg-[var(--color-primary)] text-white text-[10px] font-bold min-w-[18px] h-[18px] flex items-center justify-center rounded-full px-1">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      <DeliveryNotificationDrawer open={open} onClose={() => setOpen(false)} />

      <AnimatePresence>
        {toast && ToastIcon && (
          <motion.div
            initial={{ opacity: 0, y: -12, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: -12, x: "-50%" }}
            className="fixed left-1/2 top-4 z-[100] w-[min(92vw,380px)] bg-white border border-border rounded-2xl shadow-[0_20px_50px_rgba(28,28,28,0.2)] overflow-hidden"
          >
            <div className="flex items-start gap-3 p-4">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${toastMeta?.color}`}>
                <ToastIcon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-black text-foreground truncate">{toast.title}</p>
                <p className="text-xs text-gray-text mt-0.5 line-clamp-2">{toast.message}</p>
              </div>
              <button
                type="button"
                onClick={() => setToast(null)}
                className="p-1 text-[#9CA3AF] hover:text-foreground shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
