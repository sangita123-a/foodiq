"use client";

import { AlertTriangle, Loader2 } from "lucide-react";

export default function ConfirmDialog({
  title,
  message,
  confirmLabel = "Confirm",
  busy = false,
  onConfirm,
  onCancel,
}: {
  title: string;
  message: string;
  confirmLabel?: string;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[60] bg-black/40 flex items-center justify-center px-4"
      onClick={onCancel}
      role="presentation"
    >
      <div
        className="bg-white w-full max-w-sm rounded-2xl shadow-2xl p-5"
        onClick={(e) => e.stopPropagation()}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
      >
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <h3 id="confirm-dialog-title" className="text-sm font-black text-foreground">
              {title}
            </h3>
            <p className="text-sm text-gray-text mt-1">{message}</p>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="px-3.5 py-2 rounded-xl text-sm font-bold border border-border hover:bg-section disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-bold bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
          >
            {busy && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
