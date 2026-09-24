"use client";

// =====================================================
// GoldTrade V18 Enterprise
// ADMIN TRANSACTIONS MANAGER
// PART 1/6
// Production Version
// =====================================================

import { useEffect, useMemo, useState } from "react";

import {
  ArrowDownCircle,
  ArrowUpCircle,
  Wallet,
  DollarSign,
  Coins,
  Search,
  RefreshCw,
  Filter,
  Calendar,
  Shield,
  History,
  User,
  CheckCircle,
  Clock,
  XCircle,
  MinusCircle,
  PlusCircle,
} from "lucide-react";

// =====================================================
// API URL
// =====================================================

const API =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

// =====================================================
// TYPES
// =====================================================

interface TransactionItem {
  _id: string;

  username: string;

  walletType: "PKR" | "GOLD" | "USDT";

  transactionType:
    | "Deposit"
    | "Withdraw"
    | "Credit"
    | "Debit";

  amount: number;

  status?: "Pending" | "Approved" | "Rejected";

  transactionId?: string;

  note?: string;

  admin?: string;

  createdAt: string;
}

interface TransactionStatistics {
  totalTransactions: number;

  totalDeposits: number;
  totalWithdraws: number;

  totalCredits: number;
  totalDebits: number;

  totalPKR: number;
  totalGold: number;
  totalUSDT: number;
}

// =====================================================
// COMPONENT
// =====================================================

export default function AdminTransactionsPage() {

  // ===================================================
  // AUTH
  // ===================================================

  const [token, setToken] = useState("");

  const [adminName, setAdminName] =
    useState("Administrator");

  // ===================================================
  // DATA
  // ===================================================

  const [transactions, setTransactions] =
    useState<TransactionItem[]>([]);

  const [statistics, setStatistics] =
    useState<TransactionStatistics>({
      totalTransactions: 0,

      totalDeposits: 0,
      totalWithdraws: 0,

      totalCredits: 0,
      totalDebits: 0,

      totalPKR: 0,
      totalGold: 0,
      totalUSDT: 0,
    });

  // ===================================================
  // UI STATES
  // ===================================================

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [message, setMessage] = useState("");

  const [messageType, setMessageType] = useState<
    "success" | "error"
  >("success");

  const [error, setError] = useState("");

  // ===================================================
  // SEARCH
  // ===================================================

  const [search, setSearch] = useState("");

  // ===================================================
  // FILTERS
  // ===================================================

  const [walletFilter, setWalletFilter] = useState<
    "ALL" | "PKR" | "GOLD" | "USDT"
  >("ALL");

  const [typeFilter, setTypeFilter] = useState<
    "ALL" | "Deposit" | "Withdraw" | "Credit" | "Debit"
  >("ALL");

  const [statusFilter, setStatusFilter] = useState<
    "ALL" | "Pending" | "Approved" | "Rejected"
  >("ALL");

  // ===================================================
  // TOKEN LOAD
  // ===================================================

  useEffect(() => {
    const savedToken = localStorage.getItem("token");

    if (!savedToken) {
      window.location.href = "/login";
      return;
    }

    setToken(savedToken);
  }, []);

  // ===================================================
  // REQUEST HEADERS
  // ===================================================

  const adminHeaders = useMemo(
    () => ({
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    }),
    [token]
  );

  // ===================================================
  // FORMATTERS
  // ===================================================

  const formatMoney = (value: number = 0) =>
    Number(value).toLocaleString("en-PK", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const formatDate = (date?: string) => {
    if (!date) return "--";

    return new Date(date).toLocaleString("en-GB", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  // ===================================================
  // FILTERED TRANSACTIONS
  // ===================================================

  const filteredTransactions = useMemo(() => {
    return transactions.filter((transaction) => {

      const searchMatch =
        transaction.username
          .toLowerCase()
          .includes(search.toLowerCase()) ||
        (transaction.transactionId || "")
          .toLowerCase()
          .includes(search.toLowerCase());

      const walletMatch =
        walletFilter === "ALL" ||
        transaction.walletType === walletFilter;

      const typeMatch =
        typeFilter === "ALL" ||
        transaction.transactionType === typeFilter;

      const statusMatch =
        statusFilter === "ALL" ||
        (transaction.status || "Approved") === statusFilter;

      return (
        searchMatch &&
        walletMatch &&
        typeMatch &&
        statusMatch
      );
    });
  }, [
    transactions,
    search,
    walletFilter,
    typeFilter,
    statusFilter,
  ]);
    // ===================================================
  // LOAD TRANSACTIONS DASHBOARD
  // ===================================================

  const loadTransactionsDashboard = async () => {
    if (!token) return;

    try {
      setLoading(true);
      setRefreshing(false);
      setError("");

      const [transactionsRes, statisticsRes] = await Promise.all([
        fetch(`${API}/api/admin/transactions`, {
          headers: adminHeaders,
          cache: "no-store",
        }),

        fetch(`${API}/api/admin/transactions/statistics`, {
          headers: adminHeaders,
          cache: "no-store",
        }),
      ]);

      const transactionsData = await transactionsRes.json();
      const statisticsData = await statisticsRes.json();

      console.log("TRANSACTIONS API:", transactionsData);
      console.log("TRANSACTION STATISTICS API:", statisticsData);

      // TRANSACTIONS
      if (transactionsRes.ok && transactionsData.success) {
        setTransactions(transactionsData.transactions || []);
      } else {
        setTransactions([]);
        setError(
          transactionsData.message || "Unable to load transactions."
        );
      }

      // STATISTICS
      if (statisticsRes.ok && statisticsData.success) {
        setStatistics(statisticsData.statistics);
      } else {
        setStatistics({
          totalTransactions: 0,
          totalDeposits: 0,
          totalWithdraws: 0,
          totalCredits: 0,
          totalDebits: 0,
          totalPKR: 0,
          totalGold: 0,
          totalUSDT: 0,
        });
      }

    } catch (err: any) {
      console.error("LOAD TRANSACTIONS ERROR:", err);

      setTransactions([]);
      setError(
        err.message || "Unable to load transactions dashboard."
      );

    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // ===================================================
  // REFRESH TRANSACTIONS
  // ===================================================

  const refreshTransactions = async () => {
    setRefreshing(true);
    await loadTransactionsDashboard();
  };

  // ===================================================
  // ADMIN AUTH CHECK
  // ===================================================

  const checkAdminAuth = async () => {
    if (!token) return;

    try {
      const response = await fetch(`${API}/api/admin/auth/check`, {
        headers: adminHeaders,
        cache: "no-store",
      });

      const data = await response.json();

      console.log("ADMIN AUTH:", data);

      if (!response.ok || !data.success) {
        localStorage.removeItem("token");
        window.location.href = "/login";
        return;
      }

      setAdminName(data.user?.username || "Administrator");

    } catch (error) {
      console.error("ADMIN AUTH ERROR:", error);
    }
  };

  // ===================================================
  // INITIAL LOAD
  // ===================================================

  useEffect(() => {
    if (!token) return;

    checkAdminAuth();
    loadTransactionsDashboard();
  }, [token]);

  // ===================================================
  // AUTO CLEAR MESSAGE
  // ===================================================

  useEffect(() => {
    if (!message) return;

    const timer = setTimeout(() => {
      setMessage("");
    }, 4000);

    return () => clearTimeout(timer);
  }, [message]);
    // ===================================================
  // STATUS BADGE COLOR
  // ===================================================

  const getStatusClass = (status?: string) => {
    switch ((status || "").toUpperCase()) {
      case "APPROVED":
        return "text-green-400 bg-green-500/10 border border-green-500/30";

      case "PENDING":
        return "text-yellow-400 bg-yellow-500/10 border border-yellow-500/30";

      case "REJECTED":
        return "text-red-400 bg-red-500/10 border border-red-500/30";

      default:
        return "text-gray-300 bg-gray-700/20 border border-gray-600/30";
    }
  };

  // ===================================================
  // TRANSACTION TYPE COLOR
  // ===================================================

  const getTransactionClass = (
    type: TransactionItem["transactionType"]
  ) => {
    switch (type) {
      case "Deposit":
        return "text-green-400 bg-green-500/10 border border-green-500/30";

      case "Withdraw":
        return "text-red-400 bg-red-500/10 border border-red-500/30";

      case "Credit":
        return "text-cyan-400 bg-cyan-500/10 border border-cyan-500/30";

      case "Debit":
        return "text-orange-400 bg-orange-500/10 border border-orange-500/30";

      default:
        return "text-gray-300 bg-gray-700/20 border border-gray-600/30";
    }
  };

  // ===================================================
  // WALLET COLOR
  // ===================================================

  const getWalletColor = (wallet: string) => {
    switch (wallet.toUpperCase()) {
      case "PKR":
        return "text-green-400";

      case "GOLD":
        return "text-yellow-400";

      case "USDT":
        return "text-cyan-400";

      default:
        return "text-gray-300";
    }
  };

  // ===================================================
  // TRANSACTION ICON
  // ===================================================

  const getTransactionIcon = (
    type: TransactionItem["transactionType"]
  ) => {
    switch (type) {
      case "Deposit":
        return ArrowDownCircle;

      case "Withdraw":
        return ArrowUpCircle;

      case "Credit":
        return PlusCircle;

      case "Debit":
        return MinusCircle;

      default:
        return History;
    }
  };

  // ===================================================
  // FILTERED SUMMARY
  // ===================================================

  const filteredStatistics = useMemo(() => {
    return filteredTransactions.reduce(
      (summary, transaction) => {
        const amount = Number(transaction.amount || 0);

        summary.totalAmount += amount;

        switch (transaction.transactionType) {
          case "Deposit":
            summary.deposits++;
            break;

          case "Withdraw":
            summary.withdraws++;
            break;

          case "Credit":
            summary.credits++;
            break;

          case "Debit":
            summary.debits++;
            break;
        }

        switch (transaction.walletType) {
          case "PKR":
            summary.pkr += amount;
            break;

          case "GOLD":
            summary.gold += amount;
            break;

          case "USDT":
            summary.usdt += amount;
            break;
        }

        return summary;
      },
      {
        deposits: 0,
        withdraws: 0,
        credits: 0,
        debits: 0,
        totalAmount: 0,

        pkr: 0,
        gold: 0,
        usdt: 0,
      }
    );
  }, [filteredTransactions]);

  // ===================================================
  // RECENT TRANSACTIONS
  // ===================================================

  const recentTransactions = useMemo(() => {
    return [...transactions]
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() -
          new Date(a.createdAt).getTime()
      )
      .slice(0, 10);
  }, [transactions]);

  // ===================================================
  // TRANSACTION COUNTS
  // ===================================================

  const pendingCount = useMemo(() => {
    return transactions.filter(
      (item) => item.status === "Pending"
    ).length;
  }, [transactions]);

  const approvedCount = useMemo(() => {
    return transactions.filter(
      (item) => item.status === "Approved"
    ).length;
  }, [transactions]);

  const rejectedCount = useMemo(() => {
    return transactions.filter(
      (item) => item.status === "Rejected"
    ).length;
  }, [transactions]);

  // ===================================================
  // CLEAR FILTERS
  // ===================================================

  const clearFilters = () => {
    setSearch("");
    setWalletFilter("ALL");
    setTypeFilter("ALL");
    setStatusFilter("ALL");
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
            GoldTrade V18 • Enterprise Transaction Manager
          </h1>

          <p className="text-gray-400 mt-2">
            View and manage Deposit, Withdraw, Credit and Debit transactions.
          </p>

          <p className="text-gray-500 text-sm mt-1">
            Logged in as{" "}
            <span className="text-green-400 font-semibold">
              {adminName}
            </span>
          </p>
        </div>

        <button
          onClick={refreshTransactions}
          disabled={refreshing}
          className="flex items-center gap-2 bg-yellow-500 hover:bg-yellow-600 disabled:opacity-60 text-black font-semibold px-5 py-3 rounded-xl transition"
        >
          <RefreshCw
            size={18}
            className={refreshing ? "animate-spin" : ""}
          />

          {refreshing ? "Refreshing..." : "Refresh Transactions"}
        </button>

      </div>

      {/* ========================================== */}
      {/* SUCCESS / ERROR MESSAGE */}
      {/* ========================================== */}

      {message && (
        <div
          className={`mb-6 rounded-xl px-4 py-3 border ${
            messageType === "success"
              ? "bg-green-600/20 border-green-500 text-green-300"
              : "bg-red-600/20 border-red-500 text-red-300"
          }`}
        >
          {message}
        </div>
      )}

      {error && (
        <div className="mb-6 rounded-xl px-4 py-3 border border-red-600 bg-red-600/10 text-red-300">
          {error}
        </div>
      )}

      {/* ========================================== */}
      {/* MAIN STATISTICS CARDS */}
      {/* ========================================== */}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">

        {/* TOTAL */}

        <div className="rounded-2xl bg-[#111827] border border-blue-600/30 p-5">

          <div className="flex justify-between items-center mb-3">
            <History className="text-blue-400" size={28} />
            <span className="text-xs text-blue-400 font-semibold">
              TOTAL
            </span>
          </div>

          <p className="text-gray-400 text-sm">
            All Transactions
          </p>

          <h2 className="text-3xl font-bold text-blue-400 mt-2">
            {statistics.totalTransactions}
          </h2>

        </div>

        {/* DEPOSITS */}

        <div className="rounded-2xl bg-[#111827] border border-green-600/30 p-5">

          <div className="flex justify-between items-center mb-3">
            <ArrowDownCircle className="text-green-400" size={28} />
            <span className="text-xs text-green-400 font-semibold">
              DEPOSITS
            </span>
          </div>

          <p className="text-gray-400 text-sm">
            Deposit Transactions
          </p>

          <h2 className="text-3xl font-bold text-green-400 mt-2">
            {statistics.totalDeposits}
          </h2>

        </div>

        {/* WITHDRAWS */}

        <div className="rounded-2xl bg-[#111827] border border-red-600/30 p-5">

          <div className="flex justify-between items-center mb-3">
            <ArrowUpCircle className="text-red-400" size={28} />
            <span className="text-xs text-red-400 font-semibold">
              WITHDRAWS
            </span>
          </div>

          <p className="text-gray-400 text-sm">
            Withdraw Transactions
          </p>

          <h2 className="text-3xl font-bold text-red-400 mt-2">
            {statistics.totalWithdraws}
          </h2>

        </div>

        {/* WALLET */}

        <div className="rounded-2xl bg-[#111827] border border-purple-600/30 p-5">

          <div className="flex justify-between items-center mb-3">
            <Wallet className="text-purple-400" size={28} />
            <span className="text-xs text-purple-400 font-semibold">
              WALLET
            </span>
          </div>

          <p className="text-gray-400 text-sm">
            Credit + Debit Transactions
          </p>

          <h2 className="text-3xl font-bold text-purple-400 mt-2">
            {statistics.totalCredits + statistics.totalDebits}
          </h2>

        </div>

      </div>

      {/* ========================================== */}
      {/* WALLET SUMMARY CARDS */}
      {/* ========================================== */}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">

        <div className="rounded-2xl bg-[#111827] border border-green-600/20 p-5">

          <div className="flex justify-between items-center mb-2">
            <DollarSign className="text-green-400" size={24} />
            <span className="text-green-400 text-xs font-semibold">
              PKR
            </span>
          </div>

          <h3 className="text-2xl font-bold text-green-400">
            PKR {formatMoney(statistics.totalPKR)}
          </h3>

          <p className="text-gray-400 text-sm mt-2">
            Total PKR Transactions
          </p>

        </div>

        <div className="rounded-2xl bg-[#111827] border border-yellow-600/20 p-5">

          <div className="flex justify-between items-center mb-2">
            <Coins className="text-yellow-400" size={24} />
            <span className="text-yellow-400 text-xs font-semibold">
              GOLD
            </span>
          </div>

          <h3 className="text-2xl font-bold text-yellow-400">
            {statistics.totalGold.toFixed(3)} Gold
          </h3>

          <p className="text-gray-400 text-sm mt-2">
            Total Gold Transactions
          </p>

        </div>

        <div className="rounded-2xl bg-[#111827] border border-cyan-600/20 p-5">

          <div className="flex justify-between items-center mb-2">
            <Wallet className="text-cyan-400" size={24} />
            <span className="text-cyan-400 text-xs font-semibold">
              USDT
            </span>
          </div>

          <h3 className="text-2xl font-bold text-cyan-400">
            {statistics.totalUSDT.toFixed(2)} USDT
          </h3>

          <p className="text-gray-400 text-sm mt-2">
            Total USDT Transactions
          </p>

        </div>

      </div>

      {/* ========================================== */}
      {/* STATUS SUMMARY */}
      {/* ========================================== */}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">

        <div className="rounded-xl bg-yellow-500/10 border border-yellow-500/30 p-4">

          <div className="flex items-center justify-between">

            <div>
              <p className="text-yellow-400 text-sm">Pending</p>

              <h3 className="text-2xl font-bold text-yellow-300">
                {pendingCount}
              </h3>
            </div>

            <Clock className="text-yellow-400" size={28} />

          </div>

        </div>

        <div className="rounded-xl bg-green-500/10 border border-green-500/30 p-4">

          <div className="flex items-center justify-between">

            <div>
              <p className="text-green-400 text-sm">Approved</p>

              <h3 className="text-2xl font-bold text-green-300">
                {approvedCount}
              </h3>
            </div>

            <CheckCircle className="text-green-400" size={28} />

          </div>

        </div>

        <div className="rounded-xl bg-red-500/10 border border-red-500/30 p-4">

          <div className="flex items-center justify-between">

            <div>
              <p className="text-red-400 text-sm">Rejected</p>

              <h3 className="text-2xl font-bold text-red-300">
                {rejectedCount}
              </h3>
            </div>

            <XCircle className="text-red-400" size={28} />

          </div>

        </div>

      </div>

      {/* ========================================== */}
      {/* SEARCH + FILTERS */}
      {/* ========================================== */}

      <div className="rounded-2xl bg-[#111827] border border-gray-700 p-5 mb-8">

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">

          {/* SEARCH */}

          <div className="relative lg:col-span-2">

            <Search
              size={20}
              className="absolute left-4 top-3.5 text-gray-500"
            />

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search username or transaction ID..."
              className="w-full bg-[#1F2937] border border-gray-600 rounded-xl py-3 pl-12 pr-4 outline-none focus:border-yellow-500 transition"
            />

          </div>

          {/* WALLET FILTER */}

          <select
            value={walletFilter}
            onChange={(e) =>
              setWalletFilter(
                e.target.value as "ALL" | "PKR" | "GOLD" | "USDT"
              )
            }
            className="bg-[#1F2937] border border-gray-600 rounded-xl px-4 py-3 outline-none focus:border-yellow-500"
          >
            <option value="ALL">All Wallets</option>
            <option value="PKR">PKR</option>
            <option value="GOLD">GOLD</option>
            <option value="USDT">USDT</option>
          </select>

          {/* TYPE FILTER */}

          <select
            value={typeFilter}
            onChange={(e) =>
              setTypeFilter(
                e.target.value as
                  | "ALL"
                  | "Deposit"
                  | "Withdraw"
                  | "Credit"
                  | "Debit"
              )
            }
            className="bg-[#1F2937] border border-gray-600 rounded-xl px-4 py-3 outline-none focus:border-yellow-500"
          >
            <option value="ALL">All Types</option>
            <option value="Deposit">Deposit</option>
            <option value="Withdraw">Withdraw</option>
            <option value="Credit">Credit</option>
            <option value="Debit">Debit</option>
          </select>

        </div>

        {/* STATUS FILTER */}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">

          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(
                e.target.value as
                  | "ALL"
                  | "Pending"
                  | "Approved"
                  | "Rejected"
              )
            }
            className="bg-[#1F2937] border border-gray-600 rounded-xl px-4 py-3 outline-none focus:border-yellow-500"
          >
            <option value="ALL">All Status</option>
            <option value="Pending">Pending</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
          </select>

          <button
            onClick={clearFilters}
            className="flex items-center justify-center gap-2 bg-gray-700 hover:bg-gray-600 rounded-xl py-3 transition"
          >
            <Filter size={18} />
            Clear Filters
          </button>

        </div>

      </div>

      {/* ========================================== */}
      {/* TRANSACTIONS TABLE */}
      {/* ========================================== */}

      <div className="rounded-2xl border border-gray-700 bg-[#111827] overflow-hidden">

        <div className="px-6 py-5 border-b border-gray-700 flex justify-between items-center">

          <h2 className="text-xl font-bold text-yellow-400">
            Transactions ({filteredTransactions.length})
          </h2>

          <History className="text-yellow-400" />

        </div>

        <div className="overflow-x-auto">

          <table className="w-full min-w-[1400px]">

            <thead className="bg-[#1F2937] text-gray-300 text-sm">

              <tr>

                <th className="text-left px-5 py-4">User</th>

                <th className="text-center">Wallet</th>

                <th className="text-center">Type</th>

                <th className="text-center">Amount</th>

                <th className="text-center">Status</th>

                <th className="text-center">Transaction ID</th>

                <th className="text-center">Admin Note</th>

                <th className="text-center">Date</th>

              </tr>

            </thead>

            <tbody>
                            {loading ? (
                <tr>
                  <td
                    colSpan={8}
                    className="py-12 text-center text-gray-400"
                  >
                    Loading transactions...
                  </td>
                </tr>

              ) : filteredTransactions.length === 0 ? (

                <tr>
                  <td
                    colSpan={8}
                    className="py-12 text-center text-red-300"
                  >
                    No transactions found.
                  </td>
                </tr>

              ) : (

                filteredTransactions.map((transaction) => {

                  const TransactionIcon = getTransactionIcon(
                    transaction.transactionType
                  );

                  return (
                    <tr
                      key={transaction._id}
                      className="border-b border-gray-800 hover:bg-[#1B2435] transition"
                    >

                      {/* USER */}

                      <td className="px-5 py-4">

                        <div className="flex items-center gap-3">

                          <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center">
                            <User
                              size={18}
                              className="text-yellow-400"
                            />
                          </div>

                          <div>
                            <p className="font-semibold text-white">
                              {transaction.username}
                            </p>

                            <p className="text-xs text-gray-500">
                              {transaction.admin || "System"}
                            </p>
                          </div>

                        </div>

                      </td>

                      {/* WALLET */}

                      <td className="text-center">

                        <span
                          className={`font-semibold ${getWalletColor(
                            transaction.walletType
                          )}`}
                        >
                          {transaction.walletType}
                        </span>

                      </td>

                      {/* TRANSACTION TYPE */}

                      <td className="text-center">

                        <span
                          className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold ${getTransactionClass(
                            transaction.transactionType
                          )}`}
                        >
                          <TransactionIcon size={14} />

                          {transaction.transactionType}
                        </span>

                      </td>

                      {/* AMOUNT */}

                      <td className="text-center font-semibold">

                        {transaction.transactionType === "Withdraw" ||
                        transaction.transactionType === "Debit" ? (

                          <span className="text-red-400">
                            -{" "}
                            {transaction.walletType === "PKR"
                              ? `PKR ${formatMoney(transaction.amount)}`
                              : transaction.walletType === "GOLD"
                              ? `${Number(transaction.amount).toFixed(3)} Gold`
                              : `${Number(transaction.amount).toFixed(2)} USDT`}
                          </span>

                        ) : (

                          <span className="text-green-400">
                            +{" "}
                            {transaction.walletType === "PKR"
                              ? `PKR ${formatMoney(transaction.amount)}`
                              : transaction.walletType === "GOLD"
                              ? `${Number(transaction.amount).toFixed(3)} Gold`
                              : `${Number(transaction.amount).toFixed(2)} USDT`}
                          </span>

                        )}

                      </td>

                      {/* STATUS */}

                      <td className="text-center">

                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusClass(
                            transaction.status || "Approved"
                          )}`}
                        >
                          {transaction.status || "Approved"}
                        </span>

                      </td>

                      {/* TRANSACTION ID */}

                      <td className="text-center text-sm text-gray-300">

                        {transaction.transactionId ? (
                          <span className="font-mono text-xs text-cyan-400">
                            {transaction.transactionId}
                          </span>
                        ) : (
                          <span className="text-gray-500">—</span>
                        )}

                      </td>

                      {/* ADMIN NOTE */}

                      <td className="text-center text-sm text-gray-300 max-w-[220px] truncate">

                        {transaction.note ? (
                          transaction.note
                        ) : (
                          <span className="text-gray-500">No Note</span>
                        )}

                      </td>

                      {/* DATE */}

                      <td className="text-center text-gray-400 text-sm">

                        <div className="flex flex-col items-center gap-1">

                          <Calendar
                            size={14}
                            className="text-gray-500"
                          />

                          {formatDate(transaction.createdAt)}

                        </div>

                      </td>

                    </tr>
                  );

                })

              )}

            </tbody>
                      </table>
        </div>
      </div>

      {/* ========================================== */}
      {/* RECENT TRANSACTION SUMMARY */}
      {/* ========================================== */}

      <div className="rounded-2xl border border-gray-700 bg-[#111827] overflow-hidden mt-10 mb-10">

        <div className="px-6 py-5 border-b border-gray-700 flex justify-between items-center">

          <h2 className="text-xl font-bold text-purple-400">
            Recent Transactions Summary
          </h2>

          <History className="text-purple-400" />

        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 p-6">

          <div className="bg-[#1F2937] rounded-xl p-5 border border-green-600/20">
            <ArrowDownCircle className="text-green-400 mb-3" size={28} />
            <p className="text-gray-400 text-sm">Deposits (Filtered)</p>
            <h3 className="text-2xl font-bold text-green-400 mt-2">
              {filteredStatistics.deposits}
            </h3>
          </div>

          <div className="bg-[#1F2937] rounded-xl p-5 border border-red-600/20">
            <ArrowUpCircle className="text-red-400 mb-3" size={28} />
            <p className="text-gray-400 text-sm">Withdraws (Filtered)</p>
            <h3 className="text-2xl font-bold text-red-400 mt-2">
              {filteredStatistics.withdraws}
            </h3>
          </div>

          <div className="bg-[#1F2937] rounded-xl p-5 border border-cyan-600/20">
            <DollarSign className="text-cyan-400 mb-3" size={28} />
            <p className="text-gray-400 text-sm">Credits (Filtered)</p>
            <h3 className="text-2xl font-bold text-cyan-400 mt-2">
              {filteredStatistics.credits}
            </h3>
          </div>

          <div className="bg-[#1F2937] rounded-xl p-5 border border-orange-600/20">
            <Wallet className="text-orange-400 mb-3" size={28} />
            <p className="text-gray-400 text-sm">Debits (Filtered)</p>
            <h3 className="text-2xl font-bold text-orange-400 mt-2">
              {filteredStatistics.debits}
            </h3>
          </div>

        </div>

      </div>

      {/* ========================================== */}
      {/* RECENT TRANSACTIONS LIST */}
      {/* ========================================== */}

      <div className="rounded-2xl border border-gray-700 bg-[#111827] overflow-hidden mb-10">

        <div className="px-6 py-5 border-b border-gray-700 flex justify-between items-center">

          <h2 className="text-xl font-bold text-yellow-400">
            Latest 10 Transactions
          </h2>

          <Clock className="text-yellow-400" />

        </div>

        <div className="divide-y divide-gray-800">

          {recentTransactions.length === 0 ? (

            <div className="py-12 text-center text-gray-400">
              No recent transactions available.
            </div>

          ) : (

            recentTransactions.map((item) => {

              const Icon = getTransactionIcon(item.transactionType);

              return (
                <div
                  key={item._id}
                  className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 px-6 py-4 hover:bg-[#1B2435] transition"
                >

                  <div className="flex items-center gap-4">

                    <div className="w-12 h-12 rounded-full bg-yellow-500/10 flex items-center justify-center">
                      <Icon size={22} className="text-yellow-400" />
                    </div>

                    <div>
                      <p className="font-semibold text-white">
                        {item.username}
                      </p>

                      <p className="text-gray-500 text-sm">
                        {item.transactionType} • {item.walletType}
                      </p>
                    </div>

                  </div>

                  <div className="flex flex-wrap items-center gap-3">

                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${getTransactionClass(
                        item.transactionType
                      )}`}
                    >
                      {item.transactionType}
                    </span>

                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusClass(
                        item.status || "Approved"
                      )}`}
                    >
                      {item.status || "Approved"}
                    </span>

                    <span
                      className={`font-semibold ${getWalletColor(
                        item.walletType
                      )}`}
                    >
                      {item.walletType === "PKR"
                        ? `PKR ${formatMoney(item.amount)}`
                        : item.walletType === "GOLD"
                        ? `${Number(item.amount).toFixed(3)} Gold`
                        : `${Number(item.amount).toFixed(2)} USDT`}
                    </span>

                    <span className="text-gray-400 text-sm">
                      {formatDate(item.createdAt)}
                    </span>

                  </div>

                </div>
              );
            })

          )}

        </div>

      </div>

      {/* ========================================== */}
      {/* LOADING OVERLAY */}
      {/* ========================================== */}

      {loading && (
        <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center">

          <div className="bg-[#111827] border border-yellow-500/30 rounded-2xl px-8 py-6 flex flex-col items-center gap-4 shadow-2xl">

            <RefreshCw
              size={36}
              className="animate-spin text-yellow-400"
            />

            <h3 className="text-xl font-bold text-yellow-400">
              GoldTrade V18 Enterprise
            </h3>

            <p className="text-gray-300">
              Loading Transactions...
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
              Enterprise Transaction Management Module
            </p>

          </div>

          <div className="flex flex-wrap gap-5 text-sm text-gray-400">

            <div className="flex items-center gap-2">
              <Shield size={16} className="text-green-400" />
              Secure Admin Transactions
            </div>

            <div className="flex items-center gap-2">
              <History size={16} className="text-purple-400" />
              Deposit + Withdraw + Wallet History
            </div>

            <div className="flex items-center gap-2">
              <Wallet size={16} className="text-cyan-400" />
              PKR • GOLD • USDT Supported
            </div>

            <div className="flex items-center gap-2">
              <Calendar size={16} className="text-yellow-400" />
              Version 18 Production
            </div>

          </div>

        </div>

      </footer>

    </div>
  );
}