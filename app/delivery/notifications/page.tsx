"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import DeliveryShell from "@/components/delivery/DeliveryShell";
import { useDeliveryDashboard } from "@/hooks/useDeliveryData";
import { useSocket } from "@/hooks/useSocket";
import { SOCKET_EVENTS } from "@/lib/socketEvents";
import {
  deleteDeliveryNotification,
  fetchDeliveryNotifications,
  formatRelativeTime,
  markAllDeliveryNotificationsRead,
  markDeliveryNotificationRead,
  type DeliveryNotificationItem,
} from "@/services/deliveryApi";
import { getNotificationMeta, NOTIFICATION_FILTER_TABS } from "@/lib/deliveryNotificationTypes";
import { ArrowUpRight, CheckCheck, Loader2, RefreshCw, Trash2 } from "lucide-react";

const PAGE_SIZE = 15;
type Tab = (typeof NOTIFICATION_FILTER_TABS)[number];

export default function DeliveryNotificationsPage() {
  const router = useRouter();
  const { data: dashboard } = useDeliveryDashboard();
  const { socket, connected } = useSocket();

  const [tab, setTab] = useState<Tab>("All");
  const [items, setItems] = useState<DeliveryNotificationItem[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);

  const load = useCallback(
    async (pageNum: number, append: boolean) => {
      setError(false);
      try {
        const res = await fetchDeliveryNotifications({
          page: pageNum,
          limit: PAGE_SIZE,
          category: tab,
        });
        setItems((prev) => (append ? [...prev, ...res.notifications] : res.notifications));
        setTotalPages(res.pagination.total_pages);
        setUnreadCount(res.unread_count);
        setPage(pageNum);
      } catch {
        setError(true);
      }
    },
    [tab]
  );

  useEffect(() => {
    setLoading(true);
    load(1, false).finally(() => setLoading(false));
  }, [tab, load]);

  // ── Real-time updates ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!socket || !connected) return;
    const onNew = (n: DeliveryNotificationItem) => {
      setUnreadCount((c) => c + 1);
      if (tab === "All" || tab === n.category) {
        setItems((prev) => (prev.some((x) => x.id === n.id) ? prev : [n, ...prev]));
      }
    };
    const onRead = ({ id }: { id: string }) => {
      setItems((prev) => prev.map((x) => (x.id === id ? { ...x, is_read: true } : x)));
    };
    const onAllRead = () => {
      setItems((prev) => prev.map((x) => ({ ...x, is_read: true })));
      setUnreadCount(0);
    };
    socket.on(SOCKET_EVENTS.DELIVERY_NOTIFICATION, onNew);
    socket.on(SOCKET_EVENTS.DELIVERY_NOTIFICATION_READ, onRead);
    socket.on(SOCKET_EVENTS.DELIVERY_NOTIFICATION_ALL_READ, onAllRead);
    return () => {
      socket.off(SOCKET_EVENTS.DELIVERY_NOTIFICATION, onNew);
      socket.off(SOCKET_EVENTS.DELIVERY_NOTIFICATION_READ, onRead);
      socket.off(SOCKET_EVENTS.DELIVERY_NOTIFICATION_ALL_READ, onAllRead);
    };
  }, [socket, connected, tab]);

  // ── Infinite loading ──────────────────────────────────────────────────────
  const sentinelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !loading && !loadingMore && page < totalPages) {
          setLoadingMore(true);
          load(page + 1, true).finally(() => setLoadingMore(false));
        }
      },
      { rootMargin: "200px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [loading, loadingMore, page, totalPages, load]);

  // ── Pull to refresh ───────────────────────────────────────────────────────
  const listRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef<number | null>(null);
  const [pullDistance, setPullDistance] = useState(0);

  const doRefresh = useCallback(async () => {
    setRefreshing(true);
    await load(1, false);
    setRefreshing(false);
  }, [load]);

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = listRef.current && listRef.current.scrollTop <= 0 ? e.touches[0].clientY : null;
  };
  const onTouchMove = (e: React.TouchEvent) => {
    if (touchStartY.current == null || refreshing) return;
    const delta = e.touches[0].clientY - touchStartY.current;
    if (delta > 0) setPullDistance(Math.min(delta, 90));
  };
  const onTouchEnd = () => {
    if (pullDistance > 60) doRefresh();
    setPullDistance(0);
    touchStartY.current = null;
  };

  // ── Actions ───────────────────────────────────────────────────────────────
  const markRead = async (n: DeliveryNotificationItem) => {
    if (!n.is_read) {
      setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, is_read: true } : x)));
      setUnreadCount((c) => Math.max(0, c - 1));
      try {
        await markDeliveryNotificationRead(n.id);
      } catch {
        /* optimistic — ignore transient failure */
      }
    }
    if (n.action_url) router.push(n.action_url);
  };

  const markAll = async () => {
    setItems((prev) => prev.map((x) => ({ ...x, is_read: true })));
    setUnreadCount(0);
    try {
      await markAllDeliveryNotificationsRead();
    } catch {
      /* ignore */
    }
  };

  const remove = async (id: string) => {
    setItems((prev) => prev.filter((x) => x.id !== id));
    try {
      await deleteDeliveryNotification(id);
    } catch {
      /* ignore */
    }
  };

  return (
    <DeliveryShell title="Notifications" online={dashboard?.is_online}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-foreground">Notifications</h1>
          <p className="text-sm text-gray-text">
            {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? "s" : ""}` : "You're all caught up"}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={doRefresh}
            disabled={refreshing}
            className="inline-flex items-center gap-2 border border-border bg-white px-3 py-2 rounded-xl text-sm font-bold disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          <button
            type="button"
            onClick={markAll}
            disabled={!unreadCount}
            className="inline-flex items-center gap-2 border border-border bg-white px-3 py-2 rounded-xl text-sm font-bold disabled:opacity-50"
          >
            <CheckCheck className="w-4 h-4" />
            <span className="hidden sm:inline">Mark all read</span>
          </button>
        </div>
      </div>

      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        {NOTIFICATION_FILTER_TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`shrink-0 px-4 py-2 rounded-full text-sm font-bold transition-colors ${
              tab === t ? "bg-primary text-white shadow-button" : "bg-white border border-border text-gray-text"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Unable to load notifications.
        </div>
      )}

      <section className="bg-white border border-border rounded-2xl overflow-hidden relative">
        {pullDistance > 0 && (
          <div
            className="flex items-center justify-center overflow-hidden transition-[height] text-xs font-bold text-gray-text"
            style={{ height: pullDistance }}
          >
            {pullDistance > 60 ? "Release to refresh" : "Pull to refresh"}
          </div>
        )}
        {refreshing && (
          <div className="flex items-center justify-center py-3 text-xs font-bold text-gray-text gap-2">
            <Loader2 className="w-3.5 h-3.5 animate-spin" /> Refreshing…
          </div>
        )}

        <div
          ref={listRef}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          className="max-h-[70vh] overflow-y-auto custom-scrollbar divide-y divide-[#F3F4F6]"
        >
          {loading && (
            <div className="p-8 flex justify-center">
              <Loader2 className="w-5 h-5 animate-spin text-gray-text" />
            </div>
          )}

          {!loading &&
            items.map((n) => {
              const meta = getNotificationMeta(n.type);
              const Icon = meta.icon;
              return (
                <div key={n.id} className={`px-5 py-4 flex gap-3 ${!n.is_read ? "bg-primary/5" : ""}`}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${meta.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <button type="button" onClick={() => markRead(n)} className="flex-1 min-w-0 text-left">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <p className="font-bold text-foreground truncate">{n.title}</p>
                        {!n.is_read ? (
                          <span className="w-2 h-2 rounded-full bg-primary shrink-0" title="Unread" />
                        ) : (
                          <CheckCheck className="w-3.5 h-3.5 text-[#9CA3AF] shrink-0" aria-label="Read" />
                        )}
                      </div>
                      <span className="text-[11px] text-[#9CA3AF] whitespace-nowrap">
                        {formatRelativeTime(n.created_at)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-text mt-1">{n.message}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wide text-[#9CA3AF]">
                        {n.category}
                      </span>
                      {n.action_url && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-primary">
                          View <ArrowUpRight className="w-3 h-3" />
                        </span>
                      )}
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(n.id)}
                    className="text-[#9CA3AF] hover:text-red-500 self-start"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}

          {!loading && !items.length && (
            <p className="p-8 text-sm text-gray-text text-center">
              No notifications yet. New delivery requests, wallet and KYC alerts will appear here.
            </p>
          )}

          <div ref={sentinelRef} />
          {loadingMore && (
            <div className="p-4 flex justify-center">
              <Loader2 className="w-4 h-4 animate-spin text-gray-text" />
            </div>
          )}
        </div>
      </section>
    </DeliveryShell>
  );
}
