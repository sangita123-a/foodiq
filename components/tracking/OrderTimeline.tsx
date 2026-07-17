"use client";

import { CheckCircle2, Circle } from "lucide-react";
import { motion } from "framer-motion";

const stages = [
  { id: 1, title: "Order Confirmed", time: "12:00 PM" },
  { id: 2, title: "Restaurant Accepted", time: "12:01 PM" },
  { id: 3, title: "Preparing Food", time: "12:05 PM" },
  { id: 4, title: "Packed", time: "12:20 PM" },
  { id: 5, title: "Delivery Partner Picked Up", time: "12:25 PM" },
  { id: 6, title: "Near Your Location", time: "" },
  { id: 7, title: "Delivered", time: "" }
];

type Props = {
  currentStageId: number; // 1 to 7
};

export default function OrderTimeline({ currentStageId }: Props) {
  return (
    <div className="bg-[#F8FAFC] rounded-3xl p-6 md:p-8 border border-[#E5E7EB] mb-8">
      <h3 className="text-xl font-bold text-white mb-8">Order Status</h3>

      <div className="relative pl-4">
        {/* Background Track */}
        <div className="absolute top-2 bottom-2 left-[23px] w-0.5 bg-[#F8FAFC] rounded-full"></div>

        {/* Progress Track */}
        <motion.div 
          initial={{ height: 0 }}
          animate={{ height: `${((currentStageId - 1) / (stages.length - 1)) * 100}%` }}
          transition={{ duration: 1, ease: "easeInOut" }}
          className="absolute top-2 left-[23px] w-0.5 bg-[#FC8019] rounded-full z-0"
        ></motion.div>

        <div className="flex flex-col gap-8 relative z-10">
          {stages.map((stage) => {
            const isCompleted = stage.id <= currentStageId;
            const isCurrent = stage.id === currentStageId;

            return (
              <div key={stage.id} className="flex gap-6 items-start">
                <div className="bg-[#F8FAFC] rounded-full p-1 relative z-10">
                  {isCompleted ? (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring" }}
                    >
                      <CheckCircle2 className={`w-6 h-6 ${isCurrent ? 'text-[#FC8019] drop-shadow-[0_0_10px_rgba(252,128,25,0.8)]' : 'text-[#111827]'}`} />
                    </motion.div>
                  ) : (
                    <Circle className="w-6 h-6 text-[#111827]/20" />
                  )}
                </div>
                <div className={`mt-0.5 ${isCompleted ? 'opacity-100' : 'opacity-40'}`}>
                  <h4 className={`font-bold ${isCurrent ? 'text-white text-lg' : 'text-[#6B7280]'}`}>
                    {stage.title}
                  </h4>
                  {stage.time && (
                    <p className="text-xs text-[#9CA3AF] mt-1">{stage.time}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
