"use client";

// ======================================================
// GoldTrade V18 - Dashboard Page
// PART 1/12
// Imports + Interfaces + Constants + States
// ======================================================

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import {
  Wallet,
  DollarSign,
  Gem,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  ShieldCheck,
  Activity,
  CircleDollarSign,
} from "lucide-react";

// ======================================================
// API URL
// ======================================================

const API =
  process.env.NEXT_PUBLIC_API_URL ||  "https://goldtrade-2.onrender.com";
// ======================================================
// TypeScript Interfaces
// ======================================================

interface DashboardUser {
  _id: string;
  username: string;
  fullName?: string;
  email?: string;
  role: "user" | "admin";
}

interface WalletData {
  pkr: number;
  usdt: number;
  gold: number;
}

interface GoldPriceData {
  buyPrice: number;
  sellPrice: number;
  goldPriceUSD: number;
  usdToPkr: number;
  tradingEnabled: boolean;
  marketStatus: "OPEN" | "CLOSED";
}

interface PortfolioData {
  goldBalance: number;
  investment: number;
  currentValue: number;
  profit: number;
  profitPercent: number;
}

interface TransactionData {
  _id: string;
  type: "BUY" | "SELL" | "DEPOSIT" | "WITHDRAW";
  amount: number;
  goldGrams?: number;
  status: "Pending" | "Completed" | "Rejected";
  createdAt: string;
}

interface DashboardStats {
  totalBalancePKR: number;
  totalGoldValue: number;
  totalUsdtValue: number;
  liveProfit: number;
  liveProfitPercent: number;
}

// ======================================================
// Default Objects
// ======================================================

const EMPTY_WALLET: WalletData = {
  pkr: 0,
  usdt: 0,
  gold: 0,
};

const EMPTY_GOLD_PRICE: GoldPriceData = {
  buyPrice: 0,
  sellPrice: 0,
  goldPriceUSD: 0,
  usdToPkr: 0,
  tradingEnabled: false,
  marketStatus: "CLOSED",
};

const EMPTY_PORTFOLIO: PortfolioData = {
  goldBalance: 0,
  investment: 0,
  currentValue: 0,
  profit: 0,
  profitPercent: 0,
};

const EMPTY_STATS: DashboardStats = {
  totalBalancePKR: 0,
  totalGoldValue: 0,
  totalUsdtValue: 0,
  liveProfit: 0,
  liveProfitPercent: 0,
};

// ======================================================
// Dashboard Component
// ======================================================

export default function DashboardPage() {
  const router = useRouter();

  // ====================================================
  // Authentication
  // ====================================================

  const [token, setToken] = useState("");
  const [username, setUsername] = useState("");
  const [user, setUser] = useState<DashboardUser | null>(null);

  // ====================================================
  // Main Dashboard States
  // ====================================================

  const [wallet, setWallet] = useState<WalletData>(EMPTY_WALLET);

  const [goldPrice, setGoldPrice] =
    useState<GoldPriceData>(EMPTY_GOLD_PRICE);

  const [portfolio, setPortfolio] =
    useState<PortfolioData>(EMPTY_PORTFOLIO);

  const [stats, setStats] =
    useState<DashboardStats>(EMPTY_STATS);

  const [transactions, setTransactions] = useState<TransactionData[]>([]);

  // ====================================================
  // UI States
  // ====================================================

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");

  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Remaining logic will continue in PART 2/12.
    // ======================================================
  // JWT AUTHENTICATION + SECURE HEADERS
  // PART 2/12
  // ======================================================

  /**
   * Browser localStorage se JWT token read karega.
   * Multiple keys support ki gayi hain taake login page ke
   * different versions bhi compatible rahen.
   */
  const getStoredToken = useCallback((): string => {
    if (typeof window === "undefined") return "";

    return (
      localStorage.getItem("token") ||
      localStorage.getItem("jwt") ||
      localStorage.getItem("accessToken") ||
      ""
    );
  }, []);

  /**
   * Username bhi multiple keys se read karega.
   */
  const getStoredUsername = useCallback((): string => {
    if (typeof window === "undefined") return "";

    return (
      localStorage.getItem("username") ||
      localStorage.getItem("userName") ||
      localStorage.getItem("user") ||
      ""
    );
  }, []);

  /**
   * Har authenticated request ke liye headers.
   */
  const getHeaders = useCallback(
    (jwt?: string): HeadersInit => ({
      "Content-Type": "application/json",
      Authorization: `Bearer ${jwt || token}`,
    }),
    [token]
  );

  // ======================================================
  // CHECK LOGIN
  // ======================================================

  const checkLogin = useCallback(async () => {
    try {
      const savedToken = getStoredToken();
      const savedUsername = getStoredUsername();

      if (!savedToken || !savedUsername) {
        router.replace("/login");
        return false;
      }

      setToken(savedToken);
      setUsername(savedUsername);

      return true;
    } catch (error) {
      console.error("Login check error:", error);
      router.replace("/login");
      return false;
    }
  }, [router, getStoredToken, getStoredUsername]);

  // ======================================================
  // VERIFY TOKEN FROM BACKEND
  // ======================================================

  const verifyUser = useCallback(async (): Promise<boolean> => {
    try {
      const savedToken = getStoredToken();

      if (!savedToken) {
        router.replace("/login");
        return false;
      }

      const response = await fetch(`${API}/api/auth/me`, {
        method: "GET",
        headers: getHeaders(savedToken),
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Unauthorized");
      }

      const data = await response.json();

      const currentUser =
        data.user ||
        data.data ||
        data.profile ||
        {};

      setUser({
        _id: currentUser._id || "",
        username: currentUser.username || "",
        fullName: currentUser.fullName || "",
        email: currentUser.email || "",
        role: currentUser.role || "user",
      });

      return true;
    } catch (error) {
      console.error("Token verification failed:", error);

      localStorage.removeItem("token");
      localStorage.removeItem("jwt");
      localStorage.removeItem("accessToken");
      localStorage.removeItem("username");

      router.replace("/login");
      return false;
    }
  }, [router, getStoredToken, getHeaders]);

  // ======================================================
  // LOGOUT USER
  // ======================================================

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("jwt");
    localStorage.removeItem("accessToken");
    localStorage.removeItem("username");
    localStorage.removeItem("user");

    router.replace("/login");
  }, [router]);

  // ======================================================
  // NUMBER FORMATTERS
  // ======================================================

  const formatCurrency = useCallback((value: number) => {
    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Number(value || 0));
  }, []);

  const formatGold = useCallback((grams: number) => {
    return Number(grams || 0).toFixed(4);
  }, []);

  const formatDate = useCallback((date: string) => {
    return new Date(date).toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }, []);
    // ======================================================
  // PART 3/12
  // WALLET + GOLD PRICE + DASHBOARD API FUNCTIONS
  // ======================================================

  // ------------------------------------------------------
  // Load Wallet Balance
  // ------------------------------------------------------

  const loadWallet = useCallback(
    async (currentUsername?: string, currentToken?: string) => {
      try {
        const userName = currentUsername || username;
        const jwt = currentToken || token;

        if (!userName || !jwt) return;

        const response = await fetch(
          `${API}/api/wallet/${encodeURIComponent(userName)}`,
          {
            method: "GET",
            headers: getHeaders(jwt),
            cache: "no-store",
          }
        );

        if (!response.ok) {
          throw new Error("Wallet API failed");
        }

        const data = await response.json();

        const walletData =
          data.wallet ||
          data.data ||
          data ||
          {};

        setWallet({
          pkr: Number(walletData.pkrBalance ?? walletData.pkr ?? 0),
          usdt: Number(walletData.usdtBalance ?? walletData.usdt ?? 0),
          gold: Number(walletData.goldBalance ?? walletData.gold ?? 0),
        });
      } catch (error) {
        console.error("Wallet Error:", error);

        setWallet({
          pkr: 0,
          usdt: 0,
          gold: 0,
        });
      }
    },
    [username, token, getHeaders]
  );

  // ------------------------------------------------------
  // Load Live Gold Prices
  // ------------------------------------------------------

  const loadGoldPrice = useCallback(async () => {
    try {
      const response = await fetch(`${API}/api/gold/price`, {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Gold price API failed");
      }

      const data = await response.json();

      const market =
        data.data ||
        data.market ||
        data;

      setGoldPrice({
        buyPrice: Number(market.buyPrice ?? 0),
        sellPrice: Number(market.sellPrice ?? 0),
        goldPriceUSD: Number(market.goldPriceUSD ?? 0),
        usdToPkr: Number(market.usdToPkr ?? 0),
        tradingEnabled: Boolean(market.tradingEnabled),
        marketStatus:
          market.marketStatus === "OPEN" ? "OPEN" : "CLOSED",
      });
    } catch (error) {
      console.error("Gold Price Error:", error);

      setGoldPrice({
        buyPrice: 0,
        sellPrice: 0,
        goldPriceUSD: 0,
        usdToPkr: 0,
        tradingEnabled: false,
        marketStatus: "CLOSED",
      });
    }
  }, []);

  // ------------------------------------------------------
  // Load Dashboard Statistics
  // ------------------------------------------------------

  const loadDashboardStats = useCallback(
    async (currentUsername?: string, currentToken?: string) => {
      try {
        const userName = currentUsername || username;
        const jwt = currentToken || token;

        if (!userName || !jwt) return;

        const response = await fetch(
          `${API}/api/dashboard/${encodeURIComponent(userName)}`,
          {
            method: "GET",
            headers: getHeaders(jwt),
            cache: "no-store",
          }
        );

        if (!response.ok) {
          throw new Error("Dashboard stats API failed");
        }

        const data = await response.json();

        const dashboard =
          data.stats ||
          data.dashboard ||
          data.data ||
          data;

        setStats({
          totalBalancePKR: Number(
            dashboard.totalBalancePKR ?? dashboard.balance ?? 0
          ),
          totalGoldValue: Number(
            dashboard.totalGoldValue ?? dashboard.goldValue ?? 0
          ),
          totalUsdtValue: Number(
            dashboard.totalUsdtValue ?? dashboard.usdtValue ?? 0
          ),
          liveProfit: Number(dashboard.liveProfit ?? 0),
          liveProfitPercent: Number(
            dashboard.liveProfitPercent ?? 0
          ),
        });

        setLastUpdated(new Date());
      } catch (error) {
        console.error("Dashboard Stats Error:", error);

        setStats({
          totalBalancePKR: 0,
          totalGoldValue: 0,
          totalUsdtValue: 0,
          liveProfit: 0,
          liveProfitPercent: 0,
        });
      }
    },
    [username, token, getHeaders]
  );

  // ------------------------------------------------------
  // Refresh Dashboard
  // ------------------------------------------------------

  const refreshDashboard = useCallback(async () => {
    try {
      setRefreshing(true);
      setErrorMessage("");

      await Promise.all([
        loadWallet(),
        loadGoldPrice(),
        loadDashboardStats(),
      ]);

      setLastUpdated(new Date());
    } catch (error) {
      console.error("Refresh Error:", error);
      setErrorMessage("Unable to refresh dashboard.");
    } finally {
      setRefreshing(false);
    }
  }, [
    loadWallet,
    loadGoldPrice,
    loadDashboardStats,
  ]);
    // ======================================================
  // PART 4/12
  // PORTFOLIO + TRANSACTION HISTORY + DASHBOARD LOADER
  // ======================================================

  // ------------------------------------------------------
  // Load Gold Portfolio
  // ------------------------------------------------------

  const loadPortfolio = useCallback(
    async (currentUsername?: string, currentToken?: string) => {
      try {
        const userName = currentUsername || username;
        const jwt = currentToken || token;

        if (!userName || !jwt) return;

        const response = await fetch(
          `${API}/api/gold/portfolio/${encodeURIComponent(userName)}`,
          {
            method: "GET",
            headers: getHeaders(jwt),
            cache: "no-store",
          }
        );

        if (!response.ok) {
          throw new Error("Portfolio API failed");
        }

        const data = await response.json();

        const portfolioData =
          data.portfolio ||
          data.data ||
          data;

        setPortfolio({
          goldBalance: Number(portfolioData.goldBalance ?? 0),
          investment: Number(portfolioData.investment ?? 0),
          currentValue: Number(portfolioData.currentValue ?? 0),
          profit: Number(portfolioData.profit ?? 0),
          profitPercent: Number(portfolioData.profitPercent ?? 0),
        });
      } catch (error) {
        console.error("Portfolio Error:", error);

        setPortfolio({
          goldBalance: 0,
          investment: 0,
          currentValue: 0,
          profit: 0,
          profitPercent: 0,
        });
      }
    },
    [username, token, getHeaders]
  );

  // ------------------------------------------------------
  // Load Transaction History
  // ------------------------------------------------------

  const loadTransactions = useCallback(
    async (currentUsername?: string, currentToken?: string) => {
      try {
        const userName = currentUsername || username;
        const jwt = currentToken || token;

        if (!userName || !jwt) return;

        const response = await fetch(
          `${API}/api/transactions/${encodeURIComponent(userName)}`,
          {
            method: "GET",
            headers: getHeaders(jwt),
            cache: "no-store",
          }
        );

        if (!response.ok) {
          throw new Error("Transactions API failed");
        }

        const data = await response.json();

        const list =
          data.transactions ||
          data.history ||
          data.data ||
          [];

        const formatted: TransactionData[] = Array.isArray(list)
          ? list.map((item: any) => ({
              _id: item._id || crypto.randomUUID(),
              type: item.type || "BUY",
              amount: Number(item.amount ?? 0),
              goldGrams: Number(item.goldGrams ?? 0),
              status: item.status || "Completed",
              createdAt: item.createdAt || new Date().toISOString(),
            }))
          : [];

        setTransactions(formatted);
      } catch (error) {
        console.error("Transactions Error:", error);
        setTransactions([]);
      }
    },
    [username, token, getHeaders]
  );

  // ------------------------------------------------------
  // Load Complete Dashboard
  // ------------------------------------------------------

  const loadDashboard = useCallback(
    async (currentUsername?: string, currentToken?: string) => {
      try {
        const userName = currentUsername || username;
        const jwt = currentToken || token;

        if (!userName || !jwt) return;

        setLoading(true);
        setErrorMessage("");

        await Promise.all([
          loadWallet(userName, jwt),
          loadGoldPrice(),
          loadDashboardStats(userName, jwt),
          loadPortfolio(userName, jwt),
          loadTransactions(userName, jwt),
        ]);

        setLastUpdated(new Date());
      } catch (error) {
        console.error("Dashboard Load Error:", error);

        setErrorMessage(
          "Unable to load dashboard. Please refresh the page."
        );
      } finally {
        setLoading(false);
      }
    },
    [
      username,
      token,
      loadWallet,
      loadGoldPrice,
      loadDashboardStats,
      loadPortfolio,
      loadTransactions,
    ]
  );

  // ------------------------------------------------------
  // Dashboard Refresh Button
  // ------------------------------------------------------

  const handleRefresh = useCallback(async () => {
    try {
      setRefreshing(true);
      await loadDashboard();
    } finally {
      setRefreshing(false);
    }
  }, [loadDashboard]);
    // ======================================================
  // PART 5/12
  // INITIAL AUTH + useEffect + AUTO REFRESH
  // ======================================================

  // ------------------------------------------------------
  // Authenticate user and load dashboard on first render
  // ------------------------------------------------------

  useEffect(() => {
    let isMounted = true;

    const initializeDashboard = async () => {
      const loggedIn = await checkLogin();

      if (!loggedIn || !isMounted) return;

      const verified = await verifyUser();

      if (!verified || !isMounted) return;

      const savedToken = getStoredToken();
      const savedUsername = getStoredUsername();

      if (!savedToken || !savedUsername || !isMounted) return;

      await loadDashboard(savedUsername, savedToken);
    };

    initializeDashboard();

    return () => {
      isMounted = false;
    };
  }, [
    checkLogin,
    verifyUser,
    loadDashboard,
    getStoredToken,
    getStoredUsername,
  ]);

  // ------------------------------------------------------
  // Auto Refresh Dashboard Every 30 Seconds
  // ------------------------------------------------------

  useEffect(() => {
    if (!token || !username) return;

    const interval = setInterval(() => {
      loadDashboard(username, token);
    }, 30000);

    return () => clearInterval(interval);
  }, [token, username, loadDashboard]);

  // ------------------------------------------------------
  // Refresh Dashboard When User Returns To Tab
  // ------------------------------------------------------

  useEffect(() => {
    const handleVisibility = () => {
      if (
        document.visibilityState === "visible" &&
        token &&
        username
      ) {
        loadDashboard(username, token);
      }
    };

    document.addEventListener(
      "visibilitychange",
      handleVisibility
    );

    return () => {
      document.removeEventListener(
        "visibilitychange",
        handleVisibility
      );
    };
  }, [token, username, loadDashboard]);

  // ------------------------------------------------------
  // Refresh Dashboard When Window Gains Focus
  // ------------------------------------------------------

  useEffect(() => {
    const handleFocus = () => {
      if (token && username) {
        loadDashboard(username, token);
      }
    };

    window.addEventListener("focus", handleFocus);

    return () => {
      window.removeEventListener("focus", handleFocus);
    };
  }, [token, username, loadDashboard]);

  // ------------------------------------------------------
  // Derived Dashboard Values
  // ------------------------------------------------------

  const totalAssetsPKR = useMemo(() => {
    return (
      Number(wallet.pkr) +
      Number(stats.totalGoldValue) +
      Number(stats.totalUsdtValue)
    );
  }, [wallet, stats]);

  const profitColor = useMemo(() => {
    return stats.liveProfit >= 0
      ? "text-green-500"
      : "text-red-500";
  }, [stats.liveProfit]);

  const marketOpen = useMemo(() => {
    return (
      goldPrice.marketStatus === "OPEN" &&
      goldPrice.tradingEnabled
    );
  }, [goldPrice]);

  const latestTransactions = useMemo(() => {
    return transactions.slice(0, 8);
  }, [transactions]);

  const portfolioGrowth = useMemo(() => {
    if (portfolio.investment <= 0) return 0;

    return (
      ((portfolio.currentValue - portfolio.investment) /
        portfolio.investment) *
      100
    );
  }, [portfolio]);

  // ------------------------------------------------------
  // Retry Loader (Used by Error Screen)
  // ------------------------------------------------------

  const retryLoading = useCallback(async () => {
    setErrorMessage("");
    await loadDashboard();
  }, [loadDashboard]);
    // ======================================================
  // PART 6/12
  // HELPER FUNCTIONS + REUSABLE UI RENDERERS
  // ======================================================

  // ------------------------------------------------------
  // Currency Prefix
  // ------------------------------------------------------

  const currency = "PKR";

  // ------------------------------------------------------
  // Transaction Status Badge Color
  // ------------------------------------------------------

  const getStatusStyle = useCallback((status: string) => {
    switch (status) {
      case "Completed":
        return "bg-green-100 text-green-700 border border-green-200";

      case "Pending":
        return "bg-yellow-100 text-yellow-700 border border-yellow-200";

      case "Rejected":
        return "bg-red-100 text-red-700 border border-red-200";

      default:
        return "bg-gray-100 text-gray-600 border border-gray-200";
    }
  }, []);

  // ------------------------------------------------------
  // Transaction Type Color
  // ------------------------------------------------------

  const getTransactionColor = useCallback((type: string) => {
    switch (type) {
      case "BUY":
        return "text-green-600";

      case "SELL":
        return "text-red-600";

      case "DEPOSIT":
        return "text-blue-600";

      case "WITHDRAW":
        return "text-orange-600";

      default:
        return "text-gray-600";
    }
  }, []);

  // ------------------------------------------------------
  // Profit Color Helper
  // ------------------------------------------------------

  const getProfitStyle = useCallback((value: number) => {
    return value >= 0 ? "text-green-600" : "text-red-600";
  }, []);

  // ------------------------------------------------------
  // Refresh Button Icon Class
  // ------------------------------------------------------

  const refreshIconClass = useMemo(() => {
    return refreshing ? "animate-spin" : "";
  }, [refreshing]);

  // ------------------------------------------------------
  // Dashboard Greeting
  // ------------------------------------------------------

  const greeting = useMemo(() => {
    const hour = new Date().getHours();

    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    if (hour < 21) return "Good Evening";

    return "Welcome Back";
  }, []);

  // ------------------------------------------------------
  // Last Updated Text
  // ------------------------------------------------------

  const lastUpdatedText = useMemo(() => {
    if (!lastUpdated) return "Never";

    return lastUpdated.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  }, [lastUpdated]);

  // ------------------------------------------------------
  // Market Status Badge
  // ------------------------------------------------------

  const marketBadgeClass = useMemo(() => {
    return marketOpen
      ? "bg-green-500 text-white"
      : "bg-red-500 text-white";
  }, [marketOpen]);

  // ------------------------------------------------------
  // Skeleton Card Renderer
  // ------------------------------------------------------

  const renderSkeletonCard = (key: number) => (
    <div
      key={key}
      className="animate-pulse rounded-2xl border bg-white p-5 shadow-sm"
    >
      <div className="mb-4 h-4 w-28 rounded bg-gray-200" />
      <div className="mb-3 h-8 w-40 rounded bg-gray-300" />
      <div className="h-3 w-24 rounded bg-gray-200" />
    </div>
  );

  // ------------------------------------------------------
  // Empty Transaction UI
  // ------------------------------------------------------

  const renderEmptyTransactions = () => (
    <div className="flex flex-col items-center justify-center py-10 text-center text-gray-500">
      <Activity size={42} className="mb-3 text-gray-300" />

      <p className="text-lg font-semibold">
        No Transactions Found
      </p>

      <p className="mt-1 text-sm text-gray-400">
        Your recent deposits, withdrawals and gold trades will appear here.
      </p>
    </div>
  );

  // ------------------------------------------------------
  // Loading Grid
  // ------------------------------------------------------

  const renderLoadingGrid = () => (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
      {[1, 2, 3, 4].map((item) => renderSkeletonCard(item))}
    </div>
  );

  // ------------------------------------------------------
  // Number Formatting Helpers
  // ------------------------------------------------------

  const safeNumber = (value: number | string | undefined | null) => {
    const numberValue = Number(value);

    return Number.isFinite(numberValue) ? numberValue : 0;
  };

  const safePercentage = (value: number) => {
    return `${safeNumber(value).toFixed(2)}%`;
  };

  const safeCurrency = (value: number) => {
    return `${currency} ${formatCurrency(safeNumber(value))}`;
  };
    // ======================================================
  // PART 7/12
  // RETURN START + LOADING + ERROR + HEADER
  // ======================================================

  return (
      <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-6 md:px-6 lg:px-8">
      {/* LOADING SCREEN */}
        {loading ? (
          <div className="space-y-6">

            <div className="animate-pulse rounded-3xl bg-gradient-to-r from-yellow-500 to-orange-500 p-6 text-white shadow-lg">
              <div className="mb-3 h-6 w-48 rounded bg-white/30" />
              <div className="h-4 w-72 rounded bg-white/20" />
            </div>

            {renderLoadingGrid()}

            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              <div className="animate-pulse rounded-2xl bg-white p-6 shadow">
                <div className="mb-5 h-5 w-40 rounded bg-gray-200" />
                <div className="space-y-3">
                  {[1,2,3,4].map((i)=>(
                    <div key={i} className="h-12 rounded bg-gray-100" />
                  ))}
                </div>
              </div>

              <div className="animate-pulse rounded-2xl bg-white p-6 shadow">
                <div className="mb-5 h-5 w-44 rounded bg-gray-200" />
                <div className="space-y-3">
                  {[1,2,3,4].map((i)=>(
                    <div key={i} className="h-12 rounded bg-gray-100" />
                  ))}
                </div>
              </div>
            </div>

          </div>
        ) : errorMessage ? (
          /* ===================================================== */
          /* ERROR SCREEN */
          /* ===================================================== */
          <div className="flex min-h-[70vh] items-center justify-center">
            <div className="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-lg">

              <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-red-100">
                <ShieldCheck className="h-10 w-10 text-red-500" />
              </div>

              <h2 className="mb-2 text-2xl font-bold text-gray-900">
                Dashboard Error
              </h2>

              <p className="mb-6 text-sm text-gray-500">
                {errorMessage}
              </p>

              <button
                onClick={retryLoading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-yellow-500 py-3 font-semibold text-white transition hover:bg-yellow-600"
              >
                <RefreshCw size={18} />
                Retry Dashboard
              </button>

              <button
                onClick={logout}
                className="mt-3 w-full rounded-xl border border-red-300 py-3 font-semibold text-red-600 transition hover:bg-red-50"
              >
                Logout
              </button>

            </div>
          </div>
        ) : (
          <>
          /* ===================================================== */
          /* DASHBOARD CONTENT START */
          /* ===================================================== */
          

            {/* =================================================== */}
            {/* HEADER */}
            {/* =================================================== */}

            <div className="mb-6 rounded-3xl bg-gradient-to-r from-yellow-500 via-orange-500 to-amber-600 p-6 text-white shadow-xl">

              <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

                <div>

                  <p className="mb-2 text-sm font-medium text-yellow-100">
                    {greeting}
                  </p>

                  <h1 className="text-3xl font-bold">
                    {user?.fullName || username || "GoldTrade User"}
                  </h1>

                  <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-yellow-50">

                    <div className="flex items-center gap-2">
                      <Wallet size={16} />
                      <span>{username}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Clock size={16} />
                      <span>Updated: {lastUpdatedText}</span>
                    </div>

                    <div
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${marketBadgeClass}`}
                    >
                      Market {marketOpen ? "OPEN" : "CLOSED"}
                    </div>

                  </div>

                </div>

                <div className="flex flex-wrap gap-3">

                  <button
                    onClick={handleRefresh}
                    disabled={refreshing}
                    className="flex items-center gap-2 rounded-xl bg-white px-5 py-3 font-semibold text-orange-600 transition hover:bg-yellow-100 disabled:opacity-60"
                  >
                    <RefreshCw
                      size={18}
                      className={refreshIconClass}
                    />
                    {refreshing ? "Refreshing..." : "Refresh"}
                  </button>

                  <button
                    onClick={logout}
                    className="rounded-xl border border-white/40 px-5 py-3 font-semibold text-white transition hover:bg-white/10"
                  >
                    Logout
                  </button>

                </div>

              </div>

            </div>

            {/* =================================================== */}
            {/* SUMMARY STRIP */}
            {/* =================================================== */}

            <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">

              <div className="rounded-2xl bg-white p-5 shadow-sm">
                <p className="text-sm text-gray-500">Total Assets</p>
                <h3 className="mt-2 text-xl font-bold text-gray-900">
                  {safeCurrency(totalAssetsPKR)}
                </h3>
              </div>

              <div className="rounded-2xl bg-white p-5 shadow-sm">
                <p className="text-sm text-gray-500">Live Profit</p>

                <div className={`mt-2 flex items-center gap-2 ${profitColor}`}>
                  {stats.liveProfit >= 0 ? (
                    <TrendingUp size={18} />
                  ) : (
                    <TrendingDown size={18} />
                  )}

                  <h3 className="text-xl font-bold">
                    {safeCurrency(stats.liveProfit)}
                  </h3>
                </div>

                <p className={`mt-1 text-xs ${profitColor}`}>
                  {safePercentage(stats.liveProfitPercent)}
                </p>

              </div>

              <div className="rounded-2xl bg-white p-5 shadow-sm">
                <p className="text-sm text-gray-500">Gold Balance</p>
                <h3 className="mt-2 text-xl font-bold text-gray-900">
                  {formatGold(wallet.gold)} g
                </h3>
              </div>

              <div className="rounded-2xl bg-white p-5 shadow-sm">
                <p className="text-sm text-gray-500">USDT Balance</p>
                <h3 className="mt-2 text-xl font-bold text-gray-900">
                  {formatCurrency(wallet.usdt)} USDT
                </h3>
              </div>

            </div>

            {/* PART 8 starts with Wallet Cards grid */}
            {/* =================================================== */}
            {/* WALLET BALANCE CARDS */}
            {/* =================================================== */}

            <section className="mb-8">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">
                  Wallet Overview
                </h2>

                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Activity size={16} className="text-green-500" />
                  Live Wallet
                </div>
              </div>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">

                {/* PKR Wallet */}
                <div className="rounded-3xl bg-white p-6 shadow-sm transition hover:shadow-lg">
                  <div className="mb-4 flex items-center justify-between">
                    <div className="rounded-2xl bg-green-100 p-3">
                      <Wallet className="h-7 w-7 text-green-600" />
                    </div>

                    <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                      PKR
                    </span>
                  </div>

                  <p className="text-sm text-gray-500">PKR Wallet Balance</p>

                  <h3 className="mt-2 text-3xl font-bold text-gray-900">
                    {safeCurrency(wallet.pkr)}
                  </h3>

                  <p className="mt-2 text-xs text-gray-400">
                    Available for Gold & USDT Trading
                  </p>
                </div>

                {/* USDT Wallet */}
                <div className="rounded-3xl bg-white p-6 shadow-sm transition hover:shadow-lg">
                  <div className="mb-4 flex items-center justify-between">
                    <div className="rounded-2xl bg-blue-100 p-3">
                      <CircleDollarSign className="h-7 w-7 text-blue-600" />
                    </div>

                    <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                      USDT
                    </span>
                  </div>

                  <p className="text-sm text-gray-500">USDT Wallet Balance</p>

                  <h3 className="mt-2 text-3xl font-bold text-gray-900">
                    {formatCurrency(wallet.usdt)}
                  </h3>

                  <p className="mt-2 text-xs text-gray-400">
                    Stablecoin Balance Available
                  </p>
                </div>

                {/* Gold Wallet */}
                <div className="rounded-3xl bg-white p-6 shadow-sm transition hover:shadow-lg">
                  <div className="mb-4 flex items-center justify-between">
                    <div className="rounded-2xl bg-yellow-100 p-3">
                      <Gem className="h-7 w-7 text-yellow-600" />
                    </div>

                    <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold text-yellow-700">
                      GOLD
                    </span>
                  </div>

                  <p className="text-sm text-gray-500">Gold Holdings</p>

                  <h3 className="mt-2 text-3xl font-bold text-gray-900">
                    {formatGold(wallet.gold)} g
                  </h3>

                  <p className="mt-2 text-xs text-gray-400">
                    Physical Gold Equivalent
                  </p>
                </div>

                {/* Total Wallet Value */}
                <div className="rounded-3xl bg-gradient-to-br from-yellow-500 to-orange-500 p-6 text-white shadow-lg">

                  <div className="mb-4 flex items-center justify-between">
                    <div className="rounded-2xl bg-white/20 p-3">
                      <DollarSign className="h-7 w-7" />
                    </div>

                    <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold text-yellow-700">
                      Total
                    </span>
                  </div>

                  <p className="text-sm text-yellow-100">
                    Total Wallet Value
                  </p>

                  <h3 className="mt-2 text-3xl font-bold">
                    {safeCurrency(totalAssetsPKR)}
                  </h3>

                  <p className="mt-2 text-xs text-yellow-100">
                    PKR + Gold + USDT Combined
                  </p>
                </div>

              </div>
            </section>

            {/* =================================================== */}
            {/* LIVE GOLD MARKET */}
            {/* =================================================== */}

            <section className="mb-8">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">
                  Live Gold Market
                </h2>

                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    marketOpen ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                  }`}
                >
                  {marketOpen ? "Market Open" : "Market Closed"}
                </span>
              </div>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">

                {/* Buy Price */}
                <div className="rounded-3xl border border-green-100 bg-white p-6 shadow-sm">
                  <div className="mb-3 flex items-center gap-3">
                    <div className="rounded-xl bg-green-100 p-2">
                      <TrendingUp className="text-green-600" size={22} />
                    </div>

                    <p className="font-semibold text-green-700">
                      Buy Gold
                    </p>
                  </div>

                  <h3 className="text-3xl font-bold text-gray-900">
                    {safeCurrency(goldPrice.buyPrice)}
                  </h3>

                  <p className="mt-2 text-xs text-gray-500">
                    Price Per Gram
                  </p>
                </div>

                {/* Sell Price */}
                <div className="rounded-3xl border border-red-100 bg-white p-6 shadow-sm">
                  <div className="mb-3 flex items-center gap-3">
                    <div className="rounded-xl bg-red-100 p-2">
                      <TrendingDown className="text-red-600" size={22} />
                    </div>

                    <p className="font-semibold text-red-700">
                      Sell Gold
                    </p>
                  </div>

                  <h3 className="text-3xl font-bold text-gray-900">
                    {safeCurrency(goldPrice.sellPrice)}
                  </h3>

                  <p className="mt-2 text-xs text-gray-500">
                    Price Per Gram
                  </p>
                </div>

                {/* Gold USD */}
                <div className="rounded-3xl bg-white p-6 shadow-sm">
                  <div className="mb-3 flex items-center gap-3">
                    <div className="rounded-xl bg-yellow-100 p-2">
                      <Gem className="text-yellow-600" size={22} />
                    </div>

                    <p className="font-semibold text-yellow-700">
                      Gold (USD)
                    </p>
                  </div>

                  <h3 className="text-3xl font-bold text-gray-900">
                    ${formatCurrency(goldPrice.goldPriceUSD)}
                  </h3>

                  <p className="mt-2 text-xs text-gray-500">
                    International Spot Price
                  </p>
                </div>

                {/* USD to PKR */}
                <div className="rounded-3xl bg-white p-6 shadow-sm">
                  <div className="mb-3 flex items-center gap-3">
                    <div className="rounded-xl bg-blue-100 p-2">
                      <DollarSign className="text-blue-600" size={22} />
                    </div>

                    <p className="font-semibold text-blue-700">
                      USD → PKR
                    </p>
                  </div>

                  <h3 className="text-3xl font-bold text-gray-900">
                    Rs {formatCurrency(goldPrice.usdToPkr)}
                  </h3>

                  <p className="mt-2 text-xs text-gray-500">
                    Exchange Rate
                  </p>
                </div>

              </div>

              {/* Market Banner */}
              <div
                className={`mt-5 rounded-2xl border p-4 ${
                  marketOpen
                    ? "border-green-200 bg-green-50"
                    : "border-red-200 bg-red-50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Activity
                    className={
                      marketOpen ? "text-green-600" : "text-red-600"
                    }
                    size={22}
                  />

                  <div>
                    <p
                      className={`font-semibold ${
                        marketOpen
                          ? "text-green-700"
                          : "text-red-700"
                      }`}
                    >
                      {marketOpen
                        ? "Live Trading Enabled"
                        : "Trading Temporarily Disabled"}
                    </p>

                    <p className="text-sm text-gray-600">
                      Gold buying and selling follows the live market status configured by the administrator.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* =================================================== */}
            {/* PORTFOLIO SUMMARY + LIVE PROFIT */}
            {/* =================================================== */}

            <section className="mb-8">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">
                  Gold Portfolio Summary
                </h2>

                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Gem size={18} className="text-yellow-500" />
                  Live Portfolio Value
                </div>
              </div>

              <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 xl:grid-cols-4">

                {/* Gold Holdings */}
                <div className="rounded-3xl bg-white p-6 shadow-sm transition hover:shadow-lg">
                  <div className="mb-4 flex items-center justify-between">
                    <div className="rounded-xl bg-yellow-100 p-3">
                      <Gem className="text-yellow-600" size={28} />
                    </div>
                  </div>

                  <p className="text-sm text-gray-500">Gold Holdings</p>

                  <h3 className="mt-2 text-3xl font-bold text-gray-900">
                    {formatGold(portfolio.goldBalance)} g
                  </h3>

                  <p className="mt-2 text-xs text-gray-400">
                    Total Gold Owned
                  </p>
                </div>

                {/* Investment */}
                <div className="rounded-3xl bg-white p-6 shadow-sm transition hover:shadow-lg">
                  <div className="mb-4 flex items-center justify-between">
                    <div className="rounded-xl bg-blue-100 p-3">
                      <Wallet className="text-blue-600" size={28} />
                    </div>
                  </div>

                  <p className="text-sm text-gray-500">Total Investment</p>

                  <h3 className="mt-2 text-3xl font-bold text-gray-900">
                    {safeCurrency(portfolio.investment)}
                  </h3>

                  <p className="mt-2 text-xs text-gray-400">
                    Amount Invested in Gold
                  </p>
                </div>

                {/* Current Value */}
                <div className="rounded-3xl bg-white p-6 shadow-sm transition hover:shadow-lg">
                  <div className="mb-4 flex items-center justify-between">
                    <div className="rounded-xl bg-green-100 p-3">
                      <DollarSign className="text-green-600" size={28} />
                    </div>
                  </div>

                  <p className="text-sm text-gray-500">Current Value</p>

                  <h3 className="mt-2 text-3xl font-bold text-gray-900">
                    {safeCurrency(portfolio.currentValue)}
                  </h3>

                  <p className="mt-2 text-xs text-gray-400">
                    Based on Live Gold Price
                  </p>
                </div>

                {/* Live Profit */}
                <div className="rounded-3xl bg-white p-6 shadow-sm transition hover:shadow-lg">
                  <div className="mb-4 flex items-center justify-between">
                    <div
                      className={`rounded-xl p-3 ${
                        portfolio.profit >= 0
                          ? "bg-green-100"
                          : "bg-red-100"
                      }`}
                    >
                      {portfolio.profit >= 0 ? (
                        <TrendingUp className="text-green-600" size={28} />
                      ) : (
                        <TrendingDown className="text-red-600" size={28} />
                      )}
                    </div>
                  </div>

                  <p className="text-sm text-gray-500">Live Profit / Loss</p>

                  <h3
                    className={`mt-2 text-3xl font-bold ${getProfitStyle(
                      portfolio.profit
                    )}`}
                  >
                    {safeCurrency(portfolio.profit)}
                  </h3>

                  <p
                    className={`mt-2 text-xs font-semibold ${getProfitStyle(
                      portfolio.profit
                    )}`}
                  >
                    {safePercentage(portfolio.profitPercent)}
                  </p>
                </div>
              </div>
            </section>

            {/* =================================================== */}
            {/* INVESTMENT PERFORMANCE */}
            {/* =================================================== */}

            <section className="mb-8">
              <div className="rounded-3xl bg-white p-6 shadow-sm">

                <div className="mb-6 flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-900">
                    Investment Performance
                  </h2>

                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      portfolioGrowth >= 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                    }`}
                  >
                    {safePercentage(portfolioGrowth)}
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">

                  {/* ROI */}
                  <div className="rounded-2xl bg-gray-50 p-5">
                    <p className="text-sm text-gray-500">ROI</p>

                    <h3
                      className={`mt-2 text-2xl font-bold ${getProfitStyle(
                        portfolioGrowth
                      )}`}
                    >
                      {safePercentage(portfolioGrowth)}
                    </h3>
                  </div>

                  {/* Live Profit % */}
                  <div className="rounded-2xl bg-gray-50 p-5">
                    <p className="text-sm text-gray-500">Live Profit %</p>

                    <h3
                      className={`mt-2 text-2xl font-bold ${getProfitStyle(
                        stats.liveProfitPercent
                      )}`}
                    >
                      {safePercentage(stats.liveProfitPercent)}
                    </h3>
                  </div>

                  {/* Gold Value */}
                  <div className="rounded-2xl bg-gray-50 p-5">
                    <p className="text-sm text-gray-500">Gold Wallet Value</p>

                    <h3 className="mt-2 text-2xl font-bold text-gray-900">
                      {safeCurrency(stats.totalGoldValue)}
                    </h3>
                  </div>

                  {/* USDT Value */}
                  <div className="rounded-2xl bg-gray-50 p-5">
                    <p className="text-sm text-gray-500">USDT Wallet Value</p>

                    <h3 className="mt-2 text-2xl font-bold text-gray-900">
                      {safeCurrency(stats.totalUsdtValue)}
                    </h3>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-8">
                  <div className="mb-2 flex justify-between text-sm text-gray-500">
                    <span>Portfolio Growth</span>
                    <span>{safePercentage(portfolioGrowth)}</span>
                  </div>

                  <div className="h-3 overflow-hidden rounded-full bg-gray-200">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${
                        portfolioGrowth >= 0
                          ? "bg-green-500"
                          : "bg-red-500"
                      }`}
                      style={{
                        width: `${Math.min(
                          Math.abs(portfolioGrowth),
                          100
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* =================================================== */}
            {/* LIVE ACCOUNT STATISTICS */}
            {/* =================================================== */}

            <section className="mb-8">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">
                  Live Account Statistics
                </h2>
              </div>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">

                <div className="rounded-3xl bg-gradient-to-r from-green-500 to-emerald-500 p-6 text-white shadow-lg">
                  <p className="text-sm text-green-100">Live Profit</p>

                  <h3 className="mt-2 text-3xl font-bold">
                    {safeCurrency(stats.liveProfit)}
                  </h3>

                  <div className="mt-3 flex items-center gap-2 text-sm">
                    <TrendingUp size={16} />
                    {safePercentage(stats.liveProfitPercent)}
                  </div>
                </div>

                <div className="rounded-3xl bg-gradient-to-r from-yellow-500 to-orange-500 p-6 text-white shadow-lg">
                  <p className="text-sm text-yellow-100">Gold Wallet Value</p>

                  <h3 className="mt-2 text-3xl font-bold">
                    {safeCurrency(stats.totalGoldValue)}
                  </h3>
                </div>

                <div className="rounded-3xl bg-gradient-to-r from-blue-500 to-cyan-500 p-6 text-white shadow-lg">
                  <p className="text-sm text-blue-100">USDT Wallet Value</p>

                  <h3 className="mt-2 text-3xl font-bold">
                    {safeCurrency(stats.totalUsdtValue)}
                  </h3>
                </div>

                <div className="rounded-3xl bg-gradient-to-r from-purple-500 to-indigo-500 p-6 text-white shadow-lg">
                  <p className="text-sm text-purple-100">Total Assets</p>

                  <h3 className="mt-2 text-3xl font-bold">
                    {safeCurrency(totalAssetsPKR)}
                  </h3>
                </div>
              </div>
            </section>

                        {/* =================================================== */}
            {/* QUICK ACTIONS */}
            {/* =================================================== */}

            <section className="mb-8">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">
                  Quick Actions
                </h2>

                <p className="text-sm text-gray-500">
                  GoldTrade Wallet & Gold Market
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">

                {/* BUY GOLD */}
                <Link
                  href="/gold/buy"
                  className="group rounded-3xl bg-gradient-to-br from-green-500 to-emerald-600 p-5 text-white shadow transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                >
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20">
                    <ArrowDownLeft size={24} />
                  </div>

                  <p className="font-semibold">Buy Gold</p>

                  <p className="mt-2 text-xs text-green-100">
                    Purchase gold instantly.
                  </p>
                </Link>

                {/* SELL GOLD */}
                <Link
                  href="/gold/sell"
                  className="group rounded-3xl bg-gradient-to-br from-red-500 to-rose-600 p-5 text-white shadow transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                >
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20">
                    <ArrowUpRight size={24} />
                  </div>

                  <p className="font-semibold">Sell Gold</p>

                  <p className="mt-2 text-xs text-red-100">
                    Sell gold at live price.
                  </p>
                </Link>

                {/* DEPOSIT */}
                <Link
                  href="/wallet/deposit"
                  className="group rounded-3xl bg-gradient-to-br from-blue-500 to-cyan-600 p-5 text-white shadow transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                >
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20">
                    <Wallet size={24} />
                  </div>

                  <p className="font-semibold">Deposit</p>

                  <p className="mt-2 text-xs text-blue-100">
                    Add PKR or USDT balance.
                  </p>
                </Link>

                {/* WITHDRAW */}
                <Link
                  href="/wallet/withdraw"
                  className="group rounded-3xl bg-gradient-to-br from-orange-500 to-amber-600 p-5 text-white shadow transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                >
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20">
                    <ArrowUpRight size={24} />
                  </div>

                  <p className="font-semibold">Withdraw</p>

                  <p className="mt-2 text-xs text-orange-100">
                    Withdraw PKR or USDT.
                  </p>
                </Link>

                {/* GOLD PORTFOLIO */}
                <Link
                  href="/gold/portfolio"
                  className="group rounded-3xl bg-gradient-to-br from-yellow-500 to-orange-500 p-5 text-white shadow transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                >
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20">
                    <Gem size={24} />
                  </div>

                  <p className="font-semibold">Portfolio</p>

                  <p className="mt-2 text-xs text-yellow-100">
                    View gold holdings.
                  </p>
                </Link>

                {/* TRANSACTION HISTORY */}
                <Link
                  href="/gold/history"
                  className="group rounded-3xl bg-gradient-to-br from-purple-500 to-indigo-600 p-5 text-white shadow transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                >
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20">
                    <Clock size={24} />
                  </div>

                  <p className="font-semibold">History</p>

                  <p className="mt-2 text-xs text-purple-100">
                    View all transactions.
                  </p>
                </Link>

              </div>
            </section>

            {/* =================================================== */}
            {/* WALLET MANAGEMENT */}
            {/* =================================================== */}

            <section className="mb-8">
              <div className="rounded-3xl bg-white p-6 shadow-sm">

                <div className="mb-6 flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-900">
                    Wallet Management
                  </h2>

                  <Activity size={18} className="text-green-500" />
                </div>

                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

                  {/* Deposit Card */}
                  <div className="rounded-2xl border border-green-100 bg-green-50 p-5">

                    <div className="mb-4 flex items-center gap-3">
                      <div className="rounded-xl bg-green-100 p-3">
                        <ArrowDownLeft className="text-green-600" />
                      </div>

                      <div>
                        <h3 className="font-bold text-green-700">
                          Deposit Funds
                        </h3>

                        <p className="text-sm text-green-600">
                          Add PKR or USDT into your wallet.
                        </p>
                      </div>
                    </div>

                    <Link
                      href="/wallet/deposit"
                      className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-700"
                    >
                      Deposit Now
                      <ArrowUpRight size={16} />
                    </Link>

                  </div>

                  {/* Withdraw Card */}
                  <div className="rounded-2xl border border-orange-100 bg-orange-50 p-5">

                    <div className="mb-4 flex items-center gap-3">
                      <div className="rounded-xl bg-orange-100 p-3">
                        <ArrowUpRight className="text-orange-600" />
                      </div>

                      <div>
                        <h3 className="font-bold text-orange-700">
                          Withdraw Funds
                        </h3>

                        <p className="text-sm text-orange-600">
                          Withdraw PKR or USDT securely.
                        </p>
                      </div>
                    </div>

                    <Link
                      href="/wallet/withdraw"
                      className="inline-flex items-center gap-2 rounded-xl bg-orange-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-orange-700"
                    >
                      Withdraw Now
                      <ArrowUpRight size={16} />
                    </Link>

                  </div>

                </div>
              </div>
            </section>

            {/* =================================================== */}
            {/* GOLD MARKET ACTIONS */}
            {/* =================================================== */}

            <section className="mb-8">
              <div className="rounded-3xl bg-gradient-to-r from-yellow-500 via-orange-500 to-amber-600 p-6 text-white shadow-lg">

                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <h2 className="text-3xl font-bold">
                      Gold Trading Center
                    </h2>

                    <p className="mt-2 text-yellow-100">
                      Buy and sell gold using live GoldTrade market prices.
                    </p>
                  </div>

                  <Gem size={40} className="text-white/90" />
                </div>

                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

                  {/* Buy Gold */}
                  <div className="rounded-2xl bg-white/10 p-5 backdrop-blur-sm">

                    <p className="text-sm text-yellow-100">
                      Live Buy Price
                    </p>

                    <h3 className="mt-2 text-3xl font-bold">
                      {safeCurrency(goldPrice.buyPrice)}
                    </h3>

                    <Link
                      href="/gold/buy"
                      className="mt-5 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 font-semibold text-orange-600 transition hover:bg-yellow-100"
                    >
                      Buy Gold
                      <ArrowDownLeft size={16} />
                    </Link>

                  </div>

                  {/* Sell Gold */}
                  <div className="rounded-2xl bg-white/10 p-5 backdrop-blur-sm">

                    <p className="text-sm text-yellow-100">
                      Live Sell Price
                    </p>

                    <h3 className="mt-2 text-3xl font-bold">
                      {safeCurrency(goldPrice.sellPrice)}
                    </h3>

                    <Link
                      href="/gold/sell"
                      className="mt-5 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 font-semibold text-red-600 transition hover:bg-red-50"
                    >
                      Sell Gold
                      <ArrowUpRight size={16} />
                    </Link>

                  </div>

                </div>

                {/* Market Status */}
                <div className="mt-6 rounded-2xl bg-black/10 p-4">

                  <div className="flex items-center justify-between">

                    <div className="flex items-center gap-3">
                      <Activity
                        className={
                          marketOpen
                            ? "text-green-300"
                            : "text-red-300"
                        }
                        size={22}
                      />

                      <div>
                        <p className="font-semibold">
                          Market Status
                        </p>

                        <p className="text-sm text-yellow-100">
                          {marketOpen
                            ? "Gold trading is currently active."
                            : "Trading is disabled by administrator."}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        marketOpen ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                      }`}
                    >
                      {marketOpen ? "OPEN" : "CLOSED"}
                    </span>

                  </div>

                </div>

              </div>
            </section>

            {/* =================================================== */}
            {/* PORTFOLIO BREAKDOWN */}
            {/* =================================================== */}

            <section className="mb-8">
              <div className="rounded-3xl bg-white p-6 shadow-sm">
                <div className="mb-6 flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-900">
                    Portfolio Breakdown
                  </h2>

                  <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                    Live Portfolio
                  </span>
                </div>

                <div className="space-y-5">

                  {/* Gold Assets */}
                  <div>
                    <div className="mb-2 flex justify-between text-sm">
                      <span className="font-medium text-gray-600">
                        Gold Holdings
                      </span>

                      <span className="font-semibold text-gray-900">
                        {formatGold(wallet.gold)} g
                      </span>
                    </div>

                    <div className="h-3 overflow-hidden rounded-full bg-gray-200">
                      <div
                        className="h-full rounded-full bg-yellow-500 transition-all duration-700"
                        style={{
                          width: `${Math.min(wallet.gold * 10, 100)}%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* PKR Assets */}
                  <div>
                    <div className="mb-2 flex justify-between text-sm">
                      <span className="font-medium text-gray-600">
                        PKR Wallet
                      </span>

                      <span className="font-semibold text-gray-900">
                        {safeCurrency(wallet.pkr)}
                      </span>
                    </div>

                    <div className="h-3 overflow-hidden rounded-full bg-gray-200">
                      <div
                        className="h-full rounded-full bg-green-500 transition-all duration-700"
                        style={{
                          width: `${Math.min(wallet.pkr / 10000, 100)}%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* USDT Assets */}
                  <div>
                    <div className="mb-2 flex justify-between text-sm">
                      <span className="font-medium text-gray-600">
                        USDT Wallet
                      </span>

                      <span className="font-semibold text-gray-900">
                        {formatCurrency(wallet.usdt)} USDT
                      </span>
                    </div>

                    <div className="h-3 overflow-hidden rounded-full bg-gray-200">
                      <div
                        className="h-full rounded-full bg-blue-500 transition-all duration-700"
                        style={{
                          width: `${Math.min(wallet.usdt, 100)}%`,
                        }}
                      />
                    </div>
                  </div>

                </div>

                {/* Summary */}
                <div className="mt-8 grid grid-cols-2 gap-5 lg:grid-cols-4">

                  <div className="rounded-2xl bg-gray-50 p-4">
                    <p className="text-xs text-gray-500">Gold Value</p>

                    <h4 className="mt-2 text-xl font-bold text-yellow-600">
                      {safeCurrency(stats.totalGoldValue)}
                    </h4>
                  </div>

                  <div className="rounded-2xl bg-gray-50 p-4">
                    <p className="text-xs text-gray-500">USDT Value</p>

                    <h4 className="mt-2 text-xl font-bold text-blue-600">
                      {safeCurrency(stats.totalUsdtValue)}
                    </h4>
                  </div>

                  <div className="rounded-2xl bg-gray-50 p-4">
                    <p className="text-xs text-gray-500">Investment</p>

                    <h4 className="mt-2 text-xl font-bold text-gray-900">
                      {safeCurrency(portfolio.investment)}
                    </h4>
                  </div>

                  <div className="rounded-2xl bg-gray-50 p-4">
                    <p className="text-xs text-gray-500">Current Value</p>

                    <h4 className="mt-2 text-xl font-bold text-green-600">
                      {safeCurrency(portfolio.currentValue)}
                    </h4>
                  </div>

                </div>
              </div>
            </section>

            {/* =================================================== */}
            {/* LIVE MARKET OVERVIEW */}
            {/* =================================================== */}

            <section className="mb-8">
              <div className="rounded-3xl bg-white p-6 shadow-sm">

                <div className="mb-6 flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-900">
                    Live Market Overview
                  </h2>

                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Activity size={16} className="text-green-500" />
                    Updated {lastUpdatedText}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">

                  <div className="rounded-2xl border border-yellow-200 bg-yellow-50 p-5">
                    <p className="text-sm text-yellow-700">
                      Gold Buy Price
                    </p>

                    <h3 className="mt-2 text-2xl font-bold text-yellow-900">
                      {safeCurrency(goldPrice.buyPrice)}
                    </h3>

                    <p className="mt-2 text-xs text-yellow-700">
                      Per Gram
                    </p>
                  </div>

                  <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
                    <p className="text-sm text-red-700">
                      Gold Sell Price
                    </p>

                    <h3 className="mt-2 text-2xl font-bold text-red-900">
                      {safeCurrency(goldPrice.sellPrice)}
                    </h3>

                    <p className="mt-2 text-xs text-red-700">
                      Per Gram
                    </p>
                  </div>

                  <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5">
                    <p className="text-sm text-blue-700">
                      Gold USD Price
                    </p>

                    <h3 className="mt-2 text-2xl font-bold text-blue-900">
                      $ {formatCurrency(goldPrice.goldPriceUSD)}
                    </h3>

                    <p className="mt-2 text-xs text-blue-700">
                      International Market
                    </p>
                  </div>

                  <div className="rounded-2xl border border-green-200 bg-green-50 p-5">
                    <p className="text-sm text-green-700">
                      USD → PKR Rate
                    </p>

                    <h3 className="mt-2 text-2xl font-bold text-green-900">
                      Rs {formatCurrency(goldPrice.usdToPkr)}
                    </h3>

                    <p className="mt-2 text-xs text-green-700">
                      Exchange Rate
                    </p>
                  </div>

                </div>

                {/* Market Status Banner */}
                <div
                  className={`mt-6 rounded-2xl p-4 ${
                    marketOpen
                      ? "bg-green-50 border border-green-200"
                      : "bg-red-50 border border-red-200"
                  }`}
                >
                  <div className="flex items-center justify-between">

                    <div className="flex items-center gap-3">
                      <Activity
                        size={20}
                        className={
                          marketOpen
                            ? "text-green-600"
                            : "text-red-600"
                        }
                      />

                      <div>
                        <p
                          className={`font-semibold ${
                            marketOpen
                              ? "text-green-700"
                              : "text-red-700"
                          }`}
                        >
                          {marketOpen
                            ? "Gold Market is LIVE"
                            : "Gold Market is CLOSED"}
                        </p>

                        <p className="text-sm text-gray-600">
                          {marketOpen
                            ? "Users can buy and sell gold at live market prices."
                            : "Gold trading is temporarily disabled by administrator."}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        marketOpen ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                      }`}
                    >
                      {goldPrice.marketStatus}
                    </span>

                  </div>
                </div>

              </div>
            </section>

            {/* =================================================== */}
            {/* RECENT TRANSACTIONS */}
            {/* =================================================== */}

            <section className="mb-8">
              <div className="rounded-3xl bg-white p-6 shadow-sm">

                <div className="mb-6 flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-900">
                    Recent Transactions
                  </h2>

                  <Link
                    href="/gold/history"
                    className="text-sm font-semibold text-yellow-600 hover:text-yellow-700"
                  >
                    View All
                  </Link>
                </div>

                {latestTransactions.length === 0 ? (
                  renderEmptyTransactions()
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-left">
                      <thead>
                        <tr className="border-b text-xs uppercase tracking-wide text-gray-500">
                          <th className="pb-3 font-semibold">Type</th>
                          <th className="pb-3 font-semibold">Amount</th>
                          <th className="pb-3 font-semibold">Gold</th>
                          <th className="pb-3 font-semibold">Status</th>
                          <th className="pb-3 font-semibold">Date</th>
                        </tr>
                      </thead>

                      <tbody>
                        {latestTransactions.map((transaction) => (
                          <tr
                            key={transaction._id}
                            className="border-b last:border-0 hover:bg-gray-50"
                          >
                            <td className="py-4">
                              <div
                                className={`inline-flex items-center gap-2 font-semibold ${getTransactionColor(
                                  transaction.type
                                )}`}
                              >
                                {transaction.type === "BUY" && (
                                  <ArrowDownLeft size={16} />
                                )}

                                {transaction.type === "SELL" && (
                                  <ArrowUpRight size={16} />
                                )}

                                {transaction.type === "DEPOSIT" && (
                                  <Wallet size={16} />
                                )}

                                {transaction.type === "WITHDRAW" && (
                                  <DollarSign size={16} />
                                )}

                                {transaction.type}
                              </div>
                            </td>

                            <td className="py-4 font-semibold text-gray-900">
                              {safeCurrency(transaction.amount)}
                            </td>

                            <td className="py-4 text-gray-700">
                              {transaction.goldGrams
                                ? `${formatGold(transaction.goldGrams)} g`
                                : "-"}
                            </td>

                            <td className="py-4">
                              <span
                                className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusStyle(
                                  transaction.status
                                )}`}
                              >
                                {transaction.status}
                              </span>
                            </td>

                            <td className="py-4 text-sm text-gray-500">
                              {formatDate(transaction.createdAt)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

              </div>
            </section>

            {/* =================================================== */}
            {/* ACCOUNT INFORMATION */}
            {/* =================================================== */}

            <section className="mb-8">
              <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">

                {/* User Profile */}
                <div className="rounded-3xl bg-white p-6 shadow-sm">
                  <div className="mb-5 flex items-center gap-4">

                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-yellow-500 to-orange-500 text-2xl font-bold text-white">
                      {(user?.username || username || "U")
                        .charAt(0)
                        .toUpperCase()}
                    </div>

                    <div>
                      <h2 className="text-xl font-bold text-gray-900">
                        {user?.fullName || username}
                      </h2>

                      <p className="text-sm text-gray-500">
                        @{user?.username || username}
                      </p>

                      <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                        {user?.role === "admin"
                          ? "Administrator"
                          : "Verified User"}
                      </span>
                    </div>

                  </div>

                  <div className="space-y-4">

                    <div className="flex items-center justify-between border-b pb-3">
                      <span className="text-gray-500">Username</span>

                      <span className="font-semibold text-gray-900">
                        {user?.username || username}
                      </span>
                    </div>

                    <div className="flex items-center justify-between border-b pb-3">
                      <span className="text-gray-500">Email</span>

                      <span className="font-semibold text-gray-900">
                        {user?.email || "Not Available"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between border-b pb-3">
                      <span className="text-gray-500">Role</span>

                      <span className="font-semibold capitalize text-gray-900">
                        {user?.role || "user"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">
                        Last Dashboard Update
                      </span>

                      <span className="font-semibold text-green-600">
                        {lastUpdatedText}
                      </span>
                    </div>

                  </div>
                </div>

                {/* Security Card */}
                <div className="rounded-3xl bg-gradient-to-br from-green-500 to-emerald-600 p-6 text-white shadow-lg">

                  <div className="mb-4 flex items-center gap-3">
                    <ShieldCheck size={34} />

                    <div>
                      <h2 className="text-xl font-bold">
                        Account Security
                      </h2>

                      <p className="text-green-100 text-sm">
                        GoldTrade Protected Session
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3 text-sm">

                    <div className="flex items-center justify-between">
                      <span>JWT Authentication</span>
                      <span className="font-semibold text-green-100">
                        Active
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span>Wallet Encryption</span>
                      <span className="font-semibold text-green-100">
                        Enabled
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span>Market Connection</span>
                      <span className="font-semibold text-green-100">
                        Live
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span>Session Status</span>

                      <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold">
                        SECURE
                      </span>
                    </div>

                  </div>

                  <button
                    onClick={logout}
                    className="mt-6 w-full rounded-xl bg-white py-3 font-semibold text-green-700 transition hover:bg-green-100"
                  >
                    Logout Securely
                  </button>

                </div>

              </div>
            </section>

            {/* =================================================== */}
            {/* FOOTER */}
            {/* =================================================== */}

            <footer className="rounded-3xl border border-yellow-200 bg-gradient-to-r from-yellow-50 via-orange-50 to-yellow-100 p-6">

              <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

                <div>
                  <h3 className="text-lg font-bold text-gray-900">
                    GoldTrade V18 Dashboard
                  </h3>

                  <p className="mt-1 text-sm text-gray-600">
                    Live Gold Trading • PKR Wallet • USDT Wallet • Portfolio Management
                  </p>

                  <p className="mt-2 text-xs text-gray-500">
                    Connected to GoldTrade API Server
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">

                  <Link
                    href="/gold/buy"
                    className="rounded-xl bg-yellow-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-yellow-600"
                  >
                    Buy Gold
                  </Link>

                  <Link
                    href="/gold/sell"
                    className="rounded-xl bg-red-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-600"
                  >
                    Sell Gold
                  </Link>

                  <Link
                    href="/wallet/deposit"
                    className="rounded-xl bg-blue-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-600"
                  >
                    Deposit
                  </Link>

                  <Link
                    href="/wallet/withdraw"
                    className="rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-700"
                  >
                    Withdraw
                  </Link>

                </div>

              </div>

              <div className="mt-6 border-t border-yellow-200 pt-4 text-center text-xs text-gray-500">
                © 2026 GoldTrade V18 — Secure Trading Platform.
              </div>

            </footer>

          </>
        )}

      </div>
    </main>
  );
}