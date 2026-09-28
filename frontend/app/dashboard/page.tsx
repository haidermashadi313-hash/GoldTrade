"use client";

// ==========================================================
// GoldTrade V18 Enterprise
// USER DASHBOARD
// PART 1/12 (IQ1000 FINAL)
// Next.js 15 + TypeScript + Render + Vercel + Linux
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
// API URL (Production Safe)
// ==========================================================

const API =
  process.env.NEXT_PUBLIC_API_URL?.trim() ||
  "https://goldtrade-2.onrender.com";

// ==========================================================
// TYPES
// ==========================================================

interface WalletData {
  balancePKR: number;
  balanceUSD: number;
  balanceUSDT: number;
  goldBalanceGram: number;
}

interface DashboardStats {
  totalDeposits: number;
  totalWithdrawals: number;
  totalTrades: number;
  totalProfit: number;
  portfolioValue: number;
  liveProfit: number;
}

interface GoldMarket {
  buyPrice: number;
  sellPrice: number;
  marketStatus: "OPEN" | "CLOSED";
}

interface USDTMarket {
  buyPrice: number;
  sellPrice: number;
}

interface Transaction {
  _id: string;
  type: string;
  amount: number;
  currency: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
}

interface DashboardResponse {
  success: boolean;
  message?: string;

  wallet?: WalletData;
  stats?: DashboardStats;
  gold?: GoldMarket;
  usdt?: USDTMarket;

  transactions?: Transaction[];
}

// ==========================================================
// COMPONENT START
// ==========================================================

export default function DashboardPage() {
  const router = useRouter();

  // ========================================================
  // SESSION
  // ========================================================

  const [user, setUser] = useState<GoldTradeUser | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);

  // ========================================================
  // LOADING STATES
  // ========================================================

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // ========================================================
  // ALERTS
  // ========================================================

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // ========================================================
  // NETWORK STATUS
  // ========================================================

  const [isOnline, setIsOnline] = useState(true);

  // ========================================================
  // WALLET STATE
  // ========================================================

  const [wallet, setWallet] = useState<WalletData>({
    balancePKR: 0,
    balanceUSD: 0,
    balanceUSDT: 0,
    goldBalanceGram: 0,
  });

  // ========================================================
  // DASHBOARD STATS
  // ========================================================

  const [stats, setStats] = useState<DashboardStats>({
    totalDeposits: 0,
    totalWithdrawals: 0,
    totalTrades: 0,
    totalProfit: 0,
    portfolioValue: 0,
    liveProfit: 0,
  });

  // ========================================================
  // GOLD MARKET
  // ========================================================

  const [goldMarket, setGoldMarket] = useState<GoldMarket>({
    buyPrice: 0,
    sellPrice: 0,
    marketStatus: "OPEN",
  });

  // ========================================================
  // USDT MARKET
  // ========================================================

  const [usdtMarket, setUsdtMarket] = useState<USDTMarket>({
    buyPrice: 0,
    sellPrice: 0,
  });

  // ========================================================
  // TRANSACTIONS
  // ========================================================

  const [transactions, setTransactions] = useState<Transaction[]>([]);

  // ========================================================
  // PAGE TITLE
  // ========================================================

  useEffect(() => {
    document.title = "Dashboard • GoldTrade V18 Enterprise";
  }, []);

  // ========================================================
  // NETWORK STATUS LISTENER
  // ========================================================

  useEffect(() => {
    const updateNetwork = () => {
      setIsOnline(window.navigator.onLine);
    };

    updateNetwork();

    window.addEventListener("online", updateNetwork);
    window.addEventListener("offline", updateNetwork);

    return () => {
      window.removeEventListener("online", updateNetwork);
      window.removeEventListener("offline", updateNetwork);
    };
  }, []);

  // ========================================================
  // AUTO CLEAR ALERTS
  // ========================================================

  useEffect(() => {
    if (!errorMessage) return;

    const timer = setTimeout(() => {
      setErrorMessage("");
    }, 4000);

    return () => clearTimeout(timer);
  }, [errorMessage]);

  useEffect(() => {
    if (!successMessage) return;

    const timer = setTimeout(() => {
      setSuccessMessage("");
    }, 2500);

    return () => clearTimeout(timer);
  }, [successMessage]);
    // ========================================================
  // SESSION CHECK (IQ1000 FINAL - NO LOOP)
  // ========================================================

  useEffect(() => {
    let mounted = true;

    const checkSession = async () => {
      try {
        const session = getSession();

        // No session
        if (!session?.token) {
          if (mounted) {
            setCheckingSession(false);
            router.replace("/login");
          }
          return;
        }

        // Only user dashboard allowed
        if (session.user.role !== "user") {
          if (mounted) {
            setCheckingSession(false);
            router.replace("/admin/dashboard");
          }
          return;
        }

        // Verify JWT with backend
        const response = await fetch(`${API}/api/auth/check`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${session.token}`,
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          cache: "no-store",
          credentials: "omit",
        });

        const data = await response.json();

        console.log("SESSION CHECK:", data);

        if (response.ok && data.success) {
          if (mounted) {
            setUser(session.user);
          }
        } else {
          logout();
          return;
        }
      } catch (error) {
        console.error("SESSION CHECK ERROR:", error);

        if (mounted) {
          logout();
        }
      } finally {
        if (mounted) {
          setCheckingSession(false);
        }
      }
    };

    checkSession();

    return () => {
      mounted = false;
    };
  }, [router]);

  // ========================================================
  // LOADING SCREEN
  // ========================================================

  if (checkingSession) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="h-12 w-12 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin mx-auto mb-5" />

          <h1 className="text-3xl font-bold text-yellow-400">
            GoldTrade V18
          </h1>

          <p className="text-gray-400 mt-2">
            Checking secure session...
          </p>
        </div>
      </div>
    );
  }

  // ========================================================
  // LOAD DASHBOARD (MASTER FUNCTION)
  // ========================================================

  const loadDashboard = useCallback(async () => {
    const session = getSession();

    if (!session?.token) {
      logout();
      return;
    }

    try {
      setLoading(true);
      setRefreshing(true);

      setErrorMessage("");
      setSuccessMessage("");

      console.log("Loading Dashboard...");

      // Load all APIs together
      await Promise.all([
        loadWallet(session.token),
        loadDashboardStats(session.token),
        loadGoldMarket(session.token),
        loadUSDTMarket(session.token),
        loadTransactions(session.token),
      ]);

      setSuccessMessage("Dashboard synced successfully.");
    } catch (error: any) {
      console.error("Dashboard Load Error:", error);

      setErrorMessage(
        error?.message || "Failed to fetch dashboard data."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // ========================================================
  // INITIAL LOAD
  // ========================================================

  useEffect(() => {
    if (checkingSession) return;

    loadDashboard();
  }, [checkingSession, loadDashboard]);

  // ========================================================
  // AUTO REFRESH EVERY 30 SECONDS
  // ========================================================

  useEffect(() => {
    if (checkingSession) return;

    const interval = setInterval(() => {
      if (document.visibilityState === "visible") {
        loadDashboard();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [checkingSession, loadDashboard]);

  // ========================================================
  // REFRESH BUTTON
  // ========================================================

  const handleRefresh = async () => {
    await loadDashboard();
  };

  // ========================================================
  // LOGOUT BUTTON
  // ========================================================

  const handleLogout = () => {
    logout();
  };
    // ========================================================
  // LOAD WALLET (IQ1000 FINAL)
  // Endpoint: GET /api/wallet/dashboard
  // ========================================================

  const loadWallet = async (token: string) => {
    console.log("Loading Wallet...");

    const response = await fetch(`${API}/api/wallet/dashboard`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      cache: "no-store",
      credentials: "omit",
    });

    if (response.status === 401) {
      logout();
      throw new Error("Session expired.");
    }

    const data = await response.json();

    console.log("Wallet API:", data);

    if (!response.ok || !data.success) {
      throw new Error(data.message || "Wallet API failed.");
    }

    setWallet({
      balancePKR: Number(data.wallet?.balancePKR ?? 0),
      balanceUSD: Number(data.wallet?.balanceUSD ?? 0),
      balanceUSDT: Number(data.wallet?.balanceUSDT ?? 0),
      goldBalanceGram: Number(data.wallet?.goldBalanceGram ?? 0),
    });
  };

  // ========================================================
  // LOAD DASHBOARD STATS (IQ1000 FINAL)
  // Endpoint: GET /api/wallet/dashboard
  // ========================================================

  const loadDashboardStats = async (token: string) => {
    console.log("Loading Dashboard Stats...");

    const response = await fetch(`${API}/api/wallet/dashboard`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      cache: "no-store",
      credentials: "omit",
    });

    if (response.status === 401) {
      logout();
      throw new Error("Session expired.");
    }

    if (response.status === 429) {
      throw new Error("Too many requests. Please refresh after a few seconds.");
    }

    const data = await response.json();

    console.log("Dashboard Stats API:", data);

    if (!response.ok || !data.success) {
      throw new Error(data.message || "Dashboard Stats API failed.");
    }

    setStats({
      totalDeposits: Number(data.stats?.totalDeposits ?? 0),
      totalWithdrawals: Number(data.stats?.totalWithdrawals ?? 0),
      totalTrades: Number(data.stats?.totalTrades ?? 0),
      totalProfit: Number(data.stats?.totalProfit ?? 0),
      portfolioValue: Number(data.stats?.portfolioValue ?? 0),
      liveProfit: Number(data.stats?.liveProfit ?? 0),
    });
  };

  // ========================================================
  // DASHBOARD SUMMARY (Derived)
  // ========================================================

  const totalPortfolioValue = useMemo(() => {
    return Number(stats.portfolioValue || 0);
  }, [stats]);

  const walletHealth = useMemo(() => {
    if (totalPortfolioValue >= 1000000) return "Excellent";
    if (totalPortfolioValue >= 500000) return "Healthy";
    if (totalPortfolioValue >= 100000) return "Stable";
    return "Low";
  }, [totalPortfolioValue]);

  const marketStatusColor = useMemo(() => {
    return goldMarket.marketStatus === "OPEN"
      ? "text-green-400"
      : "text-red-400";
  }, [goldMarket.marketStatus]);

  const marketStatusBg = useMemo(() => {
    return goldMarket.marketStatus === "OPEN"
      ? "bg-green-500/10 border-green-500/30"
      : "bg-red-500/10 border-red-500/30";
  }, [goldMarket.marketStatus]);

  // ========================================================
  // WALLET CARDS DATA
  // ========================================================

  const walletCards = useMemo(
    () => [
      {
        title: "Wallet Balance",
        value: wallet.balancePKR,
        prefix: "PKR ",
        color: "text-green-400",
        border: "border-green-500/20",
      },
      {
        title: "USDT Balance",
        value: wallet.balanceUSDT,
        prefix: "",
        suffix: " USDT",
        color: "text-cyan-400",
        border: "border-cyan-500/20",
      },
      {
        title: "Gold Balance",
        value: wallet.goldBalanceGram,
        prefix: "",
        suffix: " g",
        color: "text-yellow-400",
        border: "border-yellow-500/20",
      },
      {
        title: "Live Profit",
        value: stats.liveProfit,
        prefix: "PKR ",
        color:
          stats.liveProfit >= 0 ? "text-green-400" : "text-red-400",
        border:
          stats.liveProfit >= 0
            ? "border-green-500/20"
            : "border-red-500/20",
      },
    ],
    [wallet, stats]
  );

  // ========================================================
  // OVERVIEW CARDS
  // ========================================================

  const overviewCards = useMemo(
    () => [
      {
        title: "Total Deposits",
        value: stats.totalDeposits,
        prefix: "PKR ",
        color: "text-green-400",
      },
      {
        title: "Total Withdrawals",
        value: stats.totalWithdrawals,
        prefix: "PKR ",
        color: "text-red-400",
      },
      {
        title: "Total Trades",
        value: stats.totalTrades,
        prefix: "",
        color: "text-blue-400",
      },
      {
        title: "Portfolio Value",
        value: stats.portfolioValue,
        prefix: "PKR ",
        color: "text-yellow-400",
      },
    ],
    [stats]
  );
    // ========================================================
  // LOAD GOLD MARKET (IQ1000 FINAL)
  // Endpoint: GET /api/gold/price
  // ========================================================

  const loadGoldMarket = async (token: string) => {
    console.log("Loading Gold Market...");

    const response = await fetch(`${API}/api/gold/price`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      cache: "no-store",
      credentials: "omit",
    });

    if (response.status === 401) {
      logout();
      throw new Error("Session expired.");
    }

    const data = await response.json();

    console.log("Gold Market API:", data);

    if (!response.ok || !data.success) {
      throw new Error(data.message || "Gold Market API failed.");
    }

    setGoldMarket({
      buyPrice: Number(data.buyPrice ?? data.gold?.buyPrice ?? 0),
      sellPrice: Number(data.sellPrice ?? data.gold?.sellPrice ?? 0),
      marketStatus: data.marketStatus ?? data.gold?.marketStatus ?? "OPEN",
    });
  };

  // ========================================================
  // LOAD USDT MARKET (IQ1000 FINAL)
  // Endpoint: GET /api/usdt/price
  // ========================================================

  const loadUSDTMarket = async (token: string) => {
    console.log("Loading USDT Market...");

    const response = await fetch(`${API}/api/usdt/price`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      cache: "no-store",
      credentials: "omit",
    });

    if (response.status === 401) {
      logout();
      throw new Error("Session expired.");
    }

    const data = await response.json();

    console.log("USDT Market API:", data);

    if (!response.ok || !data.success) {
      throw new Error(data.message || "USDT Market API failed.");
    }

    setUsdtMarket({
      buyPrice: Number(data.buyPrice ?? data.usdt?.buyPrice ?? 0),
      sellPrice: Number(data.sellPrice ?? data.usdt?.sellPrice ?? 0),
    });
  };

  // ========================================================
  // LIVE MARKET STATUS
  // ========================================================

  const isMarketOpen = useMemo(() => {
    return goldMarket.marketStatus === "OPEN";
  }, [goldMarket.marketStatus]);

  const marketStatusText = useMemo(() => {
    return isMarketOpen ? "Market Open" : "Market Closed";
  }, [isMarketOpen]);

  const marketStatusBadge = useMemo(() => {
    return isMarketOpen
      ? "bg-green-500/10 text-green-400 border-green-500/30"
      : "bg-red-500/10 text-red-400 border-red-500/30";
  }, [isMarketOpen]);

  // ========================================================
  // GOLD PRICE CHANGE
  // ========================================================

  const goldSpread = useMemo(() => {
    return Number(goldMarket.sellPrice - goldMarket.buyPrice);
  }, [goldMarket]);

  // ========================================================
  // USDT PRICE CHANGE
  // ========================================================

  const usdtSpread = useMemo(() => {
    return Number(usdtMarket.sellPrice - usdtMarket.buyPrice);
  }, [usdtMarket]);

  // ========================================================
  // GOLD MARKET CARDS
  // ========================================================

  const goldCards = useMemo(
    () => [
      {
        title: "Gold Buy Price",
        value: goldMarket.buyPrice,
        color: "text-yellow-400",
        border: "border-yellow-500/20",
        prefix: "PKR ",
      },
      {
        title: "Gold Sell Price",
        value: goldMarket.sellPrice,
        color: "text-yellow-300",
        border: "border-yellow-500/20",
        prefix: "PKR ",
      },
      {
        title: "Market Spread",
        value: goldSpread,
        color: "text-orange-400",
        border: "border-orange-500/20",
        prefix: "PKR ",
      },
      {
        title: "Market Status",
        value: marketStatusText,
        color: isMarketOpen ? "text-green-400" : "text-red-400",
        border: isMarketOpen
          ? "border-green-500/20"
          : "border-red-500/20",
        isStatus: true,
      },
    ],
    [
      goldMarket.buyPrice,
      goldMarket.sellPrice,
      goldSpread,
      marketStatusText,
      isMarketOpen,
    ]
  );

  // ========================================================
  // USDT MARKET CARDS
  // ========================================================

  const usdtCards = useMemo(
    () => [
      {
        title: "USDT Buy Price",
        value: usdtMarket.buyPrice,
        color: "text-cyan-400",
        border: "border-cyan-500/20",
        prefix: "PKR ",
      },
      {
        title: "USDT Sell Price",
        value: usdtMarket.sellPrice,
        color: "text-cyan-300",
        border: "border-cyan-500/20",
        prefix: "PKR ",
      },
      {
        title: "USDT Spread",
        value: usdtSpread,
        color: "text-blue-400",
        border: "border-blue-500/20",
        prefix: "PKR ",
      },
    ],
    [
      usdtMarket.buyPrice,
      usdtMarket.sellPrice,
      usdtSpread,
    ]
  );

  // ========================================================
  // QUICK MARKET SUMMARY
  // ========================================================

  const marketSummary = useMemo(() => {
    return {
      goldBuy: goldMarket.buyPrice,
      goldSell: goldMarket.sellPrice,
      usdtBuy: usdtMarket.buyPrice,
      usdtSell: usdtMarket.sellPrice,
      status: marketStatusText,
    };
  }, [goldMarket, usdtMarket, marketStatusText]);
    // ========================================================
  // LOAD USER PORTFOLIO (IQ1000 FINAL)
  // Endpoint: GET /api/gold/portfolio/:username
  // ========================================================

  const loadPortfolio = async (token: string) => {
    const session = getSession();

    if (!session?.user?.username) return;

    console.log("Loading Portfolio...");

    const response = await fetch(
      `${API}/api/gold/portfolio/${session.user.username}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        cache: "no-store",
        credentials: "omit",
      }
    );

    if (response.status === 401) {
      logout();
      throw new Error("Session expired.");
    }

    const data = await response.json();

    console.log("Portfolio API:", data);

    if (!response.ok || !data.success) {
      throw new Error(data.message || "Portfolio API failed.");
    }

    // Portfolio value sync with dashboard
    setStats((prev) => ({
      ...prev,
      portfolioValue: Number(data.portfolio?.portfolioValue ?? prev.portfolioValue),
      liveProfit: Number(data.portfolio?.liveProfit ?? prev.liveProfit),
    }));

    setWallet((prev) => ({
      ...prev,
      goldBalanceGram: Number(data.portfolio?.goldBalanceGram ?? prev.goldBalanceGram),
    }));
  };

  // ========================================================
  // LOAD USDT PORTFOLIO (IQ1000 FINAL)
  // Endpoint: GET /api/usdt/portfolio/:username
  // ========================================================

  const loadUSDTPortfolio = async (token: string) => {
    const session = getSession();

    if (!session?.user?.username) return;

    console.log("Loading USDT Portfolio...");

    const response = await fetch(
      `${API}/api/usdt/portfolio/${session.user.username}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        cache: "no-store",
        credentials: "omit",
      }
    );

    if (response.status === 401) {
      logout();
      throw new Error("Session expired.");
    }

    const data = await response.json();

    console.log("USDT Portfolio API:", data);

    if (!response.ok || !data.success) {
      throw new Error(data.message || "USDT Portfolio API failed.");
    }

    setWallet((prev) => ({
      ...prev,
      balanceUSDT: Number(data.portfolio?.balanceUSDT ?? prev.balanceUSDT),
    }));
  };

  // ========================================================
  // BALANCE SUMMARY
  // ========================================================

  const balanceSummary = useMemo(() => {
    return {
      totalWallet:
        Number(wallet.balancePKR) +
        Number(wallet.balanceUSD) +
        Number(wallet.balanceUSDT * usdtMarket.sellPrice),

      totalGoldValue:
        Number(wallet.goldBalanceGram) *
        Number(goldMarket.sellPrice),

      totalAssets:
        Number(wallet.balancePKR) +
        Number(wallet.balanceUSD) +
        Number(wallet.balanceUSDT * usdtMarket.sellPrice) +
        Number(wallet.goldBalanceGram * goldMarket.sellPrice),
    };
  }, [wallet, goldMarket, usdtMarket]);

  // ========================================================
  // PERFORMANCE CARDS
  // ========================================================

  const performanceCards = useMemo(
    () => [
      {
        title: "Total Assets",
        value: balanceSummary.totalAssets,
        prefix: "PKR ",
        color: "text-yellow-400",
      },
      {
        title: "Gold Value",
        value: balanceSummary.totalGoldValue,
        prefix: "PKR ",
        color: "text-yellow-300",
      },
      {
        title: "USDT Wallet Value",
        value: wallet.balanceUSDT * usdtMarket.sellPrice,
        prefix: "PKR ",
        color: "text-cyan-400",
      },
      {
        title: "Wallet Health",
        value: walletHealth,
        isStatus: true,
        color:
          walletHealth === "Excellent"
            ? "text-green-400"
            : walletHealth === "Healthy"
            ? "text-blue-400"
            : walletHealth === "Stable"
            ? "text-yellow-400"
            : "text-red-400",
      },
    ],
    [balanceSummary, wallet, usdtMarket, walletHealth]
  );

  // ========================================================
  // GOLD HOLDINGS
  // ========================================================

  const goldHoldingCards = useMemo(
    () => [
      {
        title: "Gold Holdings (Gram)",
        value: wallet.goldBalanceGram,
        suffix: " g",
        color: "text-yellow-400",
      },
      {
        title: "Current Gold Value",
        value: wallet.goldBalanceGram * goldMarket.sellPrice,
        prefix: "PKR ",
        color: "text-yellow-300",
      },
      {
        title: "Gold Buy Price",
        value: goldMarket.buyPrice,
        prefix: "PKR ",
        color: "text-green-400",
      },
      {
        title: "Gold Sell Price",
        value: goldMarket.sellPrice,
        prefix: "PKR ",
        color: "text-red-400",
      },
    ],
    [wallet, goldMarket]
  );

  // ========================================================
  // USDT HOLDINGS
  // ========================================================

  const usdtHoldingCards = useMemo(
    () => [
      {
        title: "USDT Holdings",
        value: wallet.balanceUSDT,
        suffix: " USDT",
        color: "text-cyan-400",
      },
      {
        title: "USDT Wallet Value",
        value: wallet.balanceUSDT * usdtMarket.sellPrice,
        prefix: "PKR ",
        color: "text-green-400",
      },
      {
        title: "USDT Buy Rate",
        value: usdtMarket.buyPrice,
        prefix: "PKR ",
        color: "text-blue-400",
      },
      {
        title: "USDT Sell Rate",
        value: usdtMarket.sellPrice,
        prefix: "PKR ",
        color: "text-blue-300",
      },
    ],
    [wallet, usdtMarket]
  );
    // ========================================================
  // LOAD TRANSACTIONS (IQ1000 FINAL)
  // Endpoint: GET /api/transactions/history
  // ========================================================

  const loadTransactions = async (token: string) => {
    const session = getSession();

    if (!session?.user?.username) return;

    console.log("Loading Transactions...");

    const response = await fetch(`${API}/api/transactions/history`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      cache: "no-store",
      credentials: "omit",
    });

    if (response.status === 401) {
      logout();
      throw new Error("Session expired.");
    }

    if (response.status === 429) {
      throw new Error("Too many requests. Please refresh after a few seconds.");
    }

    const data = await response.json();

    console.log("Transactions API:", data);

    if (!response.ok || !data.success) {
      throw new Error(data.message || "Transactions API failed.");
    }

    setTransactions(Array.isArray(data.transactions) ? data.transactions : []);
  };

  // ========================================================
  // RECENT TRANSACTIONS (LATEST 10)
  // ========================================================

  const recentTransactions = useMemo(() => {
    return [...transactions]
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() -
          new Date(a.createdAt).getTime()
      )
      .slice(0, 10);
  }, [transactions]);

  // ========================================================
  // TRANSACTION SUMMARY
  // ========================================================

  const transactionSummary = useMemo(() => {
    const deposits = transactions.filter((t) => t.type === "deposit");
    const withdrawals = transactions.filter((t) => t.type === "withdraw");
    const goldTrades = transactions.filter((t) => t.type === "gold");
    const usdtTrades = transactions.filter((t) => t.type === "usdt");

    return {
      deposits: deposits.length,
      withdrawals: withdrawals.length,
      goldTrades: goldTrades.length,
      usdtTrades: usdtTrades.length,
      total: transactions.length,
    };
  }, [transactions]);

  // ========================================================
  // PENDING TRANSACTIONS
  // ========================================================

  const pendingTransactions = useMemo(() => {
    return transactions.filter((t) => t.status === "pending");
  }, [transactions]);

  // ========================================================
  // APPROVED TRANSACTIONS
  // ========================================================

  const approvedTransactions = useMemo(() => {
    return transactions.filter((t) => t.status === "approved");
  }, [transactions]);

  // ========================================================
  // REJECTED TRANSACTIONS
  // ========================================================

  const rejectedTransactions = useMemo(() => {
    return transactions.filter((t) => t.status === "rejected");
  }, [transactions]);

  // ========================================================
  // DASHBOARD REFRESH (Manual Button)
  // ========================================================

  const refreshDashboard = useCallback(async () => {
    try {
      setRefreshing(true);
      await loadDashboard();
      setSuccessMessage("Dashboard refreshed successfully.");
    } catch (error: any) {
      console.error("Refresh Error:", error);
      setErrorMessage(error.message || "Unable to refresh dashboard.");
    } finally {
      setRefreshing(false);
    }
  }, [loadDashboard]);

  // ========================================================
  // AUTO REFRESH WHEN USER RETURNS TO TAB
  // ========================================================

  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        loadDashboard();
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [loadDashboard]);

  // ========================================================
  // NETWORK RECOVERY
  // ========================================================

  useEffect(() => {
    if (!isOnline) return;

    const timeout = setTimeout(() => {
      loadDashboard();
    }, 1500);

    return () => clearTimeout(timeout);
  }, [isOnline, loadDashboard]);

  // ========================================================
  // RETRY API REQUEST
  // ========================================================

  const retryDashboard = useCallback(async () => {
    setErrorMessage("");
    await loadDashboard();
  }, [loadDashboard]);

  // ========================================================
  // TRANSACTION STATUS COLORS
  // ========================================================

  const getStatusColor = (status: Transaction["status"]) => {
    switch (status) {
      case "approved":
        return "text-green-400 bg-green-500/10 border-green-500/20";
      case "pending":
        return "text-yellow-400 bg-yellow-500/10 border-yellow-500/20";
      case "rejected":
        return "text-red-400 bg-red-500/10 border-red-500/20";
      default:
        return "text-gray-400 bg-gray-500/10 border-gray-500/20";
    }
  };

  // ========================================================
  // TRANSACTION TYPE COLORS
  // ========================================================

  const getTransactionColor = (type: string) => {
    switch (type.toLowerCase()) {
      case "deposit":
        return "text-green-400";
      case "withdraw":
        return "text-red-400";
      case "gold":
        return "text-yellow-400";
      case "usdt":
        return "text-cyan-400";
      default:
        return "text-white";
    }
  };

  // ========================================================
  // TRANSACTION ICON LABEL
  // ========================================================

  const getTransactionLabel = (type: string) => {
    switch (type.toLowerCase()) {
      case "deposit":
        return "Deposit";
      case "withdraw":
        return "Withdraw";
      case "gold":
        return "Gold Trade";
      case "usdt":
        return "USDT Trade";
      default:
        return type;
    }
  };
    // ========================================================
  // FORMAT HELPERS (IQ1000 FINAL)
  // ========================================================

  const formatCurrency = (value: number | string | undefined) => {
    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Number(value || 0));
  };

  const formatNumber = (value: number | string | undefined) => {
    return new Intl.NumberFormat("en-US").format(Number(value || 0));
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  // ========================================================
  // USER DISPLAY NAME
  // ========================================================

  const displayName = useMemo(() => {
    if (!user?.username) return "GoldTrade User";

    return user.username.charAt(0).toUpperCase() + user.username.slice(1);
  }, [user]);

  // ========================================================
  // DASHBOARD SUMMARY CARDS
  // ========================================================

  const dashboardCards = useMemo(
    () => [
      {
        title: "Wallet Balance",
        value: wallet.balancePKR,
        prefix: "PKR ",
        color: "text-green-400",
        bg: "bg-green-500/10",
        border: "border-green-500/20",
      },
      {
        title: "Portfolio Value",
        value: stats.portfolioValue,
        prefix: "PKR ",
        color: "text-yellow-400",
        bg: "bg-yellow-500/10",
        border: "border-yellow-500/20",
      },
      {
        title: "Live Profit",
        value: stats.liveProfit,
        prefix: "PKR ",
        color:
          stats.liveProfit >= 0
            ? "text-green-400"
            : "text-red-400",
        bg:
          stats.liveProfit >= 0
            ? "bg-green-500/10"
            : "bg-red-500/10",
        border:
          stats.liveProfit >= 0
            ? "border-green-500/20"
            : "border-red-500/20",
      },
      {
        title: "USDT Balance",
        value: wallet.balanceUSDT,
        suffix: " USDT",
        color: "text-cyan-400",
        bg: "bg-cyan-500/10",
        border: "border-cyan-500/20",
      },
      {
        title: "Gold Holdings",
        value: wallet.goldBalanceGram,
        suffix: " g",
        color: "text-yellow-300",
        bg: "bg-yellow-400/10",
        border: "border-yellow-400/20",
      },
      {
        title: "Total Trades",
        value: stats.totalTrades,
        color: "text-blue-400",
        bg: "bg-blue-500/10",
        border: "border-blue-500/20",
      },
    ],
    [wallet, stats]
  );

  // ========================================================
  // QUICK ACTIONS
  // ========================================================

  const quickActions = useMemo(
    () => [
      {
        title: "Buy Gold",
        href: "/gold/buy",
        description: "Purchase live gold instantly.",
        color: "border-yellow-500/30 hover:border-yellow-400",
      },
      {
        title: "Sell Gold",
        href: "/gold/sell",
        description: "Sell your gold holdings.",
        color: "border-orange-500/30 hover:border-orange-400",
      },
      {
        title: "Buy USDT",
        href: "/usdt/buy",
        description: "Purchase USDT using PKR wallet.",
        color: "border-cyan-500/30 hover:border-cyan-400",
      },
      {
        title: "Sell USDT",
        href: "/usdt/sell",
        description: "Sell USDT to your PKR wallet.",
        color: "border-blue-500/30 hover:border-blue-400",
      },
      {
        title: "Deposit Funds",
        href: "/deposit",
        description: "Add PKR or Crypto to wallet.",
        color: "border-green-500/30 hover:border-green-400",
      },
      {
        title: "Withdraw Funds",
        href: "/withdraw",
        description: "Withdraw PKR or Crypto balance.",
        color: "border-red-500/30 hover:border-red-400",
      },
      {
        title: "Wallet",
        href: "/wallet",
        description: "View wallet balances and history.",
        color: "border-purple-500/30 hover:border-purple-400",
      },
      {
        title: "History",
        href: "/transactions",
        description: "View complete transaction history.",
        color: "border-gray-500/30 hover:border-white",
      },
    ],
    []
  );

  // ========================================================
  // MARKET OVERVIEW CARDS
  // ========================================================

  const marketOverview = useMemo(
    () => [
      {
        title: "Gold Buy Price",
        value: goldMarket.buyPrice,
        prefix: "PKR ",
        color: "text-yellow-400",
      },
      {
        title: "Gold Sell Price",
        value: goldMarket.sellPrice,
        prefix: "PKR ",
        color: "text-yellow-300",
      },
      {
        title: "USDT Buy Rate",
        value: usdtMarket.buyPrice,
        prefix: "PKR ",
        color: "text-cyan-400",
      },
      {
        title: "USDT Sell Rate",
        value: usdtMarket.sellPrice,
        prefix: "PKR ",
        color: "text-cyan-300",
      },
    ],
    [goldMarket, usdtMarket]
  );

  // ========================================================
  // PORTFOLIO SUMMARY
  // ========================================================

  const portfolioSummary = useMemo(() => {
    return [
      {
        title: "PKR Wallet",
        value: wallet.balancePKR,
        prefix: "PKR ",
        color: "text-green-400",
      },
      {
        title: "USD Wallet",
        value: wallet.balanceUSD,
        prefix: "$ ",
        color: "text-blue-400",
      },
      {
        title: "USDT Wallet",
        value: wallet.balanceUSDT,
        suffix: " USDT",
        color: "text-cyan-400",
      },
      {
        title: "Gold Holdings",
        value: wallet.goldBalanceGram,
        suffix: " g",
        color: "text-yellow-400",
      },
      {
        title: "Total Assets",
        value: balanceSummary.totalAssets,
        prefix: "PKR ",
        color: "text-yellow-300",
      },
    ];
  }, [wallet, balanceSummary]);

  // ========================================================
  // GREETING MESSAGE
  // ========================================================

  const greeting = useMemo(() => {
    const hour = new Date().getHours();

    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    if (hour < 21) return "Good Evening";

    return "Welcome Back";
  }, []);

  // ========================================================
  // MARKET STATUS LABEL
  // ========================================================

  const marketStatusLabel = useMemo(() => {
    return goldMarket.marketStatus === "OPEN"
      ? "Live Trading Active"
      : "Trading Closed";
  }, [goldMarket.marketStatus]);
  // ========================================================
// DASHBOARD HEADER + ALERTS + WALLET SUMMARY UI
// PART 8/12 (IQ1000 FINAL)
// ========================================================

return (
  <div className="min-h-screen bg-black text-white">

    {/* ==================================================== */}
    {/* TOP HEADER */}
    {/* ==================================================== */}

    <header className="sticky top-0 z-40 border-b border-yellow-500/20 bg-black/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 lg:px-8">

        <div>
          <h1 className="text-2xl font-bold text-yellow-400">
            GoldTrade V18 Enterprise
          </h1>

          <p className="mt-1 text-sm text-gray-400">
            {greeting}, {displayName}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={refreshDashboard}
            disabled={refreshing}
            className="rounded-xl border border-yellow-500/30 px-4 py-2 text-sm font-semibold text-yellow-400 transition hover:bg-yellow-500/10 disabled:opacity-50"
          >
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>

          <button
            onClick={handleLogout}
            className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
          >
            Logout
          </button>
        </div>
      </div>
    </header>

    {/* ==================================================== */}
    {/* PAGE CONTENT */}
    {/* ==================================================== */}

    <main className="mx-auto max-w-7xl space-y-8 px-4 py-6 lg:px-8">

      {/* ================================================ */}
      {/* NETWORK STATUS */}
      {/* ================================================ */}

      {!isOnline && (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-red-300">
          Internet connection lost. Waiting for network...
        </div>
      )}

      {/* ================================================ */}
      {/* ERROR ALERT */}
      {/* ================================================ */}

      {errorMessage && (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="font-semibold text-red-400">
                Failed to fetch dashboard
              </h3>

              <p className="mt-1 text-sm text-red-200">
                {errorMessage}
              </p>
            </div>

            <button
              onClick={retryDashboard}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* ================================================ */}
      {/* SUCCESS ALERT */}
      {/* ================================================ */}

      {successMessage && (
        <div className="rounded-2xl border border-green-500/30 bg-green-500/10 p-4 text-green-300">
          {successMessage}
        </div>
      )}

      {/* ================================================ */}
      {/* MARKET STATUS */}
      {/* ================================================ */}

      <section
        className={`rounded-3xl border p-6 ${marketStatusBg}`}
      >
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">

          <div>
            <h2 className="text-xl font-bold text-yellow-400">
              Live Market Status
            </h2>

            <p className={`mt-2 text-lg font-semibold ${marketStatusColor}`}>
              {marketStatusLabel}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 text-right lg:grid-cols-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-400">
                Gold Buy
              </p>
              <h3 className="text-lg font-bold text-yellow-400">
                PKR {formatCurrency(goldMarket.buyPrice)}
              </h3>
            </div>

            <div>
              <p className="text-xs uppercase tracking-wide text-gray-400">
                Gold Sell
              </p>
              <h3 className="text-lg font-bold text-yellow-300">
                PKR {formatCurrency(goldMarket.sellPrice)}
              </h3>
            </div>

            <div>
              <p className="text-xs uppercase tracking-wide text-gray-400">
                USDT Buy
              </p>
              <h3 className="text-lg font-bold text-cyan-400">
                PKR {formatCurrency(usdtMarket.buyPrice)}
              </h3>
            </div>

            <div>
              <p className="text-xs uppercase tracking-wide text-gray-400">
                USDT Sell
              </p>
              <h3 className="text-lg font-bold text-cyan-300">
                PKR {formatCurrency(usdtMarket.sellPrice)}
              </h3>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================ */}
      {/* WALLET SUMMARY */}
      {/* ================================================ */}

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {dashboardCards.map((card) => (
          <div
            key={card.title}
            className={`rounded-3xl border p-6 ${card.bg} ${card.border}`}
          >
            <p className="text-sm uppercase tracking-wide text-gray-400">
              {card.title}
            </p>

            <h3 className={`mt-3 text-3xl font-bold ${card.color}`}>
              {card.prefix || ""}
              {formatCurrency(card.value)}
              {card.suffix || ""}
            </h3>
          </div>
        ))}
      </section>

      {/* ================================================ */}
      {/* PORTFOLIO SUMMARY */}
      {/* ================================================ */}

      <section className="rounded-3xl border border-gray-800 bg-zinc-950 p-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-yellow-400">
              Portfolio Summary
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Live balances synced with wallet and market.
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {portfolioSummary.map((item) => (
            <div
              key={item.title}
              className="rounded-2xl border border-gray-800 bg-black p-5"
            >
              <p className="text-xs uppercase tracking-wide text-gray-500">
                {item.title}
              </p>

              <h3 className={`mt-3 text-xl font-bold ${item.color}`}>
                {item.prefix || ""}
                {formatCurrency(item.value)}
                {item.suffix || ""}
              </h3>
            </div>
          ))}
        </div>
      </section>

      {/* ================================================ */}
      {/* QUICK ACTIONS */}
      {/* ================================================ */}

      <section>
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-yellow-400">
            Quick Actions
          </h2>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {quickActions.map((action) => (
            <Link
              key={action.title}
              href={action.href}
              className={`rounded-3xl border bg-zinc-950 p-5 transition hover:bg-zinc-900 ${action.color}`}
            >
              <h3 className="font-semibold text-white">
                {action.title}
              </h3>

              <p className="mt-2 text-sm text-gray-400">
                {action.description}
              </p>
            </Link>
          ))}
        </div>
      </section>      {/* ================================================ */}
      {/* LIVE GOLD MARKET */}
      {/* ================================================ */}

      <section className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-yellow-400">
              Gold Market
            </h2>
            <p className="text-sm text-gray-500">
              Live buy/sell prices synced from backend.
            </p>
          </div>

          <div
            className={`rounded-full border px-4 py-2 text-xs font-semibold ${marketStatusBadge}`}
          >
            {marketStatusLabel}
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {goldCards.map((card) => (
            <div
              key={card.title}
              className={`rounded-3xl border bg-zinc-950 p-6 ${card.border}`}
            >
              <p className="text-xs uppercase tracking-wide text-gray-500">
                {card.title}
              </p>

              {card.isStatus ? (
                <h3 className={`mt-4 text-2xl font-bold ${card.color}`}>
                  {card.value}
                </h3>
              ) : (
                <h3 className={`mt-4 text-3xl font-bold ${card.color}`}>
                  {card.prefix || ""}
                  {formatCurrency(card.value)}
                </h3>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ================================================ */}
      {/* LIVE USDT MARKET */}
      {/* ================================================ */}

      <section className="space-y-5">
        <div>
          <h2 className="text-xl font-bold text-cyan-400">
            USDT Market
          </h2>

          <p className="text-sm text-gray-500">
            Live PKR ↔ USDT exchange rates.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          {usdtCards.map((card) => (
            <div
              key={card.title}
              className={`rounded-3xl border bg-zinc-950 p-6 ${card.border}`}
            >
              <p className="text-xs uppercase tracking-wide text-gray-500">
                {card.title}
              </p>

              <h3 className={`mt-4 text-3xl font-bold ${card.color}`}>
                {card.prefix || ""}
                {formatCurrency(card.value)}
              </h3>
            </div>
          ))}
        </div>
      </section>

      {/* ================================================ */}
      {/* PERFORMANCE OVERVIEW */}
      {/* ================================================ */}

      <section className="rounded-3xl border border-gray-800 bg-zinc-950 p-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-green-400">
              Portfolio Performance
            </h2>

            <p className="text-sm text-gray-500">
              Live wallet health, assets and investment summary.
            </p>
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {performanceCards.map((card) => (
            <div
              key={card.title}
              className="rounded-2xl border border-gray-800 bg-black p-5"
            >
              <p className="text-xs uppercase tracking-wide text-gray-500">
                {card.title}
              </p>

              {card.isStatus ? (
                <h3 className={`mt-4 text-2xl font-bold ${card.color}`}>
                  {card.value}
                </h3>
              ) : (
                <h3 className={`mt-4 text-2xl font-bold ${card.color}`}>
                  {card.prefix || ""}
                  {formatCurrency(card.value)}
                </h3>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ================================================ */}
      {/* GOLD HOLDINGS */}
      {/* ================================================ */}

      <section className="rounded-3xl border border-yellow-500/20 bg-yellow-500/5 p-6">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-yellow-400">
            Gold Holdings
          </h2>

          <p className="text-sm text-yellow-100/60">
            Your current gold investment and live valuation.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {goldHoldingCards.map((card) => (
            <div
              key={card.title}
              className="rounded-2xl border border-yellow-500/20 bg-black/40 p-5"
            >
              <p className="text-xs uppercase tracking-wide text-gray-500">
                {card.title}
              </p>

              <h3 className={`mt-3 text-2xl font-bold ${card.color}`}>
                {card.prefix || ""}
                {formatCurrency(card.value)}
                {card.suffix || ""}
              </h3>
            </div>
          ))}
        </div>
      </section>

      {/* ================================================ */}
      {/* USDT HOLDINGS */}
      {/* ================================================ */}

      <section className="rounded-3xl border border-cyan-500/20 bg-cyan-500/5 p-6">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-cyan-400">
            USDT Holdings
          </h2>

          <p className="text-sm text-cyan-100/60">
            Live USDT wallet balance and PKR valuation.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {usdtHoldingCards.map((card) => (
            <div
              key={card.title}
              className="rounded-2xl border border-cyan-500/20 bg-black/40 p-5"
            >
              <p className="text-xs uppercase tracking-wide text-gray-500">
                {card.title}
              </p>

              <h3 className={`mt-3 text-2xl font-bold ${card.color}`}>
                {card.prefix || ""}
                {formatCurrency(card.value)}
                {card.suffix || ""}
              </h3>
            </div>
          ))}
        </div>
      </section>

      {/* ================================================ */}
      {/* MARKET QUICK SUMMARY */}
      {/* ================================================ */}

      <section className="rounded-3xl border border-blue-500/20 bg-blue-500/5 p-6">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-blue-400">
            Live Trading Summary
          </h2>

          <p className="text-sm text-blue-100/60">
            Current market overview for Gold and USDT trading.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-5">
          <div className="rounded-2xl border border-blue-500/20 bg-black p-5">
            <p className="text-xs uppercase tracking-wide text-gray-500">
              Gold Buy
            </p>

            <h3 className="mt-3 text-2xl font-bold text-yellow-400">
              PKR {formatCurrency(marketSummary.goldBuy)}
            </h3>
          </div>

          <div className="rounded-2xl border border-blue-500/20 bg-black p-5">
            <p className="text-xs uppercase tracking-wide text-gray-500">
              Gold Sell
            </p>

            <h3 className="mt-3 text-2xl font-bold text-yellow-300">
              PKR {formatCurrency(marketSummary.goldSell)}
            </h3>
          </div>

          <div className="rounded-2xl border border-blue-500/20 bg-black p-5">
            <p className="text-xs uppercase tracking-wide text-gray-500">
              USDT Buy
            </p>

            <h3 className="mt-3 text-2xl font-bold text-cyan-400">
              PKR {formatCurrency(marketSummary.usdtBuy)}
            </h3>
          </div>

          <div className="rounded-2xl border border-blue-500/20 bg-black p-5">
            <p className="text-xs uppercase tracking-wide text-gray-500">
              USDT Sell
            </p>

            <h3 className="mt-3 text-2xl font-bold text-cyan-300">
              PKR {formatCurrency(marketSummary.usdtSell)}
            </h3>
          </div>

          <div className="rounded-2xl border border-blue-500/20 bg-black p-5">
            <p className="text-xs uppercase tracking-wide text-gray-500">
              Trading Status
            </p>

            <h3 className={`mt-3 text-xl font-bold ${marketStatusColor}`}>
              {marketSummary.status}
            </h3>
          </div>
        </div>
      </section>      {/* ================================================ */}
      {/* TRANSACTION SUMMARY */}
      {/* ================================================ */}

      <section className="rounded-3xl border border-gray-800 bg-zinc-950 p-6">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-white">
            Transaction Overview
          </h2>

          <p className="text-sm text-gray-500">
            Summary of your GoldTrade account activity.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-5">
          {[
            {
              title: "Total Transactions",
              value: transactionSummary.total,
              color: "text-white",
            },
            {
              title: "Deposits",
              value: transactionSummary.deposits,
              color: "text-green-400",
            },
            {
              title: "Withdrawals",
              value: transactionSummary.withdrawals,
              color: "text-red-400",
            },
            {
              title: "Gold Trades",
              value: transactionSummary.goldTrades,
              color: "text-yellow-400",
            },
            {
              title: "USDT Trades",
              value: transactionSummary.usdtTrades,
              color: "text-cyan-400",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-2xl border border-gray-800 bg-black p-5"
            >
              <p className="text-xs uppercase tracking-wide text-gray-500">
                {item.title}
              </p>

              <h3 className={`mt-3 text-3xl font-bold ${item.color}`}>
                {formatNumber(item.value)}
              </h3>
            </div>
          ))}
        </div>
      </section>

      {/* ================================================ */}
      {/* RECENT TRANSACTIONS TABLE */}
      {/* ================================================ */}

      <section className="rounded-3xl border border-gray-800 bg-zinc-950 p-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">
              Recent Transactions
            </h2>

            <p className="text-sm text-gray-500">
              Latest deposits, withdrawals, Gold and USDT trades.
            </p>
          </div>

          <Link
            href="/transactions"
            className="rounded-xl border border-yellow-500/30 px-4 py-2 text-sm font-semibold text-yellow-400 transition hover:bg-yellow-500/10"
          >
            View All
          </Link>
        </div>

        {/* ============================================ */}
        {/* EMPTY STATE */}
        {/* ============================================ */}

        {!loading && recentTransactions.length === 0 && (
          <div className="rounded-2xl border border-dashed border-gray-700 py-12 text-center">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gray-900 text-4xl">
              📄
            </div>

            <h3 className="text-lg font-semibold text-gray-300">
              No Transactions Found
            </h3>

            <p className="mt-2 text-sm text-gray-500">
              Your recent deposits, withdrawals and trades will appear here.
            </p>
          </div>
        )}

        {/* ============================================ */}
        {/* LOADING STATE */}
        {/* ============================================ */}

        {loading && (
          <div className="space-y-4">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="animate-pulse rounded-2xl border border-gray-800 bg-black p-5"
              >
                <div className="h-4 w-32 rounded bg-gray-800" />
                <div className="mt-4 h-3 w-full rounded bg-gray-800" />
                <div className="mt-3 h-3 w-3/4 rounded bg-gray-800" />
              </div>
            ))}
          </div>
        )}

        {/* ============================================ */}
        {/* TRANSACTION TABLE */}
        {/* ============================================ */}

        {!loading && recentTransactions.length > 0 && (
          <div className="overflow-x-auto rounded-2xl border border-gray-800">
            <table className="min-w-full text-sm">
              <thead className="bg-black text-gray-400">
                <tr>
                  <th className="px-5 py-4 text-left">Type</th>
                  <th className="px-5 py-4 text-left">Amount</th>
                  <th className="px-5 py-4 text-left">Currency</th>
                  <th className="px-5 py-4 text-left">Status</th>
                  <th className="px-5 py-4 text-left">Date</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-800">
                {recentTransactions.map((transaction) => (
                  <tr
                    key={transaction._id}
                    className="transition hover:bg-white/5"
                  >
                    {/* TYPE */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`h-3 w-3 rounded-full ${getTransactionColor(
                            transaction.type
                          ).replace("text-", "bg-")}`}
                        />

                        <span
                          className={`font-semibold ${getTransactionColor(
                            transaction.type
                          )}`}
                        >
                          {getTransactionLabel(transaction.type)}
                        </span>
                      </div>
                    </td>

                    {/* AMOUNT */}
                    <td className="px-5 py-4 font-semibold text-white">
                      {formatCurrency(transaction.amount)}
                    </td>

                    {/* CURRENCY */}
                    <td className="px-5 py-4 uppercase text-gray-300">
                      {transaction.currency}
                    </td>

                    {/* STATUS */}
                    <td className="px-5 py-4">
                      <span
                        className={`rounded-full border px-3 py-1 text-xs font-semibold ${getStatusColor(
                          transaction.status
                        )}`}
                      >
                        {transaction.status.toUpperCase()}
                      </span>
                    </td>

                    {/* DATE */}
                    <td className="px-5 py-4 text-gray-400">
                      {formatDate(transaction.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ================================================ */}
      {/* PENDING TRANSACTIONS */}
      {/* ================================================ */}

      <section className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-3xl border border-yellow-500/20 bg-yellow-500/5 p-6">
          <h3 className="text-lg font-bold text-yellow-400">
            Pending Transactions
          </h3>

          <p className="mt-1 text-sm text-yellow-100/60">
            Waiting for approval.
          </p>

          <h2 className="mt-5 text-4xl font-bold text-yellow-300">
            {pendingTransactions.length}
          </h2>
        </div>

        <div className="rounded-3xl border border-green-500/20 bg-green-500/5 p-6">
          <h3 className="text-lg font-bold text-green-400">
            Approved Transactions
          </h3>

          <p className="mt-1 text-sm text-green-100/60">
            Successfully completed.
          </p>

          <h2 className="mt-5 text-4xl font-bold text-green-300">
            {approvedTransactions.length}
          </h2>
        </div>

        <div className="rounded-3xl border border-red-500/20 bg-red-500/5 p-6">
          <h3 className="text-lg font-bold text-red-400">
            Rejected Transactions
          </h3>

          <p className="mt-1 text-sm text-red-100/60">
            Failed or rejected requests.
          </p>

          <h2 className="mt-5 text-4xl font-bold text-red-300">
            {rejectedTransactions.length}
          </h2>
        </div>
      </section>      {/* ================================================= */}
      {/* WALLET ACTIVITY TIMELINE */}
      {/* ================================================= */}

      <section className="rounded-3xl border border-gray-800 bg-zinc-950 p-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">
              Wallet Activity Timeline
            </h2>

            <p className="text-sm text-gray-500">
              Latest wallet deposits, withdrawals, Gold & USDT trades.
            </p>
          </div>
        </div>

        <div className="space-y-5">
          {recentTransactions.slice(0, 6).map((item) => (
            <div
              key={item._id}
              className="flex items-start gap-4 rounded-2xl border border-gray-800 bg-black p-5"
            >
              <div
                className={`mt-1 h-4 w-4 rounded-full ${
                  item.status === "approved"
                    ? "bg-green-500"
                    : item.status === "pending"
                    ? "bg-yellow-500"
                    : "bg-red-500"
                }`}
              />

              <div className="flex-1">
                <div className="flex flex-col justify-between gap-2 md:flex-row md:items-center">
                  <h3
                    className={`font-semibold ${getTransactionColor(
                      item.type
                    )}`}
                  >
                    {getTransactionLabel(item.type)}
                  </h3>

                  <span
                    className={`rounded-full border px-3 py-1 text-xs font-semibold ${getStatusColor(
                      item.status
                    )}`}
                  >
                    {item.status.toUpperCase()}
                  </span>
                </div>

                <div className="mt-2 flex flex-wrap gap-5 text-sm text-gray-400">
                  <span>
                    Amount:{" "}
                    <strong className="text-white">
                      {formatCurrency(item.amount)}
                    </strong>
                  </span>

                  <span>
                    Currency:{" "}
                    <strong className="uppercase text-white">
                      {item.currency}
                    </strong>
                  </span>

                  <span>{formatDate(item.createdAt)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ================================================= */}
      {/* QUICK TRADING PANELS */}
      {/* ================================================= */}

      <section className="grid gap-6 xl:grid-cols-2">
        {/* GOLD TRADING */}

        <div className="rounded-3xl border border-yellow-500/20 bg-yellow-500/5 p-6">
          <div className="mb-5">
            <h2 className="text-xl font-bold text-yellow-400">
              Gold Trading
            </h2>

            <p className="text-sm text-yellow-100/60">
              Buy and sell Gold instantly using live market prices.
            </p>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl border border-yellow-500/20 bg-black p-4">
              <p className="text-xs uppercase tracking-wide text-gray-500">
                Current Buy Price
              </p>

              <h3 className="mt-2 text-3xl font-bold text-yellow-400">
                PKR {formatCurrency(goldMarket.buyPrice)}
              </h3>
            </div>

            <div className="rounded-2xl border border-yellow-500/20 bg-black p-4">
              <p className="text-xs uppercase tracking-wide text-gray-500">
                Current Sell Price
              </p>

              <h3 className="mt-2 text-3xl font-bold text-yellow-300">
                PKR {formatCurrency(goldMarket.sellPrice)}
              </h3>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <Link
                href="/gold/buy"
                className="rounded-2xl bg-yellow-500 px-5 py-3 text-center font-bold text-black transition hover:bg-yellow-400"
              >
                Buy Gold
              </Link>

              <Link
                href="/gold/sell"
                className="rounded-2xl border border-yellow-500 px-5 py-3 text-center font-bold text-yellow-400 transition hover:bg-yellow-500/10"
              >
                Sell Gold
              </Link>
            </div>
          </div>
        </div>

        {/* USDT TRADING */}

        <div className="rounded-3xl border border-cyan-500/20 bg-cyan-500/5 p-6">
          <div className="mb-5">
            <h2 className="text-xl font-bold text-cyan-400">
              USDT Trading
            </h2>

            <p className="text-sm text-cyan-100/60">
              Buy and sell USDT with your PKR wallet.
            </p>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl border border-cyan-500/20 bg-black p-4">
              <p className="text-xs uppercase tracking-wide text-gray-500">
                Buy Rate
              </p>

              <h3 className="mt-2 text-3xl font-bold text-cyan-400">
                PKR {formatCurrency(usdtMarket.buyPrice)}
              </h3>
            </div>

            <div className="rounded-2xl border border-cyan-500/20 bg-black p-4">
              <p className="text-xs uppercase tracking-wide text-gray-500">
                Sell Rate
              </p>

              <h3 className="mt-2 text-3xl font-bold text-cyan-300">
                PKR {formatCurrency(usdtMarket.sellPrice)}
              </h3>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <Link
                href="/usdt/buy"
                className="rounded-2xl bg-cyan-500 px-5 py-3 text-center font-bold text-black transition hover:bg-cyan-400"
              >
                Buy USDT
              </Link>

              <Link
                href="/usdt/sell"
                className="rounded-2xl border border-cyan-500 px-5 py-3 text-center font-bold text-cyan-400 transition hover:bg-cyan-500/10"
              >
                Sell USDT
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================= */}
      {/* DEPOSIT & WITHDRAW SHORTCUTS */}
      {/* ================================================= */}

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-green-500/20 bg-green-500/5 p-6">
          <h2 className="text-xl font-bold text-green-400">
            Deposit Funds
          </h2>

          <p className="mt-2 text-sm text-green-100/60">
            Deposit PKR or Crypto and increase your GoldTrade wallet balance.
          </p>

          <div className="mt-6 space-y-3 text-sm text-gray-300">
            <p>• PKR Bank Deposit</p>
            <p>• USDT (TRC20 / BEP20)</p>
            <p>• Instant wallet balance update after approval.</p>
          </div>

          <Link
            href="/deposit"
            className="mt-8 block rounded-2xl bg-green-600 px-5 py-3 text-center font-bold text-white transition hover:bg-green-500"
          >
            Open Deposit Page
          </Link>
        </div>

        <div className="rounded-3xl border border-red-500/20 bg-red-500/5 p-6">
          <h2 className="text-xl font-bold text-red-400">
            Withdraw Funds
          </h2>

          <p className="mt-2 text-sm text-red-100/60">
            Withdraw PKR or Crypto securely from your wallet.
          </p>

          <div className="mt-6 space-y-3 text-sm text-gray-300">
            <p>• PKR Bank Withdrawal</p>
            <p>• USDT Wallet Withdrawal</p>
            <p>• Secure approval by GoldTrade Admin.</p>
          </div>

          <Link
            href="/withdraw"
            className="mt-8 block rounded-2xl bg-red-600 px-5 py-3 text-center font-bold text-white transition hover:bg-red-500"
          >
            Open Withdraw Page
          </Link>
        </div>
      </section>

      {/* ================================================= */}
      {/* PORTFOLIO INSIGHTS */}
      {/* ================================================= */}

      <section className="rounded-3xl border border-purple-500/20 bg-purple-500/5 p-6">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-purple-400">
            Portfolio Insights
          </h2>

          <p className="text-sm text-purple-100/60">
            Overview of your wallet diversification.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-gray-800 bg-black p-5">
            <p className="text-xs uppercase tracking-wide text-gray-500">
              PKR Wallet
            </p>

            <h3 className="mt-3 text-2xl font-bold text-green-400">
              PKR {formatCurrency(wallet.balancePKR)}
            </h3>
          </div>

          <div className="rounded-2xl border border-gray-800 bg-black p-5">
            <p className="text-xs uppercase tracking-wide text-gray-500">
              Gold Value
            </p>

            <h3 className="mt-3 text-2xl font-bold text-yellow-400">
              PKR {formatCurrency(balanceSummary.totalGoldValue)}
            </h3>
          </div>

          <div className="rounded-2xl border border-gray-800 bg-black p-5">
            <p className="text-xs uppercase tracking-wide text-gray-500">
              USDT Wallet Value
            </p>

            <h3 className="mt-3 text-2xl font-bold text-cyan-400">
              PKR {formatCurrency(wallet.balanceUSDT * usdtMarket.sellPrice)}
            </h3>
          </div>

          <div className="rounded-2xl border border-gray-800 bg-black p-5">
            <p className="text-xs uppercase tracking-wide text-gray-500">
              Total Assets
            </p>

            <h3 className="mt-3 text-2xl font-bold text-purple-400">
              PKR {formatCurrency(balanceSummary.totalAssets)}
            </h3>
          </div>
        </div>
      </section>      {/* ================================================= */}
      {/* SECURITY CENTER */}
      {/* ================================================= */}

      <section className="rounded-3xl border border-emerald-500/20 bg-emerald-500/5 p-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-emerald-400">
              GoldTrade Security Center
            </h2>

            <p className="text-sm text-emerald-100/60">
              Your account security and session protection status.
            </p>
          </div>

          <div className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-xs font-bold text-emerald-300">
            PROTECTED
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {[
            {
              title: "JWT Session",
              value: "Active",
              color: "text-green-400",
            },
            {
              title: "HTTPS Connection",
              value: "Secure",
              color: "text-cyan-400",
            },
            {
              title: "Wallet Encryption",
              value: "Enabled",
              color: "text-yellow-400",
            },
            {
              title: "Role Verification",
              value: user?.role === "user" ? "Verified" : "Unknown",
              color: "text-purple-400",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-2xl border border-gray-800 bg-black p-5"
            >
              <p className="text-xs uppercase tracking-wide text-gray-500">
                {item.title}
              </p>

              <h3 className={`mt-3 text-xl font-bold ${item.color}`}>
                {item.value}
              </h3>
            </div>
          ))}
        </div>
      </section>

      {/* ================================================= */}
      {/* LIVE SYSTEM STATUS */}
      {/* ================================================= */}

      <section className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-3xl border border-green-500/20 bg-green-500/5 p-6">
          <p className="text-xs uppercase tracking-wide text-gray-500">
            Network Status
          </p>

          <h3
            className={`mt-3 text-3xl font-bold ${
              isOnline ? "text-green-400" : "text-red-400"
            }`}
          >
            {isOnline ? "ONLINE" : "OFFLINE"}
          </h3>

          <p className="mt-2 text-sm text-gray-400">
            Dashboard automatically reconnects when internet returns.
          </p>
        </div>

        <div className="rounded-3xl border border-yellow-500/20 bg-yellow-500/5 p-6">
          <p className="text-xs uppercase tracking-wide text-gray-500">
            Market Status
          </p>

          <h3 className={`mt-3 text-3xl font-bold ${marketStatusColor}`}>
            {goldMarket.marketStatus}
          </h3>

          <p className="mt-2 text-sm text-gray-400">
            Gold and USDT live trading availability.
          </p>
        </div>

        <div className="rounded-3xl border border-cyan-500/20 bg-cyan-500/5 p-6">
          <p className="text-xs uppercase tracking-wide text-gray-500">
            Wallet Health
          </p>

          <h3 className="mt-3 text-3xl font-bold text-cyan-400">
            {walletHealth}
          </h3>

          <p className="mt-2 text-sm text-gray-400">
            Based on your current portfolio balance.
          </p>
        </div>
      </section>

      {/* ================================================= */}
      {/* WALLET PROTECTION */}
      {/* ================================================= */}

      <section className="rounded-3xl border border-indigo-500/20 bg-indigo-500/5 p-6">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-indigo-400">
            Wallet Protection
          </h2>

          <p className="text-sm text-indigo-100/60">
            Your GoldTrade wallet is protected with enterprise security.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {[
            "JWT Authentication Enabled",
            "Secure Wallet Validation",
            "Transaction Verification",
            "Protected Withdraw Approval",
          ].map((item) => (
            <div
              key={item}
              className="rounded-2xl border border-indigo-500/20 bg-black p-5"
            >
              <p className="text-sm text-indigo-200">{item}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ================================================= */}
      {/* HELP CENTER */}
      {/* ================================================= */}

      <section className="rounded-3xl border border-gray-800 bg-zinc-950 p-6">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-white">
            GoldTrade Help Center
          </h2>

          <p className="text-sm text-gray-500">
            Quickly navigate to important account features.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            { title: "Wallet", href: "/wallet" },
            { title: "Deposit History", href: "/deposit/history" },
            { title: "Withdraw History", href: "/withdraw/history" },
            { title: "Transaction History", href: "/transactions" },
            { title: "Gold Portfolio", href: "/gold/portfolio" },
            { title: "USDT Portfolio", href: "/usdt/portfolio" },
            { title: "Profile Settings", href: "/profile" },
            { title: "Support Center", href: "/support" },
          ].map((item) => (
            <Link
              key={item.title}
              href={item.href}
              className="rounded-2xl border border-gray-800 bg-black p-5 transition hover:border-yellow-500/40 hover:bg-zinc-900"
            >
              <h3 className="font-semibold text-yellow-400">{item.title}</h3>

              <p className="mt-2 text-sm text-gray-500">
                Open {item.title}
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* ================================================= */}
      {/* ENTERPRISE FOOTER */}
      {/* ================================================= */}

      <section className="rounded-3xl border border-yellow-500/20 bg-gradient-to-r from-yellow-500/10 via-black to-yellow-500/10 p-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-yellow-400">
              GoldTrade V18 Enterprise
            </h2>

            <p className="mt-2 text-gray-400">
              Enterprise Trading Platform • Render Backend • Vercel Frontend
            </p>

            <p className="mt-1 text-sm text-gray-500">
              Secure JWT Authentication • Live Gold • Live USDT • Portfolio Sync
            </p>
          </div>

          <div className="grid grid-cols-2 gap-5 text-center">
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500">
                Wallet Balance
              </p>

              <h3 className="mt-2 text-xl font-bold text-green-400">
                PKR {formatCurrency(wallet.balancePKR)}
              </h3>
            </div>

            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500">
                Portfolio Value
              </p>

              <h3 className="mt-2 text-xl font-bold text-yellow-400">
                PKR {formatCurrency(stats.portfolioValue)}
              </h3>
            </div>

            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500">
                Live Profit
              </p>

              <h3
                className={`mt-2 text-xl font-bold ${
                  stats.liveProfit >= 0
                    ? "text-green-400"
                    : "text-red-400"
                }`}
              >
                PKR {formatCurrency(stats.liveProfit)}
              </h3>
            </div>

            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500">
                Trading Status
              </p>

              <h3 className={`mt-2 text-xl font-bold ${marketStatusColor}`}>
                {goldMarket.marketStatus}
              </h3>
            </div>
          </div>
        </div>

        <div className="mt-8 border-t border-yellow-500/20 pt-6 text-center text-sm text-gray-500">
          © 2026 GoldTrade V18 Enterprise — All Rights Reserved.
        </div>
      </section>

    </main>
  </div>
);
}