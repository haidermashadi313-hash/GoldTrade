"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SellLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    const username = localStorage.getItem("username");

    if (!token || !username) {
      router.replace("/login");
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-black text-white">
      {children}
    </div>
  );
}