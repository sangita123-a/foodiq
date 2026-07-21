"use client";

import { motion } from "framer-motion";
import { Store, Map, ShieldCheck, Headphones, Tag, Zap } from "lucide-react";

export default function WhyChooseUs() {
  const features = [
    { icon: Store, title: "1000+ Restaurants" },
    { icon: Map, title: "Live Order Tracking" },
    { icon: ShieldCheck, title: "Secure Payments" },
    { icon: Headphones, title: "24/7 Support" },
    { icon: Tag, title: "Exclusive Offers" },
    { icon: Zap, title: "Fast Delivery" }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="py-24">
      <div className="container mx-auto px-4 md:px-8">
        
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-black text-white mb-6">Why Choose Foodiq</h2>
          <div className="w-20 h-1.5 bg-primary rounded-full mx-auto"></div>
        </div>

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-50px" }}
          className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-8 max-w-5xl mx-auto"
        >
          {features.map((feature, idx) => (
            <motion.div 
              key={idx}
              variants={itemVariants}
              className="bg-section rounded-3xl p-6 md:p-8 flex flex-col items-center justify-center text-center border border-border hover:border-primary/50 transition-colors group shadow-lg"
            >
              <feature.icon className="w-10 h-10 text-primary mb-4 group-hover:scale-110 transition-transform" />
              <h4 className="text-white font-bold md:text-lg">{feature.title}</h4>
            </motion.div>
          ))}
        </motion.div>

      </div>
    </div>
  );
}
