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
    <section className="py-16 px-4 md:px-8 max-w-7xl mx-auto">
      <div className="mb-12 text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3 tracking-[-0.04em]">What Our Customers Say</h2>
        <p className="text-muted text-base md:text-lg">Don't just take our word for it.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {reviews.map((review) => (
          <div 
            key={review.id}
            className="bg-white border border-border rounded-[18px] p-7 relative shadow-[0_4px_20px_rgba(0,0,0,0.06)] hover:-translate-y-1 hover:border-border hover:shadow-[0_8px_28px_rgba(0,0,0,0.08)] transition-all duration-300 group"
          >
            <Quote className="absolute top-6 right-8 w-12 h-12 text-primary/5 group-hover:text-primary/10 transition-colors duration-300" aria-hidden="true" />
            
            <div className="flex gap-1 mb-6" role="img" aria-label={`${review.rating} out of 5 stars`}>
              {[...Array(5)].map((_, i) => (
                <Star 
                  key={i} 
                  className={`w-5 h-5 ${i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-[#9CA3AF]'}`}
                  aria-hidden="true"
                />
              ))}
            </div>

            <p className="text-muted text-sm mb-8 leading-relaxed italic">"{review.review}"</p>

            <div className="flex items-center gap-4 mt-auto">
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
                <h3 className="text-foreground font-bold">{review.name}</h3>
                <p className="text-muted text-sm">{review.role}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
