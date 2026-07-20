"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { motion } from "framer-motion";
import useSWR from "swr";
import { formatDistanceToNow } from "date-fns";
import SafeImage from "@/components/ui/SafeImage";
import { AVATAR_FALLBACK } from "@/lib/images";
import RatingDistribution from "@/components/reviews/RatingDistribution";

type Review = {
  id: string;
  name: string;
  image: string;
  rating: number;
  review: string;
  date: string;
  images?: string[];
  reply?: string;
};

interface ApiReview {
  id: string;
  rating: number;
  comment: string;
  created_at: string;
  full_name?: string;
  profile_image_url?: string;
  image_urls?: string[];
  admin_reply?: string;
}

type ReviewsPayload = {
  reviews?: ApiReview[];
  summary?: {
    average_rating: number;
    total_reviews: number;
    distribution: Record<number, number>;
  };
};

interface RestaurantReviewsProps {
  restaurantId?: string;
}

export default function RestaurantReviews({ restaurantId }: RestaurantReviewsProps) {
  const [showAll, setShowAll] = useState(false);
  const { data } = useSWR(restaurantId ? `/api/restaurants/${restaurantId}/reviews` : null);

  const payload = (data?.data ?? data) as ReviewsPayload | ApiReview[] | undefined;
  const rawReviews = Array.isArray(payload)
    ? payload
    : payload?.reviews || [];
  const summary = Array.isArray(payload) ? undefined : payload?.summary;

  const allReviews: Review[] = rawReviews.map((r) => ({
    id: r.id,
    name: r.full_name || "Foodiq Customer",
    image: r.profile_image_url || AVATAR_FALLBACK,
    rating: r.rating,
    review: r.comment || "",
    date: r.created_at
      ? formatDistanceToNow(new Date(r.created_at), { addSuffix: true })
      : "Recently",
    images: Array.isArray(r.image_urls) ? r.image_urls : [],
    reply: r.admin_reply || undefined,
  }));

  const visibleReviews = showAll ? allReviews : allReviews.slice(0, 6);

  if (!restaurantId) return null;

  return (
    <div className="mt-16 pt-12 border-t border-[#E5E7EB] container mx-auto px-4 md:px-8 max-w-[1440px]">
      <h2 className="text-2xl font-bold text-[#111827] mb-8">Customer Reviews</h2>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {summary && (
          <RatingDistribution
            averageRating={summary.average_rating}
            totalReviews={summary.total_reviews}
            distribution={summary.distribution}
          />
        )}

        <div className={`${summary ? "lg:col-span-2" : "lg:col-span-3"} grid grid-cols-1 md:grid-cols-2 gap-6`}>
          {visibleReviews.length ? (
            visibleReviews.map((review, index) => (
              <motion.div
                key={review.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.05 }}
                className="bg-white rounded-2xl p-6 border border-[#E5E7EB]"
              >
                <div className="flex items-center gap-4 mb-4">
                  <SafeImage
                    src={review.image}
                    fallback={AVATAR_FALLBACK}
                    alt={review.name}
                    className="w-12 h-12 rounded-full object-cover border border-[#E5E7EB]"
                  />
                  <div>
                    <h4 className="text-[#111827] font-bold">{review.name}</h4>
                    <span className="text-[#9CA3AF] text-xs">{review.date}</span>
                  </div>
                  <div className="ml-auto flex items-center gap-1 bg-green-500/10 px-2 py-1 rounded border border-green-500/20">
                    <span className="text-green-600 font-bold text-xs">{review.rating}</span>
                    <Star className="w-3 h-3 text-green-500 fill-green-500" />
                  </div>
                </div>
                <p className="text-[#6B7280] text-sm leading-relaxed mb-3">
                  &quot;{review.review}&quot;
                </p>
                {review.images && review.images.length > 0 && (
                  <div className="flex gap-2 mb-3 flex-wrap">
                    {review.images.slice(0, 3).map((img, i) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img key={i} src={img} alt="" className="w-16 h-16 rounded-lg object-cover border border-[#E5E7EB]" />
                    ))}
                  </div>
                )}
                {review.reply && (
                  <div className="mt-3 rounded-xl bg-[#F8FAFC] border border-[#E5E7EB] px-3 py-2 text-xs text-[#6B7280]">
                    <span className="font-bold text-[#111827]">Restaurant reply: </span>
                    {review.reply}
                  </div>
                )}
              </motion.div>
            ))
          ) : (
            <p className="text-[#6B7280] text-sm col-span-full">No reviews yet. Be the first after your order!</p>
          )}
        </div>
      </div>

      {allReviews.length > 6 && (
        <button
          type="button"
          onClick={() => setShowAll((prev) => !prev)}
          className="w-full py-4 border-2 border-[#E5E7EB] rounded-xl text-[#111827] font-bold hover:bg-[#F8FAFC] transition-colors"
        >
          {showAll ? "Show Less" : `See All Reviews (${allReviews.length})`}
        </button>
      )}
    </div>
  );
}
