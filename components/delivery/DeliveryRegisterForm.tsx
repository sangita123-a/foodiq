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

export default function DeliveryRegisterForm() {
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
    if (!form.email.trim()) errors.email = "Email address is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) errors.email = "Valid email is required";
    if (!form.phone_number.trim()) errors.phone_number = "Phone number is required";
    if (!form.password) errors.password = "Password is required";
    else if (form.password.length < 8) errors.password = "Min 8 characters required";
    if (!form.confirm_password) errors.confirm_password = "Confirm password is required";
    else if (form.password !== form.confirm_password) errors.confirm_password = "Passwords do not match";
    if (!form.vehicle_type.trim()) errors.vehicle_type = "Vehicle type is required";
    if (!form.vehicle_number.trim()) errors.vehicle_number = "Vehicle number is required";
    if (!form.driving_license_number.trim()) errors.driving_license_number = "Driving license number is required";
    if (!form.aadhaar_number.trim()) errors.aadhaar_number = "Aadhaar number is required";
    if (!form.state.trim()) errors.state = "State is required";
    if (!form.city.trim()) errors.city = "City is required";
    if (!form.address.trim()) errors.address = "Address is required";

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setError("Please fill out all required fields.");
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
        showToast(res.data.message || "Registration successful! Please verify your OTP.", "success");
        router.push(`/delivery/verify-otp?email=${encodeURIComponent(form.email.trim().toLowerCase())}`);
        return;
      }

      const msg = res.data?.message || "Registration failed.";
      setError(msg);
      showToast(msg, "error");
    } catch (err: unknown) {
      const msg = getAuthErrorMessage(err, "Registration failed.");
      setError(msg);
      showToast(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl bg-white border border-border rounded-2xl p-6 sm:p-8 shadow-card mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-extrabold text-foreground tracking-tight mb-1">Partner Registration</h2>
        <p className="text-sm text-gray-text">Fill in your information to join our delivery team.</p>
      </div>

      {error && (
        <div className="flex items-start gap-3 p-4 mb-6 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0 text-red-600 mt-0.5" />
          <span className="flex-1 font-medium">{error}</span>
        </div>
      )}

      <form onSubmit={handleRegister} className="space-y-6" noValidate>
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted mb-3 pb-1 border-b border-border">
            1. Personal Info
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="comp-full-name" className="block text-xs font-semibold text-foreground mb-1">Full Name</label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-3 text-muted" />
                <input
                  id="comp-full-name"
                  type="text"
                  value={form.full_name}
                  onChange={(e) => updateField("full_name", e.target.value)}
                  placeholder="Full Name"
                  className="w-full border rounded-xl pl-9 pr-3 py-2.5 text-sm"
                />
              </div>
              {fieldErrors.full_name && <p className="text-xs text-red-600 mt-1">{fieldErrors.full_name}</p>}
            </div>

            <div>
              <label htmlFor="comp-email" className="block text-xs font-semibold text-foreground mb-1">Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-3 text-muted" />
                <input
                  id="comp-email"
                  type="email"
                  value={form.email}
                  onChange={(e) => updateField("email", e.target.value)}
                  placeholder="Email Address"
                  className="w-full border rounded-xl pl-9 pr-3 py-2.5 text-sm"
                />
              </div>
              {fieldErrors.email && <p className="text-xs text-red-600 mt-1">{fieldErrors.email}</p>}
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="comp-phone" className="block text-xs font-semibold text-foreground mb-1">Phone Number</label>
              <div className="relative">
                <Phone className="w-4 h-4 absolute left-3 top-3 text-muted" />
                <input
                  id="comp-phone"
                  type="tel"
                  value={form.phone_number}
                  onChange={(e) => updateField("phone_number", e.target.value)}
                  placeholder="Phone Number"
                  className="w-full border rounded-xl pl-9 pr-3 py-2.5 text-sm"
                />
              </div>
              {fieldErrors.phone_number && <p className="text-xs text-red-600 mt-1">{fieldErrors.phone_number}</p>}
            </div>

            <div>
              <label htmlFor="comp-password" className="block text-xs font-semibold text-foreground mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-3 text-muted" />
                <input
                  id="comp-password"
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={(e) => updateField("password", e.target.value)}
                  placeholder="Password"
                  className="w-full border rounded-xl pl-9 pr-9 py-2.5 text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-muted"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {fieldErrors.password && <p className="text-xs text-red-600 mt-1">{fieldErrors.password}</p>}
            </div>

            <div>
              <label htmlFor="comp-confirm-password" className="block text-xs font-semibold text-foreground mb-1">Confirm Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-3 text-muted" />
                <input
                  id="comp-confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  value={form.confirm_password}
                  onChange={(e) => updateField("confirm_password", e.target.value)}
                  placeholder="Confirm Password"
                  className="w-full border rounded-xl pl-9 pr-9 py-2.5 text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-3 text-muted"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {fieldErrors.confirm_password && <p className="text-xs text-red-600 mt-1">{fieldErrors.confirm_password}</p>}
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted mb-3 pb-1 border-b border-border">
            2. Vehicle & Verification
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="comp-vehicle-type" className="block text-xs font-semibold text-foreground mb-1">Vehicle Type</label>
              <div className="relative">
                <Bike className="w-4 h-4 absolute left-3 top-3 text-muted" />
                <select
                  id="comp-vehicle-type"
                  value={form.vehicle_type}
                  onChange={(e) => updateField("vehicle_type", e.target.value)}
                  className="w-full border rounded-xl pl-9 pr-3 py-2.5 text-sm bg-white"
                >
                  <option value="Bike">Bike</option>
                  <option value="Scooter">Scooter</option>
                  <option value="Electric Bike">Electric Bike</option>
                  <option value="Bicycle">Bicycle</option>
                  <option value="Car">Car</option>
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="comp-vehicle-number" className="block text-xs font-semibold text-foreground mb-1">Vehicle Number</label>
              <div className="relative">
                <FileText className="w-4 h-4 absolute left-3 top-3 text-muted" />
                <input
                  id="comp-vehicle-number"
                  type="text"
                  value={form.vehicle_number}
                  onChange={(e) => updateField("vehicle_number", e.target.value)}
                  placeholder="KA-01-AB-1234"
                  className="w-full border rounded-xl pl-9 pr-3 py-2.5 text-sm uppercase"
                />
              </div>
              {fieldErrors.vehicle_number && <p className="text-xs text-red-600 mt-1">{fieldErrors.vehicle_number}</p>}
            </div>

            <div>
              <label htmlFor="comp-license-number" className="block text-xs font-semibold text-foreground mb-1">Driving License</label>
              <div className="relative">
                <CreditCard className="w-4 h-4 absolute left-3 top-3 text-muted" />
                <input
                  id="comp-license-number"
                  type="text"
                  value={form.driving_license_number}
                  onChange={(e) => updateField("driving_license_number", e.target.value)}
                  placeholder="DL Number"
                  className="w-full border rounded-xl pl-9 pr-3 py-2.5 text-sm uppercase"
                />
              </div>
              {fieldErrors.driving_license_number && <p className="text-xs text-red-600 mt-1">{fieldErrors.driving_license_number}</p>}
            </div>

            <div>
              <label htmlFor="comp-aadhaar-number" className="block text-xs font-semibold text-foreground mb-1">Aadhaar Number</label>
              <div className="relative">
                <FileText className="w-4 h-4 absolute left-3 top-3 text-muted" />
                <input
                  id="comp-aadhaar-number"
                  type="text"
                  value={form.aadhaar_number}
                  onChange={(e) => updateField("aadhaar_number", e.target.value)}
                  placeholder="Aadhaar Number"
                  className="w-full border rounded-xl pl-9 pr-3 py-2.5 text-sm"
                />
              </div>
              {fieldErrors.aadhaar_number && <p className="text-xs text-red-600 mt-1">{fieldErrors.aadhaar_number}</p>}
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted mb-3 pb-1 border-b border-border">
            3. Address & Location
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="comp-state" className="block text-xs font-semibold text-foreground mb-1">State</label>
              <div className="relative">
                <Navigation className="w-4 h-4 absolute left-3 top-3 text-muted" />
                <input
                  id="comp-state"
                  type="text"
                  value={form.state}
                  onChange={(e) => updateField("state", e.target.value)}
                  placeholder="State"
                  className="w-full border rounded-xl pl-9 pr-3 py-2.5 text-sm"
                />
              </div>
              {fieldErrors.state && <p className="text-xs text-red-600 mt-1">{fieldErrors.state}</p>}
            </div>

            <div>
              <label htmlFor="comp-city" className="block text-xs font-semibold text-foreground mb-1">City</label>
              <div className="relative">
                <Building className="w-4 h-4 absolute left-3 top-3 text-muted" />
                <input
                  id="comp-city"
                  type="text"
                  value={form.city}
                  onChange={(e) => updateField("city", e.target.value)}
                  placeholder="City"
                  className="w-full border rounded-xl pl-9 pr-3 py-2.5 text-sm"
                />
              </div>
              {fieldErrors.city && <p className="text-xs text-red-600 mt-1">{fieldErrors.city}</p>}
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="comp-address" className="block text-xs font-semibold text-foreground mb-1">Full Address</label>
              <div className="relative">
                <MapPin className="w-4 h-4 absolute left-3 top-3 text-muted" />
                <textarea
                  id="comp-address"
                  rows={2}
                  value={form.address}
                  onChange={(e) => updateField("address", e.target.value)}
                  placeholder="Full Address"
                  className="w-full border rounded-xl pl-9 pr-3 py-2 text-sm"
                />
              </div>
              {fieldErrors.address && <p className="text-xs text-red-600 mt-1">{fieldErrors.address}</p>}
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-primary hover:bg-primary-hover text-white font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-60 text-sm"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Registering...</span>
            </>
          ) : (
            <>
              <span>Register</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      <div className="mt-6 pt-6 border-t border-border text-center text-sm text-gray-text">
        <span>Already registered? </span>
        <Link href="/delivery/login" className="font-bold text-primary hover:underline">
          Sign In
        </Link>
      </div>
    </div>
  );
}
