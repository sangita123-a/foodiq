"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import NotificationsHeader, { NotificationFilter } from "@/components/notifications/NotificationsHeader";
import NotificationGroup from "@/components/notifications/NotificationGroup";
import NotificationCard, { NotificationType } from "@/components/notifications/NotificationCard";
import NotificationsEmptyState from "@/components/notifications/NotificationsEmptyState";
import useSWR from "swr";
import api from "@/services/api";
import { useToast } from "@/contexts/ToastContext";

export default function NotificationsPage() {
  const { data, mutate, isLoading, error } = useSWR('/api/notifications');
  const backendNotifs = data || [];
  const { showToast } = useToast();

  const mapTimeGroup = (date: Date) => {
    const today = new Date();
    const diff = today.getTime() - date.getTime();
    const days = diff / (1000 * 3600 * 24);
    if (days < 1 && today.getDate() === date.getDate()) return "Today";
    if (days < 2 && today.getDate() !== date.getDate()) return "Yesterday";
    if (days < 7) return "This Week";
    return "Earlier";
  };

  const notifications: NotificationType[] = backendNotifs.map((n: any) => {
    const d = new Date(n.created_at);
    return {
      id: n.id,
      type: "Orders", // Or map based on title/type if present
      title: n.title,
      description: n.message,
      time: d.toLocaleString(),
      isRead: n.is_read,
      timeGroup: mapTimeGroup(d)
    };
  });

  const [activeFilter, setActiveFilter] = useState<NotificationFilter>("All");

  const hasUnread = notifications.some(n => !n.isRead);

  // Handlers
  const handleMarkAsRead = async (id: string) => {
    try {
      await api.put(`/api/notifications/${id}/read`);
      mutate();
    } catch (e: any) {
      console.error(e);
      showToast(e.response?.data?.message || "Failed to mark as read", "error");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/api/notifications/${id}`);
      mutate();
      showToast("Notification deleted", "success");
    } catch (e: any) {
      console.error(e);
      showToast(e.response?.data?.message || "Failed to delete notification", "error");
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.put(`/api/notifications/read-all`);
      mutate();
    } catch (e) {
      console.error(e);
    }
  };

  const handleClearAll = async () => {
    try {
      await api.delete('/api/notifications');
      mutate();
      showToast("All notifications cleared", "success");
    } catch (e: any) {
      console.error(e);
      showToast(e.response?.data?.message || "Failed to clear notifications", "error");
    }
  };

  // Filter Logic
  const filteredNotifications = notifications.filter(n => {
    if (activeFilter === "All") return true;
    return n.type === activeFilter;
  });

  // Grouping Logic
  const grouped = filteredNotifications.reduce((acc, curr) => {
    if (!acc[curr.timeGroup]) acc[curr.timeGroup] = [];
    acc[curr.timeGroup].push(curr);
    return acc;
  }, {} as Record<string, NotificationType[]>);

  const groupOrder = ["Today", "Yesterday", "This Week", "Earlier"];

  if (isLoading) {
    return (
      <main className="min-h-screen bg-[#FFFFFF] relative pt-[90px]">
        <Navbar />
        <div className="container mx-auto px-4 md:px-8 py-12 max-w-4xl">
          <div className="w-48 h-10 bg-[#F8FAFC] animate-pulse rounded-lg mb-8"></div>
          <div className="flex flex-col gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-[#F8FAFC] animate-pulse rounded-2xl border border-[#E5E7EB]"></div>
            ))}
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-[#FFFFFF] flex flex-col items-center justify-center gap-4 pt-[90px]">
        <Navbar />
        <div className="text-white text-xl">Failed to load notifications</div>
        <button onClick={() => mutate()} className="px-6 py-2 bg-[var(--color-primary)] text-white rounded-lg">Retry</button>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#FFFFFF] relative selection:bg-[var(--color-primary)] selection:text-white pt-[90px]">
      <Navbar />

      <div className="container mx-auto px-4 md:px-8 py-12 max-w-4xl">
        
        <NotificationsHeader 
          activeFilter={activeFilter}
          setActiveFilter={setActiveFilter}
          onMarkAllAsRead={handleMarkAllAsRead}
          onClearAll={handleClearAll}
          hasUnread={hasUnread}
        />

        {filteredNotifications.length > 0 ? (
          <div className="flex flex-col">
            {groupOrder.map(groupName => {
              const groupItems = grouped[groupName];
              if (!groupItems || groupItems.length === 0) return null;

              return (
                <NotificationGroup key={groupName} title={groupName}>
                  {groupItems.map(notification => (
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
