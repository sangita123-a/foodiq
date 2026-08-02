"use client";

import React, { Suspense, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Mail, KeyRound, Loader2, CheckCircle2, AlertCircle, RefreshCw } from "lucide-react";
import api from "@/services/api";
import { useToast } from "@/contexts/ToastContext";
import { getAuthErrorMessage } from "@/lib/authErrors";
import DeliveryAuthLayout from "@/components/delivery/DeliveryAuthLayout";

function VerifyOtpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();

  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; otp?: string }>({});
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    const emailParam = searchParams.get("email");
    if (emailParam) {
      setEmail(emailParam);
    }
  }, [searchParams]);

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setInterval(() => setCooldown((prev) => prev - 1), 1000);
      return () => clearInterval(timer);
    }
  }, [cooldown]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setFieldErrors({});

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedOtp = otp.trim();
    const errors: { email?: string; otp?: string } = {};

    if (!normalizedEmail) {
      errors.email = "Email address is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      errors.email = "Please enter a valid email address";
    }

    if (!normalizedOtp) {
      errors.otp = "OTP code is required";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setLoading(false);
      return;
    }

    try {
      const res = await api.post("/api/delivery/verify-otp", {
        destination: normalizedEmail,
        email: normalizedEmail,
        code: normalizedOtp,
        otp: normalizedOtp,
      });

      if (res.data && res.data.success) {
        const msg =
          res.data.message || "Email verified successfully. Waiting for Admin Approval.";
        showToast(msg, "success");
        router.push("/delivery/login?verified=true");
        return;
      }

      const msg = res.data?.message || "Verification failed. Invalid or expired OTP code.";
      setError(msg);
      showToast(msg, "error");
    } catch (err: unknown) {
      const msg = getAuthErrorMessage(
        err,
        "OTP verification failed. Please check the code and try again."
      );
      setError(msg);
      showToast(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      setFieldErrors({ email: "Email address is required to resend OTP" });
      return;
    }

    setResending(true);
    setError("");

    try {
      const res = await api.post("/api/delivery/send-otp", {
        destination: normalizedEmail,
        email: normalizedEmail,
      });

      if (res.data && res.data.success) {
        showToast(
          res.data.message || "A new verification OTP has been sent to your email.",
          "success"
        );
        setCooldown(60);
      } else {
        const msg = res.data?.message || "Failed to resend OTP. Please try again.";
        setError(msg);
        showToast(msg, "error");
      }
    } catch (err: unknown) {
      const msg = getAuthErrorMessage(err, "Failed to resend OTP. Please try again.");
      setError(msg);
      showToast(msg, "error");
    } finally {
      setResending(false);
    }
  };

  return (
    <DeliveryAuthLayout
      title="Verify Your Account"
      subtitle="Enter the OTP verification code sent to your email."
      badge="OTP Verification"
      showBackButton
      backHref="/delivery/login"
    >
      {error && (
        <div className="flex items-start gap-3 p-4 mb-6 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0 text-red-600 mt-0.5" />
          <span className="flex-1 font-medium">{error}</span>
        </div>
      )}

      <form onSubmit={handleVerify} className="space-y-5" noValidate>
        {/* Email Address */}
        <div>
          <label htmlFor="verify-email" className="block text-sm font-semibold text-foreground mb-2">
            Email Address
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted">
              <Mail className="w-5 h-5" />
            </div>
            <input
              id="verify-email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: undefined }));
                setError("");
              }}
              placeholder="rider@foodiq.com"
              className={`w-full bg-white text-foreground border rounded-xl pl-11 pr-4 py-3 text-sm focus:outline-none transition-all ${
                fieldErrors.email ? "border-red-500" : "border-border focus:border-primary"
              }`}
            />
          </div>
          {fieldErrors.email && (
            <p className="mt-1.5 text-xs font-medium text-red-600">{fieldErrors.email}</p>
          )}
        </div>

        {/* OTP Code */}
        <div>
          <label htmlFor="verify-otp-code" className="block text-sm font-semibold text-foreground mb-2">
            OTP Verification Code
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted">
              <KeyRound className="w-5 h-5" />
            </div>
            <input
              id="verify-otp-code"
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={otp}
              onChange={(e) => {
                setOtp(e.target.value);
                if (fieldErrors.otp) setFieldErrors((prev) => ({ ...prev, otp: undefined }));
                setError("");
              }}
              placeholder="Enter 6-digit OTP (e.g. 123456)"
              className={`w-full bg-white text-foreground border rounded-xl pl-11 pr-4 py-3 text-sm tracking-widest font-mono font-semibold focus:outline-none transition-all ${
                fieldErrors.otp ? "border-red-500" : "border-border focus:border-primary"
              }`}
            />
          </div>
          {fieldErrors.otp && (
            <p className="mt-1.5 text-xs font-medium text-red-600">{fieldErrors.otp}</p>
          )}
        </div>

        {/* Verify Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-primary hover:bg-primary-hover text-white font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-button disabled:opacity-60 disabled:cursor-not-allowed text-sm mt-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Verifying OTP...</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="w-5 h-5" />
              <span>Verify Email</span>
            </>
          )}
        </button>
      </form>

      {/* Resend OTP Section */}
      <div className="mt-6 pt-6 border-t border-border flex flex-col items-center gap-3">
        <p className="text-xs text-gray-text">Didn't receive the OTP code?</p>
        <button
          type="button"
          onClick={handleResendOtp}
          disabled={resending || cooldown > 0}
          className="inline-flex items-center gap-2 text-xs font-bold text-primary hover:underline disabled:text-muted disabled:no-underline"
        >
          {resending ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Sending OTP...</span>
            </>
          ) : cooldown > 0 ? (
            <span>Resend OTP in {cooldown}s</span>
          ) : (
            <>
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Resend OTP</span>
            </>
          )}
        </button>
      </div>

      <div className="mt-6 text-center text-xs text-gray-text">
        <Link href="/delivery/login" className="hover:text-primary transition-colors font-medium">
          Return to Sign In
        </Link>
      </div>
    </DeliveryAuthLayout>
  );
}

export default function DeliveryVerifyOtpPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center p-8 text-muted">Loading verify page...</div>}>
      <VerifyOtpForm />
    </Suspense>
  );
}
