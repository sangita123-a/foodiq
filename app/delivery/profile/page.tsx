"use client";

import { useEffect, useState } from "react";
import DeliveryShell from "@/components/delivery/DeliveryShell";
import MediaUploader from "@/components/media/MediaUploader";
import api from "@/services/api";
import { useToast } from "@/contexts/ToastContext";
import { AVATAR_FALLBACK } from "@/lib/images";
import { updateDeliveryProfile } from "@/services/deliveryApi";

type PartnerProfile = {
  profile_photo_url?: string;
  vehicle_photo_url?: string;
  license_photo_url?: string;
  vehicle_rc_url?: string;
  insurance_doc_url?: string;
  vehicle_details?: string;
  vehicle_type?: string;
  license_number?: string;
  bank_account_name?: string;
  bank_account_number?: string;
  bank_ifsc?: string;
  upi_id?: string;
  aadhaar_last4?: string;
  full_name?: string;
  phone_number?: string;
  approval_status?: string;
};

export default function DeliveryProfilePage() {
  const { showToast } = useToast();
  const [data, setData] = useState<PartnerProfile>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      const res = await api.get("/api/delivery/me");
      const payload = res.data.data || {};
      const partner = payload.partner || payload;
      setData({
        ...partner,
        full_name: payload.user?.full_name || partner.full_name,
        phone_number: payload.user?.phone_number || partner.phone_number,
      });
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string } } };
      showToast(ax.response?.data?.message || "Failed to load profile", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      await updateDeliveryProfile(data);
      showToast("Profile updated", "success");
      load();
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string } } };
      showToast(ax.response?.data?.message || "Failed to save profile", "error");
    } finally {
      setSaving(false);
    }
  };

  const verification = data.approval_status || "approved";

  return (
    <DeliveryShell title="Profile">
      <div className="max-w-3xl space-y-8">
        <div>
          <h1 className="text-2xl font-black text-[#111827]">Driver Profile</h1>
          <p className="text-sm text-[#6B7280] mt-1">
            Manage your photo, KYC documents, vehicle, and payout details.
          </p>
          {verification === "pending" && (
            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Your profile is pending admin verification. You can complete documents while waiting.
            </div>
          )}
        </div>

        {loading ? (
          <div className="h-48 animate-pulse bg-[#F8FAFC] rounded-2xl" />
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="block">
                <span className="text-xs font-bold text-[#6B7280] uppercase">Full Name</span>
                <input
                  value={data.full_name || ""}
                  onChange={(e) => setData((d) => ({ ...d, full_name: e.target.value }))}
                  className="mt-1 w-full border border-[#E5E7EB] rounded-xl px-4 py-3 text-sm"
                />
              </label>
              <label className="block">
                <span className="text-xs font-bold text-[#6B7280] uppercase">Phone</span>
                <input
                  value={data.phone_number || ""}
                  onChange={(e) => setData((d) => ({ ...d, phone_number: e.target.value }))}
                  className="mt-1 w-full border border-[#E5E7EB] rounded-xl px-4 py-3 text-sm"
                />
              </label>
              <label className="block">
                <span className="text-xs font-bold text-[#6B7280] uppercase">Vehicle Type</span>
                <input
                  value={data.vehicle_type || ""}
                  onChange={(e) => setData((d) => ({ ...d, vehicle_type: e.target.value }))}
                  className="mt-1 w-full border border-[#E5E7EB] rounded-xl px-4 py-3 text-sm"
                />
              </label>
              <label className="block">
                <span className="text-xs font-bold text-[#6B7280] uppercase">License Number</span>
                <input
                  value={data.license_number || ""}
                  onChange={(e) => setData((d) => ({ ...d, license_number: e.target.value }))}
                  className="mt-1 w-full border border-[#E5E7EB] rounded-xl px-4 py-3 text-sm"
                />
              </label>
              <label className="block md:col-span-2">
                <span className="text-xs font-bold text-[#6B7280] uppercase">Vehicle Details</span>
                <input
                  value={data.vehicle_details || ""}
                  onChange={(e) => setData((d) => ({ ...d, vehicle_details: e.target.value }))}
                  className="mt-1 w-full border border-[#E5E7EB] rounded-xl px-4 py-3 text-sm"
                />
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <MediaUploader
                purpose="delivery_profile"
                value={data.profile_photo_url}
                label="Driver photo"
                aspect="avatar"
                fallback={AVATAR_FALLBACK}
                onUploaded={(a) => setData((d) => ({ ...d, profile_photo_url: a.url }))}
              />
              <MediaUploader
                purpose="license"
                value={data.license_photo_url}
                label="Driving license"
                aspect="wide"
                onUploaded={(a) => setData((d) => ({ ...d, license_photo_url: a.url }))}
              />
              <MediaUploader
                purpose="vehicle"
                value={data.vehicle_photo_url}
                label="Vehicle photo"
                aspect="square"
                onUploaded={(a) => setData((d) => ({ ...d, vehicle_photo_url: a.url }))}
              />
              <MediaUploader
                purpose="vehicle_rc"
                value={data.vehicle_rc_url}
                label="Vehicle RC"
                aspect="wide"
                onUploaded={(a) => setData((d) => ({ ...d, vehicle_rc_url: a.url }))}
              />
            </div>

            <section className="bg-white border border-[#E5E7EB] rounded-2xl p-5 space-y-4">
              <h2 className="text-lg font-black text-[#111827]">Bank & UPI</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="block">
                  <span className="text-xs font-bold text-[#6B7280] uppercase">Account Name</span>
                  <input
                    value={data.bank_account_name || ""}
                    onChange={(e) => setData((d) => ({ ...d, bank_account_name: e.target.value }))}
                    className="mt-1 w-full border border-[#E5E7EB] rounded-xl px-4 py-3 text-sm"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-bold text-[#6B7280] uppercase">Account Number</span>
                  <input
                    value={data.bank_account_number || ""}
                    onChange={(e) => setData((d) => ({ ...d, bank_account_number: e.target.value }))}
                    className="mt-1 w-full border border-[#E5E7EB] rounded-xl px-4 py-3 text-sm"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-bold text-[#6B7280] uppercase">IFSC</span>
                  <input
                    value={data.bank_ifsc || ""}
                    onChange={(e) => setData((d) => ({ ...d, bank_ifsc: e.target.value }))}
                    className="mt-1 w-full border border-[#E5E7EB] rounded-xl px-4 py-3 text-sm"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-bold text-[#6B7280] uppercase">UPI ID</span>
                  <input
                    value={data.upi_id || ""}
                    onChange={(e) => setData((d) => ({ ...d, upi_id: e.target.value }))}
                    className="mt-1 w-full border border-[#E5E7EB] rounded-xl px-4 py-3 text-sm"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-bold text-[#6B7280] uppercase">Aadhaar (last 4)</span>
                  <input
                    value={data.aadhaar_last4 || ""}
                    maxLength={4}
                    onChange={(e) =>
                      setData((d) => ({ ...d, aadhaar_last4: e.target.value.replace(/\D/g, "") }))
                    }
                    className="mt-1 w-full border border-[#E5E7EB] rounded-xl px-4 py-3 text-sm"
                  />
                </label>
              </div>
            </section>

            <button
              type="button"
              onClick={save}
              disabled={saving}
              className="bg-[#E23744] hover:bg-[#C81E34] text-white font-bold px-6 py-3 rounded-xl disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save Profile"}
            </button>
          </>
        )}
      </div>
    </DeliveryShell>
  );
}
