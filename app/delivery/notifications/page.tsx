"use client";

import { mutate as globalMutate } from "swr";
import DeliveryShell from "@/components/delivery/DeliveryShell";
import {
  useDeliveryDashboard,
  useDeliveryNotifications,
} from "@/hooks/useDeliveryData";
import { formatRelativeTime } from "@/services/deliveryApi";
import api from "@/services/api";
import { cleanNotificationMessage } from "@/lib/notificationTypes";
import { CheckCheck, Trash2 } from "lucide-react";

export default function DeliveryNotificationsPage() {
  const { data: dashboard } = useDeliveryDashboard();
  const { data, error, isLoading, mutate } = useDeliveryNotifications();

  const markAll = async () => {
    await api.put("/api/notifications/read-all");
    mutate();
    globalMutate("/api/delivery/notifications");
  };

  const remove = async (id: string) => {
    await api.delete(`/api/notifications/${id}`);
    mutate();
  };

  return (
    <DeliveryShell title="Notifications" online={dashboard?.is_online}>
      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Unable to load notifications.
        </div>
      )}

      <div className="flex justify-end mb-4">
        <button
          type="button"
          onClick={markAll}
          className="inline-flex items-center gap-2 border border-[#E5E7EB] bg-white px-4 py-2 rounded-xl text-sm font-bold"
        >
          <CheckCheck className="w-4 h-4" /> Mark all read
        </button>
      </div>

      <section className="bg-white border border-[#E5E7EB] rounded-2xl overflow-hidden">
        {isLoading && !data && (
          <p className="p-6 text-sm text-[#6B7280]">Loading notifications...</p>
        )}
        <div className="divide-y divide-[#F3F4F6]">
          {(data || []).map((n) => (
            <div key={n.id} className={`px-5 py-4 flex gap-3 ${!n.is_read ? "bg-[#FC8019]/5" : ""}`}>
              <div className="flex-1">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-bold text-[#111827]">{n.title}</p>
                    <p className="text-sm text-[#6B7280] mt-1">
                      {cleanNotificationMessage(n.message)}
                    </p>
                  </div>
                  <span className="text-[11px] text-[#9CA3AF] whitespace-nowrap">
                    {formatRelativeTime(n.created_at)}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => remove(n.id)}
                className="text-[#9CA3AF] hover:text-red-500"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
          {!data?.length && !isLoading && (
            <p className="p-8 text-sm text-[#6B7280] text-center">
              No notifications yet. New delivery requests and payment alerts will appear here.
            </p>
          )}
        </div>
      </section>
    </DeliveryShell>
  );
}
