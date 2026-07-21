"use client";

import { motion } from "framer-motion";
import { Star, TrendingUp, ThumbsUp, ThumbsDown, Heart } from "lucide-react";
import { ReviewsAnalyticsData } from "./types";

interface ReviewsAnalyticsProps {
  data: ReviewsAnalyticsData;
}

export default function ReviewsAnalytics({ data }: ReviewsAnalyticsProps) {
  
  // Mock distributions
  const starDistribution = [
    { stars: 5, percentage: 65 },
    { stars: 4, percentage: 20 },
    { stars: 3, percentage: 10 },
    { stars: 2, percentage: 3 },
    { stars: 1, percentage: 2 }
  ];

  const monthlyTrend = [
    { month: "Jan", reviews: 120, height: "40%" },
    { month: "Feb", reviews: 150, height: "50%" },
    { month: "Mar", reviews: 130, height: "45%" },
    { month: "Apr", reviews: 200, height: "70%" },
    { month: "May", reviews: 250, height: "85%" },
    { month: "Jun", reviews: 300, height: "100%" }
  ];

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
      
      {/* 1. Rating Distribution */}
      <div className="bg-background rounded-3xl p-6 border border-border shadow-xl flex flex-col">
        <h3 className="text-xl font-black text-foreground flex items-center gap-2 mb-6">
          <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" /> Rating Distribution
        </h3>
        
        <div className="space-y-4 flex-1 flex flex-col justify-center">
          {starDistribution.map((dist, idx) => (
            <div key={dist.stars} className="flex items-center gap-4 group">
              <span className="text-gray-text font-bold w-12 text-sm">{dist.stars} Stars</span>
              <div className="flex-1 h-3 bg-section rounded-full overflow-hidden border border-border relative">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${dist.percentage}%` }}
                  transition={{ duration: 1, delay: idx * 0.1 }}
                  className="absolute left-0 top-0 h-full bg-gradient-to-r from-yellow-600 to-yellow-400 rounded-full"
                />
              </div>
              <span className="text-foreground font-bold w-8 text-right text-sm">{dist.percentage}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Satisfaction Metrics */}
      <div className="bg-background rounded-3xl p-6 border border-border shadow-xl flex flex-col">
        <h3 className="text-xl font-black text-foreground flex items-center gap-2 mb-6">
          <Heart className="w-5 h-5 text-primary" /> Customer Satisfaction
        </h3>
        
        <div className="space-y-5 flex-1 flex flex-col justify-center">
          {[
            { label: "Food Quality", value: data.satisfaction.foodQuality, color: "bg-green-500" },
            { label: "Delivery Experience", value: data.satisfaction.deliveryExperience, color: "bg-blue-500" },
            { label: "Packaging", value: data.satisfaction.packaging, color: "bg-purple-500" },
            { label: "Restaurant Service", value: data.satisfaction.restaurantService, color: "bg-primary" }
          ].map((metric, idx) => (
            <div key={metric.label}>
              <div className="flex justify-between text-sm mb-1.5">
                <span className="text-gray-text font-bold">{metric.label}</span>
                <span className="text-foreground font-black">{metric.value}%</span>
              </div>
              <div className="w-full h-2 bg-section rounded-full overflow-hidden border border-border relative">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${metric.value}%` }}
                  transition={{ duration: 1, delay: idx * 0.15 }}
                  className={`absolute left-0 top-0 h-full ${metric.color} rounded-full shadow-[0_0_10px_rgba(255,255,255,0.2)]`}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Dish Performance & Trend */}
      <div className="bg-background rounded-3xl p-6 border border-border shadow-xl flex flex-col justify-between">
        
        <div className="mb-6">
          <h3 className="text-xl font-black text-foreground flex items-center gap-2 mb-4">
            <ThumbsUp className="w-5 h-5 text-green-500" /> Top Rated Dish
          </h3>
          <div className="bg-section p-3 rounded-xl border border-border">
            <p className="text-foreground font-bold">Hyderabadi Chicken Dum Biryani</p>
            <p className="text-yellow-500 text-sm font-bold flex items-center gap-1 mt-1">4.9 <Star className="w-3 h-3 fill-yellow-500"/></p>
          </div>
        </div>

        <div className="mb-6">
          <h3 className="text-xl font-black text-foreground flex items-center gap-2 mb-4">
            <ThumbsDown className="w-5 h-5 text-red-500" /> Needs Improvement
          </h3>
          <div className="bg-section p-3 rounded-xl border border-border">
            <p className="text-foreground font-bold">Cold Coffee with Ice Cream</p>
            <p className="text-red-400 text-sm font-bold flex items-center gap-1 mt-1">3.1 <Star className="w-3 h-3 fill-red-400"/></p>
            <p className="text-xs text-[#9CA3AF] mt-1">Common complaint: Ice cream melted during delivery.</p>
          </div>
        </div>

      </div>

    </div>
  );
}
