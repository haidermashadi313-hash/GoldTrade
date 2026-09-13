"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Users,
  ArrowDownCircle,
  ArrowUpCircle,
  History,
  Settings,
  LogOut,
  ShieldCheck,
  CircleDollarSign,
  TrendingUp,
  Bell,
} from "lucide-react";

const API = "http://localhost:5000";

const menu = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "Users Manager", href: "/admin/users", icon: Users },
  { name: "Deposit Manager", href: "/admin/deposit", icon: ArrowDownCircle },
  { name: "Withdraw Manager", href: "/admin/withdraw", icon: ArrowUpCircle },
  { name: "USDT Manager", href: "/admin/usdt", icon: CircleDollarSign },
  { name: "Transactions", href: "/admin/transactions", icon: History },
  { name: "Live Gold Market", href: "/admin/gold-market", icon: TrendingUp },
  { name: "Settings", href: "/admin/settings", icon: Settings },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  const [adminName, setAdminName] = useState("Administrator");
  const [pendingDeposits, setPendingDeposits] = useState(0);
  const [pendingWithdraws, setPendingWithdraws] = useState(0);

  useEffect(() => {
    const username = localStorage.getItem("username");
    const role = localStorage.getItem("role");
    const token = localStorage.getItem("token");

    if (!token) {
      window.location.href = "/login";
      return;
    }

    if (role !== "admin") {
      window.location.href = "/dashboard";
      return;
    }

    if (username) setAdminName(username);

    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      const res = await fetch(`${API}/api/admin/stats`);
      const data = await res.json();

      if (data.success) {
        setPendingDeposits(data.data.pendingDeposits || 0);
        setPendingWithdraws(data.data.pendingWithdraws || 0);
      }
    } catch (err) {
      console.log(err);
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    localStorage.removeItem("role");

    window.location.href = "/login";
  };

  return (
    <aside className="w-72 bg-zinc-950 border-r border-yellow-500 min-h-screen flex flex-col justify-between">

      {/* ================= Logo ================= */}
      <div>

        <div className="p-6 border-b border-yellow-500">
          <div className="flex items-center gap-3">
            <ShieldCheck className="text-yellow-400" size={34} />

            <div>
              <h1 className="text-yellow-400 text-2xl font-bold">
                GoldTrade
              </h1>

              <p className="text-gray-400 text-sm">
                Admin Manager V2 FINAL
              </p>
            </div>
          </div>
        </div>

        {/* Notification */}
        <div className="mx-4 mt-5 bg-yellow-500/10 border border-yellow-500 rounded-2xl p-4">

          <div className="flex items-center gap-2 text-yellow-400 mb-2">
            <Bell size={18}/>
            <span className="font-semibold">Pending Requests</span>
          </div>

          <div className="space-y-2 text-sm">

            <div className="flex justify-between">
              <span className="text-gray-400">Deposits</span>

              <span className="bg-yellow-500 text-black px-2 rounded-full font-bold">
                {pendingDeposits}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-400">Withdraws</span>

              <span className="bg-red-500 text-white px-2 rounded-full font-bold">
                {pendingWithdraws}
              </span>
            </div>

          </div>

        </div>

        {/* ================= Menu ================= */}
        <nav className="px-4 py-6 space-y-2">

          {menu.map((item) => {
            const Icon = item.icon;

            const active =
              pathname === item.href ||
              pathname.startsWith(item.href + "/");

            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center justify-between px-4 py-3 rounded-2xl transition-all font-semibold ${
                  active
                    ? "bg-yellow-500 text-black shadow-lg"
                    : "text-gray-300 hover:bg-yellow-500/10 hover:text-yellow-400"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon size={20}/>
                  {item.name}
                </div>

                {/* Badge */}
                {item.name === "Deposit Manager" &&
                  pendingDeposits > 0 && (
                    <span className="bg-red-600 text-white text-xs px-2 py-1 rounded-full">
                      {pendingDeposits}
                    </span>
                  )}

                {item.name === "Withdraw Manager" &&
                  pendingWithdraws > 0 && (
                    <span className="bg-red-600 text-white text-xs px-2 py-1 rounded-full">
                      {pendingWithdraws}
                    </span>
                  )}
              </Link>
            );
          })}

        </nav>

      </div>

      {/* ================= Footer ================= */}
      <div className="border-t border-yellow-500 p-5">

        <div className="bg-zinc-900 rounded-2xl p-4 border border-yellow-500 mb-4">
          <p className="text-gray-400 text-sm">Logged in as</p>

          <h3 className="text-yellow-400 font-bold text-lg">
            {adminName}
          </h3>

          <p className="text-xs text-green-400 mt-1">
            Administrator • Online
          </p>
        </div>

        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-3 bg-red-600 hover:bg-red-500 py-3 rounded-2xl font-bold transition"
        >
          <LogOut size={20}/>
          Logout
        </button>

        <p className="text-center text-gray-500 text-xs mt-4">
          GoldTrade Pakistan V2 FINAL
        </p>

      </div>

    </aside>
  );
}