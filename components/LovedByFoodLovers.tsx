"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Star, Quote, Calendar, Utensils, Store } from "lucide-react";
import SafeImage from "@/components/ui/SafeImage";
import { getAvatarImage } from "@/lib/images";
import { TESTIMONIAL_AVATARS } from "@/lib/data/sectionImages";

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
    image: TESTIMONIAL_AVATARS[0],
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
    image: TESTIMONIAL_AVATARS[1],
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
    image: TESTIMONIAL_AVATARS[2],
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
    image: TESTIMONIAL_AVATARS[3],
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
    image: TESTIMONIAL_AVATARS[4],
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
  const [isPaused, setIsPaused] = useState(false);
  const [cardsToShow, setCardsToShow] = useState(3);

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

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (isHovered || isPaused) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % (testimonialsData.length - cardsToShow + 1));
    }, 4000);

    return () => clearInterval(interval);
  }, [isHovered, isPaused, cardsToShow]);

  return (
    <section className="bg-section w-full py-14 sm:py-20 md:py-[100px] overflow-hidden border-t border-border mt-6 sm:mt-8">
      <div className="w-[90%] max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="mb-14 text-center"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <span className="text-3xl md:text-4xl" aria-hidden="true">❤️</span>
            <h2 className="text-3xl md:text-5xl font-bold text-foreground tracking-[-0.045em]">
              Loved by Food Lovers
            </h2>
          </div>
          <p className="text-muted text-base md:text-lg">
            See why thousands of customers choose Foodiq every day.
          </p>
        </motion.div>

        <div
          className="relative overflow-hidden"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          aria-roledescription="carousel"
          aria-label="Customer testimonials"
        >
          <div className="mb-4 flex justify-end">
            <button
              type="button"
              onClick={() => setIsPaused((value) => !value)}
              aria-pressed={isPaused}
              className="touch-target rounded-lg border border-border bg-white px-4 py-2.5 text-xs font-semibold text-foreground transition-colors hover:border-border hover:bg-section focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              {isPaused ? "Play testimonials" : "Pause testimonials"}
            </button>
          </div>
          <div
            className="flex transition-transform duration-700 ease-in-out gap-6"
            style={{ transform: `translateX(-${currentIndex * (100 / cardsToShow)}%)` }}
            aria-live="polite"
          >
            {testimonialsData.map((testimonial) => (
              <div
                key={testimonial.id}
                className="flex-shrink-0"
                style={{ width: `calc(${100 / cardsToShow}% - ${(6 * (cardsToShow - 1)) / cardsToShow}rem)` }}
              >
                <div className="bg-white rounded-[20px] p-8 h-full border border-border shadow-card relative group hover:-translate-y-1 hover:border-border hover:shadow-[0_8px_28px_rgba(0,0,0,0.08)] transition-all duration-300">
                  <Quote className="absolute top-6 right-6 w-16 h-16 text-primary/10 group-hover:text-primary/20 transition-colors duration-300 pointer-events-none" aria-hidden="true" />

                  <div className="flex justify-between items-start mb-6 relative z-10">
                    <div
                      className="flex gap-1 bg-section px-3 py-1.5 rounded-full border border-border"
                      role="img"
                      aria-label={`${testimonial.rating} out of 5 stars`}
                    >
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3.5 h-3.5 ${i < testimonial.rating ? "text-yellow-400 fill-yellow-400" : "text-[#9CA3AF]"}`}
                          aria-hidden="true"
                        />
                      ))}
                    </div>
                  </div>

                  <p className="text-muted text-sm leading-relaxed mb-8 italic relative z-10">
                    &ldquo;{testimonial.review}&rdquo;
                  </p>

                  <div className="bg-section rounded-xl p-4 mb-8 border border-border">
                    <div className="flex items-center gap-2 text-sm text-gray-text mb-2">
                      <Store className="w-4 h-4 text-primary" />
                      <span className="font-semibold text-foreground">Ordered From:</span>
                      <span className="text-foreground truncate">{testimonial.restaurant}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-text mb-2">
                      <Utensils className="w-4 h-4 text-primary" />
                      <span className="font-semibold text-foreground">Dish:</span>
                      <span className="text-foreground truncate">{testimonial.dish}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{testimonial.date}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 mt-auto">
                    <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-border">
                      <SafeImage
                        src={testimonial.image}
                        fallback={getAvatarImage(null)}
                        alt={testimonial.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <h3 className="text-foreground font-bold text-sm md:text-base">{testimonial.name}</h3>
                      <p className="text-muted text-xs md:text-sm">{testimonial.city}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-center items-center gap-1 sm:gap-2 mt-8 sm:mt-10" role="tablist" aria-label="Testimonial slides">
          {[...Array(testimonialsData.length - cardsToShow + 1)].map((_, idx) => (
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
    </section>
  );
}
