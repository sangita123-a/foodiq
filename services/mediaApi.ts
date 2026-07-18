import api from "@/services/api";

export type MediaPurpose =
  | "restaurant_logo"
  | "restaurant_banner"
  | "restaurant_cover"
  | "food"
  | "category"
  | "user_profile"
  | "delivery_profile"
  | "vehicle"
  | "license"
  | "vehicle_rc"
  | "insurance"
  | "document"
  | "other";

export type MediaAsset = {
  id: string;
  url: string;
  public_id: string;
  purpose: string;
  provider: string;
  mime_type?: string;
  file_type?: string;
  file_size?: number;
  status?: string;
  variants?: {
    original?: string;
    thumb?: string;
    card?: string;
    banner?: string;
  };
  created_at?: string;
  uploader_name?: string;
};

export type UploadOptions = {
  purpose: MediaPurpose | string;
  entity_type?: string;
  entity_id?: string;
  link?: boolean;
  onProgress?: (pct: number) => void;
};

export async function uploadMedia(file: File, options: UploadOptions) {
  const form = new FormData();
  form.append("file", file);
  form.append("purpose", options.purpose);
  if (options.entity_type) form.append("entity_type", options.entity_type);
  if (options.entity_id) form.append("entity_id", options.entity_id);
  if (options.link === false) form.append("link", "false");

  const res = await api.post("/api/media/upload", form, {
    timeout: 60000,
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress: (evt) => {
      if (!options.onProgress || !evt.total) return;
      options.onProgress(Math.round((evt.loaded / evt.total) * 100));
    },
  });
  return res.data.data as MediaAsset;
}

export async function uploadMediaWithRetry(
  file: File,
  options: UploadOptions,
  retries = 2
) {
  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await uploadMedia(file, options);
    } catch (err) {
      lastError = err;
      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, 600 * (attempt + 1)));
      }
    }
  }
  throw lastError;
}

export async function listMedia(params: Record<string, string | number | undefined> = {}) {
  const res = await api.get("/api/media", { params });
  return res.data.data as MediaAsset[];
}

export async function deleteMedia(id: string) {
  const res = await api.delete(`/api/media/${id}`);
  return res.data.data;
}

export async function bulkDeleteMedia(ids: string[]) {
  const res = await api.post("/api/media/bulk-delete", { ids });
  return res.data.data;
}

export async function approveMedia(id: string) {
  const res = await api.put(`/api/media/${id}/approve`);
  return res.data.data;
}

export async function rejectMedia(id: string) {
  const res = await api.put(`/api/media/${id}/reject`);
  return res.data.data;
}

export async function getStorageInfo() {
  const res = await api.get("/api/media/info");
  return res.data.data as {
    provider: string;
    cloudinary_ready: boolean;
    s3_ready: boolean;
  };
}
