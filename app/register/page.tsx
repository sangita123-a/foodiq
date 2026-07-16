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

export default function RegisterPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    password: ""
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const payload = {
      full_name: formData.full_name.trim(),
      email: formData.email.trim().toLowerCase(),
      phone: formData.phone.trim(),
      password: formData.password,
    };

    try {
      const res = await api.post("/api/auth/register", payload);
      if (res.data.success) {
        Cookies.set('token', res.data.data.token, { expires: 7, sameSite: 'lax' });
        localStorage.setItem("user", JSON.stringify(res.data.data));
        showToast(res.data.message || "Account created successfully!", "success");
        router.push("/");
      } else {
        const msg = res.data.message || "Registration failed";
        setError(msg);
        showToast(msg, "error");
      }
    } catch (err: any) {
      const msg = getAuthErrorMessage(err, "Registration failed");
      setError(msg);
      showToast(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black/95 px-4 pt-24 pb-12">
      <div className="max-w-md w-full bg-white/5 border border-white/10 p-8 rounded-2xl backdrop-blur-md">
        <h2 className="text-3xl font-bold text-white text-center mb-6">Create Account</h2>
        {error && <div className="bg-red-500/20 border border-red-500 text-red-100 p-3 rounded-lg mb-6 text-sm">{error}</div>}
        <form onSubmit={handleRegister} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Full Name</label>
            <input 
              type="text" 
              name="full_name"
              required
              value={formData.full_name}
              onChange={handleChange}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[var(--color-primary)] transition-colors"
              placeholder="John Doe"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Email Address</label>
            <input 
              type="email" 
              name="email"
              required
              value={formData.email}
              onChange={handleChange}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[var(--color-primary)] transition-colors"
              placeholder="john@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Phone Number</label>
            <input 
              type="tel" 
              name="phone"
              required
              value={formData.phone}
              onChange={handleChange}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[var(--color-primary)] transition-colors"
              placeholder="+1 234 567 8900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
            <input 
              type="password" 
              name="password"
              required
              value={formData.password}
              onChange={handleChange}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[var(--color-primary)] transition-colors"
              placeholder="Create a password"
            />
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white font-medium py-3 rounded-xl transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:hover:scale-100"
          >
            {loading ? "Creating account..." : "Register"}
          </button>
        </form>
        <div className="mt-6 text-center text-gray-400 text-sm">
          Already have an account? <Link href="/login" className="text-[var(--color-primary)] hover:underline">Login here</Link>
        </div>
      </div>
    </div>
  );
}
