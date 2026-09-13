"use client";

import { useEffect, useMemo, useState } from "react";
import {
  History,
  Search,
  RefreshCw,
  Calendar,
  ArrowDownLeft,
  ArrowUpRight,
  Coins,
  Wallet,
  CheckCircle2,
  XCircle,
  Clock,
  Filter,
  Download,
  TrendingUp,
} from "lucide-react";

const API =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:10000";

/* ==========================================================
   TYPES
========================================================== */

type TransactionType = "DEPOSIT" | "WITHDRAW" | "BUY" | "SELL";

type TransactionStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "SUCCESS";

interface TransactionHistory {
  _id: string;
  type: TransactionType;
  method: string;
  amount: number;
  goldQuantity?: number;
  goldPrice?: number;
  status: TransactionStatus;
  createdAt: string;
}

interface HistorySummary {
  totalDeposits: number;
  totalWithdrawals: number;
  totalBuyAmount: number;
  totalSellAmount: number;
  totalTransactions: number;
}

/* ==========================================================
   COMPONENT START
========================================================== */

export default function HistoryPage() {
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("token")
      : "";

  /* ==========================================================
     STATES
  ========================================================== */

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [transactions, setTransactions] = useState<TransactionHistory[]>([]);

  const [summary, setSummary] = useState<HistorySummary>({
    totalDeposits: 0,
    totalWithdrawals: 0,
    totalBuyAmount: 0,
    totalSellAmount: 0,
    totalTransactions: 0,
  });

  const [search, setSearch] = useState("");

  const [typeFilter, setTypeFilter] =
    useState<"ALL" | TransactionType>("ALL");

  const [statusFilter, setStatusFilter] =
    useState<"ALL" | TransactionStatus>("ALL");

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [selectedTransaction, setSelectedTransaction] =
    useState<TransactionHistory | null>(null);

  const [openDetails, setOpenDetails] = useState(false);// =====================================================
// GOLDTRADE V17 ENTERPRISE
// FILE: frontend/app/history/page.tsx
// SECTION 2/10
// API FUNCTIONS + FILTERS + EXPORT FUNCTIONS
// =====================================================

  /* ==========================================================
     LOAD HISTORY FROM API
  ========================================================== */

  const loadHistory = async () => {
    try {
      setRefreshing(true);

      const response = await fetch(`${API}/api/history/all`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        setTransactions(data.transactions || []);
        setSummary(
          data.summary || {
            totalDeposits: 0,
            totalWithdrawals: 0,
            totalBuyAmount: 0,
            totalSellAmount: 0,
            totalTransactions: 0,
          }
        );
      }
    } catch (error) {
      console.error("History Error:", error);
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      loadHistory();
    }
  }, [token]);

  /* ==========================================================
     FILTER TRANSACTIONS
  ========================================================== */

  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      const matchesSearch =
        tx.type.toLowerCase().includes(search.toLowerCase()) ||
        tx.method.toLowerCase().includes(search.toLowerCase()) ||
        tx.amount.toString().includes(search);

      const matchesType =
        typeFilter === "ALL" || tx.type === typeFilter;

      const matchesStatus =
        statusFilter === "ALL" || tx.status === statusFilter;

      const txDate = new Date(tx.createdAt);

      const matchesStart =
        !startDate || txDate >= new Date(startDate);

      const matchesEnd =
        !endDate ||
        txDate <= new Date(`${endDate}T23:59:59`);

      return (
        matchesSearch &&
        matchesType &&
        matchesStatus &&
        matchesStart &&
        matchesEnd
      );
    });
  }, [
    transactions,
    search,
    typeFilter,
    statusFilter,
    startDate,
    endDate,
  ]);

  /* ==========================================================
     TOTALS AFTER FILTER
  ========================================================== */

  const filteredSummary = useMemo(() => {
    let deposit = 0;
    let withdraw = 0;
    let buy = 0;
    let sell = 0;

    filteredTransactions.forEach((tx) => {
      if (
        tx.type === "DEPOSIT" &&
        (tx.status === "APPROVED" || tx.status === "SUCCESS")
      ) {
        deposit += tx.amount;
      }

      if (
        tx.type === "WITHDRAW" &&
        (tx.status === "APPROVED" || tx.status === "SUCCESS")
      ) {
        withdraw += tx.amount;
      }

      if (tx.type === "BUY") {
        buy += tx.amount;
      }

      if (tx.type === "SELL") {
        sell += tx.amount;
      }
    });

    return {
      deposit,
      withdraw,
      buy,
      sell,
      total: deposit + buy + sell + withdraw,
    };
  }, [filteredTransactions]);

  /* ==========================================================
     RESET FILTERS
  ========================================================== */

  const resetFilters = () => {
    setSearch("");
    setTypeFilter("ALL");
    setStatusFilter("ALL");
    setStartDate("");
    setEndDate("");
  };

  /* ==========================================================
     EXPORT CSV
  ========================================================== */

  const exportCSV = () => {
    const header = [
      "Type",
      "Method",
      "Amount",
      "Gold Quantity",
      "Status",
      "Date",
    ];

    const rows = filteredTransactions.map((tx) => [
      tx.type,
      tx.method,
      tx.amount,
      tx.goldQuantity || 0,
      tx.status,
      new Date(tx.createdAt).toLocaleString(),
    ]);

    const csvContent = [header, ...rows]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `GoldTrade_History_${
      new Date().toISOString().split("T")[0]
    }.csv`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  };

  /* ==========================================================
     STATUS COLORS
  ========================================================== */

  const getStatusColor = (status: TransactionStatus) => {
    switch (status) {
      case "SUCCESS":
      case "APPROVED":
        return "bg-green-600 text-white";

      case "PENDING":
        return "bg-yellow-500 text-black";

      case "REJECTED":
        return "bg-red-600 text-white";

      default:
        return "bg-zinc-700 text-white";
    }
  };

  /* ==========================================================
     TYPE COLORS
  ========================================================== */

  const getTypeColor = (type: TransactionType) => {
    switch (type) {
      case "DEPOSIT":
        return "text-green-400";

      case "WITHDRAW":
        return "text-red-400";

      case "BUY":
        return "text-blue-400";

      case "SELL":
        return "text-orange-400";

      default:
        return "text-white";
    }
  };

  /* ==========================================================
     DATE FORMAT
  ========================================================== */

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString("en-PK", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const pendingCount = useMemo(
    () => transactions.filter((tx) => tx.status === "PENDING").length,
    [transactions]
  );

  const approvedCount = useMemo(
    () =>
      transactions.filter(
        (tx) => tx.status === "APPROVED" || tx.status === "SUCCESS"
      ).length,
    [transactions]
  );

  const rejectedCount = useMemo(
    () => transactions.filter((tx) => tx.status === "REJECTED").length,
    [transactions]
  );

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="max-w-7xl mx-auto px-4 py-10 md:px-6 lg:px-8">
        {/* =====================================================
// GOLDTRADE V17 ENTERPRISE
// FILE: frontend/app/history/page.tsx
// SECTION 3/10
// HEADER + SUMMARY CARDS + SEARCH + FILTER UI
// =====================================================

        {/* ================= HEADER ================= */}

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5 mb-8">

          <div>
            <h1 className="text-5xl font-black text-yellow-400 flex items-center gap-3">
              <History size={42} />
              Transaction History
            </h1>

            <p className="text-gray-400 mt-2">
              Complete history of Deposits, Withdrawals, Gold Buy and Gold Sell.
            </p>
          </div>

          <button
            onClick={loadHistory}
            disabled={refreshing}
            className="bg-yellow-500 hover:bg-yellow-400 text-black px-5 py-3 rounded-xl font-bold flex items-center gap-2 disabled:opacity-50"
          >
            <RefreshCw
              size={18}
              className={refreshing ? "animate-spin" : ""}
            />
            Refresh History
          </button>

        </div>

        {/* ================= SUMMARY CARDS ================= */}

        <div className="grid md:grid-cols-4 gap-5 mb-10">

          <div className="bg-zinc-900 border border-green-600 rounded-3xl p-6">

            <ArrowDownLeft className="text-green-400 mb-3" size={30} />

            <p className="text-gray-400 text-sm">
              Total Deposits
            </p>

            <h2 className="text-3xl font-black text-green-400 mt-2">
              PKR {summary.totalDeposits.toLocaleString()}
            </h2>

          </div>

          <div className="bg-zinc-900 border border-red-600 rounded-3xl p-6">

            <ArrowUpRight className="text-red-400 mb-3" size={30} />

            <p className="text-gray-400 text-sm">
              Total Withdrawals
            </p>

            <h2 className="text-3xl font-black text-red-400 mt-2">
              PKR {summary.totalWithdrawals.toLocaleString()}
            </h2>

          </div>

          <div className="bg-zinc-900 border border-blue-600 rounded-3xl p-6">

            <Coins className="text-blue-400 mb-3" size={30} />

            <p className="text-gray-400 text-sm">
              Gold Purchased
            </p>

            <h2 className="text-3xl font-black text-blue-400 mt-2">
              PKR {summary.totalBuyAmount.toLocaleString()}
            </h2>

          </div>

          <div className="bg-zinc-900 border border-orange-500 rounded-3xl p-6">

            <Wallet className="text-orange-400 mb-3" size={30} />

            <p className="text-gray-400 text-sm">
              Gold Sold
            </p>

            <h2 className="text-3xl font-black text-orange-400 mt-2">
              PKR {summary.totalSellAmount.toLocaleString()}
            </h2>

          </div>

        </div>

        {/* ================= STATUS OVERVIEW ================= */}

        <div className="grid md:grid-cols-3 gap-5 mb-10">

          <div className="bg-zinc-900 border border-yellow-500 rounded-3xl p-6 text-center">

            <Clock className="mx-auto text-yellow-400 mb-3" size={34} />

            <p className="text-gray-400 text-sm">
              Pending Transactions
            </p>

            <h2 className="text-4xl font-black text-yellow-400 mt-2">
              {pendingCount}
            </h2>

          </div>

          <div className="bg-zinc-900 border border-green-600 rounded-3xl p-6 text-center">

            <CheckCircle2 className="mx-auto text-green-400 mb-3" size={34} />

            <p className="text-gray-400 text-sm">
              Approved Transactions
            </p>

            <h2 className="text-4xl font-black text-green-400 mt-2">
              {approvedCount}
            </h2>

          </div>

          <div className="bg-zinc-900 border border-red-600 rounded-3xl p-6 text-center">

            <XCircle className="mx-auto text-red-400 mb-3" size={34} />

            <p className="text-gray-400 text-sm">
              Rejected Transactions
            </p>

            <h2 className="text-4xl font-black text-red-400 mt-2">
              {rejectedCount}
            </h2>

          </div>

        </div>

        {/* ================= SEARCH & FILTER PANEL ================= */}

        <div className="bg-zinc-900 border border-yellow-500 rounded-3xl p-6 mb-10">

          <div className="flex items-center gap-3 mb-6">

            <Filter className="text-yellow-400" size={28} />

            <h2 className="text-3xl font-black text-yellow-400">
              Search & Filters
            </h2>

          </div>

          {/* SEARCH */}

          <div className="relative mb-6">

            <Search
              className="absolute left-4 top-4 text-gray-500"
              size={20}
            />

            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search transaction type, method or amount..."
              className="w-full bg-black border border-zinc-700 rounded-xl py-3 pl-12 pr-4 text-white focus:border-yellow-500 outline-none"
            />

          </div>

          {/* FILTER GRID */}

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">

            {/* TYPE */}

            <div>

              <label className="text-gray-400 text-sm mb-2 block">
                Transaction Type
              </label>

              <select
                value={typeFilter}
                onChange={(e) =>
                  setTypeFilter(e.target.value as "ALL" | TransactionType)
                }
                className="w-full bg-black border border-zinc-700 rounded-xl p-3 text-white"
              >
                <option value="ALL">All Transactions</option>
                <option value="DEPOSIT">Deposit</option>
                <option value="WITHDRAW">Withdraw</option>
                <option value="BUY">Buy Gold</option>
                <option value="SELL">Sell Gold</option>
              </select>

            </div>

            {/* STATUS */}

            <div>

              <label className="text-gray-400 text-sm mb-2 block">
                Status
              </label>

              <select
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(e.target.value as "ALL" | TransactionStatus)
                }
                className="w-full bg-black border border-zinc-700 rounded-xl p-3 text-white"
              >
                <option value="ALL">All Status</option>
                <option value="PENDING">Pending</option>
                <option value="APPROVED">Approved</option>
                <option value="SUCCESS">Success</option>
                <option value="REJECTED">Rejected</option>
              </select>

            </div>

            {/* START DATE */}

            <div>

              <label className="text-gray-400 text-sm mb-2 block">
                From Date
              </label>

              <div className="relative">

                <Calendar
                  className="absolute left-3 top-3.5 text-gray-500"
                  size={18}
                />

                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-black border border-zinc-700 rounded-xl py-3 pl-10 pr-4 text-white"
                />

              </div>

            </div>

            {/* END DATE */}

            <div>

              <label className="text-gray-400 text-sm mb-2 block">
                To Date
              </label>

              <div className="relative">

                <Calendar
                  className="absolute left-3 top-3.5 text-gray-500"
                  size={18}
                />

                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full bg-black border border-zinc-700 rounded-xl py-3 pl-10 pr-4 text-white"
                />

              </div>

            </div>

          </div>

          {/* ACTION BUTTONS */}

          <div className="flex flex-wrap gap-4 mt-8">

            <button
              onClick={resetFilters}
              className="bg-zinc-800 hover:bg-zinc-700 px-5 py-3 rounded-xl font-bold"
            >
              Reset Filters
            </button>

            <button
              onClick={exportCSV}
              className="bg-green-600 hover:bg-green-500 px-5 py-3 rounded-xl font-bold flex items-center gap-2"
            >
              <Download size={18} />
              Export CSV
            </button>

          </div>

        </div>

        {/* ================= TRANSACTION TABLE STARTS IN SECTION 4 ================= */}// =====================================================
// GOLDTRADE V17 ENTERPRISE
// FILE: frontend/app/history/page.tsx
// SECTION 4/10
// TRANSACTION HISTORY TABLE
// =====================================================

        {/* ================= TRANSACTION HISTORY ================= */}

        <div className="bg-zinc-900 border border-cyan-600 rounded-3xl p-6 mb-10">

          <div className="flex justify-between items-center flex-wrap gap-3 mb-6">

            <div>
              <h2 className="text-3xl font-black text-cyan-400">
                Transaction History
              </h2>

              <p className="text-gray-400">
                Complete wallet transaction records.
              </p>
            </div>

            <div className="bg-cyan-600 px-4 py-2 rounded-full text-sm font-bold">
              {filteredTransactions.length} Transactions
            </div>

          </div>

          {/* TABLE */}

          <div className="overflow-x-auto rounded-2xl border border-zinc-800">

            <table className="w-full min-w-[900px]">

              <thead className="bg-black text-cyan-400">

                <tr className="border-b border-zinc-800">

                  <th className="p-4 text-left">Transaction</th>

                  <th className="p-4 text-left">Method</th>

                  <th className="p-4 text-left">Amount</th>

                  <th className="p-4 text-left">Gold Qty</th>

                  <th className="p-4 text-left">Status</th>

                  <th className="p-4 text-left">Date</th>

                  <th className="p-4 text-center">Action</th>

                </tr>

              </thead>

              <tbody>

                {filteredTransactions.length === 0 ? (

                  <tr>

                    <td
                      colSpan={7}
                      className="text-center py-16 text-gray-500"
                    >
                      No Transactions Found
                    </td>

                  </tr>

                ) : (

                  filteredTransactions.map((tx) => (

                    <tr
                      key={tx._id}
                      className="border-b border-zinc-800 hover:bg-black/40 transition"
                    >

                      {/* TYPE */}

                      <td className="p-4">

                        <div className="flex items-center gap-3">

                          {tx.type === "DEPOSIT" && (
                            <ArrowDownLeft
                              className="text-green-400"
                              size={22}
                            />
                          )}

                          {tx.type === "WITHDRAW" && (
                            <ArrowUpRight
                              className="text-red-400"
                              size={22}
                            />
                          )}

                          {tx.type === "BUY" && (
                            <Coins
                              className="text-blue-400"
                              size={22}
                            />
                          )}

                          {tx.type === "SELL" && (
                            <Wallet
                              className="text-orange-400"
                              size={22}
                            />
                          )}

                          <span
                            className={`font-bold ${getTypeColor(tx.type)}`}
                          >
                            {tx.type}
                          </span>

                        </div>

                      </td>

                      {/* METHOD */}

                      <td className="p-4 text-gray-300">
                        {tx.method}
                      </td>

                      {/* AMOUNT */}

                      <td className="p-4 font-bold text-yellow-400">
                        PKR {tx.amount.toLocaleString()}
                      </td>

                      {/* GOLD */}

                      <td className="p-4 text-blue-400 font-semibold">
                        {tx.goldQuantity
                          ? `${tx.goldQuantity.toFixed(4)} g`
                          : "--"}
                      </td>

                      {/* STATUS */}

                      <td className="p-4">

                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(
                            tx.status
                          )}`}
                        >
                          {tx.status}
                        </span>

                      </td>

                      {/* DATE */}

                      <td className="p-4 text-gray-400 whitespace-nowrap">
                        {formatDate(tx.createdAt)}
                      </td>

                      {/* ACTION */}

                      <td className="p-4 text-center">

                        <button
                          onClick={() => {
                            setSelectedTransaction(tx);
                            setOpenDetails(true);
                          }}
                          className="bg-yellow-500 hover:bg-yellow-400 text-black px-3 py-2 rounded-lg text-sm font-bold"
                        >
                          Details
                        </button>

                      </td>

                    </tr>

                  ))

                )}

              </tbody>

            </table>

          </div>

        </div>

        {/* ================= FILTER SUMMARY ================= */}

        <div className="grid md:grid-cols-4 gap-5 mb-10">

          <div className="bg-zinc-900 border border-green-600 rounded-2xl p-5">

            <p className="text-gray-400 text-sm">
              Deposit Total
            </p>

            <h3 className="text-2xl font-black text-green-400 mt-2">
              PKR {filteredSummary.deposit.toLocaleString()}
            </h3>

          </div>

          <div className="bg-zinc-900 border border-red-600 rounded-2xl p-5">

            <p className="text-gray-400 text-sm">
              Withdraw Total
            </p>

            <h3 className="text-2xl font-black text-red-400 mt-2">
              PKR {filteredSummary.withdraw.toLocaleString()}
            </h3>

          </div>

          <div className="bg-zinc-900 border border-blue-600 rounded-2xl p-5">

            <p className="text-gray-400 text-sm">
              Buy Total
            </p>

            <h3 className="text-2xl font-black text-blue-400 mt-2">
              PKR {filteredSummary.buy.toLocaleString()}
            </h3>

          </div>

          <div className="bg-zinc-900 border border-orange-500 rounded-2xl p-5">

            <p className="text-gray-400 text-sm">
              Sell Total
            </p>

            <h3 className="text-2xl font-black text-orange-400 mt-2">
              PKR {filteredSummary.sell.toLocaleString()}
            </h3>

          </div>

        </div>

        {/* NEXT SECTION STARTS HERE */}// =====================================================
// GOLDTRADE V17 ENTERPRISE
// FILE: frontend/app/history/page.tsx
// SECTION 5/10
// RECENT ACTIVITY + TRANSACTION ANALYTICS
// =====================================================

        {/* ================= RECENT ACTIVITY ================= */}

        <div className="bg-zinc-900 border border-purple-600 rounded-3xl p-6 mb-10">

          <div className="flex items-center gap-3 mb-6">
            <TrendingUp className="text-purple-400" size={28} />
            <h2 className="text-3xl font-black text-purple-400">
              Recent Activity
            </h2>
          </div>

          <div className="space-y-4">

            {filteredTransactions.slice(0, 6).map((tx) => (

              <div
                key={tx._id}
                className="bg-black border border-zinc-700 rounded-2xl p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4 hover:border-purple-500 transition"
              >

                <div className="flex items-center gap-4">

                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      tx.type === "DEPOSIT"
                        ? "bg-green-500/20"
                        : tx.type === "WITHDRAW"
                        ? "bg-red-500/20"
                        : tx.type === "BUY"
                        ? "bg-blue-500/20"
                        : "bg-orange-500/20"
                    }`}
                  >

                    {tx.type === "DEPOSIT" && (
                      <ArrowDownLeft className="text-green-400" size={22} />
                    )}

                    {tx.type === "WITHDRAW" && (
                      <ArrowUpRight className="text-red-400" size={22} />
                    )}

                    {tx.type === "BUY" && (
                      <Coins className="text-blue-400" size={22} />
                    )}

                    {tx.type === "SELL" && (
                      <Wallet className="text-orange-400" size={22} />
                    )}

                  </div>

                  <div>

                    <h3 className={`font-bold text-lg ${getTypeColor(tx.type)}`}>
                      {tx.type}
                    </h3>

                    <p className="text-gray-400 text-sm">
                      {tx.method}
                    </p>

                    <p className="text-xs text-gray-500 mt-1">
                      {formatDate(tx.createdAt)}
                    </p>

                  </div>

                </div>

                <div className="text-right">

                  <p className="text-yellow-400 font-black text-xl">
                    PKR {tx.amount.toLocaleString()}
                  </p>

                  {tx.goldQuantity && (
                    <p className="text-blue-400 text-sm mt-1">
                      {tx.goldQuantity.toFixed(4)} Gram Gold
                    </p>
                  )}

                  <span
                    className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(
                      tx.status
                    )}`}
                  >
                    {tx.status}
                  </span>

                </div>

              </div>

            ))}

          </div>

        </div>

        {/* ================= TRANSACTION ANALYTICS ================= */}

        <div className="bg-zinc-900 border border-green-600 rounded-3xl p-6 mb-10">

          <div className="flex items-center gap-3 mb-6">

            <TrendingUp className="text-green-400" size={28} />

            <h2 className="text-3xl font-black text-green-400">
              Transaction Analytics
            </h2>

          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">

            <div className="bg-black border border-green-600 rounded-2xl p-5">

              <p className="text-gray-400 text-sm">Total Deposits</p>

              <h3 className="text-2xl font-black text-green-400 mt-2">
                PKR {filteredSummary.deposit.toLocaleString()}
              </h3>

              <p className="text-green-300 text-sm mt-2">
                Approved Deposit Amount
              </p>

            </div>

            <div className="bg-black border border-red-600 rounded-2xl p-5">

              <p className="text-gray-400 text-sm">Total Withdrawals</p>

              <h3 className="text-2xl font-black text-red-400 mt-2">
                PKR {filteredSummary.withdraw.toLocaleString()}
              </h3>

              <p className="text-red-300 text-sm mt-2">
                Approved Withdrawal Amount
              </p>

            </div>

            <div className="bg-black border border-blue-600 rounded-2xl p-5">

              <p className="text-gray-400 text-sm">Gold Buy Volume</p>

              <h3 className="text-2xl font-black text-blue-400 mt-2">
                PKR {filteredSummary.buy.toLocaleString()}
              </h3>

              <p className="text-blue-300 text-sm mt-2">
                Total Gold Purchased
              </p>

            </div>

            <div className="bg-black border border-orange-500 rounded-2xl p-5">

              <p className="text-gray-400 text-sm">Gold Sell Volume</p>

              <h3 className="text-2xl font-black text-orange-400 mt-2">
                PKR {filteredSummary.sell.toLocaleString()}
              </h3>

              <p className="text-orange-300 text-sm mt-2">
                Total Gold Sold
              </p>

            </div>

          </div>

        </div>

        {/* ================= TRANSACTION STATISTICS ================= */}

        <div className="grid md:grid-cols-3 gap-5 mb-10">

          <div className="bg-zinc-900 border border-yellow-500 rounded-3xl p-6 text-center">

            <Clock className="mx-auto text-yellow-400 mb-3" size={34} />

            <p className="text-gray-400 text-sm">Pending Requests</p>

            <h2 className="text-4xl font-black text-yellow-400 mt-2">
              {pendingCount}
            </h2>

          </div>

          <div className="bg-zinc-900 border border-green-600 rounded-3xl p-6 text-center">

            <CheckCircle2 className="mx-auto text-green-400 mb-3" size={34} />

            <p className="text-gray-400 text-sm">Successful Requests</p>

            <h2 className="text-4xl font-black text-green-400 mt-2">
              {approvedCount}
            </h2>

          </div>

          <div className="bg-zinc-900 border border-red-600 rounded-3xl p-6 text-center">

            <XCircle className="mx-auto text-red-400 mb-3" size={34} />

            <p className="text-gray-400 text-sm">Rejected Requests</p>

            <h2 className="text-4xl font-black text-red-400 mt-2">
              {rejectedCount}
            </h2>

          </div>

        </div>

        {/* NEXT SECTION STARTS HERE */}// =====================================================
// GOLDTRADE V17 ENTERPRISE
// FILE: frontend/app/history/page.tsx
// SECTION 6/10
// PORTFOLIO SUMMARY + GOLD ANALYTICS + MARKET OVERVIEW
// =====================================================

        {/* ================= PORTFOLIO SUMMARY ================= */}

        <div className="bg-zinc-900 border border-yellow-500 rounded-3xl p-6 mb-10">

          <div className="flex items-center gap-3 mb-6">
            <Wallet className="text-yellow-400" size={28} />

            <h2 className="text-3xl font-black text-yellow-400">
              Portfolio Summary
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">

            <div className="bg-black border border-green-600 rounded-2xl p-5">

              <p className="text-gray-400 text-sm">Total Deposited</p>

              <h3 className="text-2xl font-black text-green-400 mt-2">
                PKR {summary.totalDeposits.toLocaleString()}
              </h3>

            </div>

            <div className="bg-black border border-red-600 rounded-2xl p-5">

              <p className="text-gray-400 text-sm">Total Withdrawn</p>

              <h3 className="text-2xl font-black text-red-400 mt-2">
                PKR {summary.totalWithdrawals.toLocaleString()}
              </h3>

            </div>

            <div className="bg-black border border-blue-600 rounded-2xl p-5">

              <p className="text-gray-400 text-sm">Gold Buy Volume</p>

              <h3 className="text-2xl font-black text-blue-400 mt-2">
                PKR {summary.totalBuyAmount.toLocaleString()}
              </h3>

            </div>

            <div className="bg-black border border-orange-500 rounded-2xl p-5">

              <p className="text-gray-400 text-sm">Gold Sell Volume</p>

              <h3 className="text-2xl font-black text-orange-400 mt-2">
                PKR {summary.totalSellAmount.toLocaleString()}
              </h3>

            </div>

          </div>

        </div>

        {/* ================= GOLD ANALYTICS ================= */}

        <div className="bg-zinc-900 border border-blue-600 rounded-3xl p-6 mb-10">

          <div className="flex items-center gap-3 mb-6">
            <Coins className="text-blue-400" size={28} />

            <h2 className="text-3xl font-black text-blue-400">
              Gold Trading Analytics
            </h2>
          </div>

          <div className="grid lg:grid-cols-3 gap-5">

            <div className="bg-black border border-blue-600 rounded-2xl p-5">

              <p className="text-gray-400 text-sm">
                Gold Buy Transactions
              </p>

              <h3 className="text-4xl font-black text-blue-400 mt-3">
                {
                  filteredTransactions.filter((t) => t.type === "BUY")
                    .length
                }
              </h3>

            </div>

            <div className="bg-black border border-orange-500 rounded-2xl p-5">

              <p className="text-gray-400 text-sm">
                Gold Sell Transactions
              </p>

              <h3 className="text-4xl font-black text-orange-400 mt-3">
                {
                  filteredTransactions.filter((t) => t.type === "SELL")
                    .length
                }
              </h3>

            </div>

            <div className="bg-black border border-purple-600 rounded-2xl p-5">

              <p className="text-gray-400 text-sm">
                Total Gold Transactions
              </p>

              <h3 className="text-4xl font-black text-purple-400 mt-3">
                {
                  filteredTransactions.filter(
                    (t) => t.type === "BUY" || t.type === "SELL"
                  ).length
                }
              </h3>

            </div>

          </div>

        </div>

        {/* ================= TRANSACTION DISTRIBUTION ================= */}

        <div className="bg-zinc-900 border border-green-600 rounded-3xl p-6 mb-10">

          <div className="flex items-center gap-3 mb-6">

            <TrendingUp className="text-green-400" size={28} />

            <h2 className="text-3xl font-black text-green-400">
              Transaction Distribution
            </h2>

          </div>

          <div className="space-y-5">

            {[
              {
                label: "Deposits",
                color: "bg-green-500",
                value: filteredSummary.deposit,
                total: filteredSummary.total,
              },
              {
                label: "Withdrawals",
                color: "bg-red-500",
                value: filteredSummary.withdraw,
                total: filteredSummary.total,
              },
              {
                label: "Gold Buy",
                color: "bg-blue-500",
                value: filteredSummary.buy,
                total: filteredSummary.total,
              },
              {
                label: "Gold Sell",
                color: "bg-orange-500",
                value: filteredSummary.sell,
                total: filteredSummary.total,
              },
            ].map((item) => {

              const percent =
                item.total === 0
                  ? 0
                  : Number(
                      ((item.value / item.total) * 100).toFixed(1)
                    );

              return (
                <div key={item.label}>

                  <div className="flex justify-between text-sm mb-2">

                    <span className="font-semibold">
                      {item.label}
                    </span>

                    <span className="text-gray-400">
                      {percent}%
                    </span>

                  </div>

                  <div className="w-full h-3 rounded-full bg-zinc-800 overflow-hidden">

                    <div
                      className={`${item.color} h-3 rounded-full`}
                      style={{ width: `${percent}%` }}
                    />

                  </div>

                  <p className="text-gray-500 text-xs mt-2">
                    PKR {item.value.toLocaleString()}
                  </p>

                </div>
              );
            })}

          </div>

        </div>

        {/* ================= MONTHLY OVERVIEW ================= */}

        <div className="bg-zinc-900 border border-cyan-600 rounded-3xl p-6 mb-10">

          <div className="flex items-center gap-3 mb-6">

            <Calendar className="text-cyan-400" size={28} />

            <h2 className="text-3xl font-black text-cyan-400">
              Monthly Overview
            </h2>

          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">

            <div className="bg-black border border-green-600 rounded-2xl p-5 text-center">

              <p className="text-gray-400 text-sm">This Month Deposits</p>

              <h3 className="text-2xl font-black text-green-400 mt-3">
                PKR {filteredSummary.deposit.toLocaleString()}
              </h3>

            </div>

            <div className="bg-black border border-red-600 rounded-2xl p-5 text-center">

              <p className="text-gray-400 text-sm">This Month Withdrawals</p>

              <h3 className="text-2xl font-black text-red-400 mt-3">
                PKR {filteredSummary.withdraw.toLocaleString()}
              </h3>

            </div>

            <div className="bg-black border border-blue-600 rounded-2xl p-5 text-center">

              <p className="text-gray-400 text-sm">Gold Bought</p>

              <h3 className="text-2xl font-black text-blue-400 mt-3">
                PKR {filteredSummary.buy.toLocaleString()}
              </h3>

            </div>

            <div className="bg-black border border-orange-500 rounded-2xl p-5 text-center">

              <p className="text-gray-400 text-sm">Gold Sold</p>

              <h3 className="text-2xl font-black text-orange-400 mt-3">
                PKR {filteredSummary.sell.toLocaleString()}
              </h3>

            </div>

          </div>

        </div>

        {/* NEXT SECTION STARTS HERE */}// =====================================================
// GOLDTRADE V17 ENTERPRISE
// FILE: frontend/app/history/page.tsx
// SECTION 7/10
// RECENT ACTIVITY TIMELINE + DETAILS MODAL
// =====================================================

        {/* ================= RECENT ACTIVITY TIMELINE ================= */}

        <div className="bg-zinc-900 border border-purple-600 rounded-3xl p-6 mb-10">

          <div className="flex items-center gap-3 mb-6">
            <Clock className="text-purple-400" size={28} />
            <h2 className="text-3xl font-black text-purple-400">
              Recent Activity Timeline
            </h2>
          </div>

          <div className="space-y-5">

            {filteredTransactions.slice(0, 10).map((tx) => (
              <div
                key={tx._id}
                className="flex items-start gap-4 border-l-2 border-purple-500 pl-5 pb-5"
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    tx.type === "DEPOSIT"
                      ? "bg-green-500/20"
                      : tx.type === "WITHDRAW"
                      ? "bg-red-500/20"
                      : tx.type === "BUY"
                      ? "bg-blue-500/20"
                      : "bg-orange-500/20"
                  }`}
                >
                  {tx.type === "DEPOSIT" && (
                    <ArrowDownLeft className="text-green-400" size={18} />
                  )}

                  {tx.type === "WITHDRAW" && (
                    <ArrowUpRight className="text-red-400" size={18} />
                  )}

                  {tx.type === "BUY" && (
                    <Coins className="text-blue-400" size={18} />
                  )}

                  {tx.type === "SELL" && (
                    <Wallet className="text-orange-400" size={18} />
                  )}
                </div>

                <div className="flex-1">

                  <div className="flex justify-between items-center flex-wrap gap-2">

                    <h3 className={`font-bold ${getTypeColor(tx.type)}`}>
                      {tx.type} — {tx.method}
                    </h3>

                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(
                        tx.status
                      )}`}
                    >
                      {tx.status}
                    </span>

                  </div>

                  <p className="text-yellow-400 font-bold mt-2">
                    PKR {tx.amount.toLocaleString()}
                  </p>

                  {tx.goldQuantity && (
                    <p className="text-blue-400 text-sm mt-1">
                      Gold Quantity: {tx.goldQuantity.toFixed(4)} Gram
                    </p>
                  )}

                  <p className="text-gray-500 text-sm mt-2">
                    {formatDate(tx.createdAt)}
                  </p>

                </div>
              </div>
            ))}

          </div>

        </div>

        {/* ================= TRANSACTION DETAILS MODAL ================= */}

        {openDetails && selectedTransaction && (
          <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-6">

            <div className="bg-zinc-900 border border-yellow-500 rounded-3xl w-full max-w-2xl p-8">

              <div className="flex justify-between items-center mb-8">

                <h2 className="text-3xl font-black text-yellow-400">
                  Transaction Details
                </h2>

                <button
                  onClick={() => {
                    setOpenDetails(false);
                    setSelectedTransaction(null);
                  }}
                  className="bg-red-600 hover:bg-red-500 w-10 h-10 rounded-full flex items-center justify-center"
                >
                  ✕
                </button>

              </div>

              <div className="grid md:grid-cols-2 gap-5">

                <div className="bg-black border border-zinc-700 rounded-xl p-4">
                  <p className="text-gray-400 text-sm">Transaction Type</p>
                  <h3
                    className={`text-xl font-black mt-2 ${getTypeColor(
                      selectedTransaction.type
                    )}`}
                  >
                    {selectedTransaction.type}
                  </h3>
                </div>

                <div className="bg-black border border-zinc-700 rounded-xl p-4">
                  <p className="text-gray-400 text-sm">Payment Method</p>
                  <h3 className="text-xl font-black mt-2 text-white">
                    {selectedTransaction.method}
                  </h3>
                </div>

                <div className="bg-black border border-zinc-700 rounded-xl p-4">
                  <p className="text-gray-400 text-sm">Amount</p>
                  <h3 className="text-xl font-black mt-2 text-yellow-400">
                    PKR {selectedTransaction.amount.toLocaleString()}
                  </h3>
                </div>

                <div className="bg-black border border-zinc-700 rounded-xl p-4">
                  <p className="text-gray-400 text-sm">Status</p>

                  <span
                    className={`inline-block mt-2 px-3 py-2 rounded-full text-sm font-bold ${getStatusColor(
                      selectedTransaction.status
                    )}`}
                  >
                    {selectedTransaction.status}
                  </span>
                </div>

                <div className="bg-black border border-zinc-700 rounded-xl p-4">
                  <p className="text-gray-400 text-sm">Gold Quantity</p>
                  <h3 className="text-xl font-black mt-2 text-blue-400">
                    {selectedTransaction.goldQuantity
                      ? `${selectedTransaction.goldQuantity.toFixed(4)} Gram`
                      : "--"}
                  </h3>
                </div>

                <div className="bg-black border border-zinc-700 rounded-xl p-4">
                  <p className="text-gray-400 text-sm">Gold Price</p>
                  <h3 className="text-xl font-black mt-2 text-green-400">
                    {selectedTransaction.goldPrice
                      ? `PKR ${selectedTransaction.goldPrice.toLocaleString()}`
                      : "--"}
                  </h3>
                </div>

              </div>

              <div className="bg-black border border-cyan-600 rounded-2xl p-5 mt-6">

                <p className="text-gray-400 text-sm">Transaction Date</p>

                <h3 className="text-lg font-bold text-cyan-400 mt-2">
                  {formatDate(selectedTransaction.createdAt)}
                </h3>

                <p className="text-gray-400 text-sm mt-5">Transaction ID</p>

                <p className="text-white break-all font-mono text-sm mt-2">
                  {selectedTransaction._id}
                </p>

              </div>

              <button
                onClick={() => {
                  setOpenDetails(false);
                  setSelectedTransaction(null);
                }}
                className="w-full bg-yellow-500 hover:bg-yellow-400 text-black font-black py-4 rounded-2xl mt-8"
              >
                Close Details
              </button>

            </div>

          </div>
        )}

        {/* ================= NEXT SECTION STARTS HERE ================= */}// =====================================================
// GOLDTRADE V17 ENTERPRISE
// FILE: frontend/app/history/page.tsx
// SECTION 8/10
// MONTHLY PERFORMANCE + INSIGHTS + HISTORY STATS
// =====================================================

        {/* ================= MONTHLY PERFORMANCE ================= */}

        <div className="bg-zinc-900 border border-blue-600 rounded-3xl p-6 mb-10">

          <div className="flex items-center gap-3 mb-6">
            <TrendingUp className="text-blue-400" size={28} />

            <h2 className="text-3xl font-black text-blue-400">
              Monthly Performance
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">

            <div className="bg-black border border-green-600 rounded-2xl p-5 text-center">
              <ArrowDownLeft className="mx-auto text-green-400 mb-3" size={26} />

              <p className="text-gray-400 text-sm">Deposit Transactions</p>

              <h3 className="text-3xl font-black text-green-400 mt-2">
                {filteredTransactions.filter((tx) => tx.type === "DEPOSIT").length}
              </h3>
            </div>

            <div className="bg-black border border-red-600 rounded-2xl p-5 text-center">
              <ArrowUpRight className="mx-auto text-red-400 mb-3" size={26} />

              <p className="text-gray-400 text-sm">Withdraw Transactions</p>

              <h3 className="text-3xl font-black text-red-400 mt-2">
                {filteredTransactions.filter((tx) => tx.type === "WITHDRAW").length}
              </h3>
            </div>

            <div className="bg-black border border-blue-600 rounded-2xl p-5 text-center">
              <Coins className="mx-auto text-blue-400 mb-3" size={26} />

              <p className="text-gray-400 text-sm">Buy Orders</p>

              <h3 className="text-3xl font-black text-blue-400 mt-2">
                {filteredTransactions.filter((tx) => tx.type === "BUY").length}
              </h3>
            </div>

            <div className="bg-black border border-orange-500 rounded-2xl p-5 text-center">
              <Wallet className="mx-auto text-orange-400 mb-3" size={26} />

              <p className="text-gray-400 text-sm">Sell Orders</p>

              <h3 className="text-3xl font-black text-orange-400 mt-2">
                {filteredTransactions.filter((tx) => tx.type === "SELL").length}
              </h3>
            </div>

          </div>

        </div>

        {/* ================= HISTORY INSIGHTS ================= */}

        <div className="bg-zinc-900 border border-yellow-500 rounded-3xl p-6 mb-10">

          <div className="flex items-center gap-3 mb-6">
            <History className="text-yellow-400" size={28} />

            <h2 className="text-3xl font-black text-yellow-400">
              History Insights
            </h2>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">

            <div className="bg-black border border-green-600 rounded-2xl p-6">
              <p className="text-gray-400 text-sm">Largest Deposit</p>

              <h3 className="text-3xl font-black text-green-400 mt-3">
                PKR{" "}
                {Math.max(
                  ...filteredTransactions
                    .filter((tx) => tx.type === "DEPOSIT")
                    .map((tx) => tx.amount),
                  0
                ).toLocaleString()}
              </h3>

              <p className="text-green-300 text-sm mt-3">
                Highest approved deposit transaction.
              </p>
            </div>

            <div className="bg-black border border-red-600 rounded-2xl p-6">
              <p className="text-gray-400 text-sm">Largest Withdrawal</p>

              <h3 className="text-3xl font-black text-red-400 mt-3">
                PKR{" "}
                {Math.max(
                  ...filteredTransactions
                    .filter((tx) => tx.type === "WITHDRAW")
                    .map((tx) => tx.amount),
                  0
                ).toLocaleString()}
              </h3>

              <p className="text-red-300 text-sm mt-3">
                Highest approved withdrawal transaction.
              </p>
            </div>

            <div className="bg-black border border-blue-600 rounded-2xl p-6">
              <p className="text-gray-400 text-sm">Highest Gold Purchase</p>

              <h3 className="text-3xl font-black text-blue-400 mt-3">
                PKR{" "}
                {Math.max(
                  ...filteredTransactions
                    .filter((tx) => tx.type === "BUY")
                    .map((tx) => tx.amount),
                  0
                ).toLocaleString()}
              </h3>

              <p className="text-blue-300 text-sm mt-3">
                Biggest Gold Buy order.
              </p>
            </div>

          </div>

        </div>

        {/* ================= HISTORY SUMMARY TABLE ================= */}

        <div className="bg-zinc-900 border border-cyan-600 rounded-3xl p-6 mb-10">

          <div className="flex items-center gap-3 mb-6">
            <Filter className="text-cyan-400" size={28} />

            <h2 className="text-3xl font-black text-cyan-400">
              History Summary
            </h2>
          </div>

          <div className="overflow-x-auto">

            <table className="w-full">

              <thead className="bg-black text-cyan-400">
                <tr>
                  <th className="p-4 text-left">Category</th>
                  <th className="p-4 text-right">Transactions</th>
                  <th className="p-4 text-right">Amount (PKR)</th>
                </tr>
              </thead>

              <tbody>

                <tr className="border-b border-zinc-800">
                  <td className="p-4 text-green-400 font-semibold">Deposits</td>

                  <td className="p-4 text-right">
                    {filteredTransactions.filter((tx) => tx.type === "DEPOSIT").length}
                  </td>

                  <td className="p-4 text-right text-green-400 font-bold">
                    {filteredSummary.deposit.toLocaleString()}
                  </td>
                </tr>

                <tr className="border-b border-zinc-800">
                  <td className="p-4 text-red-400 font-semibold">Withdrawals</td>

                  <td className="p-4 text-right">
                    {filteredTransactions.filter((tx) => tx.type === "WITHDRAW").length}
                  </td>

                  <td className="p-4 text-right text-red-400 font-bold">
                    {filteredSummary.withdraw.toLocaleString()}
                  </td>
                </tr>

                <tr className="border-b border-zinc-800">
                  <td className="p-4 text-blue-400 font-semibold">Gold Buy</td>

                  <td className="p-4 text-right">
                    {filteredTransactions.filter((tx) => tx.type === "BUY").length}
                  </td>

                  <td className="p-4 text-right text-blue-400 font-bold">
                    {filteredSummary.buy.toLocaleString()}
                  </td>
                </tr>

                <tr>
                  <td className="p-4 text-orange-400 font-semibold">Gold Sell</td>

                  <td className="p-4 text-right">
                    {filteredTransactions.filter((tx) => tx.type === "SELL").length}
                  </td>

                  <td className="p-4 text-right text-orange-400 font-bold">
                    {filteredSummary.sell.toLocaleString()}
                  </td>
                </tr>

              </tbody>

            </table>

          </div>

        </div>

        {/* ================= HISTORY PERFORMANCE STRIP ================= */}

        <div className="bg-gradient-to-r from-yellow-900 via-black to-green-900 border border-yellow-500 rounded-3xl p-6 mb-10">

          <div className="grid md:grid-cols-4 gap-5 text-center">

            <div>
              <p className="text-gray-400 text-sm">Total Transactions</p>

              <h3 className="text-3xl font-black text-yellow-400 mt-2">
                {filteredTransactions.length}
              </h3>
            </div>

            <div>
              <p className="text-gray-400 text-sm">Approved</p>

              <h3 className="text-3xl font-black text-green-400 mt-2">
                {approvedCount}
              </h3>
            </div>

            <div>
              <p className="text-gray-400 text-sm">Pending</p>

              <h3 className="text-3xl font-black text-yellow-400 mt-2">
                {pendingCount}
              </h3>
            </div>

            <div>
              <p className="text-gray-400 text-sm">Rejected</p>

              <h3 className="text-3xl font-black text-red-400 mt-2">
                {rejectedCount}
              </h3>
            </div>

          </div>

        </div>

        {/* ================= NEXT SECTION STARTS HERE ================= */}// =====================================================
// GOLDTRADE V17 ENTERPRISE
// FILE: frontend/app/history/page.tsx
// SECTION 9/10
// EXPORT REPORTS + ACCOUNT ACTIVITY + USER INFORMATION
// =====================================================

        {/* ================= EXPORT REPORTS ================= */}

        <div className="bg-zinc-900 border border-yellow-500 rounded-3xl p-6 mb-10">

          <div className="flex items-center gap-3 mb-6">
            <Download className="text-yellow-400" size={28} />

            <h2 className="text-3xl font-black text-yellow-400">
              Export Transaction Reports
            </h2>
          </div>

          <p className="text-gray-400 mb-6">
            Download your complete GoldTrade transaction history for personal records.
          </p>

          <div className="grid md:grid-cols-3 gap-5">

            <button
              onClick={exportCSV}
              className="bg-green-600 hover:bg-green-500 rounded-2xl p-5 text-center font-bold transition"
            >
              <Download className="mx-auto mb-3" size={30} />
              Export CSV
            </button>

            <button
              className="bg-blue-600 hover:bg-blue-500 rounded-2xl p-5 text-center font-bold transition"
            >
              <Download className="mx-auto mb-3" size={30} />
              Export PDF
            </button>

            <button
              className="bg-purple-600 hover:bg-purple-500 rounded-2xl p-5 text-center font-bold transition"
            >
              <Download className="mx-auto mb-3" size={30} />
              Export Excel
            </button>

          </div>

        </div>

        {/* ================= ACCOUNT ACTIVITY SUMMARY ================= */}

        <div className="bg-zinc-900 border border-green-600 rounded-3xl p-6 mb-10">

          <div className="flex items-center gap-3 mb-6">
            <History className="text-green-400" size={28} />

            <h2 className="text-3xl font-black text-green-400">
              Account Activity Summary
            </h2>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">

            <div className="bg-black border border-green-600 rounded-2xl p-5">

              <p className="text-gray-400 text-sm">
                Total Transaction Records
              </p>

              <h3 className="text-4xl font-black text-green-400 mt-3">
                {summary.totalTransactions}
              </h3>

              <p className="text-green-300 text-sm mt-3">
                All deposit, withdrawal, buy and sell records combined.
              </p>

            </div>

            <div className="bg-black border border-yellow-500 rounded-2xl p-5">

              <p className="text-gray-400 text-sm">
                Filtered Results
              </p>

              <h3 className="text-4xl font-black text-yellow-400 mt-3">
                {filteredTransactions.length}
              </h3>

              <p className="text-yellow-300 text-sm mt-3">
                Transactions matching your current search and filters.
              </p>

            </div>

            <div className="bg-black border border-cyan-600 rounded-2xl p-5">

              <p className="text-gray-400 text-sm">
                Approved Transactions
              </p>

              <h3 className="text-4xl font-black text-cyan-400 mt-3">
                {approvedCount}
              </h3>

              <p className="text-cyan-300 text-sm mt-3">
                Successfully completed wallet activities.
              </p>

            </div>

            <div className="bg-black border border-red-600 rounded-2xl p-5">

              <p className="text-gray-400 text-sm">
                Pending / Rejected
              </p>

              <h3 className="text-4xl font-black text-red-400 mt-3">
                {pendingCount + rejectedCount}
              </h3>

              <p className="text-red-300 text-sm mt-3">
                Requests waiting for admin approval or rejected.
              </p>

            </div>

          </div>

        </div>

        {/* ================= USER INFORMATION ================= */}

        <div className="bg-zinc-900 border border-blue-600 rounded-3xl p-6 mb-10">

          <div className="flex items-center gap-3 mb-6">
            <Wallet className="text-blue-400" size={28} />

            <h2 className="text-3xl font-black text-blue-400">
              Transaction Information
            </h2>
          </div>

          <div className="space-y-4">

            <div className="bg-black border border-zinc-700 rounded-xl p-4">
              <h3 className="font-bold text-yellow-400 mb-2">
                Deposit Processing
              </h3>

              <p className="text-gray-400 text-sm">
                Every deposit request is manually verified by the GoldTrade Admin.
                Wallet balance is updated only after approval.
              </p>
            </div>

            <div className="bg-black border border-zinc-700 rounded-xl p-4">
              <h3 className="font-bold text-yellow-400 mb-2">
                Withdrawal Processing
              </h3>

              <p className="text-gray-400 text-sm">
                Withdrawals remain Pending until reviewed by the Admin.
                After approval, the wallet balance is deducted manually.
              </p>
            </div>

            <div className="bg-black border border-zinc-700 rounded-xl p-4">
              <h3 className="font-bold text-yellow-400 mb-2">
                Buy / Sell Gold
              </h3>

              <p className="text-gray-400 text-sm">
                Every Buy and Sell transaction is recorded permanently and cannot
                be deleted from history.
              </p>
            </div>

            <div className="bg-black border border-zinc-700 rounded-xl p-4">
              <h3 className="font-bold text-yellow-400 mb-2">
                Security Notice
              </h3>

              <p className="text-gray-400 text-sm">
                All transaction history is protected by JWT authentication.
                Only the logged-in user can access their own history.
              </p>
            </div>

          </div>

        </div>

        {/* ================= QUICK ACTION BUTTONS ================= */}

        <div className="grid md:grid-cols-3 gap-5 mb-10">

          <button
            onClick={loadHistory}
            className="bg-yellow-500 hover:bg-yellow-400 text-black rounded-2xl p-5 font-black transition flex items-center justify-center gap-3"
          >
            <RefreshCw size={22} />
            Refresh History
          </button>

          <button
            onClick={resetFilters}
            className="bg-zinc-800 hover:bg-zinc-700 rounded-2xl p-5 font-black transition flex items-center justify-center gap-3"
          >
            <Filter size={22} />
            Reset Filters
          </button>

          <button
            onClick={exportCSV}
            className="bg-green-600 hover:bg-green-500 rounded-2xl p-5 font-black transition flex items-center justify-center gap-3"
          >
            <Download size={22} />
            Download CSV
          </button>

        </div>

        {/* ================= NEXT SECTION STARTS HERE ================= */}// =====================================================
// GOLDTRADE V17 ENTERPRISE
// FILE: frontend/app/history/page.tsx
// SECTION 10/10
// FOOTER + FINAL SUMMARY + CLOSE COMPONENT
// =====================================================

        {/* ================= FINAL SUMMARY CARD ================= */}

        <div className="bg-gradient-to-r from-yellow-900 via-black to-yellow-900 border border-yellow-500 rounded-3xl p-8 mb-10">

          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-6">

            <div>

              <h2 className="text-4xl font-black text-yellow-400">
                GoldTrade History Dashboard
              </h2>

              <p className="text-gray-300 mt-3 max-w-2xl">
                All Deposit, Withdrawal, Gold Buy and Gold Sell records are stored
                securely in your GoldTrade account. Every transaction is protected
                and can only be viewed by the authenticated user.
              </p>

            </div>

            <div className="bg-black/50 border border-yellow-500 rounded-2xl p-5 min-w-[260px]">

              <p className="text-gray-400 text-sm mb-2">
                Filtered Transactions
              </p>

              <h3 className="text-4xl font-black text-yellow-400">
                {filteredTransactions.length}
              </h3>

              <p className="text-green-400 text-sm mt-3">
                Last Updated: {new Date().toLocaleString("en-PK")}
              </p>

            </div>

          </div>

        </div>

        {/* ================= HELP & SUPPORT ================= */}

        <div className="bg-zinc-900 border border-cyan-600 rounded-3xl p-6 mb-10">

          <div className="flex items-center gap-3 mb-5">

            <Wallet className="text-cyan-400" size={28} />

            <h2 className="text-3xl font-black text-cyan-400">
              Help & Support
            </h2>

          </div>

          <div className="space-y-4 text-gray-300">

            <div className="bg-black border border-zinc-700 rounded-xl p-4">
              <p className="font-semibold text-yellow-400 mb-2">
                Deposit Issue
              </p>

              <p className="text-sm">
                If your deposit is still pending after admin review time, contact
                GoldTrade support with your transaction ID.
              </p>
            </div>

            <div className="bg-black border border-zinc-700 rounded-xl p-4">
              <p className="font-semibold text-yellow-400 mb-2">
                Withdrawal Issue
              </p>

              <p className="text-sm">
                Withdrawal requests are processed manually by the admin. Status
                will change automatically after approval.
              </p>
            </div>

            <div className="bg-black border border-zinc-700 rounded-xl p-4">
              <p className="font-semibold text-yellow-400 mb-2">
                Trading Records
              </p>

              <p className="text-sm">
                Buy and Sell history cannot be edited or deleted. Every trade is
                permanently stored for security and auditing.
              </p>
            </div>

          </div>

        </div>

        {/* ================= FOOTER ================= */}

        <footer className="border-t border-zinc-800 pt-8 pb-4">

          <div className="grid md:grid-cols-3 gap-6">

            <div>

              <h3 className="text-2xl font-black text-yellow-400">
                GoldTrade V17 Enterprise
              </h3>

              <p className="text-gray-400 mt-2">
                Pakistan Digital Gold Trading Platform
              </p>

            </div>

            <div>

              <p className="text-gray-400 text-sm">
                Transaction History Module
              </p>

              <p className="text-white font-semibold mt-2">
                Deposit • Withdraw • Buy Gold • Sell Gold
              </p>

            </div>

            <div className="md:text-right">

              <p className="text-gray-400 text-sm">
                Security
              </p>

              <p className="text-green-400 font-semibold mt-2">
                JWT Protected • MongoDB Stored • Admin Verified
              </p>

            </div>

          </div>

          <div className="border-t border-zinc-800 mt-8 pt-5 text-center text-gray-500 text-sm">

            © 2026 GoldTrade Pakistan. All Rights Reserved.

          </div>

        </footer>

      </div>
    </main>
  );
}