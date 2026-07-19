"use client";

import { CheckCircle2, Circle } from "lucide-react";
import { motion } from "framer-motion";

const stages = [
  { id: 1, title: "Order Placed", description: "We received your order" },
  { id: 2, title: "Restaurant Accepted", description: "Restaurant confirmed your order" },
  { id: 3, title: "Preparing", description: "Your food is being prepared" },
  { id: 4, title: "Ready For Pickup", description: "Waiting for delivery partner" },
  { id: 5, title: "Picked Up", description: "Rider collected your order" },
  { id: 6, title: "Out For Delivery", description: "Heading to your address" },
  { id: 7, title: "Delivered", description: "Enjoy your meal" },
];

type Props = {
  currentStageId: number; // 1–7, 0 = cancelled
  cancelled?: boolean;
};

export default function OrderTimeline({ currentStageId, cancelled = false }: Props) {
  if (cancelled || currentStageId === 0) {
    return (
      <div className="bg-[#F8FAFC] rounded-3xl p-6 md:p-8 border border-[#E5E7EB] mb-8">
        <h3 className="text-xl font-bold text-[#111827] mb-2">Order Status</h3>
        <p className="text-red-600 font-bold">This order was cancelled.</p>
      </div>
    );
  }

  const clamped = Math.max(1, Math.min(currentStageId, stages.length));
  const progress = ((clamped - 1) / (stages.length - 1)) * 100;

  return (
    <div className="bg-[#F8FAFC] rounded-3xl p-6 md:p-8 border border-[#E5E7EB] mb-8">
      <h3 className="text-xl font-bold text-[#111827] mb-8">Live Order Timeline</h3>

      <div className="relative pl-4">
        <div className="absolute top-2 bottom-2 left-[23px] w-0.5 bg-[#E5E7EB] rounded-full" />

        <motion.div
          initial={{ height: 0 }}
          animate={{ height: `${progress}%` }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
          className="absolute top-2 left-[23px] w-0.5 bg-[#E23744] rounded-full z-0"
          style={{ maxHeight: "calc(100% - 1rem)" }}
        />

        <div className="flex flex-col gap-6 relative z-10">
          {stages.map((stage) => {
            const isCompleted = stage.id <= clamped;
            const isCurrent = stage.id === clamped;

            return (
              <div key={stage.id} className="flex gap-6 items-start">
                <div className="bg-[#F8FAFC] rounded-full p-1 relative z-10">
                  {isCompleted ? (
                    <motion.div
                      key={`done-${stage.id}-${clamped}`}
                      initial={{ scale: 0.6 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 400, damping: 18 }}
                    >
                      <CheckCircle2
                        className={`w-6 h-6 ${
                          isCurrent
                            ? "text-[#E23744] drop-shadow-[0_0_10px_rgba(226, 55, 68,0.8)]"
                            : "text-green-500"
                        }`}
                      />
                    </motion.div>
                  ) : (
                    <Circle className="w-6 h-6 text-[#111827]/20" />
                  )}
                </div>
                <div className={`mt-0.5 ${isCompleted ? "opacity-100" : "opacity-40"}`}>
                  <h4
                    className={`font-bold ${
                      isCurrent ? "text-[#111827] text-lg" : "text-[#6B7280]"
                    }`}
                  >
                    {stage.title}
                  </h4>
                  <p className="text-xs text-[#9CA3AF] mt-1">{stage.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
