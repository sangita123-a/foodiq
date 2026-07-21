"use client";

import { useEffect, useMemo, useState } from "react";
import AdminShell from "@/components/admin/AdminShell";
import SafeImage from "@/components/ui/SafeImage";
import { useToast } from "@/contexts/ToastContext";
import {
  listMedia,
  deleteMedia,
  bulkDeleteMedia,
  approveMedia,
  rejectMedia,
  getStorageInfo,
  MediaAsset,
} from "@/services/mediaApi";
import { Search, Trash2, Check, X, RefreshCw, Images } from "lucide-react";

export default function AdminMediaPage() {
  const { showToast } = useToast();
  const [items, setItems] = useState<MediaAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [purpose, setPurpose] = useState("");
  const [status, setStatus] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [preview, setPreview] = useState<MediaAsset | null>(null);
  const [info, setInfo] = useState<{ provider: string } | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const [rows, storage] = await Promise.all([
        listMedia({
          scope: "all",
          q: q || undefined,
          purpose: purpose || undefined,
          status: status || undefined,
          limit: 100,
        }),
        getStorageInfo(),
      ]);
      setItems(rows);
      setInfo(storage);
    } catch (err: any) {
      showToast(err?.response?.data?.message || "Failed to load media", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const allSelected = useMemo(
    () => items.length > 0 && items.every((i) => selected.has(i.id)),
    [items, selected]
  );

  return (
    <AdminShell title="Media Library">
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-foreground flex items-center gap-2">
              <Images className="w-6 h-6 text-primary" /> Media Library
            </h1>
            <p className="text-sm text-gray-text mt-1">
              Provider: <span className="font-bold text-foreground">{info?.provider || "…"}</span>
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={load}
              className="px-4 py-2 rounded-xl border border-border font-bold text-sm flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" /> Refresh
            </button>
            {selected.size > 0 && (
              <button
                type="button"
                onClick={async () => {
                  try {
                    await bulkDeleteMedia([...selected]);
                    showToast(`Deleted ${selected.size} files`, "success");
                    setSelected(new Set());
                    load();
                  } catch (err: any) {
                    showToast(err?.response?.data?.message || "Bulk delete failed", "error");
                  }
                }}
                className="px-4 py-2 rounded-xl bg-red-500 text-white font-bold text-sm flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" /> Delete ({selected.size})
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search URL, purpose, uploader…"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-white text-sm"
            />
          </div>
          <select
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
            className="px-3 py-2.5 rounded-xl border border-border text-sm"
          >
            <option value="">All purposes</option>
            <option value="food">Food</option>
            <option value="restaurant_logo">Restaurant logo</option>
            <option value="restaurant_banner">Restaurant banner</option>
            <option value="user_profile">User profile</option>
            <option value="delivery_profile">Delivery profile</option>
            <option value="license">License</option>
            <option value="vehicle_rc">Vehicle RC</option>
            <option value="insurance">Insurance</option>
          </select>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="px-3 py-2.5 rounded-xl border border-border text-sm"
          >
            <option value="">All statuses</option>
            <option value="approved">Approved</option>
            <option value="pending">Pending</option>
            <option value="rejected">Rejected</option>
          </select>
          <button
            type="button"
            onClick={load}
            className="px-5 py-2.5 rounded-xl bg-primary text-white font-bold text-sm"
          >
            Filter
          </button>
        </div>

        {loading ? (
          <div className="h-48 animate-pulse bg-section rounded-2xl" />
        ) : items.length === 0 ? (
          <div className="text-center py-16 text-gray-text">No media found.</div>
        ) : (
          <>
            <label className="flex items-center gap-2 text-sm font-bold text-gray-text">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={() => {
                  if (allSelected) setSelected(new Set());
                  else setSelected(new Set(items.map((i) => i.id)));
                }}
              />
              Select all
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {items.map((item) => (
                <div
                  key={item.id}
                  className={`rounded-2xl border overflow-hidden bg-white ${
                    selected.has(item.id) ? "border-primary ring-2 ring-primary/30" : "border-border"
                  }`}
                >
                  <button
                    type="button"
                    className="relative w-full aspect-square bg-section"
                    onClick={() => setPreview(item)}
                  >
                    {item.file_type === "document" || item.mime_type === "application/pdf" ? (
                      <div className="absolute inset-0 flex items-center justify-center text-sm font-bold text-gray-text">
                        PDF
                      </div>
                    ) : (
                      <SafeImage
                        src={item.variants?.thumb || item.url}
                        fallback="/images/placeholder-food.jpg"
                        alt={item.purpose}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    )}
                    <span className="absolute top-2 left-2 text-[10px] font-bold uppercase bg-black/60 text-white px-2 py-0.5 rounded">
                      {item.status}
                    </span>
                  </button>
                  <div className="p-3 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <input
                        type="checkbox"
                        checked={selected.has(item.id)}
                        onChange={() => toggle(item.id)}
                      />
                      <span className="text-xs font-bold text-foreground truncate">{item.purpose}</span>
                    </div>
                    <p className="text-[10px] text-[#9CA3AF] truncate">{item.uploader_name || "—"}</p>
                    <div className="flex gap-1 flex-wrap">
                      {item.status === "pending" && (
                        <>
                          <button
                            type="button"
                            className="p-1.5 rounded-lg bg-green-50 text-green-600"
                            onClick={async () => {
                              await approveMedia(item.id);
                              showToast("Approved", "success");
                              load();
                            }}
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            className="p-1.5 rounded-lg bg-amber-50 text-amber-600"
                            onClick={async () => {
                              await rejectMedia(item.id);
                              showToast("Rejected", "success");
                              load();
                            }}
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                      <button
                        type="button"
                        className="p-1.5 rounded-lg bg-red-50 text-red-500 ml-auto"
                        onClick={async () => {
                          await deleteMedia(item.id);
                          showToast("Deleted", "success");
                          load();
                        }}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {preview && (
          <div
            className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
            onClick={() => setPreview(null)}
          >
            <div
              className="bg-white rounded-2xl max-w-2xl w-full overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="aspect-video bg-section relative">
                {preview.file_type === "document" &&
                typeof preview.url === "string" &&
                /^https?:\/\//i.test(preview.url) &&
                !/^javascript:/i.test(preview.url) ? (
                  <iframe
                    src={preview.url}
                    className="w-full h-full"
                    title="preview"
                    sandbox="allow-same-origin"
                    referrerPolicy="no-referrer"
                  />
                ) : preview.file_type === "document" ? (
                  <div className="w-full h-full flex items-center justify-center text-sm text-gray-text">
                    Preview unavailable for this document URL
                  </div>
                ) : (
                  <SafeImage
                    src={preview.url}
                    fallback="/images/placeholder-food.jpg"
                    alt="preview"
                    className="w-full h-full object-contain"
                  />
                )}
              </div>
              <div className="p-4 space-y-1 text-sm">
                <p className="font-bold text-foreground">{preview.purpose}</p>
                <p className="text-gray-text break-all text-xs">{preview.url}</p>
                <p className="text-[#9CA3AF] text-xs">
                  {preview.provider} · {(Number(preview.file_size || 0) / 1024).toFixed(1)} KB
                </p>
                <button
                  type="button"
                  className="mt-3 px-4 py-2 rounded-xl border font-bold text-sm"
                  onClick={() => setPreview(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
