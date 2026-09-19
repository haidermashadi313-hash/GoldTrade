"use client";

// =======================================================
// GoldTrade V18 - Usdt Wallet history
// PART 1/5
// =======================================================

import { useEffect, useMemo, useState } from "react";

// =======================================================
// API URL
// =======================================================

const API =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

// =======================================================
// TYPES
// =======================================================

type TransactionType = "CREDIT" | "DEBIT";

interface WalletTransaction {
  _id: string;
  username: string;
  WalletType: "Usdt";
  type: TransactionType;
  amount: number;
  previousBalance: number;
  newBalance: number;
  note: string;
  adminUsername: string;
  createdAt: string;
}

interface historyResponse {
  message: string;
  success: boolean;
  username: string;
  transactionCount: number;
  summary: {
    totalCredits: number;
    totalDebits: number;
    currentUsdt: number;
  };
  transactions: WalletTransaction[];
}

// =======================================================
// COMPONENT
// =======================================================

export default function UsdthistoryPage() {
  // =====================================================
  // USER AUTH
  // =====================================================

  const [username] = useState(
    typeof window !== "undefined"
      ? localStorage.getItem("username") || ""
      : ""
  );

  const [token] = useState(
    typeof window !== "undefined"
      ? localStorage.getItem("token") || ""
      : ""
  );

  // =====================================================
  // PAGE STATES
  // =====================================================

  const [loading, setLoading] = useState(true);

  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);

  const [summary, setSummary] = useState({
    totalCredits: 0,
    totalDebits: 0,
    currentUsdt: 0,
  });

  const [search, setSearch] = useState("");

  const [filter, setFilter] = useState<
    "ALL" | "CREDIT" | "DEBIT"
  >("ALL");

  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // =====================================================
  // LOAD history
  // GET /api/Usdt/history/:username
  // =====================================================

  const loadhistory = async () => {
    if (!username || !token) {
      setLoading(false);
      setErrorMessage("Please login again.");
      return;
    }

    try {
      setLoading(true);
      setErrorMessage("");

      const response = await fetch(
        `${API}/api/Usdt/history/${username}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data: historyResponse = await response.json();

      if (response.ok && data.success) {
        setTransactions(data.transactions || []);

        setSummary({
          totalCredits: Number(data.summary.totalCredits || 0),
          totalDebits: Number(data.summary.totalDebits || 0),
          currentUsdt: Number(data.summary.currentUsdt || 0),
        });

        return;
      }

      // Empty history (No Crash)
      setTransactions([]);
      setSummary({
        totalCredits: 0,
        totalDebits: 0,
        currentUsdt: 0,
      });

      setErrorMessage(data.message || "No history found.");

    } catch (error: any) {
      console.error("Usdt history ERROR:", error);

      setTransactions([]);
      setSummary({
        totalCredits: 0,
        totalDebits: 0,
        currentUsdt: 0,
      });

      setErrorMessage(
        error.message || "Unable to load Wallet history."
      );

    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // REFRESH history
  // =====================================================

  const refreshhistory = async () => {
    await loadhistory();
  };

  // =====================================================
  // PAGE LOAD
  // =====================================================

  useEffect(() => {
    loadhistory();
  }, []);

  // =====================================================
  // AUTO CLEAR ALERTS
  // =====================================================

  useEffect(() => {
    if (!successMessage && !errorMessage) return;

    const timer = setTimeout(() => {
      setSuccessMessage("");
      setErrorMessage("");
    }, 5000);

    return () => clearTimeout(timer);
  }, [successMessage, errorMessage]);

  // =====================================================
  // SEARCH + FILTER TRANSACTIONS
  // =====================================================

  const filteredTransactions = useMemo(() => {
    let data = [...transactions];

    // CREDIT / DEBIT FILTER
    if (filter !== "ALL") {
      data = data.filter((item) => item.type === filter);
    }

    // SEARCH
    if (search.trim()) {
      const keyword = search.toLowerCase().trim();

      data = data.filter((item) => {
        return (
          item.note.toLowerCase().includes(keyword) ||
          item.type.toLowerCase().includes(keyword) ||
          item.adminUsername.toLowerCase().includes(keyword) ||
          item.amount.toString().includes(keyword)
        );
      });
    }

    // NEWEST FIRST
    return data.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() -
        new Date(a.createdAt).getTime()
    );
  }, [transactions, search, filter]);

  // =====================================================
  // SUMMARY OF FILTERED DATA
  // =====================================================

  const visibleSummary = useMemo(() => {
    const credits = filteredTransactions
      .filter((tx) => tx.type === "CREDIT")
      .reduce((sum, tx) => sum + Number(tx.amount), 0);

    const debits = filteredTransactions
      .filter((tx) => tx.type === "DEBIT")
      .reduce((sum, tx) => sum + Number(tx.amount), 0);

    return {
      credits,
      debits,
      total: filteredTransactions.length,
    };
  }, [filteredTransactions]);

  // =====================================================
  // TOTAL VOLUME
  // =====================================================

  const totalVolume = useMemo(() => {
    return filteredTransactions.reduce(
      (sum, tx) => sum + Number(tx.amount),
      0
    );
  }, [filteredTransactions]);

  // =====================================================
  // FILTER FUNCTIONS
  // =====================================================

  const handleFilter = (
    value: "ALL" | "CREDIT" | "DEBIT"
  ) => {
    setFilter(value);
  };

  const clearFilters = () => {
    setSearch("");
    setFilter("ALL");
  };

  // =====================================================
  // FORMAT DATE
  // =====================================================

  const formatDate = (date: string) => {
    try {
      return new Date(date).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return "-";
    }
  };

  const formatTime = (date: string) => {
    try {
      return new Date(date).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    } catch {
      return "-";
    }
  };

  // =====================================================
  // FORMAT Usdt
  // =====================================================

  const formatUsdt = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Number(value || 0));
  };

  // =====================================================
  // BADGE COLORS
  // =====================================================

  const getBadgeColor = (type: TransactionType) => {
    return type === "CREDIT"
      ? "bg-green-100 text-green-700 border border-green-300"
      : "bg-red-100 text-red-700 border border-red-300";
  };

  // =====================================================
  // CHECK IF history EXISTS
  // =====================================================

  const hashistory = filteredTransactions.length > 0;

  // =====================================================
  // JSX UI START
  // PART 3/5
  // =====================================================

  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-8">
      <div className="mx-auto max-w-7xl">

        {/* ===================================================== */}
        {/* PAGE HEADER */}
        {/* ===================================================== */}

        <div className="mb-6 rounded-3xl bg-gradient-to-r from-emerald-700 via-teal-600 to-cyan-600 p-6 text-white shadow-xl">

          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

            <div>
              <h1 className="text-3xl font-bold">
                Usdt Wallet history
              </h1>

              <p className="mt-2 text-cyan-100">
                GoldTrade V18 • Complete Credit & Debit history
              </p>

              <p className="mt-2 text-sm text-cyan-200">
                Every approved buy, sell and Wallet transaction appears here automatically.
              </p>
            </div>

            <button
              type="button"
              onClick={refreshhistory}
              disabled={loading}
              className="rounded-xl bg-white px-5 py-3 font-semibold text-teal-700 transition hover:bg-cyan-50 disabled:opacity-50"
            >
              {loading ? "Refreshing..." : "Refresh history"}
            </button>

          </div>

        </div>

        {/* ===================================================== */}
        {/* SUCCESS / ERROR ALERTS */}
        {/* ===================================================== */}

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

        {/* ===================================================== */}
        {/* PAGE LOADING */}
        {/* ===================================================== */}

        {loading ? (
          <div className="rounded-2xl bg-white p-12 text-center shadow-lg">

            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-teal-600 border-t-transparent"></div>

            <p className="text-gray-600">Loading Wallet history...</p>

          </div>
        ) : (
          <>

            {/* ===================================================== */}
            {/* SUMMARY CARDS */}
            {/* ===================================================== */}

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">

              {/* Current Balance */}

              <div className="rounded-2xl bg-white p-5 shadow-lg">
                <p className="text-sm text-gray-500">
                  Current Balance
                </p>

                <h2 className="mt-2 text-2xl font-bold text-teal-700">
                  {formatUsdt(summary.currentUsdt)} Usdt
                </h2>
              </div>

              {/* Credits */}

              <div className="rounded-2xl bg-white p-5 shadow-lg">
                <p className="text-sm text-gray-500">
                  Total Credits
                </p>

                <h2 className="mt-2 text-2xl font-bold text-green-600">
                  +{formatUsdt(summary.totalCredits)}
                </h2>
              </div>

              {/* Debits */}

              <div className="rounded-2xl bg-white p-5 shadow-lg">
                <p className="text-sm text-gray-500">
                  Total Debits
                </p>

                <h2 className="mt-2 text-2xl font-bold text-red-600">
                  -{formatUsdt(summary.totalDebits)}
                </h2>
              </div>

              {/* Transactions */}

              <div className="rounded-2xl bg-white p-5 shadow-lg">
                <p className="text-sm text-gray-500">
                  Transactions
                </p>

                <h2 className="mt-2 text-2xl font-bold text-cyan-700">
                  {transactions.length}
                </h2>
              </div>

            </div>

            {/* ===================================================== */}
            {/* SEARCH + FILTER SECTION */}
            {/* ===================================================== */}

            <div className="mt-6 rounded-2xl bg-white p-5 shadow-lg">

              <div className="grid gap-4 lg:grid-cols-3">

                {/* Search */}

                <div className="lg:col-span-2">

                  <label className="mb-2 block text-sm font-semibold text-gray-600">
                    Search Transactions
                  </label>

                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search note, admin, amount..."
                    className="w-full rounded-xl border border-gray-300 p-4 outline-none transition focus:border-teal-500"
                  />

                </div>

                {/* Refresh */}

                <div className="flex items-end">

                  <button
                    type="button"
                    onClick={refreshhistory}
                    className="w-full rounded-xl bg-teal-600 py-4 font-semibold text-white transition hover:bg-teal-700"
                  >
                    Refresh history
                  </button>

                </div>

              </div>

              {/* ===================================================== */}
              {/* CREDIT / DEBIT FILTER BUTTONS */}
              {/* ===================================================== */}

              <div className="mt-6">

                <label className="mb-3 block text-sm font-semibold text-gray-600">
                  Filter Transactions
                </label>

                <div className="grid grid-cols-3 gap-3">

                  {(["ALL", "CREDIT", "DEBIT"] as const).map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => handleFilter(item)}
                      className={`rounded-xl p-3 font-semibold transition ${
                        filter === item
                          ? "bg-teal-600 text-white"
                          : "border border-gray-300 bg-white text-gray-700 hover:border-teal-400"
                      }`}
                    >
                      {item}
                    </button>
                  ))}

                </div>

              </div>

              {/* ===================================================== */}
              {/* FILTER SUMMARY */}
              {/* ===================================================== */}

              <div className="mt-6 rounded-xl bg-slate-50 p-4">

                <div className="grid gap-4 md:grid-cols-4">

                  <div>
                    <p className="text-sm text-gray-500">Search</p>

                    <h4 className="font-bold text-teal-700">
                      {search || "None"}
                    </h4>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500">Filter</p>

                    <h4 className="font-bold text-indigo-700">
                      {filter}
                    </h4>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500">Results</p>

                    <h4 className="font-bold text-green-700">
                      {filteredTransactions.length}
                    </h4>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500">Volume</p>

                    <h4 className="font-bold text-cyan-700">
                      {formatUsdt(totalVolume)} Usdt
                    </h4>
                  </div>

                </div>

                <button
                  type="button"
                  onClick={clearFilters}
                  className="mt-5 rounded-xl bg-gray-200 px-5 py-2 font-semibold text-gray-700 transition hover:bg-gray-300"
                >
                  Clear Filters
                </button>

              </div>

            </div>
                        {/* ===================================================== */}
            {/* TRANSACTION history TABLE */}
            {/* ===================================================== */}

            {hashistory && (
              <div className="mt-6 overflow-hidden rounded-3xl bg-white shadow-xl">

                {/* ================= DESKTOP TABLE ================= */}

                <div className="hidden overflow-x-auto lg:block">

                  <table className="min-w-full border-collapse">

                    <thead className="bg-slate-800 text-white">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-semibold">
                          Date
                        </th>

                        <th className="px-4 py-3 text-left text-sm font-semibold">
                          Type
                        </th>

                        <th className="px-4 py-3 text-right text-sm font-semibold">
                          Amount
                        </th>

                        <th className="px-4 py-3 text-right text-sm font-semibold">
                          Previous
                        </th>

                        <th className="px-4 py-3 text-right text-sm font-semibold">
                          New Balance
                        </th>

                        <th className="px-4 py-3 text-left text-sm font-semibold">
                          Note
                        </th>

                        <th className="px-4 py-3 text-left text-sm font-semibold">
                          Admin
                        </th>
                      </tr>
                    </thead>

                    <tbody>

                      {filteredTransactions.map((tx, index) => (
                        <tr
                          key={tx._id}
                          className={`border-b transition hover:bg-slate-50 ${
                            index % 2 === 0
                              ? "bg-white"
                              : "bg-slate-50"
                          }`}
                        >

                          {/* DATE */}

                          <td className="px-4 py-4 align-top">
                            <p className="font-medium text-gray-700">
                              {formatDate(tx.createdAt)}
                            </p>

                            <p className="text-xs text-gray-500">
                              {formatTime(tx.createdAt)}
                            </p>
                          </td>

                          {/* TYPE */}

                          <td className="px-4 py-4 align-top">
                            <span
                              className={`rounded-full px-3 py-1 text-xs font-bold ${getBadgeColor(
                                tx.type
                              )}`}
                            >
                              {tx.type}
                            </span>
                          </td>

                          {/* AMOUNT */}

                          <td className="px-4 py-4 text-right align-top">
                            <p
                              className={`font-bold ${
                                tx.type === "CREDIT"
                                  ? "text-green-600"
                                  : "text-red-600"
                              }`}
                            >
                              {tx.type === "CREDIT" ? "+" : "-"}
                              {formatUsdt(tx.amount)}
                            </p>

                            <p className="text-xs text-gray-500">
                              Usdt
                            </p>
                          </td>

                          {/* PREVIOUS BALANCE */}

                          <td className="px-4 py-4 text-right align-top">
                            <p className="font-medium text-gray-700">
                              {formatUsdt(tx.previousBalance)}
                            </p>
                          </td>

                          {/* NEW BALANCE */}

                          <td className="px-4 py-4 text-right align-top">
                            <p className="font-bold text-teal-700">
                              {formatUsdt(tx.newBalance)}
                            </p>
                          </td>

                          {/* NOTE */}

                          <td className="max-w-xs px-4 py-4 align-top">
                            <p className="text-sm text-gray-700">
                              {tx.note || "-"}
                            </p>
                          </td>

                          {/* ADMIN */}

                          <td className="px-4 py-4 align-top">
                            <span className="rounded-lg bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                              {tx.adminUsername}
                            </span>
                          </td>

                        </tr>
                      ))}

                    </tbody>

                  </table>

                </div>

                {/* ================= MOBILE VIEW ================= */}

                <div className="space-y-4 p-4 lg:hidden">

                  {filteredTransactions.map((tx) => (
                    <div
                      key={`mobile-${tx._id}`}
                      className="rounded-2xl border bg-white p-4 shadow-sm"
                    >

                      <div className="mb-3 flex items-center justify-between">

                        <span
                          className={`rounded-full px-3 py-1 text-xs font-bold ${getBadgeColor(
                            tx.type
                          )}`}
                        >
                          {tx.type}
                        </span>

                        <span className="text-xs text-gray-500">
                          {formatDate(tx.createdAt)}
                        </span>

                      </div>

                      <h3
                        className={`text-xl font-bold ${
                          tx.type === "CREDIT"
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {tx.type === "CREDIT" ? "+" : "-"}
                        {formatUsdt(tx.amount)} Usdt
                      </h3>

                      <p className="mt-1 text-xs text-gray-500">
                        {formatTime(tx.createdAt)}
                      </p>

                      {/* BALANCES */}

                      <div className="mt-4 grid grid-cols-2 gap-3">

                        <div className="rounded-xl bg-slate-50 p-3">
                          <p className="text-xs text-gray-500">
                            Previous Balance
                          </p>

                          <p className="font-semibold text-gray-700">
                            {formatUsdt(tx.previousBalance)}
                          </p>
                        </div>

                        <div className="rounded-xl bg-teal-50 p-3">
                          <p className="text-xs text-teal-600">
                            New Balance
                          </p>

                          <p className="font-bold text-teal-700">
                            {formatUsdt(tx.newBalance)}
                          </p>
                        </div>

                      </div>

                      {/* NOTE */}

                      <div className="mt-4 rounded-xl bg-slate-50 p-3">
                        <p className="text-xs text-gray-500">
                          Transaction Note
                        </p>

                        <p className="mt-1 text-sm text-gray-700">
                          {tx.note || "-"}
                        </p>
                      </div>

                      {/* ADMIN */}

                      <div className="mt-4 flex items-center justify-between">

                        <span className="text-xs text-gray-500">
                          Processed By
                        </span>

                        <span className="rounded-lg bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                          {tx.adminUsername}
                        </span>

                      </div>

                    </div>
                  ))}

                </div>

              </div>
            )}

            {/* ===================================================== */}
            {/* history SUMMARY */}
            {/* ===================================================== */}

            {hashistory && (
              <div className="mt-6 rounded-3xl bg-white p-6 shadow-xl">

                <h3 className="mb-5 text-xl font-bold text-gray-800">
                  Wallet history Summary
                </h3>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">

                  {/* Current Balance */}
                  <div className="rounded-2xl bg-teal-50 p-5">
                    <p className="text-sm text-teal-600">
                      Current Balance
                    </p>

                    <h4 className="mt-2 text-2xl font-bold text-teal-700">
                      {formatUsdt(summary.currentUsdt)} Usdt
                    </h4>
                  </div>

                  {/* Credits */}
                  <div className="rounded-2xl bg-green-50 p-5">
                    <p className="text-sm text-green-600">
                      Total Credits
                    </p>

                    <h4 className="mt-2 text-2xl font-bold text-green-700">
                      +{formatUsdt(summary.totalCredits)}
                    </h4>
                  </div>

                  {/* Debits */}
                  <div className="rounded-2xl bg-red-50 p-5">
                    <p className="text-sm text-red-600">
                      Total Debits
                    </p>

                    <h4 className="mt-2 text-2xl font-bold text-red-700">
                      -{formatUsdt(summary.totalDebits)}
                    </h4>
                  </div>

                  {/* Total Transactions */}
                  <div className="rounded-2xl bg-cyan-50 p-5">
                    <p className="text-sm text-cyan-600">
                      Transactions
                    </p>

                    <h4 className="mt-2 text-2xl font-bold text-cyan-700">
                      {transactions.length}
                    </h4>
                  </div>

                </div>

                {/* Visible Summary */}

                <div className="mt-6 grid gap-4 md:grid-cols-3">

                  <div className="rounded-xl bg-slate-50 p-4">
                    <p className="text-sm text-gray-500">
                      Visible Transactions
                    </p>

                    <h4 className="text-xl font-bold text-slate-700">
                      {visibleSummary.total}
                    </h4>
                  </div>

                  <div className="rounded-xl bg-green-50 p-4">
                    <p className="text-sm text-green-600">
                      Visible Credits
                    </p>

                    <h4 className="text-xl font-bold text-green-700">
                      +{formatUsdt(visibleSummary.credits)}
                    </h4>
                  </div>

                  <div className="rounded-xl bg-red-50 p-4">
                    <p className="text-sm text-red-600">
                      Visible Debits
                    </p>

                    <h4 className="text-xl font-bold text-red-700">
                      -{formatUsdt(visibleSummary.debits)}
                    </h4>
                  </div>

                </div>

              </div>
            )}

            {/* ===================================================== */}
            {/* EMPTY STATE */}
            {/* ===================================================== */}

            {!hashistory && (
              <div className="mt-6 rounded-3xl bg-white p-12 text-center shadow-xl">

                <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-teal-100">
                  <span className="text-5xl">📜</span>
                </div>

                <h2 className="mt-6 text-2xl font-bold text-gray-700">
                  No Usdt history Found
                </h2>

                <p className="mt-3 text-gray-500">
                  Your approved buy, sell and Wallet transactions will appear here automatically.
                </p>

                <button
                  type="button"
                  onClick={refreshhistory}
                  className="mt-6 rounded-xl bg-teal-600 px-6 py-3 font-semibold text-white transition hover:bg-teal-700"
                >
                  Refresh history
                </button>

              </div>
            )}

            {/* ===================================================== */}
            {/* ACCOUNT INFORMATION */}
            {/* ===================================================== */}

            <div className="mt-8 rounded-2xl border border-cyan-200 bg-cyan-50 p-5">

              <h3 className="mb-3 text-lg font-bold text-cyan-700">
                Wallet Information
              </h3>

              <div className="grid gap-4 md:grid-cols-2">

                <div>
                  <p className="text-sm text-gray-500">Username</p>

                  <h4 className="font-bold text-gray-800">
                    {username || "User"}
                  </h4>
                </div>

                <div>
                  <p className="text-sm text-gray-500">
                    Wallet Currency
                  </p>

                  <h4 className="font-bold text-teal-700">
                    Usdt Wallet
                  </h4>
                </div>

                <div>
                  <p className="text-sm text-gray-500">
                    Current Balance
                  </p>

                  <h4 className="font-bold text-green-700">
                    {formatUsdt(summary.currentUsdt)} Usdt
                  </h4>
                </div>

                <div>
                  <p className="text-sm text-gray-500">
                    Wallet Activity
                  </p>

                  <h4 className="font-bold text-indigo-700">
                    {transactions.length} Transactions
                  </h4>
                </div>

              </div>

            </div>

            {/* ===================================================== */}
            {/* SECURITY NOTICE */}
            {/* ===================================================== */}

            <div className="mt-6 rounded-2xl border border-green-200 bg-green-50 p-5">

              <h3 className="mb-3 text-lg font-bold text-green-700">
                GoldTrade Secure Wallet history
              </h3>

              <ul className="space-y-2 text-sm text-gray-700">
                <li>• Every buy and sell transaction is recorded automatically.</li>
                <li>• Wallet balance updates only after Admin approval.</li>
                <li>• Credit and Debit history cannot be edited by users.</li>
                <li>• Transaction timestamps are stored securely.</li>
                <li>• history is permanently available for Wallet auditing.</li>
              </ul>

            </div>

            {/* ===================================================== */}
            {/* FOOTER */}
            {/* ===================================================== */}

            <div className="mt-10 border-t pt-6 text-center">

              <h4 className="text-lg font-bold text-slate-700">
                GoldTrade V18 Usdt Wallet history
              </h4>

              <p className="mt-2 text-sm text-gray-500">
                Pkr • Usdt • Gold • Secure Digital Wallet
              </p>

              <p className="mt-1 text-xs text-gray-400">
                Every transaction is securely recorded inside GoldTrade V18.
              </p>

            </div>

          </>
        )}

      </div>
    </div>
  );
}