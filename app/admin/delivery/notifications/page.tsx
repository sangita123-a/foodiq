"use client";

import AdminShell from "@/components/admin/AdminShell";
import AdminSendNotification from "@/components/admin/AdminSendNotification";
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

        <div className="bg-white border border-border rounded-2xl overflow-hidden">
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
                    <tr key={n.id}>
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
                        <span
                          className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full ${
                            n.is_read ? "bg-green-50 text-green-600" : "bg-amber-50 text-amber-600"
                          }`}
                        >
                          {n.is_read ? "Read" : "Unread"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {!notifications.length && !isLoading && (
            <p className="text-center text-[#9CA3AF] py-16">No notifications sent yet.</p>
          )}
          {isLoading && <p className="text-center text-gray-text py-16 text-sm">Loading…</p>}
        </div>
      </div>
    </AdminShell>
  );
}
