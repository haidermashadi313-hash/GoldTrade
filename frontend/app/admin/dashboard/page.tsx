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

const API =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:10000";

/* ============================================
   TYPES
============================================ */

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

/* ============================================
   COMPONENT
============================================ */

export default function AdminDashboard() {
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("token")
      : "";

  const role =
    typeof window !== "undefined"
      ? localStorage.getItem("role")
      : "";

  const [loading, setLoading] = useState(true);

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

  const [market, setMarket] =
    useState<MarketSettings>({
      buyGoldPrice: 0,
      sellGoldPrice: 0,
      goldTradingEnabled: false,
    });

  const [pendingDeposits, setPendingDeposits] =
    useState<Deposit[]>([]);

  const [pendingWithdrawals, setPendingWithdrawals] =
    useState<Withdrawal[]>([]);

  /* ============================================
     LOAD ADMIN DASHBOARD
  ============================================ */

  const loadDashboard = async () => {
    try {
      setLoading(true);

      if (!token) {
        window.location.href = "/login";
        return;
      }

      if (role !== "admin") {
        alert("Admin access only.");
        window.location.href = "/dashboard";
        return;
      }

      const [
        statsRes,
        settingsRes,
        depositsRes,
        withdrawRes,
      ] = await Promise.all([
        fetch(`${API}/api/admin/dashboard`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),

        fetch(`${API}/api/settings/public`),

        fetch(
          `${API}/api/admin/deposits?status=Pending`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        ),

        fetch(
          `${API}/api/admin/withdrawals?status=Pending`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        ),
      ]);

      const statsData = await statsRes.json();
      const settingsData = await settingsRes.json();
      const depositsData = await depositsRes.json();
      const withdrawData = await withdrawRes.json();

      /* ---------- Statistics ---------- */

      if (statsData.success) {
        setStats({
          totalUsers:
            statsData.statistics?.totalUsers ?? 0,

          activeUsers:
            statsData.statistics?.activeUsers ?? 0,

          blockedUsers:
            statsData.statistics?.blockedUsers ?? 0,

          frozenWallets:
            statsData.statistics?.frozenWallets ?? 0,

          totalDeposits:
            statsData.statistics?.totalDeposits ?? 0,

          totalWithdrawals:
            statsData.statistics?.totalWithdrawals ?? 0,

          pendingDeposits:
            statsData.statistics?.pendingDeposits ?? 0,

          pendingWithdrawals:
            statsData.statistics?.pendingWithdrawals ?? 0,

          buyVolume:
            statsData.statistics?.buyVolume ?? 0,

          sellVolume:
            statsData.statistics?.sellVolume ?? 0,

          cashbackPaid:
            statsData.statistics?.cashbackPaid ?? 0,

          vipUsers:
            statsData.statistics?.vipUsers ?? 0,
        });
      }

      /* ---------- Market ---------- */

      if (settingsData.success) {
        setMarket({
          buyGoldPrice:
            settingsData.settings.buyGoldPrice ?? 0,

          sellGoldPrice:
            settingsData.settings.sellGoldPrice ?? 0,

          goldTradingEnabled:
            settingsData.settings.goldTradingEnabled ??
            false,
        });
      }

      /* ---------- Pending Deposits ---------- */

      if (depositsData.success) {
        setPendingDeposits(
          depositsData.deposits ?? []
        );
      }

      /* ---------- Pending Withdrawals ---------- */

      if (withdrawData.success) {
        setPendingWithdrawals(
          withdrawData.withdrawals ?? []
        );
      }

    } catch (err) {
      console.error(err);
      alert("Unable to load admin dashboard.");
    } finally {
      setLoading(false);
    }
  };

  /* ============================================
     LOGOUT
  ============================================ */

  const logoutAdmin = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("username");
    localStorage.removeItem("email");

    window.location.href = "/login";
  };

  /* ============================================
     PAGE LOAD
  ============================================ */

  useEffect(() => {
    loadDashboard();
  }, []);

  /* ============================================
     AUTO REFRESH
  ============================================ */

  useEffect(() => {
    const interval = setInterval(() => {
      loadDashboard();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  /* ============================================
     LOADING
  ============================================ */

  if (loading) {
    return (
      <main className="min-h-screen bg-black flex items-center justify-center text-yellow-400">
        <RefreshCw className="animate-spin mr-3"/>
        Loading Admin Dashboard...
      </main>
    );
  }
    function rejectDeposit(_id: string): void {
        throw new Error("Function not implemented.");
    }

    function approveWithdraw(_id: string): void {
        throw new Error("Function not implemented.");
    }

    function rejectWithdraw(_id: string): void {
        throw new Error("Function not implemented.");
    }

    function approveDeposit(_id: string): void {
        throw new Error("Function not implemented.");
    }

  return (
    <main className="min-h-screen bg-black text-white p-6">
      <div className="max-w-7xl mx-auto">

        {/* HEADER */}

        <div className="flex justify-between items-center mb-10 flex-wrap gap-4">

          <div>
            <h1 className="text-4xl font-black text-yellow-400">
              GoldTrade Admin Panel
            </h1>

            <p className="text-gray-400 mt-2">
              Production Control Center
            </p>
          </div>

          <button
            onClick={loadDashboard}
            className="bg-yellow-500 hover:bg-yellow-400 text-black px-5 py-3 rounded-xl flex items-center gap-2 font-bold"
          >
            <RefreshCw size={18}/>
            Refresh Dashboard
          </button>

        </div>        {/* ================= ADMIN ANALYTICS CARDS ================= */}

        <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-6 mb-10">

          {/* Total Users */}
          <div className="bg-zinc-900 border border-yellow-500 rounded-2xl p-5">
            <div className="flex justify-between items-center mb-3">
              <Users className="text-yellow-400" size={32}/>
              <span className="text-xs bg-yellow-500 text-black px-2 py-1 rounded-full font-bold">
                USERS
              </span>
            </div>

            <p className="text-gray-400 text-sm">Total Registered Users</p>

            <h2 className="text-4xl font-black text-yellow-400 mt-2">
              {stats.totalUsers.toLocaleString()}
            </h2>
          </div>

          {/* Active Users */}
          <div className="bg-zinc-900 border border-green-500 rounded-2xl p-5">
            <div className="flex justify-between items-center mb-3">
              <ShieldCheck className="text-green-400" size={32}/>
              <span className="text-xs bg-green-600 px-2 py-1 rounded-full font-bold">
                ACTIVE
              </span>
            </div>

            <p className="text-gray-400 text-sm">Active Accounts</p>

            <h2 className="text-4xl font-black text-green-400 mt-2">
              {stats.activeUsers.toLocaleString()}
            </h2>
          </div>

          {/* Blocked Users */}
          <div className="bg-zinc-900 border border-red-500 rounded-2xl p-5">
            <div className="flex justify-between items-center mb-3">
              <Users className="text-red-400" size={32}/>
              <span className="text-xs bg-red-600 px-2 py-1 rounded-full font-bold">
                BLOCKED
              </span>
            </div>

            <p className="text-gray-400 text-sm">Blocked Users</p>

            <h2 className="text-4xl font-black text-red-400 mt-2">
              {stats.blockedUsers.toLocaleString()}
            </h2>
          </div>

          {/* Frozen Wallets */}
          <div className="bg-zinc-900 border border-cyan-500 rounded-2xl p-5">
            <div className="flex justify-between items-center mb-3">
              <Wallet className="text-cyan-400" size={32}/>
              <span className="text-xs bg-cyan-600 px-2 py-1 rounded-full font-bold">
                FROZEN
              </span>
            </div>

            <p className="text-gray-400 text-sm">Frozen Wallets</p>

            <h2 className="text-4xl font-black text-cyan-400 mt-2">
              {stats.frozenWallets.toLocaleString()}
            </h2>
          </div>

        </div>

        {/* ================= MONEY ANALYTICS ================= */}

        <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-6 mb-10">

          {/* Total Deposits */}
          <div className="bg-zinc-900 border border-green-600 rounded-2xl p-5">
            <div className="flex justify-between items-center mb-3">
              <ArrowDownCircle className="text-green-400" size={32}/>
              <span className="text-xs bg-green-600 px-2 py-1 rounded-full font-bold">
                DEPOSIT
              </span>
            </div>

            <p className="text-gray-400 text-sm">Total Deposits</p>

            <h2 className="text-3xl font-black text-green-400 mt-2">
              PKR {stats.totalDeposits.toLocaleString()}
            </h2>
          </div>

          {/* Total Withdrawals */}
          <div className="bg-zinc-900 border border-red-600 rounded-2xl p-5">
            <div className="flex justify-between items-center mb-3">
              <ArrowUpCircle className="text-red-400" size={32}/>
              <span className="text-xs bg-red-600 px-2 py-1 rounded-full font-bold">
                WITHDRAW
              </span>
            </div>

            <p className="text-gray-400 text-sm">Total Withdrawals</p>

            <h2 className="text-3xl font-black text-red-400 mt-2">
              PKR {stats.totalWithdrawals.toLocaleString()}
            </h2>
          </div>

          {/* Pending Deposits */}
          <div className="bg-zinc-900 border border-yellow-500 rounded-2xl p-5">
            <div className="flex justify-between items-center mb-3">
              <ArrowDownCircle className="text-yellow-400" size={32}/>
              <span className="text-xs bg-yellow-500 text-black px-2 py-1 rounded-full font-bold">
                PENDING
              </span>
            </div>

            <p className="text-gray-400 text-sm">Pending Deposits</p>

            <h2 className="text-4xl font-black text-yellow-400 mt-2">
              {stats.pendingDeposits}
            </h2>
          </div>

          {/* Pending Withdrawals */}
          <div className="bg-zinc-900 border border-orange-500 rounded-2xl p-5">
            <div className="flex justify-between items-center mb-3">
              <ArrowUpCircle className="text-orange-400" size={32}/>
              <span className="text-xs bg-orange-500 text-black px-2 py-1 rounded-full font-bold">
                PENDING
              </span>
            </div>

            <p className="text-gray-400 text-sm">Pending Withdrawals</p>

            <h2 className="text-4xl font-black text-orange-400 mt-2">
              {stats.pendingWithdrawals}
            </h2>
          </div>

        </div>

        {/* ================= TRADING ANALYTICS ================= */}

        <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-6 mb-10">

          {/* Buy Volume */}
          <div className="bg-zinc-900 border border-blue-500 rounded-2xl p-5">
            <div className="flex justify-between items-center mb-3">
              <TrendingUp className="text-blue-400" size={32}/>
              <span className="text-xs bg-blue-600 px-2 py-1 rounded-full font-bold">
                BUY GOLD
              </span>
            </div>

            <p className="text-gray-400 text-sm">Today's Buy Volume</p>

            <h2 className="text-3xl font-black text-blue-400 mt-2">
              PKR {stats.buyVolume.toLocaleString()}
            </h2>
          </div>

          {/* Sell Volume */}
          <div className="bg-zinc-900 border border-purple-500 rounded-2xl p-5">
            <div className="flex justify-between items-center mb-3">
              <TrendingUp className="text-purple-400" size={32}/>
              <span className="text-xs bg-purple-600 px-2 py-1 rounded-full font-bold">
                SELL GOLD
              </span>
            </div>

            <p className="text-gray-400 text-sm">Today's Sell Volume</p>

            <h2 className="text-3xl font-black text-purple-400 mt-2">
              PKR {stats.sellVolume.toLocaleString()}
            </h2>
          </div>

          {/* Cashback */}
          <div className="bg-zinc-900 border border-pink-500 rounded-2xl p-5">
            <div className="flex justify-between items-center mb-3">
              <Gift className="text-pink-400" size={32}/>
              <span className="text-xs bg-pink-600 px-2 py-1 rounded-full font-bold">
                CASHBACK
              </span>
            </div>

            <p className="text-gray-400 text-sm">Cashback Paid</p>

            <h2 className="text-3xl font-black text-pink-400 mt-2">
              PKR {stats.cashbackPaid.toLocaleString()}
            </h2>
          </div>

          {/* VIP */}
          <div className="bg-zinc-900 border border-yellow-400 rounded-2xl p-5">
            <div className="flex justify-between items-center mb-3">
              <Crown className="text-yellow-400" size={32}/>
              <span className="text-xs bg-yellow-500 text-black px-2 py-1 rounded-full font-bold">
                VIP USERS
              </span>
            </div>

            <p className="text-gray-400 text-sm">Silver / Gold / Diamond</p>

            <h2 className="text-4xl font-black text-yellow-400 mt-2">
              {stats.vipUsers}
            </h2>
          </div>

        </div>

        {/* ================= LIVE GOLD MARKET ================= */}

        <div className="bg-zinc-900 border border-yellow-500 rounded-3xl p-6 mb-10">

          <div className="flex justify-between items-center mb-6 flex-wrap gap-3">

            <div>
              <h2 className="text-3xl font-black text-yellow-400">
                Live Gold Market
              </h2>

              <p className="text-gray-400">
                Admin Controlled Market Prices
              </p>
            </div>

            <span
              className={`px-4 py-2 rounded-full font-bold ${
                market.goldTradingEnabled
                  ? "bg-green-600 text-white"
                  : "bg-red-600 text-white"
              }`}
            >
              {market.goldTradingEnabled
                ? "MARKET OPEN"
                : "MARKET CLOSED"}
            </span>

          </div>

          <div className="grid md:grid-cols-2 gap-6">

            {/* Buy Price */}
            <div className="bg-black rounded-2xl p-6 border border-green-600">

              <p className="text-gray-400 mb-2">
                Buy Gold Price
              </p>

              <h2 className="text-5xl font-black text-green-400">
                PKR {market.buyGoldPrice.toLocaleString()}
              </h2>

              <p className="text-sm text-gray-500 mt-3">
                Per Gram
              </p>

            </div>

            {/* Sell Price */}
            <div className="bg-black rounded-2xl p-6 border border-red-600">

              <p className="text-gray-400 mb-2">
                Sell Gold Price
              </p>

              <h2 className="text-5xl font-black text-red-400">
                PKR {market.sellGoldPrice.toLocaleString()}
              </h2>

              <p className="text-sm text-gray-500 mt-3">
                Per Gram
              </p>

            </div>

          </div>

        </div>

        {/* ================= VIP & REWARDS SUMMARY ================= */}

        <div className="grid lg:grid-cols-2 gap-6 mb-10">

          {/* VIP Card */}
          <div className="bg-zinc-900 border border-yellow-500 rounded-3xl p-6">

            <div className="flex items-center gap-3 mb-5">
              <Crown className="text-yellow-400" size={30}/>
              <h2 className="text-2xl font-black text-yellow-400">
                VIP Membership Summary
              </h2>
            </div>

            <div className="space-y-4">

              <div className="flex justify-between items-center bg-black p-4 rounded-xl">
                <span>Silver Members</span>
                <span className="text-gray-300 font-bold">
                  Included in VIP Users
                </span>
              </div>

              <div className="flex justify-between items-center bg-black p-4 rounded-xl">
                <span>Gold Members</span>
                <span className="text-yellow-400 font-bold">
                  Included in VIP Users
                </span>
              </div>

              <div className="flex justify-between items-center bg-black p-4 rounded-xl">
                <span>Diamond Members</span>
                <span className="text-cyan-400 font-bold">
                  Included in VIP Users
                </span>
              </div>

            </div>

          </div>

          {/* Cashback Card */}
          <div className="bg-zinc-900 border border-pink-500 rounded-3xl p-6">

            <div className="flex items-center gap-3 mb-5">
              <Gift className="text-pink-400" size={30}/>
              <h2 className="text-2xl font-black text-pink-400">
                Cashback Campaign Summary
              </h2>
            </div>

            <div className="space-y-4">

              <div className="bg-black p-4 rounded-xl">
                <p className="text-gray-400 text-sm">
                  Cashback Distributed
                </p>

                <h2 className="text-4xl font-black text-pink-400">
                  PKR {stats.cashbackPaid.toLocaleString()}
                </h2>
              </div>

              <div className="bg-black p-4 rounded-xl">
                <p className="text-gray-400 text-sm">
                  Lucky Draw Campaign
                </p>

                <div className="flex items-center gap-2 mt-2">
                  <Trophy className="text-yellow-400"/>
                  <span className="font-bold text-yellow-300">
                    Enabled by Admin Settings
                  </span>
                </div>
              </div>

            </div>

          </div>

        </div>
{/* ================= PENDING DEPOSITS ================= */}

<div className="bg-zinc-900 border border-green-600 rounded-3xl p-6 mb-10">
  <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
    <div>
      <h2 className="text-3xl font-black text-green-400">
        Pending Deposit Requests
      </h2>

      <p className="text-gray-400">Waiting for Admin Approval</p>
    </div>

    <span className="bg-green-600 px-4 py-2 rounded-full font-bold">
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
          <th className="p-3 text-center">Action</th>
        </tr>
      </thead>

      <tbody>
        {pendingDeposits.length === 0 ? (
          <tr>
            <td colSpan={6} className="text-center py-8 text-gray-500">
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

              <td className="p-3 text-gray-300">{deposit.method}</td>

              <td className="p-3 text-gray-400">
                {new Date(deposit.createdAt).toLocaleDateString()}
              </td>

              <td className="p-3">
                <span className="bg-yellow-500 text-black px-3 py-1 rounded-full text-xs font-bold">
                  {deposit.status}
                </span>
              </td>

              <td className="p-3">
                <div className="flex justify-center gap-2">
                  <button
                    onClick={() => approveDeposit(deposit._id)}
                    className="bg-green-600 hover:bg-green-500 px-3 py-2 rounded-lg text-sm font-bold text-white"
                  >
                    Approve
                  </button>

                  <button
                    onClick={() => rejectDeposit(deposit._id)}
                    className="bg-red-600 hover:bg-red-500 px-3 py-2 rounded-lg text-sm font-bold text-white"
                  >
                    Reject
                  </button>
                </div>
              </td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  </div>
</div>

        {/* ================= PENDING WITHDRAWALS ================= */}

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

            <span className="bg-red-600 px-4 py-2 rounded-full font-bold">
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
                  <th className="p-3">Action</th>
                </tr>

              </thead>

              <tbody>

                {pendingWithdrawals.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-gray-500">
                      No Pending Withdrawals
                    </td>
                  </tr>
                ) : (
                  pendingWithdrawals.map((withdraw) => (
                    <tr
                      key={withdraw._id}
                      className="border-b border-zinc-800 hover:bg-black"
                    >
                      <td className="p-3 font-semibold text-white">
                        {withdraw.username}
                      </td>

                      <td className="p-3 text-red-400 font-bold">
                        PKR {withdraw.amount.toLocaleString()}
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

                      <td className="p-3">

                        <div className="flex gap-2">

                          <button
                            onClick={() => approveWithdraw(withdraw._id)}
                            className="bg-green-600 hover:bg-green-500 px-3 py-2 rounded-lg text-sm font-bold"
                          >
                            Approve
                          </button>

                          <button
                            onClick={() => rejectWithdraw(withdraw._id)}
                            className="bg-red-600 hover:bg-red-500 px-3 py-2 rounded-lg text-sm font-bold"
                          >
                            Reject
                          </button>

                        </div>

                      </td>

                    </tr>
                  ))
                )}

              </tbody>

            </table>

          </div>

        </div>        {/* ================= QUICK ACTION CENTER ================= */}

        <div className="bg-zinc-900 border border-yellow-500 rounded-3xl p-6 mb-10">

          <div className="flex items-center gap-3 mb-6">
            <Settings className="text-yellow-400" size={30}/>
            <h2 className="text-3xl font-black text-yellow-400">
              Admin Quick Actions
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">

            <Link
              href="/admin/users"
              className="bg-black hover:bg-zinc-800 border border-yellow-500 rounded-2xl p-5 transition"
            >
              <Users className="text-yellow-400 mb-4" size={34}/>
              <h3 className="font-bold text-xl text-yellow-400">
                User Manager
              </h3>
              <p className="text-gray-400 text-sm mt-2">
                Manage users, freeze wallets, block accounts, and update balances.
              </p>
            </Link>

            <Link
              href="/admin/deposits"
              className="bg-black hover:bg-zinc-800 border border-green-500 rounded-2xl p-5 transition"
            >
              <ArrowDownCircle className="text-green-400 mb-4" size={34}/>
              <h3 className="font-bold text-xl text-green-400">
                Deposit Manager
              </h3>
              <p className="text-gray-400 text-sm mt-2">
                Approve or reject deposit requests and review payment receipts.
              </p>
            </Link>

            <Link
              href="/admin/withdrawals"
              className="bg-black hover:bg-zinc-800 border border-red-500 rounded-2xl p-5 transition"
            >
              <ArrowUpCircle className="text-red-400 mb-4" size={34}/>
              <h3 className="font-bold text-xl text-red-400">
                Withdrawal Manager
              </h3>
              <p className="text-gray-400 text-sm mt-2">
                Approve withdrawals and monitor payment requests.
              </p>
            </Link>

            <Link
              href="/admin/settings"
              className="bg-black hover:bg-zinc-800 border border-blue-500 rounded-2xl p-5 transition"
            >
              <Settings className="text-blue-400 mb-4" size={34}/>
              <h3 className="font-bold text-xl text-blue-400">
                Trading Settings
              </h3>
              <p className="text-gray-400 text-sm mt-2">
                Update Buy/Sell Gold price, cashback rate, VIP limits and Lucky Draw.
              </p>
            </Link>

            <Link
              href="/admin/reports"
              className="bg-black hover:bg-zinc-800 border border-purple-500 rounded-2xl p-5 transition"
            >
              <TrendingUp className="text-purple-400 mb-4" size={34}/>
              <h3 className="font-bold text-xl text-purple-400">
                Reports & Analytics
              </h3>
              <p className="text-gray-400 text-sm mt-2">
                Revenue, deposits, withdrawals, cashback and trading reports.
              </p>
            </Link>

            <Link
              href="/admin/market"
              className="bg-black hover:bg-zinc-800 border border-orange-500 rounded-2xl p-5 transition"
            >
              <Wallet className="text-orange-400 mb-4" size={34}/>
              <h3 className="font-bold text-xl text-orange-400">
                Gold Market Control
              </h3>
              <p className="text-gray-400 text-sm mt-2">
                Enable/Disable trading and monitor live market prices.
              </p>
            </Link>

          </div>

        </div>

        {/* ================= SYSTEM STATUS ================= */}

        <div className="bg-zinc-900 border border-cyan-500 rounded-3xl p-6 mb-10">

          <div className="flex items-center gap-3 mb-6">
            <ShieldCheck className="text-cyan-400" size={30}/>
            <h2 className="text-3xl font-black text-cyan-400">
              GoldTrade System Status
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">

            <div className="bg-black rounded-xl p-5 border border-green-600 text-center">
              <p className="text-gray-400 text-sm mb-2">Backend API</p>
              <span className="bg-green-600 px-4 py-2 rounded-full font-bold">
                ONLINE
              </span>
            </div>

            <div className="bg-black rounded-xl p-5 border border-yellow-600 text-center">
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

            <div className="bg-black rounded-xl p-5 border border-blue-600 text-center">
              <p className="text-gray-400 text-sm mb-2">Database</p>
              <span className="bg-blue-600 px-4 py-2 rounded-full font-bold">
                CONNECTED
              </span>
            </div>

            <div className="bg-black rounded-xl p-5 border border-purple-600 text-center">
              <p className="text-gray-400 text-sm mb-2">Auto Refresh</p>
              <span className="bg-purple-600 px-4 py-2 rounded-full font-bold">
                30 SEC
              </span>
            </div>

          </div>

        </div>

        {/* ================= ADMIN LOGOUT ================= */}

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
              className="bg-white hover:bg-gray-200 text-red-700 font-black px-8 py-4 rounded-xl flex items-center gap-3"
            >
              <LogOut size={22}/>
              Logout
            </button>

          </div>

        </div>

        {/* ================= FOOTER ================= */}

        <footer className="border-t border-yellow-500 pt-8 pb-6">

          <div className="grid lg:grid-cols-3 gap-6 mb-8">

            <div>
              <h2 className="text-3xl font-black text-yellow-400 mb-3">
                GoldTrade Admin
              </h2>

              <p className="text-gray-400 text-sm">
                Production Administration Dashboard for GoldTrade Platform.
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
                <li>Trading Settings</li>
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
              © 2026 GoldTrade Admin Panel — All Rights Reserved.
            </p>

            <div className="flex gap-5 text-sm text-gray-400">
              <Link href="/admin/settings" className="hover:text-yellow-400">
                Settings
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