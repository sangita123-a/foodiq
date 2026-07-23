"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

type Props = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  wide?: boolean;
  /** Inline page panel (same chrome as modal, no overlay). */
  variant?: "modal" | "page";
};

export default function SupportModal({
  open,
  onClose,
  title,
  children,
  wide,
  variant = "modal",
}: Props) {
  useEffect(() => {
    if (!open || variant === "page") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose, variant]);

  if (!open) return null;

  const panel = (
    <div
      className={`flex w-full flex-col overflow-hidden rounded-3xl border border-border bg-section shadow-lg ${
        wide ? "max-w-3xl" : "max-w-xl"
      } ${variant === "page" ? "mx-auto" : ""}`}
    >
      <div className="flex items-center justify-between border-b border-border px-5 py-4 md:px-6">
        <h2 className="text-xl font-bold text-foreground">{title}</h2>
        <button
          type="button"
          onClick={onClose}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-white text-gray-text transition-colors hover:text-foreground"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-5 md:p-6 custom-scrollbar">{children}</div>
    </div>
  );

  if (variant === "page") {
    return panel;
  }

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[100] flex items-end justify-center p-0 sm:items-center sm:p-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <button
          type="button"
          className="absolute inset-0 bg-black/45"
          aria-label="Close dialog"
          onClick={onClose}
        />
        <motion.div
          initial={{ y: 40, opacity: 0, scale: 0.98 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 24, opacity: 0, scale: 0.98 }}
          transition={{ type: "spring", stiffness: 380, damping: 32 }}
          className={`relative z-10 flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-3xl border border-border bg-section shadow-2xl sm:rounded-3xl ${
            wide ? "sm:max-w-3xl" : "sm:max-w-xl"
          }`}
        >
          <div className="flex items-center justify-between border-b border-border px-5 py-4 md:px-6">
            <h2 className="text-xl font-bold text-foreground">{title}</h2>
            <button
              type="button"
              onClick={onClose}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-white text-gray-text transition-colors hover:text-foreground"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-5 md:p-6 custom-scrollbar">{children}</div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
}
