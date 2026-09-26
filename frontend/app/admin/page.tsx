"use client";

// ==========================================================
// GoldTrade V18 Enterprise
// frontend/app/admin/page.tsx
// Production Ready (Render + Vercel + Linux)
// ==========================================================

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getSession } from "@/lib/auth";

export default function AdminPage() {
  const router = useRouter();

  useEffect(() => {
    const session = getSession();

    // No login session
    if (!session) {
      router.replace("/login");
      return;
    }

    // User cannot access admin pages
    if (session.user.role !== "admin") {
      router.replace("/dashboard");
      return;
    }

    // Admin goes to dashboard
    router.replace("/admin/dashboard");
  }, [router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-black text-white">
      <div className="text-center">
        {/* Loading Spinner */}
        <div className="mx-auto mb-6 h-14 w-14 animate-spin rounded-full border-4 border-yellow-400 border-t-transparent"></div>

        <h1 className="text-3xl font-bold text-yellow-400">
          GoldTrade V18 Enterprise
        </h1>

        <p className="mt-3 text-gray-400">
          Redirecting to Admin Dashboard...
        </p>

        <p className="mt-2 text-xs text-gray-600">
          Secure JWT Authentication • Render Backend • Vercel Frontend
        </p>
      </div>
    </main>
  );
}