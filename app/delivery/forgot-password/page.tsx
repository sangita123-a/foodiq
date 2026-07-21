"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import api from "@/services/api";
import { useToast } from "@/contexts/ToastContext";

type Step = "request" | "reset";

export default function DeliveryForgotPasswordPage() {
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
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string } } };
      const msg = ax.response?.data?.message || "Failed to send reset instructions";
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
      router.push("/delivery/login");
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string } } };
      const msg = ax.response?.data?.message || "Failed to reset password";
      setError(msg);
      showToast(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-section flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white border border-border rounded-2xl p-8 shadow-sm">
        <h1 className="text-2xl font-black text-foreground mb-2">Reset Rider Password</h1>
        <p className="text-sm text-gray-text mb-6">
          {step === "request"
            ? "Enter your registered email to receive a reset code."
            : "Enter the reset code and your new password."}
        </p>

        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {step === "request" ? (
          <form onSubmit={handleRequestReset} className="space-y-4">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="rider@foodiq.com"
              required
              className="w-full border border-border rounded-xl px-4 py-3 text-sm"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary-hover text-white font-bold py-3 rounded-xl disabled:opacity-60"
            >
              {loading ? "Sending..." : "Send Reset Code"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <input
              type="text"
              value={resetCode}
              onChange={(e) => setResetCode(e.target.value)}
              placeholder="Reset code"
              required
              className="w-full border border-border rounded-xl px-4 py-3 text-sm"
            />
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="New password"
              required
              minLength={8}
              className="w-full border border-border rounded-xl px-4 py-3 text-sm"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary-hover text-white font-bold py-3 rounded-xl disabled:opacity-60"
            >
              {loading ? "Resetting..." : "Reset Password"}
            </button>
          </form>
        )}

        <p className="text-center text-sm text-gray-text mt-6">
          <Link href="/delivery/login" className="text-primary font-bold hover:underline">
            Back to rider login
          </Link>
        </p>
      </div>
    </div>
  );
}
