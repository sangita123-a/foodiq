"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CheckCircle2, Clock, FileText, ShieldAlert, ShieldCheck, Upload, XCircle } from "lucide-react";
import DeliveryShell from "@/components/delivery/DeliveryShell";
import { useToast } from "@/contexts/ToastContext";
import {
  fetchDeliveryDocuments,
  uploadDeliveryDocument,
  type DeliveryDocument,
  type DeliveryDocumentType,
  type DeliveryKycSummary,
} from "@/services/deliveryApi";

const DOCUMENT_META: Record<
  DeliveryDocumentType,
  { label: string; hint: string; requiresExpiry: boolean; requiresNumber: boolean }
> = {
  profile_photo: { label: "Profile Photo", hint: "A clear photo of yourself", requiresExpiry: false, requiresNumber: false },
  aadhaar: { label: "Aadhaar Card", hint: "Government-issued Aadhaar ID", requiresExpiry: false, requiresNumber: true },
  pan: { label: "PAN Card", hint: "Permanent Account Number card", requiresExpiry: false, requiresNumber: true },
  driving_license: { label: "Driving License", hint: "Valid driving license, front & back", requiresExpiry: true, requiresNumber: true },
  rc: { label: "Vehicle RC", hint: "Vehicle registration certificate", requiresExpiry: false, requiresNumber: true },
  insurance: { label: "Vehicle Insurance", hint: "Valid insurance policy document", requiresExpiry: true, requiresNumber: true },
};

const DOCUMENT_ORDER: DeliveryDocumentType[] = [
  "profile_photo",
  "aadhaar",
  "pan",
  "driving_license",
  "rc",
  "insurance",
];

const STATUS_BADGE: Record<string, string> = {
  approved: "bg-green-50 text-green-600 border-green-200",
  pending: "bg-amber-50 text-amber-600 border-amber-200",
  rejected: "bg-red-50 text-red-600 border-red-200",
  missing: "bg-gray-100 text-gray-500 border-gray-200",
};

function StatusBadge({ status }: { status: string }) {
  const icon =
    status === "approved" ? (
      <CheckCircle2 className="w-3.5 h-3.5" />
    ) : status === "rejected" ? (
      <XCircle className="w-3.5 h-3.5" />
    ) : status === "pending" ? (
      <Clock className="w-3.5 h-3.5" />
    ) : (
      <ShieldAlert className="w-3.5 h-3.5" />
    );
  return (
    <span
      className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full border ${
        STATUS_BADGE[status] || STATUS_BADGE.missing
      }`}
    >
      {icon}
      {status}
    </span>
  );
}

function DocumentCard({
  type,
  doc,
  onUploaded,
}: {
  type: DeliveryDocumentType;
  doc?: DeliveryDocument;
  onUploaded: (doc: DeliveryDocument) => void;
}) {
  const { showToast } = useToast();
  const meta = DOCUMENT_META[type];
  const inputRef = useRef<HTMLInputElement>(null);
  const [documentNumber, setDocumentNumber] = useState(doc?.document_number || "");
  const [expiryDate, setExpiryDate] = useState(doc?.expiry_date?.slice(0, 10) || "");
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const status = doc?.verification_status || "missing";
  const isPdf = doc?.file_url?.toLowerCase().includes(".pdf");

  const handleFile = async (file: File) => {
    if (meta.requiresExpiry && !expiryDate) {
      showToast(`Expiry date is required for ${meta.label}`, "error");
      return;
    }
    setUploading(true);
    setProgress(0);
    try {
      const updated = await uploadDeliveryDocument(file, type, {
        documentNumber: documentNumber || undefined,
        expiryDate: expiryDate || undefined,
        onProgress: setProgress,
      });
      onUploaded(updated);
      showToast(`${meta.label} uploaded. Pending admin verification.`, "success");
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string } } };
      showToast(ax.response?.data?.message || `Failed to upload ${meta.label}`, "error");
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  return (
    <div className="bg-white border border-border rounded-2xl p-5 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-black text-foreground">{meta.label}</h3>
          <p className="text-xs text-gray-text mt-0.5">{meta.hint}</p>
        </div>
        <StatusBadge status={status} />
      </div>

      {status === "rejected" && doc?.rejection_reason && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          <span className="font-bold">Rejected: </span>
          {doc.rejection_reason}
        </div>
      )}

      {doc?.file_url && (
        <div
          className="relative w-full h-36 rounded-xl bg-section border border-border overflow-hidden flex items-center justify-center cursor-pointer"
          onClick={() => window.open(doc.file_url, "_blank", "noopener,noreferrer")}
        >
          {isPdf ? (
            <div className="flex flex-col items-center gap-1.5 text-gray-text">
              <FileText className="w-8 h-8 text-primary" />
              <span className="text-xs font-bold">View PDF</span>
            </div>
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={doc.file_url} alt={meta.label} className="w-full h-full object-cover" />
          )}
        </div>
      )}

      {meta.requiresNumber && (
        <label className="block">
          <span className="text-[11px] font-bold text-gray-text uppercase">Document Number</span>
          <input
            value={documentNumber}
            onChange={(e) => setDocumentNumber(e.target.value)}
            placeholder="e.g. document ID number"
            className="mt-1 w-full border border-border rounded-xl px-3 py-2 text-sm"
          />
        </label>
      )}

      {meta.requiresExpiry && (
        <label className="block">
          <span className="text-[11px] font-bold text-gray-text uppercase">Expiry Date</span>
          <input
            type="date"
            value={expiryDate}
            onChange={(e) => setExpiryDate(e.target.value)}
            className="mt-1 w-full border border-border rounded-xl px-3 py-2 text-sm"
          />
        </label>
      )}

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-white text-sm font-bold py-2.5 rounded-xl disabled:opacity-60"
      >
        <Upload className="w-4 h-4" />
        {uploading ? `Uploading ${progress}%…` : doc ? "Re-upload Document" : "Upload Document"}
      </button>
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept="image/jpeg,image/png,image/webp,application/pdf,.jpg,.jpeg,.png,.webp,.pdf"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = "";
        }}
      />
    </div>
  );
}

export default function DeliveryDocumentsPage() {
  const { showToast } = useToast();
  const [summary, setSummary] = useState<DeliveryKycSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const data = await fetchDeliveryDocuments();
      setSummary(data);
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string } } };
      showToast(ax.response?.data?.message || "Failed to load documents", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    load();
  }, [load]);

  const docByType = new Map((summary?.documents || []).map((d) => [d.document_type, d]));

  const handleUploaded = (doc: DeliveryDocument) => {
    setSummary((prev) => {
      if (!prev) return prev;
      const documents = prev.documents.filter((d) => d.document_type !== doc.document_type);
      documents.push(doc);
      return { ...prev, documents };
    });
    load();
  };

  return (
    <DeliveryShell title="Documents">
      <div className="max-w-5xl space-y-6">
        <div>
          <h1 className="text-2xl font-black text-foreground">KYC & Vehicle Verification</h1>
          <p className="text-sm text-gray-text mt-1">
            Upload each required document below. You must have all documents approved before you
            can go online, accept orders, or receive assignments.
          </p>
        </div>

        {!loading && summary && (
          <div
            className={`rounded-2xl border px-4 py-3.5 flex items-start gap-3 ${
              summary.is_verified
                ? "border-green-200 bg-green-50 text-green-800"
                : "border-amber-200 bg-amber-50 text-amber-800"
            }`}
          >
            {summary.is_verified ? (
              <ShieldCheck className="w-5 h-5 shrink-0 mt-0.5" />
            ) : (
              <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
            )}
            <div className="text-sm">
              <p className="font-extrabold">
                {summary.is_verified
                  ? "You are fully KYC verified"
                  : "KYC verification incomplete"}
              </p>
              {!summary.is_verified && (
                <p className="mt-0.5">
                  {summary.missing_types.length > 0 && (
                    <>Missing: {summary.missing_types.map((t) => DOCUMENT_META[t].label).join(", ")}. </>
                  )}
                  {summary.pending_types.length > 0 && (
                    <>Pending review: {summary.pending_types.map((t) => DOCUMENT_META[t].label).join(", ")}. </>
                  )}
                  {summary.rejected_types.length > 0 && (
                    <>Rejected: {summary.rejected_types.map((t) => DOCUMENT_META[t].label).join(", ")}. </>
                  )}
                  {summary.expired_types.length > 0 && (
                    <>Expired: {summary.expired_types.map((t) => DOCUMENT_META[t].label).join(", ")}.</>
                  )}
                </p>
              )}
            </div>
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {DOCUMENT_ORDER.map((t) => (
              <div key={t} className="h-64 rounded-2xl bg-section animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {DOCUMENT_ORDER.map((type) => (
              <DocumentCard key={type} type={type} doc={docByType.get(type)} onUploaded={handleUploaded} />
            ))}
          </div>
        )}
      </div>
    </DeliveryShell>
  );
}
