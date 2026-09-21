"use client";

/*
=========================================================
 GoldTrade V18 Enterprise
 USDT Portfolio Page
 PART 1/12
 Linux + TypeScript + Render + Vercel Safe
=========================================================
*/

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import {
  ArrowLeft,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Wallet,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Coins,
  ShieldCheck,
  Search,
} from "lucide-react";

// =====================================================
// API URL
// =====================================================

const API =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

// =====================================================
// TYPES
// =====================================================

interface PortfolioData {
  totalUsdt: number;
  averageBuyPrice: number;
  totalInvested: number;
}

interface WalletData {
  pkrBalance: number;
  goldBalance: number;
  usdtBalance: number;
}

interface MarketData {
  buyPrice: number;
  sellPrice: number;
  marketStatus: "OPEN" | "CLOSED";
  tradingEnabled: boolean;
  marketMessage: string;
}

interface HistoryItem {
  _id: string;
  type: "BUY" | "SELL";
  usdtAmount: number;
  price: number;
  totalAmount: number;
  status: "Pending" | "Completed" | "Rejected";
  createdAt: string;
}

// =====================================================
// COMPONENT
// =====================================================

export default function UsdtPortfolioPage() {
  // ===============================================
  // USER
  // ===============================================

  const [username, setUsername] = useState("");

  // ===============================================
  // STATES
  // ===============================================

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");

  const [portfolio, setPortfolio] = useState<PortfolioData>({
    totalUsdt: 0,
    averageBuyPrice: 0,
    totalInvested: 0,
  });

  const [wallet, setWallet] = useState<WalletData>({
    pkrBalance: 0,
    goldBalance: 0,
    usdtBalance: 0,
  });

  const [market, setMarket] = useState<MarketData>({
    buyPrice: 286,
    sellPrice: 284,
    marketStatus: "OPEN",
    tradingEnabled: true,
    marketMessage: "USDT Market is Open",
  });

  const [history, setHistory] = useState<HistoryItem[]>([]);

  // ===============================================
  // SEARCH
  // ===============================================

  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("ALL");
  const [filterStatus, setFilterStatus] = useState("ALL");

  // ===============================================
  // PAGINATION
  // ===============================================

  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  // ===============================================
  // AUTH HEADER
  // ===============================================

  const getHeaders = () => {
    const token = localStorage.getItem("token");

    return {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };
  };
    // =====================================================
  // LOAD PORTFOLIO
  // =====================================================

  const loadPortfolio = async (currentUsername: string) => {
    try {
      const response = await fetch(
        `${API}/api/usdt/portfolio/${currentUsername}`,
        {
          headers: getHeaders(),
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        setPortfolio({
          totalUsdt: Number(data.portfolio.totalUsdt || 0),
          averageBuyPrice: Number(data.portfolio.averageBuyPrice || 0),
          totalInvested: Number(data.portfolio.totalInvested || 0),
        });
      }
    } catch (error) {
      console.error("Portfolio Load Error:", error);
    }
  };

  // =====================================================
  // LOAD WALLET
  // =====================================================

  const loadWallet = async (currentUsername: string) => {
    try {
      const response = await fetch(
        `${API}/api/wallet/${currentUsername}`,
        {
          headers: getHeaders(),
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        setWallet({
          pkrBalance: Number(data.wallet.pkrBalance || 0),
          goldBalance: Number(data.wallet.goldBalance || 0),
          usdtBalance: Number(data.wallet.usdtBalance || 0),
        });
      }
    } catch (error) {
      console.error("Wallet Load Error:", error);
    }
  };

  // =====================================================
  // LOAD MARKET
  // =====================================================

  const loadMarket = async () => {
    try {
      const response = await fetch(`${API}/api/usdt/price`);

      const data = await response.json();

      if (response.ok && data.success) {
        setMarket({
          buyPrice: Number(data.buyPrice || 0),
          sellPrice: Number(data.sellPrice || 0),
          marketStatus: data.marketStatus || "OPEN",
          tradingEnabled: Boolean(data.tradingEnabled),
          marketMessage: data.marketMessage || "",
        });
      }
    } catch (error) {
      console.error("Market Load Error:", error);
    }
  };

  // =====================================================
  // LOAD HISTORY
  // =====================================================

  const loadHistory = async (currentUsername: string) => {
    try {
      const response = await fetch(
        `${API}/api/usdt/history/${currentUsername}`,
        {
          headers: getHeaders(),
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        setHistory(data.history || []);
      }
    } catch (error) {
      console.error("History Load Error:", error);
    }
  };

  // =====================================================
  // LOAD COMPLETE PORTFOLIO
  // =====================================================

  const loadCompletePortfolio = async (
    currentUsername: string
  ) => {
    try {
      setLoading(true);
      setErrorMessage("");

      await Promise.all([
        loadPortfolio(currentUsername),
        loadWallet(currentUsername),
        loadMarket(),
        loadHistory(currentUsername),
      ]);
    } catch (error: any) {
      console.error(error);

      setErrorMessage(
        error.message || "Unable to load portfolio."
      );
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // REFRESH PORTFOLIO
  // =====================================================

  const refreshPortfolio = async () => {
    if (!username) return;

    try {
      setRefreshing(true);

      await loadCompletePortfolio(username);
    } finally {
      setRefreshing(false);
    }
  };

  // =====================================================
  // INITIAL LOAD
  // =====================================================

  useEffect(() => {
    const currentUsername =
      localStorage.getItem("username") || "";

    setUsername(currentUsername);

    if (currentUsername) {
      loadCompletePortfolio(currentUsername);
    }
  }, []);
    // =====================================================
  // ENTERPRISE PORTFOLIO CALCULATIONS
  // Paste AFTER useEffect()
  // =====================================================

  const portfolioSummary = useMemo(() => {
    const holdings = Number(portfolio.totalUsdt || 0);
    const buyPrice = Number(portfolio.averageBuyPrice || 0);
    const sellPrice = Number(market.sellPrice || 0);

    const investedAmount = holdings * buyPrice;
    const currentValue = holdings * sellPrice;
    const profitLoss = currentValue - investedAmount;

    const profitPercentage =
      investedAmount > 0
        ? (profitLoss / investedAmount) * 100
        : 0;

    return {
      holdings,
      investedAmount,
      currentValue,
      profitLoss,
      profitPercentage,
    };
  }, [portfolio, market]);

  // =====================================================
  // SEARCH FILTER
  // =====================================================

const filteredHistory = useMemo(() => {
  return history.filter((item) => {

    const matchesSearch =
      search === "" ||
      item.type.toLowerCase().includes(search.toLowerCase()) ||
      item.status.toLowerCase().includes(search.toLowerCase()) ||
      item.usdtAmount.toString().includes(search) ||
      item.totalAmount.toString().includes(search);

    const matchesType =
      filterType === "ALL" || item.type === filterType;

    const matchesStatus =
      filterStatus === "ALL" || item.status === filterStatus;

    return matchesSearch && matchesType && matchesStatus;
  });
}, [history, search, filterType, filterStatus]);

  // =====================================================
  // PAGINATION
  // =====================================================

  const totalPages = Math.ceil(
    filteredHistory.length / rowsPerPage
  );

  const paginatedHistory = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    const end = start + rowsPerPage;

    return filteredHistory.slice(start, end);
  }, [filteredHistory, currentPage]);

  // =====================================================
  // HISTORY STATISTICS
  // =====================================================

  const historyStats = useMemo(() => {
    let totalBought = 0;
    let totalSold = 0;
    let completed = 0;
    let pending = 0;

    history.forEach((item) => {
      if (item.type === "BUY") {
        totalBought += Number(item.usdtAmount);
      }

      if (item.type === "SELL") {
        totalSold += Number(item.usdtAmount);
      }

      if (item.status === "Completed") completed++;
      if (item.status === "Pending") pending++;
    });

    return {
      totalBought,
      totalSold,
      completed,
      pending,
      totalTransactions: history.length,
    };
  }, [history]);

  // =====================================================
  // REFRESH BUTTON HANDLER
  // =====================================================

  const handleRefresh = async () => {
    await refreshPortfolio();
  };
    // =====================================================
  // LOADING SCREEN
  // =====================================================

  if (loading) {
    return (
      <main className="min-h-screen bg-black flex items-center justify-center">
        <div className="flex items-center gap-4 text-cyan-400 text-xl font-bold">
          <RefreshCw className="animate-spin" size={30} />
          Loading USDT Portfolio...
        </div>
      </main>
    );
  }

  // =====================================================
  // PAGE START
  // =====================================================

  return (
    <main className="min-h-screen bg-black text-white p-6">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* ============================================= */}
        {/* ENTERPRISE HEADER */}
        {/* ============================================= */}

        <header className="flex flex-wrap items-center justify-between gap-4">

          <div>

            <h1 className="flex items-center gap-3 text-4xl font-black text-cyan-400">
              <Wallet size={38} />
              USDT Portfolio
            </h1>

            <p className="text-gray-400 mt-2">
              View your USDT holdings, live portfolio value and trading history.
            </p>

          </div>

          <div className="flex gap-3 flex-wrap">

            <Link
              href="/usdt"
              className="bg-zinc-800 hover:bg-zinc-700 transition px-5 py-3 rounded-xl flex items-center gap-2 font-bold"
            >
              <ArrowLeft size={18} />
              USDT Dashboard
            </Link>

            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="bg-cyan-500 hover:bg-cyan-400 disabled:bg-cyan-700 disabled:cursor-not-allowed text-black px-5 py-3 rounded-xl flex items-center gap-2 font-bold transition"
            >
              <RefreshCw
                size={18}
                className={refreshing ? "animate-spin" : ""}
              />

              {refreshing ? "Refreshing..." : "Refresh Portfolio"}
            </button>

          </div>

        </header>

        {/* ============================================= */}
        {/* ERROR MESSAGE */}
        {/* ============================================= */}

        {errorMessage && (
          <div className="bg-red-500/10 border border-red-500 text-red-400 rounded-xl p-4 font-semibold">
            {errorMessage}
          </div>
        )}

        {/* ============================================= */}
        {/* LIVE MARKET STATUS */}
        {/* ============================================= */}

        <section className="bg-zinc-900 border border-cyan-500 rounded-2xl p-6">

          <div className="flex flex-wrap justify-between items-center gap-5">

            <div>

              <h2 className="flex items-center gap-3 text-2xl font-black text-cyan-400">
                <ShieldCheck size={28} />
                Live USDT Market
              </h2>

              <p className="text-gray-400 mt-2">
                {market.marketMessage}
              </p>

            </div>

            <div className="flex gap-3 flex-wrap">

              <span
                className={`px-4 py-2 rounded-full font-bold ${
                  market.marketStatus === "OPEN"
                    ? "bg-green-500/20 text-green-400 border border-green-500"
                    : "bg-red-500/20 text-red-400 border border-red-500"
                }`}
              >
                {market.marketStatus}
              </span>

              <span
                className={`px-4 py-2 rounded-full font-bold ${
                  market.tradingEnabled
                    ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500"
                    : "bg-red-500/20 text-red-400 border border-red-500"
                }`}
              >
                Trading {market.tradingEnabled ? "Enabled" : "Disabled"}
              </span>

            </div>

          </div>

          {/* LIVE RATE BAR */}

          <div className="grid md:grid-cols-3 gap-5 mt-6">

            <div className="bg-black border border-cyan-500 rounded-xl p-4">

              <p className="text-gray-500 text-sm">
                Buy Rate
              </p>

              <h3 className="text-2xl font-black text-cyan-400 mt-2">
                PKR {market.buyPrice.toLocaleString()}
              </h3>

            </div>

            <div className="bg-black border border-green-500 rounded-xl p-4">

              <p className="text-gray-500 text-sm">
                Sell Rate
              </p>

              <h3 className="text-2xl font-black text-green-400 mt-2">
                PKR {market.sellPrice.toLocaleString()}
              </h3>

            </div>

            <div className="bg-black border border-blue-500 rounded-xl p-4">

              <p className="text-gray-500 text-sm">
                Current Holdings Value
              </p>

              <h3 className="text-2xl font-black text-blue-400 mt-2">
                PKR {portfolioSummary.currentValue.toLocaleString()}
              </h3>

            </div>

          </div>

        </section>
                {/* ================================================= */}
        {/* ENTERPRISE PORTFOLIO SUMMARY */}
        {/* Paste AFTER Live Market Banner */}
        {/* ================================================= */}

        <section className="space-y-6">

          <div className="flex items-center justify-between">

            <h2 className="text-3xl font-black text-cyan-400">
              Portfolio Overview
            </h2>

            <span className="bg-cyan-500/20 text-cyan-400 border border-cyan-500 px-4 py-2 rounded-full text-sm font-bold">
              LIVE PORTFOLIO
            </span>

          </div>

          {/* ============================================== */}
          {/* ROW 1 */}
          {/* ============================================== */}

          <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-5">

            {/* TOTAL HOLDINGS */}

            <div className="bg-zinc-900 border border-cyan-500 rounded-2xl p-5">

              <div className="flex justify-between items-center">

                <Coins className="text-cyan-400" size={26} />

                <span className="text-xs text-cyan-400 font-bold">
                  HOLDINGS
                </span>

              </div>

              <p className="text-gray-500 text-sm mt-4">
                Total USDT Holdings
              </p>

              <h2 className="text-3xl font-black text-cyan-400 mt-2">
                {portfolioSummary.holdings.toFixed(2)}
              </h2>

              <p className="text-gray-500 text-xs mt-2">
                Available Portfolio Balance
              </p>

            </div>

            {/* INVESTED */}

            <div className="bg-zinc-900 border border-yellow-500 rounded-2xl p-5">

              <div className="flex justify-between items-center">

                <Wallet className="text-yellow-400" size={26} />

                <span className="text-xs text-yellow-400 font-bold">
                  INVESTED
                </span>

              </div>

              <p className="text-gray-500 text-sm mt-4">
                Total Invested Amount
              </p>

              <h2 className="text-3xl font-black text-yellow-400 mt-2">
                PKR {portfolioSummary.investedAmount.toLocaleString()}
              </h2>

              <p className="text-gray-500 text-xs mt-2">
                Average Buy Cost
              </p>

            </div>

            {/* CURRENT VALUE */}

            <div className="bg-zinc-900 border border-purple-500 rounded-2xl p-5">

              <div className="flex justify-between items-center">

                <DollarSign className="text-purple-400" size={26} />

                <span className="text-xs text-purple-400 font-bold">
                  VALUE
                </span>

              </div>

              <p className="text-gray-500 text-sm mt-4">
                Current Portfolio Value
              </p>

              <h2 className="text-3xl font-black text-purple-400 mt-2">
                PKR {portfolioSummary.currentValue.toLocaleString()}
              </h2>

              <p className="text-gray-500 text-xs mt-2">
                Live Sell Market Value
              </p>

            </div>

            {/* AVERAGE PRICE */}

            <div className="bg-zinc-900 border border-blue-500 rounded-2xl p-5">

              <div className="flex justify-between items-center">

                <TrendingUp className="text-blue-400" size={26} />

                <span className="text-xs text-blue-400 font-bold">
                  BUY PRICE
                </span>

              </div>

              <p className="text-gray-500 text-sm mt-4">
                Average Buy Price
              </p>

              <h2 className="text-3xl font-black text-blue-400 mt-2">
                PKR {portfolio.averageBuyPrice.toLocaleString()}
              </h2>

              <p className="text-gray-500 text-xs mt-2">
                Weighted Average
              </p>

            </div>

          </div>

          {/* ============================================== */}
          {/* ROW 2 */}
          {/* ============================================== */}

          <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-5">

            {/* PROFIT LOSS */}

            <div className="bg-zinc-900 border border-green-500 rounded-2xl p-5">

              <div className="flex justify-between items-center">

                {portfolioSummary.profitLoss >= 0 ? (
                  <TrendingUp className="text-green-400" size={26} />
                ) : (
                  <TrendingDown className="text-red-400" size={26} />
                )}

                <span
                  className={`text-xs font-bold ${
                    portfolioSummary.profitLoss >= 0
                      ? "text-green-400"
                      : "text-red-400"
                  }`}
                >
                  P/L
                </span>

              </div>

              <p className="text-gray-500 text-sm mt-4">
                Unrealized Profit / Loss
              </p>

              <h2
                className={`text-3xl font-black mt-2 ${
                  portfolioSummary.profitLoss >= 0
                    ? "text-green-400"
                    : "text-red-400"
                }`}
              >
                PKR {portfolioSummary.profitLoss.toLocaleString()}
              </h2>

            </div>

            {/* PROFIT PERCENTAGE */}

            <div className="bg-zinc-900 border border-emerald-500 rounded-2xl p-5">

              <div className="flex justify-between items-center">

                <TrendingUp className="text-emerald-400" size={26} />

                <span className="text-xs text-emerald-400 font-bold">
                  RETURN
                </span>

              </div>

              <p className="text-gray-500 text-sm mt-4">
                Portfolio Return
              </p>

              <h2
                className={`text-3xl font-black mt-2 ${
                  portfolioSummary.profitPercentage >= 0
                    ? "text-emerald-400"
                    : "text-red-400"
                }`}
              >
                {portfolioSummary.profitPercentage.toFixed(2)}%
              </h2>

            </div>

            {/* LIVE SELL RATE */}

            <div className="bg-zinc-900 border border-cyan-500 rounded-2xl p-5">

              <div className="flex justify-between items-center">

                <DollarSign className="text-cyan-400" size={26} />

                <span className="text-xs text-cyan-400 font-bold">
                  LIVE RATE
                </span>

              </div>

              <p className="text-gray-500 text-sm mt-4">
                Current Sell Rate
              </p>

              <h2 className="text-3xl font-black text-cyan-400 mt-2">
                PKR {market.sellPrice.toLocaleString()}
              </h2>

            </div>

            {/* WALLET BALANCE */}

            <div className="bg-zinc-900 border border-orange-500 rounded-2xl p-5">

              <div className="flex justify-between items-center">

                <Wallet className="text-orange-400" size={26} />

                <span className="text-xs text-orange-400 font-bold">
                  WALLET
                </span>

              </div>

              <p className="text-gray-500 text-sm mt-4">
                PKR Wallet Balance
              </p>

              <h2 className="text-3xl font-black text-orange-400 mt-2">
                PKR {wallet.pkrBalance.toLocaleString()}
              </h2>

            </div>

          </div>

        </section>
                {/* ================================================= */}
        {/* ENTERPRISE PROFIT ANALYTICS */}
        {/* Paste AFTER Portfolio Summary Cards */}
        {/* ================================================= */}

        <section className="space-y-6">

          <div className="flex items-center justify-between">

            <h2 className="text-3xl font-black text-green-400">
              Profit Analytics
            </h2>

            <span className="bg-green-500/20 text-green-400 border border-green-500 px-4 py-2 rounded-full text-sm font-bold">
              LIVE PERFORMANCE
            </span>

          </div>

          {/* ============================================= */}
          {/* PERFORMANCE CARDS */}
          {/* ============================================= */}

          <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-5">

            {/* TOTAL PROFIT */}

            <div className="bg-zinc-900 border border-green-500 rounded-2xl p-5">

              <p className="text-gray-500 text-sm">
                Total Profit / Loss
              </p>

              <h2
                className={`text-3xl font-black mt-2 ${
                  portfolioSummary.profitLoss >= 0
                    ? "text-green-400"
                    : "text-red-400"
                }`}
              >
                PKR {portfolioSummary.profitLoss.toLocaleString()}
              </h2>

              <p className="text-xs text-gray-500 mt-2">
                Live Unrealized Profit
              </p>

            </div>

            {/* RETURN % */}

            <div className="bg-zinc-900 border border-cyan-500 rounded-2xl p-5">

              <p className="text-gray-500 text-sm">
                Return Percentage
              </p>

              <h2
                className={`text-3xl font-black mt-2 ${
                  portfolioSummary.profitPercentage >= 0
                    ? "text-cyan-400"
                    : "text-red-400"
                }`}
              >
                {portfolioSummary.profitPercentage.toFixed(2)}%
              </h2>

              <p className="text-xs text-gray-500 mt-2">
                Based on Average Buy Price
              </p>

            </div>

            {/* TOTAL BUY */}

            <div className="bg-zinc-900 border border-blue-500 rounded-2xl p-5">

              <p className="text-gray-500 text-sm">
                Total USDT Bought
              </p>

              <h2 className="text-3xl font-black text-blue-400 mt-2">
                {historyStats.totalBought.toFixed(2)}
              </h2>

              <p className="text-xs text-gray-500 mt-2">
                Completed Buy Transactions
              </p>

            </div>

            {/* TOTAL SELL */}

            <div className="bg-zinc-900 border border-purple-500 rounded-2xl p-5">

              <p className="text-gray-500 text-sm">
                Total USDT Sold
              </p>

              <h2 className="text-3xl font-black text-purple-400 mt-2">
                {historyStats.totalSold.toFixed(2)}
              </h2>

              <p className="text-xs text-gray-500 mt-2">
                Completed Sell Transactions
              </p>

            </div>

          </div>

          {/* ============================================= */}
          {/* PERFORMANCE SUMMARY */}
          {/* ============================================= */}

          <div className="bg-zinc-900 border border-cyan-500 rounded-2xl p-6">

            <h3 className="text-xl font-black text-cyan-400 mb-6">
              Portfolio Performance Summary
            </h3>

            <div className="space-y-5">

              {/* Invested */}

              <div>

                <div className="flex justify-between text-sm mb-2">

                  <span className="text-gray-400">
                    Total Invested
                  </span>

                  <span className="font-bold text-yellow-400">
                    PKR {portfolioSummary.investedAmount.toLocaleString()}
                  </span>

                </div>

                <div className="w-full h-2 bg-zinc-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-yellow-400 rounded-full"
                    style={{ width: "100%" }}
                  />
                </div>

              </div>

              {/* Current Value */}

              <div>

                <div className="flex justify-between text-sm mb-2">

                  <span className="text-gray-400">
                    Current Market Value
                  </span>

                  <span className="font-bold text-cyan-400">
                    PKR {portfolioSummary.currentValue.toLocaleString()}
                  </span>

                </div>

                <div className="w-full h-2 bg-zinc-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-cyan-400 rounded-full"
                    style={{
                      width: `${Math.min(
                        (portfolioSummary.currentValue /
                          Math.max(portfolioSummary.investedAmount, 1)) *
                          100,
                        100
                      )}%`,
                    }}
                  />
                </div>

              </div>

              {/* Profit */}

              <div>

                <div className="flex justify-between text-sm mb-2">

                  <span className="text-gray-400">
                    Profit Performance
                  </span>

                  <span
                    className={`font-bold ${
                      portfolioSummary.profitLoss >= 0
                        ? "text-green-400"
                        : "text-red-400"
                    }`}
                  >
                    {portfolioSummary.profitPercentage.toFixed(2)}%
                  </span>

                </div>

                <div className="w-full h-2 bg-zinc-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      portfolioSummary.profitLoss >= 0
                        ? "bg-green-400"
                        : "bg-red-400"
                    }`}
                    style={{
                      width: `${Math.min(
                        Math.abs(portfolioSummary.profitPercentage),
                        100
                      )}%`,
                    }}
                  />
                </div>

              </div>

            </div>

          </div>

          {/* ============================================= */}
          {/* ASSET ALLOCATION */}
          {/* ============================================= */}

          <div className="grid lg:grid-cols-2 gap-6">

            {/* WALLET DISTRIBUTION */}

            <div className="bg-zinc-900 border border-blue-500 rounded-2xl p-6">

              <h3 className="text-xl font-black text-blue-400 mb-6">
                Wallet Distribution
              </h3>

              <div className="space-y-5">

                {/* PKR */}

                <div>

                  <div className="flex justify-between text-sm mb-2">

                    <span className="text-yellow-400 font-semibold">
                      PKR Wallet
                    </span>

                    <span>
                      PKR {wallet.pkrBalance.toLocaleString()}
                    </span>

                  </div>

                  <div className="w-full h-3 bg-zinc-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-yellow-400 rounded-full"
                      style={{ width: "100%" }}
                    />
                  </div>

                </div>

                {/* USDT */}

                <div>

                  <div className="flex justify-between text-sm mb-2">

                    <span className="text-cyan-400 font-semibold">
                      USDT Wallet
                    </span>

                    <span>
                      {wallet.usdtBalance.toFixed(2)} USDT
                    </span>

                  </div>

                  <div className="w-full h-3 bg-zinc-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-cyan-400 rounded-full"
                      style={{
                        width: `${Math.min(
                          (wallet.usdtBalance /
                            Math.max(portfolioSummary.holdings, 1)) *
                            100,
                          100
                        )}%`,
                      }}
                    />
                  </div>

                </div>

                {/* GOLD */}

                <div>

                  <div className="flex justify-between text-sm mb-2">

                    <span className="text-orange-400 font-semibold">
                      Gold Wallet
                    </span>

                    <span>
                      {wallet.goldBalance.toFixed(4)} Gram
                    </span>

                  </div>

                  <div className="w-full h-3 bg-zinc-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-orange-400 rounded-full"
                      style={{ width: "100%" }}
                    />
                  </div>

                </div>

              </div>

            </div>

            {/* TRANSACTION OVERVIEW */}

            <div className="bg-zinc-900 border border-purple-500 rounded-2xl p-6">

              <h3 className="text-xl font-black text-purple-400 mb-6">
                Transaction Overview
              </h3>

              <div className="grid grid-cols-2 gap-5">

                <div className="bg-black rounded-xl p-4 border border-green-500">

                  <p className="text-xs text-gray-500 uppercase">
                    Completed
                  </p>

                  <h2 className="text-3xl font-black text-green-400 mt-2">
                    {historyStats.completed}
                  </h2>

                </div>

                <div className="bg-black rounded-xl p-4 border border-yellow-500">

                  <p className="text-xs text-gray-500 uppercase">
                    Pending
                  </p>

                  <h2 className="text-3xl font-black text-yellow-400 mt-2">
                    {historyStats.pending}
                  </h2>

                </div>

                <div className="bg-black rounded-xl p-4 border border-cyan-500">

                  <p className="text-xs text-gray-500 uppercase">
                    Buy Orders
                  </p>

                  <h2 className="text-3xl font-black text-cyan-400 mt-2">
                    {historyStats.totalBought.toFixed(2)}
                  </h2>

                </div>

                <div className="bg-black rounded-xl p-4 border border-purple-500">

                  <p className="text-xs text-gray-500 uppercase">
                    Sell Orders
                  </p>

                  <h2 className="text-3xl font-black text-purple-400 mt-2">
                    {historyStats.totalSold.toFixed(2)}
                  </h2>

                </div>

              </div>

              <div className="mt-6 bg-black rounded-xl p-4 border border-zinc-700">

                <p className="text-sm text-gray-500">
                  Total Transactions
                </p>

                <h2 className="text-3xl font-black text-white mt-2">
                  {historyStats.totalTransactions}
                </h2>

              </div>

            </div>

          </div>

        </section>
                {/* ================================================= */}
        {/* ENTERPRISE PROFIT ANALYTICS */}
        {/* Paste AFTER Portfolio Summary Cards */}
        {/* ================================================= */}

        <section className="space-y-6">

          <div className="flex items-center justify-between">

            <h2 className="text-3xl font-black text-green-400">
              Profit Analytics
            </h2>

            <span className="bg-green-500/20 text-green-400 border border-green-500 px-4 py-2 rounded-full text-sm font-bold">
              LIVE PERFORMANCE
            </span>

          </div>

          {/* ============================================= */}
          {/* PERFORMANCE CARDS */}
          {/* ============================================= */}

          <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-5">

            {/* TOTAL PROFIT */}

            <div className="bg-zinc-900 border border-green-500 rounded-2xl p-5">

              <p className="text-gray-500 text-sm">
                Total Profit / Loss
              </p>

              <h2
                className={`text-3xl font-black mt-2 ${
                  portfolioSummary.profitLoss >= 0
                    ? "text-green-400"
                    : "text-red-400"
                }`}
              >
                PKR {portfolioSummary.profitLoss.toLocaleString()}
              </h2>

              <p className="text-xs text-gray-500 mt-2">
                Live Unrealized Profit
              </p>

            </div>

            {/* RETURN % */}

            <div className="bg-zinc-900 border border-cyan-500 rounded-2xl p-5">

              <p className="text-gray-500 text-sm">
                Return Percentage
              </p>

              <h2
                className={`text-3xl font-black mt-2 ${
                  portfolioSummary.profitPercentage >= 0
                    ? "text-cyan-400"
                    : "text-red-400"
                }`}
              >
                {portfolioSummary.profitPercentage.toFixed(2)}%
              </h2>

              <p className="text-xs text-gray-500 mt-2">
                Based on Average Buy Price
              </p>

            </div>

            {/* TOTAL BUY */}

            <div className="bg-zinc-900 border border-blue-500 rounded-2xl p-5">

              <p className="text-gray-500 text-sm">
                Total USDT Bought
              </p>

              <h2 className="text-3xl font-black text-blue-400 mt-2">
                {historyStats.totalBought.toFixed(2)}
              </h2>

              <p className="text-xs text-gray-500 mt-2">
                Completed Buy Transactions
              </p>

            </div>

            {/* TOTAL SELL */}

            <div className="bg-zinc-900 border border-purple-500 rounded-2xl p-5">

              <p className="text-gray-500 text-sm">
                Total USDT Sold
              </p>

              <h2 className="text-3xl font-black text-purple-400 mt-2">
                {historyStats.totalSold.toFixed(2)}
              </h2>

              <p className="text-xs text-gray-500 mt-2">
                Completed Sell Transactions
              </p>

            </div>

          </div>

          {/* ============================================= */}
          {/* PERFORMANCE SUMMARY */}
          {/* ============================================= */}

          <div className="bg-zinc-900 border border-cyan-500 rounded-2xl p-6">

            <h3 className="text-xl font-black text-cyan-400 mb-6">
              Portfolio Performance Summary
            </h3>

            <div className="space-y-5">

              {/* Invested */}

              <div>

                <div className="flex justify-between text-sm mb-2">

                  <span className="text-gray-400">
                    Total Invested
                  </span>

                  <span className="font-bold text-yellow-400">
                    PKR {portfolioSummary.investedAmount.toLocaleString()}
                  </span>

                </div>

                <div className="w-full h-2 bg-zinc-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-yellow-400 rounded-full"
                    style={{ width: "100%" }}
                  />
                </div>

              </div>

              {/* Current Value */}

              <div>

                <div className="flex justify-between text-sm mb-2">

                  <span className="text-gray-400">
                    Current Market Value
                  </span>

                  <span className="font-bold text-cyan-400">
                    PKR {portfolioSummary.currentValue.toLocaleString()}
                  </span>

                </div>

                <div className="w-full h-2 bg-zinc-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-cyan-400 rounded-full"
                    style={{
                      width: `${Math.min(
                        (portfolioSummary.currentValue /
                          Math.max(portfolioSummary.investedAmount, 1)) *
                          100,
                        100
                      )}%`,
                    }}
                  />
                </div>

              </div>

              {/* Profit */}

              <div>

                <div className="flex justify-between text-sm mb-2">

                  <span className="text-gray-400">
                    Profit Performance
                  </span>

                  <span
                    className={`font-bold ${
                      portfolioSummary.profitLoss >= 0
                        ? "text-green-400"
                        : "text-red-400"
                    }`}
                  >
                    {portfolioSummary.profitPercentage.toFixed(2)}%
                  </span>

                </div>

                <div className="w-full h-2 bg-zinc-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      portfolioSummary.profitLoss >= 0
                        ? "bg-green-400"
                        : "bg-red-400"
                    }`}
                    style={{
                      width: `${Math.min(
                        Math.abs(portfolioSummary.profitPercentage),
                        100
                      )}%`,
                    }}
                  />
                </div>

              </div>

            </div>

          </div>

          {/* ============================================= */}
          {/* ASSET ALLOCATION */}
          {/* ============================================= */}

          <div className="grid lg:grid-cols-2 gap-6">

            {/* WALLET DISTRIBUTION */}

            <div className="bg-zinc-900 border border-blue-500 rounded-2xl p-6">

              <h3 className="text-xl font-black text-blue-400 mb-6">
                Wallet Distribution
              </h3>

              <div className="space-y-5">

                {/* PKR */}

                <div>

                  <div className="flex justify-between text-sm mb-2">

                    <span className="text-yellow-400 font-semibold">
                      PKR Wallet
                    </span>

                    <span>
                      PKR {wallet.pkrBalance.toLocaleString()}
                    </span>

                  </div>

                  <div className="w-full h-3 bg-zinc-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-yellow-400 rounded-full"
                      style={{ width: "100%" }}
                    />
                  </div>

                </div>

                {/* USDT */}

                <div>

                  <div className="flex justify-between text-sm mb-2">

                    <span className="text-cyan-400 font-semibold">
                      USDT Wallet
                    </span>

                    <span>
                      {wallet.usdtBalance.toFixed(2)} USDT
                    </span>

                  </div>

                  <div className="w-full h-3 bg-zinc-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-cyan-400 rounded-full"
                      style={{
                        width: `${Math.min(
                          (wallet.usdtBalance /
                            Math.max(portfolioSummary.holdings, 1)) *
                            100,
                          100
                        )}%`,
                      }}
                    />
                  </div>

                </div>

                {/* GOLD */}

                <div>

                  <div className="flex justify-between text-sm mb-2">

                    <span className="text-orange-400 font-semibold">
                      Gold Wallet
                    </span>

                    <span>
                      {wallet.goldBalance.toFixed(4)} Gram
                    </span>

                  </div>

                  <div className="w-full h-3 bg-zinc-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-orange-400 rounded-full"
                      style={{ width: "100%" }}
                    />
                  </div>

                </div>

              </div>

            </div>

            {/* TRANSACTION OVERVIEW */}

            <div className="bg-zinc-900 border border-purple-500 rounded-2xl p-6">

              <h3 className="text-xl font-black text-purple-400 mb-6">
                Transaction Overview
              </h3>

              <div className="grid grid-cols-2 gap-5">

                <div className="bg-black rounded-xl p-4 border border-green-500">

                  <p className="text-xs text-gray-500 uppercase">
                    Completed
                  </p>

                  <h2 className="text-3xl font-black text-green-400 mt-2">
                    {historyStats.completed}
                  </h2>

                </div>

                <div className="bg-black rounded-xl p-4 border border-yellow-500">

                  <p className="text-xs text-gray-500 uppercase">
                    Pending
                  </p>

                  <h2 className="text-3xl font-black text-yellow-400 mt-2">
                    {historyStats.pending}
                  </h2>

                </div>

                <div className="bg-black rounded-xl p-4 border border-cyan-500">

                  <p className="text-xs text-gray-500 uppercase">
                    Buy Orders
                  </p>

                  <h2 className="text-3xl font-black text-cyan-400 mt-2">
                    {historyStats.totalBought.toFixed(2)}
                  </h2>

                </div>

                <div className="bg-black rounded-xl p-4 border border-purple-500">

                  <p className="text-xs text-gray-500 uppercase">
                    Sell Orders
                  </p>

                  <h2 className="text-3xl font-black text-purple-400 mt-2">
                    {historyStats.totalSold.toFixed(2)}
                  </h2>

                </div>

              </div>

              <div className="mt-6 bg-black rounded-xl p-4 border border-zinc-700">

                <p className="text-sm text-gray-500">
                  Total Transactions
                </p>

                <h2 className="text-3xl font-black text-white mt-2">
                  {historyStats.totalTransactions}
                </h2>

              </div>

            </div>

          </div>

        </section>
                {/* ================================================= */}
        {/* QUICK ACTIONS */}
        {/* ================================================= */}

        <section className="space-y-6">

          <div className="flex items-center justify-between">

            <h2 className="text-3xl font-black text-cyan-400">
              Quick Actions
            </h2>

            <span className="bg-cyan-500/20 text-cyan-400 border border-cyan-500 px-4 py-2 rounded-full text-sm font-bold">
              TRADING TOOLS
            </span>

          </div>

          <div className="grid lg:grid-cols-3 gap-6">

            {/* BUY USDT */}

            <Link
              href="/usdt/buy"
              className="bg-gradient-to-r from-cyan-500 to-blue-500 rounded-2xl p-6 hover:scale-[1.02] transition"
            >
              <div className="flex justify-between items-center">

                <div>

                  <p className="text-black font-bold">
                    Buy USDT
                  </p>

                  <h3 className="text-3xl font-black text-black mt-2">
                    Purchase
                  </h3>

                </div>

                <ArrowUpRight
                  size={40}
                  className="text-black"
                />

              </div>

              <p className="text-black mt-6 font-medium">
                Buy USDT at live market rate.
              </p>

            </Link>

            {/* SELL USDT */}

            <Link
              href="/usdt/sell"
              className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl p-6 hover:scale-[1.02] transition"
            >
              <div className="flex justify-between items-center">

                <div>

                  <p className="text-black font-bold">
                    Sell USDT
                  </p>

                  <h3 className="text-3xl font-black text-black mt-2">
                    Liquidate
                  </h3>

                </div>

                <ArrowDownRight
                  size={40}
                  className="text-black"
                />

              </div>

              <p className="text-black mt-6 font-medium">
                Convert USDT into PKR instantly.
              </p>

            </Link>

            {/* DASHBOARD */}

            <Link
              href="/usdt"
              className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl p-6 hover:scale-[1.02] transition"
            >
              <div className="flex justify-between items-center">

                <div>

                  <p className="text-black font-bold">
                    Dashboard
                  </p>

                  <h3 className="text-3xl font-black text-black mt-2">
                    Overview
                  </h3>

                </div>

                <Wallet
                  size={40}
                  className="text-black"
                />

              </div>

              <p className="text-black mt-6 font-medium">
                Return to USDT dashboard.
              </p>

            </Link>

          </div>

        </section>

        {/* ================================================= */}
        {/* PORTFOLIO INSIGHTS */}
        {/* ================================================= */}

        <section className="grid lg:grid-cols-2 gap-6">

          <div className="bg-zinc-900 border border-cyan-500 rounded-2xl p-6">

            <h3 className="text-xl font-black text-cyan-400 mb-5">
              Portfolio Insights
            </h3>

            <div className="space-y-4">

              <div className="flex justify-between">

                <span className="text-gray-400">
                  Holdings
                </span>

                <span className="font-bold text-cyan-400">
                  {portfolioSummary.holdings.toFixed(2)} USDT
                </span>

              </div>

              <div className="flex justify-between">

                <span className="text-gray-400">
                  Avg Buy Price
                </span>

                <span className="font-bold text-yellow-400">
                  PKR {portfolio.averageBuyPrice.toLocaleString()}
                </span>

              </div>

              <div className="flex justify-between">

                <span className="text-gray-400">
                  Current Sell Price
                </span>

                <span className="font-bold text-green-400">
                  PKR {market.sellPrice.toLocaleString()}
                </span>

              </div>

              <div className="flex justify-between">

                <span className="text-gray-400">
                  Current Value
                </span>

                <span className="font-bold text-purple-400">
                  PKR {portfolioSummary.currentValue.toLocaleString()}
                </span>

              </div>

            </div>

          </div>

          <div className="bg-zinc-900 border border-green-500 rounded-2xl p-6">

            <h3 className="text-xl font-black text-green-400 mb-5">
              Market Position
            </h3>

            <div className="space-y-5">

              <div className="flex justify-between">

                <span className="text-gray-400">
                  Trading Status
                </span>

                <span
                  className={
                    market.tradingEnabled
                      ? "text-green-400 font-bold"
                      : "text-red-400 font-bold"
                  }
                >
                  {market.tradingEnabled
                    ? "Enabled"
                    : "Disabled"}
                </span>

              </div>

              <div className="flex justify-between">

                <span className="text-gray-400">
                  Market Status
                </span>

                <span
                  className={
                    market.marketStatus === "OPEN"
                      ? "text-green-400 font-bold"
                      : "text-red-400 font-bold"
                  }
                >
                  {market.marketStatus}
                </span>

              </div>

              <div className="flex justify-between">

                <span className="text-gray-400">
                  Profit %
                </span>

                <span
                  className={
                    portfolioSummary.profitPercentage >= 0
                      ? "text-green-400 font-bold"
                      : "text-red-400 font-bold"
                  }
                >
                  {portfolioSummary.profitPercentage.toFixed(2)}%
                </span>

              </div>

              <div className="flex justify-between">

                <span className="text-gray-400">
                  Portfolio Result
                </span>

                <span
                  className={
                    portfolioSummary.profitLoss >= 0
                      ? "text-green-400 font-bold"
                      : "text-red-400 font-bold"
                  }
                >
                  {portfolioSummary.profitLoss >= 0
                    ? "Profit"
                    : "Loss"}
                </span>

              </div>

            </div>

          </div>

        </section>
                {/* ================================================= */}
        {/* TRANSACTION HISTORY TOOLBAR */}
        {/* PART 8/12 */}
        {/* Paste AFTER Portfolio Insights */}
        {/* ================================================= */}

        <section className="bg-zinc-900 border border-cyan-500 rounded-2xl p-6 space-y-6">

          <div className="flex flex-wrap items-center justify-between gap-4">

            <div>

              <h2 className="text-3xl font-black text-cyan-400">
                Portfolio History
              </h2>

              <p className="text-gray-400 mt-2">
                Search and filter your USDT buy/sell portfolio transactions.
              </p>

            </div>

            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="bg-cyan-500 hover:bg-cyan-400 disabled:bg-cyan-700 disabled:cursor-not-allowed text-black px-5 py-3 rounded-xl flex items-center gap-2 font-bold transition"
            >
              <RefreshCw
                size={18}
                className={refreshing ? "animate-spin" : ""}
              />
              Refresh
            </button>

          </div>

          {/* ============================================== */}
          {/* SEARCH + FILTER */}
          {/* ============================================== */}

          <div className="grid lg:grid-cols-3 gap-5">

            {/* SEARCH */}

            <div className="relative">

              <Search
                size={18}
                className="absolute left-4 top-4 text-gray-500"
              />

              <input
                type="text"
                placeholder="Search transaction..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full bg-black border border-zinc-700 rounded-xl pl-11 pr-4 py-3 focus:border-cyan-500 outline-none"
              />

            </div>

            {/* TYPE FILTER */}

            <select
              value={filterType}
              onChange={(e) => {
                setFilterType(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-black border border-zinc-700 rounded-xl px-4 py-3 focus:border-cyan-500 outline-none"
            >
              <option value="ALL">All Transactions</option>
              <option value="BUY">Buy Orders</option>
              <option value="SELL">Sell Orders</option>
            </select>

            {/* STATUS FILTER */}

            <select
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-black border border-zinc-700 rounded-xl px-4 py-3 focus:border-cyan-500 outline-none"
            >
              <option value="ALL">All Status</option>
              <option value="Completed">Completed</option>
              <option value="Pending">Pending</option>
              <option value="Rejected">Rejected</option>
            </select>

          </div>

          {/* ============================================== */}
          {/* HISTORY STATISTICS */}
          {/* ============================================== */}

          <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-5">

            <div className="bg-black border border-blue-500 rounded-xl p-4">

              <p className="text-gray-500 text-sm">
                Total Transactions
              </p>

              <h3 className="text-2xl font-black text-blue-400 mt-2">
                {historyStats.totalTransactions}
              </h3>

            </div>

            <div className="bg-black border border-green-500 rounded-xl p-4">

              <p className="text-gray-500 text-sm">
                Completed Orders
              </p>

              <h3 className="text-2xl font-black text-green-400 mt-2">
                {historyStats.completed}
              </h3>

            </div>

            <div className="bg-black border border-yellow-500 rounded-xl p-4">

              <p className="text-gray-500 text-sm">
                Pending Orders
              </p>

              <h3 className="text-2xl font-black text-yellow-400 mt-2">
                {historyStats.pending}
              </h3>

            </div>

            <div className="bg-black border border-cyan-500 rounded-xl p-4">

              <p className="text-gray-500 text-sm">
                Showing Records
              </p>

              <h3 className="text-2xl font-black text-cyan-400 mt-2">
                {paginatedHistory.length}
              </h3>

            </div>

          </div>

        </section>
                {/* ================================================= */}
        {/* DESKTOP TRANSACTION HISTORY TABLE */}
        {/* PART 9/12 */}
        {/* Paste AFTER History Toolbar */}
        {/* ================================================= */}

        <section className="hidden lg:block bg-zinc-900 border border-cyan-500 rounded-2xl overflow-hidden">

          <div className="px-6 py-5 border-b border-zinc-800 flex items-center justify-between">

            <h2 className="text-2xl font-black text-cyan-400">
              Transaction History
            </h2>

            <span className="text-sm text-gray-400">
              {filteredHistory.length} Records Found
            </span>

          </div>

          <div className="overflow-x-auto">

            <table className="w-full min-w-[1000px]">

              <thead className="bg-black">

                <tr className="text-gray-400 text-sm">

                  <th className="text-left px-5 py-4">Date</th>

                  <th className="text-left px-5 py-4">Type</th>

                  <th className="text-left px-5 py-4">USDT</th>

                  <th className="text-left px-5 py-4">Rate</th>

                  <th className="text-left px-5 py-4">Total PKR</th>

                  <th className="text-left px-5 py-4">Status</th>

                </tr>

              </thead>

              <tbody>

                {paginatedHistory.length === 0 ? (

                  <tr>

                    <td
                      colSpan={6}
                      className="text-center py-10 text-gray-500"
                    >
                      No transactions found.
                    </td>

                  </tr>

                ) : (

                  paginatedHistory.map((item) => (

                    <tr
                      key={item._id}
                      className="border-t border-zinc-800 hover:bg-zinc-800/40 transition"
                    >

                      {/* DATE */}

                      <td className="px-5 py-4">

                        <div className="font-semibold">
                          {new Date(item.createdAt).toLocaleDateString()}
                        </div>

                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(item.createdAt).toLocaleTimeString()}
                        </p>

                      </td>

                      {/* TYPE */}

                      <td className="px-5 py-4">

                        {item.type === "BUY" ? (

                          <span className="inline-flex items-center gap-2 bg-cyan-500/20 text-cyan-400 border border-cyan-500 px-3 py-1 rounded-full text-sm font-bold">
                            <ArrowUpRight size={15} />
                            BUY
                          </span>

                        ) : (

                          <span className="inline-flex items-center gap-2 bg-green-500/20 text-green-400 border border-green-500 px-3 py-1 rounded-full text-sm font-bold">
                            <ArrowDownRight size={15} />
                            SELL
                          </span>

                        )}

                      </td>

                      {/* USDT */}

                      <td className="px-5 py-4">

                        <span className="font-bold text-cyan-400">
                          {Number(item.usdtAmount).toFixed(2)} USDT
                        </span>

                      </td>

                      {/* RATE */}

                      <td className="px-5 py-4">

                        <span className="font-bold text-yellow-400">
                          PKR {Number(item.price).toLocaleString()}
                        </span>

                      </td>

                      {/* TOTAL */}

                      <td className="px-5 py-4">

                        <span className="font-bold text-white">
                          PKR {Number(item.totalAmount).toLocaleString()}
                        </span>

                      </td>

                      {/* STATUS */}

                      <td className="px-5 py-4">

                        {item.status === "Completed" && (
                          <span className="px-3 py-1 rounded-full bg-green-500/20 text-green-400 border border-green-500 text-sm font-bold">
                            Completed
                          </span>
                        )}

                        {item.status === "Pending" && (
                          <span className="px-3 py-1 rounded-full bg-yellow-500/20 text-yellow-400 border border-yellow-500 text-sm font-bold">
                            Pending
                          </span>
                        )}

                        {item.status === "Rejected" && (
                          <span className="px-3 py-1 rounded-full bg-red-500/20 text-red-400 border border-red-500 text-sm font-bold">
                            Rejected
                          </span>
                        )}

                      </td>

                    </tr>

                  ))

                )}

              </tbody>

            </table>

          </div>

        </section>
                {/* ================================================= */}
        {/* MOBILE TRANSACTION HISTORY CARDS */}
        {/* PART 10/12 */}
        {/* Paste AFTER Desktop History Table */}
        {/* ================================================= */}

        <section className="lg:hidden space-y-4">

          <div className="flex items-center justify-between">

            <h2 className="text-2xl font-black text-cyan-400">
              Portfolio History
            </h2>

            <span className="text-sm text-gray-400">
              {filteredHistory.length} Records
            </span>

          </div>

          {paginatedHistory.length === 0 ? (

            <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-10 text-center">

              <Wallet size={42} className="mx-auto text-gray-600 mb-4" />

              <h3 className="text-lg font-bold text-gray-400">
                No Transactions Found
              </h3>

              <p className="text-gray-500 mt-2 text-sm">
                Buy or Sell USDT transactions will appear here.
              </p>

            </div>

          ) : (

            paginatedHistory.map((item) => (

              <div
                key={item._id}
                className="bg-zinc-900 border border-zinc-700 rounded-2xl p-5 space-y-4"
              >

                {/* Top Row */}

                <div className="flex justify-between items-start">

                  <div>

                    <p className="text-gray-500 text-xs uppercase">
                      Transaction Date
                    </p>

                    <h4 className="font-bold mt-1">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </h4>

                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(item.createdAt).toLocaleTimeString()}
                    </p>

                  </div>

                  {item.type === "BUY" ? (

                    <span className="flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/20 border border-cyan-500 text-cyan-400 text-xs font-bold">
                      <ArrowUpRight size={14} />
                      BUY
                    </span>

                  ) : (

                    <span className="flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/20 border border-green-500 text-green-400 text-xs font-bold">
                      <ArrowDownRight size={14} />
                      SELL
                    </span>

                  )}

                </div>

                {/* Amount */}

                <div className="grid grid-cols-2 gap-4">

                  <div>

                    <p className="text-gray-500 text-xs">
                      USDT Amount
                    </p>

                    <h3 className="text-cyan-400 text-xl font-black mt-1">
                      {Number(item.usdtAmount).toFixed(2)}
                    </h3>

                  </div>

                  <div>

                    <p className="text-gray-500 text-xs">
                      Price
                    </p>

                    <h3 className="text-yellow-400 text-xl font-black mt-1">
                      PKR {Number(item.price).toLocaleString()}
                    </h3>

                  </div>

                </div>

                {/* Total */}

                <div className="bg-black rounded-xl border border-zinc-700 p-4 flex justify-between items-center">

                  <div>

                    <p className="text-gray-500 text-xs uppercase">
                      Total PKR
                    </p>

                    <h3 className="text-white text-2xl font-black mt-1">
                      PKR {Number(item.totalAmount).toLocaleString()}
                    </h3>

                  </div>

                  <DollarSign className="text-green-400" size={28} />

                </div>

                {/* Status */}

                <div className="flex justify-between items-center">

                  <span className="text-gray-500 text-sm">
                    Order Status
                  </span>

                  {item.status === "Completed" && (
                    <span className="bg-green-500/20 border border-green-500 text-green-400 px-3 py-1 rounded-full text-xs font-bold">
                      Completed
                    </span>
                  )}

                  {item.status === "Pending" && (
                    <span className="bg-yellow-500/20 border border-yellow-500 text-yellow-400 px-3 py-1 rounded-full text-xs font-bold">
                      Pending
                    </span>
                  )}

                  {item.status === "Rejected" && (
                    <span className="bg-red-500/20 border border-red-500 text-red-400 px-3 py-1 rounded-full text-xs font-bold">
                      Rejected
                    </span>
                  )}

                </div>

              </div>

            ))

          )}

        </section>
                {/* ================================================= */}
        {/* ENTERPRISE PAGINATION */}
        {/* PART 11/12 */}
        {/* Paste AFTER Mobile History Cards */}
        {/* ================================================= */}

        <section className="bg-zinc-900 border border-cyan-500 rounded-2xl p-6 space-y-6">

          {/* RESULTS SUMMARY */}

          <div className="grid md:grid-cols-4 gap-5">

            <div className="bg-black border border-blue-500 rounded-xl p-4">

              <p className="text-gray-500 text-xs uppercase">
                Current Page
              </p>

              <h3 className="text-3xl font-black text-blue-400 mt-2">
                {currentPage}
              </h3>

            </div>

            <div className="bg-black border border-cyan-500 rounded-xl p-4">

              <p className="text-gray-500 text-xs uppercase">
                Total Pages
              </p>

              <h3 className="text-3xl font-black text-cyan-400 mt-2">
                {totalPages || 1}
              </h3>

            </div>

            <div className="bg-black border border-green-500 rounded-xl p-4">

              <p className="text-gray-500 text-xs uppercase">
                Showing Records
              </p>

              <h3 className="text-3xl font-black text-green-400 mt-2">
                {paginatedHistory.length}
              </h3>

            </div>

            <div className="bg-black border border-purple-500 rounded-xl p-4">

              <p className="text-gray-500 text-xs uppercase">
                Total Records
              </p>

              <h3 className="text-3xl font-black text-purple-400 mt-2">
                {filteredHistory.length}
              </h3>

            </div>

          </div>

          {/* PAGINATION BUTTONS */}

          <div className="flex flex-wrap items-center justify-center gap-3">

            {/* PREVIOUS */}

            <button
              onClick={() =>
                setCurrentPage((page) => Math.max(page - 1, 1))
              }
              disabled={currentPage === 1}
              className="px-5 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed transition font-bold"
            >
              Previous
            </button>

            {/* PAGE NUMBERS */}

            {Array.from(
              { length: totalPages || 1 },
              (_, index) => index + 1
            ).map((page) => (

              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`w-11 h-11 rounded-xl font-bold transition ${
                  currentPage === page
                    ? "bg-cyan-500 text-black"
                    : "bg-zinc-800 hover:bg-zinc-700 text-white"
                }`}
              >
                {page}
              </button>

            ))}

            {/* NEXT */}

            <button
              onClick={() =>
                setCurrentPage((page) =>
                  Math.min(page + 1, totalPages || 1)
                )
              }
              disabled={currentPage === totalPages || totalPages === 0}
              className="px-5 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed transition font-bold"
            >
              Next
            </button>

          </div>

          {/* PAGE INFO */}

          <div className="text-center text-gray-400 text-sm border-t border-zinc-800 pt-5">

            Showing{" "}

            <span className="text-cyan-400 font-bold">
              {filteredHistory.length === 0
                ? 0
                : (currentPage - 1) * rowsPerPage + 1}
            </span>

            {" "}to{" "}

            <span className="text-cyan-400 font-bold">
              {Math.min(
                currentPage * rowsPerPage,
                filteredHistory.length
              )}
            </span>

            {" "}of{" "}

            <span className="text-cyan-400 font-bold">
              {filteredHistory.length}
            </span>

            {" "}transactions.

          </div>

          {/* TRANSACTION SUMMARY */}

          <div className="grid md:grid-cols-2 gap-5">

            <div className="bg-black border border-green-500 rounded-xl p-5">

              <p className="text-gray-500 text-sm">
                Total Buy Volume
              </p>

              <h3 className="text-3xl font-black text-green-400 mt-2">
                {historyStats.totalBought.toFixed(2)} USDT
              </h3>

            </div>

            <div className="bg-black border border-purple-500 rounded-xl p-5">

              <p className="text-gray-500 text-sm">
                Total Sell Volume
              </p>

              <h3 className="text-3xl font-black text-purple-400 mt-2">
                {historyStats.totalSold.toFixed(2)} USDT
              </h3>

            </div>

          </div>

        </section>
                {/* ================================================= */}
        {/* EMPTY PORTFOLIO STATE */}
        {/* PART 12/12 */}
        {/* Paste AFTER Pagination Section */}
        {/* ================================================= */}

        {portfolioSummary.holdings === 0 && (

          <section className="bg-zinc-900 border border-yellow-500 rounded-2xl p-8 text-center">

            <Coins size={48} className="mx-auto text-yellow-400 mb-4" />

            <h2 className="text-2xl font-black text-yellow-400">
              Your USDT Portfolio is Empty
            </h2>

            <p className="text-gray-400 mt-3 max-w-xl mx-auto">
              You haven't purchased any USDT yet. Start building your portfolio
              by buying USDT at the current market rate.
            </p>

            <div className="flex flex-wrap justify-center gap-4 mt-8">

              <Link
                href="/usdt/buy"
                className="bg-cyan-500 hover:bg-cyan-400 text-black px-6 py-3 rounded-xl font-bold transition flex items-center gap-2"
              >
                <ArrowUpRight size={18} />
                Buy USDT
              </Link>

              <Link
                href="/usdt"
                className="bg-zinc-800 hover:bg-zinc-700 px-6 py-3 rounded-xl font-bold transition flex items-center gap-2"
              >
                <ArrowLeft size={18} />
                Back to Dashboard
              </Link>

            </div>

          </section>

        )}

        {/* ================================================= */}
        {/* LIVE PORTFOLIO INFORMATION */}
        {/* ================================================= */}

        <section className="bg-zinc-900 border border-cyan-500 rounded-2xl p-6">

          <div className="flex flex-wrap justify-between gap-6 items-center">

            <div>

              <h2 className="text-xl font-black text-cyan-400">
                Live Portfolio Information
              </h2>

              <p className="text-gray-400 mt-2">
                Portfolio values are calculated using the current USDT sell price.
              </p>

            </div>

            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="bg-cyan-500 hover:bg-cyan-400 disabled:bg-cyan-700 disabled:cursor-not-allowed text-black px-5 py-3 rounded-xl font-bold flex items-center gap-2 transition"
            >
              <RefreshCw
                size={18}
                className={refreshing ? "animate-spin" : ""}
              />

              {refreshing ? "Refreshing..." : "Refresh Now"}

            </button>

          </div>

          <div className="grid md:grid-cols-3 gap-5 mt-6">

            <div className="bg-black border border-cyan-500 rounded-xl p-4">

              <p className="text-gray-500 text-sm">
                Buy Price
              </p>

              <h3 className="text-2xl font-black text-cyan-400 mt-2">
                PKR {market.buyPrice.toLocaleString()}
              </h3>

            </div>

            <div className="bg-black border border-green-500 rounded-xl p-4">

              <p className="text-gray-500 text-sm">
                Sell Price
              </p>

              <h3 className="text-2xl font-black text-green-400 mt-2">
                PKR {market.sellPrice.toLocaleString()}
              </h3>

            </div>

            <div className="bg-black border border-purple-500 rounded-xl p-4">

              <p className="text-gray-500 text-sm">
                Last Refresh
              </p>

              <h3 className="text-lg font-black text-purple-400 mt-2">
                {new Date().toLocaleString()}
              </h3>

            </div>

          </div>

        </section>

        {/* ================================================= */}
        {/* ENTERPRISE FOOTER */}
        {/* ================================================= */}

        <footer className="border-t border-zinc-800 pt-8 mt-10">

          <div className="grid md:grid-cols-3 gap-6">

            <div>

              <h3 className="text-lg font-black text-cyan-400 mb-3">
                GoldTrade V18 Enterprise
              </h3>

              <p className="text-gray-500 text-sm">
                USDT Portfolio Manager provides live holdings, wallet analytics,
                profit/loss tracking, and enterprise trading history.
              </p>

            </div>

            <div>

              <h3 className="text-lg font-black text-green-400 mb-3">
                Portfolio Features
              </h3>

              <ul className="space-y-2 text-sm text-gray-500">

                <li>• Live Portfolio Valuation</li>

                <li>• Profit / Loss Analytics</li>

                <li>• Wallet Synchronization</li>

                <li>• Search & Filters</li>

                <li>• Buy / Sell History</li>

                <li>• Enterprise Pagination</li>

              </ul>

            </div>

            <div>

              <h3 className="text-lg font-black text-purple-400 mb-3">
                Trading Status
              </h3>

              <div className="space-y-3">

                <div className="flex justify-between">

                  <span className="text-gray-500">
                    Market
                  </span>

                  <span
                    className={
                      market.marketStatus === "OPEN"
                        ? "text-green-400 font-bold"
                        : "text-red-400 font-bold"
                    }
                  >
                    {market.marketStatus}
                  </span>

                </div>

                <div className="flex justify-between">

                  <span className="text-gray-500">
                    Trading
                  </span>

                  <span
                    className={
                      market.tradingEnabled
                        ? "text-cyan-400 font-bold"
                        : "text-red-400 font-bold"
                    }
                  >
                    {market.tradingEnabled ? "Enabled" : "Disabled"}
                  </span>

                </div>

                <div className="flex justify-between">

                  <span className="text-gray-500">
                    Portfolio
                  </span>

                  <span className="text-cyan-400 font-bold">
                    {portfolioSummary.holdings.toFixed(2)} USDT
                  </span>

                </div>

              </div>

            </div>

          </div>

          <div className="border-t border-zinc-800 mt-8 pt-6 flex flex-wrap justify-between items-center gap-4">

            <p className="text-gray-500 text-sm">
              © 2026 GoldTrade Enterprise. All rights reserved.
            </p>

            <div className="flex gap-3 flex-wrap">

              <Link
                href="/usdt"
                className="text-cyan-400 hover:text-cyan-300 text-sm font-semibold"
              >
                Dashboard
              </Link>

              <Link
                href="/usdt/buy"
                className="text-cyan-400 hover:text-cyan-300 text-sm font-semibold"
              >
                Buy USDT
              </Link>

              <Link
                href="/usdt/sell"
                className="text-cyan-400 hover:text-cyan-300 text-sm font-semibold"
              >
                Sell USDT
              </Link>

            </div>

          </div>

        </footer>

      </div>
    </main>
  );
}