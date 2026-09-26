"use client";

// ==========================================================
// GoldTrade V18 Enterprise Wallet
// PART 1/12
// Production Build (Next.js 15 + TypeScript + Linux Safe)
// ==========================================================

import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
} from "react";

import { useRouter } from "next/navigation";

import {
  Wallet,
  ArrowDownCircle,
  ArrowUpCircle,
  RefreshCw,
  TrendingUp,
  DollarSign,
  Coins,
  CreditCard,
  History,
  Receipt,
  ShieldCheck,
  Landmark,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Search,
  Filter,
  Clock,
  ChevronRight,
} from "lucide-react";

// ==========================================================
// API URL
// ==========================================================

const API =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ||
  "https://goldtrade-2.onrender.com";

// ==========================================================
// TYPES
// ==========================================================

interface UserSession {
  id: string;
  username: string;
  email: string;
  role: "user" | "admin";
}

interface WalletData {
  wallet: number;
  pkrBalance: number;
  usdtBalance: number;
  goldBalance: number;
}

interface Deposit {
  _id: string;
  username: string;
  amount: number;
  method: string;
  status: string;
  receipt?: string;
  createdAt: string;
}

interface Withdraw {
  _id: string;
  username: string;
  amount: number;
  method: string;
  walletAddress: string;
  status: string;
  createdAt: string;
}

interface WalletResponse {
  success: boolean;
  wallet?: WalletData;
  deposits?: Deposit[];
  withdrawals?: Withdraw[];
  message?: string;
}

// ==========================================================
// SESSION HELPERS
// ==========================================================

const getSession = () => {
  if (typeof window === "undefined") return null;

  const token =
    localStorage.getItem("goldtrade_token") ||
    sessionStorage.getItem("goldtrade_token");

  const user =
    localStorage.getItem("goldtrade_user") ||
    sessionStorage.getItem("goldtrade_user");

  if (!token || !user) return null;

  try {
    return {
      token,
      user: JSON.parse(user) as UserSession,
    };
  } catch {
    return null;
  }
};

const clearSession = () => {
  if (typeof window === "undefined") return;

  const keys = [
    "goldtrade_token",
    "goldtrade_user",
    "goldtrade_role",
    "goldtrade_username",
    "goldtrade_email",
  ];

  keys.forEach((key) => {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  });
};

// ==========================================================
// COMPONENT START
// ==========================================================

export default function WalletPage() {
  const router = useRouter();
  // ==========================================================
// CURRENCY FORMATTER
// ==========================================================

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(value) ? value : 0);
}
    // ==========================================================
  // AUTH / SESSION STATES
  // ==========================================================

  const [token, setToken] = useState<string>("");
  const [username, setUsername] = useState<string>("");
  const [userEmail, setUserEmail] = useState<string>("");
  const [userRole, setUserRole] = useState<"user" | "admin">("user");

  const [authChecked, setAuthChecked] = useState(false);

  // ==========================================================
  // WALLET STATES
  // ==========================================================

  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [pkrBalance, setPkrBalance] = useState<number>(0);
  const [usdtBalance, setUsdtBalance] = useState<number>(0);
  const [goldBalance, setGoldBalance] = useState<number>(0);

  // ==========================================================
  // MARKET STATES
  // ==========================================================

  const [goldBuyPrice, setGoldBuyPrice] = useState<number>(0);
  const [goldSellPrice, setGoldSellPrice] = useState<number>(0);
  const [usdtRate, setUsdtRate] = useState<number>(0);
  const [marketStatus, setMarketStatus] = useState("ACTIVE");

  // ==========================================================
  // HISTORY STATES
  // ==========================================================

  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdraw[]>([]);

  // ==========================================================
  // FORM STATES
  // ==========================================================

  const [depositAmount, setDepositAmount] = useState("");
  const [depositMethod, setDepositMethod] = useState("ABA Bank");
  const [receiptImage, setReceiptImage] = useState<File | null>(null);

  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawMethod, setWithdrawMethod] = useState("PKR Bank");
  const [withdrawAddress, setWithdrawAddress] = useState("");

  // ==========================================================
  // SEARCH / FILTER STATES
  // ==========================================================

  const [searchHistory, setSearchHistory] = useState("");
  const [historyFilter, setHistoryFilter] = useState<
    "all" | "deposit" | "withdraw"
  >("all");

  // ==========================================================
  // UI STATES
  // ==========================================================

  const [loading, setLoading] = useState(true);
  const [walletLoading, setWalletLoading] = useState(false);
  const [depositLoading, setDepositLoading] = useState(false);
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [refreshLoading, setRefreshLoading] = useState(false);

  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const [isOnline, setIsOnline] = useState(true);

  // ==========================================================
  // LOADING TEXT (NO INFINITE SPINNER)
  // ==========================================================

  const loadingText = useMemo(() => {
    if (walletLoading) return "Loading wallet...";
    if (depositLoading) return "Loading deposits...";
    if (withdrawLoading) return "Loading withdrawals...";
    if (refreshLoading) return "Refreshing wallet...";
    return "Loading GoldTrade Wallet...";
  }, [
    walletLoading,
    depositLoading,
    withdrawLoading,
    refreshLoading,
  ]);

  // ==========================================================
  // SESSION INITIALIZER
  // ==========================================================

  const initializeSession = useCallback(() => {
    const session = getSession();

    if (!session) {
      clearSession();
      router.replace("/login");
      return null;
    }

    setToken(session.token);
    setUsername(session.user.username);
    setUserEmail(session.user.email);
    setUserRole(session.user.role);
    setAuthChecked(true);

    return session;
  }, [router]);

  // ==========================================================
  // NETWORK STATUS LISTENER
  // ==========================================================

  useEffect(() => {
    const online = () => setIsOnline(true);
    const offline = () => setIsOnline(false);

    window.addEventListener("online", online);
    window.addEventListener("offline", offline);

    return () => {
      window.removeEventListener("online", online);
      window.removeEventListener("offline", offline);
    };
  }, []);
    // ==========================================================
  // AUTH CHECK (FINAL PRODUCTION FIX)
  // Prevent Login Loading Loop + Dashboard Redirect Loop
  // ==========================================================

  useEffect(() => {
    if (typeof window === "undefined") return;

    const session = initializeSession();

    if (!session) return;

    console.log("WALLET SESSION:", session.user.username);

    setLoading(false);
  }, [initializeSession]);

  // ==========================================================
  // LOAD COMPLETE WALLET AFTER AUTH
  // Runs ONLY once after JWT session is verified
  // ==========================================================

  useEffect(() => {
    if (!authChecked) return;
    if (!username || !token) return;

    let cancelled = false;

    const loadEverything = async () => {
      try {
        setLoading(true);
        setErrorMessage("");

        await Promise.all([
          loadWallet(username, token),
          loadDepositHistory(username, token),
          loadWithdrawHistory(username, token),
          loadMarketRates(),
        ]);

        if (!cancelled) {
          setLastRefresh(new Date());
        }

      } catch (error: any) {
        console.error("INITIAL LOAD ERROR:", error);

        if (!cancelled) {
          setErrorMessage("Unable to load wallet.");
        }

      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadEverything();

    return () => {
      cancelled = true;
    };
  }, [authChecked, username, token]);

  // ==========================================================
  // PAGE VISIBILITY REFRESH
  // Refresh wallet when returning to browser tab
  // ==========================================================

  useEffect(() => {
    if (!authChecked) return;

    const handleVisibility = async () => {
      if (document.visibilityState !== "visible") return;
      if (!username || !token) return;

      try {
        await loadWallet(username, token);
        setLastRefresh(new Date());
      } catch (error) {
        console.error("VISIBILITY REFRESH ERROR:", error);
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
  }, [authChecked, username, token]);

  // ==========================================================
  // AUTO REFRESH WALLET EVERY 60 SECONDS
  // ==========================================================

  useEffect(() => {
    if (!authChecked) return;
    if (!username || !token) return;

    const interval = setInterval(async () => {
      try {
        await loadWallet(username, token);
        setLastRefresh(new Date());
      } catch (error) {
        console.error("AUTO REFRESH ERROR:", error);
      }
    }, 60000);

    return () => clearInterval(interval);
  }, [authChecked, username, token]);

  // ==========================================================
  // PREVENT DASHBOARD REDIRECT LOOP
  // ==========================================================

  useEffect(() => {
    if (!authChecked) return;

    const session = getSession();

    if (!session) {
      clearSession();
      router.replace("/login");
      return;
    }

    // Wrong role protection
    if (
      userRole === "admin" &&
      !window.location.pathname.startsWith("/admin")
    ) {
      router.replace("/admin/dashboard");
      return;
    }

    if (
      userRole === "user" &&
      window.location.pathname.startsWith("/admin")
    ) {
      router.replace("/dashboard");
    }
  }, [authChecked, userRole, router]);

  // ==========================================================
  // LOADING SCREEN (NO INFINITE SPINNER)
  // ==========================================================

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white">

        <Loader2 className="w-12 h-12 animate-spin text-yellow-400 mb-5" />

        <h2 className="text-xl font-semibold text-yellow-400">
          GoldTrade Enterprise Wallet
        </h2>

        <p className="text-gray-400 mt-2">
          {loadingText}
        </p>

      </div>
    );
  }
  // ==========================================================
// LOAD WALLET (PRODUCTION PATCH V18)
// REPLACE OLD loadWallet() FUNCTION
// ==========================================================

const loadWallet = useCallback(
  async (currentUsername: string, currentToken: string) => {
    if (!currentUsername || !currentToken) return;

    try {
      setWalletLoading(true);
      setErrorMessage("");

      const response = await fetch(
        `${API}/api/wallet/${encodeURIComponent(currentUsername)}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${currentToken}`,
            "Content-Type": "application/json",
          },
          cache: "no-store",
        }
      );

      // JWT expired
      if (response.status === 401 || response.status === 403) {
        clearSession();
        router.replace("/login");
        return;
      }

      const data = await response.json();

      console.log("WALLET RESPONSE:", data);

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Wallet API failed.");
      }

      const wallet = data.wallet || {};

      setWalletBalance(Number(wallet.wallet ?? 0));
      setPkrBalance(Number(wallet.pkrBalance ?? 0));
      setUsdtBalance(Number(wallet.usdtBalance ?? 0));
      setGoldBalance(Number(wallet.goldBalance ?? 0));

      if (Array.isArray(data.deposits)) {
        setDeposits(data.deposits);
      }

      if (Array.isArray(data.withdrawals)) {
        setWithdrawals(data.withdrawals);
      }

      setLastRefresh(new Date());

    } catch (error: any) {
      console.error("LOAD WALLET ERROR:", error);

      setErrorMessage(
        error?.message || "Unable to load wallet."
      );

    } finally {
      setWalletLoading(false);
      setLoading(false);
    }
  },
  [router]
);
// ==========================================================
// INITIAL WALLET LOAD (PATCH)
// ==========================================================

useEffect(() => {
  if (!authChecked) return;
  if (!username || !token) return;

  loadWallet(username, token);
}, [authChecked, username, token, loadWallet]);
// ==========================================================
// LOAD DEPOSIT HISTORY (PATCH V18)
// REPLACE OLD loadDepositHistory()
// ==========================================================

const loadDepositHistory = useCallback(
  async (currentUsername: string, currentToken: string) => {
    if (!currentUsername || !currentToken) return;

    try {
      setDepositLoading(true);

      const response = await fetch(
        `${API}/api/deposit/history/${encodeURIComponent(currentUsername)}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${currentToken}`,
            "Content-Type": "application/json",
          },
          cache: "no-store",
        }
      );

      if (response.status === 401 || response.status === 403) {
        clearSession();
        router.replace("/login");
        return;
      }

      const data = await response.json();

      console.log("DEPOSIT HISTORY:", data);

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to load deposit history.");
      }

      setDeposits(Array.isArray(data.deposits) ? data.deposits : []);

    } catch (error: any) {
      console.error("DEPOSIT HISTORY ERROR:", error);

      setErrorMessage(error.message || "Deposit history failed.");

      setDeposits([]);
    } finally {
      setDepositLoading(false);
    }
  },
  [router]
);

const submitDeposit = async () => {
  if (!token || !username) return;

  const amount = Number(depositAmount);
  if (!Number.isFinite(amount) || amount <= 0) {
    setErrorMessage("Please enter a valid deposit amount.");
    return;
  }
  if (!receiptImage) {
    setErrorMessage("Please upload a payment receipt.");
    return;
  }

  try {
    setDepositLoading(true);
    setErrorMessage("");
    const formData = new FormData();
    formData.append("username", username);
    formData.append("amount", String(amount));
    formData.append("method", depositMethod);
    formData.append("receipt", receiptImage);

    const response = await fetch(`${API}/api/deposit/create`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    if (response.status === 401 || response.status === 403) {
      clearSession();
      router.replace("/login");
      return;
    }
    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.message || "Deposit request failed.");
    }
    setSuccessMessage("Deposit request submitted successfully.");
    setDepositAmount("");
    setReceiptImage(null);
    await Promise.all([
      loadWallet(username, token),
      loadDepositHistory(username, token),
    ]);
  } catch (error: any) {
    setErrorMessage(error?.message || "Deposit request failed.");
  } finally {
    setDepositLoading(false);
  }
};
// ==========================================================
// RECEIPT FILE SELECT
// ==========================================================

const handleReceiptSelect = (
  event: React.ChangeEvent<HTMLInputElement>
) => {
  const file = event.target.files?.[0];

  if (!file) return;

  const maxSize = 10 * 1024 * 1024;

  if (file.size > maxSize) {
    setErrorMessage("Receipt image must be less than 10 MB.");
    return;
  }

  setReceiptImage(file);
  setErrorMessage("");
};
// ==========================================================
// RECEIPT PREVIEW
// ==========================================================

const receiptPreview = useMemo(() => {
  if (!receiptImage) return "";

  return URL.createObjectURL(receiptImage);
}, [receiptImage]);

useEffect(() => {
  return () => {
    if (receiptPreview) {
      URL.revokeObjectURL(receiptPreview);
    }
  };
}, [receiptPreview]);
// ==========================================================
// REFRESH DEPOSIT HISTORY
// ==========================================================

const refreshDeposits = async () => {
  if (!username || !token) return;

  try {
    setRefreshLoading(true);

    await loadDepositHistory(username, token);

    setSuccessMessage("Deposit history refreshed.");

    setTimeout(() => setSuccessMessage(""), 2000);

  } catch (error) {
    console.error(error);
  } finally {
    setRefreshLoading(false);
  }
};
// ==========================================================
// DEPOSIT SUMMARY
// ==========================================================

const totalDeposited = useMemo(() => {
  return deposits
    .filter((item) => item.status?.toLowerCase() === "approved")
    .reduce((sum, item) => sum + Number(item.amount || 0), 0);
}, [deposits]);

const pendingDeposits = useMemo(() => {
  return deposits
    .filter((item) => item.status?.toLowerCase() === "pending")
    .reduce((sum, item) => sum + Number(item.amount || 0), 0);
}, [deposits]);

const recentDeposits = useMemo(() => {
  return [...deposits]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() -
        new Date(a.createdAt).getTime()
    )
    .slice(0, 10);
}, [deposits]);
// ==========================================================
// DEPOSIT STATUS BADGE
// ==========================================================

const getDepositStatusBadge = (status: string) => {
  switch ((status || "").toLowerCase()) {
    case "approved":
      return "bg-green-500/20 text-green-400 border border-green-500/30";

    case "pending":
      return "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30";

    case "rejected":
      return "bg-red-500/20 text-red-400 border border-red-500/30";

    default:
      return "bg-gray-500/20 text-gray-300 border border-gray-500/30";
  }
};
// ==========================================================
// LOAD WITHDRAW HISTORY (PATCH V18)
// REPLACE OLD loadWithdrawHistory()
// ==========================================================

const loadWithdrawHistory = useCallback(
  async (currentUsername: string, currentToken: string) => {
    if (!currentUsername || !currentToken) return;

    try {
      setWithdrawLoading(true);

      const response = await fetch(
        `${API}/api/withdraw/history/${encodeURIComponent(currentUsername)}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${currentToken}`,
            "Content-Type": "application/json",
          },
          cache: "no-store",
        }
      );

      if (response.status === 401 || response.status === 403) {
        clearSession();
        router.replace("/login");
        return;
      }

      const data = await response.json();

      console.log("WITHDRAW HISTORY:", data);

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Unable to load withdraw history."
        );
      }

      setWithdrawals(
        Array.isArray(data.withdrawals) ? data.withdrawals : []
      );

    } catch (error: any) {
      console.error("WITHDRAW HISTORY ERROR:", error);

      setErrorMessage(
        error.message || "Withdraw history failed."
      );

      setWithdrawals([]);

    } finally {
      setWithdrawLoading(false);
    }
  },
  [router]
);
// ==========================================================
// SUBMIT WITHDRAW REQUEST (PATCH V18)
// ==========================================================

const submitWithdraw = async () => {
  if (!token || !username) return;

  if (!withdrawAmount || Number(withdrawAmount) <= 0) {
    setErrorMessage("Please enter a valid withdraw amount.");
    return;
  }

  if (!withdrawAddress.trim()) {
    setErrorMessage(
      "Please enter bank account or wallet address."
    );
    return;
  }

  if (Number(withdrawAmount) > Number(pkrBalance)) {
    setErrorMessage("Insufficient PKR balance.");
    return;
  }

  try {
    setWithdrawLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    const response = await fetch(`${API}/api/withdraw/create`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username,
        amount: Number(withdrawAmount),
        method: withdrawMethod,
        walletAddress: withdrawAddress.trim(),
      }),
    });

    if (response.status === 401 || response.status === 403) {
      clearSession();
      router.replace("/login");
      return;
    }

    const data = await response.json();

    console.log("WITHDRAW RESPONSE:", data);

    if (!response.ok || !data.success) {
      throw new Error(
        data.message || "Withdraw request failed."
      );
    }

    setSuccessMessage(
      "Withdraw request submitted successfully. Waiting for admin approval."
    );

    // Reset Form
    setWithdrawAmount("");
    setWithdrawAddress("");

    // Refresh wallet & withdraw history
    await Promise.all([
      loadWallet(username, token),
      loadWithdrawHistory(username, token),
    ]);

  } catch (error: any) {
    console.error("WITHDRAW ERROR:", error);

    setErrorMessage(
      error.message || "Withdraw request failed."
    );

  } finally {
    setWithdrawLoading(false);
  }
};
// ==========================================================
// REFRESH WITHDRAW HISTORY
// ==========================================================

const refreshWithdrawHistory = async () => {
  if (!username || !token) return;

  try {
    setRefreshLoading(true);

    await loadWithdrawHistory(username, token);

    setSuccessMessage("Withdraw history refreshed.");

    setTimeout(() => {
      setSuccessMessage("");
    }, 2000);

  } finally {
    setRefreshLoading(false);
  }
};
// ==========================================================
// WITHDRAW SUMMARY
// ==========================================================

const totalWithdrawn = useMemo(() => {
  return withdrawals
    .filter((item) => item.status?.toLowerCase() === "approved")
    .reduce((sum, item) => sum + Number(item.amount || 0), 0);
}, [withdrawals]);

const pendingWithdrawals = useMemo(() => {
  return withdrawals
    .filter((item) => item.status?.toLowerCase() === "pending")
    .reduce((sum, item) => sum + Number(item.amount || 0), 0);
}, [withdrawals]);

const recentWithdrawals = useMemo(() => {
  return [...withdrawals]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() -
        new Date(a.createdAt).getTime()
    )
    .slice(0, 10);
}, [withdrawals]);
// ==========================================================
// WITHDRAW STATUS BADGE
// ==========================================================

const getWithdrawStatusBadge = (status: string) => {
  switch ((status || "").toLowerCase()) {
    case "approved":
      return "bg-green-500/20 text-green-400 border border-green-500/30";

    case "pending":
      return "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30";

    case "rejected":
      return "bg-red-500/20 text-red-400 border border-red-500/30";

    default:
      return "bg-gray-500/20 text-gray-300 border border-gray-500/30";
  }
};
// ==========================================================
// LOAD WITHDRAW HISTORY AFTER LOGIN
// ==========================================================

useEffect(() => {
  if (!authChecked) return;
  if (!username || !token) return;

  loadWithdrawHistory(username, token);
}, [authChecked, username, token, loadWithdrawHistory]);
// ==========================================================
// LOAD LIVE MARKET RATES (PATCH V18)
// REPLACE OLD loadMarketRates()
// ==========================================================

const loadMarketRates = useCallback(async () => {
  try {
    const response = await fetch(`${API}/api/gold/price`, {
      method: "GET",
      cache: "no-store",
    });

    const data = await response.json();

    console.log("MARKET RESPONSE:", data);

    if (!response.ok || !data.success) {
      throw new Error(data.message || "Market unavailable.");
    }

    setGoldBuyPrice(Number(data.buyPrice ?? 0));
    setGoldSellPrice(Number(data.sellPrice ?? 0));

    setUsdtRate(Number(data.usdtRate ?? data.usdtPrice ?? 0));

    setMarketStatus(data.marketStatus || "ACTIVE");

    setLastRefresh(new Date());

  } catch (error) {
    console.error("MARKET ERROR:", error);

    setGoldBuyPrice(0);
    setGoldSellPrice(0);
    setUsdtRate(0);
    setMarketStatus("OFFLINE");
  }
}, []);

const refreshDashboard = useCallback(async () => {
  if (!username || !token) return;
  try {
    setRefreshLoading(true);
    await Promise.all([
      loadWallet(username, token),
      loadDepositHistory(username, token),
      loadWithdrawHistory(username, token),
      loadMarketRates(),
    ]);
    setLastRefresh(new Date());
  } finally {
    setRefreshLoading(false);
  }
}, [
  username,
  token,
  loadWallet,
  loadDepositHistory,
  loadWithdrawHistory,
  loadMarketRates,
]);
// ==========================================================
// PORTFOLIO VALUE
// ==========================================================

const portfolioValue = useMemo(() => {
  const wallet = Number(walletBalance || 0);
  const pkr = Number(pkrBalance || 0);

  const gold =
    Number(goldBalance || 0) * Number(goldSellPrice || 0);

  const usdt =
    Number(usdtBalance || 0) * Number(usdtRate || 0);

  return wallet + pkr + gold + usdt;
}, [
  walletBalance,
  pkrBalance,
  goldBalance,
  usdtBalance,
  goldSellPrice,
  usdtRate,
]);

// ==========================================================
// WALLET HEALTH
// ==========================================================

const walletHealth = useMemo(() => {
  if (portfolioValue >= 1000000) return "PLATINUM";
  if (portfolioValue >= 500000) return "GOLD";
  if (portfolioValue >= 100000) return "SILVER";
  return "STANDARD";
}, [portfolioValue]);
// ==========================================================
// AUTO REFRESH MARKET (30 Seconds)
// ==========================================================

useEffect(() => {
  if (!authChecked) return;

  const interval = setInterval(() => {
    loadMarketRates();
  }, 30000);

  return () => clearInterval(interval);
}, [authChecked, loadMarketRates]);

// ==========================================================
// AUTO REFRESH WALLET (60 Seconds)
// ==========================================================

useEffect(() => {
  if (!authChecked) return;
  if (!username || !token) return;

  const interval = setInterval(() => {
    refreshDashboard();
  }, 60000);

  return () => clearInterval(interval);
}, [authChecked, username, token]);
// ==========================================================
// REFRESH WHEN USER RETURNS TO TAB
// ==========================================================

useEffect(() => {
  const handleVisibility = async () => {
    if (document.visibilityState !== "visible") return;

    if (!authChecked || !username || !token) return;

    try {
      await refreshDashboard();
    } catch (error) {
      console.error("VISIBILITY REFRESH:", error);
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
}, [authChecked, username, token]);
// ==========================================================
// MARKET BADGE STYLE
// ==========================================================

const marketBadgeClass = useMemo(() => {
  return marketStatus === "ACTIVE"
    ? "bg-green-500/20 text-green-400 border border-green-500/30"
    : "bg-red-500/20 text-red-400 border border-red-500/30";
}, [marketStatus]);

// ==========================================================
// LAST REFRESH LABEL
// ==========================================================

const lastRefreshLabel = useMemo(() => {
  if (!lastRefresh) return "Never";

  return lastRefresh.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}, [lastRefresh]);
// ==========================================================
// LOGOUT (PATCH V18)
// REPLACE OLD handleLogout()
// ==========================================================

const handleLogout = useCallback(async () => {
  try {
    if (token) {
      await fetch(`${API}/api/auth/logout`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    }
  } catch (error) {
    console.error("LOGOUT API ERROR:", error);
  } finally {
    clearSession();

    setToken("");
    setUsername("");
    setUserEmail("");
    setUserRole("user");
    setAuthChecked(false);

    setWalletBalance(0);
    setPkrBalance(0);
    setUsdtBalance(0);
    setGoldBalance(0);

    setDeposits([]);
    setWithdrawals([]);

    setLoading(false);

    router.replace("/login");
  }
}, [router, token]);
// ==========================================================
// SESSION VALIDATION
// ==========================================================

const validateSession = useCallback(() => {
  const session = getSession();

  if (!session) {
    clearSession();
    router.replace("/login");
    return false;
  }

  return true;
}, [router]);
// ==========================================================
// SAFE NAVIGATION
// ==========================================================

const navigateProtected = useCallback(
  (path: string) => {
    if (!validateSession()) return;

    router.push(path);
  },
  [router, validateSession]
);

const goDashboard = () => navigateProtected("/dashboard");
const goWallet = () => navigateProtected("/wallet");
const goDeposit = () => navigateProtected("/deposit");
const goWithdraw = () => navigateProtected("/withdraw");
const goUSDT = () => navigateProtected("/usdt");
const goGold = () => navigateProtected("/gold");
const goProfile = () => navigateProtected("/profile");
// ==========================================================
// SESSION WATCHER
// ==========================================================

useEffect(() => {
  if (!authChecked) return;

  const interval = setInterval(() => {
    validateSession();
  }, 20000);

  return () => clearInterval(interval);
}, [authChecked, validateSession]);
// ==========================================================
// PREVENT BACK AFTER LOGOUT
// ==========================================================

useEffect(() => {
  const handlePopState = () => {
    if (!getSession()) {
      router.replace("/login");
    }
  };

  window.addEventListener("popstate", handlePopState);

  return () => {
    window.removeEventListener("popstate", handlePopState);
  };
}, [router]);
// ==========================================================
// ONLINE REFRESH
// ==========================================================

useEffect(() => {
  if (!isOnline) return;
  if (!authChecked) return;
  if (!username || !token) return;

  refreshDashboard();
}, [isOnline, authChecked, username, token]);

return (
  <main className="min-h-screen bg-black px-4 py-8 text-white md:px-8">
{/* ========================================================== */}
{/* GOLDTRADE WALLET HEADER */}
{/* ========================================================== */}

<section className="mb-8 rounded-3xl border border-yellow-500/20 bg-zinc-950 p-6">

  <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

    <div>
      <h1 className="text-3xl font-bold text-yellow-400">
        GoldTrade Wallet
      </h1>

      <p className="mt-2 text-gray-400">
        Welcome back,{" "}
        <span className="font-semibold text-white">
          {username}
        </span>
      </p>

      <p className="mt-1 text-xs text-gray-500">
        Last Refresh : {lastRefreshLabel}
      </p>
    </div>

    <div className="flex flex-wrap gap-3">

      <button
        onClick={refreshDashboard}
        disabled={refreshLoading}
        className="flex items-center gap-2 rounded-xl bg-yellow-500 px-5 py-3 font-semibold text-black transition hover:bg-yellow-400 disabled:opacity-60"
      >
        {refreshLoading ? (
          <Loader2 className="h-5 w-5 animate-spin"/>
        ) : (
          <RefreshCw className="h-5 w-5"/>
        )}

        Refresh Wallet
      </button>

      <button
        onClick={handleLogout}
        className="flex items-center gap-2 rounded-xl bg-red-600 px-5 py-3 font-semibold text-white transition hover:bg-red-700"
      >
        Logout
      </button>

    </div>

  </div>

</section>

{/* ========================================================== */}
{/* SUCCESS / ERROR ALERTS */}
{/* ========================================================== */}

{successMessage && (
  <div className="mb-5 flex items-center gap-3 rounded-2xl border border-green-500/30 bg-green-500/10 p-4 text-green-400">
    <CheckCircle2 className="h-5 w-5"/>
    {successMessage}
  </div>
)}

{errorMessage && (
  <div className="mb-5 flex items-center gap-3 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-red-400">
    <AlertCircle className="h-5 w-5"/>
    {errorMessage}
  </div>
)}

{/* ========================================================== */}
{/* WALLET BALANCE CARDS */}
{/* ========================================================== */}

<section className="mb-10 grid gap-5 md:grid-cols-2 xl:grid-cols-4">

  <div className="rounded-3xl border border-yellow-500/20 bg-zinc-950 p-5">

    <Wallet className="mb-4 h-8 w-8 text-yellow-400"/>

    <p className="text-sm text-gray-400">Wallet Balance</p>

    <h2 className="mt-2 text-3xl font-bold text-yellow-400">
      PKR {formatCurrency(walletBalance)}
    </h2>

  </div>

  <div className="rounded-3xl border border-green-500/20 bg-zinc-950 p-5">

    <DollarSign className="mb-4 h-8 w-8 text-green-400"/>

    <p className="text-sm text-gray-400">PKR Balance</p>

    <h2 className="mt-2 text-3xl font-bold text-green-400">
      PKR {formatCurrency(pkrBalance)}
    </h2>

  </div>

  <div className="rounded-3xl border border-blue-500/20 bg-zinc-950 p-5">

    <Coins className="mb-4 h-8 w-8 text-blue-400"/>

    <p className="text-sm text-gray-400">USDT Balance</p>

    <h2 className="mt-2 text-3xl font-bold text-blue-400">
      {formatCurrency(usdtBalance)} USDT
    </h2>

  </div>

  <div className="rounded-3xl border border-orange-500/20 bg-zinc-950 p-5">

    <ShieldCheck className="mb-4 h-8 w-8 text-orange-400"/>

    <p className="text-sm text-gray-400">Gold Balance</p>

    <h2 className="mt-2 text-3xl font-bold text-orange-400">
      {formatCurrency(goldBalance)} Gram
    </h2>

  </div>

</section>

{/* ========================================================== */}
{/* PORTFOLIO CARD */}
{/* ========================================================== */}

<section className="mb-10 rounded-3xl border border-yellow-500/20 bg-zinc-950 p-6">

  <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

    <div>

      <p className="text-gray-400">
        Total Portfolio Value
      </p>

      <h2 className="mt-3 text-4xl font-bold text-yellow-400">
        PKR {formatCurrency(portfolioValue)}
      </h2>

      <p className="mt-2 text-sm text-gray-500">
        Wallet Status :{" "}
        <span className="font-semibold text-yellow-400">
          {walletHealth}
        </span>
      </p>

    </div>

    <span
      className={`rounded-full px-5 py-3 text-sm font-semibold ${marketBadgeClass}`}
    >
      Market : {marketStatus}
    </span>

  </div>

  <div className="mt-8 grid gap-4 md:grid-cols-3">

    <div className="rounded-2xl border border-zinc-800 bg-black p-4">

      <p className="text-sm text-gray-400">
        Gold Buy Price
      </p>

      <p className="mt-2 text-2xl font-bold text-yellow-400">
        PKR {formatCurrency(goldBuyPrice)}
      </p>

    </div>

    <div className="rounded-2xl border border-zinc-800 bg-black p-4">

      <p className="text-sm text-gray-400">
        Gold Sell Price
      </p>

      <p className="mt-2 text-2xl font-bold text-green-400">
        PKR {formatCurrency(goldSellPrice)}
      </p>

    </div>

    <div className="rounded-2xl border border-zinc-800 bg-black p-4">

      <p className="text-sm text-gray-400">
        USDT Live Rate
      </p>

      <p className="mt-2 text-2xl font-bold text-blue-400">
        PKR {formatCurrency(usdtRate)}
      </p>

    </div>

  </div>

</section>

{/* ========================================================== */}
{/* QUICK ACTION BUTTONS */}
{/* ========================================================== */}

<section className="mb-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">

  <button
    onClick={goDeposit}
    className="rounded-2xl bg-green-600 p-5 text-white transition hover:bg-green-700"
  >
    <ArrowDownCircle className="mx-auto mb-3 h-10 w-10"/>

    <p className="font-semibold">
      Deposit PKR
    </p>
  </button>

  <button
    onClick={goWithdraw}
    className="rounded-2xl bg-red-600 p-5 text-white transition hover:bg-red-700"
  >
    <ArrowUpCircle className="mx-auto mb-3 h-10 w-10"/>

    <p className="font-semibold">
      Withdraw PKR
    </p>
  </button>

  <button
    onClick={goUSDT}
    className="rounded-2xl bg-blue-600 p-5 text-white transition hover:bg-blue-700"
  >
    <Coins className="mx-auto mb-3 h-10 w-10"/>

    <p className="font-semibold">
      USDT Trading
    </p>
  </button>

  <button
    onClick={goGold}
    className="rounded-2xl bg-yellow-500 p-5 font-semibold text-black transition hover:bg-yellow-400"
  >
    <TrendingUp className="mx-auto mb-3 h-10 w-10"/>

    Gold Trading
  </button>

</section>
{/* ========================================================== */}
{/* MANUAL PKR DEPOSIT */}
{/* ========================================================== */}

<section className="mb-10 rounded-3xl border border-green-500/20 bg-zinc-950 p-6">

  <div className="mb-6 flex items-center justify-between">
    <div>
      <h2 className="text-2xl font-bold text-green-400">
        Manual PKR Deposit
      </h2>

      <p className="mt-1 text-sm text-gray-400">
        Upload your payment receipt after sending funds.
      </p>
    </div>

    <Receipt className="h-8 w-8 text-green-400" />
  </div>

  {/* Deposit Form */}

  <div className="grid gap-5 md:grid-cols-2">

    <div>
      <label className="mb-2 block text-sm text-gray-300">
        Deposit Amount (PKR)
      </label>

      <input
        type="number"
        value={depositAmount}
        onChange={(e) => setDepositAmount(e.target.value)}
        placeholder="Enter PKR Amount"
        className="w-full rounded-xl border border-zinc-700 bg-black px-4 py-3 text-white outline-none focus:border-green-500"
      />
    </div>

    <div>
      <label className="mb-2 block text-sm text-gray-300">
        Payment Method
      </label>

      <select
        value={depositMethod}
        onChange={(e) => setDepositMethod(e.target.value)}
        className="w-full rounded-xl border border-zinc-700 bg-black px-4 py-3 text-white outline-none focus:border-green-500"
      >
        <option value="ABA Bank">ABA Bank</option>
        <option value="Binance">Binance</option>
        <option value="Cash App">Cash App</option>
        <option value="Bank Transfer">Bank Transfer</option>
      </select>
    </div>

  </div>

  {/* Payment Details */}

  <div className="mt-6 rounded-2xl border border-yellow-500/20 bg-black p-5">

    <h3 className="mb-3 font-semibold text-yellow-400">
      Payment Details
    </h3>

    <div className="space-y-2 text-sm text-gray-300">

      <p>**ABA Bank:** GoldTrade Enterprise</p>
      <p>**Account Number:** 000-000-000000</p>

      <p>**Binance UID:** 123456789</p>

      <p>**Cash App:** $GoldTradePKR</p>

    </div>

  </div>

  {/* Upload Receipt */}

  <div className="mt-6">

    <label className="mb-3 block text-sm text-gray-300">
      Upload Receipt
    </label>

    <input
      type="file"
      accept="image/*"
      onChange={handleReceiptSelect}
      className="w-full rounded-xl border border-zinc-700 bg-black px-4 py-3 text-white"
    />

    {receiptImage && (
      <div className="mt-3 rounded-xl border border-green-500/20 bg-black p-3">

        <p className="text-sm text-green-400">
          Receipt Selected
        </p>

        <p className="mt-1 text-sm text-gray-300">
          {receiptImage.name}
        </p>

      </div>
    )}

    {receiptPreview && (
      <div className="mt-5">

        <p className="mb-2 text-sm text-gray-400">
          Receipt Preview
        </p>

        <img
          src={receiptPreview}
          alt="Receipt Preview"
          className="max-h-80 rounded-2xl border border-green-500/20 object-contain"
        />

      </div>
    )}

  </div>

  {/* Submit Deposit */}

  <button
    onClick={submitDeposit}
    disabled={depositLoading}
    className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 py-3 font-semibold text-white transition hover:bg-green-700 disabled:opacity-50"
  >
    {depositLoading ? (
      <>
        <Loader2 className="h-5 w-5 animate-spin"/>
        Uploading Deposit...
      </>
    ) : (
      <>
        <ArrowDownCircle className="h-5 w-5"/>
        Submit Deposit
      </>
    )}
  </button>

</section>

{/* ========================================================== */}
{/* DEPOSIT SUMMARY */}
{/* ========================================================== */}

<section className="mb-10 grid gap-5 md:grid-cols-2">

  <div className="rounded-2xl border border-green-500/20 bg-zinc-950 p-5">

    <p className="text-sm text-gray-400">
      Approved Deposits
    </p>

    <h3 className="mt-2 text-3xl font-bold text-green-400">
      PKR {formatCurrency(totalDeposited)}
    </h3>

  </div>

  <div className="rounded-2xl border border-yellow-500/20 bg-zinc-950 p-5">

    <p className="text-sm text-gray-400">
      Pending Deposits
    </p>

    <h3 className="mt-2 text-3xl font-bold text-yellow-400">
      PKR {formatCurrency(pendingDeposits)}
    </h3>

  </div>

</section>

{/* ========================================================== */}
{/* DEPOSIT HISTORY */}
{/* ========================================================== */}

<section className="mb-10 rounded-3xl border border-yellow-500/20 bg-zinc-950 p-6">

  <div className="mb-6 flex items-center justify-between">

    <div>
      <h2 className="text-2xl font-bold text-yellow-400">
        Deposit History
      </h2>

      <p className="mt-1 text-sm text-gray-400">
        Latest Deposit Requests
      </p>
    </div>

    <button
      onClick={refreshDeposits}
      className="rounded-lg bg-yellow-500 px-4 py-2 font-semibold text-black transition hover:bg-yellow-400"
    >
      Refresh
    </button>

  </div>

  {depositLoading ? (
    <div className="flex justify-center py-10">
      <Loader2 className="h-8 w-8 animate-spin text-yellow-400"/>
    </div>
  ) : recentDeposits.length === 0 ? (
    <div className="rounded-xl border border-zinc-800 bg-black p-6 text-center text-gray-500">
      No Deposit History Found.
    </div>
  ) : (
    <div className="space-y-4">

      {recentDeposits.map((deposit) => (
        <div
          key={deposit._id}
          className="flex flex-col gap-4 rounded-2xl border border-zinc-800 bg-black p-5 md:flex-row md:items-center md:justify-between"
        >

          <div>

            <h3 className="text-lg font-semibold text-white">
              PKR {formatCurrency(deposit.amount)}
            </h3>

            <p className="mt-1 text-sm text-gray-400">
              {deposit.method}
            </p>

            <p className="mt-1 text-xs text-gray-500">
              {new Date(deposit.createdAt).toLocaleString()}
            </p>

          </div>

          <span
            className={`rounded-full px-4 py-2 text-xs font-semibold ${getDepositStatusBadge(
              deposit.status
            )}`}
          >
            {deposit.status}
          </span>

        </div>
      ))}

    </div>
  )}

</section>
{/* ========================================================== */}
{/* WITHDRAW PKR */}
{/* ========================================================== */}

<section className="mb-10 rounded-3xl border border-red-500/20 bg-zinc-950 p-6">

  <div className="mb-6 flex items-center justify-between">

    <div>
      <h2 className="text-2xl font-bold text-red-400">
        Withdraw PKR
      </h2>

      <p className="mt-1 text-sm text-gray-400">
        Submit a withdrawal request. Admin approval is required.
      </p>
    </div>

    <CreditCard className="h-8 w-8 text-red-400"/>

  </div>

  {/* Withdraw Form */}

  <div className="grid gap-5 md:grid-cols-2">

    <div>
      <label className="mb-2 block text-sm text-gray-300">
        Withdraw Amount (PKR)
      </label>

      <input
        type="number"
        value={withdrawAmount}
        onChange={(e) => setWithdrawAmount(e.target.value)}
        placeholder="Enter PKR Amount"
        className="w-full rounded-xl border border-zinc-700 bg-black px-4 py-3 text-white outline-none focus:border-red-500"
      />
    </div>

    <div>
      <label className="mb-2 block text-sm text-gray-300">
        Withdraw Method
      </label>

      <select
        value={withdrawMethod}
        onChange={(e) => setWithdrawMethod(e.target.value)}
        className="w-full rounded-xl border border-zinc-700 bg-black px-4 py-3 text-white outline-none focus:border-red-500"
      >
        <option value="PKR Bank">PKR Bank</option>
        <option value="ABA Bank">ABA Bank</option>
        <option value="Binance USDT">Binance USDT</option>
        <option value="Cash App">Cash App</option>
      </select>
    </div>

  </div>

  {/* Bank / Wallet Address */}

  <div className="mt-6">

    <label className="mb-2 block text-sm text-gray-300">
      Bank Account / Wallet Address
    </label>

    <textarea
      rows={3}
      value={withdrawAddress}
      onChange={(e) => setWithdrawAddress(e.target.value)}
      placeholder="Enter your Bank Account / ABA / Binance Wallet Address"
      className="w-full rounded-xl border border-zinc-700 bg-black px-4 py-3 text-white outline-none focus:border-red-500"
    />

  </div>

  {/* Balance Card */}

  <div className="mt-6 rounded-2xl border border-green-500/20 bg-black p-5">

    <div className="flex items-center justify-between">

      <div>

        <p className="text-sm text-gray-400">
          Available PKR Balance
        </p>

        <h3 className="mt-2 text-3xl font-bold text-green-400">
          PKR {formatCurrency(pkrBalance)}
        </h3>

      </div>

      <Landmark className="h-10 w-10 text-green-400"/>

    </div>

  </div>

  {/* Submit Button */}

  <button
    onClick={submitWithdraw}
    disabled={withdrawLoading}
    className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 py-3 font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
  >
    {withdrawLoading ? (
      <>
        <Loader2 className="h-5 w-5 animate-spin"/>
        Sending Withdraw Request...
      </>
    ) : (
      <>
        <ArrowUpCircle className="h-5 w-5"/>
        Submit Withdraw Request
      </>
    )}
  </button>

</section>

{/* ========================================================== */}
{/* WITHDRAW SUMMARY */}
{/* ========================================================== */}

<section className="mb-10 grid gap-5 md:grid-cols-2">

  <div className="rounded-2xl border border-red-500/20 bg-zinc-950 p-5">

    <p className="text-sm text-gray-400">
      Approved Withdrawals
    </p>

    <h3 className="mt-2 text-3xl font-bold text-red-400">
      PKR {formatCurrency(totalWithdrawn)}
    </h3>

  </div>

  <div className="rounded-2xl border border-yellow-500/20 bg-zinc-950 p-5">

    <p className="text-sm text-gray-400">
      Pending Withdrawals
    </p>

    <h3 className="mt-2 text-3xl font-bold text-yellow-400">
      PKR {formatCurrency(pendingWithdrawals)}
    </h3>

  </div>

</section>

{/* ========================================================== */}
{/* WITHDRAW HISTORY */}
{/* ========================================================== */}

<section className="mb-10 rounded-3xl border border-red-500/20 bg-zinc-950 p-6">

  <div className="mb-6 flex items-center justify-between">

    <div>
      <h2 className="text-2xl font-bold text-red-400">
        Withdraw History
      </h2>

      <p className="mt-1 text-sm text-gray-400">
        Latest withdrawal requests.
      </p>
    </div>

    <button
      onClick={refreshWithdrawHistory}
      className="rounded-lg bg-red-600 px-4 py-2 font-semibold text-white transition hover:bg-red-500"
    >
      Refresh
    </button>

  </div>

  {withdrawLoading ? (
    <div className="flex justify-center py-10">
      <Loader2 className="h-8 w-8 animate-spin text-red-400"/>
    </div>
  ) : recentWithdrawals.length === 0 ? (
    <div className="rounded-xl border border-zinc-800 bg-black p-6 text-center text-gray-500">
      No Withdraw History Found.
    </div>
  ) : (
    <div className="space-y-4">

      {recentWithdrawals.map((withdraw) => (
        <div
          key={withdraw._id}
          className="flex flex-col gap-4 rounded-2xl border border-zinc-800 bg-black p-5 md:flex-row md:items-center md:justify-between"
        >

          <div>

            <h3 className="text-lg font-semibold text-white">
              PKR {formatCurrency(withdraw.amount)}
            </h3>

            <p className="mt-1 text-sm text-gray-400">
              {withdraw.method}
            </p>

            <p className="mt-1 text-xs text-gray-500">
              {new Date(withdraw.createdAt).toLocaleString()}
            </p>

          </div>

          <span
            className={`rounded-full px-4 py-2 text-xs font-semibold ${getWithdrawStatusBadge(
              withdraw.status
            )}`}
          >
            {withdraw.status}
          </span>

        </div>
      ))}

    </div>
  )}

</section>

{/* ========================================================== */}
{/* WALLET TIMELINE */}
{/* ========================================================== */}

<section className="mb-10 rounded-3xl border border-blue-500/20 bg-zinc-950 p-6">

  <div className="mb-6 flex items-center justify-between">

    <div>
      <h2 className="text-2xl font-bold text-blue-400">
        Wallet Timeline
      </h2>

      <p className="mt-1 text-sm text-gray-400">
        Recent deposits and withdrawals.
      </p>
    </div>

    <History className="h-8 w-8 text-blue-400"/>

  </div>

  <div className="space-y-4">

    {recentDeposits.slice(0, 5).map((deposit) => (
      <div
        key={`deposit-${deposit._id}`}
        className="flex items-center justify-between rounded-xl border border-green-500/20 bg-black p-4"
      >

        <div className="flex items-center gap-3">

          <ArrowDownCircle className="h-8 w-8 text-green-400"/>

          <div>

            <p className="font-semibold text-green-400">
              Deposit Received
            </p>

            <p className="text-sm text-gray-400">
              {deposit.method}
            </p>

            <p className="text-xs text-gray-500">
              {new Date(deposit.createdAt).toLocaleString()}
            </p>

          </div>

        </div>

        <span className="font-bold text-green-400">
          + PKR {formatCurrency(deposit.amount)}
        </span>

      </div>
    ))}

    {recentWithdrawals.slice(0, 5).map((withdraw) => (
      <div
        key={`withdraw-${withdraw._id}`}
        className="flex items-center justify-between rounded-xl border border-red-500/20 bg-black p-4"
      >

        <div className="flex items-center gap-3">

          <ArrowUpCircle className="h-8 w-8 text-red-400"/>

          <div>

            <p className="font-semibold text-red-400">
              Withdraw Request
            </p>

            <p className="text-sm text-gray-400">
              {withdraw.method}
            </p>

            <p className="text-xs text-gray-500">
              {new Date(withdraw.createdAt).toLocaleString()}
            </p>

          </div>

        </div>

        <span className="font-bold text-red-400">
          - PKR {formatCurrency(withdraw.amount)}
        </span>

      </div>
    ))}

  </div>

</section>
{/* ========================================================== */}
{/* TRANSACTION SEARCH & FILTER */}
{/* ========================================================== */}

<section className="mb-10 rounded-3xl border border-blue-500/20 bg-zinc-950 p-6">

  <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

    <div>
      <h2 className="text-2xl font-bold text-blue-400">
        Search Transactions
      </h2>

      <p className="mt-1 text-sm text-gray-400">
        Search deposits or withdrawals by amount, method or status.
      </p>
    </div>

    <div className="flex flex-wrap gap-3">

      <div className="relative">

        <Search className="absolute left-3 top-3.5 h-4 w-4 text-gray-500" />

        <input
          type="text"
          value={searchHistory}
          onChange={(e) => setSearchHistory(e.target.value)}
          placeholder="Search..."
          className="rounded-xl border border-zinc-700 bg-black py-3 pl-10 pr-4 text-white outline-none focus:border-blue-500"
        />

      </div>

      <select
        value={historyFilter}
        onChange={(e) =>
          setHistoryFilter(
            e.target.value as "all" | "deposit" | "withdraw"
          )
        }
        className="rounded-xl border border-zinc-700 bg-black px-4 py-3 text-white outline-none focus:border-blue-500"
      >
        <option value="all">All Transactions</option>
        <option value="deposit">Deposits</option>
        <option value="withdraw">Withdrawals</option>
      </select>

    </div>

  </div>

</section>
{/* ========================================================== */}
{/* WALLET STATISTICS */}
{/* ========================================================== */}

<section className="mb-10 grid gap-5 md:grid-cols-2 xl:grid-cols-4">

  <div className="rounded-2xl border border-green-500/20 bg-zinc-950 p-5">
    <p className="text-sm text-gray-400">Approved Deposits</p>

    <h3 className="mt-2 text-2xl font-bold text-green-400">
      PKR {formatCurrency(totalDeposited)}
    </h3>
  </div>

  <div className="rounded-2xl border border-red-500/20 bg-zinc-950 p-5">
    <p className="text-sm text-gray-400">Approved Withdrawals</p>

    <h3 className="mt-2 text-2xl font-bold text-red-400">
      PKR {formatCurrency(totalWithdrawn)}
    </h3>
  </div>

  <div className="rounded-2xl border border-yellow-500/20 bg-zinc-950 p-5">
    <p className="text-sm text-gray-400">Portfolio Value</p>

    <h3 className="mt-2 text-2xl font-bold text-yellow-400">
      PKR {formatCurrency(portfolioValue)}
    </h3>
  </div>

  <div className="rounded-2xl border border-blue-500/20 bg-zinc-950 p-5">
    <p className="text-sm text-gray-400">Wallet Status</p>

    <h3 className="mt-2 text-2xl font-bold text-blue-400">
      {walletHealth}
    </h3>
  </div>

</section>
{/* ========================================================== */}
{/* CONTACT SUPPORT */}
{/* ========================================================== */}

<section className="mb-10 rounded-3xl border border-yellow-500/20 bg-zinc-950 p-6">

  <h2 className="mb-6 text-2xl font-bold text-yellow-400">
    Contact GoldTrade Support
  </h2>

  <div className="grid gap-5 md:grid-cols-2">

    {/* WhatsApp */}

    <a
      href="https://wa.me/855000000000"
      target="_blank"
      rel="noopener noreferrer"
      className="rounded-2xl border border-green-500/20 bg-black p-5 transition hover:border-green-500"
    >
      <div className="flex items-center gap-4">

        <div className="rounded-full bg-green-600 p-3">
          <ArrowDownCircle className="h-6 w-6 text-white"/>
        </div>

        <div>
          <p className="font-semibold text-green-400">
            WhatsApp Support
          </p>

          <p className="text-sm text-gray-400">
            +855 XX XXX XXX
          </p>
        </div>

      </div>
    </a>

    {/* Telegram */}

    <a
      href="https://t.me/GoldTradeSupport"
      target="_blank"
      rel="noopener noreferrer"
      className="rounded-2xl border border-blue-500/20 bg-black p-5 transition hover:border-blue-500"
    >
      <div className="flex items-center gap-4">

        <div className="rounded-full bg-blue-600 p-3">
          <TrendingUp className="h-6 w-6 text-white"/>
        </div>

        <div>
          <p className="font-semibold text-blue-400">
            Telegram Support
          </p>

          <p className="text-sm text-gray-400">
            @GoldTradeSupport
          </p>
        </div>

      </div>
    </a>

  </div>

</section>
{/* ========================================================== */}
{/* SECURITY NOTICE */}
{/* ========================================================== */}

<section className="mb-10 rounded-3xl border border-orange-500/20 bg-zinc-950 p-6">

  <div className="flex items-start gap-4">

    <ShieldCheck className="mt-1 h-10 w-10 text-orange-400"/>

    <div>

      <h3 className="text-xl font-semibold text-orange-400">
        Security Notice
      </h3>

      <ul className="mt-3 space-y-2 text-sm text-gray-300">

        <li>• Never share your GoldTrade password or OTP.</li>

        <li>• Deposit receipts are verified by administrators.</li>

        <li>• Withdrawals require administrator approval.</li>

        <li>• JWT session expires automatically after logout.</li>

        <li>• Use only official GoldTrade support channels.</li>

      </ul>

    </div>

  </div>

</section>

    </main>
  );
}

