"use client";

import { CheckCircle2, Circle } from "lucide-react";
import { motion } from "framer-motion";

const stages = [
  { id: 1, title: "Order Placed", description: "We received your order" },
  { id: 2, title: "Restaurant Accepted", description: "Restaurant confirmed your order" },
  { id: 3, title: "Preparing Food", description: "Your food is being prepared" },
  { id: 4, title: "Ready for Pickup", description: "Waiting for delivery partner" },
  { id: 5, title: "Delivery Partner Assigned", description: "A rider is on the way to the restaurant" },
  { id: 6, title: "Picked Up", description: "Rider collected your order" },
  { id: 7, title: "On the Way", description: "Heading to your address" },
  { id: 8, title: "Arriving Soon", description: "Your order is almost at your doorstep" },
  { id: 9, title: "Delivered", description: "Enjoy your meal" },
];

type Props = {
  currentStageId: number; // 1–9, 0 = cancelled
  cancelled?: boolean;
};

export default function OrderTimeline({ currentStageId, cancelled = false }: Props) {
  if (cancelled || currentStageId === 0) {
    return (
      <div className="bg-section rounded-3xl p-6 md:p-8 border border-border mb-8">
        <h3 className="text-xl font-bold text-foreground mb-2">Order Status</h3>
        <p className="text-red-600 font-bold">This order was cancelled.</p>
      </div>
    );
  }

  const clamped = Math.max(1, Math.min(currentStageId, stages.length));
  const progress = ((clamped - 1) / (stages.length - 1)) * 100;

  return (
    <div className="bg-section rounded-3xl p-6 md:p-8 border border-border mb-8">
      <h3 className="text-xl font-bold text-foreground mb-8">Live Order Timeline</h3>

      <div className="relative pl-4">
        <div className="absolute top-2 bottom-2 left-[23px] w-0.5 bg-[#E5E7EB] rounded-full" />

        <motion.div
          initial={{ height: 0 }}
          animate={{ height: `${progress}%` }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
          className="absolute top-2 left-[23px] w-0.5 bg-primary rounded-full z-0"
          style={{ maxHeight: "calc(100% - 1rem)" }}
        />

        <div className="flex flex-col gap-6 relative z-10">
          {stages.map((stage) => {
            const isCompleted = stage.id <= clamped;
            const isCurrent = stage.id === clamped;

            return (
              <div key={stage.id} className="flex gap-6 items-start">
                <div className="bg-section rounded-full p-1 relative z-10">
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
                            ? "text-primary drop-shadow-[0_0_10px_rgba(226, 55, 68,0.8)]"
                            : "text-green-500"
                        }`}
                      />
                    </motion.div>
                  ) : (
                    <Circle className="w-6 h-6 text-foreground/20" />
                  )}
                </div>
                <div className={`mt-0.5 ${isCompleted ? "opacity-100" : "opacity-40"}`}>
                  <h4
                    className={`font-bold ${
                      isCurrent ? "text-foreground text-lg" : "text-gray-text"
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
