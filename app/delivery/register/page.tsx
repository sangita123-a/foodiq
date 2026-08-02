"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  User,
  Mail,
  Phone,
  Lock,
  Bike,
  FileText,
  CreditCard,
  MapPin,
  Building,
  Navigation,
  Loader2,
  ArrowRight,
  Eye,
  EyeOff,
  AlertCircle,
} from "lucide-react";
import api from "@/services/api";
import { useToast } from "@/contexts/ToastContext";
import { getAuthErrorMessage } from "@/lib/authErrors";
import DeliveryAuthLayout from "@/components/delivery/DeliveryAuthLayout";

export default function DeliveryRegisterPage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone_number: "",
    password: "",
    confirm_password: "",
    vehicle_type: "Bike",
    vehicle_number: "",
    driving_license_number: "",
    aadhaar_number: "",
    state: "",
    city: "",
    address: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const updateField = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (fieldErrors[key]) {
      setFieldErrors((prev) => ({ ...prev, [key]: "" }));
    }
    setError("");
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setFieldErrors({});

    const errors: Record<string, string> = {};

    if (!form.full_name.trim()) errors.full_name = "Full name is required";
    if (!form.email.trim()) {
      errors.email = "Email address is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      errors.email = "Please enter a valid email address";
    }
    if (!form.phone_number.trim()) {
      errors.phone_number = "Phone number is required";
    } else if (!/^[0-9+\-\s()]{7,20}$/.test(form.phone_number.trim())) {
      errors.phone_number = "Please enter a valid phone number";
    }
    if (!form.password) {
      errors.password = "Password is required";
    } else if (form.password.length < 8) {
      errors.password = "Password must be at least 8 characters";
    }
    if (!form.confirm_password) {
      errors.confirm_password = "Confirm password is required";
    } else if (form.password !== form.confirm_password) {
      errors.confirm_password = "Passwords do not match";
    }
    if (!form.vehicle_type.trim()) errors.vehicle_type = "Vehicle type is required";
    if (!form.vehicle_number.trim()) errors.vehicle_number = "Vehicle registration number is required";
    if (!form.driving_license_number.trim()) errors.driving_license_number = "Driving license number is required";
    if (!form.aadhaar_number.trim()) errors.aadhaar_number = "Aadhaar number is required";
    if (!form.state.trim()) errors.state = "State is required";
    if (!form.city.trim()) errors.city = "City is required";
    if (!form.address.trim()) errors.address = "Address is required";

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setError("Please fix all highlighted issues before registering.");
      showToast("Please fill out all required fields correctly.", "error");
      setLoading(false);
      return;
    }

    try {
      const payload = {
        full_name: form.full_name.trim(),
        email: form.email.trim().toLowerCase(),
        phone_number: form.phone_number.trim(),
        password: form.password,
        confirm_password: form.confirm_password,
        vehicle_type: form.vehicle_type.trim(),
        vehicle_number: form.vehicle_number.trim().toUpperCase(),
        driving_license_number: form.driving_license_number.trim().toUpperCase(),
        aadhaar_number: form.aadhaar_number.trim(),
        state: form.state.trim(),
        city: form.city.trim(),
        address: form.address.trim(),
      };

      const res = await api.post("/api/delivery/register", payload);

      if (res.data && res.data.success) {
        showToast(
          res.data.message || "Registration successful! Please verify your OTP code.",
          "success"
        );
        router.push(
          `/delivery/verify-otp?email=${encodeURIComponent(form.email.trim().toLowerCase())}`
        );
        return;
      }

      const msg = res.data?.message || "Registration failed. Please check your details.";
      setError(msg);
      showToast(msg, "error");
    } catch (err: unknown) {
      const msg = getAuthErrorMessage(
        err,
        "Registration failed. Please review your information and try again."
      );
      setError(msg);
      showToast(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DeliveryAuthLayout
      title="Become a Delivery Partner"
      subtitle="Complete your registration to start earning with Foodiq."
      badge="Partner Onboarding"
      showBackButton
      backHref="/delivery/login"
      maxWidth="2xl"
    >
      {error && (
        <div className="flex items-start gap-3 p-4 mb-6 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0 text-red-600 mt-0.5" />
          <span className="flex-1 font-medium">{error}</span>
        </div>
      )}

      <form onSubmit={handleRegister} className="space-y-6" noValidate>
        {/* Personal Details Section */}
        <div>
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-muted mb-4 pb-2 border-b border-border">
            1. Personal Details
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Full Name */}
            <div>
              <label htmlFor="reg-full-name" className="block text-xs font-semibold text-foreground mb-1.5">
                Full Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted">
                  <User className="w-4 h-4" />
                </div>
                <input
                  id="reg-full-name"
                  type="text"
                  value={form.full_name}
                  onChange={(e) => updateField("full_name", e.target.value)}
                  placeholder="Ravi Kumar"
                  className={`w-full bg-white text-foreground border rounded-xl pl-9 pr-3 py-2.5 text-sm focus:outline-none transition-all ${
                    fieldErrors.full_name ? "border-red-500" : "border-border focus:border-primary"
                  }`}
                />
              </div>
              {fieldErrors.full_name && (
                <p className="mt-1 text-xs text-red-600 font-medium">{fieldErrors.full_name}</p>
              )}
            </div>

            {/* Email Address */}
            <div>
              <label htmlFor="reg-email" className="block text-xs font-semibold text-foreground mb-1.5">
                Email Address <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="reg-email"
                  type="email"
                  value={form.email}
                  onChange={(e) => updateField("email", e.target.value)}
                  placeholder="rider@foodiq.com"
                  className={`w-full bg-white text-foreground border rounded-xl pl-9 pr-3 py-2.5 text-sm focus:outline-none transition-all ${
                    fieldErrors.email ? "border-red-500" : "border-border focus:border-primary"
                  }`}
                />
              </div>
              {fieldErrors.email && (
                <p className="mt-1 text-xs text-red-600 font-medium">{fieldErrors.email}</p>
              )}
            </div>

            {/* Phone Number */}
            <div className="sm:col-span-2">
              <label htmlFor="reg-phone" className="block text-xs font-semibold text-foreground mb-1.5">
                Phone Number <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted">
                  <Phone className="w-4 h-4" />
                </div>
                <input
                  id="reg-phone"
                  type="tel"
                  value={form.phone_number}
                  onChange={(e) => updateField("phone_number", e.target.value)}
                  placeholder="9876543210"
                  className={`w-full bg-white text-foreground border rounded-xl pl-9 pr-3 py-2.5 text-sm focus:outline-none transition-all ${
                    fieldErrors.phone_number ? "border-red-500" : "border-border focus:border-primary"
                  }`}
                />
              </div>
              {fieldErrors.phone_number && (
                <p className="mt-1 text-xs text-red-600 font-medium">{fieldErrors.phone_number}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="reg-password" className="block text-xs font-semibold text-foreground mb-1.5">
                Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="reg-password"
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={(e) => updateField("password", e.target.value)}
                  placeholder="Min. 8 characters"
                  className={`w-full bg-white text-foreground border rounded-xl pl-9 pr-9 py-2.5 text-sm focus:outline-none transition-all ${
                    fieldErrors.password ? "border-red-500" : "border-border focus:border-primary"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {fieldErrors.password && (
                <p className="mt-1 text-xs text-red-600 font-medium">{fieldErrors.password}</p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="reg-confirm-password" className="block text-xs font-semibold text-foreground mb-1.5">
                Confirm Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="reg-confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  value={form.confirm_password}
                  onChange={(e) => updateField("confirm_password", e.target.value)}
                  placeholder="Re-enter password"
                  className={`w-full bg-white text-foreground border rounded-xl pl-9 pr-9 py-2.5 text-sm focus:outline-none transition-all ${
                    fieldErrors.confirm_password ? "border-red-500" : "border-border focus:border-primary"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted hover:text-foreground"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {fieldErrors.confirm_password && (
                <p className="mt-1 text-xs text-red-600 font-medium">{fieldErrors.confirm_password}</p>
              )}
            </div>
          </div>
        </div>

        {/* Vehicle & Verification Section */}
        <div>
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-muted mb-4 pb-2 border-b border-border">
            2. Vehicle & Identification
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Vehicle Type */}
            <div>
              <label htmlFor="reg-vehicle-type" className="block text-xs font-semibold text-foreground mb-1.5">
                Vehicle Type <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted">
                  <Bike className="w-4 h-4" />
                </div>
                <select
                  id="reg-vehicle-type"
                  value={form.vehicle_type}
                  onChange={(e) => updateField("vehicle_type", e.target.value)}
                  className={`w-full bg-white text-foreground border rounded-xl pl-9 pr-3 py-2.5 text-sm focus:outline-none transition-all appearance-none cursor-pointer ${
                    fieldErrors.vehicle_type ? "border-red-500" : "border-border focus:border-primary"
                  }`}
                >
                  <option value="Bike">Motorcycle / Bike</option>
                  <option value="Scooter">Scooter / Moped</option>
                  <option value="Electric Bike">Electric Bike (EV)</option>
                  <option value="Bicycle">Bicycle</option>
                  <option value="Car">Car / Auto</option>
                </select>
              </div>
              {fieldErrors.vehicle_type && (
                <p className="mt-1 text-xs text-red-600 font-medium">{fieldErrors.vehicle_type}</p>
              )}
            </div>

            {/* Vehicle Number */}
            <div>
              <label htmlFor="reg-vehicle-number" className="block text-xs font-semibold text-foreground mb-1.5">
                Vehicle Number <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted">
                  <FileText className="w-4 h-4" />
                </div>
                <input
                  id="reg-vehicle-number"
                  type="text"
                  value={form.vehicle_number}
                  onChange={(e) => updateField("vehicle_number", e.target.value)}
                  placeholder="KA-01-AB-1234"
                  className={`w-full bg-white text-foreground border rounded-xl pl-9 pr-3 py-2.5 text-sm focus:outline-none uppercase transition-all ${
                    fieldErrors.vehicle_number ? "border-red-500" : "border-border focus:border-primary"
                  }`}
                />
              </div>
              {fieldErrors.vehicle_number && (
                <p className="mt-1 text-xs text-red-600 font-medium">{fieldErrors.vehicle_number}</p>
              )}
            </div>

            {/* Driving License Number */}
            <div>
              <label htmlFor="reg-license" className="block text-xs font-semibold text-foreground mb-1.5">
                Driving License Number <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted">
                  <CreditCard className="w-4 h-4" />
                </div>
                <input
                  id="reg-license"
                  type="text"
                  value={form.driving_license_number}
                  onChange={(e) => updateField("driving_license_number", e.target.value)}
                  placeholder="DL-1420110012345"
                  className={`w-full bg-white text-foreground border rounded-xl pl-9 pr-3 py-2.5 text-sm focus:outline-none uppercase transition-all ${
                    fieldErrors.driving_license_number ? "border-red-500" : "border-border focus:border-primary"
                  }`}
                />
              </div>
              {fieldErrors.driving_license_number && (
                <p className="mt-1 text-xs text-red-600 font-medium">{fieldErrors.driving_license_number}</p>
              )}
            </div>

            {/* Aadhaar Number */}
            <div>
              <label htmlFor="reg-aadhaar" className="block text-xs font-semibold text-foreground mb-1.5">
                Aadhaar Number <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted">
                  <FileText className="w-4 h-4" />
                </div>
                <input
                  id="reg-aadhaar"
                  type="text"
                  value={form.aadhaar_number}
                  onChange={(e) => updateField("aadhaar_number", e.target.value)}
                  placeholder="1234 5678 9012"
                  className={`w-full bg-white text-foreground border rounded-xl pl-9 pr-3 py-2.5 text-sm focus:outline-none transition-all ${
                    fieldErrors.aadhaar_number ? "border-red-500" : "border-border focus:border-primary"
                  }`}
                />
              </div>
              {fieldErrors.aadhaar_number && (
                <p className="mt-1 text-xs text-red-600 font-medium">{fieldErrors.aadhaar_number}</p>
              )}
            </div>
          </div>
        </div>

        {/* Address & Location Section */}
        <div>
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-muted mb-4 pb-2 border-b border-border">
            3. Address & Location
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* State */}
            <div>
              <label htmlFor="reg-state" className="block text-xs font-semibold text-foreground mb-1.5">
                State <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted">
                  <Navigation className="w-4 h-4" />
                </div>
                <input
                  id="reg-state"
                  type="text"
                  value={form.state}
                  onChange={(e) => updateField("state", e.target.value)}
                  placeholder="Karnataka"
                  className={`w-full bg-white text-foreground border rounded-xl pl-9 pr-3 py-2.5 text-sm focus:outline-none transition-all ${
                    fieldErrors.state ? "border-red-500" : "border-border focus:border-primary"
                  }`}
                />
              </div>
              {fieldErrors.state && (
                <p className="mt-1 text-xs text-red-600 font-medium">{fieldErrors.state}</p>
              )}
            </div>

            {/* City */}
            <div>
              <label htmlFor="reg-city" className="block text-xs font-semibold text-foreground mb-1.5">
                City <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted">
                  <Building className="w-4 h-4" />
                </div>
                <input
                  id="reg-city"
                  type="text"
                  value={form.city}
                  onChange={(e) => updateField("city", e.target.value)}
                  placeholder="Bengaluru"
                  className={`w-full bg-white text-foreground border rounded-xl pl-9 pr-3 py-2.5 text-sm focus:outline-none transition-all ${
                    fieldErrors.city ? "border-red-500" : "border-border focus:border-primary"
                  }`}
                />
              </div>
              {fieldErrors.city && (
                <p className="mt-1 text-xs text-red-600 font-medium">{fieldErrors.city}</p>
              )}
            </div>

            {/* Full Address */}
            <div className="sm:col-span-2">
              <label htmlFor="reg-address" className="block text-xs font-semibold text-foreground mb-1.5">
                Full Address <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute top-3 left-3 flex items-start pointer-events-none text-muted">
                  <MapPin className="w-4 h-4" />
                </div>
                <textarea
                  id="reg-address"
                  rows={2}
                  value={form.address}
                  onChange={(e) => updateField("address", e.target.value)}
                  placeholder="Door No, Street Name, Landmark, Pincode"
                  className={`w-full bg-white text-foreground border rounded-xl pl-9 pr-3 py-2.5 text-sm focus:outline-none transition-all ${
                    fieldErrors.address ? "border-red-500" : "border-border focus:border-primary"
                  }`}
                />
              </div>
              {fieldErrors.address && (
                <p className="mt-1 text-xs text-red-600 font-medium">{fieldErrors.address}</p>
              )}
            </div>
          </div>
        </div>

        {/* Submit Register Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-primary hover:bg-primary-hover text-white font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-button disabled:opacity-60 disabled:cursor-not-allowed text-sm mt-4"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Submitting Registration...</span>
            </>
          ) : (
            <>
              <span>Register as Partner</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      {/* Link to Login */}
      <div className="mt-8 pt-6 border-t border-border text-center text-sm text-gray-text">
        <span>Already registered as a delivery partner? </span>
        <Link
          href="/delivery/login"
          className="font-bold text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-primary/20 rounded"
        >
          Sign In
        </Link>
      </div>
    </DeliveryAuthLayout>
  );
}
