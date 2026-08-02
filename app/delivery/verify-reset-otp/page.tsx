"use client";

import React, { Suspense, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Mail, KeyRound, Loader2, ArrowRight, AlertCircle, RefreshCw } from "lucide-react";
import api from "@/services/api";
import { useToast } from "@/contexts/ToastContext";
import { getAuthErrorMessage } from "@/lib/authErrors";
import DeliveryAuthLayout from "@/components/delivery/DeliveryAuthLayout";

function VerifyResetOtpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();

  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState("");
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    const emailParam = searchParams.get("email");
    if (emailParam) {
      setEmail(emailParam);
    }
  }, [searchParams]);

  // 60-second countdown timer for OTP resend
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      setCanResend(false);
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    } else {
      setCanResend(true);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedOtp = otp.trim();

    if (!normalizedEmail) {
      setError("Email address is required.");
      setLoading(false);
      return;
    }

    if (!normalizedOtp || normalizedOtp.length !== 6) {
      setError("Please enter a valid 6-digit OTP code.");
      setLoading(false);
      return;
    }

    try {
      const res = await api.post("/api/delivery/verify-reset-otp", {
        email: normalizedEmail,
        otp: normalizedOtp,
        code: normalizedOtp,
      });

      if (res.data && res.data.success) {
        showToast(res.data.message || "OTP verified successfully!", "success");
        router.push(
          `/delivery/reset-password?email=${encodeURIComponent(normalizedEmail)}&otp=${encodeURIComponent(normalizedOtp)}`
        );
        return;
      }

      const msg = res.data?.message || "Invalid or expired OTP code.";
      setError(msg);
      showToast(msg, "error");
    } catch (err: unknown) {
      const msg = getAuthErrorMessage(err, "OTP verification failed. Please try again.");
      setError(msg);
      showToast(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!canResend || resending) return;
    setResending(true);
    setError("");

    const normalizedEmail = email.trim().toLowerCase();

    try {
      const res = await api.post("/api/delivery/forgot-password", {
        email: normalizedEmail,
      });

      if (res.data && res.data.success) {
        showToast(res.data.message || "A new 6-digit OTP has been sent to your email.", "success");
        setCountdown(60);
        setCanResend(false);
        setOtp("");
      } else {
        const msg = res.data?.message || "Failed to resend OTP code.";
        setError(msg);
        showToast(msg, "error");
      }
    } catch (err: unknown) {
      const msg = getAuthErrorMessage(err, "Failed to resend OTP code. Please try again.");
      setError(msg);
      showToast(msg, "error");
    } finally {
      setResending(false);
    }
  };

  return (
    <DeliveryAuthLayout
      title="Verify Reset OTP"
      subtitle="Enter the 6-digit security code sent to your email."
      badge="Step 2 of 3"
      showBackButton
      backHref="/delivery/forgot-password"
    >
      {error && (
        <div className="flex items-start gap-3 p-4 mb-6 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0 text-red-600 mt-0.5" />
          <span className="flex-1 font-medium">{error}</span>
        </div>
      )}

      <form onSubmit={handleVerify} className="space-y-5" noValidate>
        {/* Email Display / Input */}
        <div>
          <label htmlFor="verify-email" className="block text-sm font-semibold text-foreground mb-2">
            Registered Email
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted">
              <Mail className="w-5 h-5 text-gray-400" />
            </div>
            <input
              id="verify-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="partner@example.com"
              className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-foreground text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition"
              required
            />
          </div>
        </div>

        {/* 6-Digit OTP Field */}
        <div>
          <label htmlFor="otp-input" className="block text-sm font-semibold text-foreground mb-2">
            6-Digit Verification OTP
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted">
              <KeyRound className="w-5 h-5 text-gray-400" />
            </div>
            <input
              id="otp-input"
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
              placeholder="123456"
              className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-foreground text-center font-mono font-bold text-xl tracking-[0.4em] focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition"
              required
            />
          </div>
        </div>

        {/* Resend Timer & Button */}
        <div className="flex items-center justify-between pt-1">
          <span className="text-xs text-gray-500 font-medium">
            {!canResend ? (
              <span>Resend available in <strong className="text-red-600">{countdown}s</strong></span>
            ) : (
              <span>Didn&apos;t receive the code?</span>
            )}
          </span>
          <button
            type="button"
            onClick={handleResendOtp}
            disabled={!canResend || resending}
            className={`text-xs font-bold inline-flex items-center gap-1.5 transition ${
              canResend && !resending
                ? "text-red-600 hover:text-red-700 hover:underline cursor-pointer"
                : "text-gray-400 cursor-not-allowed"
            }`}
          >
            {resending ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <RefreshCw className="w-3.5 h-3.5" />
            )}
            Resend OTP
          </button>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading || otp.length !== 6}
          className="w-full py-3.5 px-4 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-bold rounded-xl shadow-lg shadow-red-600/25 hover:shadow-red-600/40 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer text-sm"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Verifying OTP...</span>
            </>
          ) : (
            <>
              <span>Verify & Continue</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>
    </DeliveryAuthLayout>
  );
}

export default function VerifyResetOtpPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-red-600" />
        </div>
      }
    >
      <VerifyResetOtpForm />
    </Suspense>
  );
}
