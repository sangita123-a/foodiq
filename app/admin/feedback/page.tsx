"use client";

import { useCallback, useEffect, useState } from "react";
import AdminShell from "@/components/admin/AdminShell";
import { getAccessToken } from "@/lib/accessToken";
import {
  adminPut,
  fetchAdminReviews,
  fetchFeedbackInbox,
  formatDate,
  type FeedbackInbox,
} from "@/services/adminApi";
import { MessageSquare, RefreshCw } from "lucide-react";

type Tab = "product" | "support" | "contact" | "reviews";

export default function AdminFeedbackPage() {
  const [tab, setTab] = useState<Tab>("product");
  const [inbox, setInbox] = useState<FeedbackInbox | null>(null);
  const [reviews, setReviews] = useState<Array<Record<string, unknown>>>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!getAccessToken()) return;
    setLoading(true);
    try {
      if (tab === "reviews") {
        setReviews(await fetchAdminReviews());
      } else {
        setInbox(await fetchFeedbackInbox("all"));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => {
    void load();
  }, [load]);

  const patchProduct = async (id: string, status: string) => {
    await adminPut(`/api/admin/feedback/product/${id}`, { status });
    await load();
  };
  const patchSupport = async (id: string, status: string) => {
    await adminPut(`/api/admin/feedback/support/${id}`, { status });
    await load();
  };
  const patchContact = async (id: string, status: string) => {
    await adminPut(`/api/admin/feedback/contact/${id}`, { status });
    await load();
  };
  const patchReview = async (id: string, status: string) => {
    await adminPut(`/api/admin/reviews/${id}`, { status });
    await load();
  };

  const tabs: { id: Tab; label: string }[] = [
    { id: "product", label: "Product" },
    { id: "support", label: "Support" },
    { id: "contact", label: "Contact" },
    { id: "reviews", label: "Reviews" },
  ];

  return (
    <AdminShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-black text-[#111827] flex items-center gap-2">
              <MessageSquare className="w-6 h-6 text-[#FC8019]" /> Feedback
            </h1>
            <p className="text-sm text-[#6B7280] mt-1">
              Product feedback, support tickets, contact messages, and review moderation.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void load()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-[#E5E7EB] text-sm font-bold text-[#6B7280] hover:text-[#111827]"
          >
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`px-4 py-2 rounded-xl text-sm font-bold ${
                tab === t.id
                  ? "bg-[#FC8019] text-white"
                  : "bg-white border border-[#E5E7EB] text-[#6B7280]"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="bg-white rounded-3xl border border-[#E5E7EB] overflow-hidden">
          {loading ? (
            <div className="p-8 text-sm text-[#6B7280]">Loading…</div>
          ) : tab === "product" ? (
            <FeedbackTable
              rows={(inbox?.product || []) as Array<Record<string, unknown>>}
              columns={["category", "message", "status", "created_at"]}
              onStatus={(id, s) => void patchProduct(id, s)}
            />
          ) : tab === "support" ? (
            <FeedbackTable
              rows={(inbox?.support || []) as Array<Record<string, unknown>>}
              columns={["category", "subject", "status", "created_at"]}
              onStatus={(id, s) => void patchSupport(id, s)}
            />
          ) : tab === "contact" ? (
            <FeedbackTable
              rows={(inbox?.contact || []) as Array<Record<string, unknown>>}
              columns={["name", "email", "reason", "subject", "status", "created_at"]}
              onStatus={(id, s) => void patchContact(id, s)}
            />
          ) : (
            <div className="divide-y divide-[#E5E7EB]">
              {reviews.length === 0 && (
                <p className="p-6 text-sm text-[#6B7280]">No reviews yet.</p>
              )}
              {reviews.map((r) => (
                <div key={String(r.id)} className="p-5 flex flex-col md:flex-row md:items-center gap-4 justify-between">
                  <div>
                    <p className="font-bold text-[#111827]">
                      {String(r.restaurant_name || "Restaurant")} · {String(r.rating)}★
                    </p>
                    <p className="text-sm text-[#6B7280] mt-1">
                      {String(r.full_name || "User")}: {String(r.comment || "—")}
                    </p>
                    <p className="text-xs text-[#9CA3AF] mt-1">
                      {formatDate(String(r.created_at || ""))} · {String(r.status || "visible")}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => void patchReview(String(r.id), "visible")}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700"
                    >
                      Visible
                    </button>
                    <button
                      type="button"
                      onClick={() => void patchReview(String(r.id), "hidden")}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold bg-red-50 text-red-600"
                    >
                      Hide
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminShell>
  );
}

function FeedbackTable({
  rows,
  columns,
  onStatus,
}: {
  rows: Array<Record<string, unknown>>;
  columns: string[];
  onStatus: (id: string, status: string) => void;
}) {
  if (!rows.length) {
    return <p className="p-6 text-sm text-[#6B7280]">No items.</p>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="bg-[#F8FAFC] text-[#6B7280] text-xs uppercase tracking-wider">
          <tr>
            {columns.map((c) => (
              <th key={c} className="px-4 py-3 font-bold">
                {c.replace(/_/g, " ")}
              </th>
            ))}
            <th className="px-4 py-3 font-bold">Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={String(row.id)} className="border-t border-[#E5E7EB]">
              {columns.map((c) => (
                <td key={c} className="px-4 py-3 text-[#111827] max-w-xs truncate">
                  {c === "created_at"
                    ? formatDate(String(row[c] || ""))
                    : String(row[c] ?? "—")}
                </td>
              ))}
              <td className="px-4 py-3">
                <button
                  type="button"
                  onClick={() => onStatus(String(row.id), "resolved")}
                  className="text-xs font-bold text-[#FC8019] hover:underline"
                >
                  Mark resolved
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
