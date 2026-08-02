"use client";

import { useMemo, useState } from "react";
import { mutate } from "swr";
import { FileText } from "lucide-react";
import AdminShell from "@/components/admin/AdminShell";
import { useAdminList } from "@/hooks/useAdminData";
import {
  adminPatch,
  formatDate,
  type AdminKycDocument,
  type AdminKycDocumentsResponse,
} from "@/services/adminApi";

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-50 text-amber-600",
  approved: "bg-green-50 text-green-600",
  rejected: "bg-red-50 text-red-600",
};

const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  aadhaar: "Aadhaar Card",
  pan: "PAN Card",
  driving_license: "Driving License",
  rc: "Vehicle RC",
  insurance: "Vehicle Insurance",
  profile_photo: "Profile Photo",
};

export default function AdminDeliveryDocumentsPage() {
  const [status, setStatus] = useState<"" | "pending" | "approved" | "rejected">("pending");
  const [documentType, setDocumentType] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [reasons, setReasons] = useState<Record<string, string>>({});
  const [processingId, setProcessingId] = useState<string | null>(null);

  const path = useMemo(() => {
    const q = new URLSearchParams();
    if (status) q.set("status", status);
    if (documentType) q.set("document_type", documentType);
    if (search) q.set("search", search);
    q.set("page", String(page));
    q.set("limit", "20");
    return `/api/admin/delivery/documents?${q.toString()}`;
  }, [status, documentType, search, page]);

  const { data, isLoading } = useAdminList<AdminKycDocumentsResponse>(path);
  const documents = data?.documents || [];
  const pagination = data?.pagination;
  const refresh = () => mutate(path);

  const process = async (doc: AdminKycDocument, action: "approved" | "rejected") => {
    setProcessingId(doc.id);
    try {
      await adminPatch(`/api/admin/delivery/documents/${doc.id}`, {
        status: action,
        reason: action === "rejected" ? reasons[doc.id] || "" : "",
      });
      refresh();
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <AdminShell title="Delivery KYC">
      <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-foreground">Delivery Partner KYC</h1>
          <p className="text-gray-text">Review Aadhaar, PAN, license, RC, and insurance documents.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search partner, doc number…"
            className="bg-white border border-border rounded-xl px-4 py-2.5 text-sm w-56"
          />
          <select
            value={documentType}
            onChange={(e) => {
              setDocumentType(e.target.value);
              setPage(1);
            }}
            className="bg-white border border-border rounded-xl px-4 py-2.5 text-sm"
          >
            <option value="">All Document Types</option>
            {Object.entries(DOCUMENT_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value as "" | "pending" | "approved" | "rejected");
              setPage(1);
            }}
            className="bg-white border border-border rounded-xl px-4 py-2.5 text-sm"
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {isLoading && <p className="text-sm text-gray-text mb-4">Loading…</p>}

      <div className="bg-white border border-border rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-section text-left">
              <tr>
                <th className="px-5 py-3 font-bold text-gray-text">Partner</th>
                <th className="px-5 py-3 font-bold text-gray-text">Document</th>
                <th className="px-5 py-3 font-bold text-gray-text">Preview</th>
                <th className="px-5 py-3 font-bold text-gray-text">Expiry</th>
                <th className="px-5 py-3 font-bold text-gray-text">Status</th>
                <th className="px-5 py-3 font-bold text-gray-text">Reason</th>
                <th className="px-5 py-3 font-bold text-gray-text">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {documents.map((doc) => (
                <tr key={doc.id}>
                  <td className="px-5 py-4">
                    <p className="font-bold text-foreground">{doc.partner_name || "Partner"}</p>
                    <p className="text-xs text-gray-text">{doc.partner_email}</p>
                    <p className="text-xs text-[#9CA3AF]">{doc.partner_phone}</p>
                  </td>
                  <td className="px-5 py-4">
                    <p className="font-bold text-foreground">
                      {DOCUMENT_TYPE_LABELS[doc.document_type] || doc.document_type}
                    </p>
                    {doc.document_number && (
                      <p className="text-xs text-gray-text">#{doc.document_number}</p>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <a
                      href={doc.file_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline"
                    >
                      <FileText className="w-4 h-4" />
                      View
                    </a>
                  </td>
                  <td className="px-5 py-4 text-xs text-gray-text">
                    {doc.expiry_date ? formatDate(doc.expiry_date) : "—"}
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full ${
                        STATUS_STYLES[doc.verification_status] || "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {doc.verification_status}
                    </span>
                    {doc.verified_at && (
                      <p className="text-[10px] text-[#9CA3AF] mt-1">{formatDate(doc.verified_at)}</p>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    {doc.verification_status === "pending" ? (
                      <input
                        value={reasons[doc.id] || ""}
                        onChange={(e) => setReasons((r) => ({ ...r, [doc.id]: e.target.value }))}
                        placeholder="Rejection reason"
                        className="border border-border rounded-lg px-2 py-1.5 text-xs w-40"
                      />
                    ) : (
                      <p className="text-xs text-gray-text">{doc.rejection_reason || "—"}</p>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    {doc.verification_status === "pending" ? (
                      <div className="flex gap-2">
                        <button
                          type="button"
                          disabled={processingId === doc.id}
                          onClick={() => process(doc, "approved")}
                          className="text-xs font-bold bg-green-500 text-white px-3 py-1.5 rounded-lg disabled:opacity-50"
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          disabled={processingId === doc.id || !reasons[doc.id]}
                          onClick={() => process(doc, "rejected")}
                          className="text-xs font-bold bg-red-500 text-white px-3 py-1.5 rounded-lg disabled:opacity-50"
                        >
                          Reject
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-[#9CA3AF]">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!documents.length && !isLoading && (
          <p className="text-center text-[#9CA3AF] py-16">No documents found.</p>
        )}
      </div>

      {pagination && pagination.total_pages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-xs text-gray-text">
            Page {pagination.page} of {pagination.total_pages} · {pagination.total} documents
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="text-xs font-bold border border-border px-3 py-1.5 rounded-lg disabled:opacity-40"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={page >= pagination.total_pages}
              onClick={() => setPage((p) => Math.min(pagination.total_pages, p + 1))}
              className="text-xs font-bold border border-border px-3 py-1.5 rounded-lg disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </AdminShell>
  );
}
