"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, Quote, Calendar, Utensils, Store } from "lucide-react";

type Testimonial = {
  id: string;
  name: string;
  city: string;
  image: string;
  rating: number;
  review: string;
  restaurant: string;
  dish: string;
  date: string;
};

const testimonialsData: Testimonial[] = [
  {
    id: "t1",
    name: "Priya Sharma",
    city: "Hyderabad",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200",
    rating: 5,
    review: "The delivery was super fast and the food was still hot. Foodiq has become my favorite food ordering platform. Highly recommended!",
    restaurant: "Paradise Biryani",
    dish: "Chicken Dum Biryani",
    date: "Oct 12, 2026"
  },
  {
    id: "t2",
    name: "Rahul Verma",
    city: "Mumbai",
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200",
    rating: 5,
    review: "Absolutely seamless experience. The tracking is incredibly accurate and the food packaging was premium and tamper-proof.",
    restaurant: "Domino's Pizza",
    dish: "Cheese Burst Pizza",
    date: "Oct 10, 2026"
  },
  {
    id: "t3",
    name: "Ananya Gupta",
    city: "Delhi",
    image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=200",
    rating: 5,
    review: "I love the exclusive discounts! I saved so much on my favorite sushi place today. Customer support is also super responsive.",
    restaurant: "Tokyo Sushi",
    dish: "Spicy Tuna Roll",
    date: "Oct 08, 2026"
  },
  {
    id: "t4",
    name: "Arjun Reddy",
    city: "Bangalore",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200",
    rating: 5,
    review: "Best late-night delivery app out there. Finding great food at 2 AM is so easy now. Five stars all the way!",
    restaurant: "Midnight Bites",
    dish: "Peri Peri Burger",
    date: "Oct 05, 2026"
  },
  {
    id: "t5",
    name: "Sneha Patil",
    city: "Pune",
    image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200",
    rating: 5,
    review: "The user interface is gorgeous. It feels like a premium app every time I open it. The curated collections are brilliant.",
    restaurant: "Green Leaf Cafe",
    dish: "Avocado Salad Bowl",
    date: "Oct 01, 2026"
  }
];

export default function LovedByFoodLovers() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [cardsToShow, setCardsToShow] = useState(3);

  // Responsive cards to show
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setCardsToShow(1);
      } else if (window.innerWidth < 1024) {
        setCardsToShow(2);
      } else {
        setCardsToShow(3);
      }
    };

    handleResize(); // Initial check
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Auto-slide every 4 seconds
  useEffect(() => {
    if (isHovered) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % (testimonialsData.length - cardsToShow + 1));
    }, 4000);

    return () => clearInterval(interval);
  }, [isHovered, cardsToShow]);

  return (
    <section className="bg-[#0B0B0B] w-full py-[100px] overflow-hidden border-t border-white/5 mt-8">
      <div className="w-[90%] max-w-7xl mx-auto">
        
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="mb-14 text-center"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <span className="text-3xl md:text-4xl">❤️</span>
            <h2 className="text-3xl md:text-5xl font-bold text-white tracking-tight">
              Loved by Food Lovers
            </h2>
          </div>
          <p className="text-gray-400 text-lg md:text-xl font-light">
            See why thousands of customers choose Foodiq every day.
          </p>
        </motion.div>

        {/* Carousel Container */}
        <div 
          className="relative overflow-hidden"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <div 
            className="flex transition-transform duration-700 ease-in-out gap-6"
            style={{ transform: `translateX(-${currentIndex * (100 / cardsToShow)}%)` }}
          >
            {testimonialsData.map((testimonial) => (
              <div 
                key={testimonial.id}
                className="flex-shrink-0"
                style={{ width: `calc(${100 / cardsToShow}% - ${(6 * (cardsToShow - 1)) / cardsToShow}rem)` }}
              >
                <div className="bg-white/5 backdrop-blur-md rounded-[24px] p-8 h-full border border-white/10 shadow-lg relative group hover:bg-white/10 transition-colors duration-300">
                  {/* Background Quote Icon */}
                  <Quote className="absolute top-6 right-6 w-16 h-16 text-[#FF2D3B]/10 group-hover:text-[#FF2D3B]/20 transition-colors duration-300 pointer-events-none" />

                  {/* Header: Rating & Profile */}
                  <div className="flex justify-between items-start mb-6 relative z-10">
                    <div className="flex gap-1 bg-[#111] px-3 py-1.5 rounded-full border border-white/10">
                      {[...Array(5)].map((_, i) => (
                        <Star 
                          key={i} 
                          className={`w-3.5 h-3.5 ${i < testimonial.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'}`} 
                        />
                      ))}
                    </div>
                  </div>

                  {/* Review Text */}
                  <p className="text-gray-300 text-base leading-relaxed mb-8 italic relative z-10">
                    "{testimonial.review}"
                  </p>

                  {/* Order Details */}
                  <div className="bg-black/30 rounded-xl p-4 mb-8 border border-white/5">
                    <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
                      <Store className="w-4 h-4 text-primary" />
                      <span className="font-semibold text-gray-300">Ordered From:</span> 
                      <span className="text-white truncate">{testimonial.restaurant}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
                      <Utensils className="w-4 h-4 text-primary" />
                      <span className="font-semibold text-gray-300">Dish:</span> 
                      <span className="text-white truncate">{testimonial.dish}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{testimonial.date}</span>
                    </div>
                  </div>

                  {/* Customer Info */}
                  <div className="flex items-center gap-4 mt-auto">
                    <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-white/20">
                      <img 
                        src={testimonial.image} 
                        alt={testimonial.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <h4 className="text-white font-bold text-sm md:text-base">{testimonial.name}</h4>
                      <p className="text-gray-500 text-xs md:text-sm">{testimonial.city}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Carousel Indicators */}
        <div className="flex justify-center items-center gap-2 mt-10">
          {[...Array(testimonialsData.length - cardsToShow + 1)].map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`h-2 rounded-full transition-all duration-300 ${
                currentIndex === idx 
                ? 'w-8 bg-[#FF2D3B]' 
                : 'w-2 bg-white/20 hover:bg-white/40'
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>

      </div>
    </section>
  );
}
