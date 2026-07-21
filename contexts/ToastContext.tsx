"use client";

import React, { createContext, useCallback, useContext, useMemo, useState, ReactNode } from "react";
import { CheckCircle2, XCircle, X } from "lucide-react";

type ToastType = "success" | "error";

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [exiting, setExiting] = useState<Set<string>>(new Set());

  const showToast = useCallback((message: string, type: ToastType) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      setExiting((prev) => new Set(prev).add(id));
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
        setExiting((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      }, 200);
    }, 3000);
  }, []);

  const contextValue = useMemo(() => ({ showToast }), [showToast]);

  const removeToast = (id: string) => {
    setExiting((prev) => new Set(prev).add(id));
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
      setExiting((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }, 200);
  };

  return (
    <ToastContext.Provider value={contextValue}>
      {children}

      <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-3 pointer-events-none w-full max-w-sm px-4">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role="status"
            aria-live="polite"
            className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl bg-white/95 backdrop-blur-xl shadow-[0_18px_50px_rgba(28,28,28,0.16)] border pointer-events-auto ${
              exiting.has(toast.id) ? "toast-exit" : "toast-enter"
            } ${
              toast.type === "success"
                ? "border-primary/30 text-primary"
                : "border-primary/30 text-primary"
            }`}
          >
            {toast.type === "success" ? (
              <CheckCircle2 className="w-5 h-5 shrink-0" />
            ) : (
              <XCircle className="w-5 h-5 shrink-0" />
            )}
            <span className="flex-1 text-sm font-semibold text-foreground">{toast.message}</span>
            <button
              onClick={() => removeToast(toast.id)}
              aria-label="Dismiss notification"
              className="flex h-8 w-8 items-center justify-center rounded-xl text-muted opacity-70 hover:bg-section hover:opacity-100 transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
