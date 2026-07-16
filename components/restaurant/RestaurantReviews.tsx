"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { motion } from "framer-motion";
import useSWR from "swr";
import { formatDistanceToNow } from "date-fns";

type Review = {
  id: string;
  name: string;
  image: string;
  rating: number;
  review: string;
  date: string;
};

interface ApiReview {
  id: string;
  rating: number;
  comment: string;
  created_at: string;
  full_name?: string;
  profile_image_url?: string;
}

const FALLBACK_AVATAR =
  "https://images.unsplash.com/photo-1633332755192-727a05c4013d?auto=format&fit=crop&q=80&w=150";

const curatedReviews: Review[] = [
  {
    id: "r1",
    name: "Arjun Reddy",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150",
    rating: 5,
    review: "Absolutely fantastic! The biryani was cooked to perfection with exactly the right amount of spices. Delivery was also 10 minutes early. Highly recommended.",
    date: "2 days ago"
  },
  {
    id: "r2",
    name: "Sneha Patil",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150",
    rating: 4,
    review: "The food was great and still hot when it arrived. I deducted one star because they forgot to include extra mint chutney, but otherwise a solid experience.",
    date: "1 week ago"
  },
  {
    id: "r3",
    name: "Karan Johar",
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150",
    rating: 5,
    review: "Consistently good quality every single time I order from here. The packaging is premium and tamper-proof.",
    date: "2 weeks ago"
  }
];

interface RestaurantReviewsProps {
  restaurantId?: string;
}

export default function RestaurantReviews({ restaurantId }: RestaurantReviewsProps) {
  const [showAll, setShowAll] = useState(false);
  const { data } = useSWR(restaurantId ? `/api/restaurants/${restaurantId}/reviews` : null);

  const apiReviews: Review[] = ((data?.data || data || []) as ApiReview[]).map((r) => ({
    id: r.id,
    name: r.full_name || "Foodiq Customer",
    image: r.profile_image_url || FALLBACK_AVATAR,
    rating: r.rating,
    review: r.comment || "",
    date: r.created_at
      ? formatDistanceToNow(new Date(r.created_at), { addSuffix: true })
      : "Recently",
  }));

  // Prefer real reviews; fall back to curated examples when none exist yet.
  const allReviews = apiReviews.length > 0 ? apiReviews : curatedReviews;
  const visibleReviews = showAll ? allReviews : allReviews.slice(0, 3);

  return (
    <div className="mt-16 pt-12 border-t border-white/10">
      <h2 className="text-2xl font-bold text-white mb-8">Customer Reviews</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {visibleReviews.map((review, index) => (
          <motion.div 
            key={review.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className="bg-[#121212] rounded-2xl p-6 border border-white/5 hover:border-white/10 transition-colors"
          >
            <div className="flex items-center gap-4 mb-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src={review.image} 
                alt={review.name} 
                className="w-12 h-12 rounded-full object-cover border border-white/10"
              />
              <div>
                <h4 className="text-white font-bold">{review.name}</h4>
                <span className="text-gray-500 text-xs">{review.date}</span>
              </div>
              <div className="ml-auto flex items-center gap-1 bg-green-500/20 px-2 py-1 rounded border border-green-500/20">
                <span className="text-green-400 font-bold text-xs">{review.rating}</span>
                <Star className="w-3 h-3 text-green-500 fill-green-500" />
              </div>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">
              &quot;{review.review}&quot;
            </p>
          </motion.div>
        ))}
      </div>
      
      {allReviews.length > 3 && (
        <button
          onClick={() => setShowAll((prev) => !prev)}
          className="mt-8 w-full py-4 border-2 border-white/10 rounded-xl text-white font-bold hover:bg-white/5 hover:border-white/20 transition-colors"
        >
          {showAll ? "Show Less" : `See All Reviews (${allReviews.length})`}
        </button>
      )}
    </div>
  );
}
