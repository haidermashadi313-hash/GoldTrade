"use client";

// =======================================================
// GoldTrade V18 - Usdt DASHBOARD
// PART 1/6 (FINAL)
// Imports • Types • States • API Config
// =======================================================

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

// =======================================================
// API URL
// =======================================================

const API =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
console.log("buy-Usdt API URL:", API);
// =======================================================
// TYPES
// =======================================================

interface walletData {
  PkrBalance: number;
  UsdtBalance: number;
  goldBalance: number;
}

interface walletResponse {
  success: boolean;
  wallet: walletData;
}

interface RateResponse {
  success: boolean;
  currency: string;
  rate: number;
}

interface Transaction {
  _id: string;
  type: "buy" | "sell";
  UsdtAmount: number;
  PkrAmount: number;
  status: "Pending" | "Approved" | "Rejected";
  network: string;
  createdAt: string;
}

interface historyResponse {
  success: boolean;
  transactions: Transaction[];
}

// =======================================================
// COMPONENT
// =======================================================

export default function UsdtDashboardPage() {
  // =====================================================
  // AUTH STATE
  // =====================================================

  const [username, setUsername] = useState("");
  const [token, setToken] = useState("");

  // =====================================================
  // DASHBOARD STATE
  // =====================================================

  const [wallet, setwallet] = useState<walletData>({
    PkrBalance: 0,
    UsdtBalance: 0,
    goldBalance: 0,
  });

  const [rate, setRate] = useState(280);
 const [transactions, setTransactions] = useState<any[]>([]);

  // =====================================================
  // UI STATE
  // =====================================================

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // =====================================================
  // LIVE PORTFOLIO VALUE
  // =====================================================

  const portfolioValue = useMemo(() => {
    return wallet.UsdtBalance * rate;
  }, [wallet.UsdtBalance, rate]);

  // =====================================================
  // QUICK STATS
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
  // DASHBOARD TITLE
  // =====================================================

  const today = new Date().toLocaleDateString("en-PK", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });


const loadRate = async () => {
  try {
    const response = await fetch(`${API}/api/Usdt/rate`);

    if (!response.ok) throw new Error("Rate API failed");

    const data: RateResponse = await response.json();

    if (data.success) {
      setRate(Number(data.rate));
    }
  } catch (error) {
    console.error("Usdt RATE ERROR:", error);
    setErrorMessage("Unable to load Usdt rate.");
  }
};
// =====================================================
// LOAD USER wallet
// =====================================================

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
      }
    );

    if (!response.ok) throw new Error("Wallet API failed");

    const data: walletResponse = await response.json();

    if (data.success) {
      setwallet(data.wallet);
    }
  } catch (error) {
    console.error("LOAD WALLET ERROR:", error);
    setErrorMessage("Unable to load wallet.");
  }
};
// =====================================================
// LOAD Usdt HISTORY
// GET /api/Usdt/history/:username
// =====================================================

const loadHistory = async (
  currentUsername: string,
  currentToken: string
) => {
  try {
    const response = await fetch(
      `${API}/api/Usdt/history/${currentUsername}`,
      {
        headers: {
          Authorization: `Bearer ${currentToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error("History API failed");
    }

    const data = await response.json();

    if (data.success) {
      setTransactions(data.history || []);
    }
  } catch (error) {
    console.error("LOAD HISTORY ERROR:", error);
  }
};

  // =====================================================
  // LOAD COMPLETE DASHBOARD
  // =====================================================

  const loadDashboard = async (
    currentUsername: string,
    currentToken: string
  ) => {
    if (!currentUsername || !currentToken) return;
    try {
      setLoading(true);
      setErrorMessage("");
      await Promise.all([
        loadRate(),
        loadWallet(currentUsername, currentToken),
        loadHistory(currentUsername, currentToken),
      ]);
    } catch (error) {
      console.error("Usdt Dashboard Error:", error);
      setErrorMessage("Unable to load dashboard.");
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // REFRESH DASHBOARD
  // =====================================================

  const refreshDashboard = async () => {
    if (!username || !token) return;

    try {
      setRefreshing(true);

      await Promise.all([
        loadRate(),
        loadWallet(username, token),
        loadHistory(username, token),
      ]);

      setSuccessMessage("Dashboard refreshed successfully.");
    } catch (error) {
      console.error("REFRESH ERROR:", error);
      setErrorMessage("Refresh failed.");
    } finally {
      setRefreshing(false);
    }
  };

  // =====================================================
  // INITIAL LOAD
  // =====================================================

  useEffect(() => {
    const user = localStorage.getItem("username") || "";
    const authToken = localStorage.getItem("token") || "";

    setUsername(user);
    setToken(authToken);

    if (user && authToken) {
      loadDashboard(user, authToken);
    } else {
      setLoading(false);
      setErrorMessage("Please login first.");
    }
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
  // FORMAT DATE
  // =====================================================

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString("en-PK", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  // =====================================================
  // JSX START — PART 3/6
  // =====================================================

  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-8">
      <div className="mx-auto max-w-7xl">

        {/* ===================================================== */}
        {/* DASHBOARD HEADER */}
        {/* ===================================================== */}

        <div className="mb-6 rounded-3xl bg-gradient-to-r from-cyan-700 via-blue-700 to-indigo-700 p-6 text-white shadow-xl">

          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

            <div>
              <h1 className="text-3xl font-bold">
                Usdt Dashboard
              </h1>

              <p className="mt-2 text-cyan-100">
                GoldTrade V18 • Pkr • Usdt • Gold wallet
              </p>

              <p className="mt-2 text-sm text-cyan-200">
                Welcome, <strong>{username || "User"}</strong>
              </p>

              <p className="text-xs text-cyan-300">
                {today}
              </p>
            </div>

            <button
              type="button"
              onClick={refreshDashboard}
              disabled={refreshing}
              className="rounded-xl bg-white px-5 py-3 font-semibold text-cyan-700 transition hover:bg-cyan-50 disabled:opacity-50"
            >
              {refreshing ? "Refreshing..." : "Refresh Dashboard"}
            </button>

          </div>

        </div>

        {/* ===================================================== */}
        {/* SUCCESS ALERT */}
        {/* ===================================================== */}

        {successMessage && (
          <div className="mb-4 rounded-xl border border-green-300 bg-green-100 p-4 text-green-700">
            {successMessage}
          </div>
        )}

        {/* ===================================================== */}
        {/* ERROR ALERT */}
        {/* ===================================================== */}

        {errorMessage && (
          <div className="mb-4 rounded-xl border border-red-300 bg-red-100 p-4 text-red-700">
            {errorMessage}
          </div>
        )}

        {/* ===================================================== */}
        {/* LOADING SCREEN */}
        {/* ===================================================== */}

        {loading ? (
          <div className="rounded-3xl bg-white p-12 text-center shadow-xl">

            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-cyan-600 border-t-transparent"></div>

            <p className="text-gray-600">
              Loading Usdt Dashboard...
            </p>

          </div>
        ) : (
          <>

            {/* ===================================================== */}
            {/* wallet BALANCE CARDS */}
            {/* ===================================================== */}

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">

              {/* Pkr wallet */}

              <div className="rounded-2xl bg-white p-5 shadow-lg">

                <p className="text-sm text-gray-500">
                  Pkr wallet
                </p>

                <h2 className="mt-2 text-3xl font-bold text-green-600">
                  Rs. {wallet.PkrBalance.toLocaleString()}
                </h2>

                <p className="mt-2 text-xs text-gray-400">
                  Available Pkr Balance
                </p>

              </div>

              {/* Usdt wallet */}

              <div className="rounded-2xl bg-white p-5 shadow-lg">

                <p className="text-sm text-gray-500">
                  Usdt wallet
                </p>

                <h2 className="mt-2 text-3xl font-bold text-cyan-700">
                  {wallet.UsdtBalance.toFixed(2)} Usdt
                </h2>

                <p className="mt-2 text-xs text-gray-400">
                  Available Usdt Balance
                </p>

              </div>

              {/* GOLD wallet */}

              <div className="rounded-2xl bg-white p-5 shadow-lg">

                <p className="text-sm text-gray-500">
                  Gold wallet
                </p>

                <h2 className="mt-2 text-3xl font-bold text-yellow-600">
                  {wallet.goldBalance.toFixed(4)} g
                </h2>

                <p className="mt-2 text-xs text-gray-400">
                  Digital Gold Balance
                </p>

              </div>

            </div>

            {/* ===================================================== */}
            {/* LIVE PORTFOLIO VALUE */}
            {/* ===================================================== */}

            <div className="mt-6 rounded-3xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 p-6 text-white shadow-xl">

              <div className="grid gap-6 md:grid-cols-2">

                <div>

                  <p className="text-sm text-emerald-100">
                    Live Usdt Rate
                  </p>

                  <h2 className="mt-2 text-4xl font-bold">
                    Pkr {rate}
                  </h2>

                  <p className="mt-2 text-sm text-emerald-100">
                    1 Usdt = {rate} Pkr
                  </p>

                </div>

                <div className="text-right">

                  <p className="text-sm text-emerald-100">
                    Portfolio Value
                  </p>

                  <h2 className="mt-2 text-4xl font-bold">
                    Rs. {portfolioValue.toLocaleString()}
                  </h2>

                  <p className="mt-2 text-sm text-emerald-100">
                    Based on your current Usdt holdings.
                  </p>

                </div>

              </div>

            </div>

                       {/* ===================================================== */}
            {/* MARKET STATISTICS */}
            {/* ===================================================== */}

            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">

              {/* LIVE RATE */}

              <div className="rounded-2xl bg-white p-5 shadow-lg">

                <p className="text-sm text-gray-500">
                  Live Usdt Price
                </p>

                <h3 className="mt-2 text-2xl font-bold text-cyan-700">
                  Pkr {rate}
                </h3>

                <p className="mt-2 text-xs text-green-600">
                  Live Market Rate
                </p>

              </div>

              {/* PORTFOLIO */}

              <div className="rounded-2xl bg-white p-5 shadow-lg">

                <p className="text-sm text-gray-500">
                  Portfolio Value
                </p>

                <h3 className="mt-2 text-2xl font-bold text-emerald-600">
                  Rs. {portfolioValue.toLocaleString()}
                </h3>

                <p className="mt-2 text-xs text-gray-400">
                  Current Usdt Holdings
                </p>

              </div>

              {/* TOTAL Usdt */}

              <div className="rounded-2xl bg-white p-5 shadow-lg">

                <p className="text-sm text-gray-500">
                  Total Usdt Balance
                </p>

                <h3 className="mt-2 text-2xl font-bold text-blue-700">
                  {wallet.UsdtBalance.toFixed(2)} Usdt
                </h3>

                <p className="mt-2 text-xs text-gray-400">
                  Available for Trading
                </p>

              </div>

              {/* TOTAL Pkr */}

              <div className="rounded-2xl bg-white p-5 shadow-lg">

                <p className="text-sm text-gray-500">
                  Total Pkr Balance
                </p>

                <h3 className="mt-2 text-2xl font-bold text-green-700">
                  Rs. {wallet.PkrBalance.toLocaleString()}
                </h3>

                <p className="mt-2 text-xs text-gray-400">
                  Available wallet Balance
                </p>

              </div>

            </div>

            {/* ===================================================== */}
            {/* QUICK ACTION BUTTONS */}
            {/* ===================================================== */}

            <div className="mt-6 rounded-3xl bg-white p-6 shadow-xl">

              <h2 className="mb-5 text-2xl font-bold text-gray-800">
                Quick Usdt Actions
              </h2>

              <div className="grid gap-4 md:grid-cols-3">

                {/* buy Usdt */}

                <Link
                  href="/Usdt/buy-Usdt"
                  className="rounded-2xl bg-gradient-to-r from-cyan-600 to-blue-700 p-6 text-center text-white shadow-lg transition hover:scale-[1.02]"
                >
                  <div className="mb-3 text-4xl">💵</div>

                  <h3 className="text-xl font-bold">
                    buy Usdt
                  </h3>

                  <p className="mt-2 text-sm text-cyan-100">
                    Purchase Usdt using Pkr wallet or Bank Transfer.
                  </p>
                </Link>

                {/* sell Usdt */}

                <Link
                  href="/Usdt/sell-Usdt"
                  className="rounded-2xl bg-gradient-to-r from-red-600 to-orange-600 p-6 text-center text-white shadow-lg transition hover:scale-[1.02]"
                >
                  <div className="mb-3 text-4xl">💸</div>

                  <h3 className="text-xl font-bold">
                    sell Usdt
                  </h3>

                  <p className="mt-2 text-sm text-red-100">
                    sell Usdt and receive Pkr into your GoldTrade wallet.
                  </p>
                </Link>

                {/* history */}

                <Link
                  href="/Usdt/history"
                  className="rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-700 p-6 text-center text-white shadow-lg transition hover:scale-[1.02]"
                >
                  <div className="mb-3 text-4xl">📜</div>

                  <h3 className="text-xl font-bold">
                    Transaction history
                  </h3>

                  <p className="mt-2 text-sm text-indigo-100">
                    View all buy, sell and wallet Transactions.
                  </p>
                </Link>

              </div>

            </div>

            {/* ===================================================== */}
            {/* wallet ANALYTICS */}
            {/* ===================================================== */}

            <div className="mt-6 rounded-3xl bg-white p-6 shadow-xl">

              <h2 className="mb-5 text-2xl font-bold text-gray-800">
                wallet Analytics
              </h2>

              <div className="grid gap-5 md:grid-cols-3">

                <div className="rounded-2xl bg-yellow-50 p-5">

                  <p className="text-sm text-yellow-700">
                    Gold Balance
                  </p>

                  <h3 className="mt-2 text-2xl font-bold text-yellow-600">
                    {wallet.goldBalance.toFixed(4)} g
                  </h3>

                  <p className="mt-2 text-xs text-gray-500">
                    Stored Digital Gold
                  </p>

                </div>

                <div className="rounded-2xl bg-cyan-50 p-5">

                  <p className="text-sm text-cyan-700">
                    Usdt Holdings
                  </p>

                  <h3 className="mt-2 text-2xl font-bold text-cyan-700">
                    {wallet.UsdtBalance.toFixed(2)} Usdt
                  </h3>

                  <p className="mt-2 text-xs text-gray-500">
                    Current Trading Balance
                  </p>

                </div>

                <div className="rounded-2xl bg-green-50 p-5">

                  <p className="text-sm text-green-700">
                    wallet Value (Pkr)
                  </p>

                  <h3 className="mt-2 text-2xl font-bold text-green-700">
                    Rs. {portfolioValue.toLocaleString()}
                  </h3>

                  <p className="mt-2 text-xs text-gray-500">
                    Based on Live Usdt Market Price
                  </p>

                </div>

              </div>

            </div>

            {/* ===================================================== */}
            {/* LIVE MARKET INFORMATION */}
            {/* ===================================================== */}

            <div className="mt-6 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-6 text-white shadow-xl">

              <h2 className="mb-5 text-2xl font-bold">
                Live Market Information
              </h2>

              <div className="grid gap-5 md:grid-cols-2">

                <div className="rounded-2xl bg-white/10 p-5">

                  <p className="text-sm text-slate-300">
                    Current Usdt buy/sell Rate
                  </p>

                  <h3 className="mt-2 text-3xl font-bold text-cyan-300">
                    Pkr {rate}
                  </h3>

                  <p className="mt-2 text-xs text-slate-400">
                    Automatically synced from GoldTrade Backend.
                  </p>

                </div>

                <div className="rounded-2xl bg-white/10 p-5">

                  <p className="text-sm text-slate-300">
                    Trading Status
                  </p>

                  <h3 className="mt-2 text-3xl font-bold text-green-400">
                    LIVE
                  </h3>

                  <p className="mt-2 text-xs text-slate-400">
                    Usdt Trading is currently active.
                  </p>

                </div>

              </div>

            </div>

                      {/* ===================================================== */}
            {/* TRANSACTION STATISTICS */}
            {/* ===================================================== */}

            <div className="mt-6 rounded-3xl bg-white p-6 shadow-xl">

              <h2 className="mb-5 text-2xl font-bold text-gray-800">
                Transaction Statistics
              </h2>

              <div className="grid gap-4 md:grid-cols-3">

                {/* Pending */}

                <div className="rounded-2xl border border-yellow-200 bg-yellow-50 p-5">

                  <p className="text-sm text-yellow-700">
                    Pending Requests
                  </p>

                  <h3 className="mt-2 text-3xl font-bold text-yellow-600">
                    {pendingTransactions}
                  </h3>

                </div>

                {/* Approved */}

                <div className="rounded-2xl border border-green-200 bg-green-50 p-5">

                  <p className="text-sm text-green-700">
                    Approved Requests
                  </p>

                  <h3 className="mt-2 text-3xl font-bold text-green-600">
                    {approvedTransactions}
                  </h3>

                </div>

                {/* Rejected */}

                <div className="rounded-2xl border border-red-200 bg-red-50 p-5">

                  <p className="text-sm text-red-700">
                    Rejected Requests
                  </p>

                  <h3 className="mt-2 text-3xl font-bold text-red-600">
                    {rejectedTransactions}
                  </h3>

                </div>

              </div>

            </div>

            {/* ===================================================== */}
            {/* RECENT TRANSACTIONS */}
            {/* ===================================================== */}

            <div className="mt-6 rounded-3xl bg-white p-6 shadow-xl">

              <div className="mb-5 flex items-center justify-between">

                <h2 className="text-2xl font-bold text-gray-800">
                  Recent Usdt Transactions
                </h2>

                <Link
                  href="/Usdt/history"
                  className="rounded-lg bg-cyan-600 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-700"
                >
                  View All
                </Link>

              </div>

              {transactions.length === 0 ? (

                <div className="rounded-2xl border border-dashed border-gray-300 p-10 text-center">

                  <p className="text-lg font-semibold text-gray-600">
                    No Usdt Transactions Found
                  </p>

                  <p className="mt-2 text-sm text-gray-400">
                    Your buy and sell requests will appear here after submission.
                  </p>

                </div>

              ) : (

                <div className="overflow-x-auto">

                  <table className="min-w-full">

                    <thead className="bg-slate-100">

                      <tr>

                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">
                          Type
                        </th>

                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">
                          Usdt
                        </th>

                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">
                          Pkr
                        </th>

                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">
                          Network
                        </th>

                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">
                          Status
                        </th>

                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">
                          Date
                        </th>

                      </tr>

                    </thead>

                    <tbody>

                      {transactions.slice(0, 6).map((transaction) => (

                        <tr
                          key={transaction._id}
                          className="border-b hover:bg-slate-50"
                        >

                          {/* TYPE */}

                          <td className="px-4 py-4">

                            <span
                              className={`rounded-full px-3 py-1 text-xs font-bold ${
                                transaction.type === "buy"
                                  ? "bg-green-100 text-green-700"
                                  : "bg-red-100 text-red-700"
                              }`}
                            >
                              {transaction.type}
                            </span>

                          </td>

                          {/* Usdt */}

                          <td className="px-4 py-4 font-semibold text-cyan-700">
                            {transaction.UsdtAmount.toFixed(2)} Usdt
                          </td>

                          {/* Pkr */}

                          <td className="px-4 py-4 font-semibold text-green-700">
                            Rs. {transaction.PkrAmount.toLocaleString()}
                          </td>

                          {/* NETWORK */}

                          <td className="px-4 py-4">
                            <span className="rounded-lg bg-cyan-100 px-3 py-1 text-xs font-semibold text-cyan-700">
                              {transaction.network}
                            </span>
                          </td>

                          {/* STATUS */}

                          <td className="px-4 py-4">

                            <span
                              className={`rounded-full px-3 py-1 text-xs font-bold ${
                                transaction.status === "Approved"
                                  ? "bg-green-100 text-green-700"
                                  : transaction.status === "Pending"
                                  ? "bg-yellow-100 text-yellow-700"
                                  : "bg-red-100 text-red-700"
                              }`}
                            >
                              {transaction.status}
                            </span>

                          </td>

                          {/* DATE */}

                          <td className="px-4 py-4 text-sm text-gray-500">
                            {formatDate(transaction.createdAt)}
                          </td>

                        </tr>

                      ))}

                    </tbody>

                  </table>

                </div>

              )}

            </div>

            {/* ===================================================== */}
            {/* PORTFOLIO SUMMARY */}
            {/* ===================================================== */}

            <div className="mt-6 rounded-3xl bg-gradient-to-r from-cyan-700 via-blue-700 to-indigo-700 p-6 text-white shadow-xl">

              <h2 className="mb-5 text-2xl font-bold">
                Portfolio Summary
              </h2>

              <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">

                <div className="rounded-2xl bg-white/10 p-5">

                  <p className="text-sm text-cyan-100">
                    Pkr Balance
                  </p>

                  <h3 className="mt-2 text-2xl font-bold">
                    Rs. {wallet.PkrBalance.toLocaleString()}
                  </h3>

                </div>

                <div className="rounded-2xl bg-white/10 p-5">

                  <p className="text-sm text-cyan-100">
                    Usdt Balance
                  </p>

                  <h3 className="mt-2 text-2xl font-bold">
                    {wallet.UsdtBalance.toFixed(2)} Usdt
                  </h3>

                </div>

                <div className="rounded-2xl bg-white/10 p-5">

                  <p className="text-sm text-cyan-100">
                    Gold Balance
                  </p>

                  <h3 className="mt-2 text-2xl font-bold">
                    {wallet.goldBalance.toFixed(4)} g
                  </h3>

                </div>

                <div className="rounded-2xl bg-white/10 p-5">

                  <p className="text-sm text-cyan-100">
                    Portfolio Value
                  </p>

                  <h3 className="mt-2 text-2xl font-bold">
                    Rs. {portfolioValue.toLocaleString()}
                  </h3>

                </div>

              </div>

            </div>

                        {/* ===================================================== */}
            {/* SECURITY NOTICE */}
            {/* ===================================================== */}

            <div className="mt-6 rounded-3xl border border-green-200 bg-green-50 p-6">

              <h2 className="mb-4 text-2xl font-bold text-green-700">
                GoldTrade Security Notice
              </h2>

              <div className="grid gap-4 md:grid-cols-2">

                <div className="rounded-xl bg-white p-4">
                  <h3 className="font-semibold text-green-700">
                    Secure wallet
                  </h3>

                  <p className="mt-2 text-sm text-gray-700">
                    All Pkr, Usdt and Gold wallet balances are protected by the
                    GoldTrade V18 backend and require authentication.
                  </p>
                </div>

                <div className="rounded-xl bg-white p-4">
                  <h3 className="font-semibold text-green-700">
                    Admin Verification
                  </h3>

                  <p className="mt-2 text-sm text-gray-700">
                    Every buy and sell request remains Pending until verified by
                    GoldTrade Admin.
                  </p>
                </div>

                <div className="rounded-xl bg-white p-4">
                  <h3 className="font-semibold text-green-700">
                    Live wallet Sync
                  </h3>

                  <p className="mt-2 text-sm text-gray-700">
                    wallet balances refresh automatically after approved
                    transactions.
                  </p>
                </div>

                <div className="rounded-xl bg-white p-4">
                  <h3 className="font-semibold text-green-700">
                    Transaction history
                  </h3>

                  <p className="mt-2 text-sm text-gray-700">
                    Every Usdt transaction is permanently stored with timestamp,
                    network and status.
                  </p>
                </div>

              </div>

            </div>

            {/* ===================================================== */}
            {/* LIVE TRADING INFORMATION */}
            {/* ===================================================== */}

            <div className="mt-6 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-6 text-white shadow-xl">

              <h2 className="mb-5 text-2xl font-bold">
                GoldTrade Live Trading Information
              </h2>

              <div className="grid gap-5 md:grid-cols-3">

                <div className="rounded-2xl bg-white/10 p-5">
                  <p className="text-sm text-slate-300">Market Status</p>

                  <h3 className="mt-2 text-2xl font-bold text-green-400">
                    LIVE
                  </h3>

                  <p className="mt-2 text-xs text-slate-400">
                    Trading is active.
                  </p>
                </div>

                <div className="rounded-2xl bg-white/10 p-5">
                  <p className="text-sm text-slate-300">Live Usdt Rate</p>

                  <h3 className="mt-2 text-2xl font-bold text-cyan-300">
                    Pkr {rate}
                  </h3>

                  <p className="mt-2 text-xs text-slate-400">
                    Synced from backend.
                  </p>
                </div>

                <div className="rounded-2xl bg-white/10 p-5">
                  <p className="text-sm text-slate-300">Last Updated</p>

                  <h3 className="mt-2 text-xl font-bold text-yellow-300">
                    {today}
                  </h3>

                  <p className="mt-2 text-xs text-slate-400">
                    Dashboard refresh time.
                  </p>
                </div>

              </div>

            </div>

            {/* ===================================================== */}
            {/* FOOTER */}
            {/* ===================================================== */}

            <div className="mt-10 rounded-3xl bg-white p-6 text-center shadow-lg">

              <h3 className="text-2xl font-bold text-slate-700">
                GoldTrade V18
              </h3>

              <p className="mt-2 text-gray-600">
                Pakistan's Digital wallet Platform for Pkr, Usdt and Gold Trading.
              </p>

              <div className="mt-6 flex flex-wrap justify-center gap-3">

                <Link
                  href="/Usdt/buy-Usdt"
                  className="rounded-xl bg-cyan-600 px-5 py-3 text-sm font-semibold text-white hover:bg-cyan-700"
                >
                  buy Usdt
                </Link>

                <Link
                  href="/Usdt/sell-Usdt"
                  className="rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-white hover:bg-red-700"
                >
                  sell Usdt
                </Link>

                <Link
                  href="/Usdt/history"
                  className="rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-700"
                >
                  Transaction history
                </Link>

              </div>

              <div className="mt-6 border-t pt-4">

                <p className="text-sm text-gray-500">
                  Pkr • Usdt • GOLD • GoldTrade wallet
                </p>

                <p className="mt-2 text-xs text-gray-400">
                  Powered by GoldTrade V18 • Secure Trading Infrastructure © 2026
                </p>

              </div>

            </div>

          </>
        )}

      </div>
    </div>
  );
}