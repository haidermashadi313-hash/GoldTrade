"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Wallet,
  DollarSign,
  Coins,
  ArrowDownLeft,
  ArrowUpRight,
  Users,
  Settings,
  Receipt,
  LogOut,
  ShieldCheck,
  Bell,
} from "lucide-react";
const usdtMenu = [
  {
    title: "USDT Settings",
    href: "/admin/usdt-settings",
    icon: Wallet,
    color: "text-cyan-400",
  },

  {
    title: "USDT Orders",
    href: "/admin/usdt-orders",
    icon: DollarSign,
    color: "text-blue-400",
  },
];

// The above block seems to be redundant and can be removed as it duplicates the usdtMenu array.


// Backend API (Production + Local Development)
const API =
  process.env.NEXT_PUBLIC_API_URL || "https://https://goldtrade-cky2.onrender.com";

const menu = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "Users Manager", href: "/admin/users", icon: Users },
  { name: "Deposit Manager", href: "/admin/deposit", icon: ArrowDownLeft },
  { name: "Withdraw Manager", href: "/admin/withdraw", icon: ArrowUpRight },
  { name: "Usdt Manager", href: "/admin/Usdt", icon: DollarSign },
  { name: "Transactions", href: "/admin/transactions", icon: Receipt },
  { name: "Live Gold Market", href: "/admin/gold-market", icon: Coins },
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
      const res = await fetch(`${API}/api/gold/admin/stats`);
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
        {/* ================================================= */}
{/* USDT QUICK ACTIONS */}
{/* Paste after Gold Quick Actions */}
{/* ================================================= */}

<Link
  href="/admin/usdt-settings"
  className="group bg-zinc-900 hover:bg-cyan-500/10 border border-cyan-500 rounded-2xl p-5 transition-all duration-300"
>
  <div className="flex items-center justify-between mb-4">
    <Wallet className="text-cyan-400 group-hover:scale-110 transition-transform" size={30} />
    <ArrowUpRight className="text-cyan-400" size={18} />
  </div>

  <h3 className="text-lg font-black text-cyan-400">
    USDT Settings
  </h3>

  <p className="text-sm text-gray-400 mt-2">
    Manage Buy/Sell rates, market status and trading limits.
  </p>
</Link>

<Link
  href="/admin/usdt-orders"
  className="group bg-zinc-900 hover:bg-blue-500/10 border border-blue-500 rounded-2xl p-5 transition-all duration-300"
>
  <div className="flex items-center justify-between mb-4">
    <DollarSign className="text-blue-400 group-hover:scale-110 transition-transform" size={30} />
    <ArrowUpRight className="text-blue-400" size={18} />
  </div>

  <h3 className="text-lg font-black text-blue-400">
    USDT Orders
  </h3>

  <p className="text-sm text-gray-400 mt-2">
    View all Buy/Sell USDT orders with enterprise audit history.
  </p>
</Link>

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
            Administrator 鈥?Online
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


