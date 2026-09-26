"use client";

/* ==========================================================
   GoldTrade V18 Enterprise Dashboard
   PART 1/10 (FIXED)
   Next.js 15 + TypeScript + Linux + Vercel Ready
========================================================== */

import { useEffect, useMemo, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

import {
  Wallet,
  Coins,
  DollarSign,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  ArrowDownLeft,
  ArrowUpRight,
  History,
  User,
  Shield,
  Activity,
  Eye,
  EyeOff,
  CheckCircle,
  XCircle,
} from "lucide-react";

/* ==========================================================
   API URL
========================================================== */

const API =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ||
  "http://127.0.0.1:5000";

/* ==========================================================
   TYPES
========================================================== */

export interface UserInfo {
  username: string;
  fullName: string;
  email: string;
  role: "user" | "admin";
}

export interface WalletData {
  pkrBalance: number;
  goldBalance: number;
  usdtBalance: number;
}

export interface GoldMarket {
  buyPrice: number;
  sellPrice: number;
  marketStatus: "OPEN" | "CLOSED";
  goldTradingEnabled: boolean;
}

export interface UsdtMarket {
  buyPrice: number;
  sellPrice: number;
  network: string;
  marketStatus: "OPEN" | "CLOSED";
  tradingEnabled: boolean;
}

export interface TransactionItem {
  _id: string;
  type: string;
  amount: number;
  status: string;
  createdAt: string;
}

export interface PortfolioSummary {
  totalPkrValue: number;
  goldValue: number;
  usdtValue: number;
}

/* ==========================================================
   DEFAULT OBJECTS
========================================================== */

const defaultUser: UserInfo = {
  username: "",
  fullName: "",
  email: "",
  role: "user",
};

const defaultWallet: WalletData = {
  pkrBalance: 0,
  goldBalance: 0,
  usdtBalance: 0,
};

const defaultGoldMarket: GoldMarket = {
  buyPrice: 0,
  sellPrice: 0,
  marketStatus: "OPEN",
  goldTradingEnabled: true,
};

const defaultUsdtMarket: UsdtMarket = {
  buyPrice: 0,
  sellPrice: 0,
  network: "TRC20",
  marketStatus: "OPEN",
  tradingEnabled: true,
};

const defaultPortfolio: PortfolioSummary = {
  totalPkrValue: 0,
  goldValue: 0,
  usdtValue: 0,
};

/* ==========================================================
   COMPONENT START
========================================================== */

export default function DashboardPage() {
  const router = useRouter();

  /* ========================================================
     AUTH STATE
  ======================================================== */

  const [token, setToken] = useState<string>("");
  const [username, setUsername] = useState<string>("");

  const [user, setUser] = useState<UserInfo>(defaultUser);

  /* ========================================================
     WALLET STATE
  ======================================================== */

  const [wallet, setWallet] =
    useState<WalletData>(defaultWallet);

  /* ========================================================
     GOLD MARKET STATE
  ======================================================== */

  const [goldMarket, setGoldMarket] =
    useState<GoldMarket>(defaultGoldMarket);

  /* ========================================================
     USDT MARKET STATE
  ======================================================== */

  const [usdtMarket, setUsdtMarket] =
    useState<UsdtMarket>(defaultUsdtMarket);

  /* ========================================================
     PORTFOLIO STATE
  ======================================================== */

  const [portfolio, setPortfolio] =
    useState<PortfolioSummary>(defaultPortfolio);

  /* ========================================================
     TRANSACTIONS
  ======================================================== */

  const [transactions, setTransactions] = useState<
    TransactionItem[]
  >([]);

  /* ========================================================
     UI STATES
  ======================================================== */

  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] =
    useState<boolean>(false);

  const [showBalance, setShowBalance] =
    useState<boolean>(true);

  const [errorMessage, setErrorMessage] =
    useState<string>("");

// ==========================================================
// DASHBOARD AUTH CHECK (PRODUCTION FIX)
// ==========================================================

useEffect(() => {
  if (typeof window === "undefined") return;

  const token =
    localStorage.getItem("goldtrade_token") ||
    sessionStorage.getItem("goldtrade_token");

  const userData =
    localStorage.getItem("goldtrade_user") ||
    sessionStorage.getItem("goldtrade_user");

  if (!token || !userData) {
    router.replace("/login");
    return;
  }

  try {
    const currentUser = JSON.parse(userData);

    loadDashboard(currentUser.username, token);
  } catch (error) {
    console.error("Dashboard Auth Error:", error);

    localStorage.clear();
    sessionStorage.clear();

    router.replace("/login");
  }
}, []);

  /* ========================================================
     AUTH HEADERS
  ======================================================== */

  const getHeaders = useCallback(
    () => ({
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    }),
    [token]
  );

  /* ========================================================
     FORMAT HELPERS
  ======================================================== */

  const formatMoney = useCallback(
    (value: number = 0) =>
      Number(value).toLocaleString("en-PK", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
    []
  );

  const formatGold = useCallback(
    (value: number = 0) =>
      Number(value).toFixed(3),
    []
  );

  const formatUsdt = useCallback(
    (value: number = 0) =>
      Number(value).toFixed(2),
    []
  );

  const formatDate = useCallback(
    (date: string) =>
      new Date(date).toLocaleString("en-GB", {
        dateStyle: "medium",
        timeStyle: "short",
      }),
    []
  );

  /* ========================================================
     TOTAL PORTFOLIO VALUE
  ======================================================== */

  const totalAssets = useMemo(() => {
    return (
      Number(wallet.pkrBalance) +
      Number(wallet.goldBalance) *
        Number(goldMarket.sellPrice) +
      Number(wallet.usdtBalance) *
        Number(usdtMarket.sellPrice)
    );
  }, [wallet, goldMarket.sellPrice, usdtMarket.sellPrice]);

/* ==========================================================
   PART 2/10
   JWT AUTH + USER PROFILE (100% FIXED)
   GoldTrade V18 Enterprise
========================================================== */

/* ==========================================================
   VERIFY LOGIN TOKEN
========================================================== */

const verifyLogin = useCallback(
  async (currentToken: string): Promise<boolean> => {
    try {
      const response = await fetch(`${API}/api/auth/check`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${currentToken}`,
        },
        cache: "no-store",
      });

      const data = await response.json();

      console.log("AUTH CHECK:", data);

      if (!response.ok || !data.success) {
        localStorage.clear();
        router.replace("/login");
        return false;
      }

      return true;
    } catch (error) {
      console.error("VERIFY LOGIN ERROR:", error);

      localStorage.clear();
      router.replace("/login");
      return false;
    }
  },
  [router]
);

/* ==========================================================
   LOAD USER PROFILE
========================================================== */

const loadUserProfile = useCallback(
  async (currentToken: string) => {
    try {
      const response = await fetch(`${API}/api/auth/check`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${currentToken}`,
        },
        cache: "no-store",
      });

      const data = await response.json();

      console.log("USER PROFILE:", data);

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to verify user.");
      }

      const profile = data.user ?? {};

      setUser({
        username: profile.username || "",
        fullName: profile.fullName || profile.username || "",
        email: profile.email || "",
        role: profile.role === "admin" ? "admin" : "user",
      });

      setUsername(profile.username || "");
    } catch (error: any) {
      console.error("PROFILE ERROR:", error);

      setErrorMessage(
        error.message || "Failed to load user profile."
      );
    }
  },
  []
);

/* ==========================================================
   AUTO VERIFY SESSION AFTER TOKEN LOAD
========================================================== */

useEffect(() => {
  if (!token) return;

  const initSession = async () => {
    const valid = await verifyLogin(token);

    if (!valid) return;

    await loadUserProfile(token);
  };

  initSession();
}, [token, verifyLogin, loadUserProfile]);

/* ==========================================================
   LOGOUT
========================================================== */

const logout = useCallback(() => {
  localStorage.removeItem("token");
  localStorage.removeItem("username");
  localStorage.removeItem("role");

  router.replace("/login");
}, [router]);

/* ==========================================================
   AUTH HELPERS
========================================================== */

const isLoggedIn = useMemo(() => token.length > 10, [token]);

const isAdmin = useMemo(() => user.role === "admin", [user.role]);

const authHeaders = useMemo(
  () => ({
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  }),
  [token]
);

/* ==========================================================
   SESSION KEEP-ALIVE
========================================================== */

useEffect(() => {
  if (!token) return;

  const interval = setInterval(async () => {
    await verifyLogin(token);
  }, 5 * 60 * 1000);

  return () => clearInterval(interval);
}, [token, verifyLogin]);

/* ==========================================================
   PART 3/10
   WALLET + GOLD + USDT PORTFOLIO
   Production Fixed Version
========================================================== */

/* ==========================================================
   LOAD PKR WALLET
========================================================== */

const loadWallet = useCallback(
  async (currentUsername: string, currentToken: string) => {
    try {
      const response = await fetch(
        `${API}/api/wallet/${currentUsername}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${currentToken}`,
          },
          cache: "no-store",
        }
      );

      const data = await response.json();

      console.log("PKR WALLET:", data);

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Wallet not found.");
      }

      const balance = Number(
        data.wallet?.balance ??
          data.wallet?.pkrBalance ??
          0
      );

      setWallet((prev) => ({
        ...prev,
        pkrBalance: balance,
      }));

      return balance;
    } catch (error: any) {
      console.error("PKR WALLET ERROR:", error);

      setErrorMessage(
        error.message || "Unable to load PKR wallet."
      );

      return 0;
    }
  },
  []
);

/* ==========================================================
   LOAD GOLD PORTFOLIO
========================================================== */

const loadGoldPortfolio = useCallback(
  async (currentUsername: string, currentToken: string) => {
    try {
      const response = await fetch(
        `${API}/api/gold/portfolio/${currentUsername}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${currentToken}`,
          },
          cache: "no-store",
        }
      );

      const data = await response.json();

      console.log("GOLD PORTFOLIO:", data);

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Gold portfolio not available."
        );
      }

      const goldBalance = Number(
        data.portfolio?.goldBalance ??
          data.portfolio?.balance ??
          0
      );

      setWallet((prev) => ({
        ...prev,
        goldBalance,
      }));

      return goldBalance;
    } catch (error: any) {
      console.error("GOLD PORTFOLIO ERROR:", error);

      setWallet((prev) => ({
        ...prev,
        goldBalance: 0,
      }));

      return 0;
    }
  },
  []
);

/* ==========================================================
   LOAD USDT PORTFOLIO
========================================================== */

const loadUsdtPortfolio = useCallback(
  async (currentUsername: string, currentToken: string) => {
    try {
      const response = await fetch(
        `${API}/api/usdt/portfolio/${currentUsername}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${currentToken}`,
          },
          cache: "no-store",
        }
      );

      const data = await response.json();

      console.log("USDT PORTFOLIO:", data);

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "USDT portfolio not available."
        );
      }

      const usdtBalance = Number(
        data.portfolio?.usdtBalance ??
          data.portfolio?.balance ??
          0
      );

      setWallet((prev) => ({
        ...prev,
        usdtBalance,
      }));

      return usdtBalance;
    } catch (error: any) {
      console.error("USDT PORTFOLIO ERROR:", error);

      setWallet((prev) => ({
        ...prev,
        usdtBalance: 0,
      }));

      return 0;
    }
  },
  []
);

/* ==========================================================
   CALCULATE COMPLETE PORTFOLIO VALUE
========================================================== */

const calculatePortfolio = useCallback(
  (walletData: WalletData) => {
    const goldValue =
      Number(walletData.goldBalance) *
      Number(goldMarket.sellPrice);

    const usdtValue =
      Number(walletData.usdtBalance) *
      Number(usdtMarket.sellPrice);

    const totalPkrValue =
      Number(walletData.pkrBalance) +
      goldValue +
      usdtValue;

    setPortfolio({
      goldValue,
      usdtValue,
      totalPkrValue,
    });
  },
  [goldMarket.sellPrice, usdtMarket.sellPrice]
);

/* ==========================================================
   UPDATE PORTFOLIO AUTOMATICALLY
========================================================== */

useEffect(() => {
  calculatePortfolio(wallet);
}, [
  wallet,
  goldMarket.sellPrice,
  usdtMarket.sellPrice,
  calculatePortfolio,
]);

/* ==========================================================
   PORTFOLIO SUMMARY HELPERS
========================================================== */

const goldCurrentValue = useMemo(
  () =>
    Number(wallet.goldBalance) *
    Number(goldMarket.sellPrice),
  [wallet.goldBalance, goldMarket.sellPrice]
);

const usdtCurrentValue = useMemo(
  () =>
    Number(wallet.usdtBalance) *
    Number(usdtMarket.sellPrice),
  [wallet.usdtBalance, usdtMarket.sellPrice]
);

const totalWalletValue = useMemo(
  () =>
    Number(wallet.pkrBalance) +
    goldCurrentValue +
    usdtCurrentValue,
  [
    wallet.pkrBalance,
    goldCurrentValue,
    usdtCurrentValue,
  ]
);

/* ==========================================================
   PORTFOLIO REFRESH
========================================================== */

const refreshPortfolio = useCallback(async () => {
  if (!username || !token) return;

  try {
    const [
      pkrBalance,
      goldBalance,
      usdtBalance,
    ] = await Promise.all([
      loadWallet(username, token),
      loadGoldPortfolio(username, token),
      loadUsdtPortfolio(username, token),
    ]);

    calculatePortfolio({
      pkrBalance,
      goldBalance,
      usdtBalance,
    });
  } catch (error) {
    console.error("PORTFOLIO REFRESH ERROR:", error);
  }
}, [
  username,
  token,
  loadWallet,
  loadGoldPortfolio,
  loadUsdtPortfolio,
  calculatePortfolio,
]);

/* ==========================================================
   PART 4/10
   GOLD MARKET + USDT MARKET (PRODUCTION FIXED)
========================================================== */

/* ==========================================================
   LOAD GOLD MARKET PRICE
========================================================== */

const loadGoldMarket = useCallback(async (): Promise<GoldMarket> => {
  try {
    const response = await fetch(`${API}/api/gold/price`, {
      method: "GET",
      cache: "no-store",
    });

    const data = await response.json();

    console.log("GOLD MARKET:", data);

    if (!response.ok || !data.success) {
      throw new Error(data.message || "Gold market unavailable.");
    }

    const market: GoldMarket = {
      buyPrice: Number(data.buyPrice || 0),
      sellPrice: Number(data.sellPrice || 0),
      marketStatus:
        data.marketStatus === "CLOSED" ? "CLOSED" : "OPEN",
      goldTradingEnabled:
        data.goldTradingEnabled ?? true,
    };

    setGoldMarket(market);

    return market;
  } catch (error: any) {
    console.error("GOLD MARKET ERROR:", error);

    setGoldMarket(defaultGoldMarket);

    return defaultGoldMarket;
  }
}, []);

/* ==========================================================
   LOAD USDT MARKET PRICE
========================================================== */

const loadUsdtMarket = useCallback(async (): Promise<UsdtMarket> => {
  try {
    const response = await fetch(`${API}/api/usdt/price`, {
      method: "GET",
      cache: "no-store",
    });

    const data = await response.json();

    console.log("USDT MARKET:", data);

    if (!response.ok || !data.success) {
      throw new Error(data.message || "USDT market unavailable.");
    }

    const market: UsdtMarket = {
      buyPrice: Number(data.buyPrice || 0),
      sellPrice: Number(data.sellPrice || 0),
      network: data.network || "TRC20",
      marketStatus:
        data.marketStatus === "CLOSED" ? "CLOSED" : "OPEN",
      tradingEnabled:
        data.tradingEnabled ?? true,
    };

    setUsdtMarket(market);

    return market;
  } catch (error: any) {
    console.error("USDT MARKET ERROR:", error);

    setUsdtMarket(defaultUsdtMarket);

    return defaultUsdtMarket;
  }
}, []);

/* ==========================================================
   MARKET STATUS HELPERS
========================================================== */

const goldMarketOpen = useMemo(() => {
  return (
    goldMarket.marketStatus === "OPEN" &&
    goldMarket.goldTradingEnabled
  );
}, [goldMarket]);

const usdtMarketOpen = useMemo(() => {
  return (
    usdtMarket.marketStatus === "OPEN" &&
    usdtMarket.tradingEnabled
  );
}, [usdtMarket]);

/* ==========================================================
   MARKET SPREAD HELPERS
========================================================== */

const goldSpread = useMemo(() => {
  return Number(goldMarket.sellPrice) -
    Number(goldMarket.buyPrice);
}, [goldMarket]);

const usdtSpread = useMemo(() => {
  return Number(usdtMarket.sellPrice) -
    Number(usdtMarket.buyPrice);
}, [usdtMarket]);

/* ==========================================================
   LIVE MARKET REFRESH
========================================================== */

const refreshMarketPrices = useCallback(async () => {
  try {
    await Promise.all([
      loadGoldMarket(),
      loadUsdtMarket(),
    ]);
  } catch (error) {
    console.error("MARKET REFRESH ERROR:", error);
  }
}, [loadGoldMarket, loadUsdtMarket]);

/* ==========================================================
   INITIAL MARKET LOAD
========================================================== */

useEffect(() => {
  refreshMarketPrices();
}, [refreshMarketPrices]);

/* ==========================================================
   AUTO REFRESH EVERY 30 SECONDS
========================================================== */

useEffect(() => {
  const interval = setInterval(() => {
    refreshMarketPrices();
  }, 30000);

  return () => clearInterval(interval);
}, [refreshMarketPrices]);

/* ==========================================================
   MARKET PRICE LABELS
========================================================== */

const goldStatusColor = useMemo(() => {
  return goldMarketOpen
    ? "text-green-400"
    : "text-red-400";
}, [goldMarketOpen]);

const usdtStatusColor = useMemo(() => {
  return usdtMarketOpen
    ? "text-green-400"
    : "text-red-400";
}, [usdtMarketOpen]);

/* ==========================================================
   PART 5/10
   TRANSACTIONS + DASHBOARD LOADER (IQ 800 FIXED)
========================================================== */

/* ==========================================================
   LOAD RECENT TRANSACTIONS
========================================================== */

const loadTransactions = useCallback(
  async (currentUsername: string, currentToken: string) => {
    try {
      const response = await fetch(
        `${API}/api/transactions/${currentUsername}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${currentToken}`,
          },
          cache: "no-store",
        }
      );

      const data = await response.json();

      console.log("TRANSACTIONS:", data);

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Transactions not available."
        );
      }

      const txs: TransactionItem[] = Array.isArray(
        data.transactions
      )
        ? data.transactions
        : [];

      txs.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() -
          new Date(a.createdAt).getTime()
      );

      setTransactions(txs.slice(0, 10));

      return txs;
    } catch (error: any) {
      console.error("TRANSACTION ERROR:", error);

      setTransactions([]);

      return [];
    }
  },
  []
);

/* ==========================================================
   LOAD GOLD HISTORY
========================================================== */

const loadGoldHistory = useCallback(
  async (currentUsername: string, currentToken: string) => {
    try {
      const response = await fetch(
        `${API}/api/gold/history/${currentUsername}`,
        {
          headers: {
            Authorization: `Bearer ${currentToken}`,
          },
          cache: "no-store",
        }
      );

      const data = await response.json();

      console.log("GOLD HISTORY:", data);

      return response.ok && data.success
        ? data.history ?? []
        : [];
    } catch (error) {
      console.error("GOLD HISTORY ERROR:", error);
      return [];
    }
  },
  []
);

/* ==========================================================
   LOAD USDT HISTORY
========================================================== */

const loadUsdtHistory = useCallback(
  async (currentUsername: string, currentToken: string) => {
    try {
      const response = await fetch(
        `${API}/api/usdt/history/${currentUsername}`,
        {
          headers: {
            Authorization: `Bearer ${currentToken}`,
          },
          cache: "no-store",
        }
      );

      const data = await response.json();

      console.log("USDT HISTORY:", data);

      return response.ok && data.success
        ? data.history ?? []
        : [];
    } catch (error) {
      console.error("USDT HISTORY ERROR:", error);
      return [];
    }
  },
  []
);

/* ==========================================================
   LOAD COMPLETE DASHBOARD
========================================================== */

const loadDashboard = useCallback(
  async (
    currentUsername: string,
    currentToken: string
  ) => {
    if (!currentUsername || !currentToken) return;

    try {
      setLoading(true);
      setErrorMessage("");

      /* ---------- Verify Login ---------- */

      const valid = await verifyLogin(currentToken);

      if (!valid) return;

      /* ---------- Load Everything Parallel ---------- */

      const [
        _profile,
        pkrBalance,
        goldBalance,
        usdtBalance,
        goldPrices,
        usdtPrices,
        txs,
      ] = await Promise.all([
        loadUserProfile(currentToken),
        loadWallet(currentUsername, currentToken),
        loadGoldPortfolio(currentUsername, currentToken),
        loadUsdtPortfolio(currentUsername, currentToken),
        loadGoldMarket(),
        loadUsdtMarket(),
        loadTransactions(currentUsername, currentToken),
      ]);

      /* ---------- Calculate Portfolio ---------- */

      calculatePortfolio({
        pkrBalance,
        goldBalance,
        usdtBalance,
      });

      console.log("Dashboard Loaded Successfully");

      return {
        transactions: txs,
        goldPrices,
        usdtPrices,
      };
    } catch (error: any) {
      console.error("LOAD DASHBOARD ERROR:", error);

      setErrorMessage(
        error.message || "Dashboard failed to load."
      );
    } finally {
      setLoading(false);
    }
  },
  [
    verifyLogin,
    loadUserProfile,
    loadWallet,
    loadGoldPortfolio,
    loadUsdtPortfolio,
    loadGoldMarket,
    loadUsdtMarket,
    loadTransactions,
    calculatePortfolio,
  ]
);

/* ==========================================================
   REFRESH DASHBOARD
========================================================== */

const refreshDashboard = useCallback(async () => {
  if (!username || !token) return;

  try {
    setRefreshing(true);

    await loadDashboard(username, token);

    console.log("Dashboard Refreshed");
  } finally {
    setRefreshing(false);
  }
}, [username, token, loadDashboard]);

/* ==========================================================
   INITIAL LOAD
========================================================== */

useEffect(() => {
  if (!username || !token) return;

  loadDashboard(username, token);
}, [username, token, loadDashboard]);

/* ==========================================================
   AUTO REFRESH (60 SEC)
========================================================== */

useEffect(() => {
  if (!username || !token) return;

  const timer = setInterval(() => {
    loadDashboard(username, token);
  }, 60000);

  return () => clearInterval(timer);
}, [username, token, loadDashboard]);

/* ==========================================================
   CLEAR ERROR AFTER 5 SECONDS
========================================================== */

useEffect(() => {
  if (!errorMessage) return;

  const timer = setTimeout(() => {
    setErrorMessage("");
  }, 5000);

  return () => clearTimeout(timer);
}, [errorMessage]);

/* ==========================================================
   DASHBOARD STATS
========================================================== */

const dashboardStats = useMemo(() => {
  const deposits = transactions.filter((tx) =>
    tx.type.toUpperCase().includes("DEPOSIT")
  ).length;

  const withdraws = transactions.filter((tx) =>
    tx.type.toUpperCase().includes("WITHDRAW")
  ).length;

  const completed = transactions.filter((tx) => {
    const status = tx.status.toUpperCase();
    return (
      status === "SUCCESS" ||
      status === "APPROVED" ||
      status === "COMPLETED"
    );
  }).length;

  return {
    totalTransactions: transactions.length,
    deposits,
    withdraws,
    completed,
  };
}, [transactions]);

/* ==========================================================
   PART 6/10
   QUICK ACTIONS + DASHBOARD STATS + NAVIGATION
========================================================== */

/* ==========================================================
   SAFE NAVIGATION (NEXT.JS APP ROUTER)
========================================================== */

const navigate = useCallback(
  (path: string) => {
    router.push(path);
  },
  [router]
);

/* ==========================================================
   QUICK ACTIONS
========================================================== */

const quickActions = useMemo(
  () => [
    {
      title: "Deposit PKR",
      description: "Add funds to wallet",
      icon: ArrowDownLeft,
      color: "bg-green-600 hover:bg-green-700",
      path: "/deposit",
    },
    {
      title: "Withdraw PKR",
      description: "Withdraw wallet balance",
      icon: ArrowUpRight,
      color: "bg-red-600 hover:bg-red-700",
      path: "/withdraw",
    },
    {
      title: "Gold Trading",
      description: "Buy & Sell Gold",
      icon: Coins,
      color: "bg-yellow-500 hover:bg-yellow-600 text-black",
      path: "/gold",
    },
    {
      title: "USDT Trading",
      description: "Buy & Sell USDT",
      icon: DollarSign,
      color: "bg-cyan-500 hover:bg-cyan-600 text-black",
      path: "/usdt",
    },
    {
      title: "Transactions",
      description: "View History",
      icon: History,
      color: "bg-indigo-600 hover:bg-indigo-700",
      path: "/transactions",
    },
    {
      title: "Wallet",
      description: "Wallet Overview",
      icon: Wallet,
      color: "bg-purple-600 hover:bg-purple-700",
      path: "/wallet",
    },
  ],
  []
);

/* ==========================================================
   DASHBOARD SUMMARY CARDS
========================================================== */

const dashboardSummary = useMemo(() => {
  const approvedTransactions = transactions.filter((tx) => {
    const status = tx.status.toUpperCase();
    return (
      status === "APPROVED" ||
      status === "COMPLETED" ||
      status === "SUCCESS"
    );
  }).length;

  const pendingTransactions = transactions.filter(
    (tx) => tx.status.toUpperCase() === "PENDING"
  ).length;

  const rejectedTransactions = transactions.filter((tx) => {
    const status = tx.status.toUpperCase();
    return (
      status === "REJECTED" || status === "FAILED"
    );
  }).length;

  return {
    totalAssets,
    approvedTransactions,
    pendingTransactions,
    rejectedTransactions,
    totalTransactions: transactions.length,
  };
}, [transactions, totalAssets]);

/* ==========================================================
   MARKET STATUS
========================================================== */

const marketCards = useMemo(
  () => [
    {
      title: "Gold Market",
      status: goldMarketOpen ? "OPEN" : "CLOSED",
      value: `Buy PKR ${formatMoney(
        goldMarket.buyPrice
      )}`,
      icon: Coins,
      color: goldMarketOpen
        ? "text-green-400"
        : "text-red-400",
    },
    {
      title: "USDT Market",
      status: usdtMarketOpen ? "OPEN" : "CLOSED",
      value: `Buy PKR ${formatMoney(
        usdtMarket.buyPrice
      )}`,
      icon: DollarSign,
      color: usdtMarketOpen
        ? "text-green-400"
        : "text-red-400",
    },
  ],
  [
    goldMarketOpen,
    usdtMarketOpen,
    goldMarket.buyPrice,
    usdtMarket.buyPrice,
    formatMoney,
  ]
);

/* ==========================================================
   QUICK ACTION UI
========================================================== */

const QuickActionsSection = () => (
  <div className="rounded-2xl bg-[#111827] border border-gray-700 p-6">
    <div className="flex justify-between items-center mb-6">
      <h2 className="text-2xl font-bold text-yellow-400">
        Quick Actions
      </h2>

      <button
        onClick={refreshDashboard}
        disabled={refreshing}
        className="flex items-center gap-2 bg-yellow-500 hover:bg-yellow-600 disabled:opacity-60 text-black font-semibold px-4 py-2 rounded-xl transition"
      >
        <RefreshCw
          size={18}
          className={
            refreshing ? "animate-spin" : ""
          }
        />
        Refresh
      </button>
    </div>

    <div className="grid grid-cols-2 lg:grid-cols-3 gap-5">
      {quickActions.map((action) => {
        const Icon = action.icon;

        return (
          <button
            key={action.title}
            onClick={() => navigate(action.path)}
            className={`${action.color} rounded-2xl p-5 transition text-center shadow-lg`}
          >
            <Icon
              size={34}
              className="mx-auto mb-3"
            />

            <p className="font-semibold text-base">
              {action.title}
            </p>

            <p className="text-xs opacity-80 mt-2">
              {action.description}
            </p>
          </button>
        );
      })}
    </div>
  </div>
);

/* ==========================================================
   DASHBOARD STATS UI
========================================================== */

const DashboardStatsSection = () => (
  <div className="grid grid-cols-2 xl:grid-cols-4 gap-5">
    <div className="bg-[#111827] rounded-2xl border border-green-600/20 p-5">
      <Activity className="text-green-400 mb-3" />
      <p className="text-gray-400 text-sm">
        Total Assets
      </p>

      <h3 className="text-xl font-bold text-green-400 mt-2">
        {showBalance
          ? `PKR ${formatMoney(
              dashboardSummary.totalAssets
            )}`
          : "********"}
      </h3>
    </div>

    <div className="bg-[#111827] rounded-2xl border border-blue-600/20 p-5">
      <CheckCircle className="text-blue-400 mb-3" />
      <p className="text-gray-400 text-sm">
        Approved
      </p>

      <h3 className="text-xl font-bold text-blue-400 mt-2">
        {
          dashboardSummary.approvedTransactions
        }
      </h3>
    </div>

    <div className="bg-[#111827] rounded-2xl border border-yellow-600/20 p-5">
      <History className="text-yellow-400 mb-3" />
      <p className="text-gray-400 text-sm">
        Pending
      </p>

      <h3 className="text-xl font-bold text-yellow-400 mt-2">
        {dashboardSummary.pendingTransactions}
      </h3>
    </div>

    <div className="bg-[#111827] rounded-2xl border border-red-600/20 p-5">
      <XCircle className="text-red-400 mb-3" />
      <p className="text-gray-400 text-sm">
        Rejected
      </p>

      <h3 className="text-xl font-bold text-red-400 mt-2">
        {
          dashboardSummary.rejectedTransactions
        }
      </h3>
    </div>
  </div>
);

/* ==========================================================
   MARKET STATUS UI
========================================================== */

const MarketStatusSection = () => (
  <div className="grid md:grid-cols-2 gap-5">
    {marketCards.map((market) => {
      const Icon = market.icon;

      return (
        <div
          key={market.title}
          className="rounded-2xl bg-[#111827] border border-gray-700 p-5"
        >
          <div className="flex justify-between items-center mb-4">
            <Icon
              size={28}
              className={market.color}
            />

            <span
              className={`text-xs font-bold px-3 py-1 rounded-full ${
                market.status === "OPEN"
                  ? "bg-green-600 text-white"
                  : "bg-red-600 text-white"
              }`}
            >
              {market.status}
            </span>
          </div>

          <p className="text-gray-400 text-sm">
            {market.title}
          </p>

          <h3
            className={`text-2xl font-bold mt-2 ${market.color}`}
          >
            {market.value}
          </h3>
        </div>
      );
    })}
  </div>
);

/* ==========================================================
   ACCOUNT STATUS CARD
========================================================== */

const AccountStatusSection = () => (
  <div className="rounded-2xl bg-[#111827] border border-gray-700 p-6">
    <div className="flex flex-col lg:flex-row justify-between gap-6">
      <div>
        <h2 className="text-xl font-bold text-yellow-400 mb-3">
          Account Status
        </h2>

        <p className="text-gray-400 text-sm">
          Logged In User
        </p>

        <p className="text-green-400 font-semibold mt-2">
          {user.fullName || username}
        </p>

        <p className="text-gray-500 text-sm">
          @{user.username}
        </p>

        <p className="text-gray-500 text-sm">
          {user.email}
        </p>
      </div>

      <div className="flex flex-col items-start lg:items-end gap-3">
        <span className="bg-green-600/20 border border-green-500/30 text-green-400 px-4 py-2 rounded-full font-semibold">
          VERIFIED USER
        </span>

        {isAdmin && (
          <span className="bg-purple-600/20 border border-purple-500/30 text-purple-400 px-4 py-2 rounded-full font-semibold">
            ADMIN ACCESS
          </span>
        )}

        <button
          onClick={logout}
          className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-xl font-semibold transition"
        >
          Logout
        </button>
      </div>
    </div>
  </div>
);

/* ==========================================================
   PART 7/10
   HEADER + WALLET CARDS + PORTFOLIO SUMMARY
   GoldTrade V18 Enterprise (Production UI)
========================================================== */

/* ==========================================================
   HEADER SECTION
========================================================== */

const HeaderSection = () => (
  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5 mb-8">
    <div>
      <h1 className="text-3xl lg:text-4xl font-bold text-yellow-400">
        GoldTrade V18 Enterprise Dashboard
      </h1>

      <p className="text-gray-400 mt-2">
        Welcome back,{" "}
        <span className="text-white font-semibold">
          {user.fullName || username}
        </span>
      </p>

      <p className="text-gray-500 text-sm mt-1">
        @{user.username}
      </p>
    </div>

    <div className="flex flex-wrap gap-3">
      <button
        onClick={() => setShowBalance((prev) => !prev)}
        className="flex items-center gap-2 bg-[#1F2937] hover:bg-[#374151] px-5 py-3 rounded-xl border border-gray-700 transition"
      >
        {showBalance ? (
          <Eye size={18} />
        ) : (
          <EyeOff size={18} />
        )}

        {showBalance ? "Hide Balance" : "Show Balance"}
      </button>

      <button
        onClick={refreshDashboard}
        disabled={refreshing}
        className="flex items-center gap-2 bg-yellow-500 hover:bg-yellow-600 disabled:opacity-60 text-black font-semibold px-5 py-3 rounded-xl transition"
      >
        <RefreshCw
          size={18}
          className={refreshing ? "animate-spin" : ""}
        />
        {refreshing ? "Refreshing..." : "Refresh"}
      </button>
    </div>
  </div>
);

/* ==========================================================
   TOTAL PORTFOLIO HERO CARD
========================================================== */

const PortfolioHeroCard = () => (
  <div className="rounded-3xl bg-gradient-to-r from-yellow-500 via-orange-500 to-yellow-400 text-black p-7 shadow-xl mb-8">
    <div className="flex justify-between items-start">
      <div>
        <p className="uppercase tracking-widest text-sm font-semibold">
          Total Portfolio Value
        </p>

        <h2 className="text-4xl lg:text-5xl font-bold mt-3">
          {showBalance
            ? `PKR ${formatMoney(totalAssets)}`
            : "********"}
        </h2>

        <p className="mt-3 text-black/70 text-sm">
          PKR + Gold + USDT Combined Assets
        </p>
      </div>

      <Shield size={42} />
    </div>
  </div>
);

/* ==========================================================
   WALLET CARDS
========================================================== */

const walletCards = [
  {
    title: "PKR Wallet",
    icon: Wallet,
    color: "text-green-400",
    border: "border-green-500/20",
    value: showBalance
      ? `PKR ${formatMoney(wallet.pkrBalance)}`
      : "********",
    subtitle: "Available PKR Balance",
  },
  {
    title: "Gold Wallet",
    icon: Coins,
    color: "text-yellow-400",
    border: "border-yellow-500/20",
    value: showBalance
      ? `${formatGold(wallet.goldBalance)} Gold`
      : "********",
    subtitle: showBalance
      ? `≈ PKR ${formatMoney(portfolio.goldValue)}`
      : "********",
  },
  {
    title: "USDT Wallet",
    icon: DollarSign,
    color: "text-cyan-400",
    border: "border-cyan-500/20",
    value: showBalance
      ? `${formatUsdt(wallet.usdtBalance)} USDT`
      : "********",
    subtitle: showBalance
      ? `≈ PKR ${formatMoney(portfolio.usdtValue)}`
      : "********",
  },
];

const WalletCardsSection = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 mb-8">
    {walletCards.map((card) => {
      const Icon = card.icon;

      return (
        <div
          key={card.title}
          className={`rounded-2xl bg-[#111827] border ${card.border} p-6 hover:border-yellow-500/30 transition`}
        >
          <div className="flex justify-between items-center mb-5">
            <Icon size={30} className={card.color} />

            <span
              className={`text-xs font-semibold ${card.color}`}
            >
              {card.title.toUpperCase()}
            </span>
          </div>

          <p className="text-gray-400 text-sm">
            {card.subtitle}
          </p>

          <h3
            className={`text-3xl font-bold mt-3 ${card.color}`}
          >
            {card.value}
          </h3>
        </div>
      );
    })}
  </div>
);

/* ==========================================================
   PORTFOLIO SUMMARY CARDS
========================================================== */

const portfolioCards = [
  {
    title: "Gold Value",
    value: portfolio.goldValue,
    color: "text-yellow-400",
    border: "border-yellow-500/20",
    icon: TrendingUp,
  },
  {
    title: "USDT Value",
    value: portfolio.usdtValue,
    color: "text-cyan-400",
    border: "border-cyan-500/20",
    icon: TrendingUp,
  },
  {
    title: "Total Assets",
    value: totalAssets,
    color: "text-green-400",
    border: "border-green-500/20",
    icon: Activity,
  },
];

const PortfolioSummarySection = () => (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
    {portfolioCards.map((card) => {
      const Icon = card.icon;

      return (
        <div
          key={card.title}
          className={`rounded-2xl bg-[#111827] border ${card.border} p-6`}
        >
          <div className="flex justify-between items-center mb-4">
            <Icon size={26} className={card.color} />

            <span
              className={`text-xs font-semibold ${card.color}`}
            >
              {card.title.toUpperCase()}
            </span>
          </div>

          <p className="text-gray-400 text-sm">
            Current Value
          </p>

          <h3
            className={`text-2xl font-bold mt-2 ${card.color}`}
          >
            {showBalance
              ? `PKR ${formatMoney(card.value)}`
              : "********"}
          </h3>
        </div>
      );
    })}
  </div>
);

/* ==========================================================
   PART 8/10
   LIVE GOLD MARKET + LIVE USDT MARKET UI
   GoldTrade V18 Enterprise (Production Fixed)
========================================================== */

/* ==========================================================
   MARKET PRICE CARD COMPONENT
========================================================== */

const MarketPriceCard = ({
  title,
  buyPrice,
  sellPrice,
  marketOpen,
  color,
  icon: Icon,
  network,
}: {
  title: string;
  buyPrice: number;
  sellPrice: number;
  marketOpen: boolean;
  color: "yellow" | "cyan";
  icon: any;
  network?: string;
}) => {
  const theme =
    color === "yellow"
      ? {
          border: "border-yellow-500/20",
          text: "text-yellow-400",
          bg: "bg-yellow-500/10",
        }
      : {
          border: "border-cyan-500/20",
          text: "text-cyan-400",
          bg: "bg-cyan-500/10",
        };

  return (
    <div
      className={`rounded-2xl bg-[#111827] border ${theme.border} p-6 shadow-lg`}
    >
      {/* HEADER */}

      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <Icon className={theme.text} size={30} />

          <h2 className={`text-2xl font-bold ${theme.text}`}>
            {title}
          </h2>
        </div>

        <span
          className={`px-4 py-2 rounded-full text-xs font-bold ${
            marketOpen
              ? "bg-green-600 text-white"
              : "bg-red-600 text-white"
          }`}
        >
          {marketOpen ? "MARKET OPEN" : "MARKET CLOSED"}
        </span>
      </div>

      {/* BUY / SELL */}

      <div className="grid md:grid-cols-2 gap-5">
        <div
          className={`rounded-xl ${theme.bg} p-5 border border-green-500/20`}
        >
          <div className="flex justify-between items-center mb-3">
            <TrendingUp className="text-green-400" size={24} />

            <span className="text-green-400 text-xs font-semibold">
              BUY PRICE
            </span>
          </div>

          <h3 className="text-3xl font-bold text-green-400">
            PKR {formatMoney(buyPrice)}
          </h3>
        </div>

        <div
          className={`rounded-xl ${theme.bg} p-5 border border-red-500/20`}
        >
          <div className="flex justify-between items-center mb-3">
            <TrendingDown className="text-red-400" size={24} />

            <span className="text-red-400 text-xs font-semibold">
              SELL PRICE
            </span>
          </div>

          <h3 className="text-3xl font-bold text-red-400">
            PKR {formatMoney(sellPrice)}
          </h3>
        </div>
      </div>

      {/* SPREAD */}

      <div className="mt-5 bg-[#1F2937] rounded-xl p-4 border border-gray-700">
        <div className="flex justify-between items-center">
          <span className="text-gray-400 text-sm">
            Market Spread
          </span>

          <span className="font-bold text-white">
            PKR {formatMoney(sellPrice - buyPrice)}
          </span>
        </div>
      </div>

      {/* NETWORK */}

      {network && (
        <div className="mt-5 bg-[#1F2937] rounded-xl p-4 border border-gray-700">
          <div className="flex justify-between items-center">
            <span className="text-gray-400 text-sm">
              Active Network
            </span>

            <span className="font-bold text-cyan-400">
              {network}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

/* ==========================================================
   MARKET OVERVIEW SECTION
========================================================== */

const MarketOverviewSection = () => (
  <div className="space-y-8">
    {/* GOLD MARKET */}

    <MarketPriceCard
      title="Live Gold Market"
      buyPrice={goldMarket.buyPrice}
      sellPrice={goldMarket.sellPrice}
      marketOpen={goldMarketOpen}
      color="yellow"
      icon={Coins}
    />

    {/* USDT MARKET */}

    <MarketPriceCard
      title="Live USDT Market"
      buyPrice={usdtMarket.buyPrice}
      sellPrice={usdtMarket.sellPrice}
      marketOpen={usdtMarketOpen}
      color="cyan"
      icon={DollarSign}
      network={usdtMarket.network}
    />
  </div>
);

/* ==========================================================
   MARKET STATUS GRID
========================================================== */

const MarketStatusGrid = () => (
  <div className="grid md:grid-cols-2 gap-5">
    {/* GOLD STATUS */}

    <div className="rounded-2xl bg-[#111827] border border-yellow-500/20 p-5">
      <div className="flex justify-between items-center mb-4">
        <Coins className="text-yellow-400" size={30} />

        {goldMarketOpen ? (
          <CheckCircle
            className="text-green-400"
            size={22}
          />
        ) : (
          <XCircle
            className="text-red-400"
            size={22}
          />
        )}
      </div>

      <p className="text-gray-400 text-sm">
        Gold Trading Status
      </p>

      <h3
        className={`text-2xl font-bold mt-2 ${
          goldMarketOpen
            ? "text-green-400"
            : "text-red-400"
        }`}
      >
        {goldMarketOpen ? "ACTIVE" : "CLOSED"}
      </h3>

      <p className="text-gray-500 text-sm mt-3">
        Buy: PKR {formatMoney(goldMarket.buyPrice)}
      </p>

      <p className="text-gray-500 text-sm">
        Sell: PKR {formatMoney(goldMarket.sellPrice)}
      </p>
    </div>

    {/* USDT STATUS */}

    <div className="rounded-2xl bg-[#111827] border border-cyan-500/20 p-5">
      <div className="flex justify-between items-center mb-4">
        <DollarSign className="text-cyan-400" size={30} />

        {usdtMarketOpen ? (
          <CheckCircle
            className="text-green-400"
            size={22}
          />
        ) : (
          <XCircle
            className="text-red-400"
            size={22}
          />
        )}
      </div>

      <p className="text-gray-400 text-sm">
        USDT Trading Status
      </p>

      <h3
        className={`text-2xl font-bold mt-2 ${
          usdtMarketOpen
            ? "text-green-400"
            : "text-red-400"
        }`}
      >
        {usdtMarketOpen ? "ACTIVE" : "CLOSED"}
      </h3>

      <p className="text-gray-500 text-sm mt-3">
        Buy: PKR {formatMoney(usdtMarket.buyPrice)}
      </p>

      <p className="text-gray-500 text-sm">
        Sell: PKR {formatMoney(usdtMarket.sellPrice)}
      </p>

      <p className="text-cyan-400 text-sm mt-2 font-semibold">
        Network: {usdtMarket.network}
      </p>
    </div>
  </div>
);

/* ==========================================================
   MARKET REFRESH INFO
========================================================== */

const MarketRefreshInfo = () => (
  <div className="rounded-2xl bg-[#111827] border border-gray-700 p-5">
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div>
        <p className="text-gray-400 text-sm">
          Live Market Refresh
        </p>

        <h3 className="text-lg font-semibold text-white mt-1">
          Prices refresh automatically every 30 seconds.
        </h3>
      </div>

      <button
        onClick={refreshMarketPrices}
        className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold px-5 py-3 rounded-xl transition flex items-center gap-2"
      >
        <RefreshCw size={18} />
        Refresh Market
      </button>
    </div>
  </div>
);

/* ==========================================================
   PART 9/10
   RECENT TRANSACTIONS + PORTFOLIO ACTIVITY SUMMARY
   GoldTrade V18 Enterprise (IQ 800 Production)
========================================================== */

/* ==========================================================
   TRANSACTION STATUS COLORS
========================================================== */

const getTransactionStatus = (status: string) => {
  switch (status.toUpperCase()) {
    case "SUCCESS":
    case "APPROVED":
    case "COMPLETED":
      return {
        color: "bg-green-600 text-white",
        icon: CheckCircle,
      };

    case "PENDING":
      return {
        color: "bg-yellow-500 text-black",
        icon: Activity,
      };

    default:
      return {
        color: "bg-red-600 text-white",
        icon: XCircle,
      };
  }
};

/* ==========================================================
   TRANSACTION TYPE COLORS
========================================================== */

const getTransactionType = (type: string) => {
  const value = type.toUpperCase();

  if (value.includes("DEPOSIT"))
    return {
      icon: ArrowDownLeft,
      color: "text-green-400",
      label: "Deposit",
    };

  if (value.includes("WITHDRAW"))
    return {
      icon: ArrowUpRight,
      color: "text-red-400",
      label: "Withdraw",
    };

  if (value.includes("GOLD"))
    return {
      icon: Coins,
      color: "text-yellow-400",
      label: "Gold Trade",
    };

  if (value.includes("USDT"))
    return {
      icon: DollarSign,
      color: "text-cyan-400",
      label: "USDT Trade",
    };

  return {
    icon: Wallet,
    color: "text-gray-400",
    label: type,
  };
};

/* ==========================================================
   RECENT TRANSACTIONS SECTION
========================================================== */

const RecentTransactionsSection = () => (
  <div className="rounded-2xl bg-[#111827] border border-gray-700 p-6">
    <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
      <div>
        <h2 className="text-2xl font-bold text-yellow-400">
          Recent Transactions
        </h2>

        <p className="text-gray-400 text-sm mt-2">
          Latest Deposit, Withdraw, Gold & USDT activity.
        </p>
      </div>

      <button
        onClick={() => navigate("/transactions")}
        className="bg-[#1F2937] hover:bg-[#374151] border border-gray-600 px-5 py-3 rounded-xl text-sm font-semibold transition"
      >
        View All
      </button>
    </div>

    {loading ? (
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map((item) => (
          <div
            key={item}
            className="animate-pulse bg-[#1F2937] rounded-xl h-16"
          />
        ))}
      </div>
    ) : transactions.length === 0 ? (
      <div className="text-center py-14">
        <History
          size={48}
          className="mx-auto text-gray-500 mb-4"
        />

        <h3 className="text-xl font-semibold text-gray-300">
          No Transactions Found
        </h3>

        <p className="text-gray-500 mt-2">
          Your latest GoldTrade activity will appear here.
        </p>
      </div>
    ) : (
      <div className="overflow-x-auto rounded-xl border border-gray-700">
        <table className="w-full">
          <thead className="bg-[#1F2937]">
            <tr className="text-left text-gray-300 text-sm">
              <th className="px-4 py-3">Transaction</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Date</th>
            </tr>
          </thead>

          <tbody>
            {transactions.map((tx) => {
              const statusInfo =
                getTransactionStatus(tx.status);

              const typeInfo =
                getTransactionType(tx.type);

              const StatusIcon = statusInfo.icon;
              const TypeIcon = typeInfo.icon;

              return (
                <tr
                  key={tx._id}
                  className="border-t border-gray-700 hover:bg-[#1B2433] transition"
                >
                  {/* TYPE */}

                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <TypeIcon
                        size={20}
                        className={typeInfo.color}
                      />

                      <div>
                        <p className="font-semibold">
                          {typeInfo.label}
                        </p>

                        <p className="text-xs text-gray-500">
                          {tx.type}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* AMOUNT */}

                  <td className="px-4 py-4 font-semibold text-white">
                    {showBalance
                      ? `PKR ${formatMoney(tx.amount)}`
                      : "********"}
                  </td>

                  {/* STATUS */}

                  <td className="px-4 py-4">
                    <span
                      className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold ${statusInfo.color}`}
                    >
                      <StatusIcon size={14} />
                      {tx.status.toUpperCase()}
                    </span>
                  </td>

                  {/* DATE */}

                  <td className="px-4 py-4 text-sm text-gray-400">
                    {formatDate(tx.createdAt)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    )}
  </div>
);

/* ==========================================================
   PORTFOLIO ACTIVITY SUMMARY
========================================================== */

const PortfolioActivitySummary = () => (
  <div className="rounded-2xl bg-[#111827] border border-gray-700 p-6">
    <h2 className="text-2xl font-bold text-green-400 mb-6">
      Portfolio Activity Summary
    </h2>

    <div className="grid md:grid-cols-3 gap-5">
      {/* PKR */}

      <div className="bg-[#1F2937] rounded-xl p-5 border border-green-600/20">
        <Wallet
          className="text-green-400 mb-3"
          size={28}
        />

        <p className="text-gray-400 text-sm">
          PKR Wallet Balance
        </p>

        <h3 className="text-2xl font-bold text-green-400 mt-2">
          {showBalance
            ? `PKR ${formatMoney(wallet.pkrBalance)}`
            : "********"}
        </h3>
      </div>

      {/* GOLD */}

      <div className="bg-[#1F2937] rounded-xl p-5 border border-yellow-600/20">
        <Coins
          className="text-yellow-400 mb-3"
          size={28}
        />

        <p className="text-gray-400 text-sm">
          Gold Holdings
        </p>

        <h3 className="text-2xl font-bold text-yellow-400 mt-2">
          {showBalance
            ? `${formatGold(wallet.goldBalance)} Gold`
            : "********"}
        </h3>

        <p className="text-gray-500 text-sm mt-2">
          Value:{" "}
          {showBalance
            ? `PKR ${formatMoney(portfolio.goldValue)}`
            : "********"}
        </p>
      </div>

      {/* USDT */}

      <div className="bg-[#1F2937] rounded-xl p-5 border border-cyan-600/20">
        <DollarSign
          className="text-cyan-400 mb-3"
          size={28}
        />

        <p className="text-gray-400 text-sm">
          USDT Holdings
        </p>

        <h3 className="text-2xl font-bold text-cyan-400 mt-2">
          {showBalance
            ? `${formatUsdt(wallet.usdtBalance)} USDT`
            : "********"}
        </h3>

        <p className="text-gray-500 text-sm mt-2">
          Value:{" "}
          {showBalance
            ? `PKR ${formatMoney(portfolio.usdtValue)}`
            : "********"}
        </p>
      </div>
    </div>

    {/* TOTAL */}

    <div className="mt-6 bg-gradient-to-r from-green-600/20 to-cyan-600/20 border border-green-500/30 rounded-xl p-5">
      <div className="flex justify-between items-center">
        <div>
          <p className="text-gray-400 text-sm">
            Total Portfolio Assets
          </p>

          <h2 className="text-3xl font-bold text-green-400 mt-2">
            {showBalance
              ? `PKR ${formatMoney(totalAssets)}`
              : "********"}
          </h2>
        </div>

        <Shield
          className="text-green-400"
          size={40}
        />
      </div>
    </div>
  </div>
);

/* ==========================================================
   DASHBOARD ANALYTICS STRIP
========================================================== */

const DashboardAnalyticsStrip = () => (
  <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
    <div className="rounded-xl bg-[#111827] border border-green-500/20 p-5">
      <p className="text-gray-400 text-xs uppercase">
        Total Transactions
      </p>

      <h3 className="text-2xl font-bold text-green-400 mt-2">
        {dashboardSummary.totalTransactions}
      </h3>
    </div>

    <div className="rounded-xl bg-[#111827] border border-blue-500/20 p-5">
      <p className="text-gray-400 text-xs uppercase">
        Approved
      </p>

      <h3 className="text-2xl font-bold text-blue-400 mt-2">
        {dashboardSummary.approvedTransactions}
      </h3>
    </div>

    <div className="rounded-xl bg-[#111827] border border-yellow-500/20 p-5">
      <p className="text-gray-400 text-xs uppercase">
        Pending
      </p>

      <h3 className="text-2xl font-bold text-yellow-400 mt-2">
        {dashboardSummary.pendingTransactions}
      </h3>
    </div>

    <div className="rounded-xl bg-[#111827] border border-red-500/20 p-5">
      <p className="text-gray-400 text-xs uppercase">
        Rejected
      </p>

      <h3 className="text-2xl font-bold text-red-400 mt-2">
        {dashboardSummary.rejectedTransactions}
      </h3>
    </div>
  </div>
);

/* ==========================================================
   PART 10/10
   ACCOUNT INFO + LOADING OVERLAY + FOOTER
   FINAL PRODUCTION VERSION (IQ 800)
========================================================== */

/* ==========================================================
   ACCOUNT INFORMATION SECTION
========================================================== */

const AccountInformationSection = () => (
  <div className="rounded-2xl bg-[#111827] border border-gray-700 p-6">
    <div className="flex flex-col lg:flex-row justify-between gap-6">

      <div>
        <h2 className="text-xl font-bold text-yellow-400 mb-3">
          Account Information
        </h2>

        <div className="space-y-2 text-sm">
          <p className="text-gray-400">
            Username:
            <span className="text-green-400 ml-2 font-semibold">
              {user.username}
            </span>
          </p>

          <p className="text-gray-400">
            Full Name:
            <span className="text-white ml-2 font-semibold">
              {user.fullName || username}
            </span>
          </p>

          <p className="text-gray-400">
            Email:
            <span className="text-white ml-2">
              {user.email || "Not Available"}
            </span>
          </p>

          <p className="text-gray-400">
            Account Role:
            <span className="text-cyan-400 ml-2 font-semibold uppercase">
              {user.role}
            </span>
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3 items-start lg:items-end">

        <span className="bg-green-600/20 border border-green-500/30 text-green-400 px-4 py-2 rounded-full font-semibold flex items-center gap-2">
          <CheckCircle size={16}/>
          VERIFIED ACCOUNT
        </span>

        {isAdmin && (
          <span className="bg-purple-600/20 border border-purple-500/30 text-purple-400 px-4 py-2 rounded-full font-semibold flex items-center gap-2">
            <Shield size={16}/>
            ADMIN PANEL ACCESS
          </span>
        )}

        <button
          onClick={logout}
          className="bg-red-600 hover:bg-red-700 px-5 py-3 rounded-xl font-semibold transition"
        >
          Logout Account
        </button>

      </div>

    </div>
  </div>
);

/* ==========================================================
   LOADING OVERLAY COMPONENT
========================================================== */

const LoadingOverlay = () => {
  if (!loading && !refreshing) return null;

  return (
    <div className="fixed inset-0 z-[999] bg-black/70 backdrop-blur-sm flex items-center justify-center">

      <div className="bg-[#111827] border border-yellow-500/30 rounded-3xl px-8 py-7 shadow-2xl flex flex-col items-center gap-4">

        <RefreshCw
          size={42}
          className="animate-spin text-yellow-400"
        />

        <h2 className="text-2xl font-bold text-yellow-400">
          GoldTrade V18 Enterprise
        </h2>

        <p className="text-gray-300 text-center">
          {refreshing
            ? "Refreshing dashboard data..."
            : "Loading your dashboard..."}
        </p>

      </div>

    </div>
  );
};

/* ==========================================================
   ERROR TOAST
========================================================== */

const ErrorToast = () => {
  if (!errorMessage) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[998] max-w-sm rounded-xl border border-red-500 bg-red-600/20 backdrop-blur-md px-5 py-4 shadow-xl">
      <div className="flex gap-3 items-start">
        <XCircle className="text-red-400 mt-1" size={20}/>

        <div>
          <h3 className="font-semibold text-red-300">
            Dashboard Error
          </h3>

          <p className="text-red-200 text-sm mt-1">
            {errorMessage}
          </p>
        </div>
      </div>
    </div>
  );
};

/* ==========================================================
   FOOTER
========================================================== */

const DashboardFooter = () => (
  <footer className="mt-14 border-t border-gray-800 pt-8">

    <div className="flex flex-col lg:flex-row justify-between items-center gap-5">

      <div>
        <h2 className="text-yellow-400 font-bold text-xl">
          GoldTrade V18 Enterprise
        </h2>

        <p className="text-gray-500 text-sm mt-2">
          PKR • GOLD • USDT Secure Trading Platform
        </p>

        <p className="text-gray-600 text-xs mt-2">
          Enterprise Dashboard Version 18
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">

        <div className="flex items-center gap-2 text-green-400">
          <Wallet size={16}/>
          Secure Wallet
        </div>

        <div className="flex items-center gap-2 text-yellow-400">
          <Coins size={16}/>
          Gold Trading
        </div>

        <div className="flex items-center gap-2 text-cyan-400">
          <DollarSign size={16}/>
          USDT Trading
        </div>

        <div className="flex items-center gap-2 text-blue-400">
          <Shield size={16}/>
          JWT Protected
        </div>

      </div>

    </div>

    <div className="mt-8 border-t border-gray-800 pt-5 text-center text-gray-600 text-sm">

      <p>
        © {new Date().getFullYear()} GoldTrade V18 Enterprise
      </p>

      <p className="mt-2">
        Developed for PKR Wallet, Gold Wallet & USDT Trading Platform.
      </p>

      <p className="mt-2 text-gray-500">
        Powered by Next.js • Render Backend • MongoDB • JWT Authentication
      </p>

    </div>

  </footer>
);

/* ==========================================================
   FINAL RETURN
========================================================== */

return (
  <div className="min-h-screen bg-[#0B1120] text-white p-5 lg:p-8">

    <LoadingOverlay/>

    <ErrorToast/>

    <HeaderSection/>

    <PortfolioHeroCard/>

    <DashboardStatsSection/>

    <WalletCardsSection/>

    <PortfolioSummarySection/>

    <MarketOverviewSection/>

    <MarketStatusGrid/>

    <MarketRefreshInfo/>

    <QuickActionsSection/>

    <RecentTransactionsSection/>

    <DashboardAnalyticsStrip/>

    <PortfolioActivitySummary/>

    <AccountInformationSection/>

    <DashboardFooter/>

  </div>
);
}