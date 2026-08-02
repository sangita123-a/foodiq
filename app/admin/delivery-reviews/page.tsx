"use client";

import { useEffect, useMemo, useState } from "react";
import { mutate } from "swr";
import { Star, Trash2 } from "lucide-react";
import AdminShell from "@/components/admin/AdminShell";
import { useAdminList } from "@/hooks/useAdminData";
import {
  adminDelete,
  adminGet,
  formatDate,
  type AdminDeliveryPartnerReview,
  type AdminDeliveryPartnerReviewsResponse,
  type AdminRatingTrendPoint,
} from "@/services/adminApi";

export default function AdminDeliveryReviewsPage() {
  const [search, setSearch] = useState("");
  const [rating, setRating] = useState("");
  const [page, setPage] = useState(1);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [trends, setTrends] = useState<AdminRatingTrendPoint[]>([]);

  const path = useMemo(() => {
    const q = new URLSearchParams();
    if (search) q.set("search", search);
    if (rating) q.set("rating", rating);
    q.set("page", String(page));
    q.set("limit", "20");
    return `/api/admin/delivery-reviews?${q.toString()}`;
  }, [search, rating, page]);

  const { data, isLoading } = useAdminList<AdminDeliveryPartnerReviewsResponse>(path);
  const reviews = data?.reviews || [];
  const pagination = data?.pagination;
  const refresh = () => mutate(path);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await adminGet<{ trends: AdminRatingTrendPoint[] }>(
          "/api/admin/delivery-reviews/trends?days=30"
        );
        if (!cancelled) setTrends(res.trends || []);
      } catch {
        /* trend chart is supplementary */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleDelete = async (review: AdminDeliveryPartnerReview) => {
    if (!confirm("Delete this review permanently? This cannot be undone.")) return;
    setDeletingId(review.id);
    try {
      await adminDelete(`/api/admin/delivery-reviews/${review.id}`);
      refresh();
    } finally {
      setDeletingId(null);
    }
  };

  const maxCount = Math.max(1, ...trends.map((t) => t.total_reviews));

  return (
    <AdminShell title="Delivery Reviews">
      <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-foreground">Delivery Partner Reviews</h1>
          <p className="text-gray-text">Moderate ratings & reviews left by customers.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search customer, partner, review text…"
            className="bg-white border border-border rounded-xl px-4 py-2.5 text-sm w-64"
          />
          <select
            value={rating}
            onChange={(e) => {
              setRating(e.target.value);
              setPage(1);
            }}
            className="bg-white border border-border rounded-xl px-4 py-2.5 text-sm"
          >
            <option value="">All Ratings</option>
            {[5, 4, 3, 2, 1].map((n) => (
              <option key={n} value={n}>
                {n} Star
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white border border-border rounded-2xl p-6 mb-6">
        <p className="text-xs font-bold text-gray-text uppercase tracking-wider mb-4">
          Rating trend — last 30 days
        </p>
        {trends.length === 0 ? (
          <p className="text-sm text-gray-text">No review activity in this window.</p>
        ) : (
          <div className="flex items-end gap-1 h-32">
            {trends.map((t) => (
              <div
                key={t.day}
                className="flex-1 min-w-[3px] rounded-t-sm bg-primary/70 hover:bg-primary transition-colors"
                style={{ height: `${Math.max(4, (t.total_reviews / maxCount) * 100)}%` }}
                title={`${formatDate(t.day)}: ${t.total_reviews} review(s), avg ${t.average_rating.toFixed(1)}★`}
              />
            ))}
          </div>
        )}
      </div>

      {isLoading && <p className="text-sm text-gray-text mb-4">Loading…</p>}

      <div className="bg-white border border-border rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-section text-left">
              <tr>
                <th className="px-5 py-3 font-bold text-gray-text">Customer</th>
                <th className="px-5 py-3 font-bold text-gray-text">Delivery Partner</th>
                <th className="px-5 py-3 font-bold text-gray-text">Rating</th>
                <th className="px-5 py-3 font-bold text-gray-text">Review</th>
                <th className="px-5 py-3 font-bold text-gray-text">Date</th>
                <th className="px-5 py-3 font-bold text-gray-text">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {reviews.map((r) => (
                <tr key={r.id}>
                  <td className="px-5 py-4">
                    <p className="font-bold text-foreground">{r.customer_name || "Customer"}</p>
                    <p className="text-xs text-gray-text">{r.customer_email}</p>
                  </td>
                  <td className="px-5 py-4">
                    <p className="font-bold text-foreground">{r.partner_name || "Partner"}</p>
                    <p className="text-xs text-gray-text">{r.partner_email}</p>
                  </td>
                  <td className="px-5 py-4">
                    <span className="inline-flex items-center gap-1 font-bold text-yellow-600">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      {r.rating}
                    </span>
                  </td>
                  <td className="px-5 py-4 max-w-xs">
                    <p className="text-gray-text truncate">{r.review || "—"}</p>
                  </td>
                  <td className="px-5 py-4 text-xs text-gray-text">{formatDate(r.created_at)}</td>
                  <td className="px-5 py-4">
                    <button
                      type="button"
                      disabled={deletingId === r.id}
                      onClick={() => handleDelete(r)}
                      className="inline-flex items-center gap-1.5 text-xs font-bold bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-lg disabled:opacity-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!reviews.length && !isLoading && (
          <p className="text-center text-[#9CA3AF] py-16">No reviews found.</p>
        )}
      </div>

      {pagination && pagination.total_pages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-xs text-gray-text">
            Page {pagination.page} of {pagination.total_pages} · {pagination.total} reviews
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
