"use client";

import { Loader2, AlertCircle, Inbox, RefreshCw } from "lucide-react";

export function SupportSpinner({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-10 text-gray-text" role="status">
      <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden />
      <p className="text-sm font-bold">{label}</p>
    </div>
  );
}

export function SupportSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-3 animate-pulse" aria-hidden>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-border bg-white p-4">
          <div className="mb-3 h-4 w-1/3 rounded bg-section" />
          <div className="h-3 w-full rounded bg-section" />
          <div className="mt-2 h-3 w-2/3 rounded bg-section" />
        </div>
      ))}
    </div>
  );
}

export function SupportEmptyState({
  title = "Nothing here yet",
  description = "When you have activity, it will show up here.",
}: {
  title?: string;
  description?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-white">
        <Inbox className="h-6 w-6 text-[#9CA3AF]" />
      </div>
      <h3 className="text-lg font-bold text-foreground">{title}</h3>
      <p className="max-w-sm text-sm text-gray-text">{description}</p>
    </div>
  );
}

export function SupportErrorState({
  message = "Something went wrong",
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-10 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/10">
        <AlertCircle className="h-6 w-6 text-red-500" />
      </div>
      <p className="text-sm font-bold text-foreground">{message}</p>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-primary-hover"
        >
          <RefreshCw className="h-4 w-4" />
          Retry
        </button>
      ) : null}
    </div>
  );
}
