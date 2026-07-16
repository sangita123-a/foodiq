"use client";

import { useRef } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import Link from "next/link";

// Reusable data structure for collections
type CollectionData = {
  id: string;
  title: string;
  description: string;
  places: string;
  image: string;
};

// Data array representing the collections
const collectionsData: CollectionData[] = [
  {
    id: "c1",
    title: "Best Biryani Near You",
    description: "Authentic, rich, and aromatic biryanis.",
    places: "24 Places",
    image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&q=80&w=800"
  },
  {
    id: "c2",
    title: "Top Rated Restaurants",
    description: "The absolute best rated spots in the city.",
    places: "32 Places",
    image: "https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&q=80&w=800"
  },
  {
    id: "c3",
    title: "Newly Opened",
    description: "Explore the newest flavors in your area.",
    places: "15 Places",
    image: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&q=80&w=800"
  },
  {
    id: "c4",
    title: "Budget Meals",
    description: "Delicious food that doesn't break the bank.",
    places: "45 Places",
    image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=800"
  },
  {
    id: "c5",
    title: "Pure Veg Specials",
    description: "Exquisite vegetarian delicacies for everyone.",
    places: "28 Places",
    image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&q=80&w=800"
  },
  {
    id: "c6",
    title: "Late Night Delivery",
    description: "Satisfy your midnight cravings right now.",
    places: "18 Places",
    image: "https://images.unsplash.com/photo-1618426685890-a3e74b126a11?auto=format&fit=crop&q=80&w=800"
  }
];

export default function FeaturedCollections() {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = direction === 'left' ? -350 : 350;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <section className="bg-black w-full py-[100px] overflow-hidden">
      <div className="w-[90%] max-w-7xl mx-auto">
        
        {/* Header & Controls */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <h2 className="text-3xl md:text-5xl font-bold text-white tracking-tight mb-3">
              Featured Collections
            </h2>
            <p className="text-gray-400 text-lg md:text-xl font-light">
              Curated restaurant collections for every mood.
            </p>
          </motion.div>
          
          <div className="flex gap-3 hidden sm:flex">
            <button 
              onClick={() => scroll('left')}
              className="w-12 h-12 rounded-full border border-white/20 bg-black flex items-center justify-center text-white hover:bg-[#FF2D3B] hover:border-[#FF2D3B] transition-colors duration-300"
              aria-label="Scroll left"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button 
              onClick={() => scroll('right')}
              className="w-12 h-12 rounded-full border border-white/20 bg-black flex items-center justify-center text-white hover:bg-[#FF2D3B] hover:border-[#FF2D3B] transition-colors duration-300"
              aria-label="Scroll right"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Scrollable Container */}
        <div className="relative group">
          <div 
            ref={scrollRef}
            className="flex overflow-x-auto gap-6 pb-8 snap-x snap-mandatory custom-scrollbar-hide"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {collectionsData.map((collection, index) => (
              <motion.div
                key={collection.id}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, ease: "easeOut", delay: index * 0.1 }}
                className="snap-start flex-shrink-0 w-[280px] md:w-[320px] h-[400px] relative rounded-[24px] overflow-hidden group/card cursor-pointer shadow-xl"
              >
                {/* Background Image */}
                <div className="absolute inset-0 w-full h-full">
                  <img 
                    src={collection.image} 
                    alt={collection.title}
                    className="w-full h-full object-cover transform group-hover/card:scale-110 transition-transform duration-700 ease-in-out"
                  />
                  {/* Dark Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent opacity-90 group-hover/card:opacity-100 transition-opacity duration-300"></div>
                </div>

                {/* Content Overlay */}
                <div className="absolute inset-0 p-6 flex flex-col justify-end z-10">
                  <span className="text-sm font-semibold text-gray-300 mb-2 bg-black/40 backdrop-blur-sm w-fit px-3 py-1 rounded-full border border-white/10">
                    {collection.places}
                  </span>
                  <h3 className="text-2xl font-bold text-white mb-2 leading-tight">
                    {collection.title}
                  </h3>
                  <p className="text-gray-400 text-sm mb-6 line-clamp-2">
                    {collection.description}
                  </p>

                  <Link
                href="/collections"
                className="flex items-center gap-2 text-white font-medium text-sm group-hover/card:text-[#FF2D3B] transition-colors w-fit"
              >
                Explore Collection
                <ArrowRight className="w-4 h-4 transform group-hover/card:translate-x-1 transition-transform" />
              </Link>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}
