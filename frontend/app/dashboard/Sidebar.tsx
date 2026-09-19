"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Wallet,
  Coins,
  ArrowDownToLine,
  ArrowUpFromLine,
  Repeat,
  History,
  User,
  Settings,
  LogOut,
} from "lucide-react";

export default function Sidebar() {
  const pathname = usePathname();

  const menuItems = [
    { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { title: "Wallet", href: "/wallet", icon: Wallet },
    { title: "Gold Trading", href: "/gold", icon: Coins },
    { title: "USDT Trading", href: "/usdt", icon: Repeat },
    { title: "Deposit", href: "/deposit", icon: ArrowDownToLine },
    { title: "Withdraw", href: "/withdraw", icon: ArrowUpFromLine },
    { title: "Transactions", href: "/transactions", icon: History },
    { title: "Profile", href: "/profile", icon: User },
    { title: "Settings", href: "/settings", icon: Settings },
  ];

  const logout = () => {
    localStorage.clear();
    window.location.href = "/login";
  };

  return (
    <aside className="w-64 min-h-screen bg-zinc-950 border-r border-yellow-500 p-5">
      <h1 className="text-2xl font-bold text-yellow-400 mb-8">
        GoldTrade V18
      </h1>

      <nav className="space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                active
                  ? "bg-yellow-500 text-black font-semibold"
                  : "text-gray-300 hover:bg-zinc-800 hover:text-yellow-400"
              }`}
            >
              <Icon size={20} />
              <span>{item.title}</span>
            </Link>
          );
        })}
      </nav>

      <button
        onClick={logout}
        className="mt-10 w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl transition"
      >
        <LogOut size={20} />
        Logout
      </button>
    </aside>
  );
}


