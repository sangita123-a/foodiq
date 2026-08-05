"use client";

import { BellOff } from "lucide-react";
import AdminShell from "@/components/admin/AdminShell";
import AdminSendNotification from "@/components/admin/AdminSendNotification";
import { Badge, EmptyState } from "@/components/admin/ui";
import { useAdminList } from "@/hooks/useAdminData";
import { formatDate, type AdminSentNotification } from "@/services/adminApi";
import { getNotificationMeta } from "@/lib/deliveryNotificationTypes";

export default function AdminDeliveryNotificationsPage() {
  const { data, isLoading } = useAdminList<{ notifications: AdminSentNotification[] }>(
    "/api/admin/delivery/notifications?limit=50"
  );
  const notifications = data?.notifications || [];

  return (
    <AdminShell title="Delivery Notifications">
      <div className="mb-6">
        <h1 className="text-3xl font-black text-foreground">Delivery Notifications</h1>
        <p className="text-gray-text">
          Send a real-time notification to a delivery partner and review recent sends.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6">
        <AdminSendNotification />

        <div className="bg-white border border-border rounded-2xl overflow-hidden shadow-[var(--shadow-admin-soft)]">
          <div className="px-5 py-4 border-b border-border">
            <p className="font-black text-foreground">Recent Sends</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-section text-left">
                <tr>
                  <th className="px-5 py-3 font-bold text-gray-text">Partner</th>
                  <th className="px-5 py-3 font-bold text-gray-text">Type</th>
                  <th className="px-5 py-3 font-bold text-gray-text">Title</th>
                  <th className="px-5 py-3 font-bold text-gray-text">Sent</th>
                  <th className="px-5 py-3 font-bold text-gray-text">Read</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {notifications.map((n) => {
                  const meta = getNotificationMeta(n.type);
                  const Icon = meta.icon;
                  return (
                    <tr key={n.id} className="hover:bg-section/50 transition-colors">
                      <td className="px-5 py-4">
                        <p className="font-bold text-foreground">{n.partner_name || "Partner"}</p>
                        <p className="text-xs text-gray-text">{n.partner_email}</p>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase px-2 py-1 rounded-full ${meta.color}`}>
                          <Icon className="w-3 h-3" />
                          {meta.label}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-bold text-foreground">{n.title}</p>
                        <p className="text-xs text-gray-text line-clamp-1">{n.message}</p>
                      </td>
                      <td className="px-5 py-4 text-xs text-gray-text">{formatDate(n.created_at)}</td>
                      <td className="px-5 py-4">
                        <Badge tone={n.is_read ? "success" : "warning"}>
                          {n.is_read ? "Read" : "Unread"}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {!notifications.length && !isLoading && (
            <EmptyState icon={BellOff} title="No notifications sent yet" description="Notifications you send to delivery partners will show up here." />
          )}
          {isLoading && <p className="text-center text-gray-text py-16 text-sm">Loading…</p>}
        </div>
      </div>
    </AdminShell>
  );
}
