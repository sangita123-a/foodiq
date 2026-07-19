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
      <div className="flex items-center gap-1 flex-wrap">
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
  const [editing, setEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [restaurantRating, setRestaurantRating] = useState(5);
  const [deliveryRating, setDeliveryRating] = useState(5);
  const [overallRating, setOverallRating] = useState(5);
  const [restaurantComment, setRestaurantComment] = useState("");
  const [deliveryComment, setDeliveryComment] = useState("");
  const [comment, setComment] = useState("");

  const load = async () => {
    const res = await api.get(`/api/orders/${orderId}/feedback`);
    const d = res.data?.data;
    if (d?.submitted) {
      setSubmitted(true);
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
    } else {
      setSubmitted(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await load();
      } catch {
        /* form still usable */
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  const payload = () => ({
    restaurant_rating: restaurantRating,
    restaurant_comment: restaurantComment || undefined,
    delivery_rating: hasDeliveryPartner ? deliveryRating : undefined,
    delivery_comment: hasDeliveryPartner
      ? deliveryComment || undefined
      : undefined,
    overall_rating: overallRating,
    comment: comment || undefined,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      if (submitted) {
        await api.put(`/api/orders/${orderId}/feedback`, payload());
        showToast("Feedback updated", "success");
        setEditing(false);
      } else {
        await api.post(`/api/orders/${orderId}/feedback`, payload());
        setSubmitted(true);
        showToast("Thanks for your feedback!", "success");
      }
      await load();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Failed to save feedback";
      showToast(msg, "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Delete your feedback for this order?")) return;
    try {
      setSubmitting(true);
      await api.delete(`/api/orders/${orderId}/feedback`);
      setSubmitted(false);
      setEditing(false);
      setRestaurantRating(5);
      setDeliveryRating(5);
      setOverallRating(5);
      setRestaurantComment("");
      setDeliveryComment("");
      setComment("");
      showToast("Feedback deleted", "success");
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Failed to delete feedback";
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

  const showForm = !submitted || editing;

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

      {submitted && !editing && (
        <div className="space-y-4">
          <div className="rounded-2xl bg-emerald-50 border border-emerald-100 px-4 py-3 text-sm font-bold text-emerald-700">
            Feedback submitted. Restaurant {restaurantRating}★
            {hasDeliveryPartner ? ` · Delivery ${deliveryRating}★` : ""} · Overall{" "}
            {overallRating}★
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="bg-[#E23744] hover:bg-[#C81E34] text-white px-5 py-2.5 rounded-xl text-sm font-bold"
            >
              Edit feedback
            </button>
            <button
              type="button"
              onClick={() => void handleDelete()}
              disabled={submitting}
              className="border border-[#E5E7EB] text-[#6B7280] hover:text-red-600 px-5 py-2.5 rounded-xl text-sm font-bold"
            >
              Delete
            </button>
          </div>
        </div>
      )}

      {showForm && (
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
            maxLength={2000}
            placeholder="How was the food and restaurant?"
            className="w-full bg-[#F8FAFC] text-[#111827] border border-[#E5E7EB] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#E23744] resize-none"
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
                maxLength={2000}
                placeholder="How was the delivery experience?"
                className="w-full bg-[#F8FAFC] text-[#111827] border border-[#E5E7EB] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#E23744] resize-none"
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
            maxLength={2000}
            placeholder="Any other feedback about this order?"
            className="w-full bg-[#F8FAFC] text-[#111827] border border-[#E5E7EB] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#E23744] resize-none"
          />

          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              disabled={submitting}
              className="bg-[#E23744] hover:bg-[#C81E34] disabled:opacity-60 text-white px-6 py-3 rounded-xl text-sm font-bold transition-colors"
            >
              {submitting
                ? "Saving…"
                : submitted
                  ? "Save changes"
                  : "Submit feedback"}
            </button>
            {editing && (
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="border border-[#E5E7EB] text-[#6B7280] px-6 py-3 rounded-xl text-sm font-bold"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      )}
    </div>
  );
}
