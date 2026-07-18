"use client";

import { useEffect, useState } from "react";
import { Star } from "lucide-react";
import api from "@/services/api";
import { useToast } from "@/contexts/ToastContext";

type Props = {
  orderId: string;
  hasDeliveryPartner?: boolean;
};

function StarRow({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
  disabled?: boolean;
}) {
  return (
    <div>
      <p className="text-sm font-bold text-[#6B7280] mb-2">{label}</p>
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            disabled={disabled}
            onClick={() => onChange(n)}
            className="p-1 disabled:opacity-60"
            aria-label={`${label} ${n} stars`}
          >
            <Star
              className={`w-7 h-7 ${
                n <= value
                  ? "fill-yellow-400 text-yellow-400"
                  : "text-[#D1D5DB]"
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  );
}

export default function OrderFeedbackForm({
  orderId,
  hasDeliveryPartner = true,
}: Props) {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [restaurantRating, setRestaurantRating] = useState(5);
  const [deliveryRating, setDeliveryRating] = useState(5);
  const [overallRating, setOverallRating] = useState(5);
  const [restaurantComment, setRestaurantComment] = useState("");
  const [deliveryComment, setDeliveryComment] = useState("");
  const [comment, setComment] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api.get(`/api/orders/${orderId}/feedback`);
        if (!cancelled && res.data?.data?.submitted) {
          setSubmitted(true);
          const d = res.data.data;
          if (d.restaurant_review) {
            setRestaurantRating(Number(d.restaurant_review.rating) || 5);
            setRestaurantComment(d.restaurant_review.comment || "");
          }
          if (d.delivery_review) {
            setDeliveryRating(Number(d.delivery_review.rating) || 5);
            setDeliveryComment(d.delivery_review.comment || "");
          }
          if (d.order_feedback) {
            setOverallRating(Number(d.order_feedback.overall_rating) || 5);
            setComment(d.order_feedback.comment || "");
          }
        }
      } catch {
        /* ignore — form still usable */
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
      await api.post(`/api/orders/${orderId}/feedback`, {
        restaurant_rating: restaurantRating,
        restaurant_comment: restaurantComment || undefined,
        delivery_rating: hasDeliveryPartner ? deliveryRating : undefined,
        delivery_comment: hasDeliveryPartner
          ? deliveryComment || undefined
          : undefined,
        overall_rating: overallRating,
        comment: comment || undefined,
      });
      setSubmitted(true);
      showToast("Thanks for your feedback!", "success");
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Failed to submit feedback";
      showToast(msg, "error");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div
        id="feedback"
        className="mt-8 bg-white rounded-3xl border border-[#E5E7EB] p-6 md:p-8 animate-pulse h-48"
      />
    );
  }

  return (
    <div
      id="feedback"
      className="mt-8 bg-white rounded-3xl border border-[#E5E7EB] p-6 md:p-8"
    >
      <h2 className="text-xl font-black text-[#111827] mb-1">
        Rate your order
      </h2>
      <p className="text-sm text-[#6B7280] mb-6">
        Help restaurants and delivery partners improve with your honest rating.
      </p>

      {submitted ? (
        <div className="rounded-2xl bg-emerald-50 border border-emerald-100 px-4 py-3 text-sm font-bold text-emerald-700">
          Feedback submitted. Thank you!
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <StarRow
            label="Restaurant"
            value={restaurantRating}
            onChange={setRestaurantRating}
          />
          <textarea
            value={restaurantComment}
            onChange={(e) => setRestaurantComment(e.target.value)}
            rows={2}
            placeholder="How was the food and restaurant?"
            className="w-full bg-[#F8FAFC] text-[#111827] border border-[#E5E7EB] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#FC8019] resize-none"
          />

          {hasDeliveryPartner && (
            <>
              <StarRow
                label="Delivery partner"
                value={deliveryRating}
                onChange={setDeliveryRating}
              />
              <textarea
                value={deliveryComment}
                onChange={(e) => setDeliveryComment(e.target.value)}
                rows={2}
                placeholder="How was the delivery experience?"
                className="w-full bg-[#F8FAFC] text-[#111827] border border-[#E5E7EB] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#FC8019] resize-none"
              />
            </>
          )}

          <StarRow
            label="Overall order"
            value={overallRating}
            onChange={setOverallRating}
          />
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
            placeholder="Any other feedback about this order?"
            className="w-full bg-[#F8FAFC] text-[#111827] border border-[#E5E7EB] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#FC8019] resize-none"
          />

          <button
            type="submit"
            disabled={submitting}
            className="bg-[#FC8019] hover:bg-[#E76F0B] disabled:opacity-60 text-white px-6 py-3 rounded-xl text-sm font-bold transition-colors"
          >
            {submitting ? "Submitting…" : "Submit feedback"}
          </button>
        </form>
      )}
    </div>
  );
}
