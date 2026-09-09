"use client";

import Link from "next/link";
import {
  LayoutDashboard,
  Wallet,
  ArrowDownCircle,
  ArrowUpCircle,
  CheckSquare,
  Users,
  LogOut,
} from "lucide-react";

export default function Sidebar() {
  const menu = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Deposit", href: "/deposit", icon: ArrowDownCircle },
    { name: "Withdraw", href: "/withdraw", icon: ArrowUpCircle },
    { name: "Daily Tasks", href: "/tasks", icon: CheckSquare },
    { name: "Wallet", href: "/wallet", icon: Wallet },
    { name: "Referral", href: "/referral", icon: Users },
  ];

  return (
    <aside className="w-64 min-h-screen bg-[#0B0B0B] border-r border-yellow-500/30 p-5">
      <h1 className="text-2xl font-bold text-yellow-400 mb-8">
        GoldTrade
      </h1>

      <div className="space-y-2">
        {menu.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            className="flex items-center gap-3 p-3 rounded-xl hover:bg-yellow-500 hover:text-black transition"
          >
            <item.icon size={20} />
            {item.name}
          </Link>
        ))}
      </div>

      <button className="mt-10 w-full border border-red-500 text-red-400 py-3 rounded-xl hover:bg-red-500 hover:text-white transition">
        <LogOut className="inline mr-2" size={18} />
        Logout
      </button>
    </aside>
  );
}