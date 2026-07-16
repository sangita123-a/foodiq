"use client";

import { motion } from "framer-motion";
import { Camera } from "lucide-react";
import useSWR from "swr";
import api from "@/services/api";
import { useToast } from "@/contexts/ToastContext";
import { FormEvent, useRef } from "react";

const DEFAULT_AVATAR =
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200";

export default function ProfileSettings() {
  const { data, isLoading, mutate } = useSWR("/api/profile");
  const user = data || { full_name: "", email: "", phone_number: "", date_of_birth: "", gender: "", profile_image_url: "" };
  const { showToast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);

  const handleSave = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const payload = {
      full_name: formData.get("full_name"),
      email: formData.get("email"),
      phone_number: formData.get("phone_number"),
      date_of_birth: formData.get("dob") || null,
      gender: formData.get("gender") || null,
      profile_image_url: formData.get("profile_image_url") || user.profile_image_url || null,
    };
    try {
      const res = await api.put("/api/profile", payload);
      localStorage.setItem("user", JSON.stringify({ ...JSON.parse(localStorage.getItem("user") || "{}"), ...res.data.data }));
      showToast("Profile updated successfully", "success");
      mutate();
    } catch (err: any) {
      showToast(err.response?.data?.message || "Failed to update profile", "error");
    }
  };

  const handlePhoto = (file: File | null) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      showToast("Image must be under 5MB", "error");
      return;
    }
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        await api.put("/api/profile", { profile_image_url: reader.result });
        showToast("Profile photo updated", "success");
        mutate();
      } catch (err: any) {
        showToast(err.response?.data?.message || "Failed to upload photo", "error");
      }
    };
    reader.readAsDataURL(file);
  };

  const removePhoto = async () => {
    try {
      await api.put("/api/profile", { profile_image_url: DEFAULT_AVATAR });
      showToast("Photo removed", "success");
      mutate();
    } catch (err: any) {
      showToast(err.response?.data?.message || "Failed to remove photo", "error");
    }
  };

  if (isLoading) {
    return <div className="text-white animate-pulse h-64 bg-white/5 rounded-3xl"></div>;
  }

  const dob = user.date_of_birth
    ? String(user.date_of_birth).slice(0, 10)
    : "";

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="bg-[#171717] rounded-3xl p-6 md:p-10 border border-white/5 shadow-2xl"
    >
      <h2 className="text-2xl font-bold text-white mb-8">Profile Settings</h2>

      <div className="flex items-center gap-6 mb-10">
        <div className="relative group cursor-pointer" onClick={() => fileRef.current?.click()}>
          <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white/10 group-hover:border-primary transition-colors">
            <img
              src={user.profile_image_url || DEFAULT_AVATAR}
              alt="Profile"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <Camera className="w-6 h-6 text-white" />
          </div>
        </div>
        <div>
          <h3 className="text-white font-bold text-lg">Profile Photo</h3>
          <p className="text-gray-400 text-sm mb-3">PNG, JPG up to 5MB</p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="bg-white/10 hover:bg-white/20 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors"
            >
              Upload New
            </button>
            <button
              type="button"
              onClick={removePhoto}
              className="bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-bold px-4 py-2 rounded-lg transition-colors"
            >
              Remove
            </button>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handlePhoto(e.target.files?.[0] || null)}
          />
        </div>
      </div>

      <form id="settings-form" onSubmit={handleSave} className="space-y-6">
        <input type="hidden" name="profile_image_url" value={user.profile_image_url || ""} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-bold text-gray-400 mb-2">Full Name</label>
            <input
              type="text"
              name="full_name"
              defaultValue={user.full_name}
              required
              className="w-full bg-[#111] text-white border border-white/10 rounded-xl px-4 py-3.5 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-400 mb-2">Email Address</label>
            <input
              type="email"
              name="email"
              defaultValue={user.email}
              required
              className="w-full bg-[#111] text-white border border-white/10 rounded-xl px-4 py-3.5 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-bold text-gray-400 mb-2">Mobile Number</label>
            <input
              type="tel"
              name="phone_number"
              defaultValue={user.phone_number || ""}
              className="w-full bg-[#111] text-white border border-white/10 rounded-xl px-4 py-3.5 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-400 mb-2">Date of Birth</label>
            <input
              type="date"
              name="dob"
              defaultValue={dob}
              className="w-full bg-[#111] text-white border border-white/10 rounded-xl px-4 py-3.5 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors [color-scheme:dark]"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-400 mb-2">Gender</label>
          <select
            name="gender"
            defaultValue={user.gender || ""}
            className="w-full bg-[#111] text-white border border-white/10 rounded-xl px-4 py-3.5 focus:outline-none focus:border-primary appearance-none cursor-pointer"
          >
            <option value="">Prefer not to say</option>
            <option value="female">Female</option>
            <option value="male">Male</option>
            <option value="other">Other</option>
          </select>
        </div>
      </form>
    </motion.div>
  );
}
