"use client";

import { motion } from "framer-motion";
import { Bell, Check, Trash2 } from "lucide-react";
import useSWR from "swr";
import api from "@/services/api";
import { useToast } from "@/contexts/ToastContext";
import Link from "next/link";

export default function NotificationsPanel() {
  const { data, mutate, isLoading } = useSWR("/api/notifications", { refreshInterval: 30000 });
  const notifications = data || [];
  const { showToast } = useToast();
  const unread = notifications.filter((n: any) => !n.is_read).length;

  const markRead = async (id: string) => {
    try {
      await api.put(`/api/notifications/${id}/read`);
      mutate();
    } catch (err: any) {
      showToast(err.response?.data?.message || "Failed", "error");
    }
  };

  const markAll = async () => {
    try {
      await api.put("/api/notifications/read-all");
      mutate();
      showToast("All marked as read", "success");
    } catch (err: any) {
      showToast(err.response?.data?.message || "Failed", "error");
    }
  };

  const remove = async (id: string) => {
    try {
      await api.delete(`/api/notifications/${id}`);
      mutate();
      showToast("Notification deleted", "success");
    } catch (err: any) {
      showToast(err.response?.data?.message || "Failed", "error");
    }
  };

  if (isLoading) {
    return (
      <div className="bg-[#F8FAFC] rounded-[24px] p-6 md:p-8 border border-[#E5E7EB]">
        <div className="h-8 w-48 bg-[#F8FAFC] animate-pulse rounded mb-8" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 bg-[#F8FAFC] animate-pulse rounded-2xl mb-3" />
        ))}
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="bg-[#F8FAFC] rounded-[24px] p-6 md:p-8 border border-[#E5E7EB]"
    >
      <div className="flex items-center justify-between mb-8 pb-6 border-b border-[#E5E7EB]">
        <div className="flex items-center gap-3">
          <Bell className="w-6 h-6 text-primary" />
          <h2 className="text-2xl font-bold text-[#111827]">Notifications</h2>
          {unread > 0 && (
            <span className="bg-primary text-white text-xs font-bold px-2 py-0.5 rounded-full">
              {unread}
            </span>
          )}
        </div>
        <div className="flex gap-4 items-center">
          {unread > 0 && (
            <button onClick={markAll} className="text-primary text-sm font-bold hover:text-[#111827]">
              Mark all read
            </button>
          )}
          <Link href="/notifications" className="text-[#6B7280] text-sm font-bold hover:text-[#111827]">
            Full page
          </Link>
        </div>
      </div>

      {notifications.length === 0 ? (
        <div className="text-center py-16 text-[#6B7280]">
          <Bell className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p>No notifications yet.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {notifications.map((n: any) => (
            <div
              key={n.id}
              className={`rounded-2xl p-4 border flex gap-4 ${
                n.is_read
                  ? "bg-white border-[#E5E7EB]"
                  : "bg-primary/5 border-primary/20"
              }`}
            >
              <div className="flex-1 min-w-0">
                <h4 className="text-white font-bold mb-1">{n.title}</h4>
                <p className="text-[#6B7280] text-sm mb-2">{n.message}</p>
                <p className="text-gray-600 text-xs">
                  {new Date(n.created_at).toLocaleString()}
                </p>
              </div>
              <div className="flex flex-col gap-2">
                {!n.is_read && (
                  <button
                    onClick={() => markRead(n.id)}
                    className="text-green-400 hover:text-green-300 p-1"
                    title="Mark read"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => remove(n.id)}
                  className="text-[#9CA3AF] hover:text-red-400 p-1"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
