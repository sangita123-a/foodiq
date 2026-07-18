/**
 * Dynamic-import wrappers for heavy role shells (no visual change).
 * Keeps initial customer bundles smaller when these aren't needed.
 */
"use client";

import dynamic from "next/dynamic";
import type { ComponentProps } from "react";

export const DynamicAdminShell = dynamic(
  () => import("@/components/admin/AdminShell"),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-screen bg-[#F8FAFC] animate-pulse" aria-hidden />
    ),
  }
);

export const DynamicDeliveryShell = dynamic(
  () => import("@/components/delivery/DeliveryShell"),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-screen bg-[#F8FAFC] animate-pulse" aria-hidden />
    ),
  }
);

export type AdminShellProps = ComponentProps<typeof DynamicAdminShell>;
export type DeliveryShellProps = ComponentProps<typeof DynamicDeliveryShell>;
