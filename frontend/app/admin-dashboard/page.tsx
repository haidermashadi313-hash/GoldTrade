"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  LayoutDashboard,
  Wallet,
  Coins,
  DollarSign,
  Users,
  RefreshCw,
  ArrowDownCircle,
  ArrowUpCircle,
} from "lucide-react";

const API =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

// ========================================
// TYPES
// ========================================

interface DashboardStats {
  totalUsers: number;
  totalDeposits: number;
  totalWithdraws: number;
  totalGoldVolume: number;
  totalUsdtVolume: number;
  totalWalletBalance: number;
  pendingDeposits: number;
  pendingWithdraws: number;
}

const defaultStats: DashboardStats = {
  totalUsers: 0,
  totalDeposits: 0,
  totalWithdraws: 0,
  totalGoldVolume: 0,
  totalUsdtVolume: 0,
  totalWalletBalance: 0,
  pendingDeposits: 0,
  pendingWithdraws: 0,
};

export default function AdminDashboardPage() {
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("token") || ""
      : "";

  const headers = {
    Authorization: `Bearer ${token}`,
  };

  const [stats, setStats] =
    useState<DashboardStats>(defaultStats);

  const [loading, setLoading] = useState(true);

  // ========================================
  // LOAD DASHBOARD
  // ========================================

  const loadDashboard = async () => {
    try {
      setLoading(true);

      const response = await fetch(
        `${API}/api/gold/admin/dashboard`,
        {
          headers,
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        setStats({
          totalUsers: data.totalUsers || 0,
          totalDeposits: data.totalDeposits || 0,
          totalWithdraws: data.totalWithdraws || 0,
          totalGoldVolume: data.totalGoldVolume || 0,
          totalUsdtVolume: data.totalUsdtVolume || 0,
          totalWalletBalance: data.totalWalletBalance || 0,
          pendingDeposits: data.pendingDeposits || 0,
          pendingWithdraws: data.pendingWithdraws || 0,
        });
      } else {
        setStats(defaultStats);
      }
    } catch (err) {
      console.error("Dashboard Error:", err);
      setStats(defaultStats);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) {
      window.location.href = "/login";
      return;
    }

    loadDashboard();
  }, []);  // ========================================
  // LOADING SCREEN
  // ========================================

  if (loading) {
    return (
      <main className="min-h-screen bg-black flex items-center justify-center text-yellow-400">
        <RefreshCw className="animate-spin mr-3" size={26} />
        Loading Admin Dashboard...
      </main>
    );
  }

  // ========================================
  // UI
  // ========================================

  return (
    <main className="min-h-screen bg-black text-white p-6">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* ================= HEADER ================= */}

        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="flex items-center gap-3 text-4xl font-black text-yellow-400">
              <LayoutDashboard size={38} />
              GoldTrade V18 Admin Dashboard
            </h1>

            <p className="text-gray-400 mt-2">
              Complete overview of users, wallets, deposits, withdrawals, Gold and USDT trading.
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

        {/* ================= SUMMARY CARDS ================= */}

        <section className="grid md:grid-cols-2 xl:grid-cols-4 gap-5">

          <DashboardCard
            title="Total Users"
            value={stats.totalUsers.toLocaleString()}
            color="cyan"
            icon={<Users size={30} />}
          />

          <DashboardCard
            title="Wallet Balance"
            value={`PKR ${stats.totalWalletBalance.toLocaleString()}`}
            color="green"
            icon={<Wallet size={30} />}
          />

          <DashboardCard
            title="Gold Volume"
            value={`${stats.totalGoldVolume.toLocaleString()} g`}
            color="yellow"
            icon={<Coins size={30} />}
          />

          <DashboardCard
            title="USDT Volume"
            value={stats.totalUsdtVolume.toLocaleString()}
            color="blue"
            icon={<DollarSign size={30} />}
          />

        </section>

        {/* ================= DEPOSITS / WITHDRAWS ================= */}

        <section className="grid lg:grid-cols-2 gap-6">

          <div className="bg-zinc-900 border border-green-500 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <ArrowDownCircle
                size={28}
                className="text-green-400"
              />

              <h2 className="text-2xl font-black text-green-400">
                Deposits
              </h2>
            </div>

            <p className="text-gray-400">Total Deposits</p>

            <h3 className="text-3xl font-black text-white mt-2">
              PKR {stats.totalDeposits.toLocaleString()}
            </h3>

            <div className="mt-5 bg-zinc-800 rounded-xl p-4">
              <p className="text-sm text-gray-400">
                Pending Deposit Requests
              </p>

              <h4 className="text-2xl font-bold text-yellow-400 mt-2">
                {stats.pendingDeposits}
              </h4>
            </div>

            <Link
              href="/admin/deposits"
              className="mt-5 inline-flex items-center justify-center bg-green-600 hover:bg-green-700 px-5 py-3 rounded-xl font-bold"
            >
              Manage Deposits
            </Link>
          </div>

          <div className="bg-zinc-900 border border-red-500 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <ArrowUpCircle
                size={28}
                className="text-red-400"
              />

              <h2 className="text-2xl font-black text-red-400">
                Withdrawals
              </h2>
            </div>

            <p className="text-gray-400">Total Withdrawals</p>

            <h3 className="text-3xl font-black text-white mt-2">
              PKR {stats.totalWithdraws.toLocaleString()}
            </h3>

            <div className="mt-5 bg-zinc-800 rounded-xl p-4">
              <p className="text-sm text-gray-400">
                Pending Withdrawal Requests
              </p>

              <h4 className="text-2xl font-bold text-yellow-400 mt-2">
                {stats.pendingWithdraws}
              </h4>
            </div>

            <Link
              href="/admin/withdraws"
              className="mt-5 inline-flex items-center justify-center bg-red-600 hover:bg-red-700 px-5 py-3 rounded-xl font-bold"
            >
              Manage Withdrawals
            </Link>
          </div>

        </section>

        {/* ================= QUICK ACTIONS ================= */}

        <section className="bg-zinc-900 border border-yellow-500 rounded-2xl p-6">
          <h2 className="text-2xl font-black text-yellow-400 mb-6">
            Admin Quick Actions
          </h2>

          <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">

            <QuickButton
              href="/admin/users"
              icon={<Users size={24} />}
              title="Manage Users"
              color="cyan"
            />

            <QuickButton
              href="/admin/wallet"
              icon={<Wallet size={24} />}
              title="Wallet Manager"
              color="green"
            />

            <QuickButton
              href="/admin/wallet-history"
              icon={<Wallet size={24} />}
              title="Wallet History"
              color="yellow"
            />

            <QuickButton
              href="/admin/settings"
              icon={<Coins size={24} />}
              title="Market Settings"
              color="purple"
            />

          </div>
        </section>        {/* ================= ADMIN NAVIGATION ================= */}

        <section className="bg-zinc-900 border border-cyan-500 rounded-2xl p-6">
          <h2 className="text-2xl font-black text-cyan-400 mb-6">
            Admin Navigation
          </h2>

          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">

            <QuickButton
              href="/admin/deposits"
              icon={<ArrowDownCircle size={24} />}
              title="Deposit Requests"
              color="green"
            />

            <QuickButton
              href="/admin/withdraws"
              icon={<ArrowUpCircle size={24} />}
              title="Withdraw Requests"
              color="red"
            />

            <QuickButton
              href="/admin/wallet-manager"
              icon={<Wallet size={24} />}
              title="Wallet Manager"
              color="yellow"
            />

            <QuickButton
              href="/admin/wallet-history"
              icon={<Wallet size={24} />}
              title="Wallet History"
              color="blue"
            />

            <QuickButton
              href="/admin/users"
              icon={<Users size={24} />}
              title="User Management"
              color="cyan"
            />

            <QuickButton
              href="/admin/settings"
              icon={<Coins size={24} />}
              title="Gold Market Settings"
              color="purple"
            />

          </div>
        </section>

      </div>
    </main>
  );
}

// ========================================
// DASHBOARD CARD COMPONENT
// ========================================

function DashboardCard({
  title,
  value,
  icon,
  color,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  color: "green" | "red" | "yellow" | "blue" | "cyan" | "purple";
}) {
  const colorMap = {
    green: "border-green-500 text-green-400",
    red: "border-red-500 text-red-400",
    yellow: "border-yellow-500 text-yellow-400",
    blue: "border-blue-500 text-blue-400",
    cyan: "border-cyan-500 text-cyan-400",
    purple: "border-purple-500 text-purple-400",
  };

  return (
    <div
      className={`bg-zinc-900 border rounded-2xl p-6 ${colorMap[color]}`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className={colorMap[color]}>{icon}</div>
      </div>

      <p className="text-gray-400 text-sm">{title}</p>

      <h2 className={`text-3xl font-black mt-2 ${colorMap[color]}`}>
        {value}
      </h2>
    </div>
  );
}

// ========================================
// QUICK BUTTON COMPONENT
// ========================================

function QuickButton({
  href,
  icon,
  title,
  color,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  color: "green" | "red" | "yellow" | "blue" | "cyan" | "purple";
}) {
  const colorMap = {
    green: "bg-green-600 hover:bg-green-700",
    red: "bg-red-600 hover:bg-red-700",
    yellow: "bg-yellow-500 hover:bg-yellow-400 text-black",
    blue: "bg-blue-600 hover:bg-blue-700",
    cyan: "bg-cyan-600 hover:bg-cyan-700",
    purple: "bg-purple-600 hover:bg-purple-700",
  };

  return (
    <Link
      href={href}
      className={`${colorMap[color]} rounded-xl p-5 flex flex-col items-center justify-center gap-3 font-bold transition duration-200`}
    >
      {icon}
      <span>{title}</span>
    </Link>
  );
}