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
    <div className="w-full h-full min-h-[50vh] lg:min-h-screen bg-[#0B0B0B] flex items-center justify-center p-6 lg:p-16 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/5 rounded-full blur-[100px] pointer-events-none"></div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md bg-[#171717]/80 backdrop-blur-xl border border-white/10 rounded-[24px] p-8 lg:p-10 shadow-2xl relative z-10"
      >
        <div className="text-center mb-10">
          <h2 className="text-3xl font-black text-white mb-2">Partner Portal</h2>
          <p className="text-gray-400">Sign in to manage your restaurant.</p>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500 text-red-100 p-3 rounded-lg mb-6 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-gray-400 mb-2">Restaurant Email</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-500" />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="partner@restaurant.com"
                required
                className="w-full bg-[#111] text-white border border-white/10 rounded-xl pl-12 pr-4 py-4 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-bold text-gray-400">Password</label>
              <Link href="/forgot-password" className="text-xs text-primary hover:text-[#ff4f5a] font-bold transition-colors">
                Forgot Password?
              </Link>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-500" />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full bg-[#111] text-white border border-white/10 rounded-xl pl-12 pr-4 py-4 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
              />
            </div>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="remember"
              className="w-4 h-4 rounded border-gray-600 text-primary focus:ring-primary focus:ring-offset-[#171717] bg-[#111]"
            />
            <label htmlFor="remember" className="ml-2 block text-sm text-gray-400 cursor-pointer">
              Remember me on this device
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:bg-[#e02633] text-white py-4 rounded-xl font-black transition-all shadow-[0_0_20px_rgba(255,45,59,0.2)] hover:shadow-[0_0_30px_rgba(255,45,59,0.4)] flex items-center justify-center gap-2 group disabled:opacity-70"
          >
            {loading ? "Signing in..." : "Sign In"}
            {!loading && <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
          </button>
        </form>

        <div className="mt-8 flex items-center justify-center space-x-4">
          <div className="h-px bg-white/10 w-full"></div>
          <span className="text-gray-500 text-sm font-bold">OR</span>
          <div className="h-px bg-white/10 w-full"></div>
        </div>

        <div className="mt-8">
          <button
            type="button"
            className="w-full bg-white hover:bg-gray-100 text-black py-4 rounded-xl font-bold transition-colors flex items-center justify-center gap-3"
          >
            Continue with Google
          </button>
        </div>

        <p className="text-center text-gray-400 mt-8 text-sm">
          Customer account?{" "}
          <Link href="/login" className="text-white font-bold hover:text-primary transition-colors">
            Customer Login
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
