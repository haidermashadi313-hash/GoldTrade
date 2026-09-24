"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/login");
  }, [router]);

  return (
    <div className="min-h-screen bg-[#0B1120] flex items-center justify-center text-white">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-yellow-400">
          GoldTrade V18 Enterprise
        </h2>

        <p className="text-gray-400 mt-3">
          Redirecting to Admin Login...
        </p>
      </div>
    </div>
  );
}