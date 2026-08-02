"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCheck, Trash2, X } from "lucide-react";
import { useDeliveryNotifications } from "@/hooks/useDeliveryData";
import {
  deleteDeliveryNotification,
  formatRelativeTime,
  markAllDeliveryNotificationsRead,
  markDeliveryNotificationRead,
} from "@/services/deliveryApi";
import { getNotificationMeta } from "@/lib/deliveryNotificationTypes";

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function DeliveryNotificationDrawer({ open, onClose }: Props) {
  const { data, mutate } = useDeliveryNotifications({ limit: 10 });
  const notifications = data?.notifications || [];

  const handleMarkRead = async (id: string, isRead: boolean) => {
    if (isRead) return;
    try {
      await markDeliveryNotificationRead(id);
      mutate();
    } catch {
      /* ignore */
    }
  };

  const handleMarkAll = async () => {
    try {
      await markAllDeliveryNotificationsRead();
      mutate();
    } catch {
      /* ignore */
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDeliveryNotification(id);
      mutate();
    } catch {
      /* ignore */
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 cursor-default"
            aria-label="Close notifications"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            className="absolute right-0 top-full mt-2 z-50 w-[min(100vw-2rem,400px)] bg-white border border-border rounded-2xl shadow-[0_20px_50px_rgba(28,28,28,0.15)] overflow-hidden"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <p className="font-black text-foreground">Notifications</p>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handleMarkAll}
                  className="p-1.5 rounded-lg text-gray-text hover:bg-section"
                  title="Mark all read"
                >
                  <CheckCheck className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="p-1.5 rounded-lg text-gray-text hover:bg-section"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
              {notifications.length === 0 && (
                <p className="text-sm text-gray-text px-4 py-8 text-center">
                  No notifications yet. Order and wallet alerts will appear here.
                </p>
              )}
              {notifications.map((n) => {
                const meta = getNotificationMeta(n.type);
                const Icon = meta.icon;
                return (
                  <div
                    key={n.id}
                    className={`px-4 py-3 border-b border-[#F3F4F6] hover:bg-section ${
                      !n.is_read ? "bg-primary/5" : ""
                    }`}
                  >
                    <div className="flex gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${meta.color}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleMarkRead(n.id, n.is_read)}
                        className="flex-1 min-w-0 text-left"
                      >
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold text-foreground truncate">{n.title}</p>
                          {!n.is_read && <span className="w-2 h-2 rounded-full bg-primary shrink-0" />}
                        </div>
                        <p className="text-xs text-gray-text line-clamp-2 mt-0.5">{n.message}</p>
                        <p className="text-[10px] text-[#9CA3AF] mt-1">{formatRelativeTime(n.created_at)}</p>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(n.id)}
                        className="p-1 text-[#9CA3AF] hover:text-red-500 self-start"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="px-4 py-3 border-t border-border">
              <Link
                href="/delivery/notifications"
                onClick={onClose}
                className="text-sm font-bold text-foreground text-center py-2 rounded-xl bg-section hover:bg-primary/10 block"
              >
                View all
              </Link>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
