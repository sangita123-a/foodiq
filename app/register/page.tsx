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
import { validateRegisterForm, type AuthFieldErrors } from "@/lib/authValidation";

export default function RegisterPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    password: "",
  });
  const [fieldErrors, setFieldErrors] = useState<AuthFieldErrors>({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setFieldErrors((prev) => ({ ...prev, [name]: undefined }));
    setError("");
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setFieldErrors({});

    const payload = {
      full_name: formData.full_name.trim(),
      email: formData.email.trim().toLowerCase(),
      phone: formData.phone.trim(),
      password: formData.password,
    };

    const validationErrors = validateRegisterForm(payload);
    if (Object.keys(validationErrors).length > 0) {
      setFieldErrors(validationErrors);
      const firstError = Object.values(validationErrors)[0];
      setError(firstError || "Please fix the highlighted fields.");
      showToast(firstError || "Please fix the highlighted fields.", "error");
      setLoading(false);
      return;
    }

    try {
      const res = await api.post("/api/auth/register", payload);
      const parsed = parseAuthApiResponse(res.data);

      if (parsed.success && parsed.token) {
        markAuthenticated(parsed.token);
        persistAuthUser({ ...parsed.user, token: parsed.token });
        void import("@/lib/analytics/events").then(({ AnalyticsEvents, trackEvent }) => {
          trackEvent(AnalyticsEvents.signUp, { method: "email" });
        });
        showToast(parsed.message || "Registration successful!", "success");
        router.push("/profile");
        return;
      }

      const msg = parsed.message || "Registration failed";
      setError(msg);
      showToast(msg, "error");
    } catch (err: unknown) {
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
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 p-3 rounded-lg mb-6 text-sm">
            {error}
          </div>
        )}
        <form onSubmit={handleRegister} className="space-y-5" noValidate>
          <div>
            <label htmlFor="register-name" className="food-label">Full Name</label>
            <input
              id="register-name"
              type="text"
              name="full_name"
              autoComplete="name"
              value={formData.full_name}
              onChange={handleChange}
              className="food-input"
              placeholder="John Doe"
            />
            {fieldErrors.full_name && (
              <p className="mt-1 text-xs text-red-600">{fieldErrors.full_name}</p>
            )}
          </div>
          <div>
            <label htmlFor="register-email" className="food-label">Email Address</label>
            <input
              id="register-email"
              type="email"
              name="email"
              autoComplete="email"
              value={formData.email}
              onChange={handleChange}
              className="food-input"
              placeholder="john@example.com"
            />
            {fieldErrors.email && (
              <p className="mt-1 text-xs text-red-600">{fieldErrors.email}</p>
            )}
          </div>
          <div>
            <label htmlFor="register-phone" className="food-label">Phone Number</label>
            <input
              id="register-phone"
              type="tel"
              name="phone"
              autoComplete="tel"
              value={formData.phone}
              onChange={handleChange}
              className="food-input"
              placeholder="9876543210"
            />
            {fieldErrors.phone && (
              <p className="mt-1 text-xs text-red-600">{fieldErrors.phone}</p>
            )}
          </div>
          <div>
            <label htmlFor="register-password" className="food-label">Password</label>
            <input
              id="register-password"
              type="password"
              name="password"
              autoComplete="new-password"
              value={formData.password}
              onChange={handleChange}
              className="food-input"
              placeholder="Min 8 chars with upper, lower & number"
            />
            {fieldErrors.password && (
              <p className="mt-1 text-xs text-red-600">{fieldErrors.password}</p>
            )}
          </div>
          <button
            type="submit"
            disabled={loading}
            className="food-button food-button-primary w-full py-2.5 text-sm disabled:opacity-70 inline-flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                Creating account...
              </>
            ) : (
              "Register"
            )}
          </button>
        </form>
        <div className="mt-6 text-center text-gray-text text-sm">
          Already have an account?{" "}
          <Link href="/login" className="text-primary hover:underline">
            Login here
          </Link>
        </div>
      </div>
    </div>
  );
}
