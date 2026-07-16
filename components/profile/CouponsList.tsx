"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Ticket, Copy, CheckCircle2, Check, X } from "lucide-react";
import useSWR from "swr";
import api from "@/services/api";
import { useToast } from "@/contexts/ToastContext";

export default function CouponsList() {
  const { data, isLoading, mutate } = useSWR("/api/coupons/mine");
  const available = data?.available || [];
  const applied = data?.applied || [];
  const expired = data?.expired || [];
  const { showToast } = useToast();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [tab, setTab] = useState<"available" | "applied" | "expired">("available");

  const list =
    tab === "available" ? available : tab === "applied" ? applied : expired;

  const handleCopy = (id: string, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleApply = async (code: string) => {
    try {
      await api.post("/api/coupons/apply", { code });
      mutate();
      showToast("Coupon applied", "success");
    } catch (err: any) {
      showToast(err.response?.data?.message || "Failed to apply coupon", "error");
    }
  };

  const handleRemove = async (couponId: string) => {
    try {
      await api.delete(`/api/coupons/${couponId}`);
      mutate();
      showToast("Coupon removed", "success");
    } catch (err: any) {
      showToast(err.response?.data?.message || "Failed to remove", "error");
    }
  };

  const handleSave = async (couponId: string) => {
    try {
      await api.post("/api/coupons/save", { coupon_id: couponId });
      mutate();
      showToast("Coupon saved", "success");
    } catch (err: any) {
      showToast(err.response?.data?.message || "Failed to save", "error");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
      className="bg-[#171717] rounded-[24px] p-6 md:p-8 border border-white/5"
    >
      <div className="flex items-center gap-3 mb-6 pb-6 border-b border-white/10">
        <Ticket className="w-6 h-6 text-primary" />
        <h2 className="text-2xl font-bold text-white">My Coupons</h2>
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        {(["available", "applied", "expired"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-full text-sm font-bold capitalize ${
              tab === t ? "bg-primary text-white" : "bg-white/5 text-gray-400 hover:text-white"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="text-white text-center py-10">Loading coupons...</div>
      ) : list.length === 0 ? (
        <div className="text-center py-12 text-gray-400">No {tab} coupons.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {list.map((coupon: any) => {
            const id = coupon.id || coupon.coupon_id;
            const code = coupon.code;
            const title =
              coupon.discount_type === "percentage"
                ? `${coupon.discount_amount}% Off`
                : `Flat ₹${coupon.discount_amount} Off`;
            const desc = `Valid on orders above ₹${coupon.min_order_amount}`;
            const expiry = coupon.valid_until
              ? `Valid till ${new Date(coupon.valid_until).toLocaleDateString()}`
              : "No expiry";

            return (
              <div
                key={id}
                className={`bg-[#111] border border-white/5 hover:border-white/20 transition-colors rounded-2xl flex overflow-hidden group ${
                  tab === "expired" ? "opacity-60" : ""
                }`}
              >
                <div className="bg-primary/10 w-1/3 p-4 flex flex-col items-center justify-center border-r border-dashed border-white/10 relative">
                  <div className="absolute -top-3 -right-3 w-6 h-6 bg-[#171717] rounded-full"></div>
                  <div className="absolute -bottom-3 -right-3 w-6 h-6 bg-[#171717] rounded-full"></div>
                  <h3 className="text-xl font-black text-primary text-center leading-tight mb-2">
                    {title}
                  </h3>
                </div>

                <div className="p-4 md:p-6 flex-1 flex flex-col justify-between relative">
                  <div>
                    <p className="text-white font-bold mb-1">{desc}</p>
                    <p className="text-xs text-gray-500 mb-4">{expiry}</p>
                  </div>

                  <div className="flex items-center justify-between mt-auto gap-2 flex-wrap">
                    <div className="border border-white/10 bg-[#171717] px-3 py-1.5 rounded-lg text-sm font-bold text-white tracking-widest uppercase">
                      {code}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleCopy(id, code)}
                        className="text-gray-400 hover:text-white font-bold text-sm flex items-center gap-1.5"
                      >
                        {copiedId === id ? (
                          <>
                            <CheckCircle2 className="w-4 h-4 text-green-400" /> Copied
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4" /> Copy
                          </>
                        )}
                      </button>
                      {tab === "available" && (
                        <button
                          onClick={() => handleApply(code)}
                          className="text-primary font-bold text-sm flex items-center gap-1"
                        >
                          <Check className="w-4 h-4" /> Apply
                        </button>
                      )}
                      {tab === "applied" && (
                        <button
                          onClick={() => handleRemove(coupon.coupon_id || id)}
                          className="text-red-400 font-bold text-sm flex items-center gap-1"
                        >
                          <X className="w-4 h-4" /> Remove
                        </button>
                      )}
                      {tab === "available" && (
                        <button
                          onClick={() => handleSave(id)}
                          className="text-gray-400 hover:text-white font-bold text-xs"
                        >
                          Save
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
