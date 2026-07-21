"use client";

import { useEffect, useState } from "react";
import DeliveryShell from "@/components/delivery/DeliveryShell";
import MediaUploader from "@/components/media/MediaUploader";
import api from "@/services/api";
import { useToast } from "@/contexts/ToastContext";
import { AVATAR_FALLBACK } from "@/lib/images";

type PartnerDocs = {
  profile_photo_url?: string;
  vehicle_photo_url?: string;
  license_photo_url?: string;
  vehicle_rc_url?: string;
  insurance_doc_url?: string;
  vehicle_details?: string;
  vehicle_type?: string;
  license_number?: string;
  full_name?: string;
};

export default function DeliveryDocumentsPage() {
  const { showToast } = useToast();
  const [data, setData] = useState<PartnerDocs>({});
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const res = await api.get("/api/delivery/me");
      const payload = res.data.data || {};
      const partner = payload.partner || payload;
      setData({
        ...partner,
        full_name: payload.user?.full_name || partner.full_name,
      });
    } catch (err: any) {
      showToast(err?.response?.data?.message || "Failed to load profile", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <DeliveryShell title="Documents">
      <div className="max-w-3xl space-y-8">
        <div>
          <h1 className="text-2xl font-black text-foreground">Profile & Documents</h1>
          <p className="text-sm text-gray-text mt-1">
            Upload your photo, license, vehicle RC, and insurance. Document uploads may require admin approval.
          </p>
        </div>

        {loading ? (
          <div className="h-48 animate-pulse bg-section rounded-2xl" />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <MediaUploader
              purpose="delivery_profile"
              value={data.profile_photo_url}
              label="Profile photo"
              aspect="avatar"
              fallback={AVATAR_FALLBACK}
              onUploaded={(a) => setData((d) => ({ ...d, profile_photo_url: a.url }))}
            />
            <MediaUploader
              purpose="vehicle"
              value={data.vehicle_photo_url}
              label="Vehicle photo"
              aspect="square"
              onUploaded={(a) => setData((d) => ({ ...d, vehicle_photo_url: a.url }))}
            />
            <MediaUploader
              purpose="license"
              value={data.license_photo_url}
              label="Driving license"
              aspect="wide"
              onUploaded={(a) => setData((d) => ({ ...d, license_photo_url: a.url }))}
            />
            <MediaUploader
              purpose="vehicle_rc"
              value={data.vehicle_rc_url}
              label="Vehicle RC"
              aspect="wide"
              onUploaded={(a) => setData((d) => ({ ...d, vehicle_rc_url: a.url }))}
            />
            <MediaUploader
              purpose="insurance"
              value={data.insurance_doc_url}
              label="Insurance document"
              aspect="wide"
              className="md:col-span-2"
              onUploaded={(a) => setData((d) => ({ ...d, insurance_doc_url: a.url }))}
            />
          </div>
        )}
      </div>
    </DeliveryShell>
  );
}
