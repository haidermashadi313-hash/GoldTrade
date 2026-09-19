"use client";

// =====================================================
// GoldTrade V18 DIGITAL Wallet
// FRONTEND : Wallet PAGE
// PART 1/8 — IMPORTS + API + TYPES
// =====================================================

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

// =====================================================
// API CONFIGURATION
// =====================================================

const API =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

// =====================================================
// Wallet TYPES
// =====================================================

interface WalletData {
  PkrBalance: number;
  usdtBalance: number;
  goldBalance: number;
}

interface WalletResponse {
  success: boolean;
  Wallet: WalletData;
}

interface GoldPriceResponse {
  success: boolean;
  buyPrice: number;
  sellPrice: number;
}

interface UsdtRateResponse {
  success: boolean;
  rate: number;
}

interface WalletTransaction {
  _id: string;
  type: string;
  amount: number;
  currency: "Pkr" | "USDT" | "GOLD";
  status: "Pending" | "Approved" | "Rejected";
  createdAt: string;
}

interface WalletHistoryResponse {
  success: boolean;
  transactions: WalletTransaction[];
}

// =====================================================
// Wallet PAGE COMPONENT
// =====================================================

export default function WalletPage() {
    // =====================================================
  // AUTHENTICATION STATE
  // =====================================================

  const [username, setUsername] = useState<string>("");
  const [token, setToken] = useState<string>("");

  // =====================================================
  // Wallet STATE
  // =====================================================

  const [Wallet, setWallet] = useState<WalletData>({
    PkrBalance: 0,
    usdtBalance: 0,
    goldBalance: 0,
  });

  // =====================================================
  // LIVE MARKET STATE
  // =====================================================

  const [usdtRate, setUsdtRate] = useState<number>(280);
  const [goldPrice, setGoldPrice] = useState<number>(0);

  // =====================================================
  // Wallet HISTORY STATE
  // =====================================================

  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);

  // =====================================================
  // UI STATE
  // =====================================================

  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const [successMessage, setSuccessMessage] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");

  // =====================================================
  // PORTFOLIO CALCULATIONS
  // =====================================================

  const usdtValue = useMemo(() => {
    return Wallet.usdtBalance * usdtRate;
  }, [Wallet.usdtBalance, usdtRate]);

  const goldValue = useMemo(() => {
    return Wallet.goldBalance * goldPrice;
  }, [Wallet.goldBalance, goldPrice]);

  const totalPortfolioValue = useMemo(() => {
    return Wallet.PkrBalance + usdtValue + goldValue;
  }, [Wallet.PkrBalance, usdtValue, goldValue]);

  // =====================================================
  // TRANSACTION STATISTICS
  // =====================================================

  const pendingTransactions = useMemo(() => {
    return transactions.filter((tx) => tx.status === "Pending").length;
  }, [transactions]);

  const approvedTransactions = useMemo(() => {
    return transactions.filter((tx) => tx.status === "Approved").length;
  }, [transactions]);

  const rejectedTransactions = useMemo(() => {
    return transactions.filter((tx) => tx.status === "Rejected").length;
  }, [transactions]);

  // =====================================================
  // TODAY DATE
  // =====================================================

  const today = useMemo(() => {
    return new Date().toLocaleDateString("en-PK", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  }, []);

  // =====================================================
  // FORMAT HELPERS
  // =====================================================

  const formatCurrency = (amount: number) => {
    return Number(amount || 0).toLocaleString("en-PK");
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString("en-PK", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };
    // =====================================================
  // LOAD USER Wallet
  // GET /api/Wallet/:username
  // =====================================================

  const loadWallet = async (
    currentUsername: string,
    currentToken: string
  ) => {
    try {
      const response = await fetch(
        `${API}/api/Wallet/${currentUsername}`,
        {
          headers: {
            Authorization: `Bearer ${currentToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Wallet API failed (${response.status})`);
      }

      const data: WalletResponse = await response.json();

      if (data.success) {
        setWallet({
          PkrBalance: Number(data.Wallet?.PkrBalance ?? 0),
          usdtBalance: Number(data.Wallet?.usdtBalance ?? 0),
          goldBalance: Number(data.Wallet?.goldBalance ?? 0),
        });
      }
    } catch (error) {
      console.error("LOAD Wallet ERROR:", error);
      setErrorMessage("Unable to load Wallet balance.");
    }
  };

  // =====================================================
  // LOAD LIVE USDT RATE
  // GET /api/usdt/rate
  // =====================================================

  const loadUsdtRate = async () => {
    try {
      const response = await fetch(`${API}/api/usdt/rate`);

      if (!response.ok) {
        throw new Error(`USDT Rate API failed (${response.status})`);
      }

      const data: UsdtRateResponse = await response.json();

      if (data.success) {
        setUsdtRate(Number(data.rate ?? 280));
      }
    } catch (error) {
      console.error("USDT RATE ERROR:", error);
    }
  };

  // =====================================================
  // LOAD LIVE GOLD PRICE
  // GET /api/gold/price
  // =====================================================

  const loadGoldPrice = async () => {
    try {
      const response = await fetch(`${API}/api/gold/price`);

      if (!response.ok) {
        throw new Error(`Gold Price API failed (${response.status})`);
      }

      const data: GoldPriceResponse = await response.json();

      if (data.success) {
        setGoldPrice(Number(data.buyPrice ?? 0));
      }
    } catch (error) {
      console.error("GOLD PRICE ERROR:", error);
    }
  };

  // =====================================================
  // LOAD Wallet HISTORY
  // GET /api/Wallet/history/:username
  // =====================================================

  const loadHistory = async (
    currentUsername: string,
    currentToken: string
  ) => {
    try {
      const response = await fetch(
        `${API}/api/Wallet/history/${currentUsername}`,
        {
          headers: {
            Authorization: `Bearer ${currentToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Wallet History API failed (${response.status})`);
      }

      const data: WalletHistoryResponse = await response.json();

      if (data.success) {
        setTransactions(data.transactions ?? []);
      } else {
        setTransactions([]);
      }
    } catch (error) {
      console.error("Wallet HISTORY ERROR:", error);
      setTransactions([]);
    }
  };
    // =====================================================
  // LOAD COMPLETE Wallet DASHBOARD
  // =====================================================

  const loadDashboard = async (
    currentUsername: string,
    currentToken: string
  ) => {
    if (!currentUsername || !currentToken) return;

    setLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      await Promise.all([
        loadWallet(currentUsername, currentToken),
        loadUsdtRate(),
        loadGoldPrice(),
        loadHistory(currentUsername, currentToken),
      ]);
    } catch (error) {
      console.error("Wallet DASHBOARD ERROR:", error);
      setErrorMessage("Unable to load Wallet dashboard.");
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // REFRESH Wallet DASHBOARD
  // =====================================================

  const refreshWallet = async () => {
    if (!username || !token) return;

    setRefreshing(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      await loadDashboard(username, token);
      setSuccessMessage("Wallet refreshed successfully.");
    } catch (error) {
      console.error("REFRESH Wallet ERROR:", error);
      setErrorMessage("Unable to refresh Wallet.");
    } finally {
      setRefreshing(false);
    }
  };

  // =====================================================
  // INITIAL AUTH + DASHBOARD LOAD
  // =====================================================

  useEffect(() => {
    if (typeof window === "undefined") return;

    const savedUsername = localStorage.getItem("username") || "";
    const savedToken = localStorage.getItem("token") || "";

    setUsername(savedUsername);
    setToken(savedToken);

    if (!savedUsername || !savedToken) {
      setLoading(false);
      setErrorMessage("Please login first.");
      return;
    }

    loadDashboard(savedUsername, savedToken);
  }, []);

  // =====================================================
  // AUTO CLEAR ALERTS
  // =====================================================

  useEffect(() => {
    if (!successMessage && !errorMessage) return;

    const timer = setTimeout(() => {
      setSuccessMessage("");
      setErrorMessage("");
    }, 4000);

    return () => clearTimeout(timer);
  }, [successMessage, errorMessage]);

  // =====================================================
  // SAFETY: RELOAD DASHBOARD IF USERNAME/TOKEN CHANGE
  // =====================================================

  useEffect(() => {
    if (!username || !token) return;

    // Skip first render because initial load already called above.
    if (loading) return;
  }, [username, token]);
    // =====================================================
  // JSX START
  // =====================================================

  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-8">
      <div className="mx-auto max-w-7xl">

        {/* =====================================================
            Wallet HEADER
        ===================================================== */}

        <div className="mb-6 rounded-3xl bg-gradient-to-r from-emerald-700 via-cyan-700 to-blue-700 p-6 text-white shadow-xl">

          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">

            <div>
              <h1 className="text-3xl font-bold md:text-4xl">
                GoldTrade Digital Wallet
              </h1>

              <p className="mt-2 text-cyan-100">
                Pkr • USDT • GOLD Wallet Dashboard
              </p>

              <p className="mt-3 text-sm text-cyan-200">
                Welcome,
                <span className="ml-1 font-semibold text-white">
                  {username || "User"}
                </span>
              </p>

              <p className="mt-1 text-xs text-cyan-300">
                {today}
              </p>
            </div>

            <button
              type="button"
              onClick={refreshWallet}
              disabled={refreshing}
              className="rounded-xl bg-white px-6 py-3 font-semibold text-cyan-700 transition hover:bg-cyan-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {refreshing ? "Refreshing..." : "Refresh Wallet"}
            </button>

          </div>

        </div>

        {/* =====================================================
            SUCCESS / ERROR ALERTS
        ===================================================== */}

        {successMessage && (
          <div className="mb-4 rounded-xl border border-green-300 bg-green-100 p-4 text-green-700">
            {successMessage}
          </div>
        )}

        {errorMessage && (
          <div className="mb-4 rounded-xl border border-red-300 bg-red-100 p-4 text-red-700">
            {errorMessage}
          </div>
        )}

        {/* =====================================================
            LOADING STATE
        ===================================================== */}

        {loading ? (
          <div className="rounded-3xl bg-white p-12 text-center shadow-xl">

            <div className="mx-auto mb-5 h-12 w-12 animate-spin rounded-full border-4 border-cyan-600 border-t-transparent"></div>

            <p className="text-gray-600 text-lg">
              Loading Wallet...
            </p>

          </div>
        ) : (
          <>

            {/* =====================================================
                Wallet BALANCE CARDS
            ===================================================== */}

            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">

              {/* Pkr Wallet */}

              <div className="rounded-3xl bg-white p-6 shadow-lg transition hover:-translate-y-1 hover:shadow-xl">

                <p className="text-sm text-gray-500">
                  Pkr Wallet Balance
                </p>

                <h2 className="mt-3 text-4xl font-bold text-green-600">
                  Rs. {formatCurrency(Wallet.PkrBalance)}
                </h2>

                <p className="mt-3 text-xs text-gray-400">
                  Available Pakistani Rupee Balance
                </p>

              </div>

              {/* USDT Wallet */}

              <div className="rounded-3xl bg-white p-6 shadow-lg transition hover:-translate-y-1 hover:shadow-xl">

                <p className="text-sm text-gray-500">
                  USDT Wallet Balance
                </p>

                <h2 className="mt-3 text-4xl font-bold text-cyan-700">
                  {Wallet.usdtBalance.toFixed(2)} USDT
                </h2>

                <p className="mt-3 text-xs text-gray-400">
                  Available Tether Balance
                </p>

              </div>

              {/* GOLD Wallet */}

              <div className="rounded-3xl bg-white p-6 shadow-lg transition hover:-translate-y-1 hover:shadow-xl">

                <p className="text-sm text-gray-500">
                  Gold Wallet Balance
                </p>

                <h2 className="mt-3 text-4xl font-bold text-yellow-600">
                  {Wallet.goldBalance.toFixed(4)} g
                </h2>

                <p className="mt-3 text-xs text-gray-400">
                  Digital Gold Holdings
                </p>

              </div>

            </div>

            {/* =====================================================
                TOTAL PORTFOLIO VALUE
            ===================================================== */}

            <div className="mt-6 rounded-3xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 p-6 text-white shadow-xl">

              <div className="grid gap-6 md:grid-cols-2">

                <div>
                  <p className="text-sm text-emerald-100">
                    Total Portfolio Value
                  </p>

                  <h2 className="mt-2 text-4xl font-bold">
                    Rs. {formatCurrency(totalPortfolioValue)}
                  </h2>

                  <p className="mt-3 text-sm text-emerald-100">
                    Combined value of Pkr, USDT and Gold assets.
                  </p>
                </div>

                <div className="text-left md:text-right">

                  <p className="text-sm text-emerald-100">
                    Wallet Status
                  </p>

                  <h2 className="mt-2 text-3xl font-bold text-green-200">
                    ACTIVE
                  </h2>

                  <p className="mt-3 text-sm text-emerald-100">
                    Connected with GoldTrade Ai-System.
                  </p>

                </div>

              </div>

            </div>

            {/* =====================================================
                LIVE MARKET CARDS
            ===================================================== */}

            <div className="mt-6 grid gap-5 md:grid-cols-2">

              {/* USDT RATE */}

              <div className="rounded-3xl bg-gradient-to-r from-cyan-600 to-blue-700 p-6 text-white shadow-xl">

                <p className="text-sm text-cyan-100">
                  Live USDT Rate
                </p>

                <h2 className="mt-3 text-4xl font-bold">
                  Pkr {formatCurrency(usdtRate)}
                </h2>

                <p className="mt-2 text-sm text-cyan-100">
                  1 USDT = {formatCurrency(usdtRate)} Pkr
                </p>

              </div>

              {/* GOLD RATE */}

              <div className="rounded-3xl bg-gradient-to-r from-yellow-500 to-orange-500 p-6 text-white shadow-xl">

                <p className="text-sm text-yellow-100">
                  Live Gold Buy Price
                </p>

                <h2 className="mt-3 text-4xl font-bold">
                  Pkr {formatCurrency(goldPrice)}
                </h2>

                <p className="mt-2 text-sm text-yellow-100">
                  Current Gold Price Per Gram
                </p>

              </div>

            </div>

            {/* =====================================================
                PORTFOLIO SUMMARY
            ===================================================== */}

            <div className="mt-6 rounded-3xl bg-white p-6 shadow-xl">

              <h2 className="mb-6 text-2xl font-bold text-slate-800">
                Portfolio Summary
              </h2>

              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">

                {/* Pkr */}

                <div className="rounded-2xl bg-green-50 p-5">

                  <p className="text-sm text-green-700">
                    Pkr Assets
                  </p>

                  <h3 className="mt-2 text-2xl font-bold text-green-600">
                    Rs. {formatCurrency(Wallet.PkrBalance)}
                  </h3>

                </div>

                {/* USDT */}

                <div className="rounded-2xl bg-cyan-50 p-5">

                  <p className="text-sm text-cyan-700">
                    USDT Assets
                  </p>

                  <h3 className="mt-2 text-2xl font-bold text-cyan-700">
                    {Wallet.usdtBalance.toFixed(2)} USDT
                  </h3>

                  <p className="mt-2 text-xs text-slate-500">
                    ≈ Rs. {formatCurrency(usdtValue)}
                  </p>

                </div>

                {/* GOLD */}

                <div className="rounded-2xl bg-yellow-50 p-5">

                  <p className="text-sm text-yellow-700">
                    Gold Assets
                  </p>

                  <h3 className="mt-2 text-2xl font-bold text-yellow-600">
                    {Wallet.goldBalance.toFixed(4)} g
                  </h3>

                  <p className="mt-2 text-xs text-slate-500">
                    ≈ Rs. {formatCurrency(goldValue)}
                  </p>

                </div>

                {/* TOTAL */}

                <div className="rounded-2xl bg-indigo-50 p-5">

                  <p className="text-sm text-indigo-700">
                    Total Wallet Value
                  </p>

                  <h3 className="mt-2 text-2xl font-bold text-indigo-700">
                    Rs. {formatCurrency(totalPortfolioValue)}
                  </h3>

                </div>

              </div>

            </div>

                        {/* =====================================================
                QUICK Wallet ACTIONS
            ===================================================== */}

            <div className="mt-6 rounded-3xl bg-white p-6 shadow-xl">

              <h2 className="mb-6 text-2xl font-bold text-slate-800">
                Quick Wallet Actions
              </h2>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">

                {/* Deposit */}

                <Link
                  href="/deposit"
                  className="rounded-2xl bg-gradient-to-r from-green-600 to-emerald-600 p-6 text-center text-white shadow-lg transition hover:scale-[1.02]"
                >
                  <div className="mb-3 text-4xl">💰</div>

                  <h3 className="text-lg font-bold">
                    Deposit Pkr
                  </h3>

                  <p className="mt-2 text-sm text-green-100">
                    Add funds to your Pkr Wallet.
                  </p>
                </Link>

                {/* Withdraw */}

                <Link
                  href="/withdraw"
                  className="rounded-2xl bg-gradient-to-r from-red-600 to-orange-600 p-6 text-center text-white shadow-lg transition hover:scale-[1.02]"
                >
                  <div className="mb-3 text-4xl">🏦</div>

                  <h3 className="text-lg font-bold">
                    Withdraw Pkr
                  </h3>

                  <p className="mt-2 text-sm text-red-100">
                    Withdraw your Pkr balance securely.
                  </p>
                </Link>

                {/* Buy USDT */}

                <Link
                  href="/usdt/buy-usdt"
                  className="rounded-2xl bg-gradient-to-r from-cyan-600 to-blue-700 p-6 text-center text-white shadow-lg transition hover:scale-[1.02]"
                >
                  <div className="mb-3 text-4xl">💵</div>

                  <h3 className="text-lg font-bold">
                    Buy USDT
                  </h3>

                  <p className="mt-2 text-sm text-cyan-100">
                    Purchase USDT using your Pkr Wallet.
                  </p>
                </Link>

                {/* Sell USDT */}

                <Link
                  href="/usdt/sell-usdt"
                  className="rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-700 p-6 text-center text-white shadow-lg transition hover:scale-[1.02]"
                >
                  <div className="mb-3 text-4xl">💸</div>

                  <h3 className="text-lg font-bold">
                    Sell USDT
                  </h3>

                  <p className="mt-2 text-sm text-indigo-100">
                    Sell USDT and receive Pkr.
                  </p>
                </Link>

              </div>

            </div>

            {/* =====================================================
                LIVE MARKET STATUS
            ===================================================== */}

            <div className="mt-6 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-6 text-white shadow-xl">

              <h2 className="mb-6 text-2xl font-bold">
                Live Market Status
              </h2>

              <div className="grid gap-5 md:grid-cols-3">

                <div className="rounded-2xl bg-white/10 p-5">
                  <p className="text-sm text-slate-300">
                    USDT Market
                  </p>

                  <h3 className="mt-2 text-2xl font-bold text-green-400">
                    LIVE
                  </h3>

                  <p className="mt-2 text-sm text-slate-400">
                    Live rate updates.
                  </p>
                </div>

                <div className="rounded-2xl bg-white/10 p-5">
                  <p className="text-sm text-slate-300">
                    Gold Market
                  </p>

                  <h3 className="mt-2 text-2xl font-bold text-yellow-300">
                    OPEN
                  </h3>

                  <p className="mt-2 text-sm text-slate-400">
                    Gold buy/sell available.
                  </p>
                </div>

                <div className="rounded-2xl bg-white/10 p-5">
                  <p className="text-sm text-slate-300">
                    Wallet Connection
                  </p>

                  <h3 className="mt-2 text-2xl font-bold text-cyan-300">
                    CONNECTED
                  </h3>

                  <p className="mt-2 text-sm text-slate-400">
                    GoldTrade Ai synchronized.
                  </p>
                </div>

              </div>

            </div>

            {/* =====================================================
                Wallet FEATURES
            ===================================================== */}

            <div className="mt-6 rounded-3xl bg-white p-6 shadow-xl">

              <h2 className="mb-6 text-2xl font-bold text-slate-800">
                Wallet Features
              </h2>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">

                <div className="rounded-2xl bg-cyan-50 p-5">
                  <div className="mb-3 text-3xl">💳</div>

                  <h3 className="font-semibold text-cyan-700">
                    Pkr Digital Wallet
                  </h3>

                  <p className="mt-2 text-sm text-slate-600">
                    Deposit, withdraw and manage Pkr securely.
                  </p>
                </div>

                <div className="rounded-2xl bg-indigo-50 p-5">
                  <div className="mb-3 text-3xl">💵</div>

                  <h3 className="font-semibold text-indigo-700">
                    USDT Trading
                  </h3>

                  <p className="mt-2 text-sm text-slate-600">
                    Buy and sell USDT with live market pricing.
                  </p>
                </div>

                <div className="rounded-2xl bg-yellow-50 p-5">
                  <div className="mb-3 text-3xl">🥇</div>

                  <h3 className="font-semibold text-yellow-700">
                    Digital Gold
                  </h3>

                  <p className="mt-2 text-sm text-slate-600">
                    Hold and trade digital Gold anytime.
                  </p>
                </div>

                <div className="rounded-2xl bg-green-50 p-5">
                  <div className="mb-3 text-3xl">🔄</div>

                  <h3 className="font-semibold text-green-700">
                    Instant Refresh
                  </h3>

                  <p className="mt-2 text-sm text-slate-600">
                    Refresh balances directly by Server.
                  </p>
                </div>

                <div className="rounded-2xl bg-purple-50 p-5">
                  <div className="mb-3 text-3xl">📈</div>

                  <h3 className="font-semibold text-purple-700">
                    Live Portfolio
                  </h3>

                  <p className="mt-2 text-sm text-slate-600">
                    Combined Pkr, USDT and Gold portfolio tracking.
                  </p>
                </div>

                <div className="rounded-2xl bg-orange-50 p-5">
                  <div className="mb-3 text-3xl">🛡️</div>

                  <h3 className="font-semibold text-orange-700">
                    Secure Transactions
                  </h3>

                  <p className="mt-2 text-sm text-slate-600">
                    JWT authentication and Ai-Security system.
                  </p>
                </div>

              </div>

            </div>

                        {/* =====================================================
                TRANSACTION STATISTICS
            ===================================================== */}

            <div className="mt-6 rounded-3xl bg-white p-6 shadow-xl">

              <h2 className="mb-6 text-2xl font-bold text-slate-800">
                Wallet Transaction Statistics
              </h2>

              <div className="grid gap-4 md:grid-cols-3">

                {/* Pending */}

                <div className="rounded-2xl border border-yellow-200 bg-yellow-50 p-5">

                  <p className="text-sm text-yellow-700">
                    Pending Transactions
                  </p>

                  <h3 className="mt-2 text-3xl font-bold text-yellow-600">
                    {pendingTransactions}
                  </h3>

                  <p className="mt-2 text-xs text-yellow-700">
                    Waiting for verification.
                  </p>

                </div>

                {/* Approved */}

                <div className="rounded-2xl border border-green-200 bg-green-50 p-5">

                  <p className="text-sm text-green-700">
                    Approved Transactions
                  </p>

                  <h3 className="mt-2 text-3xl font-bold text-green-600">
                    {approvedTransactions}
                  </h3>

                  <p className="mt-2 text-xs text-green-700">
                    Successfully completed transactions.
                  </p>

                </div>

                {/* Rejected */}

                <div className="rounded-2xl border border-red-200 bg-red-50 p-5">

                  <p className="text-sm text-red-700">
                    Rejected Transactions
                  </p>

                  <h3 className="mt-2 text-3xl font-bold text-red-600">
                    {rejectedTransactions}
                  </h3>

                  <p className="mt-2 text-xs text-red-700">
                    Requests rejected by the Ai-Verification System.
                  </p>

                </div>

              </div>

            </div>

            {/* =====================================================
                RECENT Wallet ACTIVITY
            ===================================================== */}

            <div className="mt-6 rounded-3xl bg-white p-6 shadow-xl">

              <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

                <div>

                  <h2 className="text-2xl font-bold text-slate-800">
                    Recent Wallet Activity
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Latest Pkr, USDT and Gold Wallet transactions.
                  </p>

                </div>

                <button
                  type="button"
                  onClick={refreshWallet}
                  disabled={refreshing}
                  className="rounded-xl bg-cyan-600 px-5 py-3 font-semibold text-white transition hover:bg-cyan-700 disabled:opacity-60"
                >
                  {refreshing ? "Refreshing..." : "Refresh History"}
                </button>

              </div>

              {/* EMPTY STATE */}

              {transactions.length === 0 ? (

                <div className="rounded-2xl border border-dashed border-slate-300 py-12 text-center">

                  <div className="mb-4 text-5xl">📂</div>

                  <h3 className="text-xl font-semibold text-slate-700">
                    No Wallet Transactions Yet
                  </h3>

                  <p className="mt-2 text-sm text-slate-500">
                    Deposit, Withdraw, Buy USDT, Sell USDT and Gold transactions
                    will appear here.
                  </p>

                </div>

              ) : (

                <div className="overflow-x-auto rounded-2xl border border-slate-200">

                  <table className="min-w-full text-sm">

                    <thead className="bg-slate-100">

                      <tr className="text-left uppercase text-slate-600">

                        <th className="px-4 py-3">Type</th>

                        <th className="px-4 py-3">Currency</th>

                        <th className="px-4 py-3">Amount</th>

                        <th className="px-4 py-3">Status</th>

                        <th className="px-4 py-3">Date</th>

                      </tr>

                    </thead>

                    <tbody>

                      {transactions.slice(0, 8).map((tx) => (

                        <tr
                          key={tx._id}
                          className="border-t border-slate-200 hover:bg-slate-50"
                        >

                          {/* TYPE */}

                          <td className="px-4 py-4">

                            <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                              {tx.type}
                            </span>

                          </td>

                          {/* CURRENCY */}

                          <td className="px-4 py-4 font-medium text-slate-700">
                            {tx.currency}
                          </td>

                          {/* AMOUNT */}

                          <td className="px-4 py-4 font-semibold text-emerald-700">

                            {tx.currency === "Pkr" && (
                              <>Rs. {formatCurrency(tx.amount)}</>
                            )}

                            {tx.currency === "USDT" && (
                              <>{Number(tx.amount).toFixed(2)} USDT</>
                            )}

                            {tx.currency === "GOLD" && (
                              <>{Number(tx.amount).toFixed(4)} g</>
                            )}

                          </td>

                          {/* STATUS */}

                          <td className="px-4 py-4">

                            {tx.status === "Approved" && (
                              <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700">
                                Approved
                              </span>
                            )}

                            {tx.status === "Pending" && (
                              <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-bold text-yellow-700">
                                Pending
                              </span>
                            )}

                            {tx.status === "Rejected" && (
                              <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-700">
                                Rejected
                              </span>
                            )}

                          </td>

                          {/* DATE */}

                          <td className="px-4 py-4 text-slate-500">
                            {formatDate(tx.createdAt)}
                          </td>

                        </tr>

                      ))}

                    </tbody>

                  </table>

                </div>

              )}

              {/* VIEW FULL HISTORY BUTTON */}

              <div className="mt-6 text-center">

                <Link
                  href="/transactions"
                  className="inline-flex items-center rounded-xl bg-indigo-600 px-6 py-3 font-semibold text-white transition hover:bg-indigo-700"
                >
                  View Complete Wallet History
                </Link>

              </div>

            </div>

                        {/* =====================================================
                Wallet SECURITY
            ===================================================== */}

            <div className="mt-6 rounded-3xl border border-green-200 bg-green-50 p-6">

              <h2 className="mb-6 text-2xl font-bold text-green-700">
                GoldTrade Wallet Security
              </h2>

              <div className="grid gap-4 md:grid-cols-2">

                <div className="rounded-xl bg-white p-5 shadow-sm">
                  <h3 className="font-semibold text-green-700">
                    🔒 Secure Authentication
                  </h3>

                  <p className="mt-2 text-sm text-slate-600">
                    Your Wallet is protected with JWT authentication.
                    
                  </p>
                </div>

                <div className="rounded-xl bg-white p-5 shadow-sm">
                  <h3 className="font-semibold text-green-700">
                    ✅ Ai-Verified Transactions Program
                  </h3>

                  <p className="mt-2 text-sm text-slate-600">
                    Deposit, Withdraw, Buy USDT and Sell USDT requests are
                    verified before balances are updated.
                  </p>
                </div>

                <div className="rounded-xl bg-white p-5 shadow-sm">
                  <h3 className="font-semibold text-green-700">
                    📜 Transaction History
                  </h3>

                  <p className="mt-2 text-sm text-slate-600">
                    Every Wallet activity is stored with date, amount, currency
                    and approval status.
                  </p>
                </div>

                <div className="rounded-xl bg-white p-5 shadow-sm">
                  <h3 className="font-semibold text-green-700">
                    ⚡ Live Market Sync
                  </h3>

                  <p className="mt-2 text-sm text-slate-600">
                    Portfolio values automatically update using live USDT and
                    Gold prices.
                  </p>
                </div>

              </div>

            </div>

            {/* =====================================================
                PLATFORM STATUS
            ===================================================== */}

            <div className="mt-6 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-6 text-white shadow-xl">

              <h2 className="mb-6 text-2xl font-bold">
                GoldTrade Platform Status
              </h2>

              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">

                <div className="rounded-2xl bg-white/10 p-5 text-center">
                  <p className="text-sm text-slate-300">
                    Wallet Status
                  </p>

                  <h3 className="mt-2 text-xl font-bold text-green-400">
                    ACTIVE
                  </h3>
                </div>

                <div className="rounded-2xl bg-white/10 p-5 text-center">
                  <p className="text-sm text-slate-300">
                    USDT Trading
                  </p>

                  <h3 className="mt-2 text-xl font-bold text-cyan-300">
                    LIVE
                  </h3>
                </div>

                <div className="rounded-2xl bg-white/10 p-5 text-center">
                  <p className="text-sm text-slate-300">
                    Gold Trading
                  </p>

                  <h3 className="mt-2 text-xl font-bold text-yellow-300">
                    OPEN
                  </h3>
                </div>

                <div className="rounded-2xl bg-white/10 p-5 text-center">
                  <p className="text-sm text-slate-300">
                    Backend Sync
                  </p>

                  <h3 className="mt-2 text-xl font-bold text-emerald-300">
                    CONNECTED
                  </h3>
                </div>

              </div>

            </div>

            {/* =====================================================
                QUICK NAVIGATION
            ===================================================== */}

            <div className="mt-6 rounded-3xl bg-white p-6 shadow-xl">

              <h2 className="mb-6 text-2xl font-bold text-slate-800">
                Quick Navigation
              </h2>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">

                <Link
                  href="/dashboard"
                  className="rounded-xl bg-slate-800 px-5 py-4 text-center font-semibold text-white transition hover:bg-slate-900"
                >
                  Dashboard
                </Link>

                <Link
                  href="/gold"
                  className="rounded-xl bg-yellow-500 px-5 py-4 text-center font-semibold text-white transition hover:bg-yellow-600"
                >
                  Gold Trading
                </Link>

                <Link
                  href="/usdt"
                  className="rounded-xl bg-cyan-600 px-5 py-4 text-center font-semibold text-white transition hover:bg-cyan-700"
                >
                  USDT Dashboard
                </Link>

                <Link
                  href="/transactions"
                  className="rounded-xl bg-indigo-600 px-5 py-4 text-center font-semibold text-white transition hover:bg-indigo-700"
                >
                  Transactions
                </Link>

              </div>

            </div>

            {/* =====================================================
                FOOTER
            ===================================================== */}

            <div className="mt-8 rounded-3xl bg-gradient-to-r from-emerald-700 via-cyan-700 to-blue-700 p-6 text-white shadow-xl">

              <div className="grid gap-6 md:grid-cols-2">

                <div>
                  <h2 className="text-3xl font-bold">
                    GoldTrade Wallet 
                  </h2>

                  <p className="mt-3 text-cyan-100">
                    Pakistan's Digital Wallet Platform for Pkr, USDT and Gold
                    Trading.
                  </p>

                  <p className="mt-2 text-sm text-cyan-200">
                    Secure • Fast • Live Market • Verified Transactions
                  </p>
                </div>

                <div className="flex flex-col items-start justify-center gap-2 md:items-end">

                  <span className="rounded-full bg-green-500/20 px-4 py-2 text-sm font-semibold text-green-200">
                    Wallet Status: ACTIVE
                  </span>

                  <span className="rounded-full bg-cyan-500/20 px-4 py-2 text-sm font-semibold text-cyan-200">
                    USDT Market: LIVE
                  </span>

                  <span className="rounded-full bg-yellow-500/20 px-4 py-2 text-sm font-semibold text-yellow-200">
                    Gold Market: OPEN
                  </span>

                </div>

              </div>

            </div>

            {/* =====================================================
                COPYRIGHT
            ===================================================== */}

            <div className="mt-6 rounded-2xl bg-slate-900 p-5 text-center text-white">

              <h3 className="text-xl font-bold text-cyan-300">
                GoldTrade Digital Wallet
              </h3>

              <p className="mt-2 text-sm text-slate-300">
                Pkr • USDT • GOLD Wallet with Live Market Trading
              </p>

              <p className="mt-4 text-sm text-slate-400">
                © 2026 GoldTrade. All Rights Reserved.
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Secure Authentication •  AI-Verified Transactions Program
              </p>

            </div>

          </>
        )}

      </div>
    </div>
  );
}