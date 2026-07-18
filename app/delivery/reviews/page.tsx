"use client";

import { useEffect, useState } from "react";
import { Star } from "lucide-react";
import DeliveryShell from "@/components/delivery/DeliveryShell";
import api from "@/services/api";

type ReviewRow = {
  id: string;
  rating: number;
  comment?: string;
  full_name?: string;
  created_at?: string;
};

const PAGE = 20;

export default function DeliveryReviewsPage() {
  const [rating, setRating] = useState<number | null>(null);
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await api.get(
          `/api/delivery/me/reviews?limit=${PAGE}&offset=${page * PAGE}`
        );
        if (cancelled) return;
        const data = res.data?.data;
        setRating(
          data?.rating != null
            ? Number(data.rating)
            : data?.avg_rating != null
              ? Number(data.avg_rating)
              : null
        );
        setReviews(data?.reviews || []);
        setTotal(Number(data?.total) || 0);
      } catch (e) {
        console.error(e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [page]);

  const pages = Math.max(1, Math.ceil(total / PAGE));

  return (
    <DeliveryShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-black text-[#111827]">Your ratings</h1>
          <p className="text-sm text-[#6B7280] mt-1">
            Feedback from customers after completed deliveries.
          </p>
        </div>

        <div className="bg-white rounded-3xl border border-[#E5E7EB] p-6 flex items-center gap-3">
          <Star className="w-8 h-8 fill-yellow-400 text-yellow-400" />
          <div>
            <p className="text-xs font-bold text-[#6B7280] uppercase tracking-wider">
              Average rating
            </p>
            <p className="text-3xl font-black text-[#111827]">
              {rating != null ? rating.toFixed(1) : "—"}
            </p>
            <p className="text-xs text-[#9CA3AF] mt-1">{total} reviews</p>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-[#E5E7EB] overflow-hidden">
          {loading ? (
            <p className="p-6 text-sm text-[#6B7280]">Loading…</p>
          ) : reviews.length === 0 ? (
            <p className="p-6 text-sm text-[#6B7280]">No delivery reviews yet.</p>
          ) : (
            <ul className="divide-y divide-[#E5E7EB]">
              {reviews.map((r) => (
                <li key={r.id} className="p-5">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-bold text-[#111827]">
                      {r.full_name || "Customer"}
                    </p>
                    <span className="flex items-center gap-1 text-sm font-bold text-yellow-500">
                      <Star className="w-4 h-4 fill-current" />
                      {r.rating}
                    </span>
                  </div>
                  <p className="text-sm text-[#6B7280] mt-2">
                    {r.comment || "No comment."}
                  </p>
                  {r.created_at && (
                    <p className="text-xs text-[#9CA3AF] mt-2">
                      {new Date(r.created_at).toLocaleString("en-IN")}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
          {total > PAGE && (
            <div className="flex justify-between gap-2 px-5 py-4 border-t border-[#E5E7EB]">
              <button
                type="button"
                disabled={page <= 0}
                onClick={() => setPage((p) => p - 1)}
                className="text-xs font-bold border border-[#E5E7EB] px-3 py-1.5 rounded-lg disabled:opacity-40"
              >
                Previous
              </button>
              <span className="text-xs text-[#6B7280]">
                Page {page + 1} / {pages}
              </span>
              <button
                type="button"
                disabled={page + 1 >= pages}
                onClick={() => setPage((p) => p + 1)}
                className="text-xs font-bold border border-[#E5E7EB] px-3 py-1.5 rounded-lg disabled:opacity-40"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </DeliveryShell>
  );
}
