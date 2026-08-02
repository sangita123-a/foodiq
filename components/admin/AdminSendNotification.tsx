"use client";

import { useState, type FormEvent } from "react";
import { mutate } from "swr";
import { useAdminList } from "@/hooks/useAdminData";
import {
  sendDeliveryPartnerNotification,
  type AdminDeliveryPartnerOption,
} from "@/services/adminApi";
import { NOTIFICATION_TYPES_BY_CATEGORY, getNotificationMeta } from "@/lib/deliveryNotificationTypes";
import type { DeliveryNotificationType } from "@/services/deliveryApi";

type Props = {
  onSent?: () => void;
};

/** Admin form to push a real-time notification to a single delivery partner. */
export default function AdminSendNotification({ onSent }: Props) {
  const { data: partners, isLoading: partnersLoading } = useAdminList<AdminDeliveryPartnerOption[]>(
    "/api/admin/delivery-partners"
  );

  const [partnerId, setPartnerId] = useState("");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [type, setType] = useState<DeliveryNotificationType>("admin_message");
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!partnerId || !title.trim() || !message.trim()) return;

    setSending(true);
    setFeedback(null);
    try {
      await sendDeliveryPartnerNotification({
        partner_id: partnerId,
        title: title.trim(),
        message: message.trim(),
        type,
      });
      setFeedback({ ok: true, text: "Notification delivered in real time." });
      setTitle("");
      setMessage("");
      mutate((key) => typeof key === "string" && key.startsWith("/api/admin/delivery/notifications"));
      onSent?.();
    } catch {
      setFeedback({ ok: false, text: "Failed to send notification. Please try again." });
    } finally {
      setSending(false);
    }
  };

  return (
    <form onSubmit={submit} className="bg-white border border-border rounded-2xl p-6 space-y-4">
      <div>
        <label className="block text-xs font-bold text-gray-text mb-1.5 uppercase tracking-wide">
          Delivery Partner
        </label>
        <select
          value={partnerId}
          onChange={(e) => setPartnerId(e.target.value)}
          required
          disabled={partnersLoading}
          className="w-full border border-border rounded-xl px-3 py-2.5 text-sm bg-white disabled:opacity-60"
        >
          <option value="">{partnersLoading ? "Loading partners…" : "Select a partner…"}</option>
          {(partners || []).map((p) => (
            <option key={p.id} value={p.id}>
              {p.full_name} — {p.email}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs font-bold text-gray-text mb-1.5 uppercase tracking-wide">
          Notification Type
        </label>
        <select
          value={type}
          onChange={(e) => setType(e.target.value as DeliveryNotificationType)}
          className="w-full border border-border rounded-xl px-3 py-2.5 text-sm bg-white"
        >
          {Object.entries(NOTIFICATION_TYPES_BY_CATEGORY).map(([category, types]) => (
            <optgroup key={category} label={category}>
              {types.map((t) => (
                <option key={t} value={t}>
                  {getNotificationMeta(t).label}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs font-bold text-gray-text mb-1.5 uppercase tracking-wide">Title</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          maxLength={255}
          placeholder="e.g. Festive bonus this weekend"
          className="w-full border border-border rounded-xl px-3 py-2.5 text-sm"
        />
      </div>

      <div>
        <label className="block text-xs font-bold text-gray-text mb-1.5 uppercase tracking-wide">Message</label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          required
          rows={4}
          placeholder="Write the notification message…"
          className="w-full border border-border rounded-xl px-3 py-2.5 text-sm resize-none"
        />
      </div>

      {feedback && (
        <p className={`text-sm font-bold ${feedback.ok ? "text-emerald-600" : "text-red-600"}`}>{feedback.text}</p>
      )}

      <button
        type="submit"
        disabled={sending}
        className="w-full bg-primary text-white font-bold py-3 rounded-xl disabled:opacity-50"
      >
        {sending ? "Sending…" : "Send Notification"}
      </button>
    </form>
  );
}
