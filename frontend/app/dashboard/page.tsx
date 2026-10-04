"use client";

// ==========================================================
// GoldTrade V18 Enterprise
// USER DASHBOARD
// PART 1/12
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
// API URL
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
  // SESSION STATE
  // ========================================================

  const [user, setUser] =
    useState<GoldTradeUser | null>(null);

  const [checkingSession, setCheckingSession] =
    useState(true);

  // ========================================================
  // LOADING STATES
  // ========================================================

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  // ========================================================
  // ALERT STATES
  // ========================================================

  const [errorMessage, setErrorMessage] =
    useState("");

  const [successMessage, setSuccessMessage] =
    useState("");

  // ========================================================
  // NETWORK STATE
  // ========================================================

  const [isOnline, setIsOnline] =
    useState(true);

  // ========================================================
  // WALLET STATE
  // ========================================================

  const [wallet, setWallet] =
    useState<WalletData>({
      balancePKR: 0,
      balanceUSD: 0,
      balanceUSDT: 0,
      goldBalanceGram: 0,
    });

  // ========================================================
  // DASHBOARD STATS
  // ========================================================

  const [stats, setStats] =
    useState<DashboardStats>({
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

  const [goldMarket, setGoldMarket] =
    useState<GoldMarket>({
      buyPrice: 0,
      sellPrice: 0,
      marketStatus: "OPEN",
    });

  // ========================================================
  // USDT MARKET
  // ========================================================

  const [usdtMarket, setUsdtMarket] =
    useState<USDTMarket>({
      buyPrice: 0,
      sellPrice: 0,
    });

// ========================================================
// TRANSACTIONS
// ========================================================

const [transactions, setTransactions] =
  useState<Transaction[]>([]);

// ========================================================
// LOAD DASHBOARD
// ========================================================

const loadDashboard = useCallback(async () => {
  const session = getSession();

  if (!session?.token) {
    logout();

    throw new Error(
      "Your session has expired. Please sign in again."
    );
  }

  setLoading(true);
  setRefreshing(true);
  setErrorMessage("");

  try {
    // ====================================================
    // COMMON AUTH HEADERS
    // ====================================================

    const headers = {
      Authorization: `Bearer ${session.token}`,
      Accept: "application/json",
    };

    // ====================================================
    // LOAD WALLET
    // GET /api/wallet/balance
    // ====================================================

    const walletResponse = await fetch(
      `${API}/api/wallet/balance`,
      {
        method: "GET",
        headers,
        cache: "no-store",
        credentials: "omit",
      }
    );

    let walletData: any = null;

    try {
      walletData = await walletResponse.json();
    } catch {
      walletData = null;
    }

    // ----------------------------------------------------
    // AUTH ERROR
    // ----------------------------------------------------

    if (walletResponse.status === 401) {
      logout();

      throw new Error(
        "Your session has expired. Please sign in again."
      );
    }

    // ----------------------------------------------------
    // WALLET ERROR
    // ----------------------------------------------------

    if (!walletResponse.ok || !walletData?.success) {
      throw new Error(
        walletData?.message ||
          `Wallet API failed (${walletResponse.status}).`
      );
    }

    // ----------------------------------------------------
    // WALLET DATA
    // ----------------------------------------------------

    setWallet({
      balancePKR: Number(
        walletData.wallet?.pkrBalance ??
          walletData.pkrBalance ??
          0
      ),

      balanceUSD: Number(
        walletData.wallet?.balanceUSD ??
          walletData.balanceUSD ??
          0
      ),

      balanceUSDT: Number(
        walletData.wallet?.usdtBalance ??
          walletData.usdtBalance ??
          0
      ),

      goldBalanceGram: Number(
        walletData.wallet?.goldBalance ??
          walletData.goldBalance ??
          0
      ),
    });

    // ====================================================
    // LOAD WALLET SUMMARY
    // GET /api/wallet/summary
    //
    // OPTIONAL:
    // Summary fail hone par dashboard crash nahi hoga.
    // ====================================================

    try {
      const summaryResponse = await fetch(
        `${API}/api/wallet/summary`,
        {
          method: "GET",
          headers,
          cache: "no-store",
          credentials: "omit",
        }
      );

      let summaryData: any = null;

      try {
        summaryData = await summaryResponse.json();
      } catch {
        summaryData = null;
      }

      if (summaryResponse.status === 401) {
        logout();

        throw new Error(
          "Your session has expired. Please sign in again."
        );
      }

      if (
        summaryResponse.ok &&
        summaryData?.success &&
        summaryData?.summary
      ) {
        const pkrBalance = Number(
          summaryData.summary.pkrBalance ?? 0
        );

        setStats((previous) => ({
          ...previous,
          portfolioValue: pkrBalance,
          liveProfit: Number(
            previous.liveProfit ?? 0
          ),
        }));
      } else {
        console.warn(
          "GoldTrade V18: Wallet Summary unavailable:",
          summaryData?.message ||
            `HTTP ${summaryResponse.status}`
        );
      }
    } catch (summaryError) {
      console.warn(
        "GoldTrade V18: Wallet Summary skipped:",
        summaryError
      );
    }

    // ====================================================
    // GOLD MARKET
    // GET /api/gold/price
    // ====================================================

    try {
      const goldResponse = await fetch(
        `${API}/api/gold/price`,
        {
          method: "GET",
          headers,
          cache: "no-store",
          credentials: "omit",
        }
      );

      let goldData: any = null;

      try {
        goldData = await goldResponse.json();
      } catch {
        goldData = null;
      }

      if (
        goldResponse.ok &&
        goldData?.success
      ) {
        setGoldMarket({
          buyPrice: Number(
            goldData.buyPrice ?? 0
          ),

          sellPrice: Number(
            goldData.sellPrice ?? 0
          ),

          marketStatus:
            goldData.marketStatus === "CLOSED"
              ? "CLOSED"
              : "OPEN",
        });
      } else {
        console.warn(
          "Gold market unavailable:",
          goldData?.message ||
            `HTTP ${goldResponse.status}`
        );
      }
    } catch (goldError) {
      console.warn(
        "Gold market load skipped:",
        goldError
      );
    }

    // ====================================================
    // USDT MARKET
    // GET /api/usdt/price
    // ====================================================

    try {
      const usdtResponse = await fetch(
        `${API}/api/usdt/price`,
        {
          method: "GET",
          headers,
          cache: "no-store",
          credentials: "omit",
        }
      );

      let usdtData: any = null;

      try {
        usdtData = await usdtResponse.json();
      } catch {
        usdtData = null;
      }

      if (
        usdtResponse.ok &&
        usdtData?.success
      ) {
        const market =
          usdtData.market ||
          usdtData;

        setUsdtMarket({
          buyPrice: Number(
            market.buyPrice ?? 0
          ),

          sellPrice: Number(
            market.sellPrice ?? 0
          ),
        });
      } else {
        console.warn(
          "USDT market unavailable:",
          usdtData?.message ||
            `HTTP ${usdtResponse.status}`
        );
      }
    } catch (usdtError) {
      console.warn(
        "USDT market load skipped:",
        usdtError
      );
    }

    // ====================================================
    // TRANSACTIONS
    // GET /api/transactions/history/:username
    // ====================================================

    try {
      const username =
        session.user?.username;

      if (!username) {
        setTransactions([]);
      } else {
        const transactionResponse =
          await fetch(
            `${API}/api/transactions/history/${encodeURIComponent(
              username
            )}`,
            {
              method: "GET",
              headers,
              cache: "no-store",
              credentials: "omit",
            }
          );

        let transactionData: any = null;

        try {
          transactionData =
            await transactionResponse.json();
        } catch {
          transactionData = null;
        }

        if (
          transactionResponse.status === 401
        ) {
          logout();

          throw new Error(
            "Your session has expired. Please sign in again."
          );
        }

        if (
          transactionResponse.ok &&
          transactionData?.success &&
          Array.isArray(
            transactionData.transactions
          )
        ) {
          setTransactions(
            transactionData.transactions
          );
        } else {
          setTransactions([]);

          console.warn(
            "Transactions unavailable:",
            transactionData?.message ||
              `HTTP ${transactionResponse.status}`
          );
        }
      }
    } catch (transactionError) {
      console.warn(
        "Transaction load skipped:",
        transactionError
      );

      setTransactions([]);
    }

    // ====================================================
    // DASHBOARD SYNC SUCCESS
    // ====================================================

    setSuccessMessage(
      "Dashboard synced successfully."
    );
  } catch (error: unknown) {
    console.error(
      "GoldTrade V18 DASHBOARD LOAD ERROR:",
      error
    );

    const message =
      error instanceof Error
        ? error.message
        : "Unable to load dashboard data.";

    setErrorMessage(message);

    throw error;
  } finally {
    setLoading(false);
    setRefreshing(false);
  }
}, []);

// ========================================================
// PAGE TITLE
// ========================================================

useEffect(() => {
  document.title =
    "Dashboard • GoldTrade V18 Enterprise";
}, []);

// ========================================================
// NETWORK STATUS
// ========================================================

useEffect(() => {
  const updateNetworkStatus = () => {
    setIsOnline(window.navigator.onLine);
  };

  updateNetworkStatus();

  window.addEventListener(
    "online",
    updateNetworkStatus
  );

  window.addEventListener(
    "offline",
    updateNetworkStatus
  );

  return () => {
    window.removeEventListener(
      "online",
      updateNetworkStatus
    );

    window.removeEventListener(
      "offline",
      updateNetworkStatus
    );
  };
}, []);

// ========================================================
// AUTO CLEAR ERROR
// ========================================================

useEffect(() => {
  if (!errorMessage) {
    return;
  }

  const timer = window.setTimeout(() => {
    setErrorMessage("");
  }, 4000);

  return () => {
    window.clearTimeout(timer);
  };
}, [errorMessage]);

// ========================================================
// AUTO CLEAR SUCCESS
// ========================================================

useEffect(() => {
  if (!successMessage) {
    return;
  }

  const timer = window.setTimeout(() => {
    setSuccessMessage("");
  }, 2500);

  return () => {
    window.clearTimeout(timer);
  };
}, [successMessage]);

 
// ========================================================
// SESSION CHECK
// IQ1000 FINAL — STABLE / NO LOOP / NO HOOK BREAK
// ========================================================

useEffect(() => {
  let mounted = true;

  const checkSession = async () => {
    try {
      setCheckingSession(true);

      const session = getSession();

      // ====================================================
      // NO SESSION
      // ====================================================

      if (!session?.token) {
        if (mounted) {
          setCheckingSession(false);
          router.replace("/login");
        }

        return;
      }

      // ====================================================
      // USER DASHBOARD ONLY
      // ====================================================

      if (session.user?.role !== "user") {
        if (mounted) {
          setCheckingSession(false);
          router.replace("/admin/dashboard");
        }

        return;
      }

      // ====================================================
      // VERIFY SESSION WITH BACKEND
      // ====================================================

      const response = await fetch(
        `${API}/api/auth/check`,
        {
          method: "GET",

          headers: {
            Authorization: `Bearer ${session.token}`,
            Accept: "application/json",
          },

          cache: "no-store",
          credentials: "omit",
        }
      );

      // ====================================================
      // SAFE JSON
      // ====================================================

      let data: {
        success?: boolean;
        user?: GoldTradeUser;
        message?: string;
      } | null = null;

      try {
        data = await response.json();
      } catch {
        data = null;
      }

      console.log(
        "GoldTrade V18 SESSION CHECK:",
        {
          status: response.status,
          success: data?.success,
        }
      );

      // ====================================================
      // VALID SESSION
      // ====================================================

      if (
        response.ok &&
        data?.success &&
        mounted
      ) {
        setUser(
          data.user ||
            session.user ||
            null
        );

        return;
      }

      // ====================================================
      // INVALID / EXPIRED SESSION
      // ====================================================

      if (mounted) {
        console.warn(
          "GoldTrade V18: Session invalid or expired."
        );

        logout();
        router.replace("/login");
      }
    } catch (error) {
      console.error(
        "GoldTrade V18 SESSION CHECK ERROR:",
        error
      );

      if (mounted) {
        logout();
        router.replace("/login");
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
// INITIAL DASHBOARD LOAD
// ========================================================

useEffect(() => {
  if (checkingSession) {
    return;
  }

  if (!user) {
    return;
  }

  loadDashboard();
}, [
  checkingSession,
  user,
  loadDashboard,
]);


// ========================================================
// AUTO REFRESH — EVERY 30 SECONDS
// ========================================================

useEffect(() => {
  if (checkingSession || !user) {
    return;
  }

  const interval = window.setInterval(() => {
    if (
      document.visibilityState === "visible" &&
      navigator.onLine
    ) {
      loadDashboard();
    }
  }, 30000);

  return () => {
    window.clearInterval(interval);
  };
}, [
  checkingSession,
  user,
  loadDashboard,
]);


// ========================================================
// MANUAL REFRESH
// ========================================================

const refreshDashboard = useCallback(
  async () => {
    if (refreshing) {
      return;
    }

    try {
      setRefreshing(true);
      setErrorMessage("");

      await loadDashboard();

      setSuccessMessage(
        "Dashboard refreshed successfully."
      );
    } catch (error: unknown) {
      console.error(
        "Dashboard Refresh Error:",
        error
      );

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to refresh dashboard."
      );
    } finally {
      setRefreshing(false);
    }
  },
  [
    refreshing,
    loadDashboard,
  ]
);


// ========================================================
// LOGOUT
// ========================================================

const handleLogout = useCallback(() => {
  try {
    logout();
  } finally {
    router.replace("/login");
  }
}, [router]);


// ========================================================
// AUTO REFRESH WHEN USER RETURNS TO TAB
// ========================================================

useEffect(() => {
  if (checkingSession || !user) {
    return;
  }

  const handleVisibilityChange = () => {
    if (
      document.visibilityState === "visible" &&
      navigator.onLine
    ) {
      loadDashboard();
    }
  };

  document.addEventListener(
    "visibilitychange",
    handleVisibilityChange
  );

  return () => {
    document.removeEventListener(
      "visibilitychange",
      handleVisibilityChange
    );
  };
}, [
  checkingSession,
  user,
  loadDashboard,
]);


// ========================================================
// NETWORK RECOVERY
// ========================================================

useEffect(() => {
  if (
    checkingSession ||
    !user ||
    !isOnline
  ) {
    return;
  }

  const timeout = window.setTimeout(() => {
    loadDashboard();
  }, 1500);

  return () => {
    window.clearTimeout(timeout);
  };
}, [
  checkingSession,
  user,
  isOnline,
  loadDashboard,
]);


// ========================================================
// RETRY DASHBOARD
// ========================================================

const retryDashboard = useCallback(
  async () => {
    setErrorMessage("");

    try {
      await loadDashboard();
    } catch (error: unknown) {
      console.error(
        "Dashboard Retry Error:",
        error
      );

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to reload dashboard."
      );
    }
  },
  [loadDashboard]
);

// ========================================================
// SECURE SESSION LOADING SCREEN
// IMPORTANT:
// MUST BE AFTER ALL HOOKS
// ========================================================

if (checkingSession) {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="w-full max-w-md text-center">

        {/* Spinner */}
        <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center">
          <div className="h-14 w-14 rounded-full border-4 border-yellow-500/20 border-t-yellow-400 animate-spin" />
        </div>

        {/* Brand */}
        <h1 className="text-3xl font-bold text-yellow-400">
          GoldTrade V18
        </h1>

        {/* Status */}
        <p className="mt-3 text-sm text-gray-400">
          Checking secure session...
        </p>

        <p className="mt-1 text-xs text-gray-600">
          Please wait
        </p>

      </div>
    </div>
  );
}

const formatCurrency = (value: number): string =>
  Number(value || 0).toLocaleString("en-PK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const formatNumber = (value: number): string =>
  Number(value || 0).toLocaleString("en-PK");

const formatDate = (value: string): string => {
  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? "-"
    : date.toLocaleString();
};

const displayName = user?.email || "Trader";

const isMarketOpen =
  goldMarket.marketStatus === "OPEN";

const marketStatusLabel = isMarketOpen
  ? "Market Open"
  : "Market Closed";

const marketStatusColor = isMarketOpen
  ? "text-green-400"
  : "text-red-400";

const marketStatusBg = isMarketOpen
  ? "border-green-500/30 bg-green-500/5"
  : "border-red-500/30 bg-red-500/5";

const marketStatusBadge = isMarketOpen
  ? "border-green-500/30 bg-green-500/10 text-green-400"
  : "border-red-500/30 bg-red-500/10 text-red-400";

const balanceSummary = {
  totalGoldValue:
    Number(wallet.goldBalanceGram || 0) *
    Number(goldMarket.sellPrice || 0),

  totalAssets:
    Number(wallet.balancePKR || 0) +
    Number(wallet.goldBalanceGram || 0) *
      Number(goldMarket.sellPrice || 0) +
    Number(wallet.balanceUSDT || 0) *
      Number(usdtMarket.sellPrice || 0),
};

const walletHealth =
  balanceSummary.totalAssets > 0
    ? "Healthy"
    : "New";

const marketSummary = {
  goldBuy: goldMarket.buyPrice,
  goldSell: goldMarket.sellPrice,
  usdtBuy: usdtMarket.buyPrice,
  usdtSell: usdtMarket.sellPrice,
  status: goldMarket.marketStatus,
};

const recentTransactions = transactions;

const pendingTransactions = transactions.filter(
  (item) => item?.status === "pending"
);

const approvedTransactions = transactions.filter(
  (item) => item?.status === "approved"
);

const rejectedTransactions = transactions.filter(
  (item) => item?.status === "rejected"
);

/* =====================================================
   TRANSACTION SUMMARY
   SAFE AGAINST MISSING item.type
===================================================== */

const transactionSummary = {
  total: transactions.length,

  deposits: transactions.filter(
    (item) =>
      String(item?.type ?? "")
        .toLowerCase()
        .includes("deposit")
  ).length,

  withdrawals: transactions.filter(
    (item) =>
      String(item?.type ?? "")
        .toLowerCase()
        .includes("withdraw")
  ).length,

  goldTrades: transactions.filter(
    (item) =>
      String(item?.type ?? "")
        .toLowerCase()
        .includes("gold")
  ).length,

  usdtTrades: transactions.filter(
    (item) =>
      String(item?.type ?? "")
        .toLowerCase()
        .includes("usdt")
  ).length,
};

/* =====================================================
   TRANSACTION LABEL
   SAFE AGAINST undefined/null TYPE
===================================================== */

const getTransactionLabel = (
  type?: string | null
): string => {
  const safeType = String(type ?? "");

  if (!safeType.trim()) {
    return "Transaction";
  }

  return safeType
    .replace(/[_-]/g, " ")
    .replace(
      /\b\w/g,
      (letter) => letter.toUpperCase()
    );
};

/* =====================================================
   TRANSACTION COLOR
   SAFE AGAINST undefined/null TYPE
===================================================== */

const getTransactionColor = (
  type?: string | null
): string => {
  const normalized = String(type ?? "")
    .toLowerCase();

  if (normalized.includes("deposit")) {
    return "text-green-400";
  }

  if (normalized.includes("withdraw")) {
    return "text-red-400";
  }

  if (normalized.includes("gold")) {
    return "text-yellow-400";
  }

  if (normalized.includes("usdt")) {
    return "text-cyan-400";
  }

  return "text-white";
};

/* =====================================================
   STATUS COLOR
===================================================== */

const getStatusColor = (
  status: Transaction["status"]
) =>
  status === "approved"
    ? "border-green-500/30 bg-green-500/10 text-green-400"
    : status === "pending"
    ? "border-yellow-500/30 bg-yellow-500/10 text-yellow-400"
    : "border-red-500/30 bg-red-500/10 text-red-400";

/* =====================================================
   DASHBOARD CARDS
===================================================== */

const dashboardCards = [
  {
    title: "PKR Balance",
    value: wallet.balancePKR,
    prefix: "PKR ",
    color: "text-green-400",
    bg: "bg-zinc-950",
    border: "border-green-500/20",
  },

  {
    title: "Gold Balance",
    value: wallet.goldBalanceGram,
    suffix: " g",
    color: "text-yellow-400",
    bg: "bg-zinc-950",
    border: "border-yellow-500/20",
  },

  {
    title: "USDT Balance",
    value: wallet.balanceUSDT,
    suffix: " USDT",
    color: "text-cyan-400",
    bg: "bg-zinc-950",
    border: "border-cyan-500/20",
  },
];

/* =====================================================
   PORTFOLIO SUMMARY
===================================================== */

const portfolioSummary = [
  {
    title: "PKR Wallet",
    value: wallet.balancePKR,
    prefix: "PKR ",
    color: "text-green-400",
  },

  {
    title: "Gold Holdings",
    value: wallet.goldBalanceGram,
    suffix: " g",
    color: "text-yellow-400",
  },

  {
    title: "Gold Value",
    value: balanceSummary.totalGoldValue,
    prefix: "PKR ",
    color: "text-yellow-300",
  },

  {
    title: "USDT",
    value: wallet.balanceUSDT,
    suffix: " USDT",
    color: "text-cyan-400",
  },

  {
    title: "Total Assets",
    value: balanceSummary.totalAssets,
    prefix: "PKR ",
    color: "text-purple-400",
  },
];

/* =====================================================
   QUICK ACTIONS
===================================================== */

const quickActions = [
  {
    title: "Deposit",
    href: "/deposit",
    description: "Add funds to your wallet.",
    color: "border-green-500/20",
  },

  {
    title: "Withdraw",
    href: "/withdraw",
    description: "Withdraw available funds.",
    color: "border-red-500/20",
  },

  {
    title: "Buy Gold",
    href: "/gold/buy",
    description: "Purchase gold at live rates.",
    color: "border-yellow-500/20",
  },

  {
    title: "Buy USDT",
    href: "/usdt/buy",
    description: "Purchase USDT at live rates.",
    color: "border-cyan-500/20",
  },
];

/* =====================================================
   GOLD CARDS
===================================================== */

const goldCards = [
  {
    title: "Buy Price",
    value: goldMarket.buyPrice,
    prefix: "PKR ",
    color: "text-yellow-400",
    border: "border-yellow-500/20",
  },

  {
    title: "Sell Price",
    value: goldMarket.sellPrice,
    prefix: "PKR ",
    color: "text-yellow-300",
    border: "border-yellow-500/20",
  },

  {
    title: "Gold Balance",
    value: wallet.goldBalanceGram,
    suffix: " g",
    color: "text-yellow-400",
    border: "border-yellow-500/20",
  },

  {
    title: "Market Status",
    value: marketStatusLabel,
    isStatus: true,
    color: marketStatusColor,
    border: "border-yellow-500/20",
  },
];

/* =====================================================
   USDT CARDS
===================================================== */

const usdtCards = [
  {
    title: "Buy Rate",
    value: usdtMarket.buyPrice,
    prefix: "PKR ",
    color: "text-cyan-400",
    border: "border-cyan-500/20",
  },

  {
    title: "Sell Rate",
    value: usdtMarket.sellPrice,
    prefix: "PKR ",
    color: "text-cyan-300",
    border: "border-cyan-500/20",
  },

  {
    title: "Wallet Balance",
    value: wallet.balanceUSDT,
    suffix: " USDT",
    color: "text-cyan-400",
    border: "border-cyan-500/20",
  },
];

/* =====================================================
   PERFORMANCE CARDS
===================================================== */

const performanceCards = [
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
    title: "Portfolio Value",
    value: stats.portfolioValue,
    prefix: "PKR ",
    color: "text-yellow-400",
  },

  {
    title: "Live Profit",
    value: stats.liveProfit,
    prefix: "PKR ",
    color: "text-cyan-400",
  },
];

/* =====================================================
   GOLD HOLDING CARDS
===================================================== */

const goldHoldingCards = [
  {
    title: "Gold Balance",
    value: wallet.goldBalanceGram,
    suffix: " g",
    color: "text-yellow-400",
  },

  {
    title: "Buy Price",
    value: goldMarket.buyPrice,
    prefix: "PKR ",
    color: "text-yellow-300",
  },

  {
    title: "Sell Price",
    value: goldMarket.sellPrice,
    prefix: "PKR ",
    color: "text-yellow-300",
  },

  {
    title: "Current Value",
    value: balanceSummary.totalGoldValue,
    prefix: "PKR ",
    color: "text-yellow-400",
  },
];

/* =====================================================
   USDT HOLDING CARDS
===================================================== */

const usdtHoldingCards = [
  {
    title: "USDT Balance",
    value: wallet.balanceUSDT,
    suffix: " USDT",
    color: "text-cyan-400",
  },

  {
    title: "Buy Rate",
    value: usdtMarket.buyPrice,
    prefix: "PKR ",
    color: "text-cyan-300",
  },

  {
    title: "Sell Rate",
    value: usdtMarket.sellPrice,
    prefix: "PKR ",
    color: "text-cyan-300",
  },

  {
    title: "PKR Value",
    value:
      Number(wallet.balanceUSDT || 0) *
      Number(usdtMarket.sellPrice || 0),
    prefix: "PKR ",
    color: "text-cyan-400",
  },
];

// ========================================================
// DASHBOARD HEADER + ALERTS + WALLET SUMMARY UI
// PART 8/12
// IQ1000 FINAL — CLEAN / RESPONSIVE / STABLE
// ========================================================

return (
  <div className="min-h-screen bg-black text-white">

    {/* ==================================================== */}
    {/* TOP HEADER */}
    {/* ==================================================== */}

    <header className="sticky top-0 z-40 border-b border-yellow-500/20 bg-black/90 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">

        {/* Brand / User */}
        <div className="min-w-0">
          <h1 className="truncate text-xl font-bold text-yellow-400 sm:text-2xl">
            GoldTrade V18 Enterprise
          </h1>

          <p className="mt-1 truncate text-sm text-gray-400">
            Welcome, {displayName}
          </p>
        </div>

        {/* Header Actions */}
        <div className="flex shrink-0 items-center gap-2 sm:gap-3">

          {/* Refresh */}
          <button
            type="button"
            onClick={refreshDashboard}
            disabled={refreshing || !isOnline}
            aria-label="Refresh dashboard"
            className="inline-flex items-center justify-center rounded-xl border border-yellow-500/30 bg-yellow-500/5 px-3 py-2 text-sm font-semibold text-yellow-400 transition-all duration-200 hover:border-yellow-400/50 hover:bg-yellow-500/10 disabled:cursor-not-allowed disabled:opacity-50 sm:px-4"
          >
            {refreshing ? (
              <>
                <span
                  className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-yellow-400/30 border-t-yellow-400"
                  aria-hidden="true"
                />
                <span className="hidden sm:inline">
                  Refreshing...
                </span>
                <span className="sm:hidden">
                  ...
                </span>
              </>
            ) : (
              <>
                <span className="hidden sm:inline">
                  Refresh
                </span>
                <span className="sm:hidden">
                  ↻
                </span>
              </>
            )}
          </button>

          {/* Logout */}
          <button
            type="button"
            onClick={handleLogout}
            aria-label="Logout"
            className="rounded-xl bg-red-600 px-3 py-2 text-sm font-semibold text-white transition-all duration-200 hover:bg-red-700 hover:shadow-lg hover:shadow-red-900/20 sm:px-4"
          >
            Logout
          </button>

        </div>
      </div>
    </header>

    {/* ==================================================== */}
    {/* PAGE CONTENT */}
    {/* ==================================================== */}

    <main className="mx-auto w-full max-w-7xl space-y-8 px-4 py-6 sm:px-6 lg:px-8">

      {/* ================================================== */}
      {/* NETWORK STATUS */}
      {/* ================================================== */}

      {!isOnline && (
        <div
          role="alert"
          className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 shadow-lg shadow-red-950/10"
        >
          <div className="flex items-start gap-3">

            <div
              className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-500/10 text-red-400"
              aria-hidden="true"
            >
              !
            </div>

            <div>
              <h3 className="font-semibold text-red-400">
                Internet Connection Lost
              </h3>

              <p className="mt-1 text-sm text-red-200/80">
                Your internet connection is currently offline.
                Dashboard updates will resume automatically when
                the network connection is restored.
              </p>
            </div>

          </div>
        </div>
      )}

      {/* ================================================== */}
      {/* ERROR ALERT */}
      {/* ================================================== */}

      {errorMessage && (
        <div
          role="alert"
          aria-live="assertive"
          className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 shadow-lg shadow-red-950/10"
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

            <div className="min-w-0">
              <div className="flex items-center gap-3">

                <div
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-500/10 font-bold text-red-400"
                  aria-hidden="true"
                >
                  !
                </div>

                <div>
                  <h3 className="font-semibold text-red-400">
                    Dashboard Update Failed
                  </h3>

                  <p className="mt-1 break-words text-sm text-red-200/80">
                    {errorMessage}
                  </p>
                </div>

              </div>
            </div>

            <button
              type="button"
              onClick={retryDashboard}
              disabled={refreshing || !isOnline}
              className="w-full shrink-0 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
            >
              {refreshing ? "Retrying..." : "Retry"}
            </button>

          </div>
        </div>
      )}

      {/* ================================================== */}
      {/* SUCCESS ALERT */}
      {/* ================================================== */}

      {successMessage && (
        <div
          role="status"
          aria-live="polite"
          className="rounded-2xl border border-green-500/30 bg-green-500/10 p-4 text-green-300 shadow-lg shadow-green-950/10"
        >
          <div className="flex items-center gap-3">

            <div
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-500/10 font-bold text-green-400"
              aria-hidden="true"
            >
              ✓
            </div>

            <p className="text-sm font-medium">
              {successMessage}
            </p>

          </div>
        </div>
      )}

      {/* ================================================== */}
      {/* MARKET STATUS */}
      {/* ================================================== */}

      <section
        aria-label="Live market status"
        className={`rounded-3xl border p-5 shadow-xl sm:p-6 ${marketStatusBg}`}
      >
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">

          {/* Market Title */}
          <div>
            <div className="flex items-center gap-3">

              <span
                className={`h-3 w-3 rounded-full ${
                  isMarketOpen
                    ? "animate-pulse bg-green-400"
                    : "bg-red-400"
                }`}
                aria-hidden="true"
              />

              <h2 className="text-xl font-bold text-yellow-400">
                Live Market Status
              </h2>

            </div>

            <p
              className={`mt-2 text-base font-semibold sm:text-lg ${marketStatusColor}`}
            >
              {marketStatusLabel}
            </p>
          </div>

          {/* Market Prices */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-4 sm:gap-6">

            {/* Gold Buy */}
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500">
                Gold Buy
              </p>

              <h3 className="mt-1 text-base font-bold text-yellow-400 sm:text-lg">
                PKR {formatCurrency(goldMarket.buyPrice)}
              </h3>
            </div>

            {/* Gold Sell */}
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500">
                Gold Sell
              </p>

              <h3 className="mt-1 text-base font-bold text-yellow-300 sm:text-lg">
                PKR {formatCurrency(goldMarket.sellPrice)}
              </h3>
            </div>

            {/* USDT Buy */}
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500">
                USDT Buy
              </p>

              <h3 className="mt-1 text-base font-bold text-cyan-400 sm:text-lg">
                PKR {formatCurrency(usdtMarket.buyPrice)}
              </h3>
            </div>

            {/* USDT Sell */}
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500">
                USDT Sell
              </p>

              <h3 className="mt-1 text-base font-bold text-cyan-300 sm:text-lg">
                PKR {formatCurrency(usdtMarket.sellPrice)}
              </h3>
            </div>

          </div>
        </div>
      </section>

      {/* ================================================== */}
      {/* WALLET SUMMARY */}
      {/* ================================================== */}

      <section
        aria-label="Wallet summary"
        className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3"
      >
        {dashboardCards.map((card) => (
          <div
            key={card.title}
            className={`rounded-3xl border p-5 shadow-xl transition-all duration-200 hover:-translate-y-0.5 hover:shadow-2xl sm:p-6 ${card.bg} ${card.border}`}
          >
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500 sm:text-sm">
              {card.title}
            </p>

            <h3
              className={`mt-3 break-words text-2xl font-bold sm:text-3xl ${card.color}`}
            >
              {card.prefix || ""}
              {formatCurrency(card.value)}
              {card.suffix || ""}
            </h3>
          </div>
        ))}
      </section>

      {/* ================================================== */}
      {/* PORTFOLIO SUMMARY */}
      {/* ================================================== */}

      <section className="rounded-3xl border border-gray-800 bg-zinc-950 p-5 shadow-xl sm:p-6">

        <div className="mb-6">
          <h2 className="text-xl font-bold text-yellow-400">
            Portfolio Summary
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Live balances synced with wallet and market.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {portfolioSummary.map((item) => (
            <div
              key={item.title}
              className="rounded-2xl border border-gray-800 bg-black p-4 transition-colors hover:border-gray-700 sm:p-5"
            >
              <p className="text-xs uppercase tracking-wide text-gray-500">
                {item.title}
              </p>

              <h3
                className={`mt-3 break-words text-lg font-bold sm:text-xl ${item.color}`}
              >
                {item.prefix || ""}
                {formatCurrency(item.value)}
                {item.suffix || ""}
              </h3>
            </div>
          ))}
        </div>

      </section>

      {/* ================================================== */}
      {/* QUICK ACTIONS */}
      {/* ================================================== */}

      <section aria-label="Quick actions">

        <div className="mb-6">
          <h2 className="text-xl font-bold text-yellow-400">
            Quick Actions
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Quickly access your most-used GoldTrade features.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {quickActions.map((action) => (
            <Link
              key={action.title}
              href={action.href}
              className={`group rounded-3xl border bg-zinc-950 p-5 transition-all duration-200 hover:-translate-y-0.5 hover:bg-zinc-900 hover:shadow-xl ${action.color}`}
            >
              <h3 className="font-semibold text-white transition-colors group-hover:text-yellow-300">
                {action.title}
              </h3>

              <p className="mt-2 text-sm leading-6 text-gray-400">
                {action.description}
              </p>

              <div className="mt-4 text-xs font-semibold text-gray-600 transition-colors group-hover:text-gray-400">
                Open →
              </div>
            </Link>
          ))}
        </div>

      </section>

      {/* ================================================== */}
      {/* LIVE GOLD MARKET */}
      {/* ================================================== */}

      <section
        aria-label="Gold market"
        className="space-y-5"
      >

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

          <div>
            <h2 className="text-xl font-bold text-yellow-400">
              Gold Market
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Live buy/sell prices synced from backend.
            </p>
          </div>

          <div
            className={`w-fit rounded-full border px-4 py-2 text-xs font-semibold ${marketStatusBadge}`}
          >
            {marketStatusLabel}
          </div>

        </div>

        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {goldCards.map((card) => (
            <div
              key={card.title}
              className={`rounded-3xl border bg-zinc-950 p-5 shadow-lg transition-all duration-200 hover:-translate-y-0.5 sm:p-6 ${card.border}`}
            >
              <p className="text-xs uppercase tracking-wide text-gray-500">
                {card.title}
              </p>

              {card.isStatus ? (
                <h3
                  className={`mt-4 text-2xl font-bold ${card.color}`}
                >
                  {card.value}
                </h3>
              ) : (
                <h3
                  className={`mt-4 break-words text-2xl font-bold sm:text-3xl ${card.color}`}
                >
                  {card.prefix || ""}
                  {formatCurrency(Number(card.value))}
                </h3>
              )}
            </div>
          ))}
        </div>

      </section>

      {/* ================================================== */}
      {/* LIVE USDT MARKET */}
      {/* ================================================== */}

      <section
        aria-label="USDT market"
        className="space-y-5"
      >

        <div>
          <h2 className="text-xl font-bold text-cyan-400">
            USDT Market
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Live PKR ↔ USDT exchange rates.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {usdtCards.map((card) => (
            <div
              key={card.title}
              className={`rounded-3xl border bg-zinc-950 p-5 shadow-lg transition-all duration-200 hover:-translate-y-0.5 sm:p-6 ${card.border}`}
            >
              <p className="text-xs uppercase tracking-wide text-gray-500">
                {card.title}
              </p>

              <h3
                className={`mt-4 break-words text-2xl font-bold sm:text-3xl ${card.color}`}
              >
                {card.prefix || ""}
                {formatCurrency(card.value)}
              </h3>
            </div>
          ))}
        </div>

      </section>

      {/* ================================================== */}
      {/* PERFORMANCE OVERVIEW */}
      {/* ================================================== */}

      <section className="rounded-3xl border border-gray-800 bg-zinc-950 p-5 shadow-xl sm:p-6">

        <div className="mb-6">
          <h2 className="text-xl font-bold text-green-400">
            Portfolio Performance
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Live wallet health, assets and investment summary.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {performanceCards.map((card) => (
            <div
              key={card.title}
              className="rounded-2xl border border-gray-800 bg-black p-5 transition-colors hover:border-gray-700"
            >
              <p className="text-xs uppercase tracking-wide text-gray-500">
                {card.title}
              </p>

              <h3
                className={`mt-4 break-words text-2xl font-bold ${card.color}`}
              >
                {card.prefix || ""}
                {formatCurrency(card.value)}
              </h3>
            </div>
          ))}
        </div>

      </section>

      {/* ================================================== */}
      {/* GOLD HOLDINGS */}
      {/* ================================================== */}

      <section className="rounded-3xl border border-yellow-500/20 bg-yellow-500/5 p-5 shadow-xl sm:p-6">

        <div className="mb-6">
          <h2 className="text-xl font-bold text-yellow-400">
            Gold Holdings
          </h2>

          <p className="mt-1 text-sm text-yellow-100/60">
            Your current gold investment and live valuation.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {goldHoldingCards.map((card) => (
            <div
              key={card.title}
              className="rounded-2xl border border-yellow-500/20 bg-black/40 p-5"
            >
              <p className="text-xs uppercase tracking-wide text-gray-500">
                {card.title}
              </p>

              <h3
                className={`mt-3 break-words text-xl font-bold sm:text-2xl ${card.color}`}
              >
                {card.prefix || ""}
                {formatCurrency(card.value)}
                {card.suffix || ""}
              </h3>
            </div>
          ))}
        </div>

      </section>

      {/* ================================================== */}
      {/* USDT HOLDINGS */}
      {/* ================================================== */}

      <section className="rounded-3xl border border-cyan-500/20 bg-cyan-500/5 p-5 shadow-xl sm:p-6">

        <div className="mb-6">
          <h2 className="text-xl font-bold text-cyan-400">
            USDT Holdings
          </h2>

          <p className="mt-1 text-sm text-cyan-100/60">
            Live USDT wallet balance and PKR valuation.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {usdtHoldingCards.map((card) => (
            <div
              key={card.title}
              className="rounded-2xl border border-cyan-500/20 bg-black/40 p-5"
            >
              <p className="text-xs uppercase tracking-wide text-gray-500">
                {card.title}
              </p>

              <h3
                className={`mt-3 break-words text-xl font-bold sm:text-2xl ${card.color}`}
              >
                {card.prefix || ""}
                {formatCurrency(card.value)}
                {card.suffix || ""}
              </h3>
            </div>
          ))}
        </div>

      </section>

      {/* ================================================== */}
      {/* MARKET QUICK SUMMARY */}
      {/* ================================================== */}

      <section className="rounded-3xl border border-blue-500/20 bg-blue-500/5 p-5 shadow-xl sm:p-6">

        <div className="mb-6">
          <h2 className="text-xl font-bold text-blue-400">
            Live Trading Summary
          </h2>

          <p className="mt-1 text-sm text-blue-100/60">
            Current market overview for Gold and USDT trading.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-5">

          {/* Gold Buy */}
          <div className="rounded-2xl border border-blue-500/20 bg-black p-5">
            <p className="text-xs uppercase tracking-wide text-gray-500">
              Gold Buy
            </p>

            <h3 className="mt-3 text-xl font-bold text-yellow-400 sm:text-2xl">
              PKR {formatCurrency(marketSummary.goldBuy)}
            </h3>
          </div>

          {/* Gold Sell */}
          <div className="rounded-2xl border border-blue-500/20 bg-black p-5">
            <p className="text-xs uppercase tracking-wide text-gray-500">
              Gold Sell
            </p>

            <h3 className="mt-3 text-xl font-bold text-yellow-300 sm:text-2xl">
              PKR {formatCurrency(marketSummary.goldSell)}
            </h3>
          </div>

          {/* USDT Buy */}
          <div className="rounded-2xl border border-blue-500/20 bg-black p-5">
            <p className="text-xs uppercase tracking-wide text-gray-500">
              USDT Buy
            </p>

            <h3 className="mt-3 text-xl font-bold text-cyan-400 sm:text-2xl">
              PKR {formatCurrency(marketSummary.usdtBuy)}
            </h3>
          </div>

          {/* USDT Sell */}
          <div className="rounded-2xl border border-blue-500/20 bg-black p-5">
            <p className="text-xs uppercase tracking-wide text-gray-500">
              USDT Sell
            </p>

            <h3 className="mt-3 text-xl font-bold text-cyan-300 sm:text-2xl">
              PKR {formatCurrency(marketSummary.usdtSell)}
            </h3>
          </div>

          {/* Trading Status */}
          <div className="rounded-2xl border border-blue-500/20 bg-black p-5">
            <p className="text-xs uppercase tracking-wide text-gray-500">
              Trading Status
            </p>

            <h3
              className={`mt-3 text-xl font-bold sm:text-2xl ${marketStatusColor}`}
            >
              {marketSummary.status}
            </h3>
          </div>

        </div>
      </section>


<section
  aria-label="Transaction overview"
  className="rounded-3xl border border-gray-800 bg-zinc-950 p-5 shadow-xl sm:p-6"
>
  {/* ==================================================== */}
  {/* SECTION HEADER */}
  {/* ==================================================== */}

  <div className="mb-6">
    <h2 className="text-xl font-bold text-white">
      Transaction Overview
    </h2>

    <p className="mt-1 text-sm text-gray-500">
      Summary of your GoldTrade account activity.
    </p>
  </div>

  {/* ==================================================== */}
  {/* TRANSACTION STATS */}
  {/* ==================================================== */}

  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
    {[
      {
        title: "Total Transactions",
        value: transactionSummary.total,
        color: "text-white",
        border: "border-gray-800",
        bg: "bg-black",
      },
      {
        title: "Deposits",
        value: transactionSummary.deposits,
        color: "text-green-400",
        border: "border-green-500/20",
        bg: "bg-green-500/5",
      },
      {
        title: "Withdrawals",
        value: transactionSummary.withdrawals,
        color: "text-red-400",
        border: "border-red-500/20",
        bg: "bg-red-500/5",
      },
      {
        title: "Gold Trades",
        value: transactionSummary.goldTrades,
        color: "text-yellow-400",
        border: "border-yellow-500/20",
        bg: "bg-yellow-500/5",
      },
      {
        title: "USDT Trades",
        value: transactionSummary.usdtTrades,
        color: "text-cyan-400",
        border: "border-cyan-500/20",
        bg: "bg-cyan-500/5",
      },
    ].map((item) => (
      <div
        key={item.title}
        className={`rounded-2xl border p-5 transition-all duration-200 hover:-translate-y-0.5 ${item.border} ${item.bg}`}
      >
        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
          {item.title}
        </p>

        <h3
          className={`mt-3 text-3xl font-bold ${item.color}`}
        >
          {formatNumber(item.value)}
        </h3>
      </div>
    ))}
  </div>
</section>


{/* ======================================================== */}
{/* RECENT TRANSACTIONS */}
{/* ======================================================== */}

<section
  aria-label="Recent transactions"
  className="rounded-3xl border border-gray-800 bg-zinc-950 p-5 shadow-xl sm:p-6"
>
  {/* ==================================================== */}
  {/* HEADER */}
  {/* ==================================================== */}

  <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
    <div>
      <h2 className="text-xl font-bold text-white">
        Recent Transactions
      </h2>

      <p className="mt-1 text-sm text-gray-500">
        Latest deposits, withdrawals, Gold and USDT trades.
      </p>
    </div>

    <Link
      href="/transactions"
      className="inline-flex w-fit items-center justify-center rounded-xl border border-yellow-500/30 bg-yellow-500/5 px-4 py-2.5 text-sm font-semibold text-yellow-400 transition-all duration-200 hover:border-yellow-400/50 hover:bg-yellow-500/10"
    >
      View All
      <span className="ml-2" aria-hidden="true">
        →
      </span>
    </Link>
  </div>


  {/* ==================================================== */}
  {/* LOADING STATE */}
  {/* ==================================================== */}

  {loading && (
    <div
      className="space-y-3"
      aria-label="Loading transactions"
      aria-busy="true"
    >
      {Array.from({ length: 5 }).map((_, index) => (
        <div
          key={index}
          className="animate-pulse rounded-2xl border border-gray-800 bg-black p-5"
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

            <div className="space-y-3">
              <div className="h-4 w-28 rounded bg-gray-800" />
              <div className="h-3 w-44 rounded bg-gray-800" />
            </div>

            <div className="h-8 w-24 rounded bg-gray-800" />

          </div>
        </div>
      ))}
    </div>
  )}


  {/* ==================================================== */}
  {/* EMPTY STATE */}
  {/* ==================================================== */}

  {!loading && recentTransactions.length === 0 && (
    <div className="rounded-2xl border border-dashed border-gray-700 bg-black/40 px-5 py-12 text-center">

      <div
        className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-900 text-3xl"
        aria-hidden="true"
      >
        📄
      </div>

      <h3 className="text-lg font-semibold text-gray-300">
        No Transactions Found
      </h3>

      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500">
        Your recent deposits, withdrawals and trades
        will appear here.
      </p>

      <Link
        href="/deposit"
        className="mt-5 inline-flex rounded-xl border border-green-500/30 bg-green-500/5 px-4 py-2 text-sm font-semibold text-green-400 transition hover:bg-green-500/10"
      >
        Make a Deposit
      </Link>
    </div>
  )}


  {/* ==================================================== */}
  {/* TRANSACTION TABLE */}
  {/* ==================================================== */}

  {!loading && recentTransactions.length > 0 && (
    <div className="overflow-hidden rounded-2xl border border-gray-800">

      {/* Horizontal scroll for mobile */}
      <div className="overflow-x-auto">
        <table className="min-w-[760px] w-full text-sm">

          {/* TABLE HEADER */}
          <thead className="border-b border-gray-800 bg-black">
            <tr>
              <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                Type
              </th>

              <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                Amount
              </th>

              <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                Currency
              </th>

              <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                Status
              </th>

              <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                Date
              </th>
            </tr>
          </thead>


          {/* TABLE BODY */}
          <tbody className="divide-y divide-gray-800">

            {recentTransactions.map((transaction) => {
              const transactionColor =
                getTransactionColor(transaction.type);

              const transactionLabel =
                getTransactionLabel(transaction.type);

              const statusColor =
                getStatusColor(transaction.status);

              return (
                <tr
                  key={transaction._id}
                  className="transition-colors hover:bg-white/[0.03]"
                >

                  {/* TYPE */}
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">

                      <span
                        className={`h-2.5 w-2.5 shrink-0 rounded-full ${transactionColor
                          .replace("text-green-400", "bg-green-400")
                          .replace("text-red-400", "bg-red-400")
                          .replace("text-yellow-400", "bg-yellow-400")
                          .replace("text-cyan-400", "bg-cyan-400")
                          .replace("text-white", "bg-white")}`}
                        aria-hidden="true"
                      />

                      <span
                        className={`font-semibold ${transactionColor}`}
                      >
                        {transactionLabel}
                      </span>

                    </div>
                  </td>


                  {/* AMOUNT */}
                  <td className="px-5 py-4 font-semibold text-white">
                    {formatCurrency(transaction.amount)}
                  </td>


                  {/* CURRENCY */}
                  <td className="px-5 py-4 uppercase text-gray-300">
                    {transaction.currency || "-"}
                  </td>


                  {/* STATUS */}
                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${statusColor}`}
                    >
                      {transaction.status.toUpperCase()}
                    </span>
                  </td>


                  {/* DATE */}
                  <td className="whitespace-nowrap px-5 py-4 text-gray-400">
                    {formatDate(transaction.createdAt)}
                  </td>

                </tr>
              );
            })}

          </tbody>
        </table>
      </div>
    </div>
  )}
</section>


{/* ======================================================== */}
{/* TRANSACTION STATUS SUMMARY */}
{/* ======================================================== */}

<section
  aria-label="Transaction status summary"
  className="grid gap-5 md:grid-cols-3"
>

  {/* ==================================================== */}
  {/* PENDING */}
  {/* ==================================================== */}

  <div className="rounded-3xl border border-yellow-500/20 bg-yellow-500/5 p-5 shadow-lg sm:p-6">

    <div className="flex items-start justify-between gap-4">

      <div>
        <h3 className="text-lg font-bold text-yellow-400">
          Pending Transactions
        </h3>

        <p className="mt-1 text-sm text-yellow-100/60">
          Waiting for approval.
        </p>
      </div>

      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-yellow-500/10 text-yellow-400"
        aria-hidden="true"
      >
        ⏳
      </div>

    </div>

    <h2 className="mt-6 text-4xl font-bold text-yellow-300">
      {formatNumber(pendingTransactions.length)}
    </h2>

  </div>


  {/* ==================================================== */}
  {/* APPROVED */}
  {/* ==================================================== */}

  <div className="rounded-3xl border border-green-500/20 bg-green-500/5 p-5 shadow-lg sm:p-6">

    <div className="flex items-start justify-between gap-4">

      <div>
        <h3 className="text-lg font-bold text-green-400">
          Approved Transactions
        </h3>

        <p className="mt-1 text-sm text-green-100/60">
          Successfully completed.
        </p>
      </div>

      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green-500/10 text-green-400"
        aria-hidden="true"
      >
        ✓
      </div>

    </div>

    <h2 className="mt-6 text-4xl font-bold text-green-300">
      {formatNumber(approvedTransactions.length)}
    </h2>

  </div>


  {/* ==================================================== */}
  {/* REJECTED */}
  {/* ==================================================== */}

  <div className="rounded-3xl border border-red-500/20 bg-red-500/5 p-5 shadow-lg sm:p-6">

    <div className="flex items-start justify-between gap-4">

      <div>
        <h3 className="text-lg font-bold text-red-400">
          Rejected Transactions
        </h3>

        <p className="mt-1 text-sm text-red-100/60">
          Failed or rejected requests.
        </p>
      </div>

      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-500/10 text-red-400"
        aria-hidden="true"
      >
        ×
      </div>

    </div>

    <h2 className="mt-6 text-4xl font-bold text-red-300">
      {formatNumber(rejectedTransactions.length)}
    </h2>

  </div>

</section>


{/* ================================================= */}
{/* WALLET ACTIVITY TIMELINE */}
{/* ================================================= */}

<section
  aria-label="Wallet activity timeline"
  className="rounded-3xl border border-gray-800 bg-zinc-950 p-5 shadow-xl sm:p-6"
>
  <div className="mb-6">
    <h2 className="text-xl font-bold text-white">
      Wallet Activity Timeline
    </h2>

    <p className="mt-1 text-sm text-gray-500">
      Latest wallet deposits, withdrawals, Gold and USDT trades.
    </p>
  </div>

  {recentTransactions.length === 0 ? (
    <div className="rounded-2xl border border-dashed border-gray-700 bg-black/40 px-5 py-10 text-center">
      <div
        className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gray-900 text-2xl"
        aria-hidden="true"
      >
        📊
      </div>

      <h3 className="text-lg font-semibold text-gray-300">
        No Wallet Activity
      </h3>

      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500">
        Your wallet deposits, withdrawals and trading activity
        will appear here.
      </p>
    </div>
  ) : (
    <div className="space-y-4">
      {recentTransactions.slice(0, 6).map((item) => {
        const statusDot =
          item.status === "approved"
            ? "bg-green-500"
            : item.status === "pending"
            ? "bg-yellow-500"
            : "bg-red-500";

        return (
          <div
            key={item._id}
            className="rounded-2xl border border-gray-800 bg-black p-4 transition-colors duration-200 hover:border-gray-700 sm:p-5"
          >
            <div className="flex items-start gap-4">
              {/* STATUS DOT */}
              <div className="mt-1.5 shrink-0">
                <span
                  className={`block h-3.5 w-3.5 rounded-full ${statusDot}`}
                  aria-hidden="true"
                />
              </div>

              {/* CONTENT */}
              <div className="min-w-0 flex-1">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div className="min-w-0">
                    <h3
                      className={`truncate font-semibold ${getTransactionColor(
                        item.type
                      )}`}
                    >
                      {getTransactionLabel(item.type)}
                    </h3>
                  </div>

                  <span
                    className={`inline-flex w-fit shrink-0 rounded-full border px-3 py-1 text-xs font-semibold ${getStatusColor(
                      item.status
                    )}`}
                  >
                    {item.status.toUpperCase()}
                  </span>
                </div>

                <div className="mt-3 grid gap-2 text-sm sm:grid-cols-3 sm:gap-4">
                  <div>
                    <span className="text-gray-500">
                      Amount
                    </span>

                    <p className="mt-1 font-semibold text-white">
                      {formatCurrency(item.amount)}
                    </p>
                  </div>

                  <div>
                    <span className="text-gray-500">
                      Currency
                    </span>

                    <p className="mt-1 font-semibold uppercase text-white">
                      {item.currency || "-"}
                    </p>
                  </div>

                  <div>
                    <span className="text-gray-500">
                      Date
                    </span>

                    <p className="mt-1 text-gray-300">
                      {formatDate(item.createdAt)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  )}
</section>

{/* ================================================= */}
{/* QUICK TRADING PANELS */}
{/* ================================================= */}

<section
  aria-label="Quick trading"
  className="grid gap-6 xl:grid-cols-2"
>
  {/* GOLD TRADING */}

  <div className="rounded-3xl border border-yellow-500/20 bg-yellow-500/5 p-5 shadow-xl sm:p-6">
    <div className="mb-5">
      <h2 className="text-xl font-bold text-yellow-400">
        Gold Trading
      </h2>

      <p className="mt-1 text-sm text-yellow-100/60">
        Buy and sell Gold using the current market prices.
      </p>
    </div>

    <div className="space-y-4">
      <div className="rounded-2xl border border-yellow-500/20 bg-black p-4">
        <p className="text-xs uppercase tracking-wide text-gray-500">
          Current Buy Price
        </p>

        <h3 className="mt-2 text-2xl font-bold text-yellow-400 sm:text-3xl">
          PKR {formatCurrency(goldMarket.buyPrice)}
        </h3>
      </div>

      <div className="rounded-2xl border border-yellow-500/20 bg-black p-4">
        <p className="text-xs uppercase tracking-wide text-gray-500">
          Current Sell Price
        </p>

        <h3 className="mt-2 text-2xl font-bold text-yellow-300 sm:text-3xl">
          PKR {formatCurrency(goldMarket.sellPrice)}
        </h3>
      </div>

      <div className="grid grid-cols-1 gap-3 pt-1 sm:grid-cols-2">
        <Link
          href="/gold/buy"
          className="rounded-2xl bg-yellow-500 px-5 py-3 text-center font-bold text-black transition-all duration-200 hover:bg-yellow-400 active:scale-[0.98]"
        >
          Buy Gold
        </Link>

        <Link
          href="/gold/sell"
          className="rounded-2xl border border-yellow-500 px-5 py-3 text-center font-bold text-yellow-400 transition-all duration-200 hover:bg-yellow-500/10 active:scale-[0.98]"
        >
          Sell Gold
        </Link>
      </div>
    </div>
  </div>

  {/* USDT TRADING */}

  <div className="rounded-3xl border border-cyan-500/20 bg-cyan-500/5 p-5 shadow-xl sm:p-6">
    <div className="mb-5">
      <h2 className="text-xl font-bold text-cyan-400">
        USDT Trading
      </h2>

      <p className="mt-1 text-sm text-cyan-100/60">
        Buy and sell USDT using your PKR wallet.
      </p>
    </div>

    <div className="space-y-4">
      <div className="rounded-2xl border border-cyan-500/20 bg-black p-4">
        <p className="text-xs uppercase tracking-wide text-gray-500">
          Buy Rate
        </p>

        <h3 className="mt-2 text-2xl font-bold text-cyan-400 sm:text-3xl">
          PKR {formatCurrency(usdtMarket.buyPrice)}
        </h3>
      </div>

      <div className="rounded-2xl border border-cyan-500/20 bg-black p-4">
        <p className="text-xs uppercase tracking-wide text-gray-500">
          Sell Rate
        </p>

        <h3 className="mt-2 text-2xl font-bold text-cyan-300 sm:text-3xl">
          PKR {formatCurrency(usdtMarket.sellPrice)}
        </h3>
      </div>

      <div className="grid grid-cols-1 gap-3 pt-1 sm:grid-cols-2">
        <Link
          href="/usdt/buy"
          className="rounded-2xl bg-cyan-500 px-5 py-3 text-center font-bold text-black transition-all duration-200 hover:bg-cyan-400 active:scale-[0.98]"
        >
          Buy USDT
        </Link>

        <Link
          href="/usdt/sell"
          className="rounded-2xl border border-cyan-500 px-5 py-3 text-center font-bold text-cyan-400 transition-all duration-200 hover:bg-cyan-500/10 active:scale-[0.98]"
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

<section
  aria-label="Deposit and withdrawal shortcuts"
  className="grid gap-6 lg:grid-cols-2"
>
  {/* DEPOSIT */}

  <div className="rounded-3xl border border-green-500/20 bg-green-500/5 p-5 shadow-xl sm:p-6">
    <div>
      <h2 className="text-xl font-bold text-green-400">
        Deposit Funds
      </h2>

      <p className="mt-2 text-sm leading-6 text-green-100/60">
        Deposit PKR or supported crypto and increase your
        GoldTrade wallet balance.
      </p>
    </div>

    <div className="mt-6 space-y-3 text-sm text-gray-300">
      <p>• PKR Bank Deposit</p>
      <p>• USDT (TRC20 / BEP20)</p>
      <p>• Wallet balance updates after approval</p>
    </div>

    <Link
      href="/deposit"
      className="mt-8 block rounded-2xl bg-green-600 px-5 py-3 text-center font-bold text-white transition-all duration-200 hover:bg-green-500 active:scale-[0.98]"
    >
      Open Deposit Page
    </Link>
  </div>

  {/* WITHDRAW */}

  <div className="rounded-3xl border border-red-500/20 bg-red-500/5 p-5 shadow-xl sm:p-6">
    <div>
      <h2 className="text-xl font-bold text-red-400">
        Withdraw Funds
      </h2>

      <p className="mt-2 text-sm leading-6 text-red-100/60">
        Withdraw PKR or supported crypto securely from your
        wallet.
      </p>
    </div>

    <div className="mt-6 space-y-3 text-sm text-gray-300">
      <p>• PKR Bank Withdrawal</p>
      <p>• USDT Wallet Withdrawal</p>
      <p>• Secure approval by GoldTrade Admin</p>
    </div>

    <Link
      href="/withdraw"
      className="mt-8 block rounded-2xl bg-red-600 px-5 py-3 text-center font-bold text-white transition-all duration-200 hover:bg-red-500 active:scale-[0.98]"
    >
      Open Withdraw Page
    </Link>
  </div>
</section>

{/* ================================================= */}
{/* PORTFOLIO INSIGHTS */}
{/* ================================================= */}

<section
  aria-label="Portfolio insights"
  className="rounded-3xl border border-purple-500/20 bg-purple-500/5 p-5 shadow-xl sm:p-6"
>
  <div className="mb-6">
    <h2 className="text-xl font-bold text-purple-400">
      Portfolio Insights
    </h2>

    <p className="mt-1 text-sm text-purple-100/60">
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
        PKR{" "}
        {formatCurrency(
          Number(wallet.balanceUSDT || 0) *
            Number(usdtMarket.sellPrice || 0)
        )}
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
</section>

{/* ================================================= */}
{/* SECURITY CENTER */}
{/* ================================================= */}

<section
  aria-label="Security center"
  className="rounded-3xl border border-emerald-500/20 bg-emerald-500/5 p-5 shadow-xl sm:p-6"
>
  <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
    <div>
      <h2 className="text-xl font-bold text-emerald-400">
        GoldTrade Security Center
      </h2>

      <p className="mt-1 text-sm text-emerald-100/60">
        Your account security and session protection status.
      </p>
    </div>

    <div className="w-fit rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-xs font-bold text-emerald-300">
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

<section
  aria-label="Live system status"
  className="grid gap-6 lg:grid-cols-3"
>
  {/* NETWORK */}

  <div className="rounded-3xl border border-green-500/20 bg-green-500/5 p-5 shadow-xl sm:p-6">
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

    <p className="mt-2 text-sm leading-6 text-gray-400">
      Dashboard automatically reconnects when internet
      connectivity returns.
    </p>
  </div>

  {/* MARKET */}

  <div className="rounded-3xl border border-yellow-500/20 bg-yellow-500/5 p-5 shadow-xl sm:p-6">
    <p className="text-xs uppercase tracking-wide text-gray-500">
      Market Status
    </p>

    <h3
      className={`mt-3 text-3xl font-bold ${marketStatusColor}`}
    >
      {goldMarket.marketStatus || "UNKNOWN"}
    </h3>

    <p className="mt-2 text-sm leading-6 text-gray-400">
      Gold and USDT trading availability.
    </p>
  </div>

  {/* WALLET */}

  <div className="rounded-3xl border border-cyan-500/20 bg-cyan-500/5 p-5 shadow-xl sm:p-6">
    <p className="text-xs uppercase tracking-wide text-gray-500">
      Wallet Health
    </p>

    <h3 className="mt-3 text-3xl font-bold text-cyan-400">
      {walletHealth}
    </h3>

    <p className="mt-2 text-sm leading-6 text-gray-400">
      Based on your current portfolio balance.
    </p>
  </div>
</section>

{/* ================================================= */}
{/* WALLET PROTECTION */}
{/* ================================================= */}

<section
  aria-label="Wallet protection"
  className="rounded-3xl border border-indigo-500/20 bg-indigo-500/5 p-5 shadow-xl sm:p-6"
>
  <div className="mb-6">
    <h2 className="text-xl font-bold text-indigo-400">
      Wallet Protection
    </h2>

    <p className="mt-1 text-sm text-indigo-100/60">
      Security controls used to protect wallet operations.
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
        <div className="flex items-start gap-3">
          <span
            className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-500/10 text-xs text-indigo-400"
            aria-hidden="true"
          >
            ✓
          </span>

          <p className="text-sm leading-6 text-indigo-200">
            {item}
          </p>
        </div>
      </div>
    ))}
  </div>
</section>

{/* ================================================= */}
{/* HELP CENTER */}
{/* ================================================= */}

<section
  aria-label="GoldTrade Help Center"
  className="rounded-3xl border border-gray-800 bg-zinc-950 p-5 shadow-xl sm:p-6"
>
  <div className="mb-6">
    <h2 className="text-xl font-bold text-white">
      GoldTrade Help Center
    </h2>

    <p className="mt-1 text-sm leading-6 text-gray-500">
      Quickly navigate to important account features.
    </p>
  </div>

  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
    {[
      {
        title: "Wallet",
        href: "/wallet",
        description: "View your wallet balances and assets.",
      },
      {
        title: "Deposit History",
        href: "/deposit/history",
        description: "Review your previous deposits.",
      },
      {
        title: "Withdraw History",
        href: "/withdraw/history",
        description: "Review your withdrawal activity.",
      },
      {
        title: "Transaction History",
        href: "/transactions",
        description: "View your complete transaction history.",
      },
      {
        title: "Gold Portfolio",
        href: "/gold/portfolio",
        description: "View your Gold holdings and portfolio.",
      },
      {
        title: "USDT Portfolio",
        href: "/usdt/portfolio",
        description: "View your USDT balance and portfolio.",
      },
      {
        title: "Profile Settings",
        href: "/profile",
        description: "Manage your account profile.",
      },
      {
        title: "Support Center",
        href: "/support",
        description: "Get help with your GoldTrade account.",
      },
    ].map((item) => (
      <Link
        key={item.title}
        href={item.href}
        className="group rounded-2xl border border-gray-800 bg-black p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-yellow-500/40 hover:bg-zinc-900"
      >
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-semibold text-yellow-400 transition-colors group-hover:text-yellow-300">
            {item.title}
          </h3>

          <span
            className="text-gray-600 transition-colors group-hover:text-yellow-400"
            aria-hidden="true"
          >
            →
          </span>
        </div>

        <p className="mt-2 text-sm leading-6 text-gray-500">
          {item.description}
        </p>

        <p className="mt-4 text-xs font-medium text-gray-600 transition-colors group-hover:text-gray-400">
          Open {item.title}
        </p>
      </Link>
    ))}
  </div>
</section>

{/* ================================================= */}
{/* ENTERPRISE FOOTER */}
{/* ================================================= */}

<section
  aria-label="GoldTrade Enterprise footer"
  className="rounded-3xl border border-yellow-500/20 bg-gradient-to-r from-yellow-500/10 via-black to-yellow-500/10 p-5 shadow-xl sm:p-6"
>
  <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
    {/* BRAND / PLATFORM INFO */}

    <div className="min-w-0">
      <h2 className="text-2xl font-bold text-yellow-400 sm:text-3xl">
        GoldTrade  Enterprise
      </h2>

      <p className="mt-2 text-sm leading-6 text-gray-400 sm:text-base">
        Enterprise Trading Platform •
      </p>

      <p className="mt-1 max-w-2xl text-xs leading-6 text-gray-500 sm:text-sm">
        Secure JWT Authentication • Live Gold • Live USDT • Portfolio Sync
      </p>
    </div>

    {/* FOOTER STATS */}

    <div className="grid w-full grid-cols-2 gap-4 sm:gap-5 lg:w-auto lg:min-w-[420px]">
      {/* WALLET BALANCE */}

      <div className="rounded-2xl border border-gray-800 bg-black/60 p-4 text-center">
        <p className="text-[11px] uppercase tracking-wide text-gray-500 sm:text-xs">
          Wallet Balance
        </p>

        <h3 className="mt-2 text-lg font-bold text-green-400 sm:text-xl">
          PKR {formatCurrency(Number(wallet.balancePKR || 0))}
        </h3>
      </div>

      {/* PORTFOLIO VALUE */}

      <div className="rounded-2xl border border-gray-800 bg-black/60 p-4 text-center">
        <p className="text-[11px] uppercase tracking-wide text-gray-500 sm:text-xs">
          Portfolio Value
        </p>

        <h3 className="mt-2 text-lg font-bold text-yellow-400 sm:text-xl">
          PKR {formatCurrency(Number(stats.portfolioValue || 0))}
        </h3>
      </div>

      {/* LIVE PROFIT */}

      <div className="rounded-2xl border border-gray-800 bg-black/60 p-4 text-center">
        <p className="text-[11px] uppercase tracking-wide text-gray-500 sm:text-xs">
          Live Profit
        </p>

        <h3
          className={`mt-2 text-lg font-bold sm:text-xl ${
            Number(stats.liveProfit || 0) >= 0
              ? "text-green-400"
              : "text-red-400"
          }`}
        >
          PKR {formatCurrency(Number(stats.liveProfit || 0))}
        </h3>
      </div>

      {/* TRADING STATUS */}

      <div className="rounded-2xl border border-gray-800 bg-black/60 p-4 text-center">
        <p className="text-[11px] uppercase tracking-wide text-gray-500 sm:text-xs">
          Trading Status
        </p>

        <h3
          className={`mt-2 text-lg font-bold sm:text-xl ${
            goldMarket.marketStatus === "OPEN"
              ? "text-green-400"
              : "text-red-400"
          }`}
        >
          {goldMarket.marketStatus || "UNKNOWN"}
        </h3>
      </div>
    </div>
  </div>

  {/* FOOTER BOTTOM */}

  <div className="mt-8 border-t border-yellow-500/20 pt-6">
    <div className="flex flex-col gap-3 text-center text-xs text-gray-500 sm:flex-row sm:items-center sm:justify-between sm:text-sm">
      <p>
        © 2026 GoldTrade V18 Enterprise — All Rights Reserved.
      </p>

      <p className="text-gray-600">
        Secure Trading • Wallet • Gold • USDT
      </p>
    </div>
  </div>
</section>

{/* ================================================= */}
{/* END OF DASHBOARD CONTENT */}
{/* ================================================= */}

    </main>
  </div>
);
}

