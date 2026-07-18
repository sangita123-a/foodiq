"use client";

import { motion } from "framer-motion";
import useSWR from "swr";
import api from "@/services/api";
import { useToast } from "@/contexts/ToastContext";
import { FormEvent, useState } from "react";
import MediaUploader from "@/components/media/MediaUploader";
import { AVATAR_FALLBACK } from "@/lib/images";
import type { MediaAsset } from "@/services/mediaApi";

export default function ProfileSettings() {
  const { data, isLoading, mutate } = useSWR("/api/profile");
  const user = data || {
    full_name: "",
    email: "",
    phone_number: "",
    date_of_birth: "",
    gender: "",
    profile_image_url: "",
  };
  const { showToast } = useToast();
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);

  const currentPhoto = photoUrl ?? user.profile_image_url ?? null;

  const handleSave = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const payload = {
      full_name: formData.get("full_name"),
      email: formData.get("email"),
      phone_number: formData.get("phone_number"),
      date_of_birth: formData.get("dob") || null,
      gender: formData.get("gender") || null,
      profile_image_url: currentPhoto || null,
    };
    try {
      const res = await api.put("/api/profile", payload);
      localStorage.setItem(
        "user",
        JSON.stringify({ ...JSON.parse(localStorage.getItem("user") || "{}"), ...res.data.data })
      );
      showToast("Profile updated successfully", "success");
      mutate();
    } catch (err: any) {
      showToast(err.response?.data?.message || "Failed to update profile", "error");
    }
  };

  const onUploaded = (asset: MediaAsset) => {
    setPhotoUrl(asset.url);
    mutate();
  };

  const removePhoto = async () => {
    try {
      await api.put("/api/profile", { profile_image_url: AVATAR_FALLBACK });
      setPhotoUrl(AVATAR_FALLBACK);
      showToast("Photo removed", "success");
      mutate();
    } catch (err: any) {
      showToast(err.response?.data?.message || "Failed to remove photo", "error");
    }
  };

  if (isLoading) {
    return <div className="text-[#111827] animate-pulse h-64 bg-[#F8FAFC] rounded-3xl"></div>;
  }

  const dob = user.date_of_birth ? String(user.date_of_birth).slice(0, 10) : "";

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="bg-[#F8FAFC] rounded-3xl p-6 md:p-10 border border-[#E5E7EB] shadow-2xl"
    >
      <h2 className="text-2xl font-bold text-[#111827] mb-8">Profile Settings</h2>

      <div className="flex flex-col sm:flex-row items-start gap-6 mb-10">
        <MediaUploader
          purpose="user_profile"
          value={currentPhoto}
          aspect="avatar"
          label="Profile Photo"
          hint="PNG, JPG, WEBP up to 3MB"
          fallback={AVATAR_FALLBACK}
          onUploaded={onUploaded}
          onClear={removePhoto}
        />
        <div className="pt-2">
          <h3 className="text-[#111827] font-bold text-lg">Your photo</h3>
          <p className="text-[#6B7280] text-sm">
            Uploaded to secure cloud storage with CDN delivery.
          </p>
        </div>
      </div>

      <form id="settings-form" onSubmit={handleSave} className="space-y-6">
        <input type="hidden" name="profile_image_url" value={currentPhoto || ""} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-bold text-[#6B7280] mb-2">Full Name</label>
            <input
              type="text"
              name="full_name"
              defaultValue={user.full_name}
              required
              className="w-full bg-white text-[#111827] border border-[#E5E7EB] rounded-xl px-4 py-3.5 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-[#6B7280] mb-2">Email Address</label>
            <input
              type="email"
              name="email"
              defaultValue={user.email}
              required
              className="w-full bg-white text-[#111827] border border-[#E5E7EB] rounded-xl px-4 py-3.5 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-bold text-[#6B7280] mb-2">Mobile Number</label>
            <input
              type="tel"
              name="phone_number"
              defaultValue={user.phone_number || ""}
              className="w-full bg-white text-[#111827] border border-[#E5E7EB] rounded-xl px-4 py-3.5 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-[#6B7280] mb-2">Date of Birth</label>
            <input
              type="date"
              name="dob"
              defaultValue={dob}
              className="w-full bg-white text-[#111827] border border-[#E5E7EB] rounded-xl px-4 py-3.5 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors "
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold text-[#6B7280] mb-2">Gender</label>
          <select
            name="gender"
            defaultValue={user.gender || ""}
            className="w-full bg-white text-[#111827] border border-[#E5E7EB] rounded-xl px-4 py-3.5 focus:outline-none focus:border-primary appearance-none cursor-pointer"
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
