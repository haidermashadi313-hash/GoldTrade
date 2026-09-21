"use client";

// =======================================================
// GoldTrade V18 Enterprise
// Admin Dashboard
// PART 1/2
// =======================================================

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Wallet,
  Coins,
  DollarSign,
  ArrowDownCircle,
  ArrowUpCircle,
  RefreshCw,
  TrendingUp,
  Activity,
  Settings,
} from "lucide-react";

// =======================================================
// API URL
// =======================================================

const API =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://goldtrade-cky2.onrender.com";

// =======================================================
// TYPES
// =======================================================

interface DashboardStats {
  totalUsers: number;
  totalDeposits: number;
  totalWithdraws: number;

  totalWalletBalance: number;
  totalGoldVolume: number;
  totalUsdtVolume: number;

  pendingDeposits: number;
  pendingWithdraws: number;

  buyGoldPrice: number;
  sellGoldPrice: number;
  usdtRate: number;

  marketStatus: string;
}

const defaultStats: DashboardStats = {
  totalUsers: 0,
  totalDeposits: 0,
  totalWithdraws: 0,

  totalWalletBalance: 0,
  totalGoldVolume: 0,
  totalUsdtVolume: 0,

  pendingDeposits: 0,
  pendingWithdraws: 0,

  buyGoldPrice: 0,
  sellGoldPrice: 0,
  usdtRate: 0,

  marketStatus: "Closed",
};

// =======================================================
// PAGE
// =======================================================

export default function AdminDashboardPage() {
  const router = useRouter();

  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("token") || ""
      : "";

  const role =
    typeof window !== "undefined"
      ? localStorage.getItem("role") || ""
      : "";

  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  const [stats, setStats] =
    useState<DashboardStats>(defaultStats);

  const [loading, setLoading] = useState(true);

  // =======================================================
  // AUTH CHECK
  // =======================================================

  useEffect(() => {
    if (!token) {
      router.push("/login");
      return;
    }

    if (role !== "admin") {
      router.push("/dashboard");
      return;
    }

    loadDashboard();
  }, []);

  // =======================================================
  // LOAD DASHBOARD
  // =======================================================

  const loadDashboard = async () => {
    try {
      setLoading(true);

      const [
        dashboardRes,
        goldPriceRes,
        usdtRes,
      ] = await Promise.all([
        fetch(`${API}/api/usdt/admin/dashboard`, {
          headers,
          cache: "no-store",
        }),

        fetch(`${API}/api/gold/price`, {
          cache: "no-store",
        }),

        fetch(`${API}/api/usdt/rate`, {
          cache: "no-store",
        }),
      ]);

      const dashboard = await dashboardRes.json();
      const gold = await goldPriceRes.json();
      const usdt = await usdtRes.json();

      setStats({
        totalUsers: Number(
          dashboard.totalUsers ?? 0
        ),

        totalDeposits: Number(
          dashboard.totalDeposits ?? 0
        ),

        totalWithdraws: Number(
          dashboard.totalWithdraws ?? 0
        ),

        totalWalletBalance: Number(
          dashboard.totalWalletBalance ?? 0
        ),

        totalGoldVolume: Number(
          dashboard.totalGoldVolume ?? 0
        ),

        totalUsdtVolume: Number(
          dashboard.totalUsdtVolume ?? 0
        ),

        pendingDeposits: Number(
          dashboard.pendingDeposits ?? 0
        ),

        pendingWithdraws: Number(
          dashboard.pendingWithdraws ?? 0
        ),

        buyGoldPrice: Number(
          gold.buyPrice ?? 0
        ),

        sellGoldPrice: Number(
          gold.sellPrice ?? 0
        ),

        usdtRate: Number(
          usdt.rate ?? 0
        ),

        marketStatus:
          gold.marketStatus || "Closed",
      });
    } catch (error) {
      console.error("Dashboard Error:", error);
      setStats(defaultStats);
    } finally {
      setLoading(false);
    }
  };

  // =======================================================
  // LOADING
  // =======================================================

  if (loading) {
    return (
      <main className="min-h-screen bg-black flex items-center justify-center text-yellow-400">
        <RefreshCw
          className="animate-spin mr-3"
          size={28}
        />
        Loading Dashboard...
      </main>
    );
  }

  // =======================================================
  // PAGE START
  // =======================================================

  return (
    <main className="min-h-screen bg-black text-white p-6">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* ================= HEADER ================= */}

        <header className="flex flex-wrap justify-between items-center gap-4">

          <div>

            <h1 className="flex items-center gap-3 text-4xl font-black text-yellow-400">
              <LayoutDashboard size={38} />
              GoldTrade Admin Dashboard
            </h1>

            <p className="text-gray-400 mt-2">
              GoldTrade V18 Enterprise Control Panel
            </p>

          </div>

          <button
            onClick={loadDashboard}
            className="bg-yellow-500 hover:bg-yellow-400 text-black px-5 py-3 rounded-xl flex items-center gap-2 font-bold"
          >
            <RefreshCw size={18} />
            Refresh Dashboard
          </button>

        </header>
        

        {/* ================= MARKET STATUS ================= */}

        <section className="grid md:grid-cols-4 gap-5">

          <div className="bg-zinc-900 border border-green-500 rounded-2xl p-5">
            <p className="text-gray-400 text-sm">
              Buy Gold
            </p>

            <h2 className="text-2xl font-black text-green-400 mt-2">
              PKR {stats.buyGoldPrice.toLocaleString()}
            </h2>
          </div>

          <div className="bg-zinc-900 border border-red-500 rounded-2xl p-5">
            <p className="text-gray-400 text-sm">
              Sell Gold
            </p>

            <h2 className="text-2xl font-black text-red-400 mt-2">
              PKR {stats.sellGoldPrice.toLocaleString()}
            </h2>
          </div>

          <div className="bg-zinc-900 border border-blue-500 rounded-2xl p-5">
            <p className="text-gray-400 text-sm">
              USDT Rate
            </p>

            <h2 className="text-2xl font-black text-blue-400 mt-2">
              PKR {stats.usdtRate.toLocaleString()}
            </h2>
          </div>

          <div
            className={`rounded-2xl p-5 border ${
              stats.marketStatus === "Open"
                ? "bg-green-900/30 border-green-500"
                : "bg-red-900/30 border-red-500"
            }`}
          >
            <p className="text-gray-400 text-sm">
              Market Status
            </p>

            <h2
              className={`text-2xl font-black mt-2 ${
                stats.marketStatus === "Open"
                  ? "text-green-400"
                  : "text-red-400"
              }`}
            >
              {stats.marketStatus}
            </h2>
          </div>

        </section>

        {/* ================= SUMMARY CARDS ================= */}

        <section className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">

          <div className="bg-zinc-900 border border-cyan-500 rounded-2xl p-5">
            <Users className="text-cyan-400 mb-3" size={28} />

            <p className="text-gray-400 text-sm">
              Total Users
            </p>

            <h2 className="text-3xl font-black text-cyan-400 mt-2">
              {stats.totalUsers}
            </h2>
          </div>

          <div className="bg-zinc-900 border border-green-500 rounded-2xl p-5">
            <Wallet className="text-green-400 mb-3" size={28} />

            <p className="text-gray-400 text-sm">
              Wallet Balance
            </p>

            <h2 className="text-xl font-black text-green-400 mt-2">
              PKR {stats.totalWalletBalance.toLocaleString()}
            </h2>
          </div>

          <div className="bg-zinc-900 border border-yellow-500 rounded-2xl p-5">
            <Coins className="text-yellow-400 mb-3" size={28} />

            <p className="text-gray-400 text-sm">
              Gold Volume
            </p>

            <h2 className="text-xl font-black text-yellow-400 mt-2">
              {stats.totalGoldVolume.toFixed(2)} g
            </h2>
          </div>

          <div className="bg-zinc-900 border border-blue-500 rounded-2xl p-5">
            <DollarSign className="text-blue-400 mb-3" size={28} />

            <p className="text-gray-400 text-sm">
              USDT Volume
            </p>

            <h2 className="text-xl font-black text-blue-400 mt-2">
              {stats.totalUsdtVolume.toFixed(2)}
            </h2>
          </div>

        </section>

        {/* ======================================================= */}
        {/* QUICK ACTIONS */}
        {/* ======================================================= */}

        <section className="bg-zinc-900 border border-yellow-500 rounded-2xl p-6">

          <h2 className="text-2xl font-black text-yellow-400 mb-5">
            Quick Actions
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">

            <Link
              href="/admin/users"
              className="bg-cyan-600 hover:bg-cyan-700 rounded-xl p-5 flex flex-col gap-3 transition"
            >
              <Users size={32} />
              <span className="font-bold text-lg">Manage Users</span>
              <span className="text-sm opacity-80">
                View and manage all registered users.
              </span>
            </Link>

            <Link
              href="/admin/wallet-manager"
              className="bg-green-600 hover:bg-green-700 rounded-xl p-5 flex flex-col gap-3 transition"
            >
              <Wallet size={32} />
              <span className="font-bold text-lg">Wallet Manager</span>
              <span className="text-sm opacity-80">
                Credit or debit PKR, Gold and USDT balances.
              </span>
            </Link>

            <Link
              href="/admin/deposits"
              className="bg-yellow-600 hover:bg-yellow-700 rounded-xl p-5 flex flex-col gap-3 transition"
            >
              <ArrowDownCircle size={32} />
              <span className="font-bold text-lg">Deposit Requests</span>
              <span className="text-sm opacity-80">
                Approve or reject user deposits.
              </span>
            </Link>

            <Link
              href="/admin/withdraw"
              className="bg-red-600 hover:bg-red-700 rounded-xl p-5 flex flex-col gap-3 transition"
            >
              <ArrowUpCircle size={32} />
              <span className="font-bold text-lg">Withdraw Requests</span>
              <span className="text-sm opacity-80">
                Process withdrawal requests securely.
              </span>
            </Link>

          </div>

        </section>

        {/* ======================================================= */}
        {/* LIVE REQUEST STATUS */}
        {/* ======================================================= */}

        <section className="grid lg:grid-cols-2 gap-6">

          {/* Pending Deposits */}

          <div className="bg-zinc-900 border border-green-500 rounded-2xl p-6">

            <div className="flex justify-between items-center mb-4">

              <h2 className="text-xl font-black text-green-400">
                Pending Deposits
              </h2>

              <ArrowDownCircle className="text-green-400" size={26} />

            </div>

            <div className="text-5xl font-black text-green-400 mb-3">
              {stats.pendingDeposits}
            </div>

            <p className="text-gray-400 mb-5">
              Waiting for admin approval.
            </p>

            <Link
              href="/admin/deposits"
              className="inline-flex items-center justify-center bg-green-600 hover:bg-green-700 px-5 py-3 rounded-xl font-bold"
            >
              Manage Deposits
            </Link>

          </div>

          {/* Pending Withdraws */}

          <div className="bg-zinc-900 border border-red-500 rounded-2xl p-6">

            <div className="flex justify-between items-center mb-4">

              <h2 className="text-xl font-black text-red-400">
                Pending Withdrawals
              </h2>

              <ArrowUpCircle className="text-red-400" size={26} />

            </div>

            <div className="text-5xl font-black text-red-400 mb-3">
              {stats.pendingWithdraws}
            </div>

            <p className="text-gray-400 mb-5">
              Waiting for payment processing.
            </p>

            <Link
              href="/admin/withdraw"
              className="inline-flex items-center justify-center bg-red-600 hover:bg-red-700 px-5 py-3 rounded-xl font-bold"
            >
              Manage Withdrawals
            </Link>

          </div>

        </section>

        {/* ======================================================= */}
        {/* PLATFORM ANALYTICS */}
        {/* ======================================================= */}

        <section className="grid md:grid-cols-3 gap-5">

          <div className="bg-zinc-900 border border-purple-500 rounded-2xl p-5">

            <Activity className="text-purple-400 mb-3" size={28} />

            <p className="text-gray-400 text-sm">
              Deposit Requests
            </p>

            <h2 className="text-3xl font-black text-purple-400 mt-2">
              {stats.totalDeposits}
            </h2>

          </div>

          <div className="bg-zinc-900 border border-orange-500 rounded-2xl p-5">

            <ArrowUpCircle className="text-orange-400 mb-3" size={28} />

            <p className="text-gray-400 text-sm">
              Withdraw Requests
            </p>

            <h2 className="text-3xl font-black text-orange-400 mt-2">
              {stats.totalWithdraws}
            </h2>

          </div>

          <div className="bg-zinc-900 border border-indigo-500 rounded-2xl p-5">

            <TrendingUp className="text-indigo-400 mb-3" size={28} />

            <p className="text-gray-400 text-sm">
              Trading Volume
            </p>

            <h2 className="text-2xl font-black text-indigo-400 mt-2">
              {(stats.totalGoldVolume + stats.totalUsdtVolume).toFixed(2)}
            </h2>

            <p className="text-xs text-gray-500 mt-2">
              Gold + USDT Combined Volume
            </p>

          </div>

        </section>

        {/* ======================================================= */}
        {/* ADMIN MODULES */}
        {/* ======================================================= */}

        <section className="bg-zinc-900 border border-cyan-500 rounded-2xl p-6">

          <h2 className="text-2xl font-black text-cyan-400 mb-5">
            Administration Modules
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">

            <Link
              href="/admin/gold-settings"
              className="bg-yellow-600 hover:bg-yellow-700 rounded-xl p-4 flex flex-col gap-2 transition"
            >
              <Coins size={28} />
              <span className="font-bold">Gold Settings</span>
              <span className="text-xs opacity-80">
                Update buy/sell prices and market status.
              </span>
            </Link>

            <Link
              href="/admin/usdt-settings"
              className="bg-blue-600 hover:bg-blue-700 rounded-xl p-4 flex flex-col gap-2 transition"
            >
              <DollarSign size={28} />
              <span className="font-bold">USDT Settings</span>
              <span className="text-xs opacity-80">
                Manage live USDT exchange rate.
              </span>
            </Link>

            <Link
              href="/admin/payment-settings"
              className="bg-purple-600 hover:bg-purple-700 rounded-xl p-4 flex flex-col gap-2 transition"
            >
              <Settings size={28} />
              <span className="font-bold">Payment Settings</span>
              <span className="text-xs opacity-80">
                Configure bank accounts and wallets.
              </span>
            </Link>

            <Link
              href="/admin/transactions"
              className="bg-cyan-700 hover:bg-cyan-800 rounded-xl p-4 flex flex-col gap-2 transition"
            >
              <Activity size={28} />
              <span className="font-bold">Transactions</span>
              <span className="text-xs opacity-80">
                View complete deposit, withdraw and trading history.
              </span>
            </Link>

          </div>

        </section>

        {/* ======================================================= */}
        {/* SYSTEM STATUS */}
        {/* ======================================================= */}

        <section className="bg-zinc-900 border border-green-500 rounded-2xl p-6">

          <h2 className="text-2xl font-black text-green-400 mb-5">
            GoldTrade Enterprise Status
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">

            <div className="bg-black rounded-xl p-4 border border-zinc-700">

              <p className="text-gray-500 text-xs">API</p>

              <p className="text-green-400 font-bold mt-2">
                Connected
              </p>

            </div>

            <div className="bg-black rounded-xl p-4 border border-zinc-700">

              <p className="text-gray-500 text-xs">Database</p>

              <p className="text-green-400 font-bold mt-2">
                Ai Powered.
              </p>

            </div>

            <div className="bg-black rounded-xl p-4 border border-zinc-700">

              <p className="text-gray-500 text-xs">Frontend</p>

              <p className="text-green-400 font-bold mt-2">
                Next.js Running
              </p>

            </div>

            <div className="bg-black rounded-xl p-4 border border-zinc-700">

              <p className="text-gray-500 text-xs">Server</p>

              <p className="text-green-400 font-bold mt-2">
                Render Online
              </p>

            </div>

          </div>

        </section>

      </div>
    </main>
  );
}