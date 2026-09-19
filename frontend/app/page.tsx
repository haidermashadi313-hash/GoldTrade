"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");

    // User login nahi hai
    if (!token) {
      router.replace("/login");
      return;
    }

    // Admin login
    if (role === "admin") {
      router.replace("/admin-dashboard");
      return;
    }

    // Normal user
    router.replace("/dashboard");
  }, [router]);

  return (
    <main className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-yellow-400 mb-4">
          GoldTrade V18
        </h1>

        <p className="text-gray-300 text-lg">
          Loading your dashboard...
        </p>

        <div className="mt-8 flex justify-center">
          <div className="w-12 h-12 rounded-full border-4 border-yellow-400 border-t-transparent animate-spin" />
        </div>
      </div>
    </main>
  );
}

