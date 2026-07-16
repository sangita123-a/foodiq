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
    <section className="py-16 px-4 md:px-8 max-w-7xl mx-auto border-t border-white/5 mt-8">
      <div className="mb-12 text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-3 tracking-tight">Why Choose Foodiq</h2>
        <p className="text-gray-400 text-lg">The best food delivery experience in town.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {features.map((feature, index) => {
          const Icon = feature.icon;
          return (
            <div 
              key={index} 
              className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-8 hover:border-primary/50 hover:bg-[#111] transition-all duration-300 group hover:-translate-y-1"
            >
              <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-primary transition-colors duration-300">
                <Icon className="w-7 h-7 text-primary group-hover:text-white transition-colors duration-300" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
              <p className="text-gray-400 leading-relaxed">{feature.description}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
