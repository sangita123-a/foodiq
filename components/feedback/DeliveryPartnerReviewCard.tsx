"use client";

import { useEffect, useState } from "react";
import { Star, Bike } from "lucide-react";
import api from "@/services/api";
import { useToast } from "@/contexts/ToastContext";

type PartnerReview = {
  id: string;
  rating: number;
  review: string | null;
  created_at: string;
};

type Props = {
  orderId: string;
};

export default function DeliveryPartnerReviewCard({ orderId }: Props) {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [review, setReview] = useState<PartnerReview | null>(null);
  const [rating, setRating] = useState(5);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [noPartner, setNoPartner] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api.get(`/api/orders/${orderId}/review`);
        if (cancelled) return;
        const d = res.data?.data;
        if (d?.reviewed && d.review) {
          setReview(d.review);
        } else if (!d?.can_review) {
          setNoPartner(true);
        }
      } catch {
        /* form still usable */
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [orderId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setNoPartner(false);
      const res = await api.post(`/api/orders/${orderId}/review`, {
        rating,
        review: text.trim() || undefined,
      });
      setReview(res.data?.data);
      showToast("Thanks for rating your delivery partner!", "success");
    } catch (err: unknown) {
      const response = (err as { response?: { status?: number; data?: { message?: string } } })
        ?.response;
      const msg = response?.data?.message || "Failed to submit review";
      if (response?.status === 404) setNoPartner(true);
      showToast(msg, "error");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="mt-6 bg-white rounded-3xl border border-border p-6 md:p-8 animate-pulse h-40" />
    );
  }

  if (noPartner) return null;

  return (
    <div className="mt-6 bg-white rounded-3xl border border-border p-6 md:p-8">
      <h2 className="text-xl font-black text-foreground mb-1 flex items-center gap-2">
        <Bike className="w-5 h-5 text-primary" />
        Rate your delivery partner
      </h2>
      <p className="text-sm text-gray-text mb-6">
        Your rating helps us recognize great delivery partners.
      </p>

      {review ? (
        <div className="rounded-2xl bg-emerald-50 border border-emerald-100 px-4 py-4">
          <div className="flex items-center gap-1 mb-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <Star
                key={n}
                className={`w-5 h-5 ${
                  n <= review.rating ? "fill-yellow-400 text-yellow-400" : "text-[#D1D5DB]"
                }`}
              />
            ))}
          </div>
          {review.review && (
            <p className="text-sm text-emerald-900">{review.review}</p>
          )}
          <p className="text-xs text-emerald-700 mt-2 font-bold">You already reviewed this delivery.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="flex items-center gap-1 flex-wrap">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setRating(n)}
                className="p-1"
                aria-label={`${n} stars`}
              >
                <Star
                  className={`w-8 h-8 ${
                    n <= rating ? "fill-yellow-400 text-yellow-400" : "text-[#D1D5DB]"
                  }`}
                />
              </button>
            ))}
          </div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={3}
            maxLength={2000}
            placeholder="Write a review about your delivery partner (optional)"
            className="w-full bg-section text-foreground border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary resize-none"
          />
          <button
            type="submit"
            disabled={submitting}
            className="bg-primary hover:bg-primary-hover disabled:opacity-60 text-white px-6 py-3 rounded-xl text-sm font-bold transition-colors"
          >
            {submitting ? "Submitting…" : "Submit review"}
          </button>
        </form>
      )}
    </div>
  );
}
