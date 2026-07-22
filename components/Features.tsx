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
    <section className="py-12 px-3 md:px-8 max-w-7xl mx-auto border-t border-border mt-8 md:py-20">
      <div className="mb-12 text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3 tracking-[-0.04em]">Why Choose Foodiq</h2>
        <p className="text-muted text-base md:text-lg">The best food delivery experience in town.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {features.map((feature, index) => {
          const Icon = feature.icon;
          return (
            <div 
              key={index} 
              className="bg-white border border-border rounded-[18px] p-7 shadow-card hover:border-border hover:shadow-[0_8px_28px_rgba(0,0,0,0.08)] transition-all duration-300 group hover:-translate-y-1"
            >
              <div className="w-14 h-14 bg-section rounded-xl flex items-center justify-center mb-6 group-hover:bg-section transition-colors duration-300" aria-hidden="true">
                <Icon className="w-7 h-7 text-primary transition-colors duration-300" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-3">{feature.title}</h3>
              <p className="text-muted text-sm leading-relaxed">{feature.description}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
