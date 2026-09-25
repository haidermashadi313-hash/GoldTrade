"use client";

// =====================================================
// GoldTrade V18 Enterprise
// USER DASHBOARD
// PART 1/8
// Production Version
// =====================================================

import { useEffect, useMemo, useState } from "react";

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
import router from "next/router";

// =====================================================
// API URL
// =====================================================

const API =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

// =====================================================
// TYPES
// =====================================================

interface UserInfo {
  username: string;
  fullName: string;
  email: string;
  role: string;
}

interface WalletData {
  pkrBalance: number;
  goldBalance: number;
  usdtBalance: number;
}

interface GoldMarket {
  buyPrice: number;
  sellPrice: number;
  marketStatus: "OPEN" | "CLOSED";
  goldTradingEnabled: boolean;
}

interface UsdtMarket {
  buyPrice: number;
  sellPrice: number;
  network: string;
  marketStatus: "OPEN" | "CLOSED";
  tradingEnabled: boolean;
}

interface TransactionItem {
  _id: string;
  type: string;
  amount: number;
  status: string;
  createdAt: string;
}

interface PortfolioSummary {
  totalPkrValue: number;
  goldValue: number;
  usdtValue: number;
}

// =====================================================
// COMPONENT
// =====================================================

export default function DashboardPage() {

  // ===================================================
  // AUTH
  // ===================================================

  const [token, setToken] = useState("");
  const [username, setUsername] = useState("");

  const [user, setUser] = useState<UserInfo>({
    username: "",
    fullName: "",
    email: "",
    role: "user",
  });
  // ===================================================
// LOAD LOGIN SESSION
// ===================================================

useEffect(() => {
  const savedToken = localStorage.getItem("token");
  const savedUsername = localStorage.getItem("username");
  const savedRole = localStorage.getItem("role");

  if (!savedToken) {
    router.replace("/login");
    return;
  }

  setToken(savedToken);
  setUsername(savedUsername || "");

  setUser((prev) => ({
    ...prev,
    username: savedUsername || "",
    role: (savedRole || "user") as "user" | "admin",
  }));
}, [router]);

  // ===================================================
  // WALLET
  // ===================================================

  const [wallet, setWallet] = useState<WalletData>({
    pkrBalance: 0,
    goldBalance: 0,
    usdtBalance: 0,
  });

  // ===================================================
  // GOLD MARKET
  // ===================================================

  const [goldMarket, setGoldMarket] = useState<GoldMarket>({
    buyPrice: 0,
    sellPrice: 0,
    marketStatus: "OPEN",
    goldTradingEnabled: true,
  });

  // ===================================================
  // USDT MARKET
  // ===================================================

  const [usdtMarket, setUsdtMarket] = useState<UsdtMarket>({
    buyPrice: 0,
    sellPrice: 0,
    network: "TRC20",
    marketStatus: "OPEN",
    tradingEnabled: true,
  });

  // ===================================================
  // PORTFOLIO
  // ===================================================

  const [portfolio, setPortfolio] =
    useState<PortfolioSummary>({
      totalPkrValue: 0,
      goldValue: 0,
      usdtValue: 0,
    });

  // ===================================================
  // TRANSACTIONS
  // ===================================================

  const [transactions, setTransactions] = useState<
    TransactionItem[]
  >([]);

  // ===================================================
  // UI STATES
  // ===================================================

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] =
    useState(false);

  const [errorMessage, setErrorMessage] =
    useState("");

  const [showBalance, setShowBalance] =
    useState(true);

  // ===================================================
  // TOKEN LOAD
  // ===================================================

  useEffect(() => {
    const savedToken = localStorage.getItem("token");
    const savedUsername =
      localStorage.getItem("username");

    if (!savedToken || !savedUsername) {
      window.location.href = "/login";
      return;
    }

    setToken(savedToken);
    setUsername(savedUsername);
  }, []);

  // ===================================================
  // AUTH HEADERS
  // ===================================================

  const getHeaders = useMemo(
    () => ({
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    }),
    [token]
  );

  // ===================================================
  // FORMAT FUNCTIONS
  // ===================================================

  const formatMoney = (value: number = 0) =>
    Number(value).toLocaleString("en-PK", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const formatGold = (value: number = 0) =>
    Number(value).toFixed(3);

  const formatUsdt = (value: number = 0) =>
    Number(value).toFixed(2);

  const formatDate = (date: string) =>
    new Date(date).toLocaleString("en-GB", {
      dateStyle: "medium",
      timeStyle: "short",
    });
    // ===================================================
// LOAD LOGIN SESSION
// ===================================================

useEffect(() => {
  const savedToken = localStorage.getItem("token");
  const savedUsername = localStorage.getItem("username");
  const savedRole = localStorage.getItem("role");

  if (!savedToken) {
    router.replace("/login");
    return;
  }

  setToken(savedToken);
  setUsername(savedUsername || "");

  setUser((prev) => ({
    ...prev,
    username: savedUsername || "",
    role: (savedRole || "user") as "user" | "admin",
  }));
}, [router]);

// ===================================================
// VERIFY TOKEN WITH BACKEND
// ===================================================

useEffect(() => {
  if (!token) return;

  const checkAuth = async () => {
    try {
      const response = await fetch(`${API}/api/auth/check`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        localStorage.clear();
        router.replace("/login");
        return;
      }

      setUser(data.user);
    } catch (err) {
      console.error("AUTH ERROR:", err);
      router.replace("/login");
    }
  };

  checkAuth();
}, [token, router]);

  // ===================================================
  // PORTFOLIO VALUE
  // ===================================================

  const totalPortfolioValue = useMemo(() => {
    return (
      Number(wallet.pkrBalance) +
      Number(wallet.goldBalance) *
        Number(goldMarket.sellPrice) +
      Number(wallet.usdtBalance) *
        Number(usdtMarket.sellPrice)
    );
  }, [wallet, goldMarket, usdtMarket]);
    // ===================================================
  // LOAD USER PROFILE
  // ===================================================

  const loadUserProfile = async (
    currentToken: string
  ) => {
    try {
      const response = await fetch(`${API}/api/auth/check`, {
        headers: {
          Authorization: `Bearer ${currentToken}`,
        },
        cache: "no-store",
      });

      const data = await response.json();

      console.log("USER PROFILE:", data);

      if (response.ok && data.success) {
        setUser({
          username: data.user.username,
          fullName: data.user.fullName || data.user.username,
          email: data.user.email || "",
          role: data.user.role || "user",
        });

        setUsername(data.user.username);
      } else {
        throw new Error(data.message || "Failed to load profile");
      }
    } catch (error: any) {
      console.error("PROFILE ERROR:", error);
      setErrorMessage(error.message);
    }
  };

  // ===================================================
  // LOAD PKR WALLET
  // ===================================================

  const loadWallet = async (
    currentUsername: string,
    currentToken: string
  ) => {
    try {
      const response = await fetch(
        `${API}/api/wallet/${currentUsername}`,
        {
          headers: {
            Authorization: `Bearer ${currentToken}`,
          },
          cache: "no-store",
        }
      );

      const data = await response.json();

      console.log("WALLET:", data);

      if (response.ok && data.success) {
        setWallet((prev) => ({
          ...prev,
          pkrBalance: Number(
            data.wallet?.balance ??
              data.wallet?.pkrBalance ??
              0
          ),
        }));
      }
    } catch (error) {
      console.error("WALLET ERROR:", error);
    }
  };

  // ===================================================
  // LOAD GOLD MARKET PRICE
  // ===================================================

  const loadGoldMarket = async () => {
    try {
      const response = await fetch(`${API}/api/gold/price`, {
        cache: "no-store",
      });

      const data = await response.json();

      console.log("GOLD MARKET:", data);

      if (response.ok && data.success) {
        setGoldMarket({
          buyPrice: Number(data.buyPrice || 0),
          sellPrice: Number(data.sellPrice || 0),
          marketStatus: data.marketStatus || "OPEN",
          goldTradingEnabled:
            data.goldTradingEnabled ?? true,
        });
      }
    } catch (error) {
      console.error("GOLD MARKET ERROR:", error);
    }
  };

  // ===================================================
  // LOAD USDT MARKET PRICE
  // ===================================================

  const loadUsdtMarket = async () => {
    try {
      const response = await fetch(`${API}/api/usdt/price`, {
        cache: "no-store",
      });

      const data = await response.json();

      console.log("USDT MARKET:", data);

      if (response.ok && data.success) {
        setUsdtMarket({
          buyPrice: Number(data.buyPrice || 0),
          sellPrice: Number(data.sellPrice || 0),
          network: data.network || "TRC20",
          marketStatus: data.marketStatus || "OPEN",
          tradingEnabled:
            data.tradingEnabled ?? true,
        });
      }
    } catch (error) {
      console.error("USDT MARKET ERROR:", error);
    }
  };

  // ===================================================
  // AUTH CHECK
  // ===================================================

  const verifyLogin = async (
    currentToken: string
  ) => {
    try {
      const response = await fetch(
        `${API}/api/auth/me`,
        {
          headers: {
            Authorization: `Bearer ${currentToken}`,
          },
        }
      );

      if (!response.ok) {
        localStorage.removeItem("token");
        localStorage.removeItem("username");
        window.location.href = "/login";
      }
    } catch {
      localStorage.removeItem("token");
      localStorage.removeItem("username");
      window.location.href = "/login";
    }
  };
    // ===================================================
  // LOAD GOLD PORTFOLIO
  // ===================================================

  const loadGoldPortfolio = async (
    currentUsername: string,
    currentToken: string
  ) => {
    try {
      const response = await fetch(
        `${API}/api/gold/portfolio/${currentUsername}`,
        {
          headers: {
            Authorization: `Bearer ${currentToken}`,
          },
          cache: "no-store",
        }
      );

      const data = await response.json();

      console.log("GOLD PORTFOLIO:", data);

      if (response.ok && data.success) {
        const balance = Number(
          data.portfolio?.goldBalance ??
            data.portfolio?.balance ??
            0
        );

        setWallet((prev) => ({
          ...prev,
          goldBalance: balance,
        }));

        setPortfolio((prev) => ({
          ...prev,
          goldValue:
            balance * Number(goldMarket.sellPrice || 0),
        }));
      }
    } catch (error) {
      console.error("GOLD PORTFOLIO ERROR:", error);
    }
  };

  // ===================================================
  // LOAD USDT PORTFOLIO
  // ===================================================

  const loadUsdtPortfolio = async (
    currentUsername: string,
    currentToken: string
  ) => {
    try {
      const response = await fetch(
        `${API}/api/usdt/portfolio/${currentUsername}`,
        {
          headers: {
            Authorization: `Bearer ${currentToken}`,
          },
          cache: "no-store",
        }
      );

      const data = await response.json();

      console.log("USDT PORTFOLIO:", data);

      if (response.ok && data.success) {
        const balance = Number(
          data.portfolio?.usdtBalance ??
            data.portfolio?.balance ??
            0
        );

        setWallet((prev) => ({
          ...prev,
          usdtBalance: balance,
        }));

        setPortfolio((prev) => ({
          ...prev,
          usdtValue:
            balance * Number(usdtMarket.sellPrice || 0),
        }));
      }
    } catch (error) {
      console.error("USDT PORTFOLIO ERROR:", error);
    }
  };

  // ===================================================
  // LOAD RECENT TRANSACTIONS
  // ===================================================

  const loadTransactions = async (
    currentUsername: string,
    currentToken: string
  ) => {
    try {
      const response = await fetch(
        `${API}/api/transactions/${currentUsername}`,
        {
          headers: {
            Authorization: `Bearer ${currentToken}`,
          },
          cache: "no-store",
        }
      );

      const data = await response.json();

      console.log("TRANSACTIONS:", data);

      if (response.ok && data.success) {
        setTransactions(
          Array.isArray(data.transactions)
            ? data.transactions.slice(0, 10)
            : []
        );
      } else {
        setTransactions([]);
      }
    } catch (error) {
      console.error("TRANSACTIONS ERROR:", error);
      setTransactions([]);
    }
  };

  // ===================================================
  // LOAD COMPLETE PORTFOLIO VALUE
  // ===================================================

  const calculatePortfolio = (
    walletData: WalletData,
    goldPrice: number,
    usdtPrice: number
  ) => {
    const goldValue =
      Number(walletData.goldBalance) * Number(goldPrice);

    const usdtValue =
      Number(walletData.usdtBalance) * Number(usdtPrice);

    const totalValue =
      Number(walletData.pkrBalance) +
      goldValue +
      usdtValue;

    setPortfolio({
      goldValue,
      usdtValue,
      totalPkrValue: totalValue,
    });
  };

  // ===================================================
  // UPDATE PORTFOLIO WHEN MARKET CHANGES
  // ===================================================

  useEffect(() => {
    calculatePortfolio(
      wallet,
      goldMarket.sellPrice,
      usdtMarket.sellPrice
    );
  }, [
    wallet,
    goldMarket.sellPrice,
    usdtMarket.sellPrice,
  ]);

  // ===================================================
  // TOTAL ASSETS COUNTER
  // ===================================================

  const totalAssets = useMemo(() => {
    return (
      Number(wallet.pkrBalance) +
      Number(portfolio.goldValue) +
      Number(portfolio.usdtValue)
    );
  }, [wallet, portfolio]);

  // ===================================================
  // MARKET STATUS HELPERS
  // ===================================================

  const goldMarketOpen =
    goldMarket.marketStatus === "OPEN" &&
    goldMarket.goldTradingEnabled;

  const usdtMarketOpen =
    usdtMarket.marketStatus === "OPEN" &&
    usdtMarket.tradingEnabled;
      // ===================================================
  // LOAD COMPLETE USER DASHBOARD
  // ===================================================

  const loadDashboard = async (
    currentUsername: string,
    currentToken: string
  ) => {
    if (!currentUsername || !currentToken) return;

    try {
      setLoading(true);
      setErrorMessage("");

      // Verify token first
      await verifyLogin(currentToken);

      // Load market prices first
      await Promise.all([
        loadGoldMarket(),
        loadUsdtMarket(),
      ]);

      // Load user related data
      await Promise.all([
        loadUserProfile(currentToken),
        loadWallet(currentUsername, currentToken),
        loadGoldPortfolio(currentUsername, currentToken),
        loadUsdtPortfolio(currentUsername, currentToken),
        loadTransactions(currentUsername, currentToken),
      ]);

    } catch (error: any) {
      console.error("DASHBOARD ERROR:", error);

      setErrorMessage(
        error.message || "Failed to load dashboard."
      );

    } finally {
      setLoading(false);
    }
  };

  // ===================================================
  // REFRESH DASHBOARD
  // ===================================================

  const refreshDashboard = async () => {
    if (!username || !token) return;

    try {
      setRefreshing(true);

      await loadDashboard(username, token);

    } finally {
      setRefreshing(false);
    }
  };

  // ===================================================
  // INITIAL DASHBOARD LOAD
  // ===================================================

  useEffect(() => {
    if (!username || !token) return;

    loadDashboard(username, token);
  }, [username, token]);

  // ===================================================
  // AUTO REFRESH EVERY 60 SECONDS
  // ===================================================

  useEffect(() => {
    if (!username || !token) return;

    const interval = setInterval(() => {
      loadDashboard(username, token);
    }, 60000);

    return () => clearInterval(interval);
  }, [username, token]);

  // ===================================================
  // CLEAR ERROR AFTER 5 SECONDS
  // ===================================================

  useEffect(() => {
    if (!errorMessage) return;

    const timer = setTimeout(() => {
      setErrorMessage("");
    }, 5000);

    return () => clearTimeout(timer);
  }, [errorMessage]);

  // ===================================================
  // QUICK ACTION NAVIGATION
  // ===================================================

  const goToDeposit = () => {
    window.location.href = "/deposit";
  };

  const goToWithdraw = () => {
    window.location.href = "/withdraw";
  };

  const goToGold = () => {
    window.location.href = "/gold";
  };

  const goToUsdt = () => {
    window.location.href = "/usdt";
  };

  const goToTransactions = () => {
    window.location.href = "/transactions";
  };

  // ===================================================
  // BALANCE VISIBILITY
  // ===================================================

  const toggleBalanceVisibility = () => {
    setShowBalance((prev) => !prev);
  };
    // =====================================================
  // PAGE UI START
  // =====================================================

  return (
    <div className="min-h-screen bg-[#0B1120] text-white p-6">

      {/* ========================================== */}
      {/* HEADER */}
      {/* ========================================== */}

      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5 mb-8">

        <div>
          <h1 className="text-3xl font-bold text-yellow-400">
            GoldTrade V18 Enterprise Dashboard
          </h1>

          <p className="text-gray-400 mt-2">
            Welcome back, {user.fullName || username}
          </p>

          <p className="text-gray-500 text-sm mt-1">
            Username:
            <span className="text-green-400 ml-2 font-semibold">
              {user.username}
            </span>
          </p>
        </div>

        <div className="flex flex-wrap gap-3">

          {/* Hide / Show Balance */}

          <button
            onClick={toggleBalanceVisibility}
            className="flex items-center gap-2 bg-[#1F2937] hover:bg-[#374151] px-5 py-3 rounded-xl border border-gray-700 transition"
          >
            {showBalance ? (
              <Eye size={18} />
            ) : (
              <EyeOff size={18} />
            )}

            {showBalance ? "Hide Balance" : "Show Balance"}
          </button>

          {/* Refresh */}

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

      {/* ========================================== */}
      {/* ERROR ALERT */}
      {/* ========================================== */}

      {errorMessage && (
        <div className="mb-6 bg-red-600/20 border border-red-500 rounded-xl px-4 py-3 text-red-300">
          {errorMessage}
        </div>
      )}

      {/* ========================================== */}
      {/* TOTAL PORTFOLIO CARD */}
      {/* ========================================== */}

      <div className="rounded-3xl bg-gradient-to-r from-yellow-500 to-orange-500 text-black p-7 mb-8 shadow-xl">

        <div className="flex justify-between items-start">

          <div>

            <p className="uppercase tracking-widest text-sm font-semibold">
              Total Portfolio Value
            </p>

            <h2 className="text-4xl font-bold mt-3">
              PKR{" "}
              {showBalance
                ? formatMoney(totalAssets)
                : "********"}
            </h2>

            <p className="mt-3 text-black/70 text-sm">
              Combined PKR + Gold + USDT Assets
            </p>

          </div>

          <Shield size={42} />

        </div>

      </div>

      {/* ========================================== */}
      {/* WALLET BALANCE CARDS */}
      {/* ========================================== */}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 mb-8">

        {/* PKR WALLET */}

        <div className="rounded-2xl bg-[#111827] border border-green-600/20 p-6">

          <div className="flex justify-between items-center mb-4">
            <Wallet className="text-green-400" size={30} />
            <span className="text-green-400 text-xs font-semibold">
              PKR WALLET
            </span>
          </div>

          <p className="text-gray-400 text-sm">
            Available Balance
          </p>

          <h3 className="text-3xl font-bold text-green-400 mt-2">
            {showBalance
              ? `PKR ${formatMoney(wallet.pkrBalance)}`
              : "********"}
          </h3>

        </div>

        {/* GOLD WALLET */}

        <div className="rounded-2xl bg-[#111827] border border-yellow-600/20 p-6">

          <div className="flex justify-between items-center mb-4">
            <Coins className="text-yellow-400" size={30} />
            <span className="text-yellow-400 text-xs font-semibold">
              GOLD WALLET
            </span>
          </div>

          <p className="text-gray-400 text-sm">
            Gold Balance
          </p>

          <h3 className="text-3xl font-bold text-yellow-400 mt-2">
            {showBalance
              ? `${formatGold(wallet.goldBalance)} Gold`
              : "********"}
          </h3>

          <p className="text-sm text-gray-500 mt-2">
            PKR{" "}
            {showBalance
              ? formatMoney(portfolio.goldValue)
              : "********"}
          </p>

        </div>

        {/* USDT WALLET */}

        <div className="rounded-2xl bg-[#111827] border border-cyan-600/20 p-6">

          <div className="flex justify-between items-center mb-4">
            <DollarSign className="text-cyan-400" size={30} />
            <span className="text-cyan-400 text-xs font-semibold">
              USDT WALLET
            </span>
          </div>

          <p className="text-gray-400 text-sm">
            USDT Balance
          </p>

          <h3 className="text-3xl font-bold text-cyan-400 mt-2">
            {showBalance
              ? `${formatUsdt(wallet.usdtBalance)} USDT`
              : "********"}
          </h3>

          <p className="text-sm text-gray-500 mt-2">
            PKR{" "}
            {showBalance
              ? formatMoney(portfolio.usdtValue)
              : "********"}
          </p>

        </div>

      </div>

      {/* ========================================== */}
      {/* PORTFOLIO SUMMARY */}
      {/* ========================================== */}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">

        {/* TOTAL GOLD VALUE */}

        <div className="rounded-2xl bg-[#111827] border border-yellow-500/20 p-6">

          <div className="flex items-center justify-between mb-3">
            <TrendingUp className="text-yellow-400" size={24} />
            <span className="text-yellow-400 text-xs font-semibold">
              GOLD VALUE
            </span>
          </div>

          <h3 className="text-2xl font-bold text-yellow-400">
            {showBalance
              ? `PKR ${formatMoney(portfolio.goldValue)}`
              : "********"}
          </h3>

          <p className="text-gray-500 text-sm mt-2">
            Current Gold Holdings Value
          </p>

        </div>

        {/* TOTAL USDT VALUE */}

        <div className="rounded-2xl bg-[#111827] border border-cyan-500/20 p-6">

          <div className="flex items-center justify-between mb-3">
            <TrendingUp className="text-cyan-400" size={24} />
            <span className="text-cyan-400 text-xs font-semibold">
              USDT VALUE
            </span>
          </div>

          <h3 className="text-2xl font-bold text-cyan-400">
            {showBalance
              ? `PKR ${formatMoney(portfolio.usdtValue)}`
              : "********"}
          </h3>

          <p className="text-gray-500 text-sm mt-2">
            Current USDT Holdings Value
          </p>

        </div>

        {/* TOTAL PKR VALUE */}

        <div className="rounded-2xl bg-[#111827] border border-green-500/20 p-6">

          <div className="flex items-center justify-between mb-3">
            <Activity className="text-green-400" size={24} />
            <span className="text-green-400 text-xs font-semibold">
              TOTAL ASSETS
            </span>
          </div>

          <h3 className="text-2xl font-bold text-green-400">
            {showBalance
              ? `PKR ${formatMoney(totalAssets)}`
              : "********"}
          </h3>

          <p className="text-gray-500 text-sm mt-2">
            Total Account Assets
          </p>

        </div>

      </div>

      {/* ========================================== */}
      {/* MARKET SECTION START */}
      {/* ========================================== */}

      <div className="space-y-8">        {/* ========================================== */}
        {/* LIVE GOLD MARKET */}
        {/* ========================================== */}

        <div className="rounded-2xl bg-[#111827] border border-yellow-600/20 p-6">

          <div className="flex items-center justify-between mb-6">

            <div className="flex items-center gap-3">
              <Coins className="text-yellow-400" size={28} />

              <h2 className="text-2xl font-bold text-yellow-400">
                Live Gold Market
              </h2>
            </div>

            <span
              className={`px-4 py-2 rounded-full text-sm font-semibold ${
                goldMarketOpen
                  ? "bg-green-600 text-white"
                  : "bg-red-600 text-white"
              }`}
            >
              {goldMarketOpen ? "MARKET OPEN" : "MARKET CLOSED"}
            </span>

          </div>

          <div className="grid md:grid-cols-2 gap-5">

            {/* BUY PRICE */}

            <div className="bg-[#1F2937] rounded-xl p-5 border border-green-600/20">

              <div className="flex justify-between items-center">

                <div>
                  <p className="text-gray-400 text-sm">
                    Buy Gold Price
                  </p>

                  <h3 className="text-3xl font-bold text-green-400 mt-2">
                    PKR {formatMoney(goldMarket.buyPrice)}
                  </h3>
                </div>

                <TrendingUp
                  className="text-green-400"
                  size={34}
                />

              </div>

            </div>

            {/* SELL PRICE */}

            <div className="bg-[#1F2937] rounded-xl p-5 border border-red-600/20">

              <div className="flex justify-between items-center">

                <div>
                  <p className="text-gray-400 text-sm">
                    Sell Gold Price
                  </p>

                  <h3 className="text-3xl font-bold text-red-400 mt-2">
                    PKR {formatMoney(goldMarket.sellPrice)}
                  </h3>
                </div>

                <TrendingDown
                  className="text-red-400"
                  size={34}
                />

              </div>

            </div>

          </div>

        </div>

        {/* ========================================== */}
        {/* LIVE USDT MARKET */}
        {/* ========================================== */}

        <div className="rounded-2xl bg-[#111827] border border-cyan-600/20 p-6">

          <div className="flex items-center justify-between mb-6">

            <div className="flex items-center gap-3">
              <DollarSign className="text-cyan-400" size={28} />

              <h2 className="text-2xl font-bold text-cyan-400">
                Live USDT Market
              </h2>
            </div>

            <span
              className={`px-4 py-2 rounded-full text-sm font-semibold ${
                usdtMarketOpen
                  ? "bg-green-600 text-white"
                  : "bg-red-600 text-white"
              }`}
            >
              {usdtMarketOpen ? "MARKET OPEN" : "MARKET CLOSED"}
            </span>

          </div>

          <div className="grid md:grid-cols-2 gap-5">

            {/* BUY PRICE */}

            <div className="bg-[#1F2937] rounded-xl p-5 border border-green-600/20">

              <div className="flex justify-between items-center">

                <div>
                  <p className="text-gray-400 text-sm">
                    Buy USDT Price
                  </p>

                  <h3 className="text-3xl font-bold text-green-400 mt-2">
                    PKR {formatMoney(usdtMarket.buyPrice)}
                  </h3>
                </div>

                <TrendingUp
                  className="text-green-400"
                  size={34}
                />

              </div>

            </div>

            {/* SELL PRICE */}

            <div className="bg-[#1F2937] rounded-xl p-5 border border-red-600/20">

              <div className="flex justify-between items-center">

                <div>
                  <p className="text-gray-400 text-sm">
                    Sell USDT Price
                  </p>

                  <h3 className="text-3xl font-bold text-red-400 mt-2">
                    PKR {formatMoney(usdtMarket.sellPrice)}
                  </h3>
                </div>

                <TrendingDown
                  className="text-red-400"
                  size={34}
                />

              </div>

            </div>

          </div>

          {/* NETWORK */}

          <div className="mt-5 bg-[#1F2937] rounded-xl p-5 border border-cyan-500/20">

            <div className="flex items-center justify-between">

              <div>
                <p className="text-gray-400 text-sm">
                  Active Network
                </p>

                <h3 className="text-2xl font-bold text-cyan-400 mt-2">
                  {usdtMarket.network}
                </h3>
              </div>

              <Wallet className="text-cyan-400" size={34} />

            </div>

          </div>

        </div>

        {/* ========================================== */}
        {/* QUICK ACTIONS */}
        {/* ========================================== */}

        <div className="rounded-2xl bg-[#111827] border border-gray-700 p-6">

          <h2 className="text-2xl font-bold text-yellow-400 mb-6">
            Quick Actions
          </h2>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">

            {/* DEPOSIT */}

            <button
              onClick={goToDeposit}
              className="bg-green-600 hover:bg-green-700 rounded-2xl p-5 transition text-center"
            >
              <ArrowDownLeft
                size={34}
                className="mx-auto mb-3"
              />

              <p className="font-semibold">
                Deposit
              </p>

              <p className="text-sm opacity-80 mt-1">
                Add Funds
              </p>

            </button>

            {/* WITHDRAW */}

            <button
              onClick={goToWithdraw}
              className="bg-red-600 hover:bg-red-700 rounded-2xl p-5 transition text-center"
            >
              <ArrowUpRight
                size={34}
                className="mx-auto mb-3"
              />

              <p className="font-semibold">
                Withdraw
              </p>

              <p className="text-sm opacity-80 mt-1">
                Cash Out
              </p>

            </button>

            {/* BUY GOLD */}

            <button
              onClick={goToGold}
              className="bg-yellow-500 hover:bg-yellow-600 rounded-2xl p-5 transition text-black text-center"
            >
              <Coins
                size={34}
                className="mx-auto mb-3"
              />

              <p className="font-semibold">
                Buy / Sell Gold
              </p>

              <p className="text-sm opacity-80 mt-1">
                Gold Market
              </p>

            </button>

            {/* BUY USDT */}

            <button
              onClick={goToUsdt}
              className="bg-cyan-500 hover:bg-cyan-600 rounded-2xl p-5 transition text-black text-center"
            >
              <DollarSign
                size={34}
                className="mx-auto mb-3"
              />

              <p className="font-semibold">
                Buy / Sell USDT
              </p>

              <p className="text-sm opacity-80 mt-1">
                Crypto Market
              </p>

            </button>

          </div>

        </div>

        {/* ========================================== */}
        {/* ACCOUNT STATUS */}
        {/* ========================================== */}

        <div className="grid md:grid-cols-3 gap-5">

          {/* ACCOUNT */}

          <div className="rounded-2xl bg-[#111827] border border-blue-600/20 p-5">

            <div className="flex justify-between items-center mb-3">

              <User className="text-blue-400" size={28} />

              <CheckCircle
                className="text-green-400"
                size={22}
              />

            </div>

            <p className="text-gray-400 text-sm">
              Account Status
            </p>

            <h3 className="text-xl font-bold text-green-400 mt-2">
              VERIFIED
            </h3>

          </div>

          {/* GOLD MARKET */}

          <div className="rounded-2xl bg-[#111827] border border-yellow-600/20 p-5">

            <div className="flex justify-between items-center mb-3">

              <Coins className="text-yellow-400" size={28} />

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
              Gold Trading
            </p>

            <h3
              className={`text-xl font-bold mt-2 ${
                goldMarketOpen
                  ? "text-green-400"
                  : "text-red-400"
              }`}
            >
              {goldMarketOpen ? "ACTIVE" : "CLOSED"}
            </h3>

          </div>

          {/* USDT MARKET */}

          <div className="rounded-2xl bg-[#111827] border border-cyan-600/20 p-5">

            <div className="flex justify-between items-center mb-3">

              <DollarSign className="text-cyan-400" size={28} />

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
              USDT Trading
            </p>

            <h3
              className={`text-xl font-bold mt-2 ${
                usdtMarketOpen
                  ? "text-green-400"
                  : "text-red-400"
              }`}
            >
              {usdtMarketOpen ? "ACTIVE" : "CLOSED"}
            </h3>

          </div>

        </div>
                {/* ========================================== */}
        {/* RECENT TRANSACTIONS */}
        {/* ========================================== */}

        <div className="rounded-2xl bg-[#111827] border border-gray-700 p-6">

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">

            <div className="flex items-center gap-3">
              <History className="text-yellow-400" size={28} />

              <div>
                <h2 className="text-2xl font-bold text-yellow-400">
                  Recent Transactions
                </h2>

                <p className="text-gray-400 text-sm">
                  Your latest Deposit, Withdraw, Gold & USDT activities.
                </p>
              </div>
            </div>

            <button
              onClick={goToTransactions}
              className="bg-[#1F2937] hover:bg-[#374151] border border-gray-600 px-5 py-3 rounded-xl text-sm font-semibold transition"
            >
              View All Transactions
            </button>

          </div>

          {/* ========================================== */}
          {/* LOADING STATE */}
          {/* ========================================== */}

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

            /* ====================================== */
            /* EMPTY STATE */
            /* ====================================== */

            <div className="text-center py-14">

              <History
                size={50}
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

            /* ====================================== */
            /* TRANSACTION TABLE */
            /* ====================================== */

            <div className="overflow-x-auto rounded-xl border border-gray-700">

              <table className="w-full">

                <thead className="bg-[#1F2937]">

                  <tr className="text-left text-gray-300">

                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Amount</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Date</th>

                  </tr>

                </thead>

                <tbody>

                  {transactions.map((tx) => {

                    const type = tx.type.toUpperCase();
                    const status = tx.status.toUpperCase();

                    const isDeposit =
                      type.includes("DEPOSIT");

                    const isWithdraw =
                      type.includes("WITHDRAW");

                    const isGold =
                      type.includes("GOLD");

                    const isUsdt =
                      type.includes("USDT");

                    return (
                      <tr
                        key={tx._id}
                        className="border-t border-gray-700 hover:bg-[#1B2433] transition"
                      >

                        {/* TYPE */}

                        <td className="px-4 py-4">

                          <div className="flex items-center gap-3">

                            {isDeposit && (
                              <ArrowDownLeft
                                className="text-green-400"
                                size={20}
                              />
                            )}

                            {isWithdraw && (
                              <ArrowUpRight
                                className="text-red-400"
                                size={20}
                              />
                            )}

                            {isGold && (
                              <Coins
                                className="text-yellow-400"
                                size={20}
                              />
                            )}

                            {isUsdt && (
                              <DollarSign
                                className="text-cyan-400"
                                size={20}
                              />
                            )}

                            {!isDeposit &&
                              !isWithdraw &&
                              !isGold &&
                              !isUsdt && (
                                <Wallet
                                  className="text-gray-400"
                                  size={20}
                                />
                              )}

                            <span className="font-semibold capitalize">
                              {tx.type}
                            </span>

                          </div>

                        </td>

                        {/* AMOUNT */}

                        <td className="px-4 py-4 font-semibold">

                          {showBalance
                            ? formatMoney(tx.amount)
                            : "********"}

                        </td>

                        {/* STATUS */}

                        <td className="px-4 py-4">

                          <span
                            className={`px-3 py-1 rounded-full text-xs font-bold ${
                              status === "APPROVED" ||
                              status === "COMPLETED" ||
                              status === "SUCCESS"
                                ? "bg-green-600 text-white"
                                : status === "PENDING"
                                ? "bg-yellow-500 text-black"
                                : "bg-red-600 text-white"
                            }`}
                          >
                            {tx.status}
                          </span>

                        </td>

                        {/* DATE */}

                        <td className="px-4 py-4 text-gray-400 text-sm">
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

        {/* ========================================== */}
        {/* PORTFOLIO ACTIVITY SUMMARY */}
        {/* ========================================== */}

        <div className="rounded-2xl bg-[#111827] border border-gray-700 p-6">

          <h2 className="text-2xl font-bold text-green-400 mb-6">
            Portfolio Activity Summary
          </h2>

          <div className="grid md:grid-cols-3 gap-5">

            {/* PKR */}

            <div className="bg-[#1F2937] rounded-xl p-5 border border-green-600/20">

              <p className="text-gray-400 text-sm mb-2">
                PKR Balance
              </p>

              <h3 className="text-2xl font-bold text-green-400">
                {showBalance
                  ? `PKR ${formatMoney(wallet.pkrBalance)}`
                  : "********"}
              </h3>

            </div>

            {/* GOLD */}

            <div className="bg-[#1F2937] rounded-xl p-5 border border-yellow-600/20">

              <p className="text-gray-400 text-sm mb-2">
                Gold Holdings
              </p>

              <h3 className="text-2xl font-bold text-yellow-400">
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

              <p className="text-gray-400 text-sm mb-2">
                USDT Holdings
              </p>

              <h3 className="text-2xl font-bold text-cyan-400">
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

        </div>        {/* ========================================== */}
        {/* LAST LOGIN / ACCOUNT INFO */}
        {/* ========================================== */}

        <div className="rounded-2xl bg-[#111827] border border-gray-700 p-6">

          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">

            <div>

              <h2 className="text-xl font-bold text-yellow-400 mb-2">
                Account Information
              </h2>

              <p className="text-gray-400 text-sm">
                Logged in User
              </p>

              <p className="text-green-400 font-semibold mt-1">
                {user.fullName}
              </p>

              <p className="text-gray-500 text-sm mt-2">
                @{user.username}
              </p>

              <p className="text-gray-500 text-sm">
                {user.email}
              </p>

            </div>

            <div className="text-right">

              <p className="text-gray-400 text-sm">
                Account Type
              </p>

              <span className="inline-flex items-center gap-2 mt-2 bg-green-600/20 border border-green-500/30 px-4 py-2 rounded-full text-green-400 font-semibold">

                <Shield size={16} />

                {user.role.toUpperCase()}

              </span>

            </div>

          </div>

        </div>

      </div>

      {/* ========================================== */}
      {/* LOADING OVERLAY */}
      {/* ========================================== */}

      {(loading || refreshing) && (
        <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center">

          <div className="bg-[#111827] border border-yellow-500/30 rounded-2xl px-8 py-6 flex flex-col items-center gap-4 shadow-2xl">

            <RefreshCw
              size={38}
              className="animate-spin text-yellow-400"
            />

            <h3 className="text-xl font-bold text-yellow-400">
              GoldTrade V18 Enterprise
            </h3>

            <p className="text-gray-300">
              {refreshing
                ? "Refreshing dashboard..."
                : "Loading dashboard..."}
            </p>

          </div>

        </div>
      )}

      {/* ========================================== */}
      {/* FOOTER */}
      {/* ========================================== */}

      <footer className="mt-12 border-t border-gray-800 pt-6">

        <div className="flex flex-col lg:flex-row justify-between items-center gap-4">

          <div>

            <h3 className="text-yellow-400 font-bold text-lg">
              GoldTrade V18 Enterprise
            </h3>

            <p className="text-gray-500 text-sm">
              PKR • GOLD • USDT Trading Platform
            </p>

          </div>

          <div className="flex flex-wrap gap-5 text-sm text-gray-400">

            <div className="flex items-center gap-2">
              <Shield size={16} className="text-green-400" />
              Secure Wallet
            </div>

            <div className="flex items-center gap-2">
              <Coins size={16} className="text-yellow-400" />
              Live Gold Market
            </div>

            <div className="flex items-center gap-2">
              <DollarSign size={16} className="text-cyan-400" />
              Live USDT Market
            </div>

            <div className="flex items-center gap-2">
              <Activity size={16} className="text-blue-400" />
              Enterprise Dashboard
            </div>

          </div>

        </div>

        <div className="mt-6 text-center text-gray-600 text-sm">

          © {new Date().getFullYear()} GoldTrade V18 Enterprise

          <p className="mt-2">
            Secure Digital Trading Platform for PKR, Gold & USDT.
          </p>

        </div>

      </footer>

    </div>
  );
}