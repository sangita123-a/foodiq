"use client";

import { useEffect } from "react";
import { trackJsError } from "@/lib/monitoring/client";

/**
 * Next.js App Router error UI — logs to monitoring without changing design language.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    trackJsError(error, { source: "app_error", digest: error.digest });
  }, [error]);

  return (
    <div className="min-h-[50vh] flex items-center justify-center p-8">
      <div className="text-center max-w-md">
        <h2 className="text-xl font-bold text-foreground mb-2">Something went wrong</h2>
        <p className="text-sm text-gray-text mb-4">
          The error was logged. Please try again.
        </p>
        <button
          type="button"
          className="px-4 py-2 rounded-xl bg-primary text-white font-bold text-sm"
          onClick={reset}
        >
          Try again
        </button>
      </div>
    </div>
  );
}
