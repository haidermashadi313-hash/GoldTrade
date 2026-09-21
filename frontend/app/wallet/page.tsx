"use client";

/*
=========================================================
 GoldTrade V18 Enterprise
 Wallet Dashboard
 PART 1/12
 Linux Safe • TypeScript Safe • Render Ready • Vercel Ready
=========================================================
*/

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import {
  Wallet,
  DollarSign,
  Coins,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  ShieldCheck,
  Search,
  Filter,
  History,
  CreditCard,
} from "lucide-react";

// =====================================================
// API URL
// =====================================================

const API =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

// =====================================================
// INTERFACES
// =====================================================

interface WalletData {
  pkrBalance: number;
  goldBalance: number;
  usdtBalance: number;
}

interface GoldMarket {
  buyPrice: number;
  sellPrice: number;
  marketStatus: "OPEN" | "CLOSED";
  tradingEnabled: boolean;
}

interface UsdtMarket {
  buyPrice: number;
  sellPrice: number;
  marketStatus: "OPEN" | "CLOSED";
  tradingEnabled: boolean;
}

interface WalletTransaction {
  _id: string;
  type: string;
  walletType: "PKR" | "GOLD" | "USDT";
  amount: number;
  status: "Pending" | "Completed" | "Rejected";
  createdAt: string;
  note?: string;
}

// =====================================================
// COMPONENT
// =====================================================

export default function WalletPage() {
  // ===================================================
  // USER
  // ===================================================

  const [username, setUsername] = useState("");

  // ===================================================
  // LOADING
  // ===================================================

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // ===================================================
  // WALLET STATE
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
    tradingEnabled: true,
  });

  // ===================================================
  // USDT MARKET
  // ===================================================

  const [usdtMarket, setUsdtMarket] = useState<UsdtMarket>({
    buyPrice: 0,
    sellPrice: 0,
    marketStatus: "OPEN",
    tradingEnabled: true,
  });

  // ===================================================
  // TRANSACTIONS
  // ===================================================

  const [transactions, setTransactions] = useState<
    WalletTransaction[]
  >([]);

  // ===================================================
  // SEARCH + FILTER
  // ===================================================

  const [search, setSearch] = useState("");
  const [filterWallet, setFilterWallet] = useState("ALL");
  const [filterStatus, setFilterStatus] = useState("ALL");

  // ===================================================
  // PAGINATION
  // ===================================================

  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  // ===================================================
  // AUTH HEADER
  // ===================================================

  const getHeaders = () => {
    const token = localStorage.getItem("token");

    return {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };
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
  // LOAD GOLD MARKET
  // =====================================================

  const loadGoldMarket = async () => {
    try {
      const response = await fetch(`${API}/api/gold/price`);
      const data = await response.json();

      if (response.ok && data.success) {
        setGoldMarket({
          buyPrice: Number(data.buyPrice || 0),
          sellPrice: Number(data.sellPrice || 0),
          marketStatus: data.marketStatus || "OPEN",
          tradingEnabled: Boolean(data.tradingEnabled),
        });
      }
    } catch (error) {
      console.error("Gold Market Load Error:", error);
    }
  };

  // =====================================================
  // LOAD USDT MARKET
  // =====================================================

  const loadUsdtMarket = async () => {
    try {
      const response = await fetch(`${API}/api/usdt/price`);
      const data = await response.json();

      if (response.ok && data.success) {
        setUsdtMarket({
          buyPrice: Number(data.buyPrice || 0),
          sellPrice: Number(data.sellPrice || 0),
          marketStatus: data.marketStatus || "OPEN",
          tradingEnabled: Boolean(data.tradingEnabled),
        });
      }
    } catch (error) {
      console.error("USDT Market Load Error:", error);
    }
  };

  // =====================================================
  // LOAD WALLET TRANSACTIONS
  // =====================================================

  const loadTransactions = async (currentUsername: string) => {
    try {
      const response = await fetch(
        `${API}/api/transaction/history/${currentUsername}`,
        {
          headers: getHeaders(),
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        setTransactions(data.transactions || []);
      }
    } catch (error) {
      console.error("Transaction Load Error:", error);
    }
  };

  // =====================================================
  // LOAD COMPLETE WALLET DASHBOARD
  // =====================================================

  const loadCompleteWallet = async (currentUsername: string) => {
    try {
      setLoading(true);
      setErrorMessage("");

      await Promise.all([
        loadWallet(currentUsername),
        loadGoldMarket(),
        loadUsdtMarket(),
        loadTransactions(currentUsername),
      ]);
    } catch (error: any) {
      console.error(error);

      setErrorMessage(
        error.message || "Unable to load wallet dashboard."
      );
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // REFRESH WALLET
  // =====================================================

  const refreshWallet = async () => {
    if (!username) return;

    try {
      setRefreshing(true);
      await loadCompleteWallet(username);
    } finally {
      setRefreshing(false);
    }
  };

  // =====================================================
  // INITIAL PAGE LOAD
  // =====================================================

  useEffect(() => {
    const currentUsername =
      localStorage.getItem("username") || "";

    setUsername(currentUsername);

    if (currentUsername) {
      loadCompleteWallet(currentUsername);
    }
  }, []);
    // =====================================================
  // ENTERPRISE WALLET CALCULATIONS
  // Paste AFTER useEffect()
  // =====================================================

  const walletSummary = useMemo(() => {
    const pkrBalance = Number(wallet.pkrBalance || 0);
    const goldBalance = Number(wallet.goldBalance || 0);
    const usdtBalance = Number(wallet.usdtBalance || 0);

    const goldValuePKR =
      goldBalance * Number(goldMarket.sellPrice || 0);

    const usdtValuePKR =
      usdtBalance * Number(usdtMarket.sellPrice || 0);

    const totalWalletValue =
      pkrBalance + goldValuePKR + usdtValuePKR;

    return {
      pkrBalance,
      goldBalance,
      usdtBalance,
      goldValuePKR,
      usdtValuePKR,
      totalWalletValue,
    };
  }, [wallet, goldMarket, usdtMarket]);

  // =====================================================
  // TRANSACTION STATISTICS
  // =====================================================

  const transactionStats = useMemo(() => {
    let completed = 0;
    let pending = 0;
    let rejected = 0;

    let totalPKR = 0;
    let totalGold = 0;
    let totalUsdt = 0;

    transactions.forEach((item) => {
      if (item.status === "Completed") completed++;
      if (item.status === "Pending") pending++;
      if (item.status === "Rejected") rejected++;

      if (item.walletType === "PKR") {
        totalPKR += Number(item.amount);
      }

      if (item.walletType === "GOLD") {
        totalGold += Number(item.amount);
      }

      if (item.walletType === "USDT") {
        totalUsdt += Number(item.amount);
      }
    });

    return {
      completed,
      pending,
      rejected,
      totalPKR,
      totalGold,
      totalUsdt,
      totalTransactions: transactions.length,
    };
  }, [transactions]);

  // =====================================================
  // SEARCH + FILTER ENGINE
  // =====================================================

  const filteredTransactions = useMemo(() => {
    return transactions.filter((item) => {

      const keyword = search.trim().toLowerCase();

      const matchesSearch =
        keyword === "" ||
        item.type.toLowerCase().includes(keyword) ||
        item.walletType.toLowerCase().includes(keyword) ||
        item.status.toLowerCase().includes(keyword) ||
        item.amount.toString().includes(keyword);

      const matchesWallet =
        filterWallet === "ALL" ||
        item.walletType === filterWallet;

      const matchesStatus =
        filterStatus === "ALL" ||
        item.status === filterStatus;

      return (
        matchesSearch &&
        matchesWallet &&
        matchesStatus
      );
    });
  }, [transactions, search, filterWallet, filterStatus]);

  // =====================================================
  // PAGINATION ENGINE
  // =====================================================

  const totalPages = Math.ceil(
    filteredTransactions.length / rowsPerPage
  );

  const paginatedTransactions = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    const end = start + rowsPerPage;

    return filteredTransactions.slice(start, end);
  }, [filteredTransactions, currentPage]);

  // =====================================================
  // WALLET DISTRIBUTION (%)
  // =====================================================

  const walletDistribution = useMemo(() => {
    const total = walletSummary.totalWalletValue || 1;

    return {
      pkr:
        (walletSummary.pkrBalance / total) * 100,
      gold:
        (walletSummary.goldValuePKR / total) * 100,
      usdt:
        (walletSummary.usdtValuePKR / total) * 100,
    };
  }, [walletSummary]);

  // =====================================================
  // REFRESH BUTTON HANDLER
  // =====================================================

  const handleRefresh = async () => {
    await refreshWallet();
  };
    // =====================================================
  // LOADING SCREEN
  // =====================================================

  if (loading) {
    return (
      <main className="min-h-screen bg-black flex items-center justify-center">
        <div className="flex items-center gap-4 text-cyan-400 text-xl font-bold">
          <RefreshCw className="animate-spin" size={30} />
          Loading Wallet Dashboard...
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

        <header className="flex flex-wrap items-center justify-between gap-5">

          <div>

            <h1 className="flex items-center gap-3 text-4xl font-black text-cyan-400">
              <Wallet size={38} />
              Wallet Dashboard
            </h1>

            <p className="text-gray-400 mt-2">
              Manage PKR, Gold and USDT balances from one enterprise wallet.
            </p>

          </div>

          <div className="flex flex-wrap gap-3">

            <Link
              href="/dashboard"
              className="bg-zinc-800 hover:bg-zinc-700 transition px-5 py-3 rounded-xl flex items-center gap-2 font-bold"
            >
              Dashboard
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

              {refreshing ? "Refreshing..." : "Refresh Wallet"}
            </button>

          </div>

        </header>

        {/* ============================================= */}
        {/* ERROR MESSAGE */}
        {/* ============================================= */}

        {errorMessage && (
          <div className="bg-red-500/10 border border-red-500 rounded-xl p-4 text-red-400 font-semibold">
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
                Live Market Status
              </h2>

              <p className="text-gray-400 mt-2">
                Gold and USDT live prices synchronized with wallet valuation.
              </p>

            </div>

            <div className="flex flex-wrap gap-3">

              <span
                className={`px-4 py-2 rounded-full font-bold ${
                  goldMarket.marketStatus === "OPEN"
                    ? "bg-green-500/20 border border-green-500 text-green-400"
                    : "bg-red-500/20 border border-red-500 text-red-400"
                }`}
              >
                Gold {goldMarket.marketStatus}
              </span>

              <span
                className={`px-4 py-2 rounded-full font-bold ${
                  usdtMarket.marketStatus === "OPEN"
                    ? "bg-cyan-500/20 border border-cyan-500 text-cyan-400"
                    : "bg-red-500/20 border border-red-500 text-red-400"
                }`}
              >
                USDT {usdtMarket.marketStatus}
              </span>

            </div>

          </div>

          {/* ============================================= */}
          {/* LIVE RATE CARDS */}
          {/* ============================================= */}

          <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-5 mt-6">

            {/* GOLD BUY */}

            <div className="bg-black border border-yellow-500 rounded-xl p-4">

              <p className="text-gray-500 text-sm">
                Gold Buy Price
              </p>

              <h3 className="text-2xl font-black text-yellow-400 mt-2">
                PKR {goldMarket.buyPrice.toLocaleString()}
              </h3>

            </div>

            {/* GOLD SELL */}

            <div className="bg-black border border-orange-500 rounded-xl p-4">

              <p className="text-gray-500 text-sm">
                Gold Sell Price
              </p>

              <h3 className="text-2xl font-black text-orange-400 mt-2">
                PKR {goldMarket.sellPrice.toLocaleString()}
              </h3>

            </div>

            {/* USDT BUY */}

            <div className="bg-black border border-cyan-500 rounded-xl p-4">

              <p className="text-gray-500 text-sm">
                USDT Buy Price
              </p>

              <h3 className="text-2xl font-black text-cyan-400 mt-2">
                PKR {usdtMarket.buyPrice.toLocaleString()}
              </h3>

            </div>

            {/* USDT SELL */}

            <div className="bg-black border border-green-500 rounded-xl p-4">

              <p className="text-gray-500 text-sm">
                USDT Sell Price
              </p>

              <h3 className="text-2xl font-black text-green-400 mt-2">
                PKR {usdtMarket.sellPrice.toLocaleString()}
              </h3>

            </div>

          </div>

          {/* ============================================= */}
          {/* MARKET INFO BAR */}
          {/* ============================================= */}

          <div className="grid md:grid-cols-2 gap-5 mt-6">

            <div className="bg-black border border-zinc-700 rounded-xl p-4">

              <div className="flex items-center justify-between">

                <span className="text-gray-400 text-sm">
                  Gold Trading
                </span>

                <span
                  className={
                    goldMarket.tradingEnabled
                      ? "text-green-400 font-bold"
                      : "text-red-400 font-bold"
                  }
                >
                  {goldMarket.tradingEnabled ? "Enabled" : "Disabled"}
                </span>

              </div>

            </div>

            <div className="bg-black border border-zinc-700 rounded-xl p-4">

              <div className="flex items-center justify-between">

                <span className="text-gray-400 text-sm">
                  USDT Trading
                </span>

                <span
                  className={
                    usdtMarket.tradingEnabled
                      ? "text-cyan-400 font-bold"
                      : "text-red-400 font-bold"
                  }
                >
                  {usdtMarket.tradingEnabled ? "Enabled" : "Disabled"}
                </span>

              </div>

            </div>

          </div>

        </section>
                {/* ================================================= */}
        {/* ENTERPRISE WALLET SUMMARY */}
        {/* PART 5/12 */}
        {/* Paste AFTER Live Market Banner */}
        {/* ================================================= */}

        <section className="space-y-6">

          <div className="flex items-center justify-between">

            <h2 className="text-3xl font-black text-cyan-400">
              Wallet Overview
            </h2>

            <span className="bg-cyan-500/20 text-cyan-400 border border-cyan-500 px-4 py-2 rounded-full text-sm font-bold">
              LIVE WALLET
            </span>

          </div>

          {/* ============================================= */}
          {/* ROW 1 */}
          {/* ============================================= */}

          <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-5">

            {/* PKR WALLET */}

            <div className="bg-zinc-900 border border-green-500 rounded-2xl p-5">

              <div className="flex justify-between items-center">

                <Wallet className="text-green-400" size={26} />

                <span className="text-xs text-green-400 font-bold">
                  PKR WALLET
                </span>

              </div>

              <p className="text-gray-500 text-sm mt-4">
                Cash Balance
              </p>

              <h2 className="text-3xl font-black text-green-400 mt-2">
                PKR {walletSummary.pkrBalance.toLocaleString()}
              </h2>

              <p className="text-xs text-gray-500 mt-2">
                Available for Deposit & Withdraw
              </p>

            </div>

            {/* GOLD WALLET */}

            <div className="bg-zinc-900 border border-yellow-500 rounded-2xl p-5">

              <div className="flex justify-between items-center">

                <Coins className="text-yellow-400" size={26} />

                <span className="text-xs text-yellow-400 font-bold">
                  GOLD WALLET
                </span>

              </div>

              <p className="text-gray-500 text-sm mt-4">
                Gold Holdings
              </p>

              <h2 className="text-3xl font-black text-yellow-400 mt-2">
                {walletSummary.goldBalance.toFixed(4)} g
              </h2>

              <p className="text-xs text-gray-500 mt-2">
                Physical Gold Balance
              </p>

            </div>

            {/* USDT WALLET */}

            <div className="bg-zinc-900 border border-cyan-500 rounded-2xl p-5">

              <div className="flex justify-between items-center">

                <DollarSign className="text-cyan-400" size={26} />

                <span className="text-xs text-cyan-400 font-bold">
                  USDT WALLET
                </span>

              </div>

              <p className="text-gray-500 text-sm mt-4">
                USDT Holdings
              </p>

              <h2 className="text-3xl font-black text-cyan-400 mt-2">
                {walletSummary.usdtBalance.toFixed(2)} USDT
              </h2>

              <p className="text-xs text-gray-500 mt-2">
                Digital Dollar Holdings
              </p>

            </div>

            {/* TOTAL WALLET VALUE */}

            <div className="bg-zinc-900 border border-purple-500 rounded-2xl p-5">

              <div className="flex justify-between items-center">

                <TrendingUp className="text-purple-400" size={26} />

                <span className="text-xs text-purple-400 font-bold">
                  NET WORTH
                </span>

              </div>

              <p className="text-gray-500 text-sm mt-4">
                Total Wallet Value
              </p>

              <h2 className="text-3xl font-black text-purple-400 mt-2">
                PKR {Math.round(walletSummary.totalWalletValue).toLocaleString()}
              </h2>

              <p className="text-xs text-gray-500 mt-2">
                PKR + Gold + USDT Combined
              </p>

            </div>

          </div>

          {/* ============================================= */}
          {/* ROW 2 */}
          {/* ============================================= */}

          <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-5">

            {/* GOLD VALUE */}

            <div className="bg-zinc-900 border border-orange-500 rounded-2xl p-5">

              <p className="text-gray-500 text-sm">
                Gold Market Value
              </p>

              <h2 className="text-3xl font-black text-orange-400 mt-2">
                PKR {Math.round(walletSummary.goldValuePKR).toLocaleString()}
              </h2>

              <p className="text-xs text-gray-500 mt-2">
                Based on Live Gold Sell Price
              </p>

            </div>

            {/* USDT VALUE */}

            <div className="bg-zinc-900 border border-blue-500 rounded-2xl p-5">

              <p className="text-gray-500 text-sm">
                USDT Market Value
              </p>

              <h2 className="text-3xl font-black text-blue-400 mt-2">
                PKR {Math.round(walletSummary.usdtValuePKR).toLocaleString()}
              </h2>

              <p className="text-xs text-gray-500 mt-2">
                Based on Live USDT Sell Price
              </p>

            </div>

            {/* GOLD RATE */}

            <div className="bg-zinc-900 border border-yellow-600 rounded-2xl p-5">

              <p className="text-gray-500 text-sm">
                Live Gold Sell Rate
              </p>

              <h2 className="text-3xl font-black text-yellow-400 mt-2">
                PKR {goldMarket.sellPrice.toLocaleString()}
              </h2>

            </div>

            {/* USDT RATE */}

            <div className="bg-zinc-900 border border-cyan-600 rounded-2xl p-5">

              <p className="text-gray-500 text-sm">
                Live USDT Sell Rate
              </p>

              <h2 className="text-3xl font-black text-cyan-400 mt-2">
                PKR {usdtMarket.sellPrice.toLocaleString()}
              </h2>

            </div>

          </div>

        </section>
                {/* ================================================= */}
        {/* WALLET ANALYTICS */}
        {/* PART 6/12 */}
        {/* Paste AFTER Wallet Summary Cards */}
        {/* ================================================= */}

        <section className="space-y-6">

          <div className="flex items-center justify-between">

            <h2 className="text-3xl font-black text-green-400">
              Wallet Analytics
            </h2>

            <span className="bg-green-500/20 border border-green-500 text-green-400 px-4 py-2 rounded-full text-sm font-bold">
              LIVE ANALYTICS
            </span>

          </div>

          {/* ============================================= */}
          {/* ANALYTICS CARDS */}
          {/* ============================================= */}

          <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-5">

            {/* TOTAL TRANSACTIONS */}

            <div className="bg-zinc-900 border border-blue-500 rounded-2xl p-5">

              <p className="text-gray-500 text-sm">
                Total Transactions
              </p>

              <h2 className="text-3xl font-black text-blue-400 mt-2">
                {transactionStats.totalTransactions}
              </h2>

            </div>

            {/* COMPLETED */}

            <div className="bg-zinc-900 border border-green-500 rounded-2xl p-5">

              <p className="text-gray-500 text-sm">
                Completed
              </p>

              <h2 className="text-3xl font-black text-green-400 mt-2">
                {transactionStats.completed}
              </h2>

            </div>

            {/* PENDING */}

            <div className="bg-zinc-900 border border-yellow-500 rounded-2xl p-5">

              <p className="text-gray-500 text-sm">
                Pending
              </p>

              <h2 className="text-3xl font-black text-yellow-400 mt-2">
                {transactionStats.pending}
              </h2>

            </div>

            {/* REJECTED */}

            <div className="bg-zinc-900 border border-red-500 rounded-2xl p-5">

              <p className="text-gray-500 text-sm">
                Rejected
              </p>

              <h2 className="text-3xl font-black text-red-400 mt-2">
                {transactionStats.rejected}
              </h2>

            </div>

          </div>

          {/* ============================================= */}
          {/* ASSET DISTRIBUTION */}
          {/* ============================================= */}

          <div className="grid lg:grid-cols-2 gap-6">

            {/* DISTRIBUTION PANEL */}

            <div className="bg-zinc-900 border border-cyan-500 rounded-2xl p-6">

              <h3 className="text-xl font-black text-cyan-400 mb-6">
                Wallet Asset Distribution
              </h3>

              <div className="space-y-5">

                {/* PKR */}

                <div>

                  <div className="flex justify-between text-sm mb-2">

                    <span className="text-green-400 font-semibold">
                      PKR Wallet
                    </span>

                    <span>
                      {walletDistribution.pkr.toFixed(1)}%
                    </span>

                  </div>

                  <div className="w-full h-3 bg-zinc-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-400 rounded-full"
                      style={{
                        width: `${walletDistribution.pkr}%`,
                      }}
                    />
                  </div>

                </div>

                {/* GOLD */}

                <div>

                  <div className="flex justify-between text-sm mb-2">

                    <span className="text-yellow-400 font-semibold">
                      Gold Wallet
                    </span>

                    <span>
                      {walletDistribution.gold.toFixed(1)}%
                    </span>

                  </div>

                  <div className="w-full h-3 bg-zinc-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-yellow-400 rounded-full"
                      style={{
                        width: `${walletDistribution.gold}%`,
                      }}
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
                      {walletDistribution.usdt.toFixed(1)}%
                    </span>

                  </div>

                  <div className="w-full h-3 bg-zinc-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-cyan-400 rounded-full"
                      style={{
                        width: `${walletDistribution.usdt}%`,
                      }}
                    />
                  </div>

                </div>

              </div>

            </div>

            {/* PERFORMANCE PANEL */}

            <div className="bg-zinc-900 border border-purple-500 rounded-2xl p-6">

              <h3 className="text-xl font-black text-purple-400 mb-6">
                Wallet Performance
              </h3>

              <div className="space-y-5">

                <div className="flex justify-between">

                  <span className="text-gray-400">
                    PKR Assets
                  </span>

                  <span className="font-bold text-green-400">
                    PKR {walletSummary.pkrBalance.toLocaleString()}
                  </span>

                </div>

                <div className="flex justify-between">

                  <span className="text-gray-400">
                    Gold Market Value
                  </span>

                  <span className="font-bold text-yellow-400">
                    PKR {Math.round(walletSummary.goldValuePKR).toLocaleString()}
                  </span>

                </div>

                <div className="flex justify-between">

                  <span className="text-gray-400">
                    USDT Market Value
                  </span>

                  <span className="font-bold text-cyan-400">
                    PKR {Math.round(walletSummary.usdtValuePKR).toLocaleString()}
                  </span>

                </div>

                <div className="border-t border-zinc-700 pt-4 flex justify-between">

                  <span className="text-white font-semibold">
                    Total Net Worth
                  </span>

                  <span className="text-purple-400 text-xl font-black">
                    PKR {Math.round(walletSummary.totalWalletValue).toLocaleString()}
                  </span>

                </div>

              </div>

            </div>

          </div>

          {/* ============================================= */}
          {/* WALLET VOLUME SUMMARY */}
          {/* ============================================= */}

          <div className="grid md:grid-cols-3 gap-5">

            {/* PKR */}

            <div className="bg-zinc-900 border border-green-500 rounded-xl p-5">

              <p className="text-gray-500 text-sm">
                PKR Volume
              </p>

              <h2 className="text-2xl font-black text-green-400 mt-2">
                PKR {Math.round(transactionStats.totalPKR).toLocaleString()}
              </h2>

            </div>

            {/* GOLD */}

            <div className="bg-zinc-900 border border-yellow-500 rounded-xl p-5">

              <p className="text-gray-500 text-sm">
                Gold Volume
              </p>

              <h2 className="text-2xl font-black text-yellow-400 mt-2">
                {transactionStats.totalGold.toFixed(4)} g
              </h2>

            </div>

            {/* USDT */}

            <div className="bg-zinc-900 border border-cyan-500 rounded-xl p-5">

              <p className="text-gray-500 text-sm">
                USDT Volume
              </p>

              <h2 className="text-2xl font-black text-cyan-400 mt-2">
                {transactionStats.totalUsdt.toFixed(2)} USDT
              </h2>

            </div>

          </div>

        </section>
                {/* ================================================= */}
        {/* ENTERPRISE QUICK ACTIONS */}
        {/* PART 7/12 */}
        {/* Paste AFTER Wallet Analytics */}
        {/* ================================================= */}

        <section className="space-y-6">

          <div className="flex items-center justify-between">

            <h2 className="text-3xl font-black text-cyan-400">
              Wallet Quick Actions
            </h2>

            <span className="bg-cyan-500/20 border border-cyan-500 text-cyan-400 px-4 py-2 rounded-full text-sm font-bold">
              ACTION CENTER
            </span>

          </div>

          {/* ============================================= */}
          {/* FIRST ROW */}
          {/* ============================================= */}

          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">

            {/* Deposit */}

            <Link
              href="/wallet/deposit"
              className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl p-6 hover:scale-[1.02] transition"
            >
              <div className="flex justify-between items-center">

                <div>

                  <p className="text-black font-bold text-sm">
                    Deposit Funds
                  </p>

                  <h3 className="text-3xl font-black text-black mt-2">
                    PKR Deposit
                  </h3>

                </div>

                <ArrowDownRight className="text-black" size={42} />

              </div>

              <p className="text-black mt-5 font-medium">
                Deposit PKR into your wallet instantly.
              </p>

            </Link>

            {/* Withdraw */}

            <Link
              href="/wallet/withdraw"
              className="bg-gradient-to-r from-red-500 to-pink-600 rounded-2xl p-6 hover:scale-[1.02] transition"
            >
              <div className="flex justify-between items-center">

                <div>

                  <p className="text-black font-bold text-sm">
                    Withdraw Funds
                  </p>

                  <h3 className="text-3xl font-black text-black mt-2">
                    PKR Withdraw
                  </h3>

                </div>

                <ArrowUpRight className="text-black" size={42} />

              </div>

              <p className="text-black mt-5 font-medium">
                Transfer PKR from wallet to bank account.
              </p>

            </Link>

            {/* Wallet History */}

            <Link
              href="/wallet/history"
              className="bg-gradient-to-r from-blue-500 to-cyan-600 rounded-2xl p-6 hover:scale-[1.02] transition"
            >
              <div className="flex justify-between items-center">

                <div>

                  <p className="text-black font-bold text-sm">
                    Wallet Ledger
                  </p>

                  <h3 className="text-3xl font-black text-black mt-2">
                    History
                  </h3>

                </div>

                <History className="text-black" size={42} />

              </div>

              <p className="text-black mt-5 font-medium">
                View complete wallet transaction history.
              </p>

            </Link>

          </div>

          {/* ============================================= */}
          {/* SECOND ROW */}
          {/* ============================================= */}

          <div className="grid md:grid-cols-2 xl:grid-cols-2 gap-6">

            {/* Buy Gold */}

            <Link
              href="/gold/buy"
              className="bg-gradient-to-r from-yellow-500 to-orange-500 rounded-2xl p-6 hover:scale-[1.02] transition"
            >
              <div className="flex justify-between items-center">

                <div>

                  <p className="text-black font-bold text-sm">
                    Gold Trading
                  </p>

                  <h3 className="text-3xl font-black text-black mt-2">
                    Buy Gold
                  </h3>

                  <p className="text-black mt-4">
                    Live Buy Rate: PKR {goldMarket.buyPrice.toLocaleString()}
                  </p>

                </div>

                <Coins className="text-black" size={44} />

              </div>

            </Link>

            {/* Sell Gold */}

            <Link
              href="/gold/sell"
              className="bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl p-6 hover:scale-[1.02] transition"
            >
              <div className="flex justify-between items-center">

                <div>

                  <p className="text-black font-bold text-sm">
                    Gold Trading
                  </p>

                  <h3 className="text-3xl font-black text-black mt-2">
                    Sell Gold
                  </h3>

                  <p className="text-black mt-4">
                    Live Sell Rate: PKR {goldMarket.sellPrice.toLocaleString()}
                  </p>

                </div>

                <TrendingDown className="text-black" size={44} />

              </div>

            </Link>

          </div>

          {/* ============================================= */}
          {/* THIRD ROW */}
          {/* ============================================= */}

          <div className="grid md:grid-cols-2 xl:grid-cols-2 gap-6">

            {/* Buy USDT */}

            <Link
              href="/usdt/buy"
              className="bg-gradient-to-r from-cyan-500 to-blue-600 rounded-2xl p-6 hover:scale-[1.02] transition"
            >
              <div className="flex justify-between items-center">

                <div>

                  <p className="text-black font-bold text-sm">
                    USDT Trading
                  </p>

                  <h3 className="text-3xl font-black text-black mt-2">
                    Buy USDT
                  </h3>

                  <p className="text-black mt-4">
                    Live Buy Rate: PKR {usdtMarket.buyPrice.toLocaleString()}
                  </p>

                </div>

                <DollarSign className="text-black" size={44} />

              </div>

            </Link>

            {/* Sell USDT */}

            <Link
              href="/usdt/sell"
              className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl p-6 hover:scale-[1.02] transition"
            >
              <div className="flex justify-between items-center">

                <div>

                  <p className="text-black font-bold text-sm">
                    USDT Trading
                  </p>

                  <h3 className="text-3xl font-black text-black mt-2">
                    Sell USDT
                  </h3>

                  <p className="text-black mt-4">
                    Live Sell Rate: PKR {usdtMarket.sellPrice.toLocaleString()}
                  </p>

                </div>

                <TrendingUp className="text-black" size={44} />

              </div>

            </Link>

          </div>

          {/* ============================================= */}
          {/* SECURITY PANEL */}
          {/* ============================================= */}

          <div className="bg-zinc-900 border border-cyan-500 rounded-2xl p-6">

            <div className="flex items-center gap-3 mb-5">

              <ShieldCheck className="text-cyan-400" size={28} />

              <h3 className="text-xl font-black text-cyan-400">
                Wallet Security Center
              </h3>

            </div>

            <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-5">

              <div className="bg-black border border-green-500 rounded-xl p-4">

                <p className="text-xs text-gray-500 uppercase">
                  Wallet Status
                </p>

                <h4 className="text-green-400 font-black text-lg mt-2">
                  Active
                </h4>

              </div>

              <div className="bg-black border border-yellow-500 rounded-xl p-4">

                <p className="text-xs text-gray-500 uppercase">
                  Gold Trading
                </p>

                <h4 className="text-yellow-400 font-black text-lg mt-2">
                  {goldMarket.tradingEnabled ? "Enabled" : "Disabled"}
                </h4>

              </div>

              <div className="bg-black border border-cyan-500 rounded-xl p-4">

                <p className="text-xs text-gray-500 uppercase">
                  USDT Trading
                </p>

                <h4 className="text-cyan-400 font-black text-lg mt-2">
                  {usdtMarket.tradingEnabled ? "Enabled" : "Disabled"}
                </h4>

              </div>

              <div className="bg-black border border-purple-500 rounded-xl p-4">

                <p className="text-xs text-gray-500 uppercase">
                  Refresh Status
                </p>

                <button
                  onClick={handleRefresh}
                  className="mt-2 flex items-center gap-2 text-purple-400 font-bold hover:text-purple-300 transition"
                >
                  <RefreshCw size={16} />
                  Refresh Wallet
                </button>

              </div>

            </div>

          </div>

        </section>
                {/* ================================================= */}
        {/* WALLET TRANSACTION TOOLBAR */}
        {/* PART 8/12 */}
        {/* Paste AFTER Quick Actions */}
        {/* ================================================= */}

        <section className="bg-zinc-900 border border-cyan-500 rounded-2xl p-6 space-y-6">

          <div className="flex flex-wrap items-center justify-between gap-4">

            <div>

              <h2 className="text-3xl font-black text-cyan-400">
                Wallet Transaction Center
              </h2>

              <p className="text-gray-400 mt-2">
                Search and filter PKR, Gold and USDT wallet transactions.
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

              {refreshing ? "Refreshing..." : "Refresh"}
            </button>

          </div>

          {/* ============================================= */}
          {/* SEARCH + FILTER ROW */}
          {/* ============================================= */}

          <div className="grid lg:grid-cols-4 gap-5">

            {/* SEARCH */}

            <div className="relative lg:col-span-2">

              <Search
                size={18}
                className="absolute left-4 top-4 text-gray-500"
              />

              <input
                type="text"
                placeholder="Search transaction, amount, wallet type..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full bg-black border border-zinc-700 rounded-xl pl-11 pr-4 py-3 focus:border-cyan-500 outline-none text-white"
              />

            </div>

            {/* WALLET FILTER */}

            <div className="relative">

              <Filter
                size={18}
                className="absolute left-4 top-4 text-gray-500"
              />

              <select
                value={filterWallet}
                onChange={(e) => {
                  setFilterWallet(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full bg-black border border-zinc-700 rounded-xl pl-11 pr-4 py-3 focus:border-cyan-500 outline-none appearance-none text-white"
              >
                <option value="ALL">All Wallets</option>
                <option value="PKR">PKR Wallet</option>
                <option value="GOLD">Gold Wallet</option>
                <option value="USDT">USDT Wallet</option>
              </select>

            </div>

            {/* STATUS FILTER */}

            <div>

              <select
                value={filterStatus}
                onChange={(e) => {
                  setFilterStatus(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full bg-black border border-zinc-700 rounded-xl px-4 py-3 focus:border-cyan-500 outline-none text-white"
              >
                <option value="ALL">All Status</option>
                <option value="Completed">Completed</option>
                <option value="Pending">Pending</option>
                <option value="Rejected">Rejected</option>
              </select>

            </div>

          </div>

          {/* ============================================= */}
          {/* TRANSACTION SUMMARY */}
          {/* ============================================= */}

          <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-5">

            <div className="bg-black border border-blue-500 rounded-xl p-4">

              <p className="text-gray-500 text-xs uppercase">
                Total Transactions
              </p>

              <h3 className="text-2xl font-black text-blue-400 mt-2">
                {transactionStats.totalTransactions}
              </h3>

            </div>

            <div className="bg-black border border-green-500 rounded-xl p-4">

              <p className="text-gray-500 text-xs uppercase">
                Completed
              </p>

              <h3 className="text-2xl font-black text-green-400 mt-2">
                {transactionStats.completed}
              </h3>

            </div>

            <div className="bg-black border border-yellow-500 rounded-xl p-4">

              <p className="text-gray-500 text-xs uppercase">
                Pending
              </p>

              <h3 className="text-2xl font-black text-yellow-400 mt-2">
                {transactionStats.pending}
              </h3>

            </div>

            <div className="bg-black border border-purple-500 rounded-xl p-4">

              <p className="text-gray-500 text-xs uppercase">
                Showing Records
              </p>

              <h3 className="text-2xl font-black text-purple-400 mt-2">
                {filteredTransactions.length}
              </h3>

            </div>

          </div>

          {/* ============================================= */}
          {/* WALLET VOLUME SUMMARY */}
          {/* ============================================= */}

          <div className="grid md:grid-cols-3 gap-5">

            {/* PKR */}

            <div className="bg-black border border-green-500 rounded-xl p-5">

              <div className="flex justify-between items-center">

                <Wallet size={22} className="text-green-400" />

                <span className="text-green-400 text-xs font-bold">
                  PKR WALLET
                </span>

              </div>

              <p className="text-gray-500 text-sm mt-4">
                Total PKR Volume
              </p>

              <h3 className="text-2xl font-black text-green-400 mt-2">
                PKR {Math.round(transactionStats.totalPKR).toLocaleString()}
              </h3>

            </div>

            {/* GOLD */}

            <div className="bg-black border border-yellow-500 rounded-xl p-5">

              <div className="flex justify-between items-center">

                <Coins size={22} className="text-yellow-400" />

                <span className="text-yellow-400 text-xs font-bold">
                  GOLD WALLET
                </span>

              </div>

              <p className="text-gray-500 text-sm mt-4">
                Gold Volume
              </p>

              <h3 className="text-2xl font-black text-yellow-400 mt-2">
                {transactionStats.totalGold.toFixed(4)} g
              </h3>

            </div>

            {/* USDT */}

            <div className="bg-black border border-cyan-500 rounded-xl p-5">

              <div className="flex justify-between items-center">

                <DollarSign size={22} className="text-cyan-400" />

                <span className="text-cyan-400 text-xs font-bold">
                  USDT WALLET
                </span>

              </div>

              <p className="text-gray-500 text-sm mt-4">
                USDT Volume
              </p>

              <h3 className="text-2xl font-black text-cyan-400 mt-2">
                {transactionStats.totalUsdt.toFixed(2)} USDT
              </h3>

            </div>

          </div>

          {/* ============================================= */}
          {/* ACTIVE FILTERS BAR */}
          {/* ============================================= */}

          <div className="flex flex-wrap gap-3 pt-2">

            <span className="bg-zinc-800 border border-zinc-700 px-3 py-2 rounded-full text-sm">
              Wallet:{" "}
              <span className="text-cyan-400 font-bold">
                {filterWallet}
              </span>
            </span>

            <span className="bg-zinc-800 border border-zinc-700 px-3 py-2 rounded-full text-sm">
              Status:{" "}
              <span className="text-green-400 font-bold">
                {filterStatus}
              </span>
            </span>

            <span className="bg-zinc-800 border border-zinc-700 px-3 py-2 rounded-full text-sm">
              Search:{" "}
              <span className="text-yellow-400 font-bold">
                {search === "" ? "None" : search}
              </span>
            </span>

            {(search !== "" ||
              filterWallet !== "ALL" ||
              filterStatus !== "ALL") && (
              <button
                onClick={() => {
                  setSearch("");
                  setFilterWallet("ALL");
                  setFilterStatus("ALL");
                  setCurrentPage(1);
                }}
                className="bg-red-500/20 border border-red-500 text-red-400 px-4 py-2 rounded-full text-sm font-bold hover:bg-red-500/30 transition"
              >
                Clear Filters
              </button>
            )}

          </div>

        </section>
                {/* ================================================= */}
        {/* DESKTOP WALLET TRANSACTION TABLE */}
        {/* PART 9/12 */}
        {/* Paste AFTER Wallet Transaction Toolbar */}
        {/* ================================================= */}

        <section className="hidden lg:block bg-zinc-900 border border-cyan-500 rounded-2xl overflow-hidden">

          {/* HEADER */}

          <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-800">

            <h2 className="text-2xl font-black text-cyan-400">
              Wallet Transaction Ledger
            </h2>

            <span className="text-gray-400 text-sm">
              {filteredTransactions.length} Records Found
            </span>

          </div>

          {/* TABLE */}

          <div className="overflow-x-auto">

            <table className="w-full min-w-[1150px]">

              <thead className="bg-black text-gray-400 text-sm">

                <tr>

                  <th className="text-left px-5 py-4">Date & Time</th>

                  <th className="text-left px-5 py-4">Wallet</th>

                  <th className="text-left px-5 py-4">Transaction</th>

                  <th className="text-left px-5 py-4">Amount</th>

                  <th className="text-left px-5 py-4">Status</th>

                  <th className="text-left px-5 py-4">Notes</th>

                </tr>

              </thead>

              <tbody>

                {paginatedTransactions.length === 0 ? (

                  <tr>

                    <td
                      colSpan={6}
                      className="text-center py-12 text-gray-500"
                    >
                      No wallet transactions found.
                    </td>

                  </tr>

                ) : (

                  paginatedTransactions.map((item) => (

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

                      {/* WALLET TYPE */}

                      <td className="px-5 py-4">

                        {item.walletType === "PKR" && (
                          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/20 border border-green-500 text-green-400 text-sm font-bold">
                            <Wallet size={15} />
                            PKR Wallet
                          </span>
                        )}

                        {item.walletType === "GOLD" && (
                          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-500/20 border border-yellow-500 text-yellow-400 text-sm font-bold">
                            <Coins size={15} />
                            Gold Wallet
                          </span>
                        )}

                        {item.walletType === "USDT" && (
                          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/20 border border-cyan-500 text-cyan-400 text-sm font-bold">
                            <DollarSign size={15} />
                            USDT Wallet
                          </span>
                        )}

                      </td>

                      {/* TRANSACTION TYPE */}

                      <td className="px-5 py-4">

                        {item.type.toUpperCase().includes("DEPOSIT") && (
                          <span className="inline-flex items-center gap-2 text-green-400 font-bold">
                            <ArrowDownRight size={16} />
                            {item.type}
                          </span>
                        )}

                        {item.type.toUpperCase().includes("WITHDRAW") && (
                          <span className="inline-flex items-center gap-2 text-red-400 font-bold">
                            <ArrowUpRight size={16} />
                            {item.type}
                          </span>
                        )}

                        {item.type.toUpperCase().includes("BUY") && (
                          <span className="inline-flex items-center gap-2 text-cyan-400 font-bold">
                            <TrendingUp size={16} />
                            {item.type}
                          </span>
                        )}

                        {item.type.toUpperCase().includes("SELL") && (
                          <span className="inline-flex items-center gap-2 text-orange-400 font-bold">
                            <TrendingDown size={16} />
                            {item.type}
                          </span>
                        )}

                      </td>

                      {/* AMOUNT */}

                      <td className="px-5 py-4">

                        <span className="font-black text-white">
                          {Number(item.amount).toLocaleString()}
                        </span>

                        <p className="text-xs text-gray-500 mt-1">
                          {item.walletType}
                        </p>

                      </td>

                      {/* STATUS */}

                      <td className="px-5 py-4">

                        {item.status === "Completed" && (
                          <span className="inline-flex items-center px-3 py-1 rounded-full bg-green-500/20 border border-green-500 text-green-400 text-sm font-bold">
                            Completed
                          </span>
                        )}

                        {item.status === "Pending" && (
                          <span className="inline-flex items-center px-3 py-1 rounded-full bg-yellow-500/20 border border-yellow-500 text-yellow-400 text-sm font-bold">
                            Pending
                          </span>
                        )}

                        {item.status === "Rejected" && (
                          <span className="inline-flex items-center px-3 py-1 rounded-full bg-red-500/20 border border-red-500 text-red-400 text-sm font-bold">
                            Rejected
                          </span>
                        )}

                      </td>

                      {/* NOTES */}

                      <td className="px-5 py-4">

                        <span className="text-gray-400 text-sm">
                          {item.note?.trim()
                            ? item.note
                            : "No notes available"}
                        </span>

                      </td>

                    </tr>

                  ))

                )}

              </tbody>

            </table>

          </div>

        </section>
                {/* ================================================= */}
        {/* MOBILE WALLET TRANSACTION CARDS */}
        {/* PART 10/12 */}
        {/* Paste AFTER Desktop Transaction Table */}
        {/* ================================================= */}

        <section className="lg:hidden space-y-4">

          <div className="flex items-center justify-between">

            <h2 className="text-2xl font-black text-cyan-400">
              Wallet Transactions
            </h2>

            <span className="text-sm text-gray-400">
              {filteredTransactions.length} Records
            </span>

          </div>

          {paginatedTransactions.length === 0 ? (

            <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-10 text-center">

              <Wallet size={46} className="mx-auto text-gray-600 mb-4" />

              <h3 className="text-lg font-bold text-gray-400">
                No Wallet Transactions Found
              </h3>

              <p className="text-gray-500 mt-2 text-sm">
                Deposit, Withdraw, Buy Gold, Sell Gold, Buy USDT and Sell USDT history will appear here.
              </p>

            </div>

          ) : (

            paginatedTransactions.map((item) => (

              <div
                key={item._id}
                className="bg-zinc-900 border border-zinc-700 rounded-2xl p-5 space-y-5"
              >

                {/* ====================================== */}
                {/* DATE + STATUS */}
                {/* ====================================== */}

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

                {/* ====================================== */}
                {/* WALLET TYPE */}
                {/* ====================================== */}

                <div className="flex items-center justify-between">

                  <span className="text-gray-500 text-sm">
                    Wallet Type
                  </span>

                  {item.walletType === "PKR" && (
                    <span className="bg-green-500/20 border border-green-500 text-green-400 px-3 py-1 rounded-full text-sm font-bold">
                      PKR Wallet
                    </span>
                  )}

                  {item.walletType === "GOLD" && (
                    <span className="bg-yellow-500/20 border border-yellow-500 text-yellow-400 px-3 py-1 rounded-full text-sm font-bold">
                      Gold Wallet
                    </span>
                  )}

                  {item.walletType === "USDT" && (
                    <span className="bg-cyan-500/20 border border-cyan-500 text-cyan-400 px-3 py-1 rounded-full text-sm font-bold">
                      USDT Wallet
                    </span>
                  )}

                </div>

                {/* ====================================== */}
                {/* TRANSACTION TYPE */}
                {/* ====================================== */}

                <div className="flex items-center justify-between">

                  <span className="text-gray-500 text-sm">
                    Transaction
                  </span>

                  {item.type.toUpperCase().includes("DEPOSIT") && (
                    <span className="flex items-center gap-2 text-green-400 font-bold">
                      <ArrowDownRight size={15} />
                      {item.type}
                    </span>
                  )}

                  {item.type.toUpperCase().includes("WITHDRAW") && (
                    <span className="flex items-center gap-2 text-red-400 font-bold">
                      <ArrowUpRight size={15} />
                      {item.type}
                    </span>
                  )}

                  {item.type.toUpperCase().includes("BUY") && (
                    <span className="flex items-center gap-2 text-cyan-400 font-bold">
                      <TrendingUp size={15} />
                      {item.type}
                    </span>
                  )}

                  {item.type.toUpperCase().includes("SELL") && (
                    <span className="flex items-center gap-2 text-orange-400 font-bold">
                      <TrendingDown size={15} />
                      {item.type}
                    </span>
                  )}

                </div>

                {/* ====================================== */}
                {/* AMOUNT CARD */}
                {/* ====================================== */}

                <div className="bg-black rounded-xl border border-zinc-700 p-4">

                  <p className="text-gray-500 text-xs uppercase">
                    Transaction Amount
                  </p>

                  <h3 className="text-2xl font-black text-white mt-2">
                    {Number(item.amount).toLocaleString()}
                  </h3>

                  <p className="text-sm text-cyan-400 mt-2">
                    {item.walletType}
                  </p>

                </div>

                {/* ====================================== */}
                {/* NOTE CARD */}
                {/* ====================================== */}

                <div className="bg-black rounded-xl border border-zinc-700 p-4">

                  <p className="text-gray-500 text-xs uppercase mb-2">
                    Transaction Note
                  </p>

                  <p className="text-sm text-gray-300">
                    {item.note?.trim()
                      ? item.note
                      : "No additional notes available for this transaction."}
                  </p>

                </div>

              </div>

            ))

          )}

        </section>
                {/* ================================================= */}
        {/* WALLET PAGINATION + RESULTS SUMMARY */}
        {/* PART 11/12 */}
        {/* Paste AFTER Mobile Transaction Cards */}
        {/* ================================================= */}

        <section className="bg-zinc-900 border border-cyan-500 rounded-2xl p-6 space-y-6">

          {/* ============================================= */}
          {/* RESULTS SUMMARY CARDS */}
          {/* ============================================= */}

          <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-5">

            <div className="bg-black border border-blue-500 rounded-xl p-4">

              <p className="text-gray-500 text-xs uppercase">
                Current Page
              </p>

              <h2 className="text-3xl font-black text-blue-400 mt-2">
                {currentPage}
              </h2>

            </div>

            <div className="bg-black border border-cyan-500 rounded-xl p-4">

              <p className="text-gray-500 text-xs uppercase">
                Total Pages
              </p>

              <h2 className="text-3xl font-black text-cyan-400 mt-2">
                {totalPages || 1}
              </h2>

            </div>

            <div className="bg-black border border-green-500 rounded-xl p-4">

              <p className="text-gray-500 text-xs uppercase">
                Showing Records
              </p>

              <h2 className="text-3xl font-black text-green-400 mt-2">
                {paginatedTransactions.length}
              </h2>

            </div>

            <div className="bg-black border border-purple-500 rounded-xl p-4">

              <p className="text-gray-500 text-xs uppercase">
                Filtered Records
              </p>

              <h2 className="text-3xl font-black text-purple-400 mt-2">
                {filteredTransactions.length}
              </h2>

            </div>

          </div>

          {/* ============================================= */}
          {/* PAGINATION BUTTONS */}
          {/* ============================================= */}

          <div className="flex flex-wrap items-center justify-center gap-3">

            {/* Previous */}

            <button
              onClick={() =>
                setCurrentPage((page) => Math.max(page - 1, 1))
              }
              disabled={currentPage === 1}
              className="px-5 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed font-bold transition"
            >
              Previous
            </button>

            {/* Page Numbers */}

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

            {/* Next */}

            <button
              onClick={() =>
                setCurrentPage((page) =>
                  Math.min(page + 1, totalPages || 1)
                )
              }
              disabled={currentPage === totalPages || totalPages === 0}
              className="px-5 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed font-bold transition"
            >
              Next
            </button>

          </div>

          {/* ============================================= */}
          {/* SHOWING RANGE */}
          {/* ============================================= */}

          <div className="text-center text-sm text-gray-400 border-t border-zinc-800 pt-5">

            Showing{" "}

            <span className="text-cyan-400 font-bold">
              {filteredTransactions.length === 0
                ? 0
                : (currentPage - 1) * rowsPerPage + 1}
            </span>

            {" "}to{" "}

            <span className="text-cyan-400 font-bold">
              {Math.min(
                currentPage * rowsPerPage,
                filteredTransactions.length
              )}
            </span>

            {" "}of{" "}

            <span className="text-cyan-400 font-bold">
              {filteredTransactions.length}
            </span>

            {" "}wallet transactions.

          </div>

          {/* ============================================= */}
          {/* WALLET SUMMARY FOOTER */}
          {/* ============================================= */}

          <div className="grid md:grid-cols-3 gap-5">

            <div className="bg-black border border-green-500 rounded-xl p-5">

              <p className="text-gray-500 text-sm">
                PKR Wallet Balance
              </p>

              <h3 className="text-2xl font-black text-green-400 mt-2">
                PKR {walletSummary.pkrBalance.toLocaleString()}
              </h3>

            </div>

            <div className="bg-black border border-yellow-500 rounded-xl p-5">

              <p className="text-gray-500 text-sm">
                Gold Wallet Value
              </p>

              <h3 className="text-2xl font-black text-yellow-400 mt-2">
                PKR {Math.round(walletSummary.goldValuePKR).toLocaleString()}
              </h3>

            </div>

            <div className="bg-black border border-cyan-500 rounded-xl p-5">

              <p className="text-gray-500 text-sm">
                USDT Wallet Value
              </p>

              <h3 className="text-2xl font-black text-cyan-400 mt-2">
                PKR {Math.round(walletSummary.usdtValuePKR).toLocaleString()}
              </h3>

            </div>

          </div>

          {/* ============================================= */}
          {/* NET WALLET WORTH */}
          {/* ============================================= */}

          <div className="bg-gradient-to-r from-purple-600 via-cyan-600 to-blue-700 rounded-2xl p-6">

            <div className="flex flex-wrap justify-between items-center gap-5">

              <div>

                <p className="text-white/80 text-sm">
                  Enterprise Wallet Net Worth
                </p>

                <h2 className="text-4xl font-black text-white mt-2">
                  PKR {Math.round(walletSummary.totalWalletValue).toLocaleString()}
                </h2>

                <p className="text-white/80 mt-2 text-sm">
                  Combined PKR + Gold + USDT valuation using live market prices.
                </p>

              </div>

              <div className="text-center">

                <Wallet size={56} className="text-white mx-auto" />

                <p className="text-white font-bold mt-3">
                  GoldTrade Wallet Enterprise
                </p>

              </div>

            </div>

          </div>

        </section>
                {/* ================================================= */}
        {/* EMPTY WALLET STATE */}
        {/* PART 12/12 FINAL */}
        {/* Paste AFTER Pagination Section */}
        {/* ================================================= */}

        {walletSummary.totalWalletValue === 0 && (
          <section className="bg-zinc-900 border border-yellow-500 rounded-2xl p-8 text-center">
            <Wallet size={52} className="mx-auto text-yellow-400 mb-4" />

            <h2 className="text-2xl font-black text-yellow-400">
              Your Wallet is Empty
            </h2>

            <p className="text-gray-400 mt-3 max-w-xl mx-auto">
              Your PKR, Gold and USDT balances are currently zero. Deposit funds
              or purchase Gold/USDT to activate your enterprise wallet.
            </p>

            <div className="flex flex-wrap justify-center gap-4 mt-8">
              <Link
                href="/wallet/deposit"
                className="bg-green-500 hover:bg-green-400 text-black px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition"
              >
                <ArrowDownRight size={18} />
                Deposit PKR
              </Link>

              <Link
                href="/usdt/buy"
                className="bg-cyan-500 hover:bg-cyan-400 text-black px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition"
              >
                <DollarSign size={18} />
                Buy USDT
              </Link>

              <Link
                href="/gold/buy"
                className="bg-yellow-500 hover:bg-yellow-400 text-black px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition"
              >
                <Coins size={18} />
                Buy Gold
              </Link>
            </div>
          </section>
        )}

        {/* ================================================= */}
        {/* LIVE WALLET INFORMATION */}
        {/* ================================================= */}

        <section className="bg-zinc-900 border border-cyan-500 rounded-2xl p-6">
          <div className="flex flex-wrap justify-between items-center gap-6">
            <div>
              <h2 className="text-xl font-black text-cyan-400">
                Live Wallet Information
              </h2>

              <p className="text-gray-400 mt-2">
                Wallet valuation is calculated using live Gold and USDT market
                prices from the backend.
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

              {refreshing ? "Refreshing..." : "Refresh Wallet"}
            </button>
          </div>

          {/* LIVE INFO CARDS */}

          <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-5 mt-6">
            <div className="bg-black border border-green-500 rounded-xl p-4">
              <p className="text-gray-500 text-sm">Gold Sell Rate</p>

              <h3 className="text-2xl font-black text-yellow-400 mt-2">
                PKR {goldMarket.sellPrice.toLocaleString()}
              </h3>
            </div>

            <div className="bg-black border border-cyan-500 rounded-xl p-4">
              <p className="text-gray-500 text-sm">USDT Sell Rate</p>

              <h3 className="text-2xl font-black text-cyan-400 mt-2">
                PKR {usdtMarket.sellPrice.toLocaleString()}
              </h3>
            </div>

            <div className="bg-black border border-purple-500 rounded-xl p-4">
              <p className="text-gray-500 text-sm">Net Wallet Worth</p>

              <h3 className="text-2xl font-black text-purple-400 mt-2">
                PKR {Math.round(walletSummary.totalWalletValue).toLocaleString()}
              </h3>
            </div>

            <div className="bg-black border border-blue-500 rounded-xl p-4">
              <p className="text-gray-500 text-sm">Last Refresh</p>

              <h3 className="text-lg font-black text-blue-400 mt-2">
                {new Date().toLocaleString()}
              </h3>
            </div>
          </div>
        </section>

        {/* ================================================= */}
        {/* ENTERPRISE FOOTER */}
        {/* ================================================= */}

        <footer className="border-t border-zinc-800 pt-8 mt-10">
          <div className="grid md:grid-cols-3 gap-8">

            {/* ABOUT */}

            <div>
              <h3 className="text-lg font-black text-cyan-400 mb-3">
                GoldTrade Wallet Enterprise
              </h3>

              <p className="text-gray-500 text-sm leading-6">
                Enterprise Wallet Dashboard provides PKR, Gold and USDT wallet
                management, live valuation, analytics, transaction history and
                secure trading tools.
              </p>
            </div>

            {/* FEATURES */}

            <div>
              <h3 className="text-lg font-black text-green-400 mb-3">
                Wallet Features
              </h3>

              <ul className="space-y-2 text-sm text-gray-500">
                <li>• PKR Wallet Management</li>
                <li>• Gold Wallet</li>
                <li>• USDT Wallet</li>
                <li>• Deposit & Withdraw</li>
                <li>• Live Wallet Analytics</li>
                <li>• Enterprise Transaction Ledger</li>
                <li>• Search & Filters</li>
                <li>• Mobile Responsive Wallet</li>
              </ul>
            </div>

            {/* STATUS */}

            <div>
              <h3 className="text-lg font-black text-purple-400 mb-3">
                Wallet Status
              </h3>

              <div className="space-y-3">

                <div className="flex justify-between">
                  <span className="text-gray-500">Gold Trading</span>

                  <span
                    className={
                      goldMarket.tradingEnabled
                        ? "text-green-400 font-bold"
                        : "text-red-400 font-bold"
                    }
                  >
                    {goldMarket.tradingEnabled ? "Enabled" : "Disabled"}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-500">USDT Trading</span>

                  <span
                    className={
                      usdtMarket.tradingEnabled
                        ? "text-cyan-400 font-bold"
                        : "text-red-400 font-bold"
                    }
                  >
                    {usdtMarket.tradingEnabled ? "Enabled" : "Disabled"}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-500">Wallet Value</span>

                  <span className="text-purple-400 font-bold">
                    PKR {Math.round(walletSummary.totalWalletValue).toLocaleString()}
                  </span>
                </div>

              </div>
            </div>

          </div>

          {/* FOOTER BOTTOM */}

          <div className="border-t border-zinc-800 mt-8 pt-6 flex flex-wrap justify-between items-center gap-4">

            <p className="text-gray-500 text-sm">
              © 2026 GoldTrade V18 Enterprise Wallet. All rights reserved.
            </p>

            <div className="flex flex-wrap gap-4 text-sm">

              <Link
                href="/wallet/deposit"
                className="text-green-400 hover:text-green-300 font-semibold transition"
              >
                Deposit
              </Link>

              <Link
                href="/wallet/withdraw"
                className="text-red-400 hover:text-red-300 font-semibold transition"
              >
                Withdraw
              </Link>

              <Link
                href="/gold/buy"
                className="text-yellow-400 hover:text-yellow-300 font-semibold transition"
              >
                Buy Gold
              </Link>

              <Link
                href="/usdt/buy"
                className="text-cyan-400 hover:text-cyan-300 font-semibold transition"
              >
                Buy USDT
              </Link>

            </div>

          </div>

        </footer>

      </div>
    </main>
  );
}