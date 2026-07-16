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
    <div className="bg-[#171717] rounded-2xl p-6 border border-white/5 mb-6">
      <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
        <Clock className="w-5 h-5 text-primary" />
        Delivery Time
      </h3>

      <div className="flex gap-4 mb-6">
        <button 
          onClick={() => onModeChange("Now")}
          className={`flex-1 py-3 rounded-xl font-bold transition-colors ${
            mode === "Now" 
            ? 'bg-primary text-white shadow-[0_0_15px_rgba(255,45,59,0.3)]' 
            : 'bg-white/5 text-gray-400 hover:bg-white/10'
          }`}
        >
          Deliver Now
        </button>
        <button 
          onClick={() => onModeChange("Schedule")}
          className={`flex-1 py-3 rounded-xl font-bold transition-colors ${
            mode === "Schedule" 
            ? 'bg-primary text-white shadow-[0_0_15px_rgba(255,45,59,0.3)]' 
            : 'bg-white/5 text-gray-400 hover:bg-white/10'
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
                <label className="text-xs text-gray-400 font-bold uppercase mb-2 block">Date</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  {/* Custom styled select to match dark theme instead of raw native input */}
                  <select 
                    value={selectedDate}
                    onChange={(e) => onDateChange(e.target.value)}
                    className="w-full bg-[#111] text-white border border-white/10 rounded-xl py-3 pl-10 pr-4 appearance-none focus:outline-none focus:border-primary"
                  >
                    <option value="Today">Today</option>
                    <option value="Tomorrow">Tomorrow</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="text-xs text-gray-400 font-bold uppercase mb-2 block">Time</label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <select 
                    value={selectedTime}
                    onChange={(e) => onTimeChange(e.target.value)}
                    className="w-full bg-[#111] text-white border border-white/10 rounded-xl py-3 pl-10 pr-4 appearance-none focus:outline-none focus:border-primary"
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
