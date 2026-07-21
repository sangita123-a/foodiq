"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/services/api";
import { useToast } from "@/contexts/ToastContext";

import { persistAuthUser } from "@/lib/authUser";
import { markAuthenticated } from "@/lib/authSession";
import { getAuthErrorMessage } from "@/lib/authErrors";

export default function LoginPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const normalizedEmail = email.trim().toLowerCase();

    try {
      const res = await api.post("/api/auth/login", {
        email: normalizedEmail,
        password,
      });
      if (res.data.success) {
        markAuthenticated(res.data.data.token);
        persistAuthUser(res.data.data);
        void import("@/lib/analytics/events").then(({ AnalyticsEvents, trackEvent }) => {
          trackEvent(AnalyticsEvents.login, {
            method: "email",
            role: res.data.data?.role || "customer",
          });
        });
        try {
          await api.post("/api/sessions/register");
        } catch (_) {}
        showToast(res.data.message || "Login successful!", "success");
        router.push("/");
      } else {
        const msg = res.data.message || "Login failed";
        setError(msg);
        showToast(msg, "error");
      }
    } catch (err: any) {
      const msg = getAuthErrorMessage(err, "Login failed");
      setError(msg);
      showToast(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 pt-24">
      <div className="max-w-md w-full bg-background border border-border p-8 rounded-2xl shadow-card">
        <h2 className="text-3xl font-bold text-foreground text-center mb-6">Welcome Back</h2>
        {error && <div className="bg-[#FFFBEB] border border-warning/30 text-foreground p-3 rounded-lg mb-6 text-sm">{error}</div>}
        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label htmlFor="login-email" className="food-label">Email Address</label>
            <input 
              id="login-email"
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="food-input"
              placeholder="Enter your email"
            />
          </div>
          <div>
            <label htmlFor="login-password" className="food-label">Password</label>
            <input 
              id="login-password"
              type="password" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="food-input"
              placeholder="Enter your password"
            />
            <div className="mt-2 text-right">
              <Link href="/forgot-password" className="text-sm text-primary hover:underline">
                Forgot password?
              </Link>
            </div>
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="food-button food-button-primary w-full py-2.5 text-sm disabled:opacity-70"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
        <div className="mt-6 text-center text-gray-text text-sm">
          Don&apos;t have an account? <Link href="/register" className="text-primary hover:underline">Register here</Link>
        </div>
      </div>
    </div>
  );
}
