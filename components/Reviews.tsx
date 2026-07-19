"use client";

import Image from "next/image";
import { Star, Quote } from "lucide-react";
import { AVATAR_FALLBACK } from "@/lib/images";

const reviews = [
  {
    id: 1,
    name: "Rahul Sharma",
    role: "Food Blogger",
    review: "Foodiq is my go-to app for ordering food. The delivery is incredibly fast, and the restaurant selection is premium. Highly recommended!",
    rating: 5,
    image: AVATAR_FALLBACK,
  },
  {
    id: 2,
    name: "Priya Patel",
    role: "Regular Customer",
    review: "I love the user interface and how easy it is to find what I'm craving. The exclusive discounts are a cherry on top. Great experience always.",
    rating: 5,
    image: AVATAR_FALLBACK,
  },
  {
    id: 3,
    name: "Amit Kumar",
    role: "Food Enthusiast",
    review: "The food always arrives hot and fresh. Customer support is very responsive. It's definitely better than other delivery apps I've used.",
    rating: 4,
    image: AVATAR_FALLBACK,
  }
];

export default function Reviews() {
  return (
    <section className="py-16 px-4 md:px-8 max-w-7xl mx-auto">
      <div className="mb-12 text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-[#1C1C1C] mb-3 tracking-[-0.04em]">What Our Customers Say</h2>
        <p className="text-[#686B78] text-base md:text-lg">Don't just take our word for it.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {reviews.map((review) => (
          <div 
            key={review.id}
            className="bg-white border border-[#ECECEC] rounded-[18px] p-7 relative shadow-[0_6px_22px_rgba(28,28,28,0.05)] hover:-translate-y-1 hover:border-[#E23744]/30 hover:shadow-[0_18px_42px_rgba(28,28,28,0.09)] transition-all duration-300 group"
          >
            <Quote className="absolute top-6 right-8 w-12 h-12 text-[#E23744]/5 group-hover:text-primary/10 transition-colors duration-300" />
            
            <div className="flex gap-1 mb-6">
              {[...Array(5)].map((_, i) => (
                <Star 
                  key={i} 
                  className={`w-5 h-5 ${i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-[#9CA3AF]'}`} 
                />
              ))}
            </div>

            <p className="text-[#686B78] text-sm mb-8 leading-relaxed italic">"{review.review}"</p>

            <div className="flex items-center gap-4 mt-auto">
              <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-[#E5E7EB]">
                <Image 
                  src={review.image}
                  alt={review.name}
                  fill
                  sizes="48px"
                  className="object-cover"
                />
              </div>
              <div>
                <h4 className="text-[#1C1C1C] font-bold">{review.name}</h4>
                <p className="text-[#686B78] text-sm">{review.role}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
