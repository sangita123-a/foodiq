"use client";

import { Zap, Star, ShieldCheck, Gift } from "lucide-react";

const features = [
  {
    icon: Zap,
    title: "Fast Delivery",
    description: "Get your food delivered hot and fresh in under 30 minutes.",
  },
  {
    icon: Star,
    title: "Best Rated Restaurants",
    description: "We partner with only the top-rated restaurants in your city.",
  },
  {
    icon: ShieldCheck,
    title: "Secure Payments",
    description: "Multiple safe and secure payment options for a seamless experience.",
  },
  {
    icon: Gift,
    title: "Exclusive Offers",
    description: "Enjoy special discounts and offers available only on Foodiq.",
  }
];

export default function Features() {
  return (
    <section className="mx-auto mt-4 max-w-7xl border-t border-border px-3 py-6 max-md:py-6 md:mt-8 md:px-8 md:py-20">
      <div className="mb-4 text-center max-md:mb-4 md:mb-12">
        <h2 className="mb-1 text-lg font-bold tracking-[-0.04em] text-foreground max-md:text-lg md:mb-3 md:text-4xl">Why Choose Foodiq</h2>
        <p className="text-xs text-muted max-md:line-clamp-1 md:text-lg">The best food delivery experience in town.</p>
      </div>

      <div className="grid grid-cols-2 gap-2 max-md:grid-cols-2 max-md:gap-2 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
        {features.map((feature, index) => {
          const Icon = feature.icon;
          return (
            <div
              key={index}
              className="rounded-xl border border-border bg-white p-3 shadow-card transition-all duration-300 group max-md:p-3 md:rounded-[18px] md:p-7 md:hover:-translate-y-1 md:hover:border-border md:hover:shadow-[0_8px_28px_rgba(0,0,0,0.08)]"
            >
              <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-section transition-colors duration-300 group-hover:bg-section max-md:mb-2 md:mb-6 md:h-14 md:w-14 md:rounded-xl" aria-hidden="true">
                <Icon className="h-4 w-4 text-primary transition-colors duration-300 md:h-7 md:w-7" />
              </div>
              <h3 className="mb-1 line-clamp-1 text-xs font-bold text-foreground max-md:mb-1 md:mb-3 md:text-lg">{feature.title}</h3>
              <p className="line-clamp-2 text-[10px] leading-snug text-muted max-md:line-clamp-2 md:text-sm md:leading-relaxed">{feature.description}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
