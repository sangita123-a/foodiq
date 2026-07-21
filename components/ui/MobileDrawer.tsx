"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { usePrefersReducedMotion } from "@/hooks/useMediaQuery";

type MobileDrawerProps = {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  side?: "left" | "right" | "bottom";
  width?: string;
};

export default function MobileDrawer({
  open,
  onClose,
  children,
  title,
  side = "left",
  width = "w-[min(320px,85vw)]",
}: MobileDrawerProps) {
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const panelVariants = {
    left: {
      initial: { x: "-100%" },
      animate: { x: 0 },
      exit: { x: "-100%" },
      className: `fixed top-0 left-0 z-[80] h-full ${width} bg-white shadow-2xl flex flex-col`,
    },
    right: {
      initial: { x: "100%" },
      animate: { x: 0 },
      exit: { x: "100%" },
      className: `fixed top-0 right-0 z-[80] h-full ${width} bg-white shadow-2xl flex flex-col`,
    },
    bottom: {
      initial: { y: "100%" },
      animate: { y: 0 },
      exit: { y: "100%" },
      className:
        "fixed bottom-0 left-0 right-0 z-[80] max-h-[92vh] rounded-t-2xl bg-white shadow-2xl flex flex-col",
    },
  }[side];

  const transition = reducedMotion
    ? { duration: 0.15 }
    : { type: "spring" as const, stiffness: 380, damping: 36 };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reducedMotion ? 0.1 : 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-[70] bg-[#1C1C1C]/50 backdrop-blur-[2px]"
            aria-hidden
          />
          <motion.aside
            initial={panelVariants.initial}
            animate={panelVariants.animate}
            exit={panelVariants.exit}
            transition={transition}
            className={panelVariants.className}
            role="dialog"
            aria-modal="true"
            aria-label={title || "Navigation menu"}
          >
            {side === "bottom" && (
              <div className="flex justify-center pt-3 pb-1 shrink-0">
                <div className="h-1 w-10 rounded-full bg-[#E5E7EB]" />
              </div>
            )}
            {title && (
              <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
                <h2 className="text-base font-bold text-foreground">{title}</h2>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#F8F9FA] text-muted hover:text-foreground"
                  aria-label="Close menu"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            )}
            <div className="flex-1 overflow-y-auto overscroll-contain">{children}</div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
