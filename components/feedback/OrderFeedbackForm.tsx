"use client";

import { useEffect, useState } from "react";
import { Star } from "lucide-react";
import api from "@/services/api";
import { useToast } from "@/contexts/ToastContext";
import SafeImage from "@/components/ui/SafeImage";
import { FOOD_FALLBACK } from "@/lib/images";
import { ATTACHMENT_PREVIEW_SIZES } from "@/lib/performance/assets";

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
      <p className="text-sm font-bold text-gray-text mb-2">{label}</p>
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
  const [images, setImages] = useState<string[]>([]);

  const load = async () => {
    const res = await api.get(`/api/orders/${orderId}/feedback`);
    const d = res.data?.data;
    if (d?.submitted) {
      setSubmitted(true);
      if (d.restaurant_review) {
        setRestaurantRating(Number(d.restaurant_review.rating) || 5);
        setRestaurantComment(d.restaurant_review.comment || "");
        setImages(Array.isArray(d.restaurant_review.image_urls) ? d.restaurant_review.image_urls : []);
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
    image_urls: images.slice(0, 3),
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
      setImages([]);
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
        className="mt-8 bg-white rounded-3xl border border-border p-6 md:p-8 animate-pulse h-48"
      />
    );
  }

  const showForm = !submitted || editing;

  return (
    <div
      id="feedback"
      className="mt-8 bg-white rounded-3xl border border-border p-6 md:p-8"
    >
      <h2 className="text-xl font-black text-foreground mb-1">
        Rate your order
      </h2>
      <p className="text-sm text-gray-text mb-6">
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
              className="bg-primary hover:bg-primary-hover text-white px-5 py-2.5 rounded-xl text-sm font-bold"
            >
              Edit feedback
            </button>
            <button
              type="button"
              onClick={() => void handleDelete()}
              disabled={submitting}
              className="border border-border text-gray-text hover:text-red-600 px-5 py-2.5 rounded-xl text-sm font-bold"
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
            className="w-full bg-section text-foreground border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary resize-none"
          />

          <div>
            <p className="text-sm font-bold text-gray-text mb-2">Photos (up to 3)</p>
            <div className="flex flex-wrap gap-2 items-center">
              {images.map((img, i) => (
                <div key={i} className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <SafeImage
                    src={img}
                    fallback={FOOD_FALLBACK}
                    alt="Uploaded order feedback photo"
                    width={80}
                    height={80}
                    sizes={ATTACHMENT_PREVIEW_SIZES}
                    className="w-20 h-20 rounded-xl object-cover border border-border"
                  />
                  <button
                    type="button"
                    onClick={() => setImages((prev) => prev.filter((_, idx) => idx !== i))}
                    className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs"
                  >
                    ×
                  </button>
                </div>
              ))}
              {images.length < 3 && (
                <label className="w-20 h-20 rounded-xl border-2 border-dashed border-border flex items-center justify-center text-xs text-[#9CA3AF] cursor-pointer hover:border-primary">
                  + Photo
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file || images.length >= 3) return;
                      const reader = new FileReader();
                      reader.onload = () => {
                        if (typeof reader.result === "string") {
                          setImages((prev) => [...prev, reader.result as string].slice(0, 3));
                        }
                      };
                      reader.readAsDataURL(file);
                      e.target.value = "";
                    }}
                  />
                </label>
              )}
            </div>
          </div>

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
                className="w-full bg-section text-foreground border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary resize-none"
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
            className="w-full bg-section text-foreground border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary resize-none"
          />

          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              disabled={submitting}
              className="bg-primary hover:bg-primary-hover disabled:opacity-60 text-white px-6 py-3 rounded-xl text-sm font-bold transition-colors"
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
                className="border border-border text-gray-text px-6 py-3 rounded-xl text-sm font-bold"
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
