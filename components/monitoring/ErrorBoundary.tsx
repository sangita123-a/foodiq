"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";
import { reportClientError } from "@/services/monitoringApi";

type Props = { children: ReactNode; fallback?: ReactNode };
type State = { hasError: boolean };

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    const name = error instanceof Error ? error.name : "";
    if (/hydrat/i.test(message) || /hydrat/i.test(name)) {
      return { hasError: false };
    }
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (/hydrat/i.test(error.message) || /hydrat/i.test(error.name)) {
      return;
    }
    reportClientError({
      message: error.message,
      stack: error.stack,
      path: typeof window !== "undefined" ? window.location.pathname : undefined,
      meta: { componentStack: info.componentStack, source: "react_error_boundary" },
    });
    void import("@/lib/monitoring/client").then(({ trackJsError }) => {
      trackJsError(error, { source: "react_error_boundary" });
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="min-h-[40vh] flex items-center justify-center p-8">
            <div className="text-center max-w-md">
              <h2 className="text-xl font-bold text-[#111827] mb-2">Something went wrong</h2>
              <p className="text-sm text-[#6B7280] mb-4">
                The error was logged. Please refresh the page.
              </p>
              <button
                type="button"
                className="px-4 py-2 rounded-xl bg-[#E23744] text-white font-bold text-sm"
                onClick={() => {
                  this.setState({ hasError: false });
                  window.location.reload();
                }}
              >
                Reload
              </button>
            </div>
          </div>
        )
      );
    }
    return this.props.children;
  }
}
