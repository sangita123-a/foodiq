"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, Loader2, ArrowRight, AlertCircle, KeyRound } from "lucide-react";
import api from "@/services/api";
import { useToast } from "@/contexts/ToastContext";
import { getAuthErrorMessage } from "@/lib/authErrors";
import DeliveryAuthLayout from "@/components/delivery/DeliveryAuthLayout";

export default function DeliveryForgotPasswordPage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldError, setFieldError] = useState("");

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setFieldError("");

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      setFieldError("Email address is required");
      setLoading(false);
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setFieldError("Please enter a valid email address");
      setLoading(false);
      return;
    }

    try {
      const res = await api.post("/api/delivery/forgot-password", {
        email: normalizedEmail,
      });

      if (res.data && res.data.success) {
        showToast(
          res.data.message || "Reset OTP sent successfully to your email.",
          "success"
        );
        router.push(
          `/delivery/verify-reset-otp?email=${encodeURIComponent(normalizedEmail)}`
        );
        return;
      }

      const msg = res.data?.message || "Failed to send reset code. Please check your email.";
      setError(msg);
      showToast(msg, "error");
    } catch (err: unknown) {
      const msg = getAuthErrorMessage(
        err,
        "Failed to send reset code. Please check your email address."
      );
      setError(msg);
      showToast(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DeliveryAuthLayout
      title="Forgot Password"
      subtitle="Enter your delivery partner email to receive a password reset OTP."
      badge="Password Recovery"
      showBackButton
      backHref="/delivery/login"
    >
      {error && (
        <div className="flex items-start gap-3 p-4 mb-6 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0 text-red-600 mt-0.5" />
          <span className="flex-1 font-medium">{error}</span>
        </div>
      )}

      <form onSubmit={handleSendOtp} className="space-y-5" noValidate>
        {/* Email Field */}
        <div>
          <label htmlFor="forgot-email" className="block text-sm font-semibold text-foreground mb-2">
            Email Address
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted">
              <Mail className="w-5 h-5" />
            </div>
            <input
              id="forgot-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (fieldError) setFieldError("");
                setError("");
              }}
              placeholder="rider@foodiq.com"
              className={`w-full bg-white text-foreground border rounded-xl pl-11 pr-4 py-3 text-sm focus:outline-none transition-all ${
                fieldError ? "border-red-500" : "border-border focus:border-primary"
              }`}
            />
          </div>
          {fieldError && (
            <p className="mt-1.5 text-xs font-medium text-red-600">{fieldError}</p>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-primary hover:bg-primary-hover text-white font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-button disabled:opacity-60 disabled:cursor-not-allowed text-sm mt-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Sending OTP...</span>
            </>
          ) : (
            <>
              <KeyRound className="w-5 h-5" />
              <span>Send OTP</span>
            </>
          )}
        </button>
      </form>

      {/* Footer Link */}
      <div className="mt-8 pt-6 border-t border-border text-center text-sm text-gray-text">
        <span>Remember your password? </span>
        <Link
          href="/delivery/login"
          className="font-bold text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-primary/20 rounded"
        >
          Back to Sign In
        </Link>
      </div>
    </DeliveryAuthLayout>
  );
}
