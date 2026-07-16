"use client";

import Image from "next/image";
import { Star, Quote } from "lucide-react";

const reviews = [
  {
    id: 1,
    name: "Rahul Sharma",
    role: "Food Blogger",
    review: "Foodiq is my go-to app for ordering food. The delivery is incredibly fast, and the restaurant selection is premium. Highly recommended!",
    rating: 5,
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200",
  },
  {
    id: 2,
    name: "Priya Patel",
    role: "Regular Customer",
    review: "I love the user interface and how easy it is to find what I'm craving. The exclusive discounts are a cherry on top. Great experience always.",
    rating: 5,
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200",
  },
  {
    id: 3,
    name: "Amit Kumar",
    role: "Food Enthusiast",
    review: "The food always arrives hot and fresh. Customer support is very responsive. It's definitely better than other delivery apps I've used.",
    rating: 4,
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200",
  }
];

export default function Reviews() {
  return (
    <section className="py-16 px-4 md:px-8 max-w-7xl mx-auto">
      <div className="mb-12 text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-3 tracking-tight">What Our Customers Say</h2>
        <p className="text-gray-400 text-lg">Don't just take our word for it.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {reviews.map((review) => (
          <div 
            key={review.id}
            className="bg-[#111] border border-white/10 rounded-3xl p-8 relative hover:border-white/20 transition-colors duration-300 group"
          >
            <Quote className="absolute top-6 right-8 w-12 h-12 text-white/5 group-hover:text-primary/10 transition-colors duration-300" />
            
            <div className="flex gap-1 mb-6">
              {[...Array(5)].map((_, i) => (
                <Star 
                  key={i} 
                  className={`w-5 h-5 ${i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'}`} 
                />
              ))}
            </div>

            <p className="text-gray-300 mb-8 leading-relaxed italic">"{review.review}"</p>

            <div className="flex items-center gap-4 mt-auto">
              <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-white/10">
                <Image 
                  src={review.image}
                  alt={review.name}
                  fill
                  className="object-cover"
                />
              </div>
              <div>
                <h4 className="text-white font-bold">{review.name}</h4>
                <p className="text-gray-500 text-sm">{review.role}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
