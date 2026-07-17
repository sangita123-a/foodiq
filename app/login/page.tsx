"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/services/api";
import { useToast } from "@/contexts/ToastContext";

import Cookies from 'js-cookie';

function getAuthErrorMessage(err: any, fallback: string) {
  if (err?.response?.data?.message) return err.response.data.message;
  if (typeof err?.response?.data?.error === 'string') return err.response.data.error;
  if (err?.message === 'Network Error') {
    return 'Cannot reach the server. Make sure the backend is running on port 4000.';
  }
  return fallback;
}

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
        Cookies.set('token', res.data.data.token, { expires: 7, sameSite: 'lax' });
        localStorage.setItem("user", JSON.stringify(res.data.data));
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
    <div className="min-h-screen flex items-center justify-center bg-white px-4 pt-24">
      <div className="max-w-md w-full bg-[#F8FAFC] border border-[#E5E7EB] p-8 rounded-2xl backdrop-blur-md">
        <h2 className="text-3xl font-bold text-[#111827] text-center mb-6">Welcome Back</h2>
        {error && <div className="bg-red-500/20 border border-red-500 text-red-100 p-3 rounded-lg mb-6 text-sm">{error}</div>}
        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-[#6B7280] mb-2">Email Address</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl px-4 py-3 text-[#111827] focus:outline-none focus:border-[var(--color-primary)] transition-colors"
              placeholder="Enter your email"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#6B7280] mb-2">Password</label>
            <input 
              type="password" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl px-4 py-3 text-[#111827] focus:outline-none focus:border-[var(--color-primary)] transition-colors"
              placeholder="Enter your password"
            />
            <div className="mt-2 text-right">
              <Link href="/forgot-password" className="text-sm text-[var(--color-primary)] hover:underline">
                Forgot password?
              </Link>
            </div>
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white font-medium py-3 rounded-xl transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:hover:scale-100"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
        <div className="mt-6 text-center text-[#6B7280] text-sm">
          Don't have an account? <Link href="/register" className="text-[var(--color-primary)] hover:underline">Register here</Link>
        </div>
      </div>
    </div>
  );
}
