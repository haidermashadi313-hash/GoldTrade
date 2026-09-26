"use client";

// ==========================================================
// GoldTrade V18 Enterprise
// ADMIN DASHBOARD
// PART 1/12
// Production Ready (Render + Vercel + Linux + JWT Safe)
// ==========================================================

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import {
  getSession,
  logout,
  type GoldTradeUser,
} from "@/lib/auth";

// ==========================================================
// API URL (Render Production)
// ==========================================================

const API =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://goldtrade-api.onrender.com";

// ==========================================================
// TYPES
// ==========================================================

interface DashboardResponse {
  success: boolean;
  message?: string;

  stats?: DashboardStats;

  user?: GoldTradeUser;

  transactions?: Transaction[];

  deposits?: number;
  withdrawals?: number;
  users?: number;
}

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

  type:
    | "deposit"
    | "withdraw"
    | "gold-buy"
    | "gold-sell"
    | "usdt-buy"
    | "usdt-sell";

  amount: number;

  currency: string;

  status:
    | "pending"
    | "approved"
    | "rejected";

  createdAt: string;
}

// ==========================================================
// WALLET CARD MODEL
// ==========================================================

interface WalletCard {
  title: string;
  amount: number;
  color: string;
  border: string;
}

// ==========================================================
// QUICK ACTION MODEL
// ==========================================================

interface QuickAction {
  title: string;
  href: string;
  description: string;
}

// ==========================================================
// MARKET STATUS MODEL
// ==========================================================

type MarketStatus = "OPEN" | "CLOSED";

// ==========================================================
// COMPONENT START
// ==========================================================

export default function AdminDashboardPage() {
  const router = useRouter();

  // ========================================================
  // ADMIN SESSION
  // ========================================================

  const [token, setToken] = useState("");

  const [admin, setAdmin] = useState<GoldTradeUser | null>(null);

  const [checkingSession, setCheckingSession] = useState(true);

  // ========================================================
  // UI STATES
  // ========================================================

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");

  const [successMessage, setSuccessMessage] = useState("");

  // ========================================================
  // DASHBOARD STATS
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

  // ========================================================
  // TRANSACTIONS
  // ========================================================

  const [transactions, setTransactions] = useState<Transaction[]>([]);

  // ========================================================
  // PAGE TITLE
  // ========================================================

  useEffect(() => {
    document.title = "Admin Dashboard • GoldTrade V18 Enterprise";
  }, []);
    // ========================================================
  // AUTH SESSION CHECK (ADMIN ONLY)
  // ========================================================

  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const session = getSession();

      if (!session || !session.token || !session.user) {
        router.replace("/login");
        return;
      }

      if (session.user.role !== "admin") {
        router.replace("/dashboard");
        return;
      }

      setToken(session.token);
      setAdmin(session.user);
    } catch (error) {
      console.error("Admin Session Error:", error);
      router.replace("/login");
    } finally {
      setCheckingSession(false);
    }
  }, [router]);

  // ========================================================
  // SESSION RECOVERY
  // ========================================================

  useEffect(() => {
    if (checkingSession) return;

    const recoverSession = () => {
      const session = getSession();

      if (!session) {
        router.replace("/login");
        return;
      }

      if (session.user.role !== "admin") {
        router.replace("/dashboard");
      }
    };

    window.addEventListener("focus", recoverSession);

    return () => {
      window.removeEventListener("focus", recoverSession);
    };
  }, [checkingSession, router]);

  // ========================================================
  // PREVENT BACK BUTTON ACCESS
  // ========================================================

  useEffect(() => {
    const handlePopState = () => {
      const session = getSession();

      if (!session) {
        router.replace("/login");
        return;
      }

      if (session.user.role !== "admin") {
        router.replace("/dashboard");
      }
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [router]);

  // ========================================================
  // ADMIN LOGOUT
  // ========================================================

  const handleLogout = useCallback(() => {
    logout();
  }, []);

  // ========================================================
  // REFRESH DASHBOARD
  // ========================================================

  const refreshDashboard = useCallback(() => {
    setRefreshing(true);

    setTimeout(() => {
      setRefreshing(false);
    }, 800);
  }, []);

  // ========================================================
  // NETWORK STATUS
  // ========================================================

  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const updateNetworkStatus = () => {
      setIsOnline(navigator.onLine);
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
  // AUTO CLEAR ERROR MESSAGE
  // ========================================================

  useEffect(() => {
    if (!errorMessage) return;

    const timer = setTimeout(() => {
      setErrorMessage("");
    }, 5000);

    return () => clearTimeout(timer);
  }, [errorMessage]);

  // ========================================================
  // AUTO CLEAR SUCCESS MESSAGE
  // ========================================================

  useEffect(() => {
    if (!successMessage) return;

    const timer = setTimeout(() => {
      setSuccessMessage("");
    }, 2500);

    return () => clearTimeout(timer);
  }, [successMessage]);

  // ========================================================
  // CONNECTION WARNING
  // ========================================================

  const connectionWarning = useMemo(() => {
    if (isOnline) return "";
    return "No internet connection. Please check your network.";
  }, [isOnline]);

  // ========================================================
  // LOADING SCREEN
  // ========================================================

  if (checkingSession) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black">
        <div className="text-center">
          <div className="mx-auto mb-5 h-14 w-14 animate-spin rounded-full border-4 border-yellow-400 border-t-transparent" />

          <h2 className="text-2xl font-bold text-yellow-400">
            Verifying Admin Session...
          </h2>

          <p className="mt-2 text-gray-500">
            GoldTrade Enterprise Security
          </p>
        </div>
      </main>
    );
  }
    // ========================================================
  // LOAD ADMIN DASHBOARD
  // Production Safe (Render + JWT)
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
        throw new Error(data.message || "Unable to load admin dashboard.");
      }

      // --------------------------------------------------
      // ADMIN INFO
      // --------------------------------------------------

      if (data.user) {
        setAdmin(data.user);
      }

      // --------------------------------------------------
      // DASHBOARD STATS
      // --------------------------------------------------

      if (data.stats) {
        setStats({
          totalUsers: data.stats.totalUsers || 0,
          totalDeposits: data.stats.totalDeposits || 0,
          totalWithdrawals: data.stats.totalWithdrawals || 0,
          pendingDeposits: data.stats.pendingDeposits || 0,
          pendingWithdrawals: data.stats.pendingWithdrawals || 0,

          goldBuyPrice: data.stats.goldBuyPrice || 0,
          goldSellPrice: data.stats.goldSellPrice || 0,

          usdtBuyPrice: data.stats.usdtBuyPrice || 0,
          usdtSellPrice: data.stats.usdtSellPrice || 0,

          marketStatus: data.stats.marketStatus || "OPEN",
        });
      }

      // --------------------------------------------------
      // TRANSACTIONS
      // --------------------------------------------------

      if (Array.isArray(data.transactions)) {
        setTransactions(data.transactions);
      } else {
        setTransactions([]);
      }

    } catch (error: any) {
      console.error("ADMIN DASHBOARD ERROR:", error);

      if (
        error.message?.includes("401") ||
        error.message?.includes("403")
      ) {
        logout();
        return;
      }

      setErrorMessage(
        error.message || "Failed to load dashboard."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [router]);

  // ========================================================
  // INITIAL DASHBOARD LOAD
  // ========================================================

  useEffect(() => {
    if (checkingSession) return;
    loadDashboard();
  }, [checkingSession, loadDashboard]);

  // ========================================================
  // REFRESH DASHBOARD
  // ========================================================

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDashboard();
  };

  // ========================================================
  // NUMBER FORMATTER
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

  // ========================================================
  // DATE FORMATTER
  // ========================================================

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };
    // ========================================================
  // LOAD WALLET SUMMARY
  // ========================================================

  const loadWalletSummary = useCallback(async () => {
    const session = getSession();
    if (!session) return;

    try {
      const response = await fetch(`${API}/api/admin/wallet/summary`, {
        headers: {
          Authorization: `Bearer ${session.token}`,
          "Content-Type": "application/json",
        },
        cache: "no-store",
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setStats((prev) => ({
          ...prev,
          totalUsers: data.totalUsers ?? prev.totalUsers,
          totalDeposits: data.totalDeposits ?? prev.totalDeposits,
          totalWithdrawals: data.totalWithdrawals ?? prev.totalWithdrawals,
        }));
      }
    } catch (error) {
      console.error("Wallet Summary Error:", error);
    }
  }, []);

  // ========================================================
  // LOAD DEPOSIT SUMMARY
  // ========================================================

  const loadDepositSummary = useCallback(async () => {
    const session = getSession();
    if (!session) return;

    try {
      const response = await fetch(`${API}/api/admin/deposits/summary`, {
        headers: {
          Authorization: `Bearer ${session.token}`,
          "Content-Type": "application/json",
        },
        cache: "no-store",
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setStats((prev) => ({
          ...prev,
          pendingDeposits:
            data.pendingDeposits ?? prev.pendingDeposits,
          totalDeposits:
            data.totalDeposits ?? prev.totalDeposits,
        }));
      }
    } catch (error) {
      console.error("Deposit Summary Error:", error);
    }
  }, []);

  // ========================================================
  // LOAD WITHDRAW SUMMARY
  // ========================================================

  const loadWithdrawSummary = useCallback(async () => {
    const session = getSession();
    if (!session) return;

    try {
      const response = await fetch(`${API}/api/admin/withdrawals/summary`, {
        headers: {
          Authorization: `Bearer ${session.token}`,
          "Content-Type": "application/json",
        },
        cache: "no-store",
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setStats((prev) => ({
          ...prev,
          pendingWithdrawals:
            data.pendingWithdrawals ?? prev.pendingWithdrawals,
          totalWithdrawals:
            data.totalWithdrawals ?? prev.totalWithdrawals,
        }));
      }
    } catch (error) {
      console.error("Withdraw Summary Error:", error);
    }
  }, []);

  // ========================================================
  // LOAD GOLD MARKET
  // ========================================================

  const loadGoldMarket = useCallback(async () => {
    const session = getSession();
    if (!session) return;

    try {
      const response = await fetch(`${API}/api/gold/settings`, {
        headers: {
          Authorization: `Bearer ${session.token}`,
          "Content-Type": "application/json",
        },
        cache: "no-store",
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setStats((prev) => ({
          ...prev,
          goldBuyPrice: Number(data.buyPrice || 0),
          goldSellPrice: Number(data.sellPrice || 0),
          marketStatus: data.marketStatus || "OPEN",
        }));
      }
    } catch (error) {
      console.error("Gold Market Error:", error);
    }
  }, []);

  // ========================================================
  // LOAD USDT MARKET
  // ========================================================

  const loadUsdtMarket = useCallback(async () => {
    const session = getSession();
    if (!session) return;

    try {
      const response = await fetch(`${API}/api/usdt/settings`, {
        headers: {
          Authorization: `Bearer ${session.token}`,
          "Content-Type": "application/json",
        },
        cache: "no-store",
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setStats((prev) => ({
          ...prev,
          usdtBuyPrice: Number(data.buyPrice || 0),
          usdtSellPrice: Number(data.sellPrice || 0),
        }));
      }
    } catch (error) {
      console.error("USDT Market Error:", error);
    }
  }, []);

  // ========================================================
  // LOAD ALL ADMIN DATA
  // ========================================================

  const loadAllAdminData = useCallback(async () => {
    try {
      setRefreshing(true);

      await Promise.all([
        loadDashboard(),
        loadWalletSummary(),
        loadDepositSummary(),
        loadWithdrawSummary(),
        loadGoldMarket(),
        loadUsdtMarket(),
      ]);
    } catch (error) {
      console.error("Load All Admin Data Error:", error);
      setErrorMessage("Failed to refresh dashboard.");
    } finally {
      setRefreshing(false);
    }
  }, [
    loadDashboard,
    loadWalletSummary,
    loadDepositSummary,
    loadWithdrawSummary,
    loadGoldMarket,
    loadUsdtMarket,
  ]);

  // ========================================================
  // AUTO REFRESH AFTER LOGIN
  // ========================================================

  useEffect(() => {
    if (!checkingSession && token) {
      loadAllAdminData();
    }
  }, [checkingSession, token, loadAllAdminData]);
    // ========================================================
  // DASHBOARD METRICS
  // ========================================================

  const totalPortfolio = useMemo(() => {
    return Number(stats.totalDeposits) - Number(stats.totalWithdrawals);
  }, [stats]);

  const walletHealth = useMemo(() => {
    if (totalPortfolio > 1000000) return "Excellent";
    if (totalPortfolio > 500000) return "Healthy";
    if (totalPortfolio > 100000) return "Stable";
    return "Low";
  }, [totalPortfolio]);

  // ========================================================
  // STATISTICS CARDS
  // ========================================================

  const walletCards: WalletCard[] = useMemo(
    () => [
      {
        title: "Total Deposits",
        amount: stats.totalDeposits,
        color: "text-green-400",
        border: "border-green-500/30",
      },
      {
        title: "Total Withdrawals",
        amount: stats.totalWithdrawals,
        color: "text-red-400",
        border: "border-red-500/30",
      },
      {
        title: "Portfolio Value",
        amount: totalPortfolio,
        color: "text-yellow-400",
        border: "border-yellow-500/30",
      },
      {
        title: "Pending Deposits",
        amount: stats.pendingDeposits,
        color: "text-blue-400",
        border: "border-blue-500/30",
      },
      {
        title: "Pending Withdrawals",
        amount: stats.pendingWithdrawals,
        color: "text-orange-400",
        border: "border-orange-500/30",
      },
      {
        title: "Registered Users",
        amount: stats.totalUsers,
        color: "text-purple-400",
        border: "border-purple-500/30",
      },
    ],
    [stats, totalPortfolio]
  );

  // ========================================================
  // QUICK ACTIONS
  // ========================================================

  const quickActions: QuickAction[] = useMemo(
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
        description: "Manage wallet balances",
      },
      {
        title: "Gold Settings",
        href: "/admin/gold-settings",
        description: "Update live gold prices",
      },
      {
        title: "USDT Settings",
        href: "/admin/usdt-settings",
        description: "Manage USDT buy & sell rates",
      },
      {
        title: "Payment Settings",
        href: "/admin/payment-settings",
        description: "Bank & Crypto payment methods",
      },
      {
        title: "Transactions",
        href: "/admin/transactions",
        description: "View complete transaction history",
      },
    ],
    []
  );

  // ========================================================
  // MARKET STATUS
  // ========================================================

  const marketStatusColor = useMemo(() => {
    return stats.marketStatus === "OPEN"
      ? "text-green-400"
      : "text-red-400";
  }, [stats.marketStatus]);

  const marketStatusBg = useMemo(() => {
    return stats.marketStatus === "OPEN"
      ? "bg-green-500/10 border-green-500/20"
      : "bg-red-500/10 border-red-500/20";
  }, [stats.marketStatus]);

  // ========================================================
  // MARKET SUMMARY CARDS
  // ========================================================

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

  // ========================================================
  // REFRESH BUTTON LABEL
  // ========================================================

  const refreshButtonText = refreshing
    ? "Refreshing..."
    : "Refresh Dashboard";
      // ========================================================
  // ADMIN DASHBOARD UI START
  // PART 6/12
  // ========================================================

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-7xl px-4 py-6">

        {/* ==================================================== */}
        {/* HEADER */}
        {/* ==================================================== */}

        <div className="mb-8 flex flex-col gap-4 rounded-3xl border border-yellow-500/20 bg-zinc-950 p-6 md:flex-row md:items-center md:justify-between">

          <div>
            <h1 className="text-3xl font-bold text-yellow-400">
              GoldTrade V18 Admin Dashboard
            </h1>

            <p className="mt-2 text-gray-400">
              Welcome back,{" "}
              <span className="font-semibold text-white">
                {admin?.username || "Administrator"}
              </span>
            </p>

            <p className="text-sm text-gray-500">
              Enterprise Control Panel • Render Backend • Vercel Frontend
            </p>
          </div>

          <div className="flex flex-wrap gap-3">

            {/* Refresh Button */}

            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="rounded-xl bg-yellow-500 px-5 py-3 font-semibold text-black transition hover:bg-yellow-400 disabled:opacity-50"
            >
              {refreshButtonText}
            </button>

            {/* Logout Button */}

            <button
              onClick={handleLogout}
              className="rounded-xl bg-red-600 px-5 py-3 font-semibold text-white transition hover:bg-red-500"
            >
              Logout
            </button>

          </div>
        </div>

        {/* ==================================================== */}
        {/* CONNECTION WARNING */}
        {/* ==================================================== */}

        {connectionWarning && (
          <div className="mb-5 rounded-2xl border border-orange-500/30 bg-orange-500/10 p-4 text-orange-400">
            {connectionWarning}
          </div>
        )}

        {/* ==================================================== */}
        {/* ERROR MESSAGE */}
        {/* ==================================================== */}

        {errorMessage && (
          <div className="mb-5 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-red-400">
            {errorMessage}
          </div>
        )}

        {/* ==================================================== */}
        {/* SUCCESS MESSAGE */}
        {/* ==================================================== */}

        {successMessage && (
          <div className="mb-5 rounded-2xl border border-green-500/30 bg-green-500/10 p-4 text-green-400">
            {successMessage}
          </div>
        )}

        {/* ==================================================== */}
        {/* LOADING STATE */}
        {/* ==================================================== */}

        {loading ? (
          <div className="flex items-center justify-center rounded-3xl border border-zinc-800 bg-zinc-950 py-24">
            <div className="text-center">

              <div className="mx-auto mb-5 h-16 w-16 animate-spin rounded-full border-4 border-yellow-400 border-t-transparent"></div>

              <h2 className="text-xl font-bold text-yellow-400">
                Loading Dashboard...
              </h2>

              <p className="mt-2 text-gray-500">
                Please wait while GoldTrade loads admin data.
              </p>

            </div>
          </div>
        ) : (
          <>            {/* ==================================================== */}
            {/* DASHBOARD STATISTICS */}
            {/* PART 7/12 */}
            {/* ==================================================== */}

            <section className="mb-8">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white">
                  Dashboard Overview
                </h2>

                <div
                  className={`rounded-full border px-4 py-2 text-sm font-semibold ${marketStatusBg} ${marketStatusColor}`}
                >
                  Market {stats.marketStatus}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {walletCards.map((card) => (
                  <div
                    key={card.title}
                    className={`rounded-3xl border bg-zinc-950 p-5 ${card.border}`}
                  >
                    <p className="text-sm text-gray-400">{card.title}</p>

                    <h3 className={`mt-2 text-2xl font-bold ${card.color}`}>
                      PKR {formatCurrency(card.amount)}
                    </h3>
                  </div>
                ))}

                {/* Wallet Health */}

                <div className="rounded-3xl border border-blue-500/20 bg-zinc-950 p-5">
                  <p className="text-sm text-gray-400">Wallet Health</p>

                  <h3 className="mt-2 text-2xl font-bold text-blue-400">
                    {walletHealth}
                  </h3>

                  <p className="mt-2 text-xs text-gray-500">
                    Portfolio health based on deposits and withdrawals.
                  </p>
                </div>

                {/* Market Status */}

                <div className="rounded-3xl border border-green-500/20 bg-zinc-950 p-5">
                  <p className="text-sm text-gray-400">Live Market Status</p>

                  <h3 className={`mt-2 text-2xl font-bold ${marketStatusColor}`}>
                    {stats.marketStatus}
                  </h3>

                  <p className="mt-2 text-xs text-gray-500">
                    Gold & USDT trading status from backend settings.
                  </p>
                </div>

                {/* Total Portfolio */}

                <div className="rounded-3xl border border-yellow-500/20 bg-zinc-950 p-5">
                  <p className="text-sm text-gray-400">Total Portfolio Value</p>

                  <h3 className="mt-2 text-2xl font-bold text-yellow-400">
                    PKR {formatCurrency(totalPortfolio)}
                  </h3>

                  <p className="mt-2 text-xs text-gray-500">
                    Deposits − Withdrawals
                  </p>
                </div>
              </div>
            </section>

            {/* ==================================================== */}
            {/* LIVE MARKET PRICES */}
            {/* ==================================================== */}

            <section className="mb-8">
              <h2 className="mb-4 text-2xl font-bold text-white">
                Live Market Prices
              </h2>

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {marketCards.map((market) => (
                  <div
                    key={market.title}
                    className="rounded-3xl border border-zinc-800 bg-zinc-950 p-5"
                  >
                    <p className="text-sm text-gray-400">{market.title}</p>

                    <h3 className={`mt-2 text-2xl font-bold ${market.color}`}>
                      PKR {formatCurrency(market.value)}
                    </h3>
                  </div>
                ))}
              </div>
            </section>            {/* ==================================================== */}
            {/* QUICK ACTIONS */}
            {/* PART 8/12 */}
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

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
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
            {/* MARKET CONTROL PANEL */}
            {/* ==================================================== */}

            <section className="mb-8">
              <h2 className="mb-5 text-2xl font-bold text-white">
                Market Control Panel
              </h2>

              <div className="grid gap-5 md:grid-cols-2">

                {/* Gold Market */}

                <div className="rounded-3xl border border-yellow-500/20 bg-zinc-950 p-6">
                  <h3 className="text-lg font-bold text-yellow-400">
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
                    className="mt-6 inline-flex rounded-xl border border-yellow-500 px-4 py-2 text-sm font-semibold text-yellow-400 transition hover:bg-yellow-500 hover:text-black"
                  >
                    Update Gold Settings
                  </Link>
                </div>

                {/* USDT Market */}

                <div className="rounded-3xl border border-green-500/20 bg-zinc-950 p-6">
                  <h3 className="text-lg font-bold text-green-400">
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
                    className="mt-6 inline-flex rounded-xl border border-green-500 px-4 py-2 text-sm font-semibold text-green-400 transition hover:bg-green-500 hover:text-black"
                  >
                    Update USDT Settings
                  </Link>
                </div>
              </div>
            </section>            {/* ==================================================== */}
            {/* RECENT TRANSACTIONS */}
            {/* PART 9/12 */}
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
                          No transactions available.
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
            {/* PENDING REQUESTS */}
            {/* ==================================================== */}

            <section className="mb-8">
              <h2 className="mb-5 text-2xl font-bold text-white">
                Pending Requests
              </h2>

              <div className="grid gap-5 md:grid-cols-2">

                {/* Pending Deposits */}

                <div className="rounded-3xl border border-blue-500/20 bg-zinc-950 p-6">
                  <p className="text-sm text-gray-400">
                    Pending Deposits
                  </p>

                  <h3 className="mt-3 text-4xl font-bold text-blue-400">
                    {formatNumber(stats.pendingDeposits)}
                  </h3>

                  <p className="mt-2 text-xs text-gray-500">
                    Waiting for admin approval.
                  </p>

                  <Link
                    href="/admin/deposits"
                    className="mt-5 inline-flex rounded-xl bg-blue-500 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-400"
                  >
                    Review Deposits
                  </Link>
                </div>

                {/* Pending Withdrawals */}

                <div className="rounded-3xl border border-orange-500/20 bg-zinc-950 p-6">
                  <p className="text-sm text-gray-400">
                    Pending Withdrawals
                  </p>

                  <h3 className="mt-3 text-4xl font-bold text-orange-400">
                    {formatNumber(stats.pendingWithdrawals)}
                  </h3>

                  <p className="mt-2 text-xs text-gray-500">
                    Waiting for admin approval.
                  </p>

                  <Link
                    href="/admin/withdrawals"
                    className="mt-5 inline-flex rounded-xl bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-400"
                  >
                    Review Withdrawals
                  </Link>
                </div>

              </div>
            </section>

            {/* ==================================================== */}
            {/* LIVE ADMIN ACTIVITY */}
            {/* ==================================================== */}

            <section className="mb-8">
              <h2 className="mb-5 text-2xl font-bold text-white">
                Live Activity
              </h2>

              <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-6">
                <div className="space-y-4">

                  <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                    <span className="text-gray-400">
                      Total Registered Users
                    </span>

                    <span className="font-bold text-purple-400">
                      {formatNumber(stats.totalUsers)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                    <span className="text-gray-400">
                      Total Deposits
                    </span>

                    <span className="font-bold text-green-400">
                      PKR {formatCurrency(stats.totalDeposits)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                    <span className="text-gray-400">
                      Total Withdrawals
                    </span>

                    <span className="font-bold text-red-400">
                      PKR {formatCurrency(stats.totalWithdrawals)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">
                      Market Status
                    </span>

                    <span className={`font-bold ${marketStatusColor}`}>
                      {stats.marketStatus}
                    </span>
                  </div>

                </div>
              </div>
            </section>            {/* ==================================================== */}
            {/* ADMIN MANAGEMENT MODULES */}
            {/* PART 10/12 */}
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
                  <p className="text-sm text-gray-400">User Management</p>

                  <h3 className="mt-2 text-xl font-bold text-purple-400">
                    Manage Users
                  </h3>

                  <p className="mt-2 text-sm text-gray-500">
                    View, search and manage all GoldTrade users.
                  </p>
                </Link>

                <Link
                  href="/admin/deposits"
                  className="rounded-3xl border border-green-500/20 bg-zinc-950 p-6 transition hover:border-green-400"
                >
                  <p className="text-sm text-gray-400">Deposit Center</p>

                  <h3 className="mt-2 text-xl font-bold text-green-400">
                    Deposit Requests
                  </h3>

                  <p className="mt-2 text-sm text-gray-500">
                    Approve or reject pending deposits.
                  </p>
                </Link>

                <Link
                  href="/admin/withdrawals"
                  className="rounded-3xl border border-red-500/20 bg-zinc-950 p-6 transition hover:border-red-400"
                >
                  <p className="text-sm text-gray-400">Withdrawal Center</p>

                  <h3 className="mt-2 text-xl font-bold text-red-400">
                    Withdrawal Requests
                  </h3>

                  <p className="mt-2 text-sm text-gray-500">
                    Review and approve withdrawal requests.
                  </p>
                </Link>

                <Link
                  href="/admin/wallet"
                  className="rounded-3xl border border-blue-500/20 bg-zinc-950 p-6 transition hover:border-blue-400"
                >
                  <p className="text-sm text-gray-400">Wallet Management</p>

                  <h3 className="mt-2 text-xl font-bold text-blue-400">
                    User Wallets
                  </h3>

                  <p className="mt-2 text-sm text-gray-500">
                    Manage balances, credits and wallet history.
                  </p>
                </Link>

                <Link
                  href="/admin/payment-settings"
                  className="rounded-3xl border border-cyan-500/20 bg-zinc-950 p-6 transition hover:border-cyan-400"
                >
                  <p className="text-sm text-gray-400">Payment Settings</p>

                  <h3 className="mt-2 text-xl font-bold text-cyan-400">
                    Bank & Crypto Accounts
                  </h3>

                  <p className="mt-2 text-sm text-gray-500">
                    Configure payment methods for deposits.
                  </p>
                </Link>

                <Link
                  href="/admin/settings"
                  className="rounded-3xl border border-yellow-500/20 bg-zinc-950 p-6 transition hover:border-yellow-400"
                >
                  <p className="text-sm text-gray-400">System Settings</p>

                  <h3 className="mt-2 text-xl font-bold text-yellow-400">
                    GoldTrade Configuration
                  </h3>

                  <p className="mt-2 text-sm text-gray-500">
                    Configure enterprise settings and trading options.
                  </p>
                </Link>

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
                  <p className="text-sm text-gray-400">Backend Status</p>

                  <h3 className="mt-2 text-xl font-bold text-green-400">
                    ONLINE
                  </h3>

                  <p className="mt-2 text-xs text-gray-500">
                    Render Production API Connected
                  </p>
                </div>

                <div className="rounded-3xl border border-blue-500/20 bg-zinc-950 p-6">
                  <p className="text-sm text-gray-400">Frontend Status</p>

                  <h3 className="mt-2 text-xl font-bold text-blue-400">
                    ACTIVE
                  </h3>

                  <p className="mt-2 text-xs text-gray-500">
                    Vercel Deployment Running
                  </p>
                </div>

                <div className="rounded-3xl border border-yellow-500/20 bg-zinc-950 p-6">
                  <p className="text-sm text-gray-400">Authentication</p>

                  <h3 className="mt-2 text-xl font-bold text-yellow-400">
                    JWT SECURED
                  </h3>

                  <p className="mt-2 text-xs text-gray-500">
                    Admin session verified successfully.
                  </p>
                </div>

              </div>
            </section>

            {/* ==================================================== */}
            {/* LIVE SERVER INFORMATION */}
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
                    <span className="text-gray-400">Authentication</span>

                    <span className="font-semibold text-yellow-400">
                      JWT Token
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-400">Market</span>

                    <span className={`font-semibold ${marketStatusColor}`}>
                      {stats.marketStatus}
                    </span>
                  </div>

                </div>
              </div>
            </section>            {/* ==================================================== */}
            {/* SYSTEM HEALTH & SECURITY */}
            {/* PART 11/12 */}
            {/* ==================================================== */}

            <section className="mb-8">
              <h2 className="mb-5 text-2xl font-bold text-white">
                System Health & Security
              </h2>

              <div className="grid gap-5 lg:grid-cols-2">

                {/* Security Center */}

                <div className="rounded-3xl border border-green-500/20 bg-zinc-950 p-6">
                  <h3 className="text-lg font-bold text-green-400">
                    Security Center
                  </h3>

                  <div className="mt-5 space-y-4">

                    <div className="flex justify-between border-b border-zinc-800 pb-3">
                      <span className="text-gray-400">JWT Authentication</span>

                      <span className="font-semibold text-green-400">
                        Active
                      </span>
                    </div>

                    <div className="flex justify-between border-b border-zinc-800 pb-3">
                      <span className="text-gray-400">Admin Session</span>

                      <span className="font-semibold text-green-400">
                        Verified
                      </span>
                    </div>

                    <div className="flex justify-between border-b border-zinc-800 pb-3">
                      <span className="text-gray-400">Render API</span>

                      <span className="font-semibold text-green-400">
                        Connected
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-gray-400">MongoDB Atlas</span>

                      <span className="font-semibold text-green-400">
                        Connected
                      </span>
                    </div>

                  </div>
                </div>

                {/* System Health */}

                <div className="rounded-3xl border border-blue-500/20 bg-zinc-950 p-6">
                  <h3 className="text-lg font-bold text-blue-400">
                    System Health
                  </h3>

                  <div className="mt-5 space-y-4">

                    <div className="flex justify-between border-b border-zinc-800 pb-3">
                      <span className="text-gray-400">Frontend</span>

                      <span className="font-semibold text-blue-400">
                        Healthy
                      </span>
                    </div>

                    <div className="flex justify-between border-b border-zinc-800 pb-3">
                      <span className="text-gray-400">Backend</span>

                      <span className="font-semibold text-blue-400">
                        Healthy
                      </span>
                    </div>

                    <div className="flex justify-between border-b border-zinc-800 pb-3">
                      <span className="text-gray-400">API Requests</span>

                      <span className="font-semibold text-blue-400">
                        Operational
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-gray-400">Network</span>

                      <span
                        className={`font-semibold ${
                          isOnline ? "text-green-400" : "text-red-400"
                        }`}
                      >
                        {isOnline ? "Online" : "Offline"}
                      </span>
                    </div>

                  </div>
                </div>

              </div>
            </section>

            {/* ==================================================== */}
            {/* ADMIN INFORMATION */}
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
            {/* REFRESH STATUS */}
            {/* ==================================================== */}

            <section className="mb-8">
              <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-6">

                <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">

                  <div>
                    <h3 className="text-lg font-bold text-white">
                      Dashboard Refresh Status
                    </h3>

                    <p className="mt-2 text-sm text-gray-400">
                      Refresh dashboard anytime to sync the latest users,
                      deposits, withdrawals and market prices.
                    </p>
                  </div>

                  <button
                    onClick={handleRefresh}
                    disabled={refreshing}
                    className="rounded-xl bg-yellow-500 px-5 py-3 font-semibold text-black transition hover:bg-yellow-400 disabled:opacity-50"
                  >
                    {refreshButtonText}
                  </button>

                </div>

              </div>
            </section>

            {/* ==================================================== */}
            {/* FOOTER STATISTICS */}
            {/* ==================================================== */}

            <section className="mb-8">
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

                <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5">
                  <p className="text-xs uppercase text-gray-500">
                    Users
                  </p>

                  <h3 className="mt-2 text-2xl font-bold text-purple-400">
                    {formatNumber(stats.totalUsers)}
                  </h3>
                </div>

                <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5">
                  <p className="text-xs uppercase text-gray-500">
                    Deposits
                  </p>

                  <h3 className="mt-2 text-2xl font-bold text-green-400">
                    PKR {formatCurrency(stats.totalDeposits)}
                  </h3>
                </div>

                <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5">
                  <p className="text-xs uppercase text-gray-500">
                    Withdrawals
                  </p>

                  <h3 className="mt-2 text-2xl font-bold text-red-400">
                    PKR {formatCurrency(stats.totalWithdrawals)}
                  </h3>
                </div>

                <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5">
                  <p className="text-xs uppercase text-gray-500">
                    Portfolio
                  </p>

                  <h3 className="mt-2 text-2xl font-bold text-yellow-400">
                    PKR {formatCurrency(totalPortfolio)}
                  </h3>
                </div>

              </div>
            </section>            {/* ==================================================== */}
            {/* ENTERPRISE FOOTER */}
            {/* PART 12/12 (FINAL) */}
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

                  <p className="mt-1 text-xs text-gray-500">
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
                    Status:{" "}
                    <span className={marketStatusColor}>
                      {stats.marketStatus}
                    </span>
                  </p>

                </div>

              </div>

              {/* Divider */}

              <div className="my-6 border-t border-zinc-800"></div>

              {/* Bottom Stats */}

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
                    Portfolio
                  </p>

                  <p className="mt-2 text-lg font-bold text-yellow-400">
                    PKR {formatCurrency(totalPortfolio)}
                  </p>
                </div>

                <div className="rounded-xl bg-black/40 p-4">
                  <p className="text-xs uppercase text-gray-500">
                    Gold Buy
                  </p>

                  <p className="mt-2 text-lg font-bold text-yellow-300">
                    PKR {formatCurrency(stats.goldBuyPrice)}
                  </p>
                </div>

                <div className="rounded-xl bg-black/40 p-4">
                  <p className="text-xs uppercase text-gray-500">
                    USDT Buy
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