"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Review } from "./types";
import ReviewCard from "./ReviewCard";

interface ReviewsListProps {
  reviews: Review[];
  onUpdateReply: (id: string, text: string | null) => void;
  onUpdateStatus: (id: string, field: "isFeatured" | "isHidden", value: boolean) => void;
}

export default function ReviewsList({ reviews, onUpdateReply, onUpdateStatus }: ReviewsListProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
      <AnimatePresence mode="popLayout">
        {reviews.map((review) => (
          <ReviewCard 
            key={review.id} 
            review={review} 
            onUpdateReply={onUpdateReply}
            onUpdateStatus={onUpdateStatus}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
