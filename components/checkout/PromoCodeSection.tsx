"use client";

import { useState, useEffect } from "react";
import { Tag, CheckCircle2, XCircle } from "lucide-react";
import api from "@/services/api";

type Props = {
  appliedDiscount: number;
  onApply: (discount: number, code: string | null) => void;
  autoApplyCode?: string | null;
};

export default function PromoCodeSection({ appliedDiscount, onApply, autoApplyCode }: Props) {
  const [code, setCode] = useState("");
  const [appliedCode, setAppliedCode] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(appliedDiscount > 0);
  const [isApplying, setIsApplying] = useState(false);
  const [autoApplied, setAutoApplied] = useState(false);

  const applyCode = async (codeToApply: string) => {
    if (!codeToApply.trim()) return;
    setIsApplying(true);
    setError("");

    try {
      const res = await api.post("/api/coupons/apply", { code: codeToApply.trim() });
      const { discount: discountAmount, code: applied, free_delivery } = res.data.data;

      setAppliedCode(applied);
      setCode(applied);
      onApply(parseFloat(discountAmount), applied);
      setSuccess(true);
      if (free_delivery) {
        setError("");
      }
    } catch (err: any) {
      onApply(0, null);
      setSuccess(false);
      setError(err.response?.data?.message || "Invalid or expired coupon code.");
    } finally {
      setIsApplying(false);
    }
  };

  useEffect(() => {
    if (autoApplyCode && !autoApplied && !success) {
      setAutoApplied(true);
      applyCode(autoApplyCode);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoApplyCode]);

  const handleApply = async () => {
    await applyCode(code);
  };

  const handleRemove = () => {
    setCode("");
    setAppliedCode("");
    onApply(0, null);
    setSuccess(false);
    setError("");
  };

  return (
    <div className="bg-[#F8FAFC] rounded-2xl p-6 border border-[#E5E7EB] mb-6">
      <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
        <Tag className="w-5 h-5 text-primary" />
        Promo Code
      </h3>

      {!success ? (
        <div>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Enter Code (e.g. WELCOME50)"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value);
                  setError("");
                }}
                className="w-full bg-white text-[#111827] border border-[#E5E7EB] rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-primary transition-colors uppercase"
              />
            </div>
            <button
              onClick={handleApply}
              disabled={!code || isApplying}
              className="bg-[#F8FAFC] hover:bg-[#F8FAFC] disabled:opacity-50 disabled:hover:bg-[#F8FAFC] text-white px-6 rounded-xl text-sm font-bold transition-colors"
            >
              {isApplying ? "..." : "Apply"}
            </button>
          </div>
          {error && (
            <div className="flex items-center gap-1.5 text-red-500 mt-2 text-sm">
              <XCircle className="w-4 h-4" /> {error}
            </div>
          )}
        </div>
      ) : (
        <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-green-400 font-bold">
            <CheckCircle2 className="w-5 h-5" />
            &apos;{appliedCode}&apos; applied!
          </div>
          <button
            onClick={handleRemove}
            className="text-[#6B7280] hover:text-[#111827] text-sm font-bold transition-colors"
          >
            Remove
          </button>
        </div>
      )}
    </div>
  );
}
