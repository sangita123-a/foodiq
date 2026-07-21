"use client";

import { useState } from "react";
import useSWR from "swr";
import AdminShell from "@/components/admin/AdminShell";
import {
  sendPushCampaign,
  fetchScheduledCampaigns,
  fetchPushTargetOptions,
  MARKETING_NOTIFICATION_TYPES,
  PUSH_AUDIENCES,
  type PushCampaignPayload,
} from "@/services/notificationApi";
import { useAuthToken } from "@/hooks/useAuthToken";
import { Bell, Calendar, MapPin, Store, Users } from "lucide-react";

type TargetMode = "audience" | "users" | "city" | "restaurant";

export default function PushNotificationPanel() {
  const hasToken = useAuthToken();
  const { data: targets } = useSWR(hasToken ? "/api/admin/notifications/push/targets" : null, fetchPushTargetOptions);
  const { data: scheduled = [], mutate: refreshScheduled } = useSWR(
    hasToken ? "/api/admin/notifications/push/scheduled" : null,
    fetchScheduledCampaigns
  );

  const [targetMode, setTargetMode] = useState<TargetMode>("audience");
  const [audience, setAudience] = useState("customers");
  const [userIdsRaw, setUserIdsRaw] = useState("");
  const [city, setCity] = useState("");
  const [restaurantId, setRestaurantId] = useState("");
  const [notificationType, setNotificationType] = useState("coupon_alert");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [link, setLink] = useState("/notifications");
  const [scheduleAt, setScheduleAt] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setResult("");
    try {
      const payload: PushCampaignPayload = {
        title,
        message,
        type: notificationType,
        link,
        schedule_at: scheduleAt || null,
      };

      if (targetMode === "audience") payload.audience = audience;
      if (targetMode === "users") {
        payload.user_ids = userIdsRaw
          .split(/[\s,]+/)
          .map((s) => s.trim())
          .filter(Boolean);
        if (!payload.user_ids.length) {
          setResult("Enter at least one user ID.");
          return;
        }
      }
      if (targetMode === "city") payload.city = city;
      if (targetMode === "restaurant") payload.restaurant_id = restaurantId;

      const data = await sendPushCampaign(payload);
      setResult(
        data.scheduled
          ? "Notification scheduled successfully."
          : `Sent to ${data.sent || 0} users via FCM + in-app inbox.`
      );
      setTitle("");
      setMessage("");
      setScheduleAt("");
      refreshScheduled();
    } catch {
      setResult("Failed to send notification.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Bell className="w-7 h-7 text-primary" />
          <h1 className="text-3xl font-black text-foreground">Push Notifications</h1>
        </div>
        <p className="text-gray-text">
          Send FCM web push + in-app notifications to all users, selected users, by city, or by restaurant. Schedule for later delivery.
        </p>
      </div>

      <form onSubmit={submit} className="bg-white rounded-3xl border border-border p-6 space-y-5">
        <div>
          <label className="block text-sm font-bold text-gray-text mb-2">Target</label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {([
              ["audience", "Audience", Users],
              ["users", "Selected Users", Users],
              ["city", "By City", MapPin],
              ["restaurant", "By Restaurant", Store],
            ] as const).map(([mode, label, Icon]) => (
              <button
                key={mode}
                type="button"
                onClick={() => setTargetMode(mode)}
                className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-bold border ${
                  targetMode === mode
                    ? "bg-primary text-white border-primary"
                    : "bg-white text-gray-text border-border"
                }`}
              >
                <Icon className="w-4 h-4" /> {label}
              </button>
            ))}
          </div>
        </div>

        {targetMode === "audience" && (
          <div>
            <label className="block text-sm font-bold text-gray-text mb-2">Audience</label>
            <select
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
              className="w-full border border-border rounded-xl px-4 py-3 text-sm"
            >
              {PUSH_AUDIENCES.map((a) => (
                <option key={a.value} value={a.value}>{a.label}</option>
              ))}
            </select>
          </div>
        )}

        {targetMode === "users" && (
          <div>
            <label className="block text-sm font-bold text-gray-text mb-2">User IDs (comma-separated UUIDs)</label>
            <textarea
              value={userIdsRaw}
              onChange={(e) => setUserIdsRaw(e.target.value)}
              rows={3}
              placeholder="uuid-1, uuid-2, ..."
              className="w-full border border-border rounded-xl px-4 py-3 text-sm font-mono"
            />
          </div>
        )}

        {targetMode === "city" && (
          <div>
            <label className="block text-sm font-bold text-gray-text mb-2">City</label>
            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full border border-border rounded-xl px-4 py-3 text-sm"
            >
              <option value="">Select city</option>
              {(targets?.cities || []).map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        )}

        {targetMode === "restaurant" && (
          <div>
            <label className="block text-sm font-bold text-gray-text mb-2">Restaurant</label>
            <select
              value={restaurantId}
              onChange={(e) => setRestaurantId(e.target.value)}
              className="w-full border border-border rounded-xl px-4 py-3 text-sm"
            >
              <option value="">Select restaurant</option>
              {(targets?.restaurants || []).map((r) => (
                <option key={r.id} value={r.id}>{r.name}{r.city ? ` · ${r.city}` : ""}</option>
              ))}
            </select>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold text-gray-text mb-2">Notification Type</label>
            <select
              value={notificationType}
              onChange={(e) => setNotificationType(e.target.value)}
              className="w-full border border-border rounded-xl px-4 py-3 text-sm"
            >
              {MARKETING_NOTIFICATION_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-text mb-2">Deep Link</label>
            <input
              value={link}
              onChange={(e) => setLink(e.target.value)}
              className="w-full border border-border rounded-xl px-4 py-3 text-sm"
              placeholder="/offers"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-text mb-2">Title</label>
          <input
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full border border-border rounded-xl px-4 py-3 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-text mb-2">Message</label>
          <textarea
            required
            rows={4}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full border border-border rounded-xl px-4 py-3 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-text mb-2 flex items-center gap-2">
            <Calendar className="w-4 h-4" /> Schedule (optional)
          </label>
          <input
            type="datetime-local"
            value={scheduleAt}
            onChange={(e) => setScheduleAt(e.target.value)}
            className="w-full border border-border rounded-xl px-4 py-3 text-sm"
          />
        </div>

        <button
          type="submit"
          disabled={sending}
          className="bg-primary text-white font-black px-8 py-3 rounded-xl disabled:opacity-60"
        >
          {sending ? "Sending…" : scheduleAt ? "Schedule Push Notification" : "Send Push Notification"}
        </button>

        {result ? <p className="text-sm font-bold text-foreground">{result}</p> : null}
      </form>

      <section className="bg-white rounded-3xl border border-border p-6">
        <h2 className="text-lg font-black text-foreground mb-4">Scheduled Campaigns</h2>
        <div className="space-y-3 max-h-80 overflow-y-auto">
          {scheduled.map((c) => (
            <div key={c.id} className="border border-border rounded-xl px-4 py-3 flex justify-between gap-4">
              <div>
                <p className="font-bold text-foreground">{c.subject || c.name}</p>
                <p className="text-xs text-gray-text">{c.message}</p>
              </div>
              <div className="text-right shrink-0">
                <span className={`text-xs font-bold uppercase ${
                  c.status === "sent" ? "text-emerald-600" : c.status === "scheduled" ? "text-amber-600" : "text-[#9CA3AF]"
                }`}>
                  {c.status}
                </span>
                {c.scheduled_at ? (
                  <p className="text-[10px] text-[#9CA3AF]">{new Date(c.scheduled_at).toLocaleString()}</p>
                ) : null}
              </div>
            </div>
          ))}
          {!scheduled.length ? (
            <p className="text-sm text-[#9CA3AF] text-center py-6">No scheduled campaigns yet.</p>
          ) : null}
        </div>
      </section>
    </div>
  );
}
