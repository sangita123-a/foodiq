"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import useSWR, { mutate } from "swr";
import { Bell, CheckCheck, Trash2, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import api from "@/services/api";
import { useAuthToken } from "@/hooks/useAuthToken";
import { cleanNotificationMessage, mapTypeToCategory } from "@/lib/notificationTypes";
import { enablePushNotifications } from "@/lib/pushNotifications";

type Notif = {
  id: string;
  title: string;
  message: string;
  type?: string;
  category?: string;
  is_read: boolean;
  created_at: string;
  meta?: { link?: string };
  order_id?: string;
};

type Props = {
  /** Override list endpoint (partner/delivery) */
  endpoint?: string;
  inboxHref?: string;
};

export default function NotificationBell({
  endpoint = "/api/notifications",
  inboxHref = "/notifications",
}: Props) {
  const hasToken = useAuthToken();
  const [open, setOpen] = useState(false);
  const { data, mutate: mutateList } = useSWR(hasToken ? endpoint : null, {
    refreshInterval: 60000,
  });

  const items: Notif[] = useMemo(() => {
    if (Array.isArray(data)) return data;
    if (data?.notifications) return data.notifications;
    if (data?.items) return data.items;
    return [];
  }, [data]);

  const unread = items.filter((n) => !n.is_read).length;
  const preview = items.slice(0, 8);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const markRead = async (id: string) => {
    if (String(id).startsWith("low-stock-")) return;
    try {
      await api.put(`/api/notifications/${id}/read`);
      mutateList();
      mutate("/api/notifications/unread-count");
    } catch {
      /* ignore */
    }
  };

  const markAll = async () => {
    try {
      await api.put("/api/notifications/read-all");
      mutateList();
      mutate("/api/notifications/unread-count");
    } catch {
      /* ignore */
    }
  };

  const remove = async (id: string) => {
    if (String(id).startsWith("low-stock-")) return;
    try {
      await api.delete(`/api/notifications/${id}`);
      mutateList();
    } catch {
      /* ignore */
    }
  };

  const enablePush = async () => {
    await enablePushNotifications();
  };

  if (!hasToken) return null;

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

      <AnimatePresence>
        {open && (
          <>
            <button
              type="button"
              className="fixed inset-0 z-40 cursor-default"
              aria-label="Close notifications"
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.98 }}
              className="absolute right-0 top-full mt-2 z-50 w-[min(100vw-2rem,380px)] bg-white border border-border rounded-2xl shadow-[0_20px_50px_rgba(28,28,28,0.15)] overflow-hidden"
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <p className="font-black text-foreground">Notifications</p>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={markAll}
                    className="p-1.5 rounded-lg text-gray-text hover:bg-section"
                    title="Mark all read"
                  >
                    <CheckCheck className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="p-1.5 rounded-lg text-gray-text hover:bg-section"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="max-h-[360px] overflow-y-auto">
                {preview.length === 0 && (
                  <p className="text-sm text-gray-text px-4 py-8 text-center">
                    No notifications yet.
                  </p>
                )}
                {preview.map((n) => {
                  const href =
                    n.meta?.link ||
                    (n.order_id ? `/track-order?id=${n.order_id}` : inboxHref);
                  const category = n.category || mapTypeToCategory(n.type, n.message);
                  return (
                    <div
                      key={n.id}
                      className={`px-4 py-3 border-b border-[#F3F4F6] hover:bg-section ${
                        !n.is_read ? "bg-primary/5" : ""
                      }`}
                    >
                      <div className="flex gap-2">
                        <Link
                          href={href}
                          onClick={() => {
                            markRead(n.id);
                            setOpen(false);
                          }}
                          className="flex-1 min-w-0"
                        >
                          <p className="text-sm font-bold text-foreground truncate">{n.title}</p>
                          <p className="text-xs text-gray-text line-clamp-2 mt-0.5">
                            {cleanNotificationMessage(n.message)}
                          </p>
                          <p className="text-[10px] text-[#9CA3AF] mt-1">
                            {category} · {new Date(n.created_at).toLocaleString()}
                          </p>
                        </Link>
                        <button
                          type="button"
                          onClick={() => remove(n.id)}
                          className="p-1 text-[#9CA3AF] hover:text-red-500"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="px-4 py-3 border-t border-border flex flex-col gap-2">
                <button
                  type="button"
                  onClick={enablePush}
                  className="text-xs font-bold text-primary text-left hover:underline"
                >
                  Enable push notifications
                </button>
                <Link
                  href={inboxHref}
                  onClick={() => setOpen(false)}
                  className="text-sm font-bold text-foreground text-center py-2 rounded-xl bg-section hover:bg-primary/10"
                >
                  View all
                </Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
