"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import api from "@/services/api";
import { useToast } from "@/contexts/ToastContext";

type Step = "request" | "reset";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [step, setStep] = useState<Step>("request");
  const [email, setEmail] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await api.post("/api/auth/forgot-password", {
        email: email.trim().toLowerCase(),
      });
      showToast(res.data.message || "Reset instructions sent", "success");
      setStep("reset");
    } catch (err: any) {
      const msg = err.response?.data?.message || "Failed to send reset instructions";
      setError(msg);
      showToast(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await api.post("/api/auth/reset-password", {
        email: email.trim().toLowerCase(),
        reset_code: resetCode.trim(),
        new_password: newPassword,
      });
      showToast(res.data.message || "Password reset successful", "success");
      router.push("/login");
    } catch (err: any) {
      const msg = err.response?.data?.message || "Failed to reset password";
      setError(msg);
      showToast(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4 pt-24">
      <div className="max-w-md w-full bg-section border border-border p-8 rounded-2xl backdrop-blur-md">
        <h2 className="text-3xl font-bold text-foreground text-center mb-2">Forgot Password</h2>
        <p className="text-gray-text text-sm text-center mb-6">
          {step === "request"
            ? "Enter your email to receive reset instructions."
            : "Enter reset code FOODIQ and your new password."}
        </p>

        {error && (
          <div className="bg-red-500/20 border border-red-500 text-red-100 p-3 rounded-lg mb-6 text-sm">
            {error}
          </div>
        )}

        {step === "request" ? (
          <form onSubmit={handleRequestReset} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-text mb-2">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-section border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-[var(--color-primary)]"
                placeholder="Enter your email"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white font-medium py-3 rounded-xl disabled:opacity-70"
            >
              {loading ? "Sending..." : "Send Reset Instructions"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-text mb-2">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-section border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-[var(--color-primary)]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-text mb-2">Reset Code</label>
              <input
                type="text"
                required
                value={resetCode}
                onChange={(e) => setResetCode(e.target.value)}
                className="w-full bg-section border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-[var(--color-primary)]"
                placeholder="FOODIQ"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-text mb-2">New Password</label>
              <input
                type="password"
                required
                minLength={8}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full bg-section border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-[var(--color-primary)]"
                placeholder="At least 8 characters"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white font-medium py-3 rounded-xl disabled:opacity-70"
            >
              {loading ? "Resetting..." : "Reset Password"}
            </button>
            <button
              type="button"
              onClick={() => setStep("request")}
              className="w-full text-gray-text hover:text-foreground text-sm"
            >
              Back to email step
            </button>
          </form>
        )}

        <div className="mt-6 text-center text-gray-text text-sm">
          Remember your password?{" "}
          <Link href="/login" className="text-[var(--color-primary)] hover:underline">
            Login here
          </Link>
        </div>
      </div>
    </div>
  );
}
