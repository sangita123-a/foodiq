"use client";

import { Store, RefreshCw, XCircle } from "lucide-react";

type Props = {
  currentStageId: number;
};

export default function TrackingActions({ currentStageId }: Props) {
  // Can only cancel before food is packed (stage < 4)
  const canCancel = currentStageId < 4;

  return (
    <div className="bg-[#F8FAFC] rounded-3xl p-6 md:p-8 border border-[#E5E7EB] mb-8">
      <h3 className="text-xl font-bold text-white mb-6">Need Help?</h3>
      
      <div className="flex flex-col gap-3">
        <button className="w-full bg-[#F8FAFC] hover:bg-[#F8FAFC] text-white py-4 rounded-xl font-bold flex items-center justify-between px-6 transition-colors border border-[#E5E7EB] hover:border-[#E5E7EB]">
          <div className="flex items-center gap-3">
            <Store className="w-5 h-5 text-[#6B7280]" />
            Contact Restaurant
          </div>
        </button>

        <button className="w-full bg-[#F8FAFC] hover:bg-[#F8FAFC] text-white py-4 rounded-xl font-bold flex items-center justify-between px-6 transition-colors border border-[#E5E7EB] hover:border-[#E5E7EB]">
          <div className="flex items-center gap-3">
            <RefreshCw className="w-5 h-5 text-blue-400" />
            Reorder Similar Items
          </div>
        </button>

        <button 
          disabled={!canCancel}
          className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-500 py-4 rounded-xl font-bold flex items-center justify-between px-6 transition-colors border border-red-500/20 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <div className="flex items-center gap-3">
            <XCircle className="w-5 h-5" />
            Cancel Order
          </div>
          {!canCancel && <span className="text-xs font-normal">Too late to cancel</span>}
        </button>
      </div>
    </div>
  );
}
