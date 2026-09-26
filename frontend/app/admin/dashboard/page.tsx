"use client";

// ==========================================================
// GoldTrade V18 Enterprise
// ADMIN DASHBOARD
// PART 1/8
// Production Ready (Render + Vercel + Linux)
// ==========================================================

import {
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  getSession,
  logout,
  type GoldTradeUser,
} from "@/lib/auth";

// ==========================================================
// API URL
// ==========================================================

const API =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://goldtrade-api.onrender.com";

// ==========================================================
// TYPES
// ==========================================================

interface DashboardStats {
  totalUsers: number;
  totalDeposits: number;
  totalWithdrawals: number;
  pendingDeposits: number;
  pendingWithdrawals: number;

  goldBuyPrice: number;
  goldSellPrice: number;

  usdtBuyPrice: number;
  usdtSellPrice: number;

  marketStatus: "OPEN" | "CLOSED";
}

interface Transaction {
  _id: string;
  username: string;
  type: string;
  amount: number;
  currency: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
}

interface DashboardResponse {
  success: boolean;
  message?: string;
  stats?: DashboardStats;
  transactions?: Transaction[];
}

// ==========================================================
// COMPONENT START
// ==========================================================

export default function AdminDashboardPage() {
  const router = useRouter();

  // ========================================================
  // SESSION
  // ========================================================

  const [admin, setAdmin] = useState<GoldTradeUser | null>(null);
  const [token, setToken] = useState("");

  const [checkingSession, setCheckingSession] = useState(true);

  // ========================================================
  // UI STATES
  // ========================================================

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [isOnline, setIsOnline] = useState(true);

  // ========================================================
  // DASHBOARD DATA
  // ========================================================

  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalDeposits: 0,
    totalWithdrawals: 0,
    pendingDeposits: 0,
    pendingWithdrawals: 0,

    goldBuyPrice: 0,
    goldSellPrice: 0,

    usdtBuyPrice: 0,
    usdtSellPrice: 0,

    marketStatus: "OPEN",
  });

  const [transactions, setTransactions] = useState<Transaction[]>([]);

  // ========================================================
  // PAGE TITLE
  // ========================================================

  useEffect(() => {
    document.title = "Admin Dashboard • GoldTrade V18 Enterprise";
  }, []);

  // ========================================================
  // NETWORK STATUS
  // ========================================================

  useEffect(() => {
    const updateNetworkStatus = () => {
      setIsOnline(window.navigator.onLine);
    };

    updateNetworkStatus();

    window.addEventListener("online", updateNetworkStatus);
    window.addEventListener("offline", updateNetworkStatus);

    return () => {
      window.removeEventListener("online", updateNetworkStatus);
      window.removeEventListener("offline", updateNetworkStatus);
    };
  }, []);

  // ========================================================
  // SESSION CHECK (ADMIN ONLY)
  // ========================================================

  useEffect(() => {
    const session = getSession();

    if (!session) {
      router.replace("/login");
      return;
    }

    if (session.user.role !== "admin") {
      router.replace("/dashboard");
      return;
    }

    setAdmin(session.user);
    setToken(session.token);
    setCheckingSession(false);
  }, [router]);
    // ========================================================
  // LOAD ADMIN DASHBOARD
  // ========================================================

  const loadDashboard = useCallback(async () => {
    const session = getSession();

    if (!session) {
      router.replace("/login");
      return;
    }

    try {
      setLoading(true);
      setErrorMessage("");

      const response = await fetch(`${API}/api/admin/dashboard`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${session.token}`,
          "Content-Type": "application/json",
        },
        cache: "no-store",
      });

      const data: DashboardResponse = await response.json();

      console.log("ADMIN DASHBOARD:", data);

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to load dashboard.");
      }

      if (data.stats) {
        setStats(data.stats);
      }

      if (Array.isArray(data.transactions)) {
        setTransactions(data.transactions);
      } else {
        setTransactions([]);
      }

      setSuccessMessage("Dashboard loaded successfully.");
    } catch (error: any) {
      console.error("Dashboard Error:", error);

      if (error.message?.includes("401")) {
        logout();
        return;
      }

      setErrorMessage(
        error.message || "Unable to load admin dashboard."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [router]);

  // ========================================================
  // INITIAL LOAD
  // ========================================================

  useEffect(() => {
    if (checkingSession) return;

    loadDashboard();
  }, [checkingSession, loadDashboard]);

  // ========================================================
  // REFRESH DASHBOARD
  // ========================================================

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadDashboard();
  }, [loadDashboard]);

  // ========================================================
  // LOGOUT
  // ========================================================

  const handleLogout = useCallback(() => {
    logout();
  }, []);

  // ========================================================
  // FORMAT HELPERS
  // ========================================================

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Number(value || 0));
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat("en-US").format(
      Number(value || 0)
    );
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  // ========================================================
  // DERIVED VALUES
  // ========================================================

  const totalPortfolio = useMemo(() => {
    return stats.totalDeposits - stats.totalWithdrawals;
  }, [stats]);

  const walletHealth = useMemo(() => {
    if (totalPortfolio > 1000000) return "Excellent";
    if (totalPortfolio > 500000) return "Healthy";
    if (totalPortfolio > 100000) return "Stable";
    return "Low";
  }, [totalPortfolio]);

  const marketStatusColor =
    stats.marketStatus === "OPEN"
      ? "text-green-400"
      : "text-red-400";

  const marketStatusBg =
    stats.marketStatus === "OPEN"
      ? "bg-green-500/10 border-green-500/30"
      : "bg-red-500/10 border-red-500/30";
        // ========================================================
  // DASHBOARD MODELS
  // ========================================================

  const walletCards = useMemo(
    () => [
      {
        title: "Total Users",
        value: stats.totalUsers,
        color: "text-purple-400",
        border: "border-purple-500/20",
      },
      {
        title: "Total Deposits",
        value: stats.totalDeposits,
        color: "text-green-400",
        border: "border-green-500/20",
      },
      {
        title: "Total Withdrawals",
        value: stats.totalWithdrawals,
        color: "text-red-400",
        border: "border-red-500/20",
      },
      {
        title: "Pending Deposits",
        value: stats.pendingDeposits,
        color: "text-blue-400",
        border: "border-blue-500/20",
      },
      {
        title: "Pending Withdrawals",
        value: stats.pendingWithdrawals,
        color: "text-orange-400",
        border: "border-orange-500/20",
      },
      {
        title: "Portfolio Value",
        value: totalPortfolio,
        color: "text-yellow-400",
        border: "border-yellow-500/20",
      },
    ],
    [stats, totalPortfolio]
  );

  const marketCards = useMemo(
    () => [
      {
        title: "Gold Buy Price",
        value: stats.goldBuyPrice,
        color: "text-yellow-400",
      },
      {
        title: "Gold Sell Price",
        value: stats.goldSellPrice,
        color: "text-yellow-300",
      },
      {
        title: "USDT Buy Price",
        value: stats.usdtBuyPrice,
        color: "text-green-400",
      },
      {
        title: "USDT Sell Price",
        value: stats.usdtSellPrice,
        color: "text-green-300",
      },
    ],
    [stats]
  );

  const quickActions = useMemo(
    () => [
      {
        title: "Users",
        href: "/admin/users",
        description: "Manage all registered users",
      },
      {
        title: "Deposits",
        href: "/admin/deposits",
        description: "Approve or reject deposits",
      },
      {
        title: "Withdrawals",
        href: "/admin/withdrawals",
        description: "Approve withdrawal requests",
      },
      {
        title: "Wallet",
        href: "/admin/wallet",
        description: "Wallet management center",
      },
      {
        title: "Gold Settings",
        href: "/admin/gold-settings",
        description: "Update live gold prices",
      },
      {
        title: "USDT Settings",
        href: "/admin/usdt-settings",
        description: "Manage USDT market prices",
      },
      {
        title: "Transactions",
        href: "/admin/transactions",
        description: "Complete transaction history",
      },
      {
        title: "Payment Settings",
        href: "/admin/payment-settings",
        description: "Bank & Crypto payment methods",
      },
    ],
    []
  );

  // ========================================================
  // LOADING SCREEN
  // ========================================================

  if (checkingSession) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black text-white">
        <div className="text-center">
          <div className="mx-auto mb-5 h-16 w-16 animate-spin rounded-full border-4 border-yellow-400 border-t-transparent"></div>

          <h2 className="text-2xl font-bold text-yellow-400">
            Loading Admin Dashboard...
          </h2>

          <p className="mt-2 text-gray-500">
            Verifying secure administrator session...
          </p>
        </div>
      </main>
    );
  }

  // ========================================================
  // DASHBOARD UI START
  // ========================================================

  return (
    <main className="min-h-screen bg-black text-white">

      <div className="mx-auto max-w-7xl px-4 py-6">

        {/* ================= HEADER ================= */}

        <div className="mb-8 rounded-3xl border border-yellow-500/20 bg-zinc-950 p-6">

          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">

            <div>
              <h1 className="text-3xl font-bold text-yellow-400">
                GoldTrade V18 Enterprise
              </h1>

              <p className="mt-2 text-gray-400">
                Welcome back,
                <span className="ml-2 font-semibold text-white">
                  {admin?.username || "Administrator"}
                </span>
              </p>

              <p className="text-xs text-gray-500">
                Secure JWT Authentication • Render Backend • Vercel Frontend
              </p>
            </div>

            <div className="flex gap-3">

              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="rounded-xl bg-yellow-500 px-5 py-3 font-semibold text-black transition hover:bg-yellow-400 disabled:opacity-50"
              >
                {refreshing ? "Refreshing..." : "Refresh"}
              </button>

              <button
                onClick={handleLogout}
                className="rounded-xl bg-red-600 px-5 py-3 font-semibold text-white transition hover:bg-red-500"
              >
                Logout
              </button>

            </div>

          </div>

        </div>

        {/* ================= CONNECTION WARNING ================= */}

        {!isOnline && (
          <div className="mb-5 rounded-2xl border border-orange-500/30 bg-orange-500/10 p-4 text-orange-400">
            Internet connection lost. Dashboard data may not update.
          </div>
        )}

        {/* ================= ERROR MESSAGE ================= */}

        {errorMessage && (
          <div className="mb-5 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-red-400">
            {errorMessage}
          </div>
        )}

        {/* ================= SUCCESS MESSAGE ================= */}

        {successMessage && (
          <div className="mb-5 rounded-2xl border border-green-500/30 bg-green-500/10 p-4 text-green-400">
            {successMessage}
          </div>
        )}

        {/* ================= DASHBOARD CONTENT START ================= */}

        {loading ? (
          <div className="flex items-center justify-center rounded-3xl border border-zinc-800 bg-zinc-950 py-24">

            <div className="text-center">

              <div className="mx-auto mb-5 h-14 w-14 animate-spin rounded-full border-4 border-yellow-400 border-t-transparent"></div>

              <h2 className="text-xl font-bold text-yellow-400">
                Loading Dashboard...
              </h2>

            </div>

          </div>
        ) : (
          <>            {/* ==================================================== */}
            {/* DASHBOARD OVERVIEW */}
            {/* PART 4/8 */}
            {/* ==================================================== */}

            <section className="mb-8">
              <div className="mb-5 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white">
                  Dashboard Overview
                </h2>

                <div
                  className={`rounded-full border px-4 py-2 text-sm font-semibold ${marketStatusBg} ${marketStatusColor}`}
                >
                  Market {stats.marketStatus}
                </div>
              </div>

              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {walletCards.map((card) => (
                  <div
                    key={card.title}
                    className={`rounded-3xl border bg-zinc-950 p-6 ${card.border}`}
                  >
                    <p className="text-sm text-gray-400">{card.title}</p>

                    <h3 className={`mt-3 text-3xl font-bold ${card.color}`}>
                      {card.title === "Total Users"
                        ? formatNumber(card.value)
                        : `PKR ${formatCurrency(card.value)}`}
                    </h3>
                  </div>
                ))}

                {/* Wallet Health */}

                <div className="rounded-3xl border border-blue-500/20 bg-zinc-950 p-6">
                  <p className="text-sm text-gray-400">Wallet Health</p>

                  <h3 className="mt-3 text-3xl font-bold text-blue-400">
                    {walletHealth}
                  </h3>

                  <p className="mt-2 text-xs text-gray-500">
                    Based on deposits and withdrawals.
                  </p>
                </div>

                {/* Market Status */}

                <div className="rounded-3xl border border-green-500/20 bg-zinc-950 p-6">
                  <p className="text-sm text-gray-400">Trading Status</p>

                  <h3 className={`mt-3 text-3xl font-bold ${marketStatusColor}`}>
                    {stats.marketStatus}
                  </h3>

                  <p className="mt-2 text-xs text-gray-500">
                    Live market status from backend.
                  </p>
                </div>

                {/* Network Status */}

                <div className="rounded-3xl border border-cyan-500/20 bg-zinc-950 p-6">
                  <p className="text-sm text-gray-400">Network</p>

                  <h3
                    className={`mt-3 text-3xl font-bold ${
                      isOnline ? "text-green-400" : "text-red-400"
                    }`}
                  >
                    {isOnline ? "ONLINE" : "OFFLINE"}
                  </h3>

                  <p className="mt-2 text-xs text-gray-500">
                    Internet connectivity status.
                  </p>
                </div>
              </div>
            </section>

            {/* ==================================================== */}
            {/* LIVE MARKET PRICES */}
            {/* ==================================================== */}

            <section className="mb-8">
              <h2 className="mb-5 text-2xl font-bold text-white">
                Live Market Prices
              </h2>

              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
                {marketCards.map((market) => (
                  <div
                    key={market.title}
                    className="rounded-3xl border border-zinc-800 bg-zinc-950 p-6"
                  >
                    <p className="text-sm text-gray-400">{market.title}</p>

                    <h3 className={`mt-3 text-2xl font-bold ${market.color}`}>
                      PKR {formatCurrency(market.value)}
                    </h3>
                  </div>
                ))}
              </div>
            </section>

            {/* ==================================================== */}
            {/* GOLD & USDT MARKET SUMMARY */}
            {/* ==================================================== */}

            <section className="mb-8">
              <div className="grid gap-5 lg:grid-cols-2">

                {/* Gold Market */}

                <div className="rounded-3xl border border-yellow-500/20 bg-zinc-950 p-6">
                  <h3 className="text-xl font-bold text-yellow-400">
                    Gold Market
                  </h3>

                  <div className="mt-5 space-y-3">

                    <div className="flex justify-between">
                      <span className="text-gray-400">Buy Price</span>

                      <span className="font-semibold text-yellow-400">
                        PKR {formatCurrency(stats.goldBuyPrice)}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-gray-400">Sell Price</span>

                      <span className="font-semibold text-yellow-300">
                        PKR {formatCurrency(stats.goldSellPrice)}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-gray-400">Market Status</span>

                      <span className={marketStatusColor}>
                        {stats.marketStatus}
                      </span>
                    </div>

                  </div>

                  <Link
                    href="/admin/gold-settings"
                    className="mt-6 inline-flex rounded-xl border border-yellow-500 px-4 py-2 text-sm font-semibold text-yellow-400 hover:bg-yellow-500 hover:text-black"
                  >
                    Update Gold Settings
                  </Link>
                </div>

                {/* USDT Market */}

                <div className="rounded-3xl border border-green-500/20 bg-zinc-950 p-6">
                  <h3 className="text-xl font-bold text-green-400">
                    USDT Market
                  </h3>

                  <div className="mt-5 space-y-3">

                    <div className="flex justify-between">
                      <span className="text-gray-400">Buy Price</span>

                      <span className="font-semibold text-green-400">
                        PKR {formatCurrency(stats.usdtBuyPrice)}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-gray-400">Sell Price</span>

                      <span className="font-semibold text-green-300">
                        PKR {formatCurrency(stats.usdtSellPrice)}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-gray-400">Market Status</span>

                      <span className={marketStatusColor}>
                        {stats.marketStatus}
                      </span>
                    </div>

                  </div>

                  <Link
                    href="/admin/usdt-settings"
                    className="mt-6 inline-flex rounded-xl border border-green-500 px-4 py-2 text-sm font-semibold text-green-400 hover:bg-green-500 hover:text-black"
                  >
                    Update USDT Settings
                  </Link>
                </div>

              </div>
            </section>
                        {/* ==================================================== */}
            {/* QUICK ACTIONS */}
            {/* PART 5/8 */}
            {/* ==================================================== */}

            <section className="mb-8">
              <div className="mb-5 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white">
                  Admin Quick Actions
                </h2>

                <span className="rounded-full bg-yellow-500/10 px-3 py-1 text-xs font-semibold text-yellow-400">
                  Enterprise Controls
                </span>
              </div>

              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
                {quickActions.map((action) => (
                  <Link
                    key={action.href}
                    href={action.href}
                    className="group rounded-3xl border border-zinc-800 bg-zinc-950 p-5 transition-all duration-200 hover:border-yellow-500 hover:bg-zinc-900"
                  >
                    <h3 className="text-lg font-bold text-yellow-400 transition group-hover:text-yellow-300">
                      {action.title}
                    </h3>

                    <p className="mt-2 text-sm text-gray-400">
                      {action.description}
                    </p>

                    <div className="mt-5 text-xs font-medium text-gray-500 group-hover:text-yellow-400">
                      Open Module →
                    </div>
                  </Link>
                ))}
              </div>
            </section>

            {/* ==================================================== */}
            {/* PENDING REQUESTS */}
            {/* ==================================================== */}

            <section className="mb-8">
              <h2 className="mb-5 text-2xl font-bold text-white">
                Pending Requests
              </h2>

              <div className="grid gap-5 lg:grid-cols-2">

                {/* Pending Deposits */}

                <div className="rounded-3xl border border-blue-500/20 bg-zinc-950 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-400">
                        Pending Deposits
                      </p>

                      <h3 className="mt-3 text-4xl font-bold text-blue-400">
                        {formatNumber(stats.pendingDeposits)}
                      </h3>
                    </div>

                    <div className="rounded-full bg-blue-500/10 p-4">
                      <span className="text-2xl text-blue-400">💳</span>
                    </div>
                  </div>

                  <p className="mt-3 text-xs text-gray-500">
                    Waiting for administrator approval.
                  </p>

                  <Link
                    href="/admin/deposits"
                    className="mt-6 inline-flex rounded-xl bg-blue-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-400"
                  >
                    Review Deposits
                  </Link>
                </div>

                {/* Pending Withdrawals */}

                <div className="rounded-3xl border border-orange-500/20 bg-zinc-950 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-400">
                        Pending Withdrawals
                      </p>

                      <h3 className="mt-3 text-4xl font-bold text-orange-400">
                        {formatNumber(stats.pendingWithdrawals)}
                      </h3>
                    </div>

                    <div className="rounded-full bg-orange-500/10 p-4">
                      <span className="text-2xl text-orange-400">💸</span>
                    </div>
                  </div>

                  <p className="mt-3 text-xs text-gray-500">
                    Waiting for administrator approval.
                  </p>

                  <Link
                    href="/admin/withdrawals"
                    className="mt-6 inline-flex rounded-xl bg-orange-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-orange-400"
                  >
                    Review Withdrawals
                  </Link>
                </div>

              </div>
            </section>

            {/* ==================================================== */}
            {/* ENTERPRISE MANAGEMENT */}
            {/* ==================================================== */}

            <section className="mb-8">
              <h2 className="mb-5 text-2xl font-bold text-white">
                Enterprise Management
              </h2>

              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">

                <Link
                  href="/admin/users"
                  className="rounded-3xl border border-purple-500/20 bg-zinc-950 p-6 transition hover:border-purple-400"
                >
                  <p className="text-sm text-gray-400">
                    User Management
                  </p>

                  <h3 className="mt-3 text-xl font-bold text-purple-400">
                    Manage Users
                  </h3>

                  <p className="mt-2 text-sm text-gray-500">
                    View, search and manage registered GoldTrade users.
                  </p>
                </Link>

                <Link
                  href="/admin/wallet"
                  className="rounded-3xl border border-cyan-500/20 bg-zinc-950 p-6 transition hover:border-cyan-400"
                >
                  <p className="text-sm text-gray-400">
                    Wallet Management
                  </p>

                  <h3 className="mt-3 text-xl font-bold text-cyan-400">
                    User Wallets
                  </h3>

                  <p className="mt-2 text-sm text-gray-500">
                    Manage balances, credits and wallet history.
                  </p>
                </Link>

                <Link
                  href="/admin/transactions"
                  className="rounded-3xl border border-green-500/20 bg-zinc-950 p-6 transition hover:border-green-400"
                >
                  <p className="text-sm text-gray-400">
                    Transactions
                  </p>

                  <h3 className="mt-3 text-xl font-bold text-green-400">
                    Transaction History
                  </h3>

                  <p className="mt-2 text-sm text-gray-500">
                    View all deposits, withdrawals and transfers.
                  </p>
                </Link>

                <Link
                  href="/admin/payment-settings"
                  className="rounded-3xl border border-blue-500/20 bg-zinc-950 p-6 transition hover:border-blue-400"
                >
                  <p className="text-sm text-gray-400">
                    Payment Settings
                  </p>

                  <h3 className="mt-3 text-xl font-bold text-blue-400">
                    Bank & Crypto Accounts
                  </h3>

                  <p className="mt-2 text-sm text-gray-500">
                    Configure payment accounts for deposits.
                  </p>
                </Link>

                <Link
                  href="/admin/gold-settings"
                  className="rounded-3xl border border-yellow-500/20 bg-zinc-950 p-6 transition hover:border-yellow-400"
                >
                  <p className="text-sm text-gray-400">
                    Gold Trading
                  </p>

                  <h3 className="mt-3 text-xl font-bold text-yellow-400">
                    Gold Market Settings
                  </h3>

                  <p className="mt-2 text-sm text-gray-500">
                    Update live gold buy/sell prices.
                  </p>
                </Link>

                <Link
                  href="/admin/usdt-settings"
                  className="rounded-3xl border border-green-500/20 bg-zinc-950 p-6 transition hover:border-green-400"
                >
                  <p className="text-sm text-gray-400">
                    USDT Trading
                  </p>

                  <h3 className="mt-3 text-xl font-bold text-green-400">
                    USDT Market Settings
                  </h3>

                  <p className="mt-2 text-sm text-gray-500">
                    Update USDT buy/sell prices and trading status.
                  </p>
                </Link>

              </div>
            </section>
                        {/* ==================================================== */}
            {/* RECENT TRANSACTIONS */}
            {/* PART 6/8 */}
            {/* ==================================================== */}

            <section className="mb-8">
              <div className="mb-5 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white">
                  Recent Transactions
                </h2>

                <Link
                  href="/admin/transactions"
                  className="text-sm font-semibold text-yellow-400 hover:text-yellow-300"
                >
                  View All →
                </Link>
              </div>

              <div className="overflow-x-auto rounded-3xl border border-zinc-800 bg-zinc-950">
                <table className="min-w-full text-sm">
                  <thead className="border-b border-zinc-800 bg-zinc-900">
                    <tr className="text-left text-gray-400">
                      <th className="px-5 py-4">User</th>
                      <th className="px-5 py-4">Type</th>
                      <th className="px-5 py-4">Amount</th>
                      <th className="px-5 py-4">Status</th>
                      <th className="px-5 py-4">Date</th>
                    </tr>
                  </thead>

                  <tbody>
                    {transactions.length === 0 ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-5 py-10 text-center text-gray-500"
                        >
                          No transactions found.
                        </td>
                      </tr>
                    ) : (
                      transactions.slice(0, 10).map((tx) => (
                        <tr
                          key={tx._id}
                          className="border-b border-zinc-800 hover:bg-zinc-900/50"
                        >
                          <td className="px-5 py-4 font-medium text-white">
                            {tx.username}
                          </td>

                          <td className="px-5 py-4 capitalize text-gray-300">
                            {tx.type.replace("-", " ")}
                          </td>

                          <td className="px-5 py-4 font-semibold text-yellow-400">
                            PKR {formatCurrency(tx.amount)}
                          </td>

                          <td className="px-5 py-4">
                            <span
                              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                tx.status === "approved"
                                  ? "bg-green-500/10 text-green-400"
                                  : tx.status === "pending"
                                  ? "bg-orange-500/10 text-orange-400"
                                  : "bg-red-500/10 text-red-400"
                              }`}
                            >
                              {tx.status}
                            </span>
                          </td>

                          <td className="px-5 py-4 text-gray-400">
                            {formatDate(tx.createdAt)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            {/* ==================================================== */}
            {/* LIVE SYSTEM ACTIVITY */}
            {/* ==================================================== */}

            <section className="mb-8">
              <h2 className="mb-5 text-2xl font-bold text-white">
                Live System Activity
              </h2>

              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">

                <div className="rounded-3xl border border-purple-500/20 bg-zinc-950 p-6">
                  <p className="text-sm text-gray-400">
                    Registered Users
                  </p>

                  <h3 className="mt-3 text-3xl font-bold text-purple-400">
                    {formatNumber(stats.totalUsers)}
                  </h3>
                </div>

                <div className="rounded-3xl border border-green-500/20 bg-zinc-950 p-6">
                  <p className="text-sm text-gray-400">
                    Total Deposits
                  </p>

                  <h3 className="mt-3 text-3xl font-bold text-green-400">
                    PKR {formatCurrency(stats.totalDeposits)}
                  </h3>
                </div>

                <div className="rounded-3xl border border-red-500/20 bg-zinc-950 p-6">
                  <p className="text-sm text-gray-400">
                    Total Withdrawals
                  </p>

                  <h3 className="mt-3 text-3xl font-bold text-red-400">
                    PKR {formatCurrency(stats.totalWithdrawals)}
                  </h3>
                </div>

                <div className="rounded-3xl border border-yellow-500/20 bg-zinc-950 p-6">
                  <p className="text-sm text-gray-400">
                    Portfolio Value
                  </p>

                  <h3 className="mt-3 text-3xl font-bold text-yellow-400">
                    PKR {formatCurrency(totalPortfolio)}
                  </h3>
                </div>

              </div>
            </section>

            {/* ==================================================== */}
            {/* SYSTEM STATUS */}
            {/* ==================================================== */}

            <section className="mb-8">
              <h2 className="mb-5 text-2xl font-bold text-white">
                System Status
              </h2>

              <div className="grid gap-5 lg:grid-cols-3">

                <div className="rounded-3xl border border-green-500/20 bg-zinc-950 p-6">
                  <p className="text-sm text-gray-400">
                    Backend API
                  </p>

                  <h3 className="mt-2 text-xl font-bold text-green-400">
                    ONLINE
                  </h3>

                  <p className="mt-2 text-xs text-gray-500">
                    Render Production Connected
                  </p>
                </div>

                <div className="rounded-3xl border border-blue-500/20 bg-zinc-950 p-6">
                  <p className="text-sm text-gray-400">
                    Frontend
                  </p>

                  <h3 className="mt-2 text-xl font-bold text-blue-400">
                    ACTIVE
                  </h3>

                  <p className="mt-2 text-xs text-gray-500">
                    Vercel Deployment Running
                  </p>
                </div>

                <div className="rounded-3xl border border-yellow-500/20 bg-zinc-950 p-6">
                  <p className="text-sm text-gray-400">
                    Authentication
                  </p>

                  <h3 className="mt-2 text-xl font-bold text-yellow-400">
                    JWT SECURED
                  </h3>

                  <p className="mt-2 text-xs text-gray-500">
                    Administrator Session Verified
                  </p>
                </div>

              </div>
            </section>

            {/* ==================================================== */}
            {/* SERVER INFORMATION */}
            {/* ==================================================== */}

            <section className="mb-8">
              <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-6">
                <h2 className="mb-5 text-2xl font-bold text-white">
                  Live Server Information
                </h2>

                <div className="grid gap-4 md:grid-cols-2">

                  <div className="flex justify-between border-b border-zinc-800 pb-3">
                    <span className="text-gray-400">Environment</span>

                    <span className="font-semibold text-green-400">
                      Production
                    </span>
                  </div>

                  <div className="flex justify-between border-b border-zinc-800 pb-3">
                    <span className="text-gray-400">Backend</span>

                    <span className="font-semibold text-green-400">
                      Render
                    </span>
                  </div>

                  <div className="flex justify-between border-b border-zinc-800 pb-3">
                    <span className="text-gray-400">Frontend</span>

                    <span className="font-semibold text-blue-400">
                      Vercel
                    </span>
                  </div>

                  <div className="flex justify-between border-b border-zinc-800 pb-3">
                    <span className="text-gray-400">Database</span>

                    <span className="font-semibold text-purple-400">
                      MongoDB Atlas
                    </span>
                  </div>

                  <div className="flex justify-between border-b border-zinc-800 pb-3">
                    <span className="text-gray-400">Network Status</span>

                    <span
                      className={`font-semibold ${
                        isOnline ? "text-green-400" : "text-red-400"
                      }`}
                    >
                      {isOnline ? "Online" : "Offline"}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-400">Market Status</span>

                    <span className={`font-semibold ${marketStatusColor}`}>
                      {stats.marketStatus}
                    </span>
                  </div>

                </div>
              </div>
            </section>
                        {/* ==================================================== */}
            {/* ADMINISTRATOR INFORMATION */}
            {/* PART 7/8 */}
            {/* ==================================================== */}

            <section className="mb-8">
              <h2 className="mb-5 text-2xl font-bold text-white">
                Administrator Information
              </h2>

              <div className="rounded-3xl border border-yellow-500/20 bg-zinc-950 p-6">
                <div className="grid gap-4 md:grid-cols-2">

                  <div className="border-b border-zinc-800 pb-3">
                    <p className="text-xs uppercase text-gray-500">
                      Username
                    </p>

                    <p className="mt-2 text-lg font-semibold text-white">
                      {admin?.username || "Administrator"}
                    </p>
                  </div>

                  <div className="border-b border-zinc-800 pb-3">
                    <p className="text-xs uppercase text-gray-500">
                      Email
                    </p>

                    <p className="mt-2 text-lg font-semibold text-white">
                      {admin?.email || "admin@goldtrade.com"}
                    </p>
                  </div>

                  <div className="border-b border-zinc-800 pb-3">
                    <p className="text-xs uppercase text-gray-500">
                      Role
                    </p>

                    <p className="mt-2 text-lg font-semibold text-yellow-400">
                      {admin?.role || "admin"}
                    </p>
                  </div>

                  <div className="border-b border-zinc-800 pb-3">
                    <p className="text-xs uppercase text-gray-500">
                      Environment
                    </p>

                    <p className="mt-2 text-lg font-semibold text-green-400">
                      Production
                    </p>
                  </div>

                </div>
              </div>
            </section>

            {/* ==================================================== */}
            {/* SECURITY CENTER */}
            {/* ==================================================== */}

            <section className="mb-8">
              <h2 className="mb-5 text-2xl font-bold text-white">
                Security Center
              </h2>

              <div className="grid gap-5 lg:grid-cols-2">

                {/* JWT Status */}

                <div className="rounded-3xl border border-green-500/20 bg-zinc-950 p-6">
                  <h3 className="text-lg font-bold text-green-400">
                    JWT Authentication
                  </h3>

                  <div className="mt-5 space-y-4">

                    <div className="flex justify-between border-b border-zinc-800 pb-3">
                      <span className="text-gray-400">Session Status</span>

                      <span className="font-semibold text-green-400">
                        VERIFIED
                      </span>
                    </div>

                    <div className="flex justify-between border-b border-zinc-800 pb-3">
                      <span className="text-gray-400">Access Level</span>

                      <span className="font-semibold text-yellow-400">
                        ADMIN
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-gray-400">JWT Token</span>

                      <span className="font-semibold text-green-400">
                        ACTIVE
                      </span>
                    </div>

                  </div>
                </div>

                {/* Network Security */}

                <div className="rounded-3xl border border-blue-500/20 bg-zinc-950 p-6">
                  <h3 className="text-lg font-bold text-blue-400">
                    Network Security
                  </h3>

                  <div className="mt-5 space-y-4">

                    <div className="flex justify-between border-b border-zinc-800 pb-3">
                      <span className="text-gray-400">Backend API</span>

                      <span className="font-semibold text-green-400">
                        SECURE
                      </span>
                    </div>

                    <div className="flex justify-between border-b border-zinc-800 pb-3">
                      <span className="text-gray-400">Database</span>

                      <span className="font-semibold text-purple-400">
                        MongoDB Atlas
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-gray-400">Internet Status</span>

                      <span
                        className={`font-semibold ${
                          isOnline ? "text-green-400" : "text-red-400"
                        }`}
                      >
                        {isOnline ? "ONLINE" : "OFFLINE"}
                      </span>
                    </div>

                  </div>
                </div>

              </div>
            </section>

            {/* ==================================================== */}
            {/* DASHBOARD REFRESH STATUS */}
            {/* ==================================================== */}

            <section className="mb-8">
              <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-6">

                <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">

                  <div>
                    <h3 className="text-xl font-bold text-white">
                      Dashboard Refresh Center
                    </h3>

                    <p className="mt-2 text-sm text-gray-400">
                      Synchronize users, wallet balances, deposits,
                      withdrawals and live market prices from backend.
                    </p>
                  </div>

                  <button
                    onClick={handleRefresh}
                    disabled={refreshing}
                    className="rounded-xl bg-yellow-500 px-5 py-3 font-semibold text-black transition hover:bg-yellow-400 disabled:opacity-50"
                  >
                    {refreshing ? "Refreshing..." : "Refresh Dashboard"}
                  </button>

                </div>

              </div>
            </section>

            {/* ==================================================== */}
            {/* FOOTER STATS */}
            {/* ==================================================== */}

            <section className="mb-8">
              <h2 className="mb-5 text-2xl font-bold text-white">
                Enterprise Statistics
              </h2>

              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">

                <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5">
                  <p className="text-xs uppercase text-gray-500">
                    Total Users
                  </p>

                  <h3 className="mt-2 text-2xl font-bold text-purple-400">
                    {formatNumber(stats.totalUsers)}
                  </h3>
                </div>

                <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5">
                  <p className="text-xs uppercase text-gray-500">
                    Total Deposits
                  </p>

                  <h3 className="mt-2 text-2xl font-bold text-green-400">
                    PKR {formatCurrency(stats.totalDeposits)}
                  </h3>
                </div>

                <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5">
                  <p className="text-xs uppercase text-gray-500">
                    Total Withdrawals
                  </p>

                  <h3 className="mt-2 text-2xl font-bold text-red-400">
                    PKR {formatCurrency(stats.totalWithdrawals)}
                  </h3>
                </div>

                <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5">
                  <p className="text-xs uppercase text-gray-500">
                    Portfolio Value
                  </p>

                  <h3 className="mt-2 text-2xl font-bold text-yellow-400">
                    PKR {formatCurrency(totalPortfolio)}
                  </h3>
                </div>

              </div>
            </section>
                        {/* ==================================================== */}
            {/* ENTERPRISE FOOTER */}
            {/* PART 8/8 FINAL */}
            {/* ==================================================== */}

            <footer className="mt-10 rounded-3xl border border-yellow-500/20 bg-zinc-950 p-6">

              <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">

                {/* Left */}

                <div>
                  <h2 className="text-xl font-bold text-yellow-400">
                    GoldTrade V18 Enterprise
                  </h2>

                  <p className="mt-2 text-sm text-gray-400">
                    Production Build • Render Backend • Vercel Frontend • MongoDB Atlas
                  </p>

                  <p className="mt-1 text-xs text-gray-600">
                    Secure JWT Authentication • Linux Compatible • Enterprise Edition
                  </p>
                </div>

                {/* Right */}

                <div className="text-sm text-gray-400 lg:text-right">

                  <p>
                    Logged in as{" "}
                    <span className="font-semibold text-white">
                      {admin?.username || "Administrator"}
                    </span>
                  </p>

                  <p className="mt-1">
                    Role:{" "}
                    <span className="font-semibold text-yellow-400">
                      {admin?.role || "admin"}
                    </span>
                  </p>

                  <p className="mt-1">
                    Market Status:{" "}
                    <span className={marketStatusColor}>
                      {stats.marketStatus}
                    </span>
                  </p>

                </div>

              </div>

              {/* Divider */}

              <div className="my-6 border-t border-zinc-800"></div>

              {/* Footer Stats */}

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

                <div className="rounded-xl bg-black/40 p-4">
                  <p className="text-xs uppercase text-gray-500">
                    Total Users
                  </p>

                  <p className="mt-2 text-lg font-bold text-purple-400">
                    {formatNumber(stats.totalUsers)}
                  </p>
                </div>

                <div className="rounded-xl bg-black/40 p-4">
                  <p className="text-xs uppercase text-gray-500">
                    Portfolio Value
                  </p>

                  <p className="mt-2 text-lg font-bold text-yellow-400">
                    PKR {formatCurrency(totalPortfolio)}
                  </p>
                </div>

                <div className="rounded-xl bg-black/40 p-4">
                  <p className="text-xs uppercase text-gray-500">
                    Gold Buy Price
                  </p>

                  <p className="mt-2 text-lg font-bold text-yellow-300">
                    PKR {formatCurrency(stats.goldBuyPrice)}
                  </p>
                </div>

                <div className="rounded-xl bg-black/40 p-4">
                  <p className="text-xs uppercase text-gray-500">
                    USDT Buy Price
                  </p>

                  <p className="mt-2 text-lg font-bold text-green-400">
                    PKR {formatCurrency(stats.usdtBuyPrice)}
                  </p>
                </div>

              </div>

              {/* Copyright */}

              <div className="mt-8 border-t border-zinc-800 pt-5 text-center">

                <p className="text-sm text-gray-500">
                  © 2026 GoldTrade V18 Enterprise. All Rights Reserved.
                </p>

                <p className="mt-2 text-xs text-gray-600">
                  Version 18.0.0 • Production Ready • Render + Vercel + Linux
                </p>

              </div>

            </footer>

          </>
        )}

      </div>
    </main>
  );
}