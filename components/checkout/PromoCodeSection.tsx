"use client";

import { useState, useEffect } from "react";
import { Tag, CheckCircle2, XCircle } from "lucide-react";
import useSWR from "swr";
import api from "@/services/api";
import { fetchCouponRecommendations } from "@/services/featuresApi";
import { getOfferByCode } from "@/lib/data/20offersData";

type Props = {
  appliedDiscount: number;
  onApply: (discount: number, code: string | null, freeDelivery?: boolean) => void;
  autoApplyCode?: string | null;
  cartTotal?: number;
};

export default function PromoCodeSection({
  appliedDiscount,
  onApply,
  autoApplyCode,
  cartTotal = 0,
}: Props) {
  const [code, setCode] = useState("");
  const [appliedCode, setAppliedCode] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(appliedDiscount > 0);
  const [isApplying, setIsApplying] = useState(false);
  const [autoApplied, setAutoApplied] = useState(false);

  const { data: couponRecs } = useSWR(
    !success ? ["coupon-recs", cartTotal] : null,
    () => fetchCouponRecommendations(cartTotal)
  );
  const suggestions =
    (couponRecs?.recommendations as Array<Record<string, unknown>>) || [];

  const applyCode = async (codeToApply: string) => {
    if (!codeToApply.trim()) return;
    setIsApplying(true);
    setError("");

    try {
      const res = await api.post("/api/coupons/apply", {
        code: codeToApply.trim(),
      });
      const { discount: discountAmount, code: applied, free_delivery: freeDelivery } = res.data.data;

      setAppliedCode(applied);
      setCode(applied);
      onApply(parseFloat(discountAmount), applied, Boolean(freeDelivery));
      setSuccess(true);
    } catch (err: unknown) {
      const localOffer = getOfferByCode(codeToApply);
      if (localOffer) {
        let discount = localOffer.discountAmount;
        if (localOffer.discountType === "percentage") {
          discount = Math.round(cartTotal * (localOffer.discountAmount / 100));
          if (localOffer.maxDiscount && discount > localOffer.maxDiscount) {
            discount = localOffer.maxDiscount;
          }
        }
        setAppliedCode(localOffer.code);
        setCode(localOffer.code);
        onApply(discount, localOffer.code);
        setSuccess(true);
        setError("");
        return;
      }

      onApply(0, null);
      setSuccess(false);
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Invalid or expired coupon code.";
      setError(msg);
    } finally {
      setIsApplying(false);
    }
  };

  useEffect(() => {
    if (autoApplyCode && !autoApplied && !success) {
      setAutoApplied(true);
      void applyCode(autoApplyCode);
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
      <h3 className="text-xl font-bold text-[#111827] mb-4 flex items-center gap-2">
        <Tag className="w-5 h-5 text-[#E23744]" />
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
                className="w-full bg-white text-[#111827] border border-[#E5E7EB] rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-[#E23744] transition-colors uppercase"
              />
            </div>
            <button
              onClick={handleApply}
              disabled={!code || isApplying}
              type="button"
              className="bg-[#E23744] hover:bg-[#C81E34] disabled:opacity-50 text-white px-6 rounded-xl text-sm font-bold transition-colors"
            >
              {isApplying ? "..." : "Apply"}
            </button>
          </div>
          {error && (
            <div className="flex items-center gap-1.5 text-red-500 mt-2 text-sm">
              <XCircle className="w-4 h-4" /> {error}
            </div>
          )}
          {suggestions.length > 0 ? (
            <div className="mt-4 flex flex-wrap gap-2">
              <p className="w-full text-xs font-bold text-[#6B7280] mb-1">
                Recommended for your cart
              </p>
              {suggestions.slice(0, 3).map((s) => (
                <button
                  key={String(s.code)}
                  type="button"
                  onClick={() => void applyCode(String(s.code))}
                  className="text-xs font-bold px-3 py-1.5 rounded-xl border border-[#E5E7EB] bg-white text-[#111827] hover:border-[#E23744]"
                >
                  {String(s.code)}
                  {s.eligible === false ? " (add more)" : ""}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      ) : (
        <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-green-600 font-bold">
            <CheckCircle2 className="w-5 h-5" />
            &apos;{appliedCode}&apos; applied!
          </div>
          <button
            onClick={handleRemove}
            type="button"
            className="text-[#6B7280] hover:text-[#111827] text-sm font-bold transition-colors"
          >
            Remove
          </button>
        </div>
      )}
    </div>
  );
}
