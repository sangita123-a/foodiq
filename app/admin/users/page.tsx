"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminUsersPageRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/admin/customers");
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6 text-center">
      <div className="space-y-3">
        <div className="w-10 h-10 border-4 border-[#E23744] border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm font-bold text-gray-700">Redirecting to Enterprise Customer Management...</p>
      </div>
    </div>
  );
}
