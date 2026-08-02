"use client";

import { useMemo, useState } from "react";
import { mutate } from "swr";
import AdminShell from "@/components/admin/AdminShell";
import { useAdminList } from "@/hooks/useAdminData";
import { adminPatch, formatDate } from "@/services/adminApi";
import { Search } from "lucide-react";

type TicketStatus = "open" | "pending" | "resolved" | "closed";

type Ticket = {
  id: string;
  partner_id: string;
  partner_name?: string;
  partner_email?: string;
  partner_phone?: string;
  subject: string;
  description: string;
  status: TicketStatus;
  admin_reply: string | null;
  created_at: string;
  updated_at: string;
};

type TicketsResponse = {
  tickets: Ticket[];
  pagination: { page: number; limit: number; total: number; total_pages: number };
};

const STATUS_STYLES: Record<TicketStatus, string> = {
  open: "bg-amber-50 text-amber-600",
  pending: "bg-blue-50 text-blue-600",
  resolved: "bg-green-50 text-green-600",
  closed: "bg-gray-100 text-gray-500",
};

export default function AdminDeliverySupportPage() {
  const [status, setStatus] = useState<"" | TicketStatus>("");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(1);
  const [replies, setReplies] = useState<Record<string, string>>({});
  const [processingId, setProcessingId] = useState<string | null>(null);

  const path = useMemo(() => {
    const q = new URLSearchParams();
    if (status) q.set("status", status);
    if (search) q.set("search", search);
    q.set("page", String(page));
    q.set("limit", "20");
    return `/api/admin/delivery/support?${q.toString()}`;
  }, [status, search, page]);

  const { data, isLoading } = useAdminList<TicketsResponse>(path);
  const tickets = data?.tickets || [];
  const pagination = data?.pagination;
  const refresh = () => mutate(path);

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput.trim());
    setPage(1);
  };

  const act = async (id: string, body: { admin_reply?: string; status?: TicketStatus }) => {
    setProcessingId(id);
    try {
      await adminPatch(`/api/admin/delivery/support/${id}`, body);
      setReplies((r) => ({ ...r, [id]: "" }));
      refresh();
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <AdminShell title="Delivery Support">
      <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-foreground">Delivery Support Tickets</h1>
          <p className="text-gray-text">Review, reply to, and close delivery partner support tickets.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <form onSubmit={submitSearch} className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-4 h-4 text-[#9CA3AF] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search subject, partner…"
                className="bg-white border border-border rounded-xl pl-9 pr-3 py-2.5 text-sm w-56"
              />
            </div>
            <button type="submit" className="text-xs font-bold border border-border px-3 py-2.5 rounded-xl">
              Search
            </button>
          </form>
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value as "" | TicketStatus);
              setPage(1);
            }}
            className="bg-white border border-border rounded-xl px-4 py-2.5 text-sm"
          >
            <option value="">All Statuses</option>
            <option value="open">Open</option>
            <option value="pending">Pending</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>
        </div>
      </div>

      {isLoading && <p className="text-sm text-gray-text mb-4">Loading…</p>}

      <div className="space-y-4">
        {tickets.map((t) => (
          <div key={t.id} className="bg-white border border-border rounded-2xl p-5">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <p className="font-black text-foreground">{t.subject}</p>
                <p className="text-xs text-gray-text mt-0.5">
                  {t.partner_name || "Partner"} · {t.partner_email} · {formatDate(t.created_at)}
                </p>
              </div>
              <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full ${STATUS_STYLES[t.status]}`}>
                {t.status}
              </span>
            </div>

            <p className="text-sm text-gray-text mt-3">{t.description}</p>

            {t.admin_reply && (
              <div className="mt-3 bg-section rounded-xl px-3 py-2">
                <p className="text-[10px] font-bold uppercase tracking-wide text-[#9CA3AF] mb-0.5">Current Reply</p>
                <p className="text-sm text-foreground">{t.admin_reply}</p>
              </div>
            )}

            {t.status !== "closed" && (
              <div className="mt-4 flex flex-col sm:flex-row gap-2">
                <textarea
                  value={replies[t.id] || ""}
                  onChange={(e) => setReplies((r) => ({ ...r, [t.id]: e.target.value }))}
                  placeholder="Write a reply…"
                  rows={2}
                  className="flex-1 border border-border rounded-xl px-3 py-2 text-sm resize-none"
                />
                <div className="flex sm:flex-col gap-2 shrink-0">
                  <button
                    type="button"
                    disabled={processingId === t.id || !(replies[t.id] || "").trim()}
                    onClick={() => act(t.id, { admin_reply: replies[t.id] })}
                    className="text-xs font-bold bg-primary text-white px-3 py-2 rounded-lg disabled:opacity-50"
                  >
                    Reply
                  </button>
                  <button
                    type="button"
                    disabled={processingId === t.id}
                    onClick={() => act(t.id, { admin_reply: replies[t.id] || undefined, status: "resolved" })}
                    className="text-xs font-bold bg-green-500 text-white px-3 py-2 rounded-lg disabled:opacity-50"
                  >
                    Resolve
                  </button>
                  <button
                    type="button"
                    disabled={processingId === t.id}
                    onClick={() => act(t.id, { admin_reply: replies[t.id] || undefined, status: "closed" })}
                    className="text-xs font-bold bg-gray-500 text-white px-3 py-2 rounded-lg disabled:opacity-50"
                  >
                    Close Ticket
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}

        {!tickets.length && !isLoading && (
          <div className="bg-white border border-border rounded-2xl py-16 text-center text-[#9CA3AF]">
            No support tickets found.
          </div>
        )}
      </div>

      {pagination && pagination.total_pages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-xs text-gray-text">
            Page {pagination.page} of {pagination.total_pages} · {pagination.total} tickets
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="text-xs font-bold border border-border px-3 py-1.5 rounded-lg disabled:opacity-40"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={page >= pagination.total_pages}
              onClick={() => setPage((p) => Math.min(pagination.total_pages, p + 1))}
              className="text-xs font-bold border border-border px-3 py-1.5 rounded-lg disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </AdminShell>
  );
}
