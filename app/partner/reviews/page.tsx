"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import PartnerSidebar from "@/components/partner/PartnerSidebar";
import PartnerHeader from "@/components/partner/PartnerHeader";
import ReviewsHeader from "@/components/partner/reviews/ReviewsHeader";
import ReviewsSummary from "@/components/partner/reviews/ReviewsSummary";
import ReviewsFilterBar from "@/components/partner/reviews/ReviewsFilterBar";
import ReviewsList from "@/components/partner/reviews/ReviewsList";
import ReviewsEmptyState from "@/components/partner/reviews/ReviewsEmptyState";
import ReviewsAnalytics from "@/components/partner/reviews/ReviewsAnalytics";
import { Review, ReviewsAnalyticsData } from "@/components/partner/reviews/types";
import api from "@/services/api";

function relativeDate(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso).getTime();
  const days = Math.floor((Date.now() - d) / (1000 * 60 * 60 * 24));
  if (days <= 0) return "Today";
  if (days === 1) return "1 day ago";
  if (days < 14) return `${days} days ago`;
  return new Date(iso).toLocaleDateString("en-IN");
}

function mapReview(row: Record<string, unknown>): Review {
  return {
    id: String(row.id),
    customerName: String(row.full_name || "Customer"),
    customerImage: row.profile_image_url
      ? String(row.profile_image_url)
      : undefined,
    orderId: row.order_id
      ? `#${String(row.order_id).slice(0, 8)}`
      : "—",
    orderedDish: String(row.ordered_dish || "Order"),
    rating: Number(row.rating) || 0,
    title: Number(row.rating) >= 4 ? "Great experience" : "Feedback",
    description: String(row.comment || "No comment provided."),
    date: relativeDate(String(row.created_at || "")),
    reply: row.admin_reply
      ? {
          text: String(row.admin_reply),
          date: relativeDate(String(row.replied_at || row.updated_at || "")),
        }
      : undefined,
    isHidden: String(row.status || "visible") === "hidden",
  };
}

const EMPTY_ANALYTICS: ReviewsAnalyticsData = {
  averageRating: 0,
  totalReviews: 0,
  positiveReviews: 0,
  neutralReviews: 0,
  negativeReviews: 0,
  satisfaction: {
    foodQuality: 0,
    deliveryExperience: 0,
    packaging: 0,
    restaurantService: 0,
  },
};

export default function PartnerReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [analytics, setAnalytics] =
    useState<ReviewsAnalyticsData>(EMPTY_ANALYTICS);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [ratingFilter, setRatingFilter] = useState("All");
  const [dateRange, setDateRange] = useState("All Time");
  const [sortBy, setSortBy] = useState("Newest First");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/partner/reviews");
      const data = res.data?.data || {};
      const rows = (data.reviews || []) as Array<Record<string, unknown>>;
      setReviews(rows.map(mapReview));
      const a = data.analytics || {};
      setAnalytics({
        ...EMPTY_ANALYTICS,
        averageRating: Number(a.averageRating) || 0,
        totalReviews: Number(a.totalReviews) || rows.length,
        positiveReviews: Number(a.positiveReviews) || 0,
        neutralReviews: Number(a.neutralReviews) || 0,
        negativeReviews: Number(a.negativeReviews) || 0,
        satisfaction: {
          foodQuality: Math.min(
            100,
            Math.round((Number(a.averageRating) || 0) * 20)
          ),
          deliveryExperience: 0,
          packaging: 0,
          restaurantService: Math.min(
            100,
            Math.round((Number(a.averageRating) || 0) * 20)
          ),
        },
      });
    } catch (e) {
      console.error(e);
      setReviews([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleUpdateReply = async (id: string, text: string | null) => {
    try {
      await api.put(`/api/partner/reviews/${id}`, {
        reply: text,
      });
      setReviews((prev) =>
        prev.map((rev) => {
          if (rev.id !== id) return rev;
          if (text === null) {
            const { reply: _r, ...rest } = rev;
            return rest;
          }
          return { ...rev, reply: { text, date: "Just now" } };
        })
      );
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateStatus = async (
    id: string,
    field: "isFeatured" | "isHidden",
    value: boolean
  ) => {
    if (field === "isHidden") {
      try {
        await api.put(`/api/partner/reviews/${id}`, {
          status: value ? "hidden" : "visible",
        });
      } catch (e) {
        console.error(e);
        return;
      }
    }
    setReviews((prev) =>
      prev.map((rev) => (rev.id === id ? { ...rev, [field]: value } : rev))
    );
  };

  const filteredReviews = useMemo(() => {
    const result = reviews.filter((rev) => {
      const matchesSearch =
        rev.customerName.toLowerCase().includes(search.toLowerCase()) ||
        rev.orderedDish.toLowerCase().includes(search.toLowerCase());
      const matchesRating =
        ratingFilter === "All" || rev.rating.toString() === ratingFilter;
      return matchesSearch && matchesRating && !rev.isHidden;
    });

    result.sort((a, b) => {
      if (sortBy === "Highest Rated") return b.rating - a.rating;
      if (sortBy === "Lowest Rated") return a.rating - b.rating;
      return 0;
    });

    return result;
  }, [reviews, search, ratingFilter, sortBy]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex selection:bg-[#E23744] selection:text-white">
      <div className="hidden lg:block w-64 flex-shrink-0">
        <PartnerSidebar />
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        <PartnerHeader />

        <main className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
          <div className="max-w-7xl mx-auto">
            <ReviewsHeader />
            <ReviewsSummary data={analytics} />

            <ReviewsFilterBar
              search={search}
              setSearch={setSearch}
              ratingFilter={ratingFilter}
              setRatingFilter={setRatingFilter}
              dateRange={dateRange}
              setDateRange={setDateRange}
              sortBy={sortBy}
              setSortBy={setSortBy}
            />

            {loading ? (
              <div className="h-40 bg-white rounded-3xl border border-[#E5E7EB] animate-pulse" />
            ) : filteredReviews.length > 0 ? (
              <ReviewsList
                reviews={filteredReviews}
                onUpdateReply={handleUpdateReply}
                onUpdateStatus={handleUpdateStatus}
              />
            ) : (
              <ReviewsEmptyState />
            )}

            <ReviewsAnalytics data={analytics} />
          </div>
        </main>
      </div>
    </div>
  );
}
