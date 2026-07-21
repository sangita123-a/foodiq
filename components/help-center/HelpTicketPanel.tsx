"use client";

import { FormEvent, useEffect, useState } from "react";
import { Ticket } from "lucide-react";
import { createTicket, fetchMyTickets, rateTicket, type SupportTicket } from "@/services/helpCenterApi";
import { useToast } from "@/contexts/ToastContext";
import { useAuthToken } from "@/hooks/useAuthToken";

const CATEGORIES = [
  "Order Issue",
  "Payment Issue",
  "Refund",
  "Restaurant Complaint",
  "Delivery Complaint",
  "Technical Issue",
  "General Query",
];

type Props = {
  aiSessionId?: string;
};

export default function HelpTicketPanel({ aiSessionId }: Props) {
  const hasToken = useAuthToken();
  const { showToast } = useToast();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [form, setForm] = useState({ category: CATEGORIES[0], subject: "", description: "" });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (hasToken) fetchMyTickets().then(setTickets).catch(() => {});
  }, [hasToken]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!hasToken) return;
    setBusy(true);
    try {
      const t = await createTicket({ ...form, session_id: aiSessionId });
      setTickets((prev) => [t, ...prev]);
      setForm({ category: CATEGORIES[0], subject: "", description: "" });
      showToast("Support ticket created!", "success");
    } catch {
      showToast("Failed to create ticket", "error");
    } finally {
      setBusy(false);
    }
  };

  if (!hasToken) {
    return (
      <div className="bg-white rounded-3xl border border-border p-8 text-center">
        <p className="text-gray-text">Sign in to create and track support tickets.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <form onSubmit={submit} className="bg-white rounded-3xl border border-border p-6 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Ticket className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-black text-foreground">Create Ticket</h2>
        </div>
        <select
          value={form.category}
          onChange={(e) => setForm({ ...form, category: e.target.value })}
          className="w-full border border-border rounded-xl px-4 py-3 text-sm"
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <input
          value={form.subject}
          onChange={(e) => setForm({ ...form, subject: e.target.value })}
          placeholder="Subject"
          required
          className="w-full border border-border rounded-xl px-4 py-3 text-sm"
        />
        <textarea
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          placeholder="Describe your issue…"
          required
          rows={4}
          className="w-full border border-border rounded-xl px-4 py-3 text-sm"
        />
        <button type="submit" disabled={busy} className="w-full bg-primary text-white font-black py-3 rounded-xl">
          {busy ? "Submitting…" : "Submit Ticket"}
        </button>
      </form>

      <div className="bg-white rounded-3xl border border-border p-6">
        <h2 className="text-lg font-black text-foreground mb-4">Your Tickets</h2>
        <div className="space-y-3 max-h-80 overflow-y-auto custom-scrollbar">
          {tickets.map((t) => (
            <div key={t.id} className="border border-border rounded-xl p-4">
              <div className="flex justify-between items-start gap-2 mb-1">
                <p className="font-bold text-sm text-foreground">{t.subject}</p>
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-section text-gray-text">
                  {t.status}
                </span>
              </div>
              <p className="text-xs text-[#9CA3AF] mb-2">{t.category}</p>
              {!t.satisfaction_score && t.status === "Resolved" && (
                <div className="flex gap-1 mt-2">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => rateTicket(t.id, s).then(() => fetchMyTickets().then(setTickets))}
                      className="text-lg hover:scale-110 transition"
                    >
                      ★
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
          {!tickets.length && <p className="text-sm text-gray-text">No tickets yet.</p>}
        </div>
      </div>
    </div>
  );
}
