"use client";

import Link from "next/link";
import {
  LayoutDashboard,
  ArrowDownCircle,
  ArrowUpCircle,
  CheckSquare,
  Wallet,
  Users,
  LogOut,
} from "lucide-react";

export default function Sidebar() {
  return (
    <aside className="w-64 min-h-screen bg-black border-r border-yellow-500/30 p-5">
      <h1 className="text-3xl font-bold text-yellow-400 mb-10">
        GoldTrade
      </h1>

      <nav className="space-y-3">
        <Link href="/dashboard" className="flex items-center gap-3 p-3 rounded-xl hover:bg-yellow-500 hover:text-black transition">
          <LayoutDashboard size={20} />
          Dashboard
        </Link>

        <Link href="/deposit" className="flex items-center gap-3 p-3 rounded-xl hover:bg-yellow-500 hover:text-black transition">
          <ArrowDownCircle size={20} />
          Deposit
        </Link>

        <Link href="/withdraw" className="flex items-center gap-3 p-3 rounded-xl hover:bg-yellow-500 hover:text-black transition">
          <ArrowUpCircle size={20} />
          Withdraw
        </Link>

        <Link href="/tasks" className="flex items-center gap-3 p-3 rounded-xl hover:bg-yellow-500 hover:text-black transition">
          <CheckSquare size={20} />
          Daily Tasks
        </Link>

        <Link href="/wallet" className="flex items-center gap-3 p-3 rounded-xl hover:bg-yellow-500 hover:text-black transition">
          <Wallet size={20} />
          Wallet
        </Link>

        <Link href="/referral" className="flex items-center gap-3 p-3 rounded-xl hover:bg-yellow-500 hover:text-black transition">
          <Users size={20} />
          Referral
        </Link>
      </nav>

      <button className="mt-12 w-full border border-red-500 text-red-400 py-3 rounded-xl hover:bg-red-500 hover:text-white transition flex justify-center items-center gap-2">
        <LogOut size={18} />
        Logout
      </button>
    </aside>
  );
}