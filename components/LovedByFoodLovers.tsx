"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  Star,
  Quote,
  Calendar,
  Utensils,
  Store,
  ChevronLeft,
  ChevronRight,
  ThumbsUp,
  Flag,
  X,
  Loader2,
} from "lucide-react";
import useSWR from "swr";
import SafeImage from "@/components/ui/SafeImage";
import { getAvatarImage } from "@/lib/images";
import { TESTIMONIAL_AVATARS } from "@/lib/data/sectionImages";
import { useAuthToken } from "@/hooks/useAuthToken";
import { useToast } from "@/contexts/ToastContext";
import {
  fetchTestimonials,
  createTestimonial,
  markTestimonialHelpful,
  reportTestimonial,
  type TestimonialItem,
} from "@/services/testimonialsApi";
import api from "@/services/api";
import { uploadMediaWithRetry } from "@/services/mediaApi";

const FALLBACK: TestimonialItem[] = [
  {
    id: "t1",
    name: "Priya Sharma",
    city: "Hyderabad",
    image: TESTIMONIAL_AVATARS[0],
    rating: 5,
    review:
      "The delivery was super fast and the food was still hot. Foodiq has become my favorite food ordering platform. Highly recommended!",
    restaurant: "Paradise Biryani",
    dish: "Chicken Dum Biryani",
    date: "Oct 12, 2026",
  },
  {
    id: "t2",
    name: "Rahul Verma",
    city: "Mumbai",
    image: TESTIMONIAL_AVATARS[1],
    rating: 5,
    review:
      "Absolutely seamless experience. The tracking is incredibly accurate and the food packaging was premium and tamper-proof.",
    restaurant: "Domino's Pizza",
    dish: "Cheese Burst Pizza",
    date: "Oct 10, 2026",
  },
  {
    id: "t3",
    name: "Ananya Gupta",
    city: "Delhi",
    image: TESTIMONIAL_AVATARS[2],
    rating: 5,
    review:
      "I love the exclusive discounts! I saved so much on my favorite sushi place today. Customer support is also super responsive.",
    restaurant: "Tokyo Sushi",
    dish: "Spicy Tuna Roll",
    date: "Oct 08, 2026",
  },
  {
    id: "t4",
    name: "Arjun Reddy",
    city: "Bangalore",
    image: TESTIMONIAL_AVATARS[3],
    rating: 5,
    review: "Best late-night delivery app out there. Finding great food at 2 AM is so easy now. Five stars all the way!",
    restaurant: "Midnight Bites",
    dish: "Peri Peri Burger",
    date: "Oct 05, 2026",
  },
  {
    id: "t5",
    name: "Sneha Patil",
    city: "Pune",
    image: TESTIMONIAL_AVATARS[4],
    rating: 5,
    review:
      "The user interface is gorgeous. It feels like a premium app every time I open it. The curated collections are brilliant.",
    restaurant: "Green Leaf Cafe",
    dish: "Avocado Salad Bowl",
    date: "Oct 01, 2026",
  },
];

type DeliveredOrder = {
  id: string;
  restaurant_id?: string;
  restaurant_name?: string;
  status?: string;
  items?: Array<{ name: string }>;
};

function TestimonialCard({
  testimonial,
  onOpen,
}: {
  testimonial: TestimonialItem;
  onOpen: (t: TestimonialItem) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onOpen(testimonial)}
      className="relative h-full w-full overflow-hidden rounded-xl border border-border bg-white p-3 text-left shadow-card transition-all duration-300 group max-md:p-3 md:rounded-2xl md:p-8 md:hover:-translate-y-1 md:hover:border-border md:hover:shadow-[0_8px_28px_rgba(0,0,0,0.08)]"
    >
      <Quote
        className="pointer-events-none absolute right-3 top-3 h-8 w-8 text-primary/10 transition-colors duration-300 group-hover:text-primary/20 max-md:h-8 max-md:w-8 md:right-6 md:top-6 md:h-16 md:w-16"
        aria-hidden="true"
      />

      <div className="relative z-10 mb-3 flex items-start justify-between md:mb-6">
        <div
          className="flex gap-0.5 rounded-full border border-border bg-section px-2 py-1 md:gap-1 md:px-3 md:py-1.5"
          role="img"
          aria-label={`${testimonial.rating} out of 5 stars`}
        >
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              className={`h-3 w-3 md:h-3.5 md:w-3.5 ${i < testimonial.rating ? "fill-yellow-400 text-yellow-400" : "text-[#9CA3AF]"}`}
              aria-hidden="true"
            />
          ))}
        </div>
      </div>

      <p className="relative z-10 mb-3 line-clamp-3 text-xs italic leading-relaxed text-muted max-md:mb-3 md:mb-8 md:text-sm">
        &ldquo;{testimonial.review}&rdquo;
      </p>

      <div className="mb-3 hidden rounded-xl border border-border bg-section p-4 md:mb-8 md:block">
        <div className="mb-2 flex items-center gap-2 text-sm text-gray-text">
          <Store className="h-4 w-4 text-primary" />
          <span className="font-semibold text-foreground">Ordered From:</span>
          <span className="truncate text-foreground">{testimonial.restaurant}</span>
        </div>
        <div className="mb-2 flex items-center gap-2 text-sm text-gray-text">
          <Utensils className="h-4 w-4 text-primary" />
          <span className="font-semibold text-foreground">Dish:</span>
          <span className="truncate text-foreground">{testimonial.dish}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted">
          <Calendar className="h-3.5 w-3.5" />
          <span>{testimonial.date}</span>
        </div>
      </div>

      <div className="mt-auto flex items-center gap-2.5 md:gap-4">
        <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full border-2 border-border md:h-12 md:w-12">
          <SafeImage
            src={testimonial.image}
            fallback={getAvatarImage(null)}
            alt={testimonial.name}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        </div>
        <div>
          <h3 className="text-xs font-bold text-foreground md:text-base">{testimonial.name}</h3>
          <p className="text-[10px] text-muted md:text-sm">{testimonial.city}</p>
        </div>
      </div>
    </button>
  );
}

export default function LovedByFoodLovers() {
  const { showToast } = useToast();
  const hasToken = useAuthToken();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [cardsToShow, setCardsToShow] = useState(3);
  const [search, setSearch] = useState("");
  const [restaurantFilter, setRestaurantFilter] = useState("");
  const [ratingFilter, setRatingFilter] = useState<number | "">("");
  const [sort, setSort] = useState<"latest" | "oldest" | "rating">("latest");
  const [selected, setSelected] = useState<TestimonialItem | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [showReport, setShowReport] = useState(false);
  const touchStartX = useRef<number | null>(null);

  const queryKey = useMemo(
    () =>
      `/api/testimonials?search=${encodeURIComponent(search)}&restaurant=${encodeURIComponent(restaurantFilter)}&rating=${ratingFilter}&sort=${sort}`,
    [search, restaurantFilter, ratingFilter, sort]
  );

  const { data, mutate, isLoading } = useSWR(queryKey, () =>
    fetchTestimonials({
      search: search || undefined,
      restaurant: restaurantFilter || undefined,
      rating: ratingFilter,
      sort,
    })
  );

  const testimonials = data?.length ? data : FALLBACK;
  const maxIndex = Math.max(1, testimonials.length - cardsToShow + 1);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) setCardsToShow(1);
      else if (window.innerWidth < 1024) setCardsToShow(2);
      else setCardsToShow(3);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    setCurrentIndex(0);
  }, [testimonials.length, cardsToShow, search, restaurantFilter, ratingFilter, sort]);

  useEffect(() => {
    if (isHovered || isPaused || testimonials.length <= cardsToShow) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % maxIndex);
    }, 4000);
    return () => clearInterval(interval);
  }, [isHovered, isPaused, cardsToShow, maxIndex, testimonials.length]);

  const goPrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + maxIndex) % maxIndex);
  }, [maxIndex]);

  const goNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % maxIndex);
  }, [maxIndex]);

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0]?.clientX ?? null;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current == null) return;
    const dx = (e.changedTouches[0]?.clientX ?? 0) - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(dx) < 40) return;
    if (dx > 0) goPrev();
    else goNext();
  };

  const handleHelpful = async () => {
    if (!selected) return;
    if (!hasToken) {
      showToast("Sign in to mark reviews as helpful", "error");
      return;
    }
    try {
      const res = await markTestimonialHelpful(selected.id);
      setSelected({ ...selected, helpful_count: res.helpful_count, has_voted: true });
      await mutate();
      showToast("Thanks for your feedback", "success");
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Could not mark helpful";
      showToast(msg, "error");
    }
  };

  const handleReport = async () => {
    if (!selected) return;
    if (!hasToken) {
      showToast("Sign in to report a review", "error");
      return;
    }
    if (reportReason.trim().length < 5) {
      showToast("Please enter a reason", "error");
      return;
    }
    try {
      await reportTestimonial(selected.id, reportReason.trim());
      showToast("Report submitted", "success");
      setShowReport(false);
      setReportReason("");
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Could not submit report";
      showToast(msg, "error");
    }
  };

  const restaurants = useMemo(() => {
    const set = new Set(testimonials.map((t) => t.restaurant).filter(Boolean));
    return Array.from(set).sort();
  }, [testimonials]);

  return (
    <section className="mt-2 w-full overflow-hidden border-t border-border bg-section py-4 max-md:py-4 sm:mt-8 md:py-20 lg:py-[100px]">
      <div className="mx-auto w-[calc(100%-24px)] max-w-7xl md:w-[90%]">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="mb-4 px-1 text-center max-md:mb-4 md:mb-14"
        >
          <div className="mb-2 flex flex-col items-center justify-center gap-1 sm:flex-row sm:gap-3 md:mb-4">
            <span className="text-xl md:text-4xl" aria-hidden="true">
              ❤️
            </span>
            <h2 className="text-lg font-bold tracking-[-0.045em] text-foreground max-md:text-lg md:text-5xl">
              Loved by Food Lovers
            </h2>
          </div>
          <p className="text-xs text-muted max-md:line-clamp-1 md:text-lg">
            See why thousands of customers choose Foodiq every day.
          </p>
        </motion.div>

        <div className="mb-4 flex flex-col gap-2 md:mb-6 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-1 flex-wrap gap-2">
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search reviews"
              className="min-w-[140px] flex-1 rounded-xl border border-border bg-white px-3 py-2 text-sm outline-none focus:border-primary"
              aria-label="Search reviews"
            />
            <select
              value={restaurantFilter}
              onChange={(e) => setRestaurantFilter(e.target.value)}
              className="rounded-xl border border-border bg-white px-3 py-2 text-sm"
              aria-label="Filter by restaurant"
            >
              <option value="">All restaurants</option>
              {restaurants.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
            <select
              value={ratingFilter}
              onChange={(e) => setRatingFilter(e.target.value ? Number(e.target.value) : "")}
              className="rounded-xl border border-border bg-white px-3 py-2 text-sm"
              aria-label="Filter by rating"
            >
              <option value="">All ratings</option>
              {[5, 4, 3, 2, 1].map((r) => (
                <option key={r} value={r}>
                  {r} stars
                </option>
              ))}
            </select>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as "latest" | "oldest" | "rating")}
              className="rounded-xl border border-border bg-white px-3 py-2 text-sm"
              aria-label="Sort reviews"
            >
              <option value="latest">Latest</option>
              <option value="oldest">Oldest</option>
              <option value="rating">Top rated</option>
            </select>
          </div>
          {hasToken && (
            <button
              type="button"
              onClick={() => setShowAdd(true)}
              className="rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-white hover:bg-primary-hover"
            >
              Write a Review
            </button>
          )}
        </div>

        <div className="md:hidden">
          <div
            className="grid grid-cols-2 gap-2"
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
          >
            {testimonials.slice(0, 4).map((testimonial) => (
              <div key={testimonial.id} className="relative overflow-hidden rounded-lg border border-border bg-white p-2 shadow-card">
                <button type="button" className="w-full text-left" onClick={() => setSelected(testimonial)}>
                  <div className="mb-1.5 flex gap-0.5" role="img" aria-label={`${testimonial.rating} out of 5 stars`}>
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-2.5 w-2.5 ${i < testimonial.rating ? "fill-yellow-400 text-yellow-400" : "text-[#9CA3AF]"}`}
                        aria-hidden="true"
                      />
                    ))}
                  </div>
                  <p className="mb-2 line-clamp-3 text-[10px] italic leading-snug text-muted">
                    &ldquo;{testimonial.review}&rdquo;
                  </p>
                  <div className="flex items-center gap-1.5">
                    <div className="relative h-7 w-7 shrink-0 overflow-hidden rounded-full border border-border">
                      <SafeImage
                        src={testimonial.image}
                        fallback={getAvatarImage(null)}
                        alt={testimonial.name}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    </div>
                    <div className="min-w-0">
                      <h3 className="truncate text-[10px] font-bold text-foreground">{testimonial.name}</h3>
                      <p className="truncate text-[9px] text-muted">{testimonial.city}</p>
                    </div>
                  </div>
                </button>
              </div>
            ))}
          </div>
        </div>

        <div
          className="relative hidden overflow-hidden mobile-no-overflow md:block"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
          aria-roledescription="carousel"
          aria-label="Customer testimonials"
        >
          <div className="mb-2 flex items-center justify-end gap-2 md:mb-4">
            <button
              type="button"
              onClick={goPrev}
              aria-label="Previous testimonials"
              className="touch-target rounded-lg border border-border bg-white p-2.5 text-foreground hover:bg-section"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={goNext}
              aria-label="Next testimonials"
              className="touch-target rounded-lg border border-border bg-white p-2.5 text-foreground hover:bg-section"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setIsPaused((value) => !value)}
              aria-pressed={isPaused}
              className="touch-target rounded-lg border border-border bg-white px-4 py-2.5 text-xs font-semibold text-foreground transition-colors hover:border-border hover:bg-section focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              {isPaused ? "Resume Testimonials" : "Pause Testimonials"}
            </button>
          </div>
          <div
            className="flex gap-6 transition-transform duration-700 ease-in-out"
            style={{ transform: `translateX(-${currentIndex * (100 / cardsToShow)}%)` }}
            aria-live="polite"
          >
            {testimonials.map((testimonial) => (
              <div
                key={testimonial.id}
                className="flex-shrink-0"
                style={{
                  width:
                    cardsToShow === 1
                      ? "100%"
                      : `calc(${100 / cardsToShow}% - ${(6 * (cardsToShow - 1)) / cardsToShow}rem)`,
                }}
              >
                <TestimonialCard testimonial={testimonial} onOpen={setSelected} />
              </div>
            ))}
          </div>
          {isLoading && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-white/40">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          )}
        </div>

        <div className="mt-4 hidden items-center justify-center gap-2 md:flex sm:mt-10" role="tablist" aria-label="Testimonial slides">
          {[...Array(maxIndex)].map((_, idx) => (
            <button
              key={idx}
              type="button"
              role="tab"
              onClick={() => setCurrentIndex(idx)}
              aria-label={`Go to testimonial slide ${idx + 1}`}
              aria-selected={currentIndex === idx}
              className="carousel-control focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              <span
                aria-hidden="true"
                className={`block h-2 rounded-full transition-all duration-300 ${
                  currentIndex === idx ? "w-8 bg-primary" : "w-2 bg-border hover:bg-muted"
                }`}
              />
            </button>
          ))}
        </div>
      </div>

      {selected && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-border bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="relative h-12 w-12 overflow-hidden rounded-full border border-border">
                  <SafeImage
                    src={selected.image}
                    fallback={getAvatarImage(null)}
                    alt={selected.name}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div>
                  <h3 className="font-bold text-foreground">{selected.name}</h3>
                  <p className="text-sm text-muted">{selected.city}</p>
                </div>
              </div>
              <button type="button" onClick={() => setSelected(null)} aria-label="Close" className="rounded-lg p-2 hover:bg-section">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mb-3 flex gap-1">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`h-4 w-4 ${i < selected.rating ? "fill-yellow-400 text-yellow-400" : "text-[#9CA3AF]"}`}
                />
              ))}
            </div>
            <p className="mb-4 text-sm italic leading-relaxed text-muted">&ldquo;{selected.review}&rdquo;</p>
            <div className="mb-4 space-y-2 rounded-xl border border-border bg-section p-4 text-sm">
              <p>
                <span className="font-semibold">Restaurant:</span> {selected.restaurant}
              </p>
              <p>
                <span className="font-semibold">Ordered item:</span> {selected.dish}
              </p>
              <p>
                <span className="font-semibold">Date:</span> {selected.date}
              </p>
              {selected.order_id && (
                <p className="font-mono text-xs text-muted">Order ID: {selected.order_id}</p>
              )}
            </div>
            {(selected.images?.length || 0) > 0 && (
              <div className="mb-4 flex gap-2 overflow-x-auto">
                {selected.images!.map((url) => (
                  <div key={url} className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-border">
                    <SafeImage src={url} fallback={getAvatarImage(null)} alt="" className="h-full w-full object-cover" />
                  </div>
                ))}
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleHelpful}
                disabled={Boolean(selected.has_voted)}
                className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-semibold disabled:opacity-60"
              >
                <ThumbsUp className="h-4 w-4" />
                Helpful ({selected.helpful_count || 0})
              </button>
              <button
                type="button"
                onClick={() => setShowReport(true)}
                className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-semibold"
              >
                <Flag className="h-4 w-4" />
                Report
              </button>
            </div>
            {showReport && (
              <div className="mt-4 space-y-2">
                <textarea
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  placeholder="Why is this review inappropriate?"
                  className="w-full rounded-xl border border-border p-3 text-sm outline-none focus:border-primary"
                  rows={3}
                />
                <button
                  type="button"
                  onClick={handleReport}
                  className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white"
                >
                  Submit Report
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {showAdd && (
        <AddReviewModal
          onClose={() => setShowAdd(false)}
          onCreated={async () => {
            setShowAdd(false);
            await mutate();
            showToast("Review submitted", "success");
          }}
        />
      )}
    </section>
  );
}

function AddReviewModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const { showToast } = useToast();
  const [orders, setOrders] = useState<DeliveredOrder[]>([]);
  const [orderId, setOrderId] = useState("");
  const [rating, setRating] = useState(5);
  const [review, setReview] = useState("");
  const [city, setCity] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    api
      .get("/api/orders")
      .then((res) => {
        const list = (res.data?.data || res.data || []) as DeliveredOrder[];
        const delivered = (Array.isArray(list) ? list : []).filter(
          (o) => String(o.status || "").toLowerCase() === "delivered"
        );
        setOrders(delivered);
        if (delivered[0]) setOrderId(delivered[0].id);
      })
      .catch(() => setOrders([]));
  }, []);

  const selectedOrder = orders.find((o) => o.id === orderId);

  const onUpload = async (file: File) => {
    setUploading(true);
    try {
      const asset = await uploadMediaWithRetry(file, { purpose: "food" });
      setImageUrl(asset.url || null);
    } catch {
      showToast("Image upload failed", "error");
    } finally {
      setUploading(false);
    }
  };

  const submit = async () => {
    if (!orderId) {
      showToast("Select a completed order", "error");
      return;
    }
    if (review.trim().length < 10) {
      showToast("Review must be at least 10 characters", "error");
      return;
    }
    setLoading(true);
    try {
      await createTestimonial({
        order_id: orderId,
        restaurant_id: selectedOrder?.restaurant_id,
        restaurant: selectedOrder?.restaurant_name,
        dish: selectedOrder?.items?.[0]?.name,
        rating,
        review: review.trim(),
        city: city.trim() || undefined,
        image_urls: imageUrl ? [imageUrl] : [],
      });
      onCreated();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Could not submit review";
      showToast(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-border bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-foreground">Write a Review</h3>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-lg p-2 hover:bg-section">
            <X className="h-4 w-4" />
          </button>
        </div>
        {orders.length === 0 ? (
          <p className="text-sm text-muted">You need a delivered order before you can leave a review.</p>
        ) : (
          <div className="space-y-4">
            <label className="block text-sm">
              <span className="mb-1 block font-semibold">Completed order</span>
              <select
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                className="w-full rounded-xl border border-border px-3 py-2"
              >
                {orders.map((o) => (
                  <option key={o.id} value={o.id}>
                    {(o.restaurant_name || "Order") + " · " + o.id.slice(0, 8)}
                  </option>
                ))}
              </select>
            </label>
            <div>
              <span className="mb-1 block text-sm font-semibold">Rating</span>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button key={n} type="button" onClick={() => setRating(n)} aria-label={`${n} stars`}>
                    <Star className={`h-6 w-6 ${n <= rating ? "fill-yellow-400 text-yellow-400" : "text-[#9CA3AF]"}`} />
                  </button>
                ))}
              </div>
            </div>
            <label className="block text-sm">
              <span className="mb-1 block font-semibold">Your review</span>
              <textarea
                value={review}
                onChange={(e) => setReview(e.target.value)}
                rows={4}
                className="w-full rounded-xl border border-border px-3 py-2 outline-none focus:border-primary"
                placeholder="Share your experience..."
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-semibold">City (optional)</span>
              <input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full rounded-xl border border-border px-3 py-2"
                placeholder="Hyderabad"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-semibold">Food photo (optional)</span>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void onUpload(file);
                }}
              />
              {uploading && <p className="mt-1 text-xs text-muted">Uploading...</p>}
              {imageUrl && <p className="mt-1 text-xs text-green-600">Image attached</p>}
            </label>
            <button
              type="button"
              disabled={loading}
              onClick={submit}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-white disabled:opacity-60"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Submit Review
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
