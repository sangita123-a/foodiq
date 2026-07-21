"use client";

import { Clock, Calendar } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export type DeliveryMode = "Now" | "Schedule";

type Props = {
  mode: DeliveryMode;
  onModeChange: (mode: DeliveryMode) => void;
  selectedDate: string;
  onDateChange: (date: string) => void;
  selectedTime: string;
  onTimeChange: (time: string) => void;
};

export default function DeliveryTimeSection({ 
  mode, 
  onModeChange, 
  selectedDate, 
  onDateChange,
  selectedTime,
  onTimeChange
}: Props) {
  return (
    <div className="mb-6 rounded-2xl border border-border bg-white p-6 shadow-[0_8px_24px_rgba(28,28,28,0.06)]">
      <h3 className="mb-6 flex items-center gap-2 text-xl font-bold text-foreground">
        <Clock className="w-5 h-5 text-primary" />
        Delivery Time
      </h3>

      <div className="flex gap-4 mb-6">
        <button 
          onClick={() => onModeChange("Now")}
          className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
            mode === "Now" 
            ? 'border border-primary bg-primary-soft text-primary shadow-sm' 
            : 'border border-border bg-white text-gray-text hover:bg-section'
          }`}
        >
          Deliver Now
        </button>
        <button 
          onClick={() => onModeChange("Schedule")}
          className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
            mode === "Schedule" 
            ? 'border border-primary bg-primary-soft text-primary shadow-sm' 
            : 'border border-border bg-white text-gray-text hover:bg-section'
          }`}
        >
          Schedule
        </button>
      </div>

      <AnimatePresence>
        {mode === "Schedule" && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="mb-2 block text-xs font-bold uppercase text-muted">Date</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                  {/* Custom styled select to match dark theme instead of raw native input */}
                  <select 
                    value={selectedDate}
                    onChange={(e) => onDateChange(e.target.value)}
                    className="w-full appearance-none rounded-xl border border-border bg-white py-3 pl-10 pr-4 text-foreground transition-colors focus:border-primary focus:outline-none"
                  >
                    <option value="Today">Today</option>
                    <option value="Tomorrow">Tomorrow</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="mb-2 block text-xs font-bold uppercase text-muted">Time</label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                  <select 
                    value={selectedTime}
                    onChange={(e) => onTimeChange(e.target.value)}
                    className="w-full appearance-none rounded-xl border border-border bg-white py-3 pl-10 pr-4 text-foreground transition-colors focus:border-primary focus:outline-none"
                  >
                    <option value="12:00 PM - 12:30 PM">12:00 PM - 12:30 PM</option>
                    <option value="12:30 PM - 01:00 PM">12:30 PM - 01:00 PM</option>
                    <option value="01:00 PM - 01:30 PM">01:00 PM - 01:30 PM</option>
                    <option value="01:30 PM - 02:00 PM">01:30 PM - 02:00 PM</option>
                    <option value="07:00 PM - 07:30 PM">07:00 PM - 07:30 PM</option>
                    <option value="07:30 PM - 08:00 PM">07:30 PM - 08:00 PM</option>
                  </select>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
