"use client";

import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminHeader from "@/components/admin/AdminHeader";

type AdminShellProps = {
  title?: string;
  children: React.ReactNode;
};

export default function AdminShellInner({ title, children }: AdminShellProps) {
  return (
    <div className="min-h-screen bg-section flex selection:bg-primary selection:text-white">
      <div className="hidden lg:block w-64 flex-shrink-0">
        <AdminSidebar />
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
