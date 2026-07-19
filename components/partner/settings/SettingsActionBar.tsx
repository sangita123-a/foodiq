"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Save, RotateCcw, X } from "lucide-react";

interface SettingsActionBarProps {
  isVisible: boolean;
  onSave: () => void;
  onReset: () => void;
  onCancel: () => void;
}

export default function SettingsActionBar({ isVisible, onSave, onReset, onCancel }: SettingsActionBarProps) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div 
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          className="fixed bottom-0 left-0 lg:left-64 right-0 p-4 z-40 flex justify-center pointer-events-none"
        >
          <div className="bg-[#F8FAFC] border border-[#E5E7EB] rounded-2xl p-4 shadow-2xl shadow-black flex items-center gap-4 pointer-events-auto backdrop-blur-md max-w-2xl w-full mx-auto justify-between md:justify-end">
            
            <div className="hidden md:flex flex-col mr-auto">
              <span className="text-[#111827] font-bold text-sm">Unsaved Changes</span>
              <span className="text-[#6B7280] text-xs">Please save your modifications.</span>
            </div>

            <button 
              onClick={onCancel}
              className="flex items-center gap-2 text-[#6B7280] hover:text-[#111827] px-4 py-2 rounded-xl text-sm font-bold transition-colors"
            >
              <X className="w-4 h-4" /> <span className="hidden md:inline">Cancel</span>
            </button>
            
            <button 
              onClick={onReset}
              className="flex items-center gap-2 bg-[#FFFFFF] hover:bg-[#F8FAFC] border border-[#E5E7EB] text-[#111827] px-5 py-2.5 rounded-xl text-sm font-bold transition-colors"
            >
              <RotateCcw className="w-4 h-4" /> Reset
            </button>

            <button 
              onClick={onSave}
              className="flex items-center gap-2 bg-[#E23744] hover:bg-[#C81E34] text-white px-6 py-2.5 rounded-xl text-sm font-bold transition-colors shadow-lg shadow-[#E23744]/20"
            >
              <Save className="w-4 h-4" /> Save Changes
            </button>

          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
