"use client";

import { useEffect, useState } from "react";
import { Star, Search } from "lucide-react";
import DeliveryShell from "@/components/delivery/DeliveryShell";
import api from "@/services/api";

type ReviewRow = {
  id: string;
  rating: number;
  review?: string | null;
  customer_name?: string;
  created_at?: string;
};

type Breakdown = { star: number; count: number };

const PAGE_LIMIT = 20;

export default function DeliveryReviewsPage() {
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [breakdown, setBreakdown] = useState<Breakdown[]>([]);
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          page: String(page),
          limit: String(PAGE_LIMIT),
        });
        if (search) params.set("search", search);

        const res = await api.get(`/api/delivery/me/partner-reviews?${params.toString()}`);
        if (cancelled) return;
        const data = res.data?.data;
        setAverageRating(Number(data?.average_rating) || 0);
        setTotalReviews(Number(data?.total_reviews) || 0);
        setBreakdown(Array.isArray(data?.breakdown) ? data.breakdown : []);
        setReviews(Array.isArray(data?.reviews) ? data.reviews : []);
        setTotalPages(Number(data?.pagination?.total_pages) || 1);
      } catch (e) {
        console.error(e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [page, search]);

  const maxCount = Math.max(1, ...breakdown.map((b) => b.count));

  return (
    <DeliveryShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-black text-foreground">Your ratings & reviews</h1>
          <p className="text-sm text-gray-text mt-1">
            Feedback customers left after completed deliveries.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-3xl border border-border p-6 flex items-center gap-4">
            <Star className="w-10 h-10 fill-yellow-400 text-yellow-400 shrink-0" />
            <div>
              <p className="text-xs font-bold text-gray-text uppercase tracking-wider">
                Average rating
              </p>
              <p className="text-3xl font-black text-foreground">
                {averageRating > 0 ? averageRating.toFixed(1) : "—"}
              </p>
              <p className="text-xs text-[#9CA3AF] mt-1">{totalReviews} reviews</p>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-border p-6">
            <p className="text-xs font-bold text-gray-text uppercase tracking-wider mb-3">
              Rating breakdown
            </p>
            <div className="space-y-1.5">
              {breakdown.map((b) => (
                <div key={b.star} className="flex items-center gap-2 text-xs">
                  <span className="w-8 font-bold text-gray-text shrink-0">{b.star}★</span>
                  <div className="flex-1 h-2 rounded-full bg-section overflow-hidden">
                    <div
                      className="h-full bg-yellow-400 rounded-full"
                      style={{ width: `${(b.count / maxCount) * 100}%` }}
                    />
                  </div>
                  <span className="w-6 text-right text-[#9CA3AF] shrink-0">{b.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="relative">
          <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search reviews by customer or keyword…"
            className="w-full bg-white border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm"
          />
        </div>

        <div className="bg-white rounded-3xl border border-border overflow-hidden">
          {loading ? (
            <p className="p-6 text-sm text-gray-text">Loading…</p>
          ) : reviews.length === 0 ? (
            <p className="p-6 text-sm text-gray-text">No delivery reviews found.</p>
          ) : (
            <ul className="divide-y divide-[#E5E7EB]">
              {reviews.map((r) => (
                <li key={r.id} className="p-5">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-bold text-foreground">
                      {r.customer_name || "Customer"}
                    </p>
                    <span className="flex items-center gap-1 text-sm font-bold text-yellow-500">
                      <Star className="w-4 h-4 fill-current" />
                      {r.rating}
                    </span>
                  </div>
                  <p className="text-sm text-gray-text mt-2">
                    {r.review || "No comment."}
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
          {totalPages > 1 && (
            <div className="flex justify-between gap-2 px-5 py-4 border-t border-border">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="text-xs font-bold border border-border px-3 py-1.5 rounded-lg disabled:opacity-40"
              >
                Previous
              </button>
              <span className="text-xs text-gray-text">
                Page {page} / {totalPages}
              </span>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="text-xs font-bold border border-border px-3 py-1.5 rounded-lg disabled:opacity-40"
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
