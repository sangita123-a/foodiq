import AdminShell from "@/components/admin/AdminShell";
import PushNotificationPanel from "@/components/admin/PushNotificationPanel";

export default function AdminPushNotificationsPage() {
  return (
    <AdminShell title="Push Notifications">
      <PushNotificationPanel />
    </AdminShell>
  );
}
