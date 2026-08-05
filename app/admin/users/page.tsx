"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminUsersPageRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/admin/customers");
  }, [router]);

  return (
    <div className="admin-scope min-h-screen bg-section flex items-center justify-center p-6 text-center">
      <div className="space-y-3">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm font-bold text-foreground">Redirecting to Enterprise Customer Management...</p>
      </div>
    </div>
  );
}
