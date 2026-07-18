"use client";

import { motion } from "framer-motion";
import { Package, RefreshCw, ChevronRight, XCircle, MapPin } from "lucide-react";
import useSWR from "swr";
import { useRouter } from "next/navigation";
import api from "@/services/api";
import { useToast } from "@/contexts/ToastContext";
import Link from "next/link";
import SafeImage from "@/components/ui/SafeImage";
import { RESTAURANT_FALLBACK } from "@/lib/images";
import { useVisibleRefreshInterval } from "@/hooks/useVisibleRefreshInterval";

export default function MyOrdersList() {
  const router = useRouter();
  const { showToast } = useToast();
  const refreshInterval = useVisibleRefreshInterval(15000);
  const { data, isLoading, mutate } = useSWR("/api/orders", { refreshInterval });
  const orders = data || [];

  const canCancel = (status: string) => {
    const s = (status || "").toLowerCase();
    return s === "pending" || s === "accepted";
  };

  const isActive = (status: string) => {
    const s = (status || "").toLowerCase();
    return !["delivered", "cancelled"].includes(s);
  };

  const handleCancel = async (id: string) => {
    try {
      await api.put(`/api/orders/${id}/cancel`);
      mutate();
      showToast("Order cancelled", "success");
    } catch (err: any) {
      showToast(err.response?.data?.message || "Failed to cancel order", "error");
    }
  };

  const handleReorder = async (order: any) => {
    try {
      const { reorderOrder } = await import("@/services/featuresApi");
      await reorderOrder(order.id);
      showToast("Items added to cart", "success");
      router.push("/cart");
    } catch (err: any) {
      // Fallback to legacy client-side re-add
      try {
        const items = order.items || [];
        for (const item of items) {
          if (item.menu_item_id) {
            await api.post("/api/cart/add", {
              menu_item_id: item.menu_item_id,
              quantity: item.quantity || 1,
            });
          }
        }
        showToast("Items added to cart", "success");
        router.push("/cart");
      } catch {
        showToast(err.response?.data?.message || "Failed to reorder", "error");
      }
    }
  };

  if (isLoading) {
    return (
      <div className="bg-[#F8FAFC] rounded-[24px] p-6 md:p-8 border border-[#E5E7EB]">
        <div className="h-8 w-48 bg-[#F8FAFC] animate-pulse rounded mb-8" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 bg-[#F8FAFC] animate-pulse rounded-2xl mb-4" />
        ))}
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
      className="bg-[#F8FAFC] rounded-[24px] p-6 md:p-8 border border-[#E5E7EB]"
    >
      <div className="flex items-center justify-between mb-8 pb-6 border-b border-[#E5E7EB]">
        <div className="flex items-center gap-3">
          <Package className="w-6 h-6 text-primary" />
          <h2 className="text-2xl font-bold text-[#111827]">Order History</h2>
        </div>
        <Link href="/my-orders" className="text-primary text-sm font-bold hover:text-[#111827] transition-colors">
          View All
        </Link>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-16 text-[#6B7280]">
          <Package className="w-12 h-12 mx-auto mb-4 opacity-40" />
          <p className="font-bold text-white mb-2">No orders yet</p>
          <Link href="/restaurants" className="text-primary text-sm font-bold">
            Browse restaurants →
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {orders.map((order: any) => {
            const status = order.status
              ? order.status.charAt(0).toUpperCase() + order.status.slice(1)
              : "Pending";
            const itemNames = (order.items || [])
              .map((i: any) => `${i.name || "Item"} (x${i.quantity})`)
              .join(", ");
            return (
              <div
                key={order.id}
                className="bg-white border border-[#E5E7EB] rounded-2xl p-4 md:p-6 flex flex-col md:flex-row gap-6 hover:border-[#E5E7EB] transition-colors"
              >
                <div className="w-full md:w-24 h-32 md:h-24 rounded-xl overflow-hidden flex-shrink-0 bg-[#F8FAFC]">
                  <SafeImage
                    src={order.restaurant_image_url}
                    fallback={RESTAURANT_FALLBACK}
                    alt={order.restaurant_name || "Order"}
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-1">
                      <h3 className="text-lg font-bold text-[#111827]">
                        {order.restaurant_name || "Restaurant"}
                      </h3>
                      <span
                        className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
                          status.toLowerCase() === "delivered"
                            ? "bg-green-500/10 text-green-400 border-green-500/20"
                            : status.toLowerCase() === "cancelled"
                              ? "bg-red-500/10 text-red-400 border-red-500/20"
                              : "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
                        }`}
                      >
                        {status}
                      </span>
                    </div>
                    <p className="text-[#6B7280] text-sm mb-2">
                      {new Date(order.created_at).toLocaleString()} • {order.id.slice(0, 8)}…
                    </p>
                    <p className="text-[#6B7280] text-sm line-clamp-1">
                      {itemNames || "Order items"}
                    </p>
                  </div>

                  <div className="mt-4 flex items-center justify-between flex-wrap gap-3">
                    <span className="text-white font-bold">
                      ₹{parseFloat(order.total_amount || 0).toFixed(2)}
                    </span>
                    <div className="flex gap-3 flex-wrap">
                      {isActive(order.status) && (
                        <button
                          onClick={() => router.push(`/track-order?id=${order.id}`)}
                          className="text-[#6B7280] hover:text-[#111827] text-sm font-bold flex items-center gap-1 transition-colors"
                        >
                          <MapPin className="w-4 h-4" /> Track
                        </button>
                      )}
                      <button
                        onClick={() => router.push(`/track-order?id=${order.id}`)}
                        className="text-[#6B7280] hover:text-[#111827] text-sm font-bold flex items-center gap-1 transition-colors"
                      >
                        Details <ChevronRight className="w-4 h-4" />
                      </button>
                      {canCancel(order.status) && (
                        <button
                          onClick={() => handleCancel(order.id)}
                          className="text-red-400 hover:text-red-300 text-sm font-bold flex items-center gap-1 transition-colors"
                        >
                          <XCircle className="w-4 h-4" /> Cancel
                        </button>
                      )}
                      {status.toLowerCase() === "delivered" && (
                        <button
                          onClick={() => handleReorder(order)}
                          className="bg-primary/10 hover:bg-primary/20 text-primary px-4 py-1.5 rounded-lg text-sm font-bold flex items-center gap-1.5 transition-colors"
                        >
                          <RefreshCw className="w-3.5 h-3.5" /> Reorder
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
