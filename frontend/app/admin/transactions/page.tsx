"use client";

/* ==========================================================
   GoldTrade V18 Enterprise
   Admin Transaction Dashboard
========================================================== */

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import {
  ArrowLeft,
  RefreshCw,
  Search,
  CalendarRange,
  Wallet,
  Coins,
  DollarSign,
  ShieldCheck,
  CheckCircle,
  Clock,
  XCircle,
  ArrowDownLeft,
  ArrowUpRight,
  Activity,
} from "lucide-react";

const API =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://goldtrade-cky2.onrender.com";
  interface TransactionItem {
  _id: string;
  username: string;

  walletType: "PKR" | "GOLD" | "USDT";

  transactionType: string;

  transactionMode: "CREDIT" | "DEBIT";

  amount: number;

  balanceBefore: number;

  balanceAfter: number;

  paymentMethod?: string;

  note?: string;

  status: "Pending" | "Completed" | "Rejected" | "Failed";

  createdAt: string;
}

interface DashboardStats {
  overview: {
    totalTransactions: number;
    completedTransactions: number;
    pendingTransactions: number;
    rejectedTransactions: number;
    failedTransactions: number;
    last24Hours: number;
  };

  walletSummary: {
    PKR: {
      amount: number;
      count: number;
    };
    GOLD: {
      amount: number;
      count: number;
    };
    USDT: {
      amount: number;
      count: number;
    };
  };
}
export default function AdminTransactionsPage() {

  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("token") || ""
      : "";

  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  const [transactions, setTransactions] =
    useState<TransactionItem[]>([]);

  const [stats, setStats] =
    useState<DashboardStats | null>(null);

  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");

  const [walletFilter, setWalletFilter] =
    useState("ALL");

  const [statusFilter, setStatusFilter] =
    useState("ALL");

  const [typeFilter, setTypeFilter] =
    useState("ALL");

  const [message, setMessage] = useState("");

  const [messageType, setMessageType] =
    useState<"success" | "error">("success");
      // ===========================================
  // LOAD DASHBOARD
  // ===========================================

  const loadDashboard = async () => {
    try {
      setLoading(true);

      const [statsResponse, transactionsResponse] =
        await Promise.all([
          fetch(`${API}/api/transactions/admin/stats`, {
            headers,
          }),

          fetch(`${API}/api/transactions/admin`, {
            headers,
          }),
        ]);

      const statsData = await statsResponse.json();
      const transactionData =
        await transactionsResponse.json();

      if (
        !statsResponse.ok ||
        !statsData.success
      ) {
        throw new Error("Unable to load statistics.");
      }

      if (
        !transactionsResponse.ok ||
        !transactionData.success
      ) {
        throw new Error("Unable to load transactions.");
      }

      setStats(statsData);

      setTransactions(
        transactionData.transactions || []
      );
    } catch (error) {
      console.error(error);

      setMessageType("error");

      setMessage("Unable to connect Transaction API.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      loadDashboard();
    } else {
      setLoading(false);
    }
  }, []);
    const filteredTransactions = useMemo(() => {
    return transactions.filter((item) => {

      const searchMatch =
        item.username
          .toLowerCase()
          .includes(search.toLowerCase()) ||
        item.transactionType
          .toLowerCase()
          .includes(search.toLowerCase());

      const walletMatch =
        walletFilter === "ALL"
          ? true
          : item.walletType === walletFilter;

      const statusMatch =
        statusFilter === "ALL"
          ? true
          : item.status === statusFilter;

      const typeMatch =
        typeFilter === "ALL"
          ? true
          : item.transactionType === typeFilter;

      return (
        searchMatch &&
        walletMatch &&
        statusMatch &&
        typeMatch
      );
    });
  }, [
    transactions,
    search,
    walletFilter,
    statusFilter,
    typeFilter,
  ]);  // ==========================================================
  // LOADING SCREEN
  // ==========================================================

  if (loading) {
    return (
      <main className="min-h-screen bg-black flex items-center justify-center text-yellow-400 text-xl font-bold">
        <RefreshCw className="animate-spin mr-3" size={26} />
        Loading Transaction Dashboard...
      </main>
    );
  }

  // ==========================================================
  // PAGE START
  // ==========================================================

  return (
    <main className="min-h-screen bg-black text-white p-6">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* ===================================================== */}
        {/* HEADER */}
        {/* ===================================================== */}

        <header className="flex flex-wrap justify-between items-center gap-4">

          <div>

            <h1 className="flex items-center gap-3 text-4xl font-black text-yellow-400">
              <ShieldCheck size={38} />
              Transaction Audit Dashboard
            </h1>

            <p className="text-gray-400 mt-2">
              Enterprise ledger analytics for PKR, Gold and USDT transactions.
            </p>

          </div>

          <div className="flex gap-3">

            <Link
              href="/admin-dashboard"
              className="bg-zinc-800 hover:bg-zinc-700 px-5 py-3 rounded-xl flex items-center gap-2 font-bold"
            >
              <ArrowLeft size={18} />
              Dashboard
            </Link>

            <button
              type="button"
              onClick={loadDashboard}
              className="bg-yellow-500 hover:bg-yellow-400 text-black px-5 py-3 rounded-xl flex items-center gap-2 font-bold transition"
            >
              <RefreshCw size={18} />
              Refresh
            </button>

          </div>

        </header>

        {/* ===================================================== */}
        {/* MESSAGE */}
        {/* ===================================================== */}

        {message && (
          <div
            className={`rounded-xl px-4 py-3 font-semibold ${
              messageType === "success"
                ? "bg-green-600/20 border border-green-500 text-green-400"
                : "bg-red-600/20 border border-red-500 text-red-400"
            }`}
          >
            {message}
          </div>
        )}

        {/* ===================================================== */}
        {/* ENTERPRISE ANALYTICS CARDS */}
        {/* ===================================================== */}

        <section className="grid md:grid-cols-2 xl:grid-cols-4 gap-5">

          {/* TOTAL TRANSACTIONS */}

          <div className="bg-zinc-900 border border-cyan-500 rounded-2xl p-5">

            <div className="flex justify-between items-center">

              <p className="text-gray-400 text-sm">
                Total Transactions
              </p>

              <Activity className="text-cyan-400" size={22} />

            </div>

            <h2 className="text-3xl font-black text-cyan-400 mt-3">
              {stats?.overview.totalTransactions ?? 0}
            </h2>

            <p className="text-xs text-gray-500 mt-2">
              Complete enterprise ledger records.
            </p>

          </div>

          {/* COMPLETED */}

          <div className="bg-zinc-900 border border-green-500 rounded-2xl p-5">

            <div className="flex justify-between items-center">

              <p className="text-gray-400 text-sm">
                Completed
              </p>

              <CheckCircle className="text-green-400" size={22} />

            </div>

            <h2 className="text-3xl font-black text-green-400 mt-3">
              {stats?.overview.completedTransactions ?? 0}
            </h2>

            <p className="text-xs text-gray-500 mt-2">
              Successfully processed transactions.
            </p>

          </div>

          {/* PENDING */}

          <div className="bg-zinc-900 border border-yellow-500 rounded-2xl p-5">

            <div className="flex justify-between items-center">

              <p className="text-gray-400 text-sm">
                Pending
              </p>

              <Clock className="text-yellow-400" size={22} />

            </div>

            <h2 className="text-3xl font-black text-yellow-400 mt-3">
              {stats?.overview.pendingTransactions ?? 0}
            </h2>

            <p className="text-xs text-gray-500 mt-2">
              Waiting for admin verification.
            </p>

          </div>

          {/* REJECTED */}

          <div className="bg-zinc-900 border border-red-500 rounded-2xl p-5">

            <div className="flex justify-between items-center">

              <p className="text-gray-400 text-sm">
                Rejected
              </p>

              <XCircle className="text-red-400" size={22} />

            </div>

            <h2 className="text-3xl font-black text-red-400 mt-3">
              {stats?.overview.rejectedTransactions ?? 0}
            </h2>

            <p className="text-xs text-gray-500 mt-2">
              Requests rejected by administrator.
            </p>

          </div>

        </section>

        {/* ===================================================== */}
        {/* WALLET ANALYTICS */}
        {/* ===================================================== */}

        <section className="grid md:grid-cols-2 xl:grid-cols-4 gap-5">

          {/* PKR */}

          <div className="bg-zinc-900 border border-green-600 rounded-2xl p-5">

            <div className="flex justify-between items-center">

              <Wallet className="text-green-400" size={22} />

              <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full font-semibold">
                PKR
              </span>

            </div>

            <p className="text-gray-400 text-sm mt-3">
              PKR Volume
            </p>

            <h2 className="text-2xl font-black text-green-400 mt-2">
              PKR {Number(stats?.walletSummary.PKR.amount ?? 0).toLocaleString()}
            </h2>

            <p className="text-xs text-gray-500 mt-2">
              {stats?.walletSummary.PKR.count ?? 0} transactions
            </p>

          </div>

          {/* GOLD */}

          <div className="bg-zinc-900 border border-yellow-600 rounded-2xl p-5">

            <div className="flex justify-between items-center">

              <Coins className="text-yellow-400" size={22} />

              <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded-full font-semibold">
                GOLD
              </span>

            </div>

            <p className="text-gray-400 text-sm mt-3">
              Gold Volume
            </p>

            <h2 className="text-2xl font-black text-yellow-400 mt-2">
              {Number(stats?.walletSummary.GOLD.amount ?? 0).toFixed(2)} g
            </h2>

            <p className="text-xs text-gray-500 mt-2">
              {stats?.walletSummary.GOLD.count ?? 0} transactions
            </p>

          </div>

          {/* USDT */}

          <div className="bg-zinc-900 border border-blue-600 rounded-2xl p-5">

            <div className="flex justify-between items-center">

              <DollarSign className="text-blue-400" size={22} />

              <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded-full font-semibold">
                USDT
              </span>

            </div>

            <p className="text-gray-400 text-sm mt-3">
              USDT Volume
            </p>

            <h2 className="text-2xl font-black text-blue-400 mt-2">
              {Number(stats?.walletSummary.USDT.amount ?? 0).toFixed(2)} USDT
            </h2>

            <p className="text-xs text-gray-500 mt-2">
              {stats?.walletSummary.USDT.count ?? 0} transactions
            </p>

          </div>

          {/* LAST 24 HOURS */}

          <div className="bg-zinc-900 border border-purple-600 rounded-2xl p-5">

            <div className="flex justify-between items-center">

              <CalendarRange className="text-purple-400" size={22} />

              <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-1 rounded-full font-semibold">
                LIVE
              </span>

            </div>

            <p className="text-gray-400 text-sm mt-3">
              Last 24 Hours
            </p>

            <h2 className="text-3xl font-black text-purple-400 mt-2">
              {stats?.overview.last24Hours ?? 0}
            </h2>

            <p className="text-xs text-gray-500 mt-2">
              Transactions in the last 24 hours.
            </p>

          </div>

        </section>
                <section className="bg-zinc-900 border border-yellow-500 rounded-2xl p-6">

          <div className="flex items-center gap-3 mb-6">

            <Search className="text-yellow-400" size={24} />

            <h2 className="text-2xl font-black text-yellow-400">
              Transaction Filters
            </h2>

          </div>

          <div className="grid lg:grid-cols-2 xl:grid-cols-4 gap-4">

            {/* SEARCH USERNAME */}

            <div className="relative">

              <Search
                className="absolute left-3 top-3 text-gray-500"
                size={18}
              />

              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search username..."
                className="w-full bg-black border border-zinc-700 rounded-xl pl-10 pr-4 py-3 outline-none focus:border-yellow-500"
              />

            </div>

            {/* WALLET FILTER */}

            <select
              value={walletFilter}
              onChange={(e) => setWalletFilter(e.target.value)}
              className="bg-black border border-zinc-700 rounded-xl px-4 py-3 outline-none focus:border-yellow-500"
            >
              <option value="ALL">All Wallets</option>

              <option value="PKR">PKR Wallet</option>

              <option value="GOLD">Gold Wallet</option>

              <option value="USDT">USDT Wallet</option>

            </select>

            {/* STATUS FILTER */}

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-black border border-zinc-700 rounded-xl px-4 py-3 outline-none focus:border-yellow-500"
            >
              <option value="ALL">All Status</option>

              <option value="Completed">Completed</option>

              <option value="Pending">Pending</option>

              <option value="Rejected">Rejected</option>

              <option value="Failed">Failed</option>

            </select>

            {/* TRANSACTION TYPE */}

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="bg-black border border-zinc-700 rounded-xl px-4 py-3 outline-none focus:border-yellow-500"
            >
              <option value="ALL">All Transactions</option>

              <option value="DEPOSIT_REQUEST">Deposit Request</option>

              <option value="DEPOSIT_APPROVED">Deposit Approved</option>

              <option value="DEPOSIT_REJECTED">Deposit Rejected</option>

              <option value="WITHDRAW_REQUEST">Withdraw Request</option>

              <option value="WITHDRAW_APPROVED">Withdraw Approved</option>

              <option value="WITHDRAW_REJECTED">Withdraw Rejected</option>

              <option value="BUY_GOLD">Buy Gold</option>

              <option value="SELL_GOLD">Sell Gold</option>

              <option value="BUY_USDT">Buy USDT</option>

              <option value="SELL_USDT">Sell USDT</option>

              <option value="ADMIN_CREDIT">Admin Credit</option>

              <option value="ADMIN_DEBIT">Admin Debit</option>

            </select>

          </div>

          {/* ===================================================== */}
          {/* DATE RANGE FILTER */}
          {/* ===================================================== */}

          <div className="grid md:grid-cols-2 gap-4 mt-5">

            <div>

              <label className="block text-gray-400 text-sm mb-2">
                From Date
              </label>

              <input
                type="date"
                className="w-full bg-black border border-zinc-700 rounded-xl px-4 py-3 outline-none focus:border-yellow-500"
              />

            </div>

            <div>

              <label className="block text-gray-400 text-sm mb-2">
                To Date
              </label>

              <input
                type="date"
                className="w-full bg-black border border-zinc-700 rounded-xl px-4 py-3 outline-none focus:border-yellow-500"
              />

            </div>

          </div>

          {/* ===================================================== */}
          {/* FILTER SUMMARY */}
          {/* ===================================================== */}

          <div className="grid md:grid-cols-4 gap-4 mt-6">

            <div className="bg-black rounded-xl p-4 border border-cyan-600">

              <p className="text-gray-500 text-xs">
                Filtered Records
              </p>

              <h3 className="text-2xl font-black text-cyan-400 mt-2">
                {filteredTransactions.length}
              </h3>

            </div>

            <div className="bg-black rounded-xl p-4 border border-green-600">

              <p className="text-gray-500 text-xs">
                Credits
              </p>

              <h3 className="text-2xl font-black text-green-400 mt-2">
                {
                  filteredTransactions.filter(
                    (item) => item.transactionMode === "CREDIT"
                  ).length
                }
              </h3>

            </div>

            <div className="bg-black rounded-xl p-4 border border-red-600">

              <p className="text-gray-500 text-xs">
                Debits
              </p>

              <h3 className="text-2xl font-black text-red-400 mt-2">
                {
                  filteredTransactions.filter(
                    (item) => item.transactionMode === "DEBIT"
                  ).length
                }
              </h3>

            </div>

            <div className="bg-black rounded-xl p-4 border border-yellow-600">

              <p className="text-gray-500 text-xs">
                Pending
              </p>

              <h3 className="text-2xl font-black text-yellow-400 mt-2">
                {
                  filteredTransactions.filter(
                    (item) => item.status === "Pending"
                  ).length
                }
              </h3>

            </div>

          </div>

          {/* ===================================================== */}
          {/* RESET FILTERS */}
          {/* ===================================================== */}

          <div className="mt-6 flex justify-end">

            <button
              type="button"
              onClick={() => {
                setSearch("");
                setWalletFilter("ALL");
                setStatusFilter("ALL");
                setTypeFilter("ALL");
              }}
              className="bg-red-600 hover:bg-red-500 px-6 py-3 rounded-xl font-bold transition"
            >
              Reset Filters
            </button>

          </div>

        </section>        <section className="bg-zinc-900 border border-cyan-500 rounded-2xl p-6">

          <div className="flex flex-wrap justify-between items-center gap-3 mb-6">

            <div>

              <h2 className="text-2xl font-black text-cyan-400">
                Enterprise Transaction Ledger
              </h2>

              <p className="text-sm text-gray-500 mt-1">
                Complete audit history of all user transactions.
              </p>

            </div>

            <div className="bg-black border border-zinc-700 rounded-xl px-4 py-2">

              <p className="text-xs text-gray-500">Showing</p>

              <p className="text-cyan-400 font-bold">
                {filteredTransactions.length} Records
              </p>

            </div>

          </div>

          {filteredTransactions.length === 0 ? (

            <div className="text-center py-12 text-gray-500">
              No transaction records found.
            </div>

          ) : (

            <div className="overflow-x-auto rounded-xl border border-zinc-700">

              <table className="w-full min-w-[1450px] text-sm">

                {/* ======================================= */}
                {/* TABLE HEADER */}
                {/* ======================================= */}

                <thead className="bg-black sticky top-0">

                  <tr className="text-cyan-400 border-b border-zinc-700">

                    <th className="p-4 text-left">User</th>

                    <th className="p-4 text-left">Wallet</th>

                    <th className="p-4 text-left">Transaction</th>

                    <th className="p-4 text-left">Mode</th>

                    <th className="p-4 text-left">Amount</th>

                    <th className="p-4 text-left">Balance Before</th>

                    <th className="p-4 text-left">Balance After</th>

                    <th className="p-4 text-left">Payment Method</th>

                    <th className="p-4 text-left">Status</th>

                    <th className="p-4 text-left">Date</th>

                  </tr>

                </thead>

                {/* ======================================= */}
                {/* TABLE BODY */}
                {/* ======================================= */}

                <tbody>

                  {filteredTransactions.map((item) => (

                    <tr
                      key={item._id}
                      className="border-b border-zinc-800 hover:bg-zinc-800 transition-all"
                    >

                      {/* =================================== */}
                      {/* USER */}
                      {/* =================================== */}

                      <td className="p-4">

                        <div>

                          <p className="font-bold text-yellow-400">
                            {item.username}
                          </p>

                          <p className="text-xs text-gray-500">
                            {item._id.slice(-8).toUpperCase()}
                          </p>

                        </div>

                      </td>

                      {/* =================================== */}
                      {/* WALLET */}
                      {/* =================================== */}

                      <td className="p-4">

                        <div className="flex items-center gap-2">

                          {item.walletType === "PKR" && (
                            <Wallet
                              size={18}
                              className="text-green-400"
                            />
                          )}

                          {item.walletType === "GOLD" && (
                            <Coins
                              size={18}
                              className="text-yellow-400"
                            />
                          )}

                          {item.walletType === "USDT" && (
                            <DollarSign
                              size={18}
                              className="text-blue-400"
                            />
                          )}

                          <span className="font-semibold">
                            {item.walletType}
                          </span>

                        </div>

                      </td>

                      {/* =================================== */}
                      {/* TRANSACTION TYPE */}
                      {/* =================================== */}

                      <td className="p-4">

                        <span className="bg-yellow-500/20 text-yellow-400 px-3 py-1 rounded-full text-xs font-bold">

                          {item.transactionType.replaceAll("_", " ")}

                        </span>

                        {item.note && (
                          <p className="text-xs text-gray-500 mt-2">
                            {item.note}
                          </p>
                        )}

                      </td>

                      {/* =================================== */}
                      {/* CREDIT / DEBIT */}
                      {/* =================================== */}

                      <td className="p-4">

                        {item.transactionMode === "CREDIT" ? (

                          <span className="inline-flex items-center gap-2 bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-xs font-bold">

                            <ArrowDownLeft size={14} />

                            CREDIT

                          </span>

                        ) : (

                          <span className="inline-flex items-center gap-2 bg-red-500/20 text-red-400 px-3 py-1 rounded-full text-xs font-bold">

                            <ArrowUpRight size={14} />

                            DEBIT

                          </span>

                        )}

                      </td>

                      {/* =================================== */}
                      {/* AMOUNT */}
                      {/* =================================== */}

                      <td className="p-4 font-bold">

                        {item.walletType === "PKR" && (
                          <span className="text-green-400">
                            PKR {Number(item.amount).toLocaleString()}
                          </span>
                        )}

                        {item.walletType === "GOLD" && (
                          <span className="text-yellow-400">
                            {Number(item.amount).toFixed(2)} g
                          </span>
                        )}

                        {item.walletType === "USDT" && (
                          <span className="text-blue-400">
                            {Number(item.amount).toFixed(2)} USDT
                          </span>
                        )}

                      </td>

                      {/* =================================== */}
                      {/* BALANCE BEFORE */}
                      {/* =================================== */}

                      <td className="p-4 text-gray-300">

                        {item.walletType === "PKR"
                          ? `PKR ${Number(item.balanceBefore).toLocaleString()}`
                          : item.walletType === "GOLD"
                          ? `${Number(item.balanceBefore).toFixed(2)} g`
                          : `${Number(item.balanceBefore).toFixed(2)} USDT`}

                      </td>

                      {/* =================================== */}
                      {/* BALANCE AFTER */}
                      {/* =================================== */}

                      <td className="p-4 text-green-400 font-semibold">

                        {item.walletType === "PKR"
                          ? `PKR ${Number(item.balanceAfter).toLocaleString()}`
                          : item.walletType === "GOLD"
                          ? `${Number(item.balanceAfter).toFixed(2)} g`
                          : `${Number(item.balanceAfter).toFixed(2)} USDT`}

                      </td>

                      {/* =================================== */}
                      {/* PAYMENT METHOD */}
                      {/* =================================== */}

                      <td className="p-4">

                        <div>

                          <p className="text-white font-medium">

                            {item.paymentMethod || "GoldTrade"}

                          </p>

                          <p className="text-xs text-gray-500 mt-1">

                            {item.note || "Enterprise Ledger Record"}

                          </p>

                        </div>

                      </td>

                      {/* =================================== */}
                      {/* STATUS */}
                      {/* =================================== */}

                      <td className="p-4">

                        {item.status === "Completed" && (
                          <span className="inline-flex items-center gap-2 bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-xs font-bold">
                            <CheckCircle size={14} />
                            Completed
                          </span>
                        )}

                        {item.status === "Pending" && (
                          <span className="inline-flex items-center gap-2 bg-yellow-500/20 text-yellow-400 px-3 py-1 rounded-full text-xs font-bold">
                            <Clock size={14} />
                            Pending
                          </span>
                        )}

                        {item.status === "Rejected" && (
                          <span className="inline-flex items-center gap-2 bg-red-500/20 text-red-400 px-3 py-1 rounded-full text-xs font-bold">
                            <XCircle size={14} />
                            Rejected
                          </span>
                        )}

                        {item.status === "Failed" && (
                          <span className="inline-flex items-center gap-2 bg-red-700/20 text-red-500 px-3 py-1 rounded-full text-xs font-bold">
                            <XCircle size={14} />
                            Failed
                          </span>
                        )}

                      </td>

                      {/* =================================== */}
                      {/* DATE */}
                      {/* =================================== */}

                      <td className="p-4 whitespace-nowrap">

                        <div className="text-gray-300 text-sm">

                          {new Date(item.createdAt).toLocaleDateString()}

                        </div>

                        <div className="text-xs text-gray-500 mt-1">

                          {new Date(item.createdAt).toLocaleTimeString()}

                        </div>

                      </td>

                    </tr>

                  ))}

                </tbody>

              </table>

            </div>

          )}

        </section>
                <section className="lg:hidden space-y-5">

          <div className="flex items-center gap-3">

            <ShieldCheck className="text-cyan-400" size={24} />

            <h2 className="text-2xl font-black text-cyan-400">
              Mobile Audit Ledger
            </h2>

          </div>

          {filteredTransactions.length === 0 ? (

            <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-8 text-center text-gray-500">
              No transactions available.
            </div>

          ) : (

            filteredTransactions.map((item) => (

              <div
                key={`mobile-${item._id}`}
                className="bg-zinc-900 border border-zinc-700 rounded-2xl p-5 space-y-4"
              >

                {/* =========================================== */}
                {/* USER HEADER */}
                {/* =========================================== */}

                <div className="flex justify-between items-start">

                  <div>

                    <p className="text-lg font-black text-yellow-400">
                      {item.username}
                    </p>

                    <p className="text-xs text-gray-500">
                      ID : {item._id.slice(-8).toUpperCase()}
                    </p>

                  </div>

                  {item.status === "Completed" && (
                    <span className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-xs font-bold">
                      Completed
                    </span>
                  )}

                  {item.status === "Pending" && (
                    <span className="bg-yellow-500/20 text-yellow-400 px-3 py-1 rounded-full text-xs font-bold">
                      Pending
                    </span>
                  )}

                  {item.status === "Rejected" && (
                    <span className="bg-red-500/20 text-red-400 px-3 py-1 rounded-full text-xs font-bold">
                      Rejected
                    </span>
                  )}

                  {item.status === "Failed" && (
                    <span className="bg-red-700/20 text-red-500 px-3 py-1 rounded-full text-xs font-bold">
                      Failed
                    </span>
                  )}

                </div>

                {/* =========================================== */}
                {/* WALLET + MODE */}
                {/* =========================================== */}

                <div className="flex justify-between items-center bg-black rounded-xl p-4">

                  <div className="flex items-center gap-3">

                    {item.walletType === "PKR" && (
                      <Wallet className="text-green-400" size={22} />
                    )}

                    {item.walletType === "GOLD" && (
                      <Coins className="text-yellow-400" size={22} />
                    )}

                    {item.walletType === "USDT" && (
                      <DollarSign className="text-blue-400" size={22} />
                    )}

                    <div>

                      <p className="font-bold">
                        {item.walletType} Wallet
                      </p>

                      <p className="text-xs text-gray-500">
                        {item.transactionType.replaceAll("_", " ")}
                      </p>

                    </div>

                  </div>

                  {item.transactionMode === "CREDIT" ? (

                    <span className="flex items-center gap-2 text-green-400 font-bold text-sm">
                      <ArrowDownLeft size={16} />
                      CREDIT
                    </span>

                  ) : (

                    <span className="flex items-center gap-2 text-red-400 font-bold text-sm">
                      <ArrowUpRight size={16} />
                      DEBIT
                    </span>

                  )}

                </div>

                {/* =========================================== */}
                {/* AMOUNT */}
                {/* =========================================== */}

                <div className="bg-zinc-800 rounded-xl p-4">

                  <p className="text-xs text-gray-500 mb-2">
                    Transaction Amount
                  </p>

                  <h2
                    className={`text-2xl font-black ${
                      item.transactionMode === "CREDIT"
                        ? "text-green-400"
                        : "text-red-400"
                    }`}
                  >
                    {item.walletType === "PKR"
                      ? `PKR ${Number(item.amount).toLocaleString()}`
                      : item.walletType === "GOLD"
                      ? `${Number(item.amount).toFixed(2)} g`
                      : `${Number(item.amount).toFixed(2)} USDT`}
                  </h2>

                </div>

                {/* =========================================== */}
                {/* BALANCE SUMMARY */}
                {/* =========================================== */}

                <div className="grid grid-cols-2 gap-3">

                  <div className="bg-black rounded-xl p-3">

                    <p className="text-xs text-gray-500">
                      Before
                    </p>

                    <p className="font-bold text-white mt-1">

                      {item.walletType === "PKR"
                        ? `PKR ${Number(item.balanceBefore).toLocaleString()}`
                        : item.walletType === "GOLD"
                        ? `${Number(item.balanceBefore).toFixed(2)} g`
                        : `${Number(item.balanceBefore).toFixed(2)} USDT`}

                    </p>

                  </div>

                  <div className="bg-black rounded-xl p-3">

                    <p className="text-xs text-gray-500">
                      After
                    </p>

                    <p className="font-bold text-green-400 mt-1">

                      {item.walletType === "PKR"
                        ? `PKR ${Number(item.balanceAfter).toLocaleString()}`
                        : item.walletType === "GOLD"
                        ? `${Number(item.balanceAfter).toFixed(2)} g`
                        : `${Number(item.balanceAfter).toFixed(2)} USDT`}

                    </p>

                  </div>

                </div>

                {/* =========================================== */}
                {/* PAYMENT METHOD */}
                {/* =========================================== */}

                <div className="bg-black rounded-xl p-4 space-y-3">

                  <div className="flex justify-between">

                    <span className="text-gray-500 text-sm">
                      Payment Method
                    </span>

                    <span className="font-semibold text-white">
                      {item.paymentMethod || "GoldTrade"}
                    </span>

                  </div>

                  <div className="flex justify-between">

                    <span className="text-gray-500 text-sm">
                      Transaction Type
                    </span>

                    <span className="font-semibold text-yellow-400 text-right">
                      {item.transactionType.replaceAll("_", " ")}
                    </span>

                  </div>

                  {item.note && (

                    <div>

                      <p className="text-gray-500 text-sm mb-1">
                        Admin Note
                      </p>

                      <p className="text-gray-300 text-sm">
                        {item.note}
                      </p>

                    </div>

                  )}

                </div>

                {/* =========================================== */}
                {/* DATE */}
                {/* =========================================== */}

                <div className="flex justify-between items-center border-t border-zinc-800 pt-3 text-sm">

                  <div className="flex items-center gap-2 text-gray-500">

                    <Clock size={15} />

                    {new Date(item.createdAt).toLocaleDateString()}

                  </div>

                  <span className="text-gray-400">
                    {new Date(item.createdAt).toLocaleTimeString()}
                  </span>

                </div>

              </div>

            ))

          )}

        </section>
                <section className="bg-zinc-900 border border-purple-600 rounded-2xl p-6">

          <h2 className="text-2xl font-black text-purple-400 mb-6">
            Enterprise Audit Summary
          </h2>

          <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">

            <div className="bg-black border border-cyan-700 rounded-xl p-4">
              <p className="text-xs text-gray-500">Filtered Records</p>
              <h3 className="text-3xl font-black text-cyan-400 mt-2">
                {filteredTransactions.length}
              </h3>
            </div>

            <div className="bg-black border border-green-700 rounded-xl p-4">
              <p className="text-xs text-gray-500">Credit Transactions</p>
              <h3 className="text-3xl font-black text-green-400 mt-2">
                {
                  filteredTransactions.filter(
                    (item) => item.transactionMode === "CREDIT"
                  ).length
                }
              </h3>
            </div>

            <div className="bg-black border border-red-700 rounded-xl p-4">
              <p className="text-xs text-gray-500">Debit Transactions</p>
              <h3 className="text-3xl font-black text-red-400 mt-2">
                {
                  filteredTransactions.filter(
                    (item) => item.transactionMode === "DEBIT"
                  ).length
                }
              </h3>
            </div>

            <div className="bg-black border border-yellow-700 rounded-xl p-4">
              <p className="text-xs text-gray-500">Pending Approval</p>
              <h3 className="text-3xl font-black text-yellow-400 mt-2">
                {
                  filteredTransactions.filter(
                    (item) => item.status === "Pending"
                  ).length
                }
              </h3>
            </div>

          </div>

        </section>

        {/* ===================================================== */}
        {/* SECURITY & AUDIT POLICY */}
        {/* ===================================================== */}

        <section className="bg-zinc-900 border border-red-600 rounded-2xl p-6">

          <div className="flex items-center gap-3 mb-6">

            <ShieldCheck className="text-red-400" size={28} />

            <h2 className="text-2xl font-black text-red-400">
              Enterprise Security & Audit Policy
            </h2>

          </div>

          <div className="space-y-4 text-gray-300">

            <div className="flex gap-3 items-start">
              <CheckCircle className="text-green-400 mt-1" size={18} />
              <p>
                Every PKR, GOLD and USDT transaction is permanently stored in the Enterprise Audit Ledger.
              </p>
            </div>

            <div className="flex gap-3 items-start">
              <CheckCircle className="text-green-400 mt-1" size={18} />
              <p>
                Deposit approvals and withdrawal approvals automatically generate transaction records.
              </p>
            </div>

            <div className="flex gap-3 items-start">
              <CheckCircle className="text-green-400 mt-1" size={18} />
              <p>
                Admin wallet credit and debit actions are logged with amount, wallet type and timestamp.
              </p>
            </div>

            <div className="flex gap-3 items-start">
              <CheckCircle className="text-green-400 mt-1" size={18} />
              <p>
                This dashboard is an audit ledger only. Wallet balances cannot be edited here.
              </p>
            </div>

            <div className="flex gap-3 items-start">
              <CheckCircle className="text-green-400 mt-1" size={18} />
              <p>
                Every audit entry includes wallet type, transaction mode, balances before/after, payment method and status.
              </p>
            </div>

            <div className="flex gap-3 items-start">
              <CheckCircle className="text-green-400 mt-1" size={18} />
              <p>
                Transaction history remains available for compliance reports and future exports.
              </p>
            </div>

          </div>

        </section>

        {/* ===================================================== */}
        {/* TRANSACTION STATUS GUIDE */}
        {/* ===================================================== */}

        <section className="bg-zinc-900 border border-cyan-600 rounded-2xl p-6">

          <h2 className="text-2xl font-black text-cyan-400 mb-5">
            Transaction Status Guide
          </h2>

          <div className="grid md:grid-cols-2 gap-4">

            <div className="bg-black border border-green-700 rounded-xl p-4">
              <div className="flex items-center gap-2 text-green-400 font-bold">
                <CheckCircle size={18} />
                Completed
              </div>

              <p className="text-sm text-gray-400 mt-2">
                Successfully processed and reflected in the user's wallet.
              </p>
            </div>

            <div className="bg-black border border-yellow-700 rounded-xl p-4">
              <div className="flex items-center gap-2 text-yellow-400 font-bold">
                <Clock size={18} />
                Pending
              </div>

              <p className="text-sm text-gray-400 mt-2">
                Waiting for administrator approval or processing.
              </p>
            </div>

            <div className="bg-black border border-red-700 rounded-xl p-4">
              <div className="flex items-center gap-2 text-red-400 font-bold">
                <XCircle size={18} />
                Rejected
              </div>

              <p className="text-sm text-gray-400 mt-2">
                Request rejected by administrator.
              </p>
            </div>

            <div className="bg-black border border-red-900 rounded-xl p-4">
              <div className="flex items-center gap-2 text-red-500 font-bold">
                <XCircle size={18} />
                Failed
              </div>

              <p className="text-sm text-gray-400 mt-2">
                Validation or processing error prevented completion.
              </p>
            </div>

          </div>

        </section>

        {/* ===================================================== */}
        {/* GOLDTRADE ENTERPRISE FOOTER */}
        {/* ===================================================== */}

        <footer className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 text-center">

          <h3 className="text-yellow-400 font-black text-2xl">
            GoldTrade V18 Enterprise
          </h3>

          <p className="text-gray-400 mt-2">
            Admin Transaction Audit Dashboard
          </p>

          <div className="flex flex-wrap justify-center gap-3 mt-5">

            <span className="bg-green-500/20 text-green-400 px-4 py-2 rounded-full text-sm font-semibold">
              PKR Ledger
            </span>

            <span className="bg-yellow-500/20 text-yellow-400 px-4 py-2 rounded-full text-sm font-semibold">
              Gold Ledger
            </span>

            <span className="bg-blue-500/20 text-blue-400 px-4 py-2 rounded-full text-sm font-semibold">
              USDT Ledger
            </span>

            <span className="bg-purple-500/20 text-purple-400 px-4 py-2 rounded-full text-sm font-semibold">
              Enterprise Audit
            </span>

          </div>

          <div className="border-t border-zinc-800 mt-6 pt-6">

            <p className="text-gray-500 text-sm">
              GoldTrade Enterprise Admin Panel • Secure • Auditable • Linux Safe • Render Ready
            </p>

            <p className="text-gray-600 text-xs mt-2">
              Version 18 Enterprise • Transaction Audit Manager
            </p>

          </div>

        </footer>

      </div>
    </main>
  );
}