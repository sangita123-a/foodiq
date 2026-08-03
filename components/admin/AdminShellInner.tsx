"use client";

import { useEffect, useState } from "react";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminHeader from "@/components/admin/AdminHeader";

type AdminShellProps = {
  title?: string;
  children: React.ReactNode;
};

const COLLAPSE_KEY = "admin_sidebar_collapsed";

export default function AdminShellInner({ title, children }: AdminShellProps) {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem(COLLAPSE_KEY) === "1");
    } catch {
      /* ignore */
    }
  }, []);

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(COLLAPSE_KEY, next ? "1" : "0");
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  return (
    <div className="admin-scope min-h-screen bg-section flex selection:bg-primary selection:text-white">
      <div
        className={`hidden lg:block flex-shrink-0 transition-[width] duration-300 ease-in-out ${
          collapsed ? "w-20" : "w-64"
        }`}
      >
        <AdminSidebar collapsed={collapsed} onToggleCollapsed={toggleCollapsed} />
      </div>
      <div className="flex-1 flex flex-col min-w-0">
        <AdminHeader title={title} />
        <main className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}
