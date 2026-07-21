"use client";

import { useRouter } from "next/navigation";
import { Store, RefreshCw, XCircle } from "lucide-react";
import api from "@/services/api";
import { useToast } from "@/contexts/ToastContext";

type Props = {
  orderId?: string;
  currentStageId: number;
};

export default function TrackingActions({ orderId, currentStageId }: Props) {
  const router = useRouter();
  const { showToast } = useToast();
  const canCancel = currentStageId < 3 && Boolean(orderId);

  const handleCancel = async () => {
    if (!orderId || !canCancel) return;
    try {
      await api.put(`/api/orders/${orderId}/cancel`);
      showToast("Order cancelled", "success");
      router.refresh();
    } catch (err: unknown) {
      const message =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      showToast(message || "Could not cancel order", "error");
    }
  };

  return (
    <div className="bg-[#F8FAFC] rounded-3xl p-6 md:p-8 border border-[#E5E7EB] mb-8">
      <h3 className="text-xl font-bold text-[#111827] mb-6">Need Help?</h3>

      <div className="flex flex-col gap-3">
        <button
          type="button"
          className="w-full bg-white hover:bg-[#F8FAFC] text-[#111827] py-4 rounded-xl font-bold flex items-center justify-between px-6 transition-colors border border-[#E5E7EB]"
        >
          <div className="flex items-center gap-3">
            <Store className="w-5 h-5 text-[#6B7280]" />
            Contact Restaurant
          </div>
        </button>

        <button
          type="button"
          onClick={() => router.push("/order-online")}
          className="w-full bg-white hover:bg-[#F8FAFC] text-[#111827] py-4 rounded-xl font-bold flex items-center justify-between px-6 transition-colors border border-[#E5E7EB]"
        >
          <div className="flex items-center gap-3">
            <RefreshCw className="w-5 h-5 text-blue-400" />
            Reorder Similar Items
          </div>
        </button>

        <button
          type="button"
          disabled={!canCancel}
          onClick={handleCancel}
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
