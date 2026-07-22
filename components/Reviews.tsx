"use client";

import SafeImage from "@/components/ui/SafeImage";
import { Star, Quote } from "lucide-react";
import { getAvatarImage } from "@/lib/images";
import { TESTIMONIAL_AVATARS } from "@/lib/data/sectionImages";

const reviews = [
  {
    id: 1,
    name: "Rahul Sharma",
    role: "Food Blogger",
    review: "Foodiq is my go-to app for ordering food. The delivery is incredibly fast, and the restaurant selection is premium. Highly recommended!",
    rating: 5,
    image: TESTIMONIAL_AVATARS[5],
  },
  {
    id: 2,
    name: "Priya Patel",
    role: "Regular Customer",
    review: "I love the user interface and how easy it is to find what I'm craving. The exclusive discounts are a cherry on top. Great experience always.",
    rating: 5,
    image: TESTIMONIAL_AVATARS[6],
  },
  {
    id: 3,
    name: "Amit Kumar",
    role: "Food Enthusiast",
    review: "The food always arrives hot and fresh. Customer support is very responsive. It's definitely better than other delivery apps I've used.",
    rating: 4,
    image: TESTIMONIAL_AVATARS[7],
  }
];

export default function Reviews() {
  return (
    <section className="mx-auto max-w-7xl px-3 py-4 max-md:py-4 md:px-8 md:py-12">
      <div className="mb-4 text-center max-md:mb-4 md:mb-12">
        <h2 className="mb-1 text-lg font-bold tracking-[-0.04em] text-foreground max-md:text-lg md:mb-3 md:text-4xl">What Our Customers Say</h2>
        <p className="text-xs text-muted max-md:line-clamp-1 md:text-lg">Don&apos;t just take our word for it.</p>
      </div>

      {/* Mobile: horizontal swipe */}
      <div className="md:hidden">
        <div className="scroll-row scroll-row-snap pb-1">
        {reviews.map((review) => (
          <article
            key={review.id}
            className="relative w-[240px] shrink-0 rounded-lg border border-border bg-white p-2.5 shadow-[0_4px_20px_rgba(0,0,0,0.06)]"
          >
            <Quote className="absolute right-3 top-3 h-8 w-8 text-primary/5" aria-hidden="true" />
            <div className="mb-2 flex gap-0.5" role="img" aria-label={`${review.rating} out of 5 stars`}>
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`h-3 w-3 ${i < review.rating ? "fill-yellow-400 text-yellow-400" : "text-[#9CA3AF]"}`}
                  aria-hidden="true"
                />
              ))}
            </div>
            <p className="mb-3 line-clamp-4 text-[11px] italic leading-relaxed text-muted">&ldquo;{review.review}&rdquo;</p>
            <div className="flex items-center gap-2">
              <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full border border-border">
                <SafeImage src={review.image} fallback={getAvatarImage(null)} alt={review.name} fill sizes="32px" />
              </div>
              <div className="min-w-0">
                <h3 className="truncate text-xs font-bold text-foreground">{review.name}</h3>
                <p className="truncate text-[10px] text-muted">{review.role}</p>
              </div>
            </div>
          </article>
        ))}
        </div>
      </div>

      {/* Tablet/Desktop: original grid */}
      <div className="hidden grid-cols-1 gap-8 md:grid md:grid-cols-3">
        {reviews.map((review) => (
          <div
            key={review.id}
            className="group relative rounded-[18px] border border-border bg-white p-7 shadow-[0_4px_20px_rgba(0,0,0,0.06)] transition-all duration-300 hover:-translate-y-1 hover:border-border hover:shadow-[0_8px_28px_rgba(0,0,0,0.08)]"
          >
            <Quote className="absolute right-8 top-6 h-12 w-12 text-primary/5 transition-colors duration-300 group-hover:text-primary/10" aria-hidden="true" />

            <div className="mb-6 flex gap-1" role="img" aria-label={`${review.rating} out of 5 stars`}>
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`h-5 w-5 ${i < review.rating ? "fill-yellow-400 text-yellow-400" : "text-[#9CA3AF]"}`}
                  aria-hidden="true"
                />
              ))}
            </div>

            <p className="mb-8 text-sm italic leading-relaxed text-muted">&ldquo;{review.review}&rdquo;</p>

            <div className="mt-auto flex items-center gap-4">
              <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full border-2 border-border">
                <SafeImage
                  src={review.image}
                  fallback={getAvatarImage(null)}
                  alt={review.name}
                  fill
                  sizes="48px"
                />
              </div>
              <div>
                <h3 className="font-bold text-foreground">{review.name}</h3>
                <p className="text-sm text-muted">{review.role}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
