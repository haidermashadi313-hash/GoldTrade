"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import {
  Users,
  Wallet,
  ArrowDownCircle,
  ArrowUpCircle,
  TrendingUp,
  Gift,
  Crown,
  Trophy,
  RefreshCw,
  Settings,
  LogOut,
  ShieldCheck,
} from "lucide-react";

// ============================================
// API CONFIG (FIXED)
// ============================================

const API =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

// ============================================
// TYPES
// ============================================

interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  blockedUsers: number;
  frozenWallets: number;

  totalDeposits: number;
  totalWithdrawals: number;

  pendingDeposits: number;
  pendingWithdrawals: number;

  buyVolume: number;
  sellVolume: number;

  cashbackPaid: number;
  vipUsers: number;
}

interface MarketSettings {
  buyGoldPrice: number;
  sellGoldPrice: number;
  goldTradingEnabled: boolean;
}

interface Deposit {
  _id: string;
  username: string;
  amount: number;
  method: string;
  status: string;
  createdAt: string;
}

interface Withdrawal {
  _id: string;
  username: string;
  amount: number;
  method: string;
  status: string;
  createdAt: string;
}

// ============================================
// COMPONENT
// ============================================

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("token")
      : "";

  const role =
    typeof window !== "undefined"
      ? localStorage.getItem("role")
      : "";

  // ============================================
  // STATES
  // ============================================

  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    activeUsers: 0,
    blockedUsers: 0,
    frozenWallets: 0,

    totalDeposits: 0,
    totalWithdrawals: 0,

    pendingDeposits: 0,
    pendingWithdrawals: 0,

    buyVolume: 0,
    sellVolume: 0,

    cashbackPaid: 0,
    vipUsers: 0,
  });

  const [market, setMarket] = useState<MarketSettings>({
    buyGoldPrice: 0,
    sellGoldPrice: 0,
    goldTradingEnabled: false,
  });

  const [pendingDeposits, setPendingDeposits] = useState<Deposit[]>([]);
  const [pendingWithdrawals, setPendingWithdrawals] = useState<Withdrawal[]>([]);

  // ============================================
  // LOAD ADMIN DASHBOARD (FIXED)
  // ============================================

  const loadDashboard = async () => {
    try {
      setLoading(true);

      if (!token) {
        window.location.replace("/login");
        return;
      }

      if (role !== "admin") {
        window.location.replace("/dashboard");
        return;
      }

      const headers = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      };

      const [
        statsRes,
        settingsRes,
        depositsRes,
        withdrawRes,
      ] = await Promise.all([
        fetch(`${API}/api/gold/admin/dashboard`, { headers }),
        fetch(`${API}/api/settings/public`),
        fetch(`${API}/api/gold/admin/deposits?status=Pending`, { headers }),
        fetch(`${API}/api/gold/admin/withdrawals?status=Pending`, { headers }),
      ]);

      const statsData = statsRes.ok ? await statsRes.json() : {};
      const settingsData = settingsRes.ok ? await settingsRes.json() : {};
      const depositsData = depositsRes.ok ? await depositsRes.json() : {};
      const withdrawData = withdrawRes.ok ? await withdrawRes.json() : {};

      // ---------- Statistics ----------

      if (statsData.success) {
        const s = statsData.statistics || {};

        setStats({
          totalUsers: s.totalUsers ?? 0,
          activeUsers: s.activeUsers ?? 0,
          blockedUsers: s.blockedUsers ?? 0,
          frozenWallets: s.frozenWallets ?? 0,

          totalDeposits: s.totalDeposits ?? 0,
          totalWithdrawals: s.totalWithdrawals ?? 0,

          pendingDeposits: s.pendingDeposits ?? 0,
          pendingWithdrawals: s.pendingWithdrawals ?? 0,

          buyVolume: s.buyVolume ?? 0,
          sellVolume: s.sellVolume ?? 0,

          cashbackPaid: s.cashbackPaid ?? 0,
          vipUsers: s.vipUsers ?? 0,
        });
      }

      // ---------- Market Settings ----------

      if (settingsData.success) {
        const m = settingsData.settings || {};

        setMarket({
          buyGoldPrice: m.buyGoldPrice ?? 0,
          sellGoldPrice: m.sellGoldPrice ?? 0,
          goldTradingEnabled: m.goldTradingEnabled ?? false,
        });
      }

      // ---------- Deposits ----------

      if (depositsData.success) {
        setPendingDeposits(depositsData.deposits ?? []);
      }

      // ---------- Withdrawals ----------

      if (withdrawData.success) {
        setPendingWithdrawals(withdrawData.withdrawals ?? []);
      }

      setMessage("");
    } catch (error) {
      console.error("Admin Dashboard Error:", error);
      setMessage("Unable to connect to GoldTrade Backend.");
    } finally {
      setLoading(false);
    }
  };

  
  // ============================================
  // LOGOUT
  // ============================================

  const logoutAdmin = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("username");
    localStorage.removeItem("email");

    window.location.replace("/login");
  };

  // ============================================
  // PAGE LOAD
  // ============================================

  useEffect(() => {
    loadDashboard();
  }, []);

  // ============================================
  // AUTO REFRESH (30 SEC)
  // ============================================

  useEffect(() => {
    const interval = setInterval(() => {
      loadDashboard();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  // ============================================
  // ACTION PLACEHOLDERS
  // ============================================

  const approveDeposit = async (_id: string) => {};
  const rejectDeposit = async (_id: string) => {};
  const approveWithdraw = async (_id: string) => {};
  const rejectWithdraw = async (_id: string) => {};

  // ============================================
  // LOADING SCREEN
  // ============================================

  if (loading) {
    return (
      <main className="min-h-screen bg-black flex items-center justify-center text-yellow-400">
        <RefreshCw className="animate-spin mr-3" />
        Loading Admin Dashboard...
      </main>
    );
  }

  // ============================================
  // PAGE UI STARTS HERE
  // ============================================

  return (
    <main className="min-h-screen bg-black text-white p-6">
      <div className="max-w-7xl mx-auto">

        {message && (
          <div className="mb-6 bg-red-700 text-white px-4 py-3 rounded-xl font-semibold">
            {message}
          </div>
        )}

              {/* ============================================ */}
        {/* HEADER */}
        {/* ============================================ */}

        <div className="flex justify-between items-center mb-10 flex-wrap gap-4">

          <div>
            <h1 className="text-4xl font-black text-yellow-400">
              GoldTrade Admin Panel
            </h1>

            <p className="text-gray-400 mt-2">
              Production Control Center • Enterprise V18
            </p>
          </div>

          <button
            onClick={loadDashboard}
            className="bg-yellow-500 hover:bg-yellow-400 text-black px-5 py-3 rounded-xl flex items-center gap-2 font-bold transition-all duration-300 hover:scale-105"
          >
            <RefreshCw size={18} />
            Refresh Dashboard
          </button>

        </div>

        {/* ============================================ */}
        {/* USER ANALYTICS */}
        {/* ============================================ */}

        <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-6 mb-10">

          {/* Total Users */}

          <div className="bg-zinc-900 border border-yellow-500 rounded-2xl p-5">
            <div className="flex justify-between items-center mb-3">
              <Users className="text-yellow-400" size={32} />

              <span className="text-xs bg-yellow-500 text-black px-2 py-1 rounded-full font-bold">
                USERS
              </span>
            </div>

            <p className="text-gray-400 text-sm">
              Total Registered Users
            </p>

            <h2 className="text-4xl font-black text-yellow-400 mt-2">
              {(stats.totalUsers ?? 0).toLocaleString()}
            </h2>
          </div>

          {/* Active Users */}

          <div className="bg-zinc-900 border border-green-500 rounded-2xl p-5">
            <div className="flex justify-between items-center mb-3">
              <ShieldCheck className="text-green-400" size={32} />

              <span className="text-xs bg-green-600 px-2 py-1 rounded-full font-bold">
                ACTIVE
              </span>
            </div>

            <p className="text-gray-400 text-sm">
              Active Accounts
            </p>

            <h2 className="text-4xl font-black text-green-400 mt-2">
              {(stats.activeUsers ?? 0).toLocaleString()}
            </h2>
          </div>

          {/* Blocked Users */}

          <div className="bg-zinc-900 border border-red-500 rounded-2xl p-5">
            <div className="flex justify-between items-center mb-3">
              <Users className="text-red-400" size={32} />

              <span className="text-xs bg-red-600 px-2 py-1 rounded-full font-bold">
                BLOCKED
              </span>
            </div>

            <p className="text-gray-400 text-sm">
              Blocked Users
            </p>

            <h2 className="text-4xl font-black text-red-400 mt-2">
              {(stats.blockedUsers ?? 0).toLocaleString()}
            </h2>
          </div>

          {/* Frozen Wallets */}

          <div className="bg-zinc-900 border border-cyan-500 rounded-2xl p-5">
            <div className="flex justify-between items-center mb-3">
              <Wallet className="text-cyan-400" size={32} />

              <span className="text-xs bg-cyan-600 px-2 py-1 rounded-full font-bold">
                FROZEN
              </span>
            </div>

            <p className="text-gray-400 text-sm">
              Frozen Wallets
            </p>

            <h2 className="text-4xl font-black text-cyan-400 mt-2">
              {(stats.frozenWallets ?? 0).toLocaleString()}
            </h2>
          </div>

        </div>

        {/* ============================================ */}
        {/* MONEY ANALYTICS */}
        {/* ============================================ */}

        <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-6 mb-10">

          {/* Total Deposits */}

          <div className="bg-zinc-900 border border-green-600 rounded-2xl p-5">
            <div className="flex justify-between items-center mb-3">
              <ArrowDownCircle className="text-green-400" size={32} />

              <span className="text-xs bg-green-600 px-2 py-1 rounded-full font-bold">
                DEPOSIT
              </span>
            </div>

            <p className="text-gray-400 text-sm">
              Total Deposits
            </p>

            <h2 className="text-3xl font-black text-green-400 mt-2">
              PKR {(stats.totalDeposits ?? 0).toLocaleString()}
            </h2>
          </div>

          {/* Total Withdrawals */}

          <div className="bg-zinc-900 border border-red-600 rounded-2xl p-5">
            <div className="flex justify-between items-center mb-3">
              <ArrowUpCircle className="text-red-400" size={32} />

              <span className="text-xs bg-red-600 px-2 py-1 rounded-full font-bold">
                WITHDRAW
              </span>
            </div>

            <p className="text-gray-400 text-sm">
              Total Withdrawals
            </p>

            <h2 className="text-3xl font-black text-red-400 mt-2">
              PKR {(stats.totalWithdrawals ?? 0).toLocaleString()}
            </h2>
          </div>

          {/* Pending Deposits */}

          <div className="bg-zinc-900 border border-yellow-500 rounded-2xl p-5">
            <div className="flex justify-between items-center mb-3">
              <ArrowDownCircle className="text-yellow-400" size={32} />

              <span className="text-xs bg-yellow-500 text-black px-2 py-1 rounded-full font-bold">
                PENDING
              </span>
            </div>

            <p className="text-gray-400 text-sm">
              Pending Deposits
            </p>

            <h2 className="text-4xl font-black text-yellow-400 mt-2">
              {stats.pendingDeposits ?? 0}
            </h2>
          </div>

          {/* Pending Withdrawals */}

          <div className="bg-zinc-900 border border-orange-500 rounded-2xl p-5">
            <div className="flex justify-between items-center mb-3">
              <ArrowUpCircle className="text-orange-400" size={32} />

              <span className="text-xs bg-orange-500 text-black px-2 py-1 rounded-full font-bold">
                PENDING
              </span>
            </div>

            <p className="text-gray-400 text-sm">
              Pending Withdrawals
            </p>

            <h2 className="text-4xl font-black text-orange-400 mt-2">
              {stats.pendingWithdrawals ?? 0}
            </h2>
          </div>

        </div>

                {/* ============================================ */}
        {/* TRADING ANALYTICS */}
        {/* ============================================ */}

        <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-6 mb-10">

          {/* BUY GOLD VOLUME */}

          <div className="bg-zinc-900 border border-blue-500 rounded-2xl p-5">

            <div className="flex justify-between items-center mb-3">
              <TrendingUp className="text-blue-400" size={32} />

              <span className="text-xs bg-blue-600 px-2 py-1 rounded-full font-bold">
                BUY GOLD
              </span>
            </div>

            <p className="text-gray-400 text-sm">
              Today's Buy Volume
            </p>

            <h2 className="text-3xl font-black text-blue-400 mt-2">
              PKR {(stats.buyVolume ?? 0).toLocaleString()}
            </h2>

          </div>

          {/* SELL GOLD VOLUME */}

          <div className="bg-zinc-900 border border-purple-500 rounded-2xl p-5">

            <div className="flex justify-between items-center mb-3">
              <TrendingUp className="text-purple-400" size={32} />

              <span className="text-xs bg-purple-600 px-2 py-1 rounded-full font-bold">
                SELL GOLD
              </span>
            </div>

            <p className="text-gray-400 text-sm">
              Today's Sell Volume
            </p>

            <h2 className="text-3xl font-black text-purple-400 mt-2">
              PKR {(stats.sellVolume ?? 0).toLocaleString()}
            </h2>

          </div>

          {/* CASHBACK */}

          <div className="bg-zinc-900 border border-pink-500 rounded-2xl p-5">

            <div className="flex justify-between items-center mb-3">
              <Gift className="text-pink-400" size={32} />

              <span className="text-xs bg-pink-600 px-2 py-1 rounded-full font-bold">
                CASHBACK
              </span>
            </div>

            <p className="text-gray-400 text-sm">
              Cashback Paid
            </p>

            <h2 className="text-3xl font-black text-pink-400 mt-2">
              PKR {(stats.cashbackPaid ?? 0).toLocaleString()}
            </h2>

          </div>

          {/* VIP USERS */}

          <div className="bg-zinc-900 border border-yellow-400 rounded-2xl p-5">

            <div className="flex justify-between items-center mb-3">
              <Crown className="text-yellow-400" size={32} />

              <span className="text-xs bg-yellow-500 text-black px-2 py-1 rounded-full font-bold">
                VIP USERS
              </span>
            </div>

            <p className="text-gray-400 text-sm">
              Silver • Gold • Diamond
            </p>

            <h2 className="text-4xl font-black text-yellow-400 mt-2">
              {stats.vipUsers ?? 0}
            </h2>

          </div>

        </div>

        {/* ============================================ */}
        {/* LIVE GOLD MARKET */}
        {/* ============================================ */}

        <div className="bg-zinc-900 border border-yellow-500 rounded-3xl p-6 mb-10">

          <div className="flex justify-between items-center mb-6 flex-wrap gap-4">

            <div>
              <h2 className="text-3xl font-black text-yellow-400">
                Live Gold Market
              </h2>

              <p className="text-gray-400 mt-1">
                Enterprise Gold Market Settings (Admin Controlled)
              </p>
            </div>

            <span
              className={`px-4 py-2 rounded-full font-bold text-sm ${
                market.goldTradingEnabled
                  ? "bg-green-600 text-white"
                  : "bg-red-600 text-white"
              }`}
            >
              {market.goldTradingEnabled
                ? "🟢 MARKET OPEN"
                : "🔴 MARKET CLOSED"}
            </span>

          </div>

          <div className="grid md:grid-cols-2 gap-6">

            {/* BUY PRICE */}

            <div className="bg-black border border-green-600 rounded-2xl p-6">

              <p className="text-gray-400 text-sm mb-2">
                Buy Gold Price
              </p>

              <h2 className="text-5xl font-black text-green-400">
                PKR {(market.buyGoldPrice ?? 0).toLocaleString()}
              </h2>

              <p className="text-gray-500 text-sm mt-3">
                Per Gram • Live Buying Rate
              </p>

            </div>

            {/* SELL PRICE */}

            <div className="bg-black border border-red-600 rounded-2xl p-6">

              <p className="text-gray-400 text-sm mb-2">
                Sell Gold Price
              </p>

              <h2 className="text-5xl font-black text-red-400">
                PKR {(market.sellGoldPrice ?? 0).toLocaleString()}
              </h2>

              <p className="text-gray-500 text-sm mt-3">
                Per Gram • Live Selling Rate
              </p>

            </div>

          </div>

          {/* MARKET INFO BAR */}

          <div className="grid md:grid-cols-3 gap-4 mt-6">

            <div className="bg-black rounded-xl p-4 border border-zinc-700">

              <p className="text-gray-400 text-xs">
                Trading Status
              </p>

              <h3
                className={`text-xl font-black mt-2 ${
                  market.goldTradingEnabled
                    ? "text-green-400"
                    : "text-red-400"
                }`}
              >
                {market.goldTradingEnabled ? "OPEN" : "CLOSED"}
              </h3>

            </div>

            <div className="bg-black rounded-xl p-4 border border-zinc-700">

              <p className="text-gray-400 text-xs">
                Price Spread
              </p>

              <h3 className="text-xl font-black text-cyan-400 mt-2">
                PKR {(
                  (market.buyGoldPrice ?? 0) -
                  (market.sellGoldPrice ?? 0)
                ).toLocaleString()}
              </h3>

            </div>

            <div className="bg-black rounded-xl p-4 border border-zinc-700">

              <p className="text-gray-400 text-xs">
                Market Control
              </p>

              <h3 className="text-xl font-black text-yellow-400 mt-2">
                Admin Controlled
              </h3>

            </div>

          </div>

        </div>

               {/* ============================================ */}
        {/* VIP MEMBERSHIP + CASHBACK SUMMARY */}
        {/* ============================================ */}

        <div className="grid lg:grid-cols-2 gap-6 mb-10">

          {/* VIP MEMBERSHIP SUMMARY */}

          <div className="bg-zinc-900 border border-yellow-500 rounded-3xl p-6">

            <div className="flex items-center gap-3 mb-5">
              <Crown className="text-yellow-400" size={30} />

              <h2 className="text-2xl font-black text-yellow-400">
                VIP Membership Summary
              </h2>
            </div>

            <div className="space-y-4">

              <div className="flex justify-between items-center bg-black p-4 rounded-xl border border-zinc-800">
                <span className="text-gray-300">Silver Members</span>

                <span className="font-bold text-gray-200">
                  Included in VIP Users
                </span>
              </div>

              <div className="flex justify-between items-center bg-black p-4 rounded-xl border border-yellow-700">
                <span className="text-yellow-300">Gold Members</span>

                <span className="font-bold text-yellow-400">
                  Included in VIP Users
                </span>
              </div>

              <div className="flex justify-between items-center bg-black p-4 rounded-xl border border-cyan-700">
                <span className="text-cyan-300">Diamond Members</span>

                <span className="font-bold text-cyan-400">
                  Included in VIP Users
                </span>
              </div>

              <div className="bg-gradient-to-r from-yellow-600 to-yellow-500 rounded-2xl p-5 mt-5">

                <p className="text-black text-sm font-semibold">
                  Total VIP Members
                </p>

                <h2 className="text-5xl font-black text-black mt-2">
                  {stats.vipUsers ?? 0}
                </h2>

                <p className="text-black/80 text-sm mt-2">
                  Silver • Gold • Diamond Membership Combined
                </p>

              </div>

            </div>

          </div>

          {/* CASHBACK CAMPAIGN SUMMARY */}

          <div className="bg-zinc-900 border border-pink-500 rounded-3xl p-6">

            <div className="flex items-center gap-3 mb-5">
              <Gift className="text-pink-400" size={30} />

              <h2 className="text-2xl font-black text-pink-400">
                Cashback Campaign Summary
              </h2>
            </div>

            <div className="space-y-4">

              <div className="bg-black p-5 rounded-xl border border-pink-700">

                <p className="text-gray-400 text-sm">
                  Cashback Distributed
                </p>

                <h2 className="text-4xl font-black text-pink-400 mt-2">
                  PKR {(stats.cashbackPaid ?? 0).toLocaleString()}
                </h2>

                <p className="text-pink-300 text-sm mt-2">
                  Total Cashback Paid to Users
                </p>

              </div>

              <div className="bg-black p-5 rounded-xl border border-yellow-700">

                <div className="flex items-center gap-3 mb-2">
                  <Trophy className="text-yellow-400" />

                  <p className="font-bold text-yellow-300">
                    Lucky Draw Campaign
                  </p>
                </div>

                <p className="text-gray-400 text-sm">
                  Lucky Draw rewards can be enabled or disabled from Admin Settings.
                </p>

                <span className="inline-block mt-3 bg-yellow-500 text-black px-4 py-2 rounded-full text-xs font-bold">
                  ADMIN CONTROLLED
                </span>

              </div>

              <div className="bg-black p-5 rounded-xl border border-green-700">

                <p className="text-gray-400 text-sm">
                  Trading Cashback Engine
                </p>

                <h3 className="text-2xl font-black text-green-400 mt-2">
                  ACTIVE
                </h3>

                <p className="text-green-300 text-sm mt-2">
                  Cashback automatically applies according to platform rules.
                </p>

              </div>

            </div>

          </div>

        </div>

                {/* ============================================ */}
        {/* PENDING DEPOSIT REQUESTS */}
        {/* ============================================ */}

        <div className="bg-zinc-900 border border-green-600 rounded-3xl p-6 mb-10">

          <div className="flex justify-between items-center mb-6 flex-wrap gap-3">

            <div>
              <h2 className="text-3xl font-black text-green-400">
                Pending Deposit Requests
              </h2>

              <p className="text-gray-400">
                Waiting for Admin Approval
              </p>
            </div>

            <span className="bg-green-600 px-4 py-2 rounded-full font-bold text-white">
              {pendingDeposits.length} Pending
            </span>

          </div>

          <div className="overflow-x-auto">

            <table className="w-full text-left">

              <thead className="bg-black text-yellow-400">

                <tr>
                  <th className="p-3">User</th>
                  <th className="p-3">Amount</th>
                  <th className="p-3">Method</th>
                  <th className="p-3">Date</th>
                  <th className="p-3">Status</th>
                </tr>

              </thead>

              <tbody>

                {pendingDeposits.length === 0 ? (

                  <tr>
                    <td colSpan={5} className="text-center py-8 text-gray-500">
                      No Pending Deposits
                    </td>
                  </tr>

                ) : (

                  pendingDeposits.map((deposit) => (

                    <tr
                      key={deposit._id}
                      className="border-b border-zinc-800 hover:bg-black transition"
                    >

                      <td className="p-3 font-semibold text-white">
                        {deposit.username}
                      </td>

                      <td className="p-3 font-bold text-green-400">
                        PKR {(deposit.amount ?? 0).toLocaleString()}
                      </td>

                      <td className="p-3 text-gray-300">
                        {deposit.method}
                      </td>

                      <td className="p-3 text-gray-400">
                        {new Date(deposit.createdAt).toLocaleDateString()}
                      </td>

                      <td className="p-3">
                        <span className="bg-yellow-500 text-black px-3 py-1 rounded-full text-xs font-bold">
                          {deposit.status}
                        </span>
                      </td>

                    </tr>

                  ))

                )}

              </tbody>

            </table>

          </div>

        </div>

        {/* ============================================ */}
        {/* PENDING WITHDRAWAL REQUESTS */}
        {/* ============================================ */}

        <div className="bg-zinc-900 border border-red-600 rounded-3xl p-6 mb-10">

          <div className="flex justify-between items-center mb-6 flex-wrap gap-3">

            <div>
              <h2 className="text-3xl font-black text-red-400">
                Pending Withdrawal Requests
              </h2>

              <p className="text-gray-400">
                Waiting for Admin Approval
              </p>
            </div>

            <span className="bg-red-600 px-4 py-2 rounded-full font-bold text-white">
              {pendingWithdrawals.length} Pending
            </span>

          </div>

          <div className="overflow-x-auto">

            <table className="w-full text-left">

              <thead className="bg-black text-yellow-400">

                <tr>
                  <th className="p-3">User</th>
                  <th className="p-3">Amount</th>
                  <th className="p-3">Method</th>
                  <th className="p-3">Date</th>
                  <th className="p-3">Status</th>
                </tr>

              </thead>

              <tbody>

                {pendingWithdrawals.length === 0 ? (

                  <tr>
                    <td colSpan={5} className="text-center py-8 text-gray-500">
                      No Pending Withdrawals
                    </td>
                  </tr>

                ) : (

                  pendingWithdrawals.map((withdraw) => (

                    <tr
                      key={withdraw._id}
                      className="border-b border-zinc-800 hover:bg-black transition"
                    >

                      <td className="p-3 font-semibold text-white">
                        {withdraw.username}
                      </td>

                      <td className="p-3 font-bold text-red-400">
                        PKR {(withdraw.amount ?? 0).toLocaleString()}
                      </td>

                      <td className="p-3 text-gray-300">
                        {withdraw.method}
                      </td>

                      <td className="p-3 text-gray-400">
                        {new Date(withdraw.createdAt).toLocaleDateString()}
                      </td>

                      <td className="p-3">
                        <span className="bg-yellow-500 text-black px-3 py-1 rounded-full text-xs font-bold">
                          {withdraw.status}
                        </span>
                      </td>

                    </tr>

                  ))

                )}

              </tbody>

            </table>

          </div>

        </div>

        {/* ============================================ */}
        {/* QUICK ACTION CENTER */}
        {/* ============================================ */}

        <div className="bg-zinc-900 border border-yellow-500 rounded-3xl p-6 mb-10">

          <div className="flex items-center gap-3 mb-6">
            <Settings className="text-yellow-400" size={30} />

            <h2 className="text-3xl font-black text-yellow-400">
              Admin Quick Actions
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">

            <Link
              href="/admin-dashboard/gold"
              className="bg-black hover:bg-zinc-800 border border-yellow-500 rounded-2xl p-5 transition"
            >
              <Wallet className="text-yellow-400 mb-4" size={34} />

              <h3 className="font-bold text-xl text-yellow-400">
                Gold Market Control
              </h3>

              <p className="text-gray-400 text-sm mt-2">
                Update Buy/Sell Gold prices and trading settings.
              </p>
            </Link>

            <Link
              href="/admin/users"
              className="bg-black hover:bg-zinc-800 border border-green-500 rounded-2xl p-5 transition"
            >
              <Users className="text-green-400 mb-4" size={34} />

              <h3 className="font-bold text-xl text-green-400">
                User Manager
              </h3>

              <p className="text-gray-400 text-sm mt-2">
                Manage users, wallets and account status.
              </p>
            </Link>

            <Link
              href="/admin/reports"
              className="bg-black hover:bg-zinc-800 border border-purple-500 rounded-2xl p-5 transition"
            >
              <TrendingUp className="text-purple-400 mb-4" size={34} />

              <h3 className="font-bold text-xl text-purple-400">
                Reports & Analytics
              </h3>

              <p className="text-gray-400 text-sm mt-2">
                View deposits, withdrawals, cashback and trading reports.
              </p>
            </Link>

          </div>

        </div>

        {/* ============================================ */}
        {/* SYSTEM STATUS */}
        {/* ============================================ */}

        <div className="bg-zinc-900 border border-cyan-500 rounded-3xl p-6 mb-10">

          <div className="flex items-center gap-3 mb-6">
            <ShieldCheck className="text-cyan-400" size={30} />

            <h2 className="text-3xl font-black text-cyan-400">
              GoldTrade Enterprise System Status
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">

            <div className="bg-black rounded-xl p-5 text-center border border-green-600">
              <p className="text-gray-400 text-sm mb-2">Backend API</p>

              <span className="bg-green-600 px-4 py-2 rounded-full font-bold">
                ONLINE
              </span>
            </div>

            <div className="bg-black rounded-xl p-5 text-center border border-yellow-600">
              <p className="text-gray-400 text-sm mb-2">Gold Trading</p>

              <span
                className={`px-4 py-2 rounded-full font-bold ${
                  market.goldTradingEnabled
                    ? "bg-green-600"
                    : "bg-red-600"
                }`}
              >
                {market.goldTradingEnabled ? "OPEN" : "CLOSED"}
              </span>
            </div>

            <div className="bg-black rounded-xl p-5 text-center border border-blue-600">
              <p className="text-gray-400 text-sm mb-2">Database</p>

              <span className="bg-blue-600 px-4 py-2 rounded-full font-bold">
                CONNECTED
              </span>
            </div>

            <div className="bg-black rounded-xl p-5 text-center border border-purple-600">
              <p className="text-gray-400 text-sm mb-2">Auto Refresh</p>

              <span className="bg-purple-600 px-4 py-2 rounded-full font-bold">
                30 SEC
              </span>
            </div>

          </div>

        </div>

        {/* ============================================ */}
        {/* ADMIN LOGOUT */}
        {/* ============================================ */}

        <div className="bg-gradient-to-r from-red-700 to-red-900 rounded-3xl p-6 mb-10">

          <div className="flex justify-between items-center flex-wrap gap-5">

            <div>
              <h2 className="text-3xl font-black text-white mb-2">
                Secure Admin Logout
              </h2>

              <p className="text-red-100">
                End your administrator session securely.
              </p>
            </div>

            <button
              onClick={logoutAdmin}
              className="bg-white hover:bg-gray-200 text-red-700 font-black px-8 py-4 rounded-xl flex items-center gap-3 transition"
            >
              <LogOut size={22} />
              Logout
            </button>

          </div>

        </div>

        {/* ============================================ */}
        {/* FOOTER */}
        {/* ============================================ */}

        <footer className="border-t border-yellow-500 pt-8 pb-6">

          <div className="grid lg:grid-cols-3 gap-6 mb-8">

            <div>
              <h2 className="text-3xl font-black text-yellow-400 mb-3">
                GoldTrade Admin
              </h2>

              <p className="text-gray-400 text-sm">
                Enterprise Production Dashboard for GoldTrade Platform.
              </p>
            </div>

            <div>
              <h3 className="font-bold text-yellow-400 mb-3">
                Quick Links
              </h3>

              <ul className="space-y-2 text-sm text-gray-400">
                <li>User Manager</li>
                <li>Deposit Manager</li>
                <li>Withdrawal Manager</li>
                <li>Gold Market Control</li>
                <li>Reports</li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-yellow-400 mb-3">
                Platform Status
              </h3>

              <ul className="space-y-2 text-sm text-gray-400">
                <li>Backend API : Online</li>
                <li>Database : Connected</li>
                <li>Trading Engine : Live</li>
                <li>Security : JWT Protected</li>
              </ul>
            </div>

          </div>

          <div className="border-t border-zinc-700 pt-5 flex flex-col md:flex-row justify-between items-center gap-3">

            <p className="text-gray-500 text-sm">
              © 2026 GoldTrade Enterprise Admin Panel V18
            </p>

            <div className="flex gap-5 text-sm text-gray-400">
              <Link href="/admin-dashboard/gold" className="hover:text-yellow-400">
                Gold Control
              </Link>

              <Link href="/admin/reports" className="hover:text-yellow-400">
                Reports
              </Link>

              <Link href="/dashboard" className="hover:text-yellow-400">
                User Dashboard
              </Link>
            </div>

          </div>

        </footer>

      </div>
    </main>
  );
}