"use client";

import { useEffect, useRef, useState } from "react";
import { MoreVertical, Eye, CheckCircle2, XCircle, Ban, PlayCircle, Trash2 } from "lucide-react";
import { verifyRestaurant, adminDelete } from "@/services/adminApi";
import { useToast } from "@/contexts/ToastContext";
import type { AdminRestaurantRow } from "@/services/adminApi";
import ConfirmDialog from "./ConfirmDialog";

export default function RestaurantActionsMenu({
  restaurant,
  onViewDetails,
  onChanged,
}: {
  restaurant: AdminRestaurantRow;
  onViewDetails: () => void;
  onChanged: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { showToast } = useToast();

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const act = async (action: "approve" | "reject" | "suspend" | "activate") => {
    setOpen(false);
    let reason: string | undefined;
    if (action === "reject" || action === "suspend") {
      reason = prompt(`Reason for ${action === "reject" ? "rejecting" : "suspending"} ${restaurant.name}:`) || undefined;
      if (action === "reject" && !reason) {
        showToast("A reason is required to reject a restaurant", "error");
        return;
      }
    }
    try {
      await verifyRestaurant(restaurant.id, action, reason);
      onChanged();
      showToast(`Restaurant ${action}d`, "success");
    } catch {
      showToast(`Failed to ${action} restaurant`, "error");
    }
  };

  const remove = async () => {
    setDeleting(true);
    try {
      await adminDelete(`/api/admin/restaurants/${restaurant.id}`);
      onChanged();
      showToast("Restaurant removed", "success");
      setConfirmingDelete(false);
    } catch {
      showToast("Failed to remove restaurant", "error");
    } finally {
      setDeleting(false);
    }
  };

  const isPending = (restaurant.approval_status || "approved") === "pending";
  const isSuspended = restaurant.is_active === false;

  return (
    <div className="relative inline-block" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Restaurant actions"
        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-section"
      >
        <MoreVertical className="w-4 h-4" />
      </button>
      {open && (
        <div className="absolute right-0 mt-1 w-52 bg-white border border-border rounded-xl shadow-lg z-20 overflow-hidden text-sm">
          <button type="button" onClick={() => { setOpen(false); onViewDetails(); }} className="w-full flex items-center gap-2 text-left px-3.5 py-2.5 hover:bg-section font-semibold">
            <Eye className="w-4 h-4" /> View Details
          </button>
          {isPending && (
            <>
              <button type="button" onClick={() => act("approve")} className="w-full flex items-center gap-2 text-left px-3.5 py-2.5 hover:bg-section font-semibold text-emerald-600 border-t border-border">
                <CheckCircle2 className="w-4 h-4" /> Approve
              </button>
              <button type="button" onClick={() => act("reject")} className="w-full flex items-center gap-2 text-left px-3.5 py-2.5 hover:bg-section font-semibold text-red-600 border-t border-border">
                <XCircle className="w-4 h-4" /> Reject
              </button>
            </>
          )}
          {isSuspended ? (
            <button type="button" onClick={() => act("activate")} className="w-full flex items-center gap-2 text-left px-3.5 py-2.5 hover:bg-section font-semibold text-emerald-600 border-t border-border">
              <PlayCircle className="w-4 h-4" /> Activate
            </button>
          ) : (
            <button type="button" onClick={() => act("suspend")} className="w-full flex items-center gap-2 text-left px-3.5 py-2.5 hover:bg-section font-semibold text-amber-600 border-t border-border">
              <Ban className="w-4 h-4" /> Suspend
            </button>
          )}
          <button
            type="button"
            onClick={() => { setOpen(false); setConfirmingDelete(true); }}
            className="w-full flex items-center gap-2 text-left px-3.5 py-2.5 hover:bg-section font-semibold text-red-600 border-t border-border"
          >
            <Trash2 className="w-4 h-4" /> Delete
          </button>
        </div>
      )}
      {confirmingDelete && (
        <ConfirmDialog
          title={`Remove ${restaurant.name}?`}
          message="This hides the restaurant from listings and search. It is reversible on request, and does not delete its order or review history."
          confirmLabel="Remove Restaurant"
          busy={deleting}
          onConfirm={remove}
          onCancel={() => setConfirmingDelete(false)}
        />
      )}
    </div>
  );
}
