"use client";

import { useCallback, useEffect, useState } from "react";
import AdminShell from "@/components/admin/AdminShell";
import { getAccessToken } from "@/lib/accessToken";
import {
  adminPut,
  fetchAdminOrderFeedback,
  fetchAdminReviews,
  fetchFeedbackAnalytics,
  fetchFeedbackInbox,
  formatDate,
  type FeedbackInbox,
} from "@/services/adminApi";
import { MessageSquare, RefreshCw } from "lucide-react";

type Tab = "orders" | "analytics" | "product" | "support" | "contact" | "reviews";

const PAGE_SIZE = 20;

export default function AdminFeedbackPage() {
  const [tab, setTab] = useState<Tab>("orders");
  const [inbox, setInbox] = useState<FeedbackInbox | null>(null);
  const [reviews, setReviews] = useState<Array<Record<string, unknown>>>([]);
  const [reviewsTotal, setReviewsTotal] = useState(0);
  const [orderRows, setOrderRows] = useState<Array<Record<string, unknown>>>([]);
  const [orderTotal, setOrderTotal] = useState(0);
  const [analytics, setAnalytics] = useState<Record<string, unknown> | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [filters, setFilters] = useState({
    restaurant_id: "",
    delivery_partner_id: "",
    rating: "",
    from: "",
    to: "",
  });

  const load = useCallback(async () => {
    if (!getAccessToken()) return;
    setLoading(true);
    try {
      if (tab === "orders") {
        const data = await fetchAdminOrderFeedback({
          restaurant_id: filters.restaurant_id || undefined,
          delivery_partner_id: filters.delivery_partner_id || undefined,
          rating: filters.rating || undefined,
          from: filters.from || undefined,
          to: filters.to || undefined,
          limit: PAGE_SIZE,
          offset: page * PAGE_SIZE,
        });
        setOrderRows(data.rows || []);
        setOrderTotal(data.total || 0);
      } else if (tab === "analytics") {
        setAnalytics(await fetchFeedbackAnalytics(30));
      } else if (tab === "reviews") {
        const data = await fetchAdminReviews({
          restaurant_id: filters.restaurant_id || undefined,
          rating: filters.rating || undefined,
          from: filters.from || undefined,
          to: filters.to || undefined,
          limit: PAGE_SIZE,
          offset: page * PAGE_SIZE,
        });
        setReviews(data.rows || []);
        setReviewsTotal(data.total || 0);
      } else {
        setInbox(await fetchFeedbackInbox("all"));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [tab, filters, page]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    setPage(0);
  }, [tab, filters]);

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
    { id: "orders", label: "Order feedback" },
    { id: "analytics", label: "Analytics" },
    { id: "product", label: "Product" },
    { id: "support", label: "Support" },
    { id: "contact", label: "Contact" },
    { id: "reviews", label: "Reviews" },
  ];

  const totalPages = Math.max(
    1,
    Math.ceil(
      (tab === "orders" ? orderTotal : tab === "reviews" ? reviewsTotal : 0) /
        PAGE_SIZE
    )
  );

  const restaurant = analytics?.restaurant as
    | { avg_rating?: number; total?: number }
    | undefined;
  const delivery = analytics?.delivery as
    | { avg_rating?: number; total?: number }
    | undefined;
  const topRestaurants = (analytics?.top_restaurants || []) as Array<{
    name: string;
    review_count: number;
    avg_rating: number;
  }>;
  const topDishes = (analytics?.top_dishes || []) as Array<{
    dish_name: string;
    review_count: number;
    avg_rating: number;
  }>;

  return (
    <AdminShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-black text-[#111827] flex items-center gap-2">
              <MessageSquare className="w-6 h-6 text-[#E23744]" /> Feedback
            </h1>
            <p className="text-sm text-[#6B7280] mt-1">
              Order ratings, analytics, product feedback, and review moderation.
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
                  ? "bg-[#E23744] text-white"
                  : "bg-white border border-[#E5E7EB] text-[#6B7280]"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {(tab === "orders" || tab === "reviews") && (
          <div className="bg-white rounded-3xl border border-[#E5E7EB] p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <input
              value={filters.restaurant_id}
              onChange={(e) =>
                setFilters((f) => ({ ...f, restaurant_id: e.target.value }))
              }
              placeholder="Restaurant ID"
              className="bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl px-3 py-2 text-sm"
            />
            {tab === "orders" && (
              <input
                value={filters.delivery_partner_id}
                onChange={(e) =>
                  setFilters((f) => ({
                    ...f,
                    delivery_partner_id: e.target.value,
                  }))
                }
                placeholder="Delivery partner ID"
                className="bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl px-3 py-2 text-sm"
              />
            )}
            <select
              value={filters.rating}
              onChange={(e) =>
                setFilters((f) => ({ ...f, rating: e.target.value }))
              }
              className="bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl px-3 py-2 text-sm"
            >
              <option value="">All ratings</option>
              {[5, 4, 3, 2, 1].map((n) => (
                <option key={n} value={n}>
                  {n} stars
                </option>
              ))}
            </select>
            <input
              type="date"
              value={filters.from}
              onChange={(e) =>
                setFilters((f) => ({ ...f, from: e.target.value }))
              }
              className="bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl px-3 py-2 text-sm"
            />
            <input
              type="date"
              value={filters.to}
              onChange={(e) =>
                setFilters((f) => ({ ...f, to: e.target.value }))
              }
              className="bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl px-3 py-2 text-sm"
            />
          </div>
        )}

        <div className="bg-white rounded-3xl border border-[#E5E7EB] overflow-hidden">
          {loading ? (
            <div className="p-8 text-sm text-[#6B7280]">Loading…</div>
          ) : tab === "orders" ? (
            <div>
              <div className="divide-y divide-[#E5E7EB]">
                {orderRows.length === 0 && (
                  <p className="p-6 text-sm text-[#6B7280]">
                    No order feedback yet.
                  </p>
                )}
                {orderRows.map((r) => (
                  <div
                    key={String(r.order_id)}
                    className="p-5 flex flex-col md:flex-row md:items-start gap-3 justify-between"
                  >
                    <div>
                      <p className="font-bold text-[#111827]">
                        {String(r.restaurant_name || "Restaurant")}
                        {r.restaurant_rating != null
                          ? ` · ${String(r.restaurant_rating)}★ food`
                          : ""}
                        {r.delivery_rating != null
                          ? ` · ${String(r.delivery_rating)}★ delivery`
                          : ""}
                        {r.overall_rating != null
                          ? ` · ${String(r.overall_rating)}★ overall`
                          : ""}
                      </p>
                      <p className="text-sm text-[#6B7280] mt-1">
                        {String(r.customer_name || "Customer")}
                        {r.delivery_partner_name
                          ? ` · DP: ${String(r.delivery_partner_name)}`
                          : ""}
                      </p>
                      <p className="text-sm text-[#6B7280] mt-1">
                        {String(
                          r.overall_comment ||
                            r.restaurant_comment ||
                            r.delivery_comment ||
                            "—"
                        )}
                      </p>
                      <p className="text-xs text-[#9CA3AF] mt-1">
                        {formatDate(String(r.feedback_at || ""))} · Order{" "}
                        {String(r.order_id).slice(0, 8)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <Pagination
                page={page}
                totalPages={totalPages}
                total={orderTotal}
                onPage={setPage}
              />
            </div>
          ) : tab === "analytics" ? (
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  {
                    label: "Avg restaurant rating",
                    value: restaurant?.avg_rating ?? "—",
                  },
                  {
                    label: "Avg delivery rating",
                    value: delivery?.avg_rating ?? "—",
                  },
                  {
                    label: "CSAT score",
                    value:
                      analytics?.csat_score != null
                        ? `${analytics.csat_score}%`
                        : "—",
                  },
                  {
                    label: "Reviews (30d)",
                    value: restaurant?.total ?? "—",
                  },
                ].map((k) => (
                  <div
                    key={k.label}
                    className="rounded-2xl border border-[#E5E7EB] p-4"
                  >
                    <p className="text-xs font-bold text-[#9CA3AF] uppercase">
                      {k.label}
                    </p>
                    <p className="text-2xl font-black text-[#111827] mt-1">
                      {String(k.value)}
                    </p>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-bold mb-3">Most reviewed restaurants</h3>
                  <div className="space-y-2">
                    {topRestaurants.map((r) => (
                      <div
                        key={r.name}
                        className="flex justify-between text-sm border-b border-[#E5E7EB] py-2"
                      >
                        <span className="font-bold">{r.name}</span>
                        <span className="text-[#6B7280]">
                          {r.review_count} · {r.avg_rating}★
                        </span>
                      </div>
                    ))}
                    {!topRestaurants.length && (
                      <p className="text-sm text-[#6B7280]">No data yet.</p>
                    )}
                  </div>
                </div>
                <div>
                  <h3 className="font-bold mb-3">Most reviewed dishes</h3>
                  <div className="space-y-2">
                    {topDishes.map((d) => (
                      <div
                        key={d.dish_name}
                        className="flex justify-between text-sm border-b border-[#E5E7EB] py-2"
                      >
                        <span className="font-bold">{d.dish_name}</span>
                        <span className="text-[#6B7280]">
                          {d.review_count} · {d.avg_rating}★
                        </span>
                      </div>
                    ))}
                    {!topDishes.length && (
                      <p className="text-sm text-[#6B7280]">No data yet.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
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
              columns={[
                "name",
                "email",
                "reason",
                "subject",
                "status",
                "created_at",
              ]}
              onStatus={(id, s) => void patchContact(id, s)}
            />
          ) : (
            <div>
              <div className="divide-y divide-[#E5E7EB]">
                {reviews.length === 0 && (
                  <p className="p-6 text-sm text-[#6B7280]">No reviews yet.</p>
                )}
                {reviews.map((r) => (
                  <div
                    key={String(r.id)}
                    className="p-5 flex flex-col md:flex-row md:items-center gap-4 justify-between"
                  >
                    <div>
                      <p className="font-bold text-[#111827]">
                        {String(r.restaurant_name || "Restaurant")} ·{" "}
                        {String(r.rating)}★
                      </p>
                      <p className="text-sm text-[#6B7280] mt-1">
                        {String(r.full_name || "User")}:{" "}
                        {String(r.comment || "—")}
                      </p>
                      <p className="text-xs text-[#9CA3AF] mt-1">
                        {formatDate(String(r.created_at || ""))} ·{" "}
                        {String(r.status || "visible")}
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
              <Pagination
                page={page}
                totalPages={totalPages}
                total={reviewsTotal}
                onPage={setPage}
              />
            </div>
          )}
        </div>
      </div>
    </AdminShell>
  );
}

function Pagination({
  page,
  totalPages,
  total,
  onPage,
}: {
  page: number;
  totalPages: number;
  total: number;
  onPage: (p: number) => void;
}) {
  if (total <= PAGE_SIZE) return null;
  return (
    <div className="flex items-center justify-between gap-3 px-5 py-4 border-t border-[#E5E7EB] flex-wrap">
      <p className="text-xs text-[#6B7280]">
        {total} total · Page {page + 1} / {totalPages}
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          disabled={page <= 0}
          onClick={() => onPage(page - 1)}
          className="px-3 py-1.5 rounded-lg text-xs font-bold border border-[#E5E7EB] disabled:opacity-40"
        >
          Previous
        </button>
        <button
          type="button"
          disabled={page + 1 >= totalPages}
          onClick={() => onPage(page + 1)}
          className="px-3 py-1.5 rounded-lg text-xs font-bold border border-[#E5E7EB] disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </div>
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
                <td
                  key={c}
                  className="px-4 py-3 text-[#111827] max-w-xs truncate"
                >
                  {c === "created_at"
                    ? formatDate(String(row[c] || ""))
                    : String(row[c] ?? "—")}
                </td>
              ))}
              <td className="px-4 py-3">
                <button
                  type="button"
                  onClick={() => onStatus(String(row.id), "resolved")}
                  className="text-xs font-bold text-[#E23744] hover:underline"
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
