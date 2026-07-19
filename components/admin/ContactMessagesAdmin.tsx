"use client";

import { useState } from "react";
import { adminDelete, adminPut } from "@/services/adminApi";
import { formatDate } from "@/services/adminApi";
import { getAccessToken } from "@/lib/accessToken";

type Row = Record<string, unknown>;

export default function ContactMessagesAdmin({
  rows,
  onRefresh,
}: {
  rows: Row[];
  onRefresh: () => void;
}) {
  const [replyId, setReplyId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");

  const patch = async (id: string, status: string) => {
    await adminPut(`/api/admin/feedback/contact/${id}`, { status, is_read: status === "read" });
    onRefresh();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this message?")) return;
    await adminDelete(`/api/admin/feedback/contact/${id}`);
    onRefresh();
  };

  const sendReply = async (id: string) => {
    if (!replyText.trim()) return;
    await adminPut(`/api/admin/feedback/contact/${id}/reply`, { admin_reply: replyText.trim() });
    setReplyId(null);
    setReplyText("");
    onRefresh();
  };

  const exportCsv = async () => {
    const token = getAccessToken();
    const base = process.env.NEXT_PUBLIC_API_URL || "https://foodiq-2.onrender.com";
    const res = await fetch(`${base}/api/admin/feedback/contact/export`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      credentials: "include",
    });
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "contact-messages.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!rows.length) {
    return <p className="p-6 text-sm text-[#555555]">No contact messages yet.</p>;
  }

  return (
    <div>
      <div className="flex justify-end border-b border-[#E5E7EB] p-4">
        <button
          type="button"
          onClick={exportCsv}
          className="rounded-xl border border-[#E5E7EB] px-4 py-2 text-xs font-bold text-[#555555] hover:text-[#222222]"
        >
          Export CSV
        </button>
      </div>
      <div className="divide-y divide-[#E5E7EB]">
        {rows.map((row) => {
          const id = String(row.id);
          const isOpenReply = replyId === id;
          return (
            <div key={id} className="p-5">
              <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-[#222222]">
                    {String(row.name)} · {String(row.email)}
                  </p>
                  <p className="mt-1 text-sm text-[#555555]">
                    {String(row.subject)} · {String(row.reason || "General")}
                  </p>
                  <p className="mt-2 text-sm text-[#222222]">{String(row.message)}</p>
                  {row.admin_reply ? (
                    <p className="mt-2 rounded-lg bg-[#F0FDF4] p-3 text-sm text-[#166534]">
                      Reply: {String(row.admin_reply)}
                    </p>
                  ) : null}
                  <p className="mt-2 text-xs text-[#888888]">
                    {formatDate(String(row.created_at || ""))} · {String(row.status || "open")}
                    {row.is_read ? " · read" : ""}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={() => patch(id, "read")} className="rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700">
                    Mark Read
                  </button>
                  <button type="button" onClick={() => setReplyId(isOpenReply ? null : id)} className="rounded-lg bg-[#E23744]/10 px-3 py-1.5 text-xs font-bold text-[#E23744]">
                    Reply
                  </button>
                  <button type="button" onClick={() => remove(id)} className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-bold text-red-600">
                    Delete
                  </button>
                </div>
              </div>
              {isOpenReply && (
                <div className="mt-4 flex gap-2">
                  <input
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Type your reply…"
                    className="flex-1 rounded-xl border border-[#E5E7EB] px-3 py-2 text-sm"
                  />
                  <button type="button" onClick={() => sendReply(id)} className="rounded-xl bg-[#E23744] px-4 py-2 text-xs font-bold text-white">
                    Send Reply
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
