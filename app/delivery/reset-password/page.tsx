"use client";

import React, { Suspense, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Mail,
  KeyRound,
  Lock,
  Loader2,
  ArrowRight,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import api from "@/services/api";
import { useToast } from "@/contexts/ToastContext";
import { getAuthErrorMessage } from "@/lib/authErrors";
import DeliveryAuthLayout from "@/components/delivery/DeliveryAuthLayout";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();

  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const emailParam = searchParams.get("email");
    if (emailParam) {
      setEmail(emailParam);
    }
  }, [searchParams]);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setFieldErrors({});

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedOtp = otp.trim();
    const errors: Record<string, string> = {};

    if (!normalizedEmail) {
      errors.email = "Email address is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      errors.email = "Please enter a valid email address";
    }

    if (!normalizedOtp) {
      errors.otp = "OTP verification code is required";
    }

    if (!newPassword) {
      errors.new_password = "New password is required";
    } else if (newPassword.length < 8) {
      errors.new_password = "Password must be at least 8 characters";
    }

    if (!confirmPassword) {
      errors.confirm_password = "Confirm password is required";
    } else if (newPassword !== confirmPassword) {
      errors.confirm_password = "Passwords do not match";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setLoading(false);
      return;
    }

    try {
      const res = await api.post("/api/delivery/reset-password", {
        email: normalizedEmail,
        code: normalizedOtp,
        otp: normalizedOtp,
        new_password: newPassword,
        confirm_password: confirmPassword,
      });

      if (res.data && res.data.success) {
        showToast(
          res.data.message || "Password reset successfully. Please sign in with your new password.",
          "success"
        );
        router.push("/delivery/login");
        return;
      }

      const msg = res.data?.message || "Failed to reset password. Invalid OTP or request.";
      setError(msg);
      showToast(msg, "error");
    } catch (err: unknown) {
      const msg = getAuthErrorMessage(
        err,
        "Failed to reset password. Please check your OTP code and try again."
      );
      setError(msg);
      showToast(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DeliveryAuthLayout
      title="Reset Password"
      subtitle="Enter the OTP sent to your email along with your new password."
      badge="Password Recovery"
      showBackButton
      backHref="/delivery/forgot-password"
    >
      {error && (
        <div className="flex items-start gap-3 p-4 mb-6 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0 text-red-600 mt-0.5" />
          <span className="flex-1 font-medium">{error}</span>
        </div>
      )}

      <form onSubmit={handleResetPassword} className="space-y-5" noValidate>
        {/* Email Address */}
        <div>
          <label htmlFor="reset-email" className="block text-sm font-semibold text-foreground mb-2">
            Email Address
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted">
              <Mail className="w-5 h-5" />
            </div>
            <input
              id="reset-email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: "" }));
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
          <label htmlFor="reset-otp" className="block text-sm font-semibold text-foreground mb-2">
            OTP Code
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted">
              <KeyRound className="w-5 h-5" />
            </div>
            <input
              id="reset-otp"
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={otp}
              onChange={(e) => {
                setOtp(e.target.value);
                if (fieldErrors.otp) setFieldErrors((prev) => ({ ...prev, otp: "" }));
                setError("");
              }}
              placeholder="Enter 6-digit OTP"
              className={`w-full bg-white text-foreground border rounded-xl pl-11 pr-4 py-3 text-sm tracking-widest font-mono font-semibold focus:outline-none transition-all ${
                fieldErrors.otp ? "border-red-500" : "border-border focus:border-primary"
              }`}
            />
          </div>
          {fieldErrors.otp && (
            <p className="mt-1.5 text-xs font-medium text-red-600">{fieldErrors.otp}</p>
          )}
        </div>

        {/* New Password */}
        <div>
          <label htmlFor="reset-new-password" className="block text-sm font-semibold text-foreground mb-2">
            New Password
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted">
              <Lock className="w-5 h-5" />
            </div>
            <input
              id="reset-new-password"
              type={showNewPassword ? "text" : "password"}
              value={newPassword}
              onChange={(e) => {
                setNewPassword(e.target.value);
                if (fieldErrors.new_password) setFieldErrors((prev) => ({ ...prev, new_password: "" }));
                setError("");
              }}
              placeholder="Min. 8 characters"
              className={`w-full bg-white text-foreground border rounded-xl pl-11 pr-11 py-3 text-sm focus:outline-none transition-all ${
                fieldErrors.new_password ? "border-red-500" : "border-border focus:border-primary"
              }`}
            />
            <button
              type="button"
              onClick={() => setShowNewPassword((prev) => !prev)}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-muted hover:text-foreground"
            >
              {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {fieldErrors.new_password && (
            <p className="mt-1.5 text-xs font-medium text-red-600">{fieldErrors.new_password}</p>
          )}
        </div>

        {/* Confirm Password */}
        <div>
          <label htmlFor="reset-confirm-password" className="block text-sm font-semibold text-foreground mb-2">
            Confirm New Password
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted">
              <Lock className="w-5 h-5" />
            </div>
            <input
              id="reset-confirm-password"
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                if (fieldErrors.confirm_password) setFieldErrors((prev) => ({ ...prev, confirm_password: "" }));
                setError("");
              }}
              placeholder="Re-enter new password"
              className={`w-full bg-white text-foreground border rounded-xl pl-11 pr-11 py-3 text-sm focus:outline-none transition-all ${
                fieldErrors.confirm_password ? "border-red-500" : "border-border focus:border-primary"
              }`}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword((prev) => !prev)}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-muted hover:text-foreground"
            >
              {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {fieldErrors.confirm_password && (
            <p className="mt-1.5 text-xs font-medium text-red-600">{fieldErrors.confirm_password}</p>
          )}
        </div>

        {/* Submit Reset Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-primary hover:bg-primary-hover text-white font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-button disabled:opacity-60 disabled:cursor-not-allowed text-sm mt-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Resetting Password...</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="w-5 h-5" />
              <span>Reset Password</span>
            </>
          )}
        </button>
      </form>

      {/* Footer Link */}
      <div className="mt-8 pt-6 border-t border-border text-center text-sm text-gray-text">
        <span>Back to </span>
        <Link
          href="/delivery/login"
          className="font-bold text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-primary/20 rounded"
        >
          Sign In
        </Link>
      </div>
    </DeliveryAuthLayout>
  );
}

export default function DeliveryResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center p-8 text-muted">Loading reset page...</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
