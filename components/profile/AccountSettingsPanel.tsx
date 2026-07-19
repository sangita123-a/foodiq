"use client";

import { motion } from "framer-motion";
import useSWR from "swr";
import api from "@/services/api";
import { useToast } from "@/contexts/ToastContext";
import { FormEvent, useState } from "react";
import MediaUploader from "@/components/media/MediaUploader";
import { AVATAR_FALLBACK } from "@/lib/images";
import NotificationSettings from "@/components/settings/sections/NotificationSettings";
import LanguageRegionSettings from "@/components/settings/sections/LanguageRegionSettings";
import type { MediaAsset } from "@/services/mediaApi";

export default function AccountSettingsPanel() {
  const { data, isLoading, mutate } = useSWR("/api/profile");
  const user = data?.data ?? data ?? {};
  const { showToast } = useToast();
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [bannerUrl, setBannerUrl] = useState<string | null>(null);

  const currentPhoto = photoUrl ?? user.profile_image_url ?? null;
  const currentBanner = bannerUrl ?? user.profile_banner_url ?? null;

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
      profile_banner_url: currentBanner || null,
      address_line: formData.get("address_line") || null,
      city: formData.get("city") || null,
      state: formData.get("state") || null,
      pincode: formData.get("pincode") || null,
    };
    try {
      const res = await api.put("/api/profile", payload);
      const updated = res.data?.data ?? res.data;
      localStorage.setItem(
        "user",
        JSON.stringify({ ...JSON.parse(localStorage.getItem("user") || "{}"), ...updated })
      );
      showToast("Profile saved permanently", "success");
      mutate();
    } catch (err: unknown) {
      const message =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      showToast(message || "Failed to update profile", "error");
    }
  };

  if (isLoading) {
    return <div className="h-64 animate-pulse rounded-3xl bg-[#F8F9FA]" />;
  }

  const dob = user.date_of_birth ? String(user.date_of_birth).slice(0, 10) : "";

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="rounded-[24px] border border-[#E5E7EB] bg-white p-6 shadow-sm md:p-10">
        <h2 className="mb-2 text-2xl font-bold text-[#222222]">Account Settings</h2>
        <p className="mb-8 text-sm text-[#555555]">Edit your profile anytime. Changes are saved to your account.</p>

        <div className="mb-8 grid gap-6 md:grid-cols-2">
          <MediaUploader
            purpose="user_profile"
            value={currentPhoto}
            aspect="avatar"
            label="Profile Photo"
            hint="PNG, JPG, WEBP up to 3MB"
            fallback={AVATAR_FALLBACK}
            onUploaded={(asset: MediaAsset) => setPhotoUrl(asset.url)}
            onClear={() => setPhotoUrl(AVATAR_FALLBACK)}
          />
          <MediaUploader
            purpose="user_banner"
            value={currentBanner}
            aspect="wide"
            label="Profile Banner"
            hint="Wide banner for your dashboard"
            onUploaded={(asset: MediaAsset) => setBannerUrl(asset.url)}
            onClear={() => setBannerUrl(null)}
          />
        </div>

        <form id="account-settings-form" onSubmit={handleSave} className="space-y-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <Field label="Full Name" name="full_name" defaultValue={user.full_name} required />
            <Field label="Email" name="email" type="email" defaultValue={user.email} required />
            <Field label="Phone Number" name="phone_number" defaultValue={user.phone_number || ""} />
            <div>
              <label className="mb-2 block text-sm font-bold text-[#555555]">Date of Birth</label>
              <input
                type="date"
                name="dob"
                defaultValue={dob}
                className="w-full rounded-xl border border-[#E5E7EB] bg-white px-4 py-3.5 text-[#222222] focus:border-[#E23744] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold text-[#555555]">Gender</label>
            <select
              name="gender"
              defaultValue={user.gender || ""}
              className="w-full cursor-pointer rounded-xl border border-[#E5E7EB] bg-white px-4 py-3.5 text-[#222222] focus:border-[#E23744] focus:outline-none"
            >
              <option value="">Prefer not to say</option>
              <option value="female">Female</option>
              <option value="male">Male</option>
              <option value="other">Other</option>
            </select>
          </div>

          <Field label="Address" name="address_line" defaultValue={user.address_line || ""} />
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <Field label="City" name="city" defaultValue={user.city || ""} />
            <Field label="State" name="state" defaultValue={user.state || ""} />
            <Field label="Pincode" name="pincode" defaultValue={user.pincode || ""} />
          </div>

          <button
            type="submit"
            className="rounded-xl bg-[#E23744] px-8 py-3 font-bold text-white shadow-md hover:bg-[#C81E34]"
          >
            Save Changes
          </button>
        </form>
      </div>

      <div className="rounded-[24px] border border-[#E5E7EB] bg-white p-6 shadow-sm md:p-8">
        <h3 className="mb-6 text-xl font-bold text-[#222222]">Language & Notifications</h3>
        <div className="space-y-6">
          <LanguageRegionSettings />
          <NotificationSettings />
        </div>
      </div>
    </motion.div>
  );
}

function Field({
  label,
  name,
  defaultValue,
  type = "text",
  required,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-bold text-[#555555]">{label}</label>
      <input
        type={type}
        name={name}
        defaultValue={defaultValue}
        required={required}
        className="w-full rounded-xl border border-[#E5E7EB] bg-white px-4 py-3.5 text-[#222222] focus:border-[#E23744] focus:outline-none"
      />
    </div>
  );
}
