"use client";

import { useMemo, useState } from "react";
import useSWR from "swr";
import PartnerSidebar from "@/components/partner/PartnerSidebar";
import PartnerHeader from "@/components/partner/PartnerHeader";
import api from "@/services/api";
import { useAuthToken } from "@/hooks/useAuthToken";
import { partnerFetcher } from "@/services/partnerApi";
import { cleanNotificationMessage } from "@/lib/notificationTypes";
import { CheckCheck, Search, Trash2 } from "lucide-react";

export default function PartnerNotificationsPage() {
  const hasToken = useAuthToken();
  const [q, setQ] = useState("");
  const { data, mutate, isLoading } = useSWR(
    hasToken ? "/api/partner/notifications" : null,
    partnerFetcher
  );

  const items = useMemo(() => {
    const list = Array.isArray(data) ? data : [];
    if (!q) return list;
    const needle = q.toLowerCase();
    return list.filter(
      (n: { title?: string; message?: string }) =>
        String(n.title || "").toLowerCase().includes(needle) ||
        String(n.message || "").toLowerCase().includes(needle)
    );
  }, [data, q]);

  const markAll = async () => {
    await api.put("/api/notifications/read-all");
    mutate();
  };

  const remove = async (id: string) => {
    if (String(id).startsWith("low-stock-")) return;
    await api.delete(`/api/notifications/${id}`);
    mutate();
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex">
      <div className="hidden lg:block w-64 flex-shrink-0">
        <PartnerSidebar />
      </div>
      <div className="flex-1 flex flex-col min-w-0">
        <PartnerHeader />
        <main className="flex-1 p-4 md:p-8">
          <div className="max-w-3xl mx-auto">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
              <div>
                <h1 className="text-3xl font-black text-[#111827]">Notifications</h1>
                <p className="text-[#6B7280]">New orders, payments, and delivery updates</p>
              </div>
              <button
                type="button"
                onClick={markAll}
                className="inline-flex items-center gap-2 border border-[#E5E7EB] bg-white px-4 py-2 rounded-xl text-sm font-bold"
              >
                <CheckCheck className="w-4 h-4" /> Mark all read
              </button>
            </div>

            <div className="relative mb-6">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search…"
                className="w-full border border-[#E5E7EB] rounded-xl pl-9 pr-3 py-2.5 text-sm bg-white"
              />
            </div>

            {isLoading && <p className="text-sm text-[#6B7280]">Loading…</p>}
            {!isLoading && items.length === 0 && (
              <p className="text-sm text-[#6B7280] bg-white border border-[#E5E7EB] rounded-2xl p-8 text-center">
                No notifications yet.
              </p>
            )}

            <div className="space-y-3">
              {items.map((n: {
                id: string;
                title: string;
                message: string;
                is_read: boolean;
                created_at: string;
              }) => (
                <div
                  key={n.id}
                  className={`bg-white border border-[#E5E7EB] rounded-2xl p-4 flex gap-3 ${
                    !n.is_read ? "border-l-4 border-l-[#FC8019]" : ""
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-[#111827]">{n.title}</p>
                    <p className="text-sm text-[#6B7280] mt-1">
                      {cleanNotificationMessage(n.message)}
                    </p>
                    <p className="text-[10px] text-[#9CA3AF] mt-2">
                      {new Date(n.created_at).toLocaleString()}
                    </p>
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
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
