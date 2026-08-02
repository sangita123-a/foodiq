"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { mutate } from "swr";
import {
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Clock,
  MapPin,
  Phone,
  Store,
  User,
  ShoppingBag,
  ArrowRight,
  RefreshCw,
  ChevronLeft,
  KeyRound,
  Lock,
  PackageCheck,
  Sparkles,
} from "lucide-react";
import DeliveryShell from "@/components/delivery/DeliveryShell";
import { useAssignedOrders, useDeliveryOrder } from "@/hooks/useDeliveryData";
import {
  verifyDeliveryOrderOtp,
  formatCurrency,
  type DeliveryOrder,
} from "@/services/deliveryApi";

function VerifyOtpContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialOrderId = searchParams.get("orderId") || "";

  const { data: assignedOrders, isLoading: isLoadingAssigned } = useAssignedOrders();
  const [selectedOrderId, setSelectedOrderId] = useState<string>(initialOrderId);

  useEffect(() => {
    if (!selectedOrderId && assignedOrders && assignedOrders.length > 0) {
      const activeOut = assignedOrders.find(
        (o) =>
          (o.assignment_status || o.order_status || "").toLowerCase().replace(/\s+/g, "_") ===
          "out_for_delivery"
      );
      if (activeOut) {
        setSelectedOrderId(activeOut.id || activeOut.order_id || "");
      } else if (assignedOrders[0]) {
        setSelectedOrderId(assignedOrders[0].id || assignedOrders[0].order_id || "");
      }
    }
  }, [assignedOrders, selectedOrderId]);

  const { data: orderDetails, isLoading: isLoadingOrder, error: orderError } = useDeliveryOrder(
    selectedOrderId || null
  );

  const [otpDigits, setOtpDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [verifiedOrder, setVerifiedOrder] = useState<DeliveryOrder | null>(null);

  const handleDigitChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newDigits = [...otpDigits];
    newDigits[index] = value.slice(-1);
    setOtpDigits(newDigits);
    setErrorMsg(null);

    // Auto-advance focus to next digit box
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-input-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      const prevInput = document.getElementById(`otp-input-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").trim();
    if (/^\d{6}$/.test(pasted)) {
      const digits = pasted.split("");
      setOtpDigits(digits);
      setErrorMsg(null);
      const lastInput = document.getElementById("otp-input-5");
      lastInput?.focus();
    }
  };

  const fullOtp = otpDigits.join("");

  const handleVerify = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (fullOtp.length !== 6) {
      setErrorMsg("Please enter a complete 6-digit OTP code.");
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg(null);

      const result = await verifyDeliveryOrderOtp(selectedOrderId, fullOtp);
      setVerifiedOrder(result);
      setIsSuccess(true);

      await Promise.all([
        mutate("/api/delivery/orders/assigned"),
        mutate("/api/delivery/dashboard"),
      ]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Invalid OTP code. Please check with customer.";
      setErrorMsg(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeOrder = orderDetails || assignedOrders?.find((o) => (o.id || o.order_id) === selectedOrderId);
  const itemsList = activeOrder?.items || activeOrder?.order_items || [];

  return (
    <DeliveryShell>
      <div className="max-w-3xl mx-auto space-y-6 pb-12">
        {/* Header navigation */}
        <div className="flex items-center justify-between">
          <Link
            href="/delivery/orders/assigned"
            className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Back to Assigned Orders</span>
          </Link>

          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5" />
            <span>Customer Handover Security</span>
          </span>
        </div>

        {/* Success Screen */}
        {isSuccess ? (
          <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-emerald-200 dark:border-emerald-800/80 p-8 sm:p-12 text-center space-y-6 shadow-xl animate-fade-in">
            <div className="w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-12 h-12 stroke-[2.5]" />
            </div>

            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 text-xs font-bold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Verification Successful</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-foreground">Order Delivered Successfully!</h2>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                Customer OTP verified. The order is now marked as completed and your delivery earnings have been credited.
              </p>
            </div>

            <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl p-6 border border-zinc-200/80 dark:border-zinc-800 max-w-md mx-auto text-left space-y-3">
              <div className="flex justify-between items-center text-xs font-bold text-muted-foreground uppercase border-b border-zinc-200 dark:border-zinc-800 pb-2">
                <span>Order Summary</span>
                <span>#{selectedOrderId.slice(0, 8)}</span>
              </div>
              <div className="flex justify-between text-sm font-semibold">
                <span>Customer</span>
                <span className="text-foreground">{activeOrder?.customer_name || activeOrder?.customer?.name || "Customer"}</span>
              </div>
              <div className="flex justify-between text-sm font-semibold">
                <span>Total Amount</span>
                <span className="text-foreground">{formatCurrency(activeOrder?.total_amount || 0)}</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-emerald-600 dark:text-emerald-400 pt-1 border-t border-zinc-200 dark:border-zinc-800">
                <span>Delivery Fee Earned</span>
                <span>+{formatCurrency(activeOrder?.delivery_fee || 40)}</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
              <button
                onClick={() => router.push("/delivery/dashboard")}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-primary text-white font-bold text-sm shadow-button hover:opacity-95 transition-opacity"
              >
                Go to Dashboard
              </button>

              <Link
                href="/delivery/orders/assigned"
                className="w-full sm:w-auto px-6 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 text-foreground font-bold text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
              >
                View Remaining Assignments
              </Link>
            </div>
          </div>
        ) : (
          /* Main Verification Form Card */
          <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
            {/* Title Section */}
            <div className="p-6 sm:p-8 bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-900 text-white space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/20 text-primary flex items-center justify-center font-bold">
                  <KeyRound className="w-5 h-5 text-primary-light" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-black tracking-tight">Delivery OTP Verification</h1>
                  <p className="text-xs text-zinc-400">
                    Ask the customer for their 6-digit delivery confirmation PIN to complete handover
                  </p>
                </div>
              </div>
            </div>

            {/* Order Selector (if multiple assigned) */}
            {assignedOrders && assignedOrders.length > 1 && (
              <div className="p-4 bg-zinc-50 dark:bg-zinc-800/40 border-b border-zinc-200 dark:border-zinc-800 flex items-center gap-3">
                <label htmlFor="select-assigned-order" className="text-xs font-bold text-muted-foreground shrink-0">Select Order:</label>
                <select
                  id="select-assigned-order"
                  value={selectedOrderId}
                  onChange={(e) => {
                    setSelectedOrderId(e.target.value);
                    setOtpDigits(["", "", "", "", "", ""]);
                    setErrorMsg(null);
                  }}
                  className="flex-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  {assignedOrders.map((ord) => {
                    const id = ord.id || ord.order_id || "";
                    const name = ord.customer_name || ord.customer?.name || "Customer";
                    return (
                      <option key={id} value={id}>
                        #{id.slice(0, 8)} — {name} ({formatCurrency(ord.total_amount)})
                      </option>
                    );
                  })}
                </select>
              </div>
            )}

            <div className="p-6 sm:p-8 space-y-8">
              {/* Order & Customer Briefing */}
              {isLoadingOrder || isLoadingAssigned ? (
                <div className="p-6 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 animate-pulse space-y-3">
                  <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-1/3" />
                  <div className="h-8 bg-zinc-200 dark:bg-zinc-700 rounded w-2/3" />
                </div>
              ) : activeOrder ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Customer Card */}
                  <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/50 space-y-2">
                    <div className="flex items-center justify-between border-b border-emerald-200/40 dark:border-emerald-900/40 pb-2">
                      <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                        <User className="w-4 h-4" />
                        Customer Information
                      </span>
                      {activeOrder.customer?.phone && (
                        <a
                          href={`tel:${activeOrder.customer.phone}`}
                          className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 hover:underline"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          <span>Call</span>
                        </a>
                      )}
                    </div>
                    <h4 className="font-extrabold text-foreground text-sm">
                      {activeOrder.customer_name || activeOrder.customer?.name || "Customer"}
                    </h4>
                    <p className="text-xs text-muted-foreground flex items-start gap-1">
                      <MapPin className="w-3.5 h-3.5 shrink-0 text-emerald-500 mt-0.5" />
                      <span>{activeOrder.customer_address || activeOrder.customer?.address || "Address"}</span>
                    </p>
                  </div>

                  {/* Restaurant & Order Card */}
                  <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/80 dark:border-zinc-800 space-y-2">
                    <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-2">
                      <span className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
                        <Store className="w-4 h-4" />
                        Restaurant & Order Details
                      </span>
                      <span className="text-xs font-mono font-bold text-muted-foreground">
                        #{selectedOrderId.slice(0, 8)}
                      </span>
                    </div>
                    <h4 className="font-extrabold text-foreground text-sm">
                      {activeOrder.restaurant_name || activeOrder.restaurant?.name || "Restaurant"}
                    </h4>
                    <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
                      <span>Total: <strong className="text-foreground">{formatCurrency(activeOrder.total_amount)}</strong></span>
                      <span>Items: <strong className="text-foreground">{itemsList.length || activeOrder.item_count || 1}</strong></span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 text-xs font-medium flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>Please select an active order to perform OTP verification.</span>
                </div>
              )}

              {/* OTP Input Form */}
              <form onSubmit={handleVerify} className="space-y-6 pt-2">
                <div className="text-center space-y-2">
                  <label className="text-sm font-bold text-foreground block">
                    Enter 6-Digit Delivery OTP
                  </label>
                  <p className="text-xs text-muted-foreground">
                    The customer can view their 6-digit code on their Foodiq order tracking screen
                  </p>
                </div>

                {/* 6 Digit Input Boxes */}
                <div className="flex justify-center items-center gap-2 sm:gap-3" onPaste={handlePaste}>
                  {otpDigits.map((digit, idx) => (
                    <input
                      key={idx}
                      id={`otp-input-${idx}`}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleDigitChange(idx, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(idx, e)}
                      autoFocus={idx === 0}
                      className="w-11 h-14 sm:w-14 sm:h-16 text-center text-xl sm:text-2xl font-black font-mono bg-zinc-50 dark:bg-zinc-800/80 rounded-2xl border-2 border-zinc-200 dark:border-zinc-700 text-foreground focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/20 transition-all"
                    />
                  ))}
                </div>

                {/* Error Banner */}
                {errorMsg && (
                  <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 flex items-start gap-2.5 text-xs font-medium animate-shake">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
                    <div className="flex-1">{errorMsg}</div>
                  </div>
                )}

                {/* Submit Action Button */}
                <button
                  type="submit"
                  disabled={fullOtp.length !== 6 || isSubmitting || !selectedOrderId}
                  className="w-full py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-base shadow-button transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      <span>Verifying OTP...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-5 h-5" />
                      <span>Verify OTP & Complete Delivery</span>
                    </>
                  )}
                </button>
              </form>

              {/* Security Banner */}
              <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/30 border border-zinc-200/60 dark:border-zinc-800 text-xs text-muted-foreground flex items-center gap-3">
                <ShieldCheck className="w-5 h-5 text-primary shrink-0" />
                <div>
                  <strong>Secure Verification:</strong> Maximum 5 attempts allowed per order. OTP expires after 15 minutes.
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DeliveryShell>
  );
}

export default function VerifyOtpPage() {
  return (
    <Suspense
      fallback={
        <DeliveryShell>
          <div className="p-12 text-center text-sm font-bold text-muted-foreground">
            Loading OTP Verification...
          </div>
        </DeliveryShell>
      }
    >
      <VerifyOtpContent />
    </Suspense>
  );
}
