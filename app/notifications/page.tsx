"use client";

import { useMemo, useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import NotificationsHeader, { NotificationFilter } from "@/components/notifications/NotificationsHeader";
import NotificationGroup from "@/components/notifications/NotificationGroup";
import NotificationCard, { NotificationType } from "@/components/notifications/NotificationCard";
import NotificationsEmptyState from "@/components/notifications/NotificationsEmptyState";
import useSWR from "swr";
import api from "@/services/api";
import { useToast } from "@/contexts/ToastContext";
import { useAuthToken } from "@/hooks/useAuthToken";
import {
  cleanNotificationMessage,
  mapTypeToCategory,
} from "@/lib/notificationTypes";
import { enablePushNotifications } from "@/lib/pushNotifications";
import { Search } from "lucide-react";

export default function NotificationsPage() {
  const hasToken = useAuthToken();
  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [activeFilter, setActiveFilter] = useState<NotificationFilter>("All");

  const query = useMemo(() => {
    const params = new URLSearchParams();
    if (search) params.set("q", search);
    if (fromDate) params.set("from", fromDate);
    if (toDate) params.set("to", toDate);
    if (activeFilter !== "All") params.set("category", activeFilter);
    const qs = params.toString();
    return hasToken ? `/api/notifications${qs ? `?${qs}` : ""}` : null;
  }, [hasToken, search, fromDate, toDate, activeFilter]);

  const { data, mutate, isLoading, error } = useSWR(query);
  const backendNotifs = Array.isArray(data) ? data : [];
  const { showToast } = useToast();

  const mapTimeGroup = (date: Date) => {
    const today = new Date();
    const diff = today.getTime() - date.getTime();
    const days = diff / (1000 * 3600 * 24);
    if (days < 1 && today.getDate() === date.getDate()) return "Today";
    if (days < 2) return "Yesterday";
    if (days < 7) return "This Week";
    return "Earlier";
  };

  const notifications: NotificationType[] = backendNotifs.map((n: Record<string, unknown>) => {
    const d = new Date(String(n.created_at));
    return {
      id: String(n.id),
      type: (n.category as NotificationFilter) || mapTypeToCategory(String(n.type || ""), String(n.message || "")),
      title: String(n.title || ""),
      description: cleanNotificationMessage(String(n.message || "")),
      time: d.toLocaleString(),
      isRead: Boolean(n.is_read),
      timeGroup: mapTimeGroup(d) as NotificationType["timeGroup"],
    };
  });

  const hasUnread = notifications.some((n) => !n.isRead);

  const handleMarkAsRead = async (id: string) => {
    try {
      await api.put(`/api/notifications/${id}/read`);
      mutate();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      showToast(err.response?.data?.message || "Failed to mark as read", "error");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/api/notifications/${id}`);
      mutate();
      showToast("Notification deleted", "success");
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      showToast(err.response?.data?.message || "Failed to delete", "error");
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.put(`/api/notifications/read-all`);
      mutate();
    } catch {
      /* ignore */
    }
  };

  const handleClearAll = async () => {
    try {
      await api.delete("/api/notifications");
      mutate();
      showToast("All notifications cleared", "success");
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      showToast(err.response?.data?.message || "Failed to clear", "error");
    }
  };

  const grouped = notifications.reduce(
    (acc, curr) => {
      if (!acc[curr.timeGroup]) acc[curr.timeGroup] = [];
      acc[curr.timeGroup].push(curr);
      return acc;
    },
    {} as Record<string, NotificationType[]>
  );

  const groupOrder = ["Today", "Yesterday", "This Week", "Earlier"];

  if (isLoading) {
    return (
      <main className="min-h-screen bg-background relative pt-[90px]">
        <Navbar />
        <div className="container mx-auto px-4 md:px-8 py-12 max-w-4xl">
          <div className="w-48 h-10 bg-section animate-pulse rounded-lg mb-8" />
          <div className="flex flex-col gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-section animate-pulse rounded-2xl border border-border" />
            ))}
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 pt-[90px]">
        <Navbar />
        <div className="text-foreground text-xl">Failed to load notifications</div>
        <button type="button" onClick={() => mutate()} className="px-6 py-2 bg-[var(--color-primary)] text-white rounded-lg">
          Retry
        </button>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background relative selection:bg-[var(--color-primary)] selection:text-white pt-[90px]">
      <Navbar />

      <div className="container mx-auto px-4 md:px-8 py-12 max-w-4xl">
        <NotificationsHeader
          activeFilter={activeFilter}
          setActiveFilter={setActiveFilter}
          onMarkAllAsRead={handleMarkAllAsRead}
          onClearAll={handleClearAll}
          hasUnread={hasUnread}
        />

        <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="relative md:col-span-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search notifications…"
              className="w-full border border-border rounded-xl pl-9 pr-3 py-2.5 text-sm"
            />
          </div>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="border border-border rounded-xl px-3 py-2.5 text-sm"
          />
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="border border-border rounded-xl px-3 py-2.5 text-sm"
          />
        </div>

        <button
          type="button"
          onClick={async () => {
            const r = await enablePushNotifications();
            showToast(
              r.ok ? "Push notifications enabled" : `Push not enabled: ${r.reason || "failed"}`,
              r.ok ? "success" : "error"
            );
          }}
          className="mb-8 text-sm font-bold text-primary hover:underline"
        >
          Enable browser push notifications
        </button>

        {notifications.length > 0 ? (
          <div className="flex flex-col">
            {groupOrder.map((groupName) => {
              const groupItems = grouped[groupName];
              if (!groupItems || groupItems.length === 0) return null;
              return (
                <NotificationGroup key={groupName} title={groupName}>
                  {groupItems.map((notification) => (
                    <NotificationCard
                      key={notification.id}
                      notification={notification}
                      onMarkAsRead={handleMarkAsRead}
                      onDelete={handleDelete}
                    />
                  ))}
                </NotificationGroup>
              );
            })}
          </div>
        ) : (
          <NotificationsEmptyState />
        )}
      </div>

      <Footer />
    </main>
  );
}
