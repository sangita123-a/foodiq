"use client";

import { useRef, useState, ChangeEvent, DragEvent } from "react";
import { Upload, X, Loader2, ImageIcon, FileText } from "lucide-react";
import SafeImage from "@/components/ui/SafeImage";
import { uploadMediaWithRetry, MediaPurpose, MediaAsset } from "@/services/mediaApi";
import { useToast } from "@/contexts/ToastContext";

type Props = {
  purpose: MediaPurpose | string;
  value?: string | null;
  onUploaded?: (asset: MediaAsset) => void;
  onClear?: () => void;
  label?: string;
  hint?: string;
  accept?: string;
  entityId?: string;
  entityType?: string;
  link?: boolean;
  aspect?: "square" | "wide" | "avatar";
  className?: string;
  fallback?: string;
};

const ACCEPT_IMAGE = "image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp";
const ACCEPT_DOC = "image/jpeg,image/png,image/webp,application/pdf,.jpg,.jpeg,.png,.webp,.pdf";

export default function MediaUploader({
  purpose,
  value,
  onUploaded,
  onClear,
  label = "Upload",
  hint,
  accept,
  entityId,
  entityType,
  link = true,
  aspect = "wide",
  className = "",
  fallback,
}: Props) {
  const { showToast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(value || null);

  const isDoc =
    purpose === "license" ||
    purpose === "vehicle_rc" ||
    purpose === "insurance" ||
    purpose === "document";

  const sizeClass =
    aspect === "avatar"
      ? "w-28 h-28 rounded-full"
      : aspect === "square"
        ? "w-full aspect-square max-w-xs rounded-2xl"
        : "w-full h-40 md:h-48 rounded-2xl";

  const process = async (file: File) => {
    setUploading(true);
    setProgress(0);
    try {
      const localUrl = URL.createObjectURL(file);
      setPreview(localUrl);
      const asset = await uploadMediaWithRetry(file, {
        purpose,
        entity_id: entityId,
        entity_type: entityType,
        link,
        onProgress: setProgress,
      });
      setPreview(asset.variants?.card || asset.url);
      onUploaded?.(asset);
      showToast("Upload successful", "success");
    } catch (err: any) {
      setPreview(value || null);
      showToast(err?.response?.data?.message || err?.message || "Upload failed", "error");
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const onFile = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) process(file);
    e.target.value = "";
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) process(file);
  };

  const clear = () => {
    setPreview(null);
    onClear?.();
  };

  const isPdf = preview?.toLowerCase?.().includes(".pdf") || preview?.includes("application/pdf");

  return (
    <div className={className}>
      {label && (
        <div className="flex items-center justify-between mb-2">
          <label className="block text-xs font-bold text-[#6B7280] uppercase tracking-wider">
            {label}
          </label>
          {preview && !uploading && (
            <button
              type="button"
              onClick={clear}
              className="text-xs font-bold text-[#EF4444] hover:underline"
            >
              Remove
            </button>
          )}
        </div>
      )}

      <div
        className={`${sizeClass} relative bg-[#F8FAFC] border border-dashed ${
          dragging ? "border-[#E23744] bg-[#E23744]/5" : "border-[#E5E7EB]"
        } overflow-hidden flex flex-col items-center justify-center cursor-pointer group transition-all`}
        onClick={() => !uploading && inputRef.current?.click()}
        onDragEnter={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragOver={(e) => e.preventDefault()}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
      >
        {preview && !isPdf ? (
          <SafeImage
            src={preview}
            fallback={fallback || "/images/placeholder-food.jpg"}
            alt={label}
            className="absolute inset-0 w-full h-full object-cover"
            loading="lazy"
          />
        ) : preview && isPdf ? (
          <div className="flex flex-col items-center gap-2 text-[#6B7280] z-10">
            <FileText className="w-8 h-8 text-[#E23744]" />
            <span className="text-xs font-bold">PDF uploaded</span>
            <a
              href={preview}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-[#E23744] underline"
              onClick={(e) => e.stopPropagation()}
            >
              Open
            </a>
          </div>
        ) : (
          <div className="flex flex-col items-center text-[#9CA3AF] z-10 px-4 text-center">
            {isDoc ? <FileText className="w-7 h-7 mb-2" /> : <ImageIcon className="w-7 h-7 mb-2" />}
            <span className="text-sm font-bold text-[#111827] group-hover:text-[#E23744]">
              {label}
            </span>
            {hint && <span className="text-xs mt-1">{hint}</span>}
            <span className="text-[10px] mt-2 flex items-center gap-1">
              <Upload className="w-3 h-3" /> JPG, PNG, WEBP{isDoc ? ", PDF" : ""}
            </span>
          </div>
        )}

        {uploading && (
          <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center z-20 text-white">
            <Loader2 className="w-6 h-6 animate-spin mb-2" />
            <span className="text-xs font-bold">{progress}%</span>
            <div className="w-2/3 h-1.5 bg-white/30 rounded-full mt-2 overflow-hidden">
              <div
                className="h-full bg-[#E23744] transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept={accept || (isDoc ? ACCEPT_DOC : ACCEPT_IMAGE)}
        onChange={onFile}
      />
    </div>
  );
}
