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
    <section className="mt-4 w-full overflow-hidden border-t border-border bg-section py-6 max-md:py-6 sm:mt-8 md:py-20 lg:py-[100px]">
      <div className="mx-auto w-[calc(100%-24px)] max-w-7xl md:w-[90%]">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="mb-4 px-1 text-center max-md:mb-4 md:mb-14"
        >
          <div className="mb-2 flex flex-col items-center justify-center gap-1 sm:flex-row sm:gap-3 md:mb-4">
            <span className="text-xl md:text-4xl" aria-hidden="true">❤️</span>
            <h2 className="text-lg font-bold tracking-[-0.045em] text-foreground max-md:text-lg md:text-5xl">
              Loved by Food Lovers
            </h2>
          </div>
          <p className="text-xs text-muted max-md:line-clamp-1 md:text-lg">
            See why thousands of customers choose Foodiq every day.
          </p>
        </motion.div>

        <div
          className="relative overflow-hidden mobile-no-overflow"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          aria-roledescription="carousel"
          aria-label="Customer testimonials"
        >
          <div className="mb-2 flex justify-end max-md:mb-2 md:mb-4">
            <button
              type="button"
              onClick={() => setIsPaused((value) => !value)}
              aria-pressed={isPaused}
              className="touch-target rounded-lg border border-border bg-white px-3 py-1.5 text-[10px] font-semibold text-foreground transition-colors hover:border-border hover:bg-section focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary max-md:py-1.5 max-md:text-[10px] md:px-4 md:py-2.5 md:text-xs"
            >
              {isPaused ? "Play testimonials" : "Pause testimonials"}
            </button>
          </div>
          <div
            className="flex transition-transform duration-700 ease-in-out gap-4 md:gap-6 max-md:gap-0"
            style={{ transform: `translateX(-${currentIndex * (100 / cardsToShow)}%)` }}
            aria-live="polite"
          >
            {testimonialsData.map((testimonial) => (
              <div
                key={testimonial.id}
                className="flex-shrink-0"
                style={{ width: cardsToShow === 1 ? "100%" : `calc(${100 / cardsToShow}% - ${(6 * (cardsToShow - 1)) / cardsToShow}rem)` }}
              >
                <div className="relative h-full overflow-hidden rounded-xl border border-border bg-white p-3 shadow-card transition-all duration-300 group max-md:p-3 md:rounded-2xl md:p-8 md:hover:-translate-y-1 md:hover:border-border md:hover:shadow-[0_8px_28px_rgba(0,0,0,0.08)]">
                  <Quote className="pointer-events-none absolute right-3 top-3 h-8 w-8 text-primary/10 transition-colors duration-300 group-hover:text-primary/20 max-md:h-8 max-md:w-8 md:right-6 md:top-6 md:h-16 md:w-16" aria-hidden="true" />

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

                  <div className="mt-auto flex items-center gap-2.5 md:gap-4">
                    <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full border-2 border-border md:h-12 md:w-12">
                      <SafeImage
                        src={testimonial.image}
                        fallback={getAvatarImage(null)}
                        alt={testimonial.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-foreground md:text-base">{testimonial.name}</h3>
                      <p className="text-[10px] text-muted md:text-sm">{testimonial.city}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-4 flex items-center justify-center gap-1 sm:mt-10 md:gap-2" role="tablist" aria-label="Testimonial slides">
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
