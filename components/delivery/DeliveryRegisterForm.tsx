"use client";

import { motion } from "framer-motion";
import { Mail, Lock, User, Phone, Bike, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/services/api";
import { persistAuthUser } from "@/lib/authUser";
import { markAuthenticated } from "@/lib/authSession";

export default function DeliveryRegisterForm() {
  const router = useRouter();
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    password: "",
    vehicle_type: "Bike",
    vehicle_details: "",
    license_number: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const update = (key: string, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await api.post("/api/delivery/register", {
        ...form,
        email: form.email.trim().toLowerCase(),
      });
      if (res.data.success) {
        const user = res.data.data;
        markAuthenticated(user.token);
        persistAuthUser(user);
        router.push("/delivery/profile");
      }
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string } }; message?: string };
      setError(
        ax.response?.data?.message ||
          (ax.message === "Network Error"
            ? "Cannot reach the server. Make sure the backend is running on port 4000."
            : "Registration failed")
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full h-full min-h-[50vh] lg:min-h-screen bg-section flex items-center justify-center p-6 lg:p-16 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[100px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-background/80 backdrop-blur-xl border border-border rounded-[24px] p-8 lg:p-10 shadow-2xl relative z-10"
      >
        <div className="text-center mb-8">
          <h2 className="text-3xl font-black text-foreground mb-2">Join as Rider</h2>
          <p className="text-gray-text">Create your delivery partner account.</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg mb-6 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          {[
            { key: "full_name", label: "Full Name", icon: User, type: "text", placeholder: "Ravi Rider" },
            { key: "email", label: "Email", icon: Mail, type: "email", placeholder: "rider@email.com" },
            { key: "phone", label: "Phone", icon: Phone, type: "tel", placeholder: "9888888888" },
            { key: "password", label: "Password", icon: Lock, type: "password", placeholder: "Min 8 characters" },
            { key: "vehicle_details", label: "Vehicle Details", icon: Bike, type: "text", placeholder: "KA-01-AB-1234" },
            { key: "license_number", label: "License Number", icon: Bike, type: "text", placeholder: "DL-XXXX" },
          ].map((field) => (
            <div key={field.key}>
              <label className="block text-sm font-bold text-gray-text mb-2">{field.label}</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <field.icon className="h-5 w-5 text-[#9CA3AF]" />
                </div>
                <input
                  type={field.type}
                  value={form[field.key as keyof typeof form]}
                  onChange={(e) => update(field.key, e.target.value)}
                  placeholder={field.placeholder}
                  required={!["vehicle_details", "license_number"].includes(field.key)}
                  className="w-full bg-section text-foreground border border-border rounded-xl pl-12 pr-4 py-3 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>
          ))}

          <div>
            <label className="block text-sm font-bold text-gray-text mb-2">Vehicle Type</label>
            <select
              value={form.vehicle_type}
              onChange={(e) => update("vehicle_type", e.target.value)}
              className="w-full bg-section text-foreground border border-border rounded-xl px-4 py-3 focus:outline-none focus:border-primary"
            >
              <option value="Bike">Bike</option>
              <option value="Scooter">Scooter</option>
              <option value="Cycle">Cycle</option>
              <option value="Car">Car</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:bg-primary-hover text-white font-black py-4 rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-60 mt-2"
          >
            {loading ? "Creating account..." : "Register"}
            <ArrowRight className="w-5 h-5" />
          </button>
        </form>

        <p className="text-center text-sm text-gray-text mt-6">
          Already a rider?{" "}
          <Link href="/delivery/login" className="text-primary font-bold hover:underline">
            Sign in
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
