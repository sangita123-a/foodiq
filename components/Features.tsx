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
    <section className="py-20 px-4 md:px-8 max-w-7xl mx-auto border-t border-[#ECECEC] mt-8">
      <div className="mb-12 text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-[#1C1C1C] mb-3 tracking-[-0.04em]">Why Choose Foodiq</h2>
        <p className="text-[#686B78] text-base md:text-lg">The best food delivery experience in town.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {features.map((feature, index) => {
          const Icon = feature.icon;
          return (
            <div 
              key={index} 
              className="bg-white border border-[#ECECEC] rounded-[18px] p-7 shadow-[0_6px_22px_rgba(28,28,28,0.05)] hover:border-primary/30 hover:shadow-[0_18px_42px_rgba(28,28,28,0.09)] transition-all duration-300 group hover:-translate-y-1"
            >
              <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-primary transition-colors duration-300">
                <Icon className="w-7 h-7 text-primary group-hover:text-[#111827] transition-colors duration-300" />
              </div>
              <h3 className="text-lg font-bold text-[#1C1C1C] mb-3">{feature.title}</h3>
              <p className="text-[#686B78] text-sm leading-relaxed">{feature.description}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
