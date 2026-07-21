"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/services/api";
import { useToast } from "@/contexts/ToastContext";

import { persistAuthUser } from "@/lib/authUser";
import { markAuthenticated } from "@/lib/authSession";
import { getAuthErrorMessage } from "@/lib/authErrors";

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
        markAuthenticated(res.data.data.token);
        persistAuthUser(res.data.data);
        void import("@/lib/analytics/events").then(({ AnalyticsEvents, trackEvent }) => {
          trackEvent(AnalyticsEvents.signUp, { method: "email" });
        });
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
    <div className="min-h-screen flex items-center justify-center bg-background px-4 pt-24 pb-12">
      <div className="max-w-md w-full bg-background border border-border p-8 rounded-2xl shadow-card">
        <h2 className="text-3xl font-bold text-foreground text-center mb-6">Create Account</h2>
        {error && <div className="bg-[#FFFBEB] border border-warning/30 text-foreground p-3 rounded-lg mb-6 text-sm">{error}</div>}
        <form onSubmit={handleRegister} className="space-y-5">
          <div>
            <label htmlFor="register-name" className="food-label">Full Name</label>
            <input 
              id="register-name"
              type="text" 
              name="full_name"
              required
              value={formData.full_name}
              onChange={handleChange}
              className="food-input"
              placeholder="John Doe"
            />
          </div>
          <div>
            <label htmlFor="register-email" className="food-label">Email Address</label>
            <input 
              id="register-email"
              type="email" 
              name="email"
              required
              value={formData.email}
              onChange={handleChange}
              className="food-input"
              placeholder="john@example.com"
            />
          </div>
          <div>
            <label htmlFor="register-phone" className="food-label">Phone Number</label>
            <input 
              id="register-phone"
              type="tel" 
              name="phone"
              required
              value={formData.phone}
              onChange={handleChange}
              className="food-input"
              placeholder="+1 234 567 8900"
            />
          </div>
          <div>
            <label htmlFor="register-password" className="food-label">Password</label>
            <input 
              id="register-password"
              type="password" 
              name="password"
              required
              value={formData.password}
              onChange={handleChange}
              className="food-input"
              placeholder="Create a password"
            />
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="food-button food-button-primary w-full py-2.5 text-sm disabled:opacity-70"
          >
            {loading ? "Creating account..." : "Register"}
          </button>
        </form>
        <div className="mt-6 text-center text-gray-text text-sm">
          Already have an account? <Link href="/login" className="text-primary hover:underline">Login here</Link>
        </div>
      </div>
    </div>
  );
}
