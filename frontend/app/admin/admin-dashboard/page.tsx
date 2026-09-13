"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import Link from "next/link";
import {
  Users,
  Wallet,
  ArrowDownCircle,
  ArrowUpCircle,
  Coins,
  DollarSign,
  ShieldCheck,
  Settings,
  Bell,
  Activity,
} from "lucide-react";

const API =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    pendingDeposits: 0,
    pendingWithdrawals: 0,
    goldTradesToday: 0,
    walletBalance: 0,
    usdtVolume: 0,
  });

  const [loading, setLoading] = useState(true);

  const fetchDashboard = async () => {
    try {
      const res = await axios.get(`${API}/api/admin/dashboard`);

      if (res.data.success) {
        setStats(res.data.stats);
      }
    } catch (error) {
      console.error("Dashboard Error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <h1 className="text-yellow-400 text-3xl font-black">
          Loading Admin Dashboard...
        </h1>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white flex">

      {/* ============================= */}
      {/* LEFT SIDEBAR */}
      {/* ============================= */}

      <aside className="w-72 bg-black border-r border-zinc-800 p-6">

        <h1 className="text-3xl font-black text-yellow-400 mb-10">
          GOLDTRADE V17
        </h1>

        <p className="text-gray-500 mb-8 text-sm">
          Enterprise Admin Panel
        </p>

        <nav className="space-y-3">

          <Link href="/admin/admin-dashboard">
            <div className="bg-yellow-500 text-black rounded-xl px-4 py-3 font-bold">
              📊 Dashboard
            </div>
          </Link>

          <Link href="/admin/users">
            <div className="hover:bg-zinc-900 rounded-xl px-4 py-3">
              👥 Users
            </div>
          </Link>

          <Link href="/admin/deposits">
            <div className="hover:bg-zinc-900 rounded-xl px-4 py-3">
              💰 Deposit Management
            </div>
          </Link>

          <Link href="/admin/withdrawals">
            <div className="hover:bg-zinc-900 rounded-xl px-4 py-3">
              🏧 Withdraw Management
            </div>
          </Link>

          <Link href="/admin/gold">
            <div className="hover:bg-zinc-900 rounded-xl px-4 py-3">
              🪙 Gold Management
            </div>
          </Link>

          <Link href="/admin/usdt">
            <div className="hover:bg-zinc-900 rounded-xl px-4 py-3">
              ₮ USDT Exchange
            </div>
          </Link>

          <Link href="/admin/settings">
            <div className="hover:bg-zinc-900 rounded-xl px-4 py-3">
              ⚙ Payment Settings
            </div>
          </Link>

        </nav>

      </aside>

      {/* ============================= */}
      {/* MAIN CONTENT */}
      {/* ============================= */}

      <main className="flex-1 p-8">

        {/* Header */}

        <div className="flex justify-between items-center flex-wrap gap-4 mb-10">

          <div>
            <h2 className="text-5xl font-black text-yellow-400">
              ADMIN DASHBOARD
            </h2>

            <p className="text-gray-400 mt-2">
              GoldTrade Enterprise Control Center
            </p>
          </div>

          <div className="flex gap-4">

            <button className="bg-zinc-900 border border-zinc-700 p-3 rounded-xl">
              <Bell className="w-5 h-5 text-yellow-400" />
            </button>

            <button className="bg-zinc-900 border border-zinc-700 p-3 rounded-xl">
              <Settings className="w-5 h-5 text-cyan-400" />
            </button>

          </div>

        </div>

        {/* Statistics Cards */}

        <div className="grid grid-cols-2 xl:grid-cols-3 gap-6">

          <div className="bg-zinc-900 border border-blue-500 rounded-3xl p-6">
            <Users className="text-blue-400 w-10 h-10 mb-4" />

            <p className="text-gray-400">Total Users</p>

            <h2 className="text-4xl font-black text-blue-400 mt-2">
              0
            </h2>
          </div>

          <div className="bg-zinc-900 border border-yellow-500 rounded-3xl p-6">
            <ArrowDownCircle className="text-yellow-400 w-10 h-10 mb-4" />

            <p className="text-gray-400">Pending Deposits</p>

            <h2 className="text-4xl font-black text-yellow-400 mt-2">
              0
            </h2>
          </div>

          <div className="bg-zinc-900 border border-red-500 rounded-3xl p-6">
            <ArrowUpCircle className="text-red-400 w-10 h-10 mb-4" />

            <p className="text-gray-400">Pending Withdrawals</p>

            <h2 className="text-4xl font-black text-red-400 mt-2">
              0
            </h2>
          </div>

          <div className="bg-zinc-900 border border-green-500 rounded-3xl p-6">
            <Coins className="text-green-400 w-10 h-10 mb-4" />

            <p className="text-gray-400">Gold Trades Today</p>

            <h2 className="text-4xl font-black text-green-400 mt-2">
              0
            </h2>
          </div>

          <div className="bg-zinc-900 border border-cyan-500 rounded-3xl p-6">
            <DollarSign className="text-cyan-400 w-10 h-10 mb-4" />

            <p className="text-gray-400">USDT Exchange Volume</p>

            <h2 className="text-4xl font-black text-cyan-400 mt-2">
              0 USDT
            </h2>
          </div>

          <div className="bg-zinc-900 border border-purple-500 rounded-3xl p-6">
            <Wallet className="text-purple-400 w-10 h-10 mb-4" />

            <p className="text-gray-400">Wallet Balance</p>

            <h2 className="text-4xl font-black text-purple-400 mt-2">
              PKR 0
            </h2>
          </div>

        </div>  
         {/* ============================================= */}
         {/* QUICK MANAGEMENT MODULES */}
         {/* ============================================= */}

        <div className="mt-10">

          <h2 className="text-3xl font-black text-yellow-400 mb-6">
            Quick Management
          </h2>

          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">

            {/* Deposit Management */}
            <Link href="/admin/deposits">
              <div className="bg-zinc-900 hover:bg-zinc-800 transition rounded-3xl border border-yellow-500 p-6 cursor-pointer">

                <div className="text-5xl mb-4">💰</div>

                <h3 className="text-2xl font-black text-yellow-400">
                  Deposit Management
                </h3>

                <p className="text-gray-400 mt-2">
                  Review pending deposits, approve or reject requests and verify receipts.
                </p>

              </div>
            </Link>

            {/* Withdraw Management */}
            <Link href="/admin/withdrawals">
              <div className="bg-zinc-900 hover:bg-zinc-800 transition rounded-3xl border border-red-500 p-6 cursor-pointer">

                <div className="text-5xl mb-4">🏧</div>

                <h3 className="text-2xl font-black text-red-400">
                  Withdraw Management
                </h3>

                <p className="text-gray-400 mt-2">
                  Approve or reject user withdrawal requests securely.
                </p>

              </div>
            </Link>

            {/* Gold Management */}
            <Link href="/admin/gold">
              <div className="bg-zinc-900 hover:bg-zinc-800 transition rounded-3xl border border-green-500 p-6 cursor-pointer">

                <div className="text-5xl mb-4">🪙</div>

                <h3 className="text-2xl font-black text-green-400">
                  Gold Management
                </h3>

                <p className="text-gray-400 mt-2">
                  Update buy price, sell price and trading status.
                </p>

              </div>
            </Link>

            {/* USDT Management */}
            <Link href="/admin/usdt">
              <div className="bg-zinc-900 hover:bg-zinc-800 transition rounded-3xl border border-cyan-500 p-6 cursor-pointer">

                <div className="text-5xl mb-4">₮</div>

                <h3 className="text-2xl font-black text-cyan-400">
                  USDT Exchange
                </h3>

                <p className="text-gray-400 mt-2">
                  Manage USDT exchange rate, wallets and exchange history.
                </p>

              </div>
            </Link>

            {/* User Management */}
            <Link href="/admin/users">
              <div className="bg-zinc-900 hover:bg-zinc-800 transition rounded-3xl border border-blue-500 p-6 cursor-pointer">

                <div className="text-5xl mb-4">👥</div>

                <h3 className="text-2xl font-black text-blue-400">
                  User Management
                </h3>

                <p className="text-gray-400 mt-2">
                  Search users, manage wallets and account status.
                </p>

              </div>
            </Link>

            {/* Payment Settings */}
            <Link href="/admin/settings">
              <div className="bg-zinc-900 hover:bg-zinc-800 transition rounded-3xl border border-purple-500 p-6 cursor-pointer">

                <div className="text-5xl mb-4">⚙️</div>

                <h3 className="text-2xl font-black text-purple-400">
                  Payment Settings
                </h3>

                <p className="text-gray-400 mt-2">
                  Configure Bank, EasyPaisa, NayaPay and USDT TRC20 payment methods.
                </p>

              </div>
            </Link>

          </div>

        </div>

        {/* ============================================= */}
        {/* LIVE SYSTEM STATUS */}
        {/* ============================================= */}

        <div className="mt-12 bg-zinc-900 border border-zinc-700 rounded-3xl p-8">

          <div className="flex justify-between items-center mb-6 flex-wrap gap-3">

            <h2 className="text-3xl font-black text-cyan-400">
              Live System Status
            </h2>

            <div className="flex items-center gap-2 text-green-400 font-semibold">
              <Activity className="w-5 h-5" />
              ONLINE
            </div>

          </div>

          <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-5">

            <div className="bg-black rounded-2xl border border-zinc-700 p-5">
              <p className="text-gray-500 text-sm">Backend API</p>

              <h3 className="text-xl font-black text-green-400 mt-2">
                Connected
              </h3>
            </div>

            <div className="bg-black rounded-2xl border border-zinc-700 p-5">
              <p className="text-gray-500 text-sm">MongoDB</p>

              <h3 className="text-xl font-black text-green-400 mt-2">
                Connected
              </h3>
            </div>

            <div className="bg-black rounded-2xl border border-zinc-700 p-5">
              <p className="text-gray-500 text-sm">Trading Engine</p>

              <h3 className="text-xl font-black text-yellow-400 mt-2">
                ACTIVE
              </h3>
            </div>

            <div className="bg-black rounded-2xl border border-zinc-700 p-5">
              <p className="text-gray-500 text-sm">Server</p>

              <h3 className="text-xl font-black text-cyan-400 mt-2">
                localhost:5000
              </h3>
            </div>

          </div>

        </div>

        {/* ============================================= */}
        {/* PENDING DEPOSITS PREVIEW */}
        {/* ============================================= */}

        <div className="mt-12 bg-zinc-900 border border-yellow-500 rounded-3xl p-8">

          <div className="flex justify-between items-center mb-6">

            <h2 className="text-3xl font-black text-yellow-400">
              Pending Deposits
            </h2>

            <Link href="/admin/deposits">
              <button className="bg-yellow-500 hover:bg-yellow-400 text-black font-bold px-4 py-2 rounded-lg transition">
                View All
              </button>
            </Link>

          </div>

          <div className="overflow-x-auto">

            <table className="w-full">

              <thead className="bg-black text-yellow-400 uppercase text-sm">
                <tr>
                  <th className="px-4 py-3 text-left">Username</th>
                  <th className="px-4 py-3 text-left">Method</th>
                  <th className="px-4 py-3 text-left">Amount</th>
                  <th className="px-4 py-3 text-left">Status</th>
                </tr>
              </thead>

              <tbody>

                <tr className="border-b border-zinc-700">
                  <td className="px-4 py-4 text-gray-300">No pending deposits</td>
                  <td className="px-4 py-4 text-gray-500">-</td>
                  <td className="px-4 py-4 text-gray-500">PKR 0</td>
                  <td className="px-4 py-4">
                    <span className="bg-zinc-700 text-gray-300 px-3 py-1 rounded-full text-xs">
                      Empty
                    </span>
                  </td>
                </tr>

              </tbody>

            </table>

          </div>

        </div>        {/* ============================================= */}
        {/* RECENT USERS */}
        {/* ============================================= */}

        <div className="mt-12 bg-zinc-900 border border-blue-500 rounded-3xl p-8">

          <div className="flex justify-between items-center mb-6">

            <h2 className="text-3xl font-black text-blue-400">
              Recent Users
            </h2>

            <Link href="/admin/users">
              <button className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-bold transition">
                View All Users
              </button>
            </Link>

          </div>

          <div className="overflow-x-auto">

            <table className="w-full">

              <thead className="bg-black text-blue-400 uppercase text-sm">
                <tr>
                  <th className="px-4 py-3 text-left">Username</th>
                  <th className="px-4 py-3 text-left">Wallet</th>
                  <th className="px-4 py-3 text-left">Gold Balance</th>
                  <th className="px-4 py-3 text-left">Status</th>
                </tr>
              </thead>

              <tbody>

                <tr className="border-b border-zinc-700 hover:bg-zinc-800">
                  <td className="px-4 py-4 font-semibold text-white">
                    hashi90
                  </td>

                  <td className="px-4 py-4 text-green-400">
                    PKR 0
                  </td>

                  <td className="px-4 py-4 text-yellow-400">
                    0.000 g
                  </td>

                  <td className="px-4 py-4">
                    <span className="bg-green-600 text-white px-3 py-1 rounded-full text-xs font-bold">
                      ACTIVE
                    </span>
                  </td>
                </tr>

              </tbody>

            </table>

          </div>

        </div>

        {/* ============================================= */}
        {/* RECENT GOLD TRADES */}
        {/* ============================================= */}

        <div className="mt-12 bg-zinc-900 border border-green-500 rounded-3xl p-8">

          <div className="flex justify-between items-center mb-6">

            <h2 className="text-3xl font-black text-green-400">
              Recent Gold Trades
            </h2>

            <Link href="/admin/gold">
              <button className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg font-bold transition">
                View All Trades
              </button>
            </Link>

          </div>

          <div className="overflow-x-auto">

            <table className="w-full">

              <thead className="bg-black text-green-400 uppercase text-sm">
                <tr>
                  <th className="px-4 py-3 text-left">User</th>
                  <th className="px-4 py-3 text-left">Type</th>
                  <th className="px-4 py-3 text-left">Grams</th>
                  <th className="px-4 py-3 text-left">Price</th>
                  <th className="px-4 py-3 text-left">Amount</th>
                </tr>
              </thead>

              <tbody>

                <tr className="border-b border-zinc-700">
                  <td className="px-4 py-4 text-gray-300">
                    No Gold Trades Yet
                  </td>

                  <td className="px-4 py-4 text-gray-500">-</td>
                  <td className="px-4 py-4 text-gray-500">0 g</td>
                  <td className="px-4 py-4 text-gray-500">PKR 0</td>
                  <td className="px-4 py-4 text-gray-500">PKR 0</td>
                </tr>

              </tbody>

            </table>

          </div>

        </div>

        {/* ============================================= */}
        {/* PENDING WITHDRAWALS */}
        {/* ============================================= */}

        <div className="mt-12 bg-zinc-900 border border-red-500 rounded-3xl p-8">

          <div className="flex justify-between items-center mb-6">

            <h2 className="text-3xl font-black text-red-400">
              Pending Withdrawals
            </h2>

            <Link href="/admin/withdrawals">
              <button className="bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-lg font-bold transition">
                View All
              </button>
            </Link>

          </div>

          <div className="overflow-x-auto">

            <table className="w-full">

              <thead className="bg-black text-red-400 uppercase text-sm">
                <tr>
                  <th className="px-4 py-3 text-left">Username</th>
                  <th className="px-4 py-3 text-left">Method</th>
                  <th className="px-4 py-3 text-left">Amount</th>
                  <th className="px-4 py-3 text-left">Status</th>
                </tr>
              </thead>

              <tbody>

                <tr className="border-b border-zinc-700">
                  <td className="px-4 py-4 text-gray-300">
                    No Withdrawal Requests
                  </td>

                  <td className="px-4 py-4 text-gray-500">-</td>
                  <td className="px-4 py-4 text-gray-500">PKR 0</td>
                  <td className="px-4 py-4">
                    <span className="bg-zinc-700 text-gray-300 px-3 py-1 rounded-full text-xs">
                      Empty
                    </span>
                  </td>
                </tr>

              </tbody>

            </table>

          </div>

        </div>        {/* ============================================= */}
        {/* FINANCE OVERVIEW */}
        {/* ============================================= */}

        <div className="mt-12">

          <h2 className="text-3xl font-black text-yellow-400 mb-6">
            Finance Overview
          </h2>

          <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-6">

            {/* Total Deposits */}
            <div className="bg-zinc-900 border border-green-500 rounded-3xl p-6">
              <div className="text-4xl mb-3">💰</div>

              <p className="text-gray-400 text-sm">
                Total Deposits
              </p>

              <h3 className="text-3xl font-black text-green-400 mt-2">
                PKR 0
              </h3>

              <p className="text-xs text-gray-500 mt-2">
                Approved deposits only.
              </p>
            </div>

            {/* Total Withdraw */}
            <div className="bg-zinc-900 border border-red-500 rounded-3xl p-6">
              <div className="text-4xl mb-3">🏧</div>

              <p className="text-gray-400 text-sm">
                Total Withdrawals
              </p>

              <h3 className="text-3xl font-black text-red-400 mt-2">
                PKR 0
              </h3>

              <p className="text-xs text-gray-500 mt-2">
                Completed withdrawals.
              </p>
            </div>

            {/* Gold Holdings */}
            <div className="bg-zinc-900 border border-yellow-500 rounded-3xl p-6">
              <div className="text-4xl mb-3">🪙</div>

              <p className="text-gray-400 text-sm">
                Platform Gold Holdings
              </p>

              <h3 className="text-3xl font-black text-yellow-400 mt-2">
                0.000 g
              </h3>

              <p className="text-xs text-gray-500 mt-2">
                Total user gold balance.
              </p>
            </div>

            {/* USDT Holdings */}
            <div className="bg-zinc-900 border border-cyan-500 rounded-3xl p-6">
              <div className="text-4xl mb-3">₮</div>

              <p className="text-gray-400 text-sm">
                Platform USDT Balance
              </p>

              <h3 className="text-3xl font-black text-cyan-400 mt-2">
                0 USDT
              </h3>

              <p className="text-xs text-gray-500 mt-2">
                Company USDT Wallet Balance.
              </p>
            </div>

          </div>

        </div>

        {/* ============================================= */}
        {/* LIVE ACTIVITY FEED */}
        {/* ============================================= */}

        <div className="mt-12 bg-zinc-900 border border-cyan-500 rounded-3xl p-8">

          <div className="flex justify-between items-center mb-6">

            <h2 className="text-3xl font-black text-cyan-400">
              Live Activity Feed
            </h2>

            <span className="bg-green-600 text-white text-xs font-bold px-3 py-1 rounded-full">
              LIVE
            </span>

          </div>

          <div className="space-y-4">

            <div className="flex items-center justify-between bg-black rounded-xl p-4 border border-zinc-700">

              <div>
                <p className="text-white font-semibold">
                  User Registration
                </p>

                <p className="text-gray-500 text-sm">
                  New users will appear here.
                </p>
              </div>

              <span className="text-green-400 text-sm">
                Waiting...
              </span>

            </div>

            <div className="flex items-center justify-between bg-black rounded-xl p-4 border border-zinc-700">

              <div>
                <p className="text-white font-semibold">
                  Deposit Activity
                </p>

                <p className="text-gray-500 text-sm">
                  Pending / Approved deposit updates.
                </p>
              </div>

              <span className="text-yellow-400 text-sm">
                Waiting...
              </span>

            </div>

            <div className="flex items-center justify-between bg-black rounded-xl p-4 border border-zinc-700">

              <div>
                <p className="text-white font-semibold">
                  Gold Trading Activity
                </p>

                <p className="text-gray-500 text-sm">
                  BUY / SELL trades will appear here.
                </p>
              </div>

              <span className="text-blue-400 text-sm">
                Waiting...
              </span>

            </div>

            <div className="flex items-center justify-between bg-black rounded-xl p-4 border border-zinc-700">

              <div>
                <p className="text-white font-semibold">
                  Withdraw Activity
                </p>

                <p className="text-gray-500 text-sm">
                  Withdraw approvals will appear here.
                </p>
              </div>

              <span className="text-red-400 text-sm">
                Waiting...
              </span>

            </div>

          </div>

        </div>

        {/* ============================================= */}
        {/* SYSTEM HEALTH MONITOR */}
        {/* ============================================= */}

        <div className="mt-12 bg-zinc-900 border border-green-500 rounded-3xl p-8">

          <h2 className="text-3xl font-black text-green-400 mb-6">
            System Health Monitor
          </h2>

          <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-5">

            <div className="bg-black rounded-2xl border border-zinc-700 p-5">
              <p className="text-gray-500 text-sm">
                Backend API
              </p>

              <h3 className="text-xl font-black text-green-400 mt-2">
                ONLINE
              </h3>

              <div className="w-full bg-zinc-800 rounded-full h-2 mt-4">
                <div className="bg-green-500 h-2 rounded-full w-full"></div>
              </div>

            </div>

            <div className="bg-black rounded-2xl border border-zinc-700 p-5">
              <p className="text-gray-500 text-sm">
                MongoDB
              </p>

              <h3 className="text-xl font-black text-green-400 mt-2">
                CONNECTED
              </h3>

              <div className="w-full bg-zinc-800 rounded-full h-2 mt-4">
                <div className="bg-green-500 h-2 rounded-full w-full"></div>
              </div>

            </div>

            <div className="bg-black rounded-2xl border border-zinc-700 p-5">
              <p className="text-gray-500 text-sm">
                Gold Trading Engine
              </p>

              <h3 className="text-xl font-black text-yellow-400 mt-2">
                ACTIVE
              </h3>

              <div className="w-full bg-zinc-800 rounded-full h-2 mt-4">
                <div className="bg-yellow-400 h-2 rounded-full w-full"></div>
              </div>

            </div>

            <div className="bg-black rounded-2xl border border-zinc-700 p-5">
              <p className="text-gray-500 text-sm">
                Wallet Service
              </p>

              <h3 className="text-xl font-black text-cyan-400 mt-2">
                RUNNING
              </h3>

              <div className="w-full bg-zinc-800 rounded-full h-2 mt-4">
                <div className="bg-cyan-400 h-2 rounded-full w-full"></div>
              </div>

            </div>

          </div>

        </div>

        {/* ============================================= */}
        {/* SECURITY STATUS */}
        {/* ============================================= */}

        <div className="mt-12 bg-zinc-900 border border-purple-500 rounded-3xl p-8">

          <div className="flex items-center gap-4 mb-6">

            <div className="bg-purple-600 rounded-full p-4">
              <ShieldCheck className="w-10 h-10 text-white" />
            </div>

            <div>
              <h2 className="text-3xl font-black text-purple-400">
                Security Status
              </h2>

              <p className="text-gray-400">
                Enterprise security monitoring.
              </p>
            </div>

          </div>

          <div className="grid md:grid-cols-2 gap-5">

            <div className="bg-black rounded-xl p-5 border border-zinc-700 flex justify-between items-center">
              <span>JWT Authentication</span>

              <span className="text-green-400 font-bold">
                ENABLED
              </span>
            </div>

            <div className="bg-black rounded-xl p-5 border border-zinc-700 flex justify-between items-center">
              <span>Password Encryption</span>

              <span className="text-green-400 font-bold">
                ENABLED
              </span>
            </div>

            <div className="bg-black rounded-xl p-5 border border-zinc-700 flex justify-between items-center">
              <span>Admin Route Protection</span>

              <span className="text-green-400 font-bold">
                ACTIVE
              </span>
            </div>

            <div className="bg-black rounded-xl p-5 border border-zinc-700 flex justify-between items-center">
              <span>Database Connection</span>

              <span className="text-green-400 font-bold">
                SECURE
              </span>
            </div>

          </div>

        </div>        {/* ============================================= */}
        {/* PAYMENT SETTINGS PREVIEW */}
        {/* ============================================= */}

        <div className="mt-12 bg-zinc-900 border border-yellow-500 rounded-3xl p-8">

          <div className="flex justify-between items-center mb-8 flex-wrap gap-3">

            <div>
              <h2 className="text-3xl font-black text-yellow-400">
                Company Payment Settings
              </h2>

              <p className="text-gray-400 mt-2">
                Payment methods visible to users.
              </p>
            </div>

            <Link href="/admin/settings">
              <button className="bg-yellow-500 hover:bg-yellow-400 text-black font-bold px-5 py-3 rounded-xl transition">
                Manage Payment Settings
              </button>
            </Link>

          </div>

          <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-6">

            {/* BANK */}

            <div className="bg-black border border-green-500 rounded-2xl p-5">

              <div className="text-4xl mb-4">🏦</div>

              <h3 className="text-xl font-black text-green-400">
                Bank Transfer
              </h3>

              <p className="text-gray-400 text-sm mt-3">
                Meezan Bank
              </p>

              <p className="text-gray-500 text-xs mt-1">
                GoldTrade Pvt Ltd
              </p>

              <span className="mt-4 inline-block bg-green-600 text-white text-xs px-3 py-1 rounded-full">
                ACTIVE
              </span>

            </div>

            {/* EASYPAISA */}

            <div className="bg-black border border-green-400 rounded-2xl p-5">

              <div className="text-4xl mb-4">📱</div>

              <h3 className="text-xl font-black text-green-400">
                EasyPaisa
              </h3>

              <p className="text-gray-400 text-sm mt-3">
                0300-1234567
              </p>

              <p className="text-gray-500 text-xs mt-1">
                Company Wallet
              </p>

              <span className="mt-4 inline-block bg-green-600 text-white text-xs px-3 py-1 rounded-full">
                ACTIVE
              </span>

            </div>

            {/* NAYAPAY */}

            <div className="bg-black border border-cyan-500 rounded-2xl p-5">

              <div className="text-4xl mb-4">💙</div>

              <h3 className="text-xl font-black text-cyan-400">
                NayaPay
              </h3>

              <p className="text-gray-400 text-sm mt-3">
                0300-9876543
              </p>

              <p className="text-gray-500 text-xs mt-1">
                Company Wallet
              </p>

              <span className="mt-4 inline-block bg-cyan-500 text-black text-xs px-3 py-1 rounded-full">
                ACTIVE
              </span>

            </div>

            {/* USDT */}

            <div className="bg-black border border-teal-500 rounded-2xl p-5">

              <div className="text-4xl mb-4">₮</div>

              <h3 className="text-xl font-black text-teal-400">
                USDT TRC20
              </h3>

              <p className="text-gray-400 text-xs break-all mt-3">
                TQ8nxxxxxxxxxxxxxxxxxxxxxxxxxxxx
              </p>

              <p className="text-gray-500 text-xs mt-2">
                Tron Network Wallet
              </p>

              <span className="mt-4 inline-block bg-teal-600 text-white text-xs px-3 py-1 rounded-full">
                ACTIVE
              </span>

            </div>

          </div>

        </div>

        {/* ============================================= */}
        {/* GOLD MARKET CONTROL PANEL */}
        {/* ============================================= */}

        <div className="mt-12 bg-zinc-900 border border-green-500 rounded-3xl p-8">

          <div className="flex justify-between items-center mb-8 flex-wrap gap-3">

            <div>
              <h2 className="text-3xl font-black text-green-400">
                Gold Market Control
              </h2>

              <p className="text-gray-400 mt-2">
                Admin controls Buy & Sell Gold prices.
              </p>
            </div>

            <Link href="/admin/gold">
              <button className="bg-green-600 hover:bg-green-500 text-white px-5 py-3 rounded-xl font-bold transition">
                Open Gold Manager
              </button>
            </Link>

          </div>

          <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-6">

            <div className="bg-black rounded-2xl border border-green-500 p-5">
              <p className="text-gray-500 text-sm">Buy Gold Price</p>

              <h3 className="text-3xl font-black text-green-400 mt-2">
                PKR 31,250
              </h3>
            </div>

            <div className="bg-black rounded-2xl border border-red-500 p-5">
              <p className="text-gray-500 text-sm">Sell Gold Price</p>

              <h3 className="text-3xl font-black text-red-400 mt-2">
                PKR 30,980
              </h3>
            </div>

            <div className="bg-black rounded-2xl border border-yellow-500 p-5">
              <p className="text-gray-500 text-sm">Market Status</p>

              <h3 className="text-3xl font-black text-yellow-400 mt-2">
                OPEN
              </h3>
            </div>

            <div className="bg-black rounded-2xl border border-cyan-500 p-5">
              <p className="text-gray-500 text-sm">Trading Engine</p>

              <h3 className="text-3xl font-black text-cyan-400 mt-2">
                ENABLED
              </h3>
            </div>

          </div>

        </div>

        {/* ============================================= */}
        {/* USDT EXCHANGE CONTROL */}
        {/* ============================================= */}

        <div className="mt-12 bg-zinc-900 border border-cyan-500 rounded-3xl p-8">

          <div className="flex justify-between items-center mb-8 flex-wrap gap-3">

            <div>
              <h2 className="text-3xl font-black text-cyan-400">
                USDT Exchange Control
              </h2>

              <p className="text-gray-400 mt-2">
                Manage live USDT exchange rate and wallet.
              </p>
            </div>

            <Link href="/admin/usdt">
              <button className="bg-cyan-500 hover:bg-cyan-400 text-black px-5 py-3 rounded-xl font-bold transition">
                Open USDT Manager
              </button>
            </Link>

          </div>

          <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-6">

            <div className="bg-black rounded-2xl border border-cyan-500 p-5">
              <p className="text-gray-500 text-sm">USDT Rate</p>

              <h3 className="text-3xl font-black text-cyan-400 mt-2">
                PKR 285
              </h3>
            </div>

            <div className="bg-black rounded-2xl border border-teal-500 p-5">
              <p className="text-gray-500 text-sm">Network</p>

              <h3 className="text-3xl font-black text-teal-400 mt-2">
                TRC20
              </h3>
            </div>

            <div className="bg-black rounded-2xl border border-green-500 p-5">
              <p className="text-gray-500 text-sm">Wallet Status</p>

              <h3 className="text-3xl font-black text-green-400 mt-2">
                ACTIVE
              </h3>
            </div>

            <div className="bg-black rounded-2xl border border-purple-500 p-5">
              <p className="text-gray-500 text-sm">Exchange</p>

              <h3 className="text-3xl font-black text-purple-400 mt-2">
                ENABLED
              </h3>
            </div>

          </div>

        </div>

        {/* ============================================= */}
        {/* QR CODE MANAGEMENT PREVIEW */}
        {/* ============================================= */}

        <div className="mt-12 bg-zinc-900 border border-purple-500 rounded-3xl p-8">

          <div className="flex justify-between items-center mb-8 flex-wrap gap-3">

            <div>
              <h2 className="text-3xl font-black text-purple-400">
                QR Code Management
              </h2>

              <p className="text-gray-400 mt-2">
                Upload QR codes for all payment methods.
              </p>
            </div>

            <Link href="/admin/settings">
              <button className="bg-purple-600 hover:bg-purple-500 text-white px-5 py-3 rounded-xl font-bold transition">
                Upload QR Codes
              </button>
            </Link>

          </div>

          <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-6">

            {["Bank QR","EasyPaisa QR","NayaPay QR","USDT QR"].map((item) => (
              <div
                key={item}
                className="bg-black border border-zinc-700 rounded-2xl p-5 text-center"
              >
                <div className="w-full h-40 rounded-xl border-2 border-dashed border-zinc-600 flex items-center justify-center text-gray-500 text-sm mb-4">
                  QR Preview
                </div>

                <p className="font-bold text-white">{item}</p>

                <button className="mt-4 w-full bg-purple-600 hover:bg-purple-500 text-white py-2 rounded-lg font-semibold transition">
                  Upload QR
                </button>
              </div>
            ))}

          </div>

        </div>        {/* ============================================= */}
        {/* ANALYTICS DASHBOARD */}
        {/* ============================================= */}

        <div className="mt-12 bg-zinc-900 border border-blue-500 rounded-3xl p-8">

          <div className="flex justify-between items-center mb-8 flex-wrap gap-3">

            <div>
              <h2 className="text-3xl font-black text-blue-400">
                Platform Analytics
              </h2>

              <p className="text-gray-400 mt-2">
                Enterprise activity overview.
              </p>
            </div>

            <span className="bg-blue-600 text-white px-4 py-2 rounded-full text-sm font-bold">
              LIVE ANALYTICS
            </span>

          </div>

          <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-6">

            <div className="bg-black rounded-2xl border border-blue-500 p-5">
              <p className="text-gray-500 text-sm">Today's New Users</p>
              <h3 className="text-4xl font-black text-blue-400 mt-3">0</h3>
            </div>

            <div className="bg-black rounded-2xl border border-green-500 p-5">
              <p className="text-gray-500 text-sm">Today's Deposits</p>
              <h3 className="text-4xl font-black text-green-400 mt-3">PKR 0</h3>
            </div>

            <div className="bg-black rounded-2xl border border-yellow-500 p-5">
              <p className="text-gray-500 text-sm">Today's Gold Trades</p>
              <h3 className="text-4xl font-black text-yellow-400 mt-3">0</h3>
            </div>

            <div className="bg-black rounded-2xl border border-cyan-500 p-5">
              <p className="text-gray-500 text-sm">Today's USDT Exchange</p>
              <h3 className="text-4xl font-black text-cyan-400 mt-3">0 USDT</h3>
            </div>

          </div>

        </div>

        {/* ============================================= */}
        {/* RECENT ADMIN ACTIVITY */}
        {/* ============================================= */}

        <div className="mt-12 bg-zinc-900 border border-orange-500 rounded-3xl p-8">

          <h2 className="text-3xl font-black text-orange-400 mb-6">
            Recent Admin Activity
          </h2>

          <div className="space-y-4">

            {[
              "System started successfully.",
              "MongoDB connection established.",
              "Gold trading engine is active.",
              "Deposit approval module is ready.",
              "USDT exchange module connected."
            ].map((item, index) => (
              <div
                key={index}
                className="bg-black border border-zinc-700 rounded-xl p-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-green-400"></div>

                  <span className="text-gray-300">{item}</span>
                </div>

                <span className="text-xs text-gray-500">Just Now</span>
              </div>
            ))}

          </div>

        </div>

        {/* ============================================= */}
        {/* ENTERPRISE CONTROL CENTER */}
        {/* ============================================= */}

        <div className="mt-12 bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 rounded-3xl p-8 text-black">

          <h2 className="text-4xl font-black mb-4">
            GoldTrade V17 Enterprise
          </h2>

          <p className="font-semibold text-lg mb-6">
            Complete control center for Gold Trading, Wallets, Deposits,
            Withdrawals, USDT Exchange and User Management.
          </p>

          <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">

            {[
              "Deposit Approval",
              "Withdraw Approval",
              "Gold Price Control",
              "USDT Wallet Control",
              "Payment Settings",
              "User Wallet Manager",
              "Referral Manager",
              "Cashback Manager"
            ].map((module, index) => (
              <div
                key={index}
                className="bg-white rounded-xl p-4 text-black font-bold text-center shadow-lg"
              >
                {module}
              </div>
            ))}

          </div>

        </div>

        {/* ============================================= */}
        {/* QUICK ACTION BUTTONS */}
        {/* ============================================= */}

        <div className="mt-12">

          <h2 className="text-3xl font-black text-yellow-400 mb-6">
            Admin Quick Actions
          </h2>

          <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-5">

            <button className="bg-green-600 hover:bg-green-500 rounded-2xl p-5 font-black text-xl transition">
              Approve Deposits
            </button>

            <button className="bg-red-600 hover:bg-red-500 rounded-2xl p-5 font-black text-xl transition">
              Approve Withdrawals
            </button>

            <button className="bg-blue-600 hover:bg-blue-500 rounded-2xl p-5 font-black text-xl transition">
              Update Gold Prices
            </button>

            <button className="bg-cyan-600 hover:bg-cyan-500 rounded-2xl p-5 font-black text-xl transition">
              Update USDT Rate
            </button>

          </div>

        </div>

        {/* ============================================= */}
        {/* FOOTER */}
        {/* ============================================= */}

        <footer className="mt-16 border-t border-zinc-800 pt-8 pb-6">

          <div className="grid md:grid-cols-3 gap-6">

            <div>
              <h3 className="text-yellow-400 font-black text-xl mb-3">
                GOLDTRADE V17
              </h3>

              <p className="text-gray-400 text-sm">
                Enterprise Gold Trading Platform with Wallet, Deposit,
                Withdraw, Gold Trading and USDT Exchange.
              </p>
            </div>

            <div>
              <h3 className="text-cyan-400 font-black text-xl mb-3">
                Server Status
              </h3>

              <div className="space-y-2 text-sm text-gray-300">
                <p>Backend API : ONLINE</p>
                <p>MongoDB : CONNECTED</p>
                <p>Trading Engine : ACTIVE</p>
                <p>Wallet Service : RUNNING</p>
              </div>
            </div>

            <div>
              <h3 className="text-green-400 font-black text-xl mb-3">
                Version
              </h3>

              <div className="space-y-2 text-sm text-gray-300">
                <p>GoldTrade Enterprise V17</p>
                <p>Admin Dashboard</p>
                <p>Build 2026 Edition</p>
              </div>
            </div>

          </div>

          <div className="border-t border-zinc-800 mt-8 pt-6 text-center text-gray-500 text-sm">
            © 2026 GoldTrade Enterprise — Admin Control Center.
          </div>

        </footer>

      </main>

    </div>
  );
}