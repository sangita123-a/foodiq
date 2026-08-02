"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, Lock, Loader2, ArrowRight, Eye, EyeOff, AlertCircle } from "lucide-react";
import api from "@/services/api";
import { useToast } from "@/contexts/ToastContext";
import { markAuthenticated } from "@/lib/authSession";
import { persistAuthUser } from "@/lib/authUser";
import { getAuthErrorMessage } from "@/lib/authErrors";

export default function DeliveryLoginForm() {
  const router = useRouter();
  const { showToast } = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setFieldErrors({});

    const normalizedEmail = email.trim().toLowerCase();
    const errors: { email?: string; password?: string } = {};

    if (!normalizedEmail) {
      errors.email = "Email address is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      errors.email = "Please enter a valid email address";
    }

    if (!password) {
      errors.password = "Password is required";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setLoading(false);
      return;
    }

    try {
      const res = await api.post("/api/delivery/login", {
        email: normalizedEmail,
        password,
      });

      if (res.data && res.data.success) {
        const payload = res.data.data;
        const token = payload?.token;
        const partner = payload?.partner || payload?.user || payload;

        if (token) {
          markAuthenticated(token);
        }
        if (partner) {
          persistAuthUser(partner);
        }

        showToast(res.data.message || "Signed in successfully!", "success");
        router.push("/delivery/dashboard");
        return;
      }

      const msg = res.data?.message || "Login failed. Invalid email or password.";
      setError(msg);
      showToast(msg, "error");
    } catch (err: unknown) {
      const msg = getAuthErrorMessage(err, "Login failed. Please check your credentials.");
      setError(msg);
      showToast(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-white border border-border rounded-2xl p-6 sm:p-8 shadow-card mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-extrabold text-foreground tracking-tight mb-1">Rider Sign In</h2>
        <p className="text-sm text-gray-text">Enter your credentials to access your delivery portal.</p>
      </div>

      {error && (
        <div className="flex items-start gap-3 p-4 mb-6 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0 text-red-600 mt-0.5" />
          <span className="flex-1 font-medium">{error}</span>
        </div>
      )}

      <form onSubmit={handleLogin} className="space-y-5" noValidate>
        <div>
          <label htmlFor="delivery-form-email" className="block text-sm font-semibold text-foreground mb-2">
            Email Address
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted">
              <Mail className="w-5 h-5" />
            </div>
            <input
              id="delivery-form-email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: undefined }));
                setError("");
              }}
              placeholder="rider@foodiq.com"
              className={`w-full bg-white text-foreground border rounded-xl pl-11 pr-4 py-3 text-sm focus:outline-none transition-all ${
                fieldErrors.email ? "border-red-500" : "border-border focus:border-primary"
              }`}
            />
          </div>
          {fieldErrors.email && <p className="mt-1 text-xs text-red-600 font-medium">{fieldErrors.email}</p>}
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label htmlFor="delivery-form-password" className="block text-sm font-semibold text-foreground">
              Password
            </label>
            <Link href="/delivery/forgot-password" className="text-xs font-semibold text-primary hover:underline">
              Forgot Password?
            </Link>
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted">
              <Lock className="w-5 h-5" />
            </div>
            <input
              id="delivery-form-password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (fieldErrors.password) setFieldErrors((prev) => ({ ...prev, password: undefined }));
                setError("");
              }}
              placeholder="Enter password"
              className={`w-full bg-white text-foreground border rounded-xl pl-11 pr-11 py-3 text-sm focus:outline-none transition-all ${
                fieldErrors.password ? "border-red-500" : "border-border focus:border-primary"
              }`}
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-muted hover:text-foreground"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {fieldErrors.password && <p className="mt-1 text-xs text-red-600 font-medium">{fieldErrors.password}</p>}
        </div>

        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 rounded border-border text-primary accent-primary"
            />
            <span className="text-xs font-medium text-gray-text">Remember Me</span>
          </label>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-primary hover:bg-primary-hover text-white font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-60 text-sm"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Signing In...</span>
            </>
          ) : (
            <>
              <span>Sign In</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      <div className="mt-6 pt-6 border-t border-border text-center text-sm text-gray-text">
        <span>Want to deliver with Foodiq? </span>
        <Link href="/delivery/register" className="font-bold text-primary hover:underline">
          Become a Delivery Partner
        </Link>
      </div>
    </div>
  );
}
