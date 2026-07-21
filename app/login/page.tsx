"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import api from "@/services/api";
import { useToast } from "@/contexts/ToastContext";
import { persistAuthUser } from "@/lib/authUser";
import { markAuthenticated } from "@/lib/authSession";
import { getAuthErrorMessage } from "@/lib/authErrors";
import { parseAuthApiResponse } from "@/lib/authResponse";
import { validateLoginForm, type AuthFieldErrors } from "@/lib/authValidation";

export default function LoginPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<AuthFieldErrors>({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setFieldErrors({});

    const normalizedEmail = email.trim().toLowerCase();
    const validationErrors = validateLoginForm({ email: normalizedEmail, password });
    if (Object.keys(validationErrors).length > 0) {
      setFieldErrors(validationErrors);
      const firstError = Object.values(validationErrors)[0];
      setError(firstError || "Please fix the highlighted fields.");
      showToast(firstError || "Please fix the highlighted fields.", "error");
      setLoading(false);
      return;
    }

    try {
      const res = await api.post("/api/auth/login", {
        email: normalizedEmail,
        password,
      });
      const parsed = parseAuthApiResponse(res.data);

      if (parsed.success && parsed.token) {
        markAuthenticated(parsed.token);
        persistAuthUser({ ...parsed.user, token: parsed.token });
        void import("@/lib/analytics/events").then(({ AnalyticsEvents, trackEvent }) => {
          trackEvent(AnalyticsEvents.login, {
            method: "email",
            role: parsed.user.role || "customer",
          });
        });
        try {
          await api.post("/api/sessions/register");
        } catch {
          /* optional session tracking */
        }
        showToast(parsed.message || "Login successful!", "success");
        router.push("/profile");
        return;
      }

      const msg = parsed.message || "Login failed";
      setError(msg);
      showToast(msg, "error");
    } catch (err: unknown) {
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
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 p-3 rounded-lg mb-6 text-sm">
            {error}
          </div>
        )}
        <form onSubmit={handleLogin} className="space-y-5" noValidate>
          <div>
            <label htmlFor="login-email" className="food-label">Email Address</label>
            <input
              id="login-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setFieldErrors((prev) => ({ ...prev, email: undefined }));
                setError("");
              }}
              className="food-input"
              placeholder="Enter your email"
            />
            {fieldErrors.email && (
              <p className="mt-1 text-xs text-red-600">{fieldErrors.email}</p>
            )}
          </div>
          <div>
            <label htmlFor="login-password" className="food-label">Password</label>
            <input
              id="login-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setFieldErrors((prev) => ({ ...prev, password: undefined }));
                setError("");
              }}
              className="food-input"
              placeholder="Enter your password"
            />
            {fieldErrors.password && (
              <p className="mt-1 text-xs text-red-600">{fieldErrors.password}</p>
            )}
            <div className="mt-2 text-right">
              <Link href="/forgot-password" className="text-sm text-primary hover:underline">
                Forgot password?
              </Link>
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="food-button food-button-primary w-full py-2.5 text-sm disabled:opacity-70 inline-flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                Logging in...
              </>
            ) : (
              "Login"
            )}
          </button>
        </form>
        <div className="mt-6 text-center text-gray-text text-sm">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="text-primary hover:underline">
            Register here
          </Link>
        </div>
      </div>
    </div>
  );
}
