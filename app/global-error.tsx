"use client";

import { useEffect } from "react";

/**
 * Root-level error boundary (must define its own html/body).
 * Avoids importing app CSS that might have failed.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Best-effort beacon — no shared imports that could also be broken
    try {
      const body = JSON.stringify({
        message: error.message,
        stack: error.stack,
        path: typeof window !== "undefined" ? window.location.pathname : undefined,
        meta: { source: "global_error", digest: error.digest },
      });
      const api = process.env.NEXT_PUBLIC_API_URL;
      if (api && process.env.NODE_ENV === "production") {
        void fetch(`${api}/api/monitoring/client-error`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body,
          keepalive: true,
        });
      }
    } catch {
      /* ignore */
    }
  }, [error]);

  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", padding: 48, textAlign: "center" }}>
        <h2 style={{ fontSize: 20, marginBottom: 8 }}>Something went wrong</h2>
        <p style={{ color: "#6B7280", marginBottom: 16 }}>Please refresh or try again.</p>
        <button
          type="button"
          onClick={reset}
          style={{
            background: "#FC8019",
            color: "#fff",
            border: 0,
            borderRadius: 12,
            padding: "10px 16px",
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}
