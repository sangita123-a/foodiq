"use client";

import type { ReactNode } from "react";
import AdminShellInner from "./AdminShellInner";

type AdminShellProps = {
  title?: string;
  children: ReactNode;
};

export default function AdminShell({ title, children }: AdminShellProps) {
  return <AdminShellInner title={title}>{children}</AdminShellInner>;
}
