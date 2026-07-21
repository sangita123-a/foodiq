"use client";

import dynamic from "next/dynamic";
import type { ReactNode } from "react";

const AdminShellInner = dynamic(() => import("./AdminShellInner"), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-section animate-pulse" aria-hidden />
  ),
});

type AdminShellProps = {
  title?: string;
  children: ReactNode;
};

export default function AdminShell({ title, children }: AdminShellProps) {
  return <AdminShellInner title={title}>{children}</AdminShellInner>;
}
