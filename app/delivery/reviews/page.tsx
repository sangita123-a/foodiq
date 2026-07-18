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

export default function DeliveryReviewsPage() {
  const [rating, setRating] = useState<number | null>(null);
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api.get("/api/delivery/me/reviews");
        if (cancelled) return;
        setRating(
          res.data?.data?.rating != null
            ? Number(res.data.data.rating)
            : null
        );
        setReviews(res.data?.data?.reviews || []);
      } catch (e) {
        console.error(e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

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
        </div>
      </div>
    </DeliveryShell>
  );
}
