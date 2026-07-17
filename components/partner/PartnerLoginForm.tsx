"use client";

import { motion } from "framer-motion";
import { Mail, Lock, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import api from "@/services/api";

export default function PartnerLoginForm() {
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
        if (user.role !== "restaurant_owner" && user.role !== "admin") {
          setError("This account is not a restaurant partner. Use the customer login.");
          return;
        }
        Cookies.set("token", user.token, { expires: 7, sameSite: "lax" });
        localStorage.setItem("user", JSON.stringify(user));
        router.push("/partner/dashboard");
      }
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        (err.message === "Network Error"
          ? "Cannot reach the server. Make sure the backend is running on port 4000."
          : "Login failed");
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full h-full min-h-[50vh] lg:min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6 lg:p-16 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-[#FC8019]/10 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#FC8019]/5 rounded-full blur-[100px] pointer-events-none"></div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md bg-[#FFFFFF]/80 backdrop-blur-xl border border-[#E5E7EB] rounded-[24px] p-8 lg:p-10 shadow-2xl relative z-10"
      >
        <div className="text-center mb-10">
          <h2 className="text-3xl font-black text-[#111827] mb-2">Partner Portal</h2>
          <p className="text-[#6B7280]">Sign in to manage your restaurant.</p>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500 text-red-100 p-3 rounded-lg mb-6 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-[#6B7280] mb-2">Restaurant Email</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-[#9CA3AF]" />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="partner@restaurant.com"
                required
                className="w-full bg-[#F8FAFC] text-[#111827] border border-[#E5E7EB] rounded-xl pl-12 pr-4 py-4 focus:outline-none focus:border-[#FC8019] focus:ring-1 focus:ring-[#FC8019] transition-colors"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-bold text-[#6B7280]">Password</label>
              <Link href="/forgot-password" className="text-xs text-[#FC8019] hover:text-[#E66F0D] font-bold transition-colors">
                Forgot Password?
              </Link>
            </div>
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
                className="w-full bg-[#F8FAFC] text-[#111827] border border-[#E5E7EB] rounded-xl pl-12 pr-4 py-4 focus:outline-none focus:border-[#FC8019] focus:ring-1 focus:ring-[#FC8019] transition-colors"
              />
            </div>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="remember"
              className="w-4 h-4 rounded border-[#E5E7EB] text-[#FC8019] focus:ring-[#FC8019] focus:ring-offset-[#FFFFFF] bg-[#F8FAFC]"
            />
            <label htmlFor="remember" className="ml-2 block text-sm text-[#6B7280] cursor-pointer">
              Remember me on this device
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#FC8019] hover:bg-[#E66F0D] text-white py-4 rounded-xl font-black transition-all shadow-[0_0_20px_rgba(252,128,25,0.2)] hover:shadow-[0_0_30px_rgba(252,128,25,0.4)] flex items-center justify-center gap-2 group disabled:opacity-70"
          >
            {loading ? "Signing in..." : "Sign In"}
            {!loading && <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
          </button>
        </form>

        <div className="mt-8 flex items-center justify-center space-x-4">
          <div className="h-px bg-[#F8FAFC] w-full"></div>
          <span className="text-[#9CA3AF] text-sm font-bold">OR</span>
          <div className="h-px bg-[#F8FAFC] w-full"></div>
        </div>

        <div className="mt-8">
          <button
            type="button"
            className="w-full bg-white hover:bg-[#F8FAFC] text-black py-4 rounded-xl font-bold transition-colors flex items-center justify-center gap-3"
          >
            Continue with Google
          </button>
        </div>

        <p className="text-center text-[#6B7280] mt-8 text-sm">
          Customer account?{" "}
          <Link href="/login" className="text-[#111827] font-bold hover:text-[#FC8019] transition-colors">
            Customer Login
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
