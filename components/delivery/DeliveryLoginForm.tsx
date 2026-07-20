"use client";

import { motion } from "framer-motion";
import { Mail, Lock, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/services/api";
import { persistAuthUser } from "@/lib/authUser";
import { markAuthenticated } from "@/lib/authSession";

export default function DeliveryLoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await api.post("/api/auth/login", {
        email: email.trim().toLowerCase(),
        password,
      });
      if (res.data.success) {
        const user = res.data.data;
        if (user.role !== "delivery_partner" && user.role !== "admin") {
          setError("This account is not a delivery partner. Use the correct login.");
          return;
        }
        markAuthenticated(user.token);
        persistAuthUser(user);
        router.push("/delivery/dashboard");
      }
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string } }; message?: string };
      setError(
        ax.response?.data?.message ||
          (ax.message === "Network Error"
            ? "Cannot reach the server. Make sure the backend is running on port 4000."
            : "Login failed")
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full h-full min-h-[50vh] lg:min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6 lg:p-16 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-[#E23744]/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#E23744]/5 rounded-full blur-[100px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md bg-[#FFFFFF]/80 backdrop-blur-xl border border-[#E5E7EB] rounded-[24px] p-8 lg:p-10 shadow-2xl relative z-10"
      >
        <div className="text-center mb-10">
          <h2 className="text-3xl font-black text-[#111827] mb-2">Rider Portal</h2>
          <p className="text-[#6B7280]">Sign in to manage deliveries.</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg mb-6 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-[#6B7280] mb-2">Email</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-[#9CA3AF]" />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="rider@foodiq.com"
                required
                className="w-full bg-[#F8FAFC] text-[#111827] border border-[#E5E7EB] rounded-xl pl-12 pr-4 py-4 focus:outline-none focus:border-[#E23744] focus:ring-1 focus:ring-[#E23744] transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-[#6B7280] mb-2">Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-[#9CA3AF]" />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full bg-[#F8FAFC] text-[#111827] border border-[#E5E7EB] rounded-xl pl-12 pr-4 py-4 focus:outline-none focus:border-[#E23744] focus:ring-1 focus:ring-[#E23744] transition-colors"
              />
            </div>
            <div className="text-right mt-2">
              <Link href="/delivery/forgot-password" className="text-xs font-bold text-[#E23744] hover:underline">
                Forgot password?
              </Link>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#E23744] hover:bg-[#C81E34] text-white font-black py-4 rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-60"
          >
            {loading ? "Signing in..." : "Sign In"}
            <ArrowRight className="w-5 h-5" />
          </button>
        </form>

        <p className="text-center text-sm text-[#6B7280] mt-8">
          New rider?{" "}
          <Link href="/delivery/register" className="text-[#E23744] font-bold hover:underline">
            Register here
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
