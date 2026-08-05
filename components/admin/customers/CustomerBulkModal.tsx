"use client";

import { useState } from "react";
import { AlertTriangle, CheckSquare, X } from "lucide-react";
import { Button } from "@/components/admin/ui";

type Props = {
  isOpen: boolean;
  action: "verify" | "block" | "unblock" | "delete" | null;
  count: number;
  onClose: () => void;
  onConfirm: () => Promise<void>;
};

export default function CustomerBulkModal({
  isOpen,
  action,
  count,
  onClose,
  onConfirm,
}: Props) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !action) return null;

  const getTitle = () => {
    if (action === "verify") return `Verify ${count} Selected Customer(s)?`;
    if (action === "block") return `Block ${count} Selected Customer(s)?`;
    if (action === "unblock") return `Unblock ${count} Selected Customer(s)?`;
    return `Permanently Delete ${count} Customer Account(s)?`;
  };

  const getDescription = () => {
    if (action === "verify")
      return "This will mark all selected customer profiles as identity verified.";
    if (action === "block")
      return "Selected customers will lose access to order food and access their portal until unblocked.";
    if (action === "unblock")
      return "Selected customer accounts will be restored to active status immediately.";
    return "WARNING: This operation is permanent. Selected accounts, order records, and saved details will be purged.";
  };

  const handleConfirm = async () => {
    try {
      setIsSubmitting(true);
      await onConfirm();
    } finally {
      setIsSubmitting(false);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white border border-border rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold">
            {action === "delete" ? (
              <AlertTriangle className="w-5 h-5" />
            ) : (
              <CheckSquare className="w-5 h-5" />
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div>
          <h3 className="text-lg font-black text-gray-900">{getTitle()}</h3>
          <p className="text-xs text-gray-500 mt-1">{getDescription()}</p>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <Button onClick={onClose} disabled={isSubmitting} variant="secondary" size="md" className="px-4 py-2.5">
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isSubmitting}
            loading={isSubmitting}
            variant={action === "delete" || action === "block" ? "danger" : "primary"}
            size="md"
            className="px-5 py-2.5"
          >
            {isSubmitting ? "Processing..." : "Confirm Action"}
          </Button>
        </div>
      </div>
    </div>
  );
}
