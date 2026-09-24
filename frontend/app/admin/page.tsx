"use client";

// =====================================================
// GoldTrade V18 Enterprise
// ADMIN DASHBOARD (PART 1/6)
// Production Version
// =====================================================

import { useEffect, useMemo, useState } from "react";

import {
  Users,
  Wallet,
  ArrowUpCircle,
  ArrowDownCircle,
  Coins,
  DollarSign,
  RefreshCw,
  Settings,
  Shield,
  Clock,
  Activity,
  TrendingUp,
  UserCheck,
  AlertCircle,
  History,
  CreditCard,
} from "lucide-react";

// =====================================================
// API URL
// =====================================================

const API =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

// =====================================================
// TYPES
// =====================================================

interface AdminUser {
  _id: string;
  username: string;
  email: string;
  role: string;
  status?: string;

  wallet?: {
    pkr: number;
    gold: number;
    usdt: number;
  };

  pkrBalance?: number;
  goldBalance?: number;
  usdtBalance?: number;

  createdAt?: string;
}

interface DepositRequest {
  _id: string;
  username: string;
  walletType: "PKR" | "GOLD" | "USDT";
  amount: number;
  status: "Pending" | "Approved" | "Rejected";
  createdAt: string;
}

interface WithdrawRequest {
  _id: string;
  username: string;
  walletType: "PKR" | "GOLD" | "USDT";
  amount: number;
  status: "Pending" | "Approved" | "Rejected";
  createdAt: string;
}

interface WalletHistoryItem {
  _id: string;
  username: string;
  walletType: string;
  type: "Credit" | "Debit";
  amount: number;
  note: string;
  createdAt: string;
}

interface DashboardStats {
  totalUsers: number;

  totalDeposits: number;
  pendingDeposits: number;

  totalWithdraws: number;
  pendingWithdraws: number;

  totalPKR: number;
  totalGold: number;
  totalUSDT: number;
}

// =====================================================
// COMPONENT
// =====================================================

export default function AdminDashboardPage() {
  // ===================================================
  // AUTH
  // ===================================================

  const [token, setToken] = useState("");
  const [adminName, setAdminName] = useState("Administrator");

  // ===================================================
  // DATA STATES
  // ===================================================

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [deposits, setDeposits] = useState<DepositRequest[]>([]);
  const [withdraws, setWithdraws] = useState<WithdrawRequest[]>([]);
  const [walletHistory, setWalletHistory] = useState<
    WalletHistoryItem[]
  >([]);

  // ===================================================
  // UI STATES
  // ===================================================

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState("");

  const [marketStatus, setMarketStatus] = useState("OPEN");

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
  // LOAD DASHBOARD (PRODUCTION)
  // ===================================================

  const loadDashboard = async () => {
    if (!token) return;

    try {
      setLoading(true);
      setError("");

      const [
        usersRes,
        depositsRes,
        withdrawsRes,
        walletHistoryRes,
      ] = await Promise.all([
        fetch(`${API}/api/admin/users`, {
          headers: adminHeaders,
          cache: "no-store",
        }),

        fetch(`${API}/api/admin/deposits`, {
          headers: adminHeaders,
          cache: "no-store",
        }),

        fetch(`${API}/api/admin/withdraws`, {
          headers: adminHeaders,
          cache: "no-store",
        }),

        fetch(`${API}/api/admin/wallet/history`, {
          headers: adminHeaders,
          cache: "no-store",
        }),
      ]);

      const usersData = await usersRes.json();
      const depositsData = await depositsRes.json();
      const withdrawsData = await withdrawsRes.json();
      const walletHistoryData = await walletHistoryRes.json();

      console.log("USERS API:", usersData);
      console.log("DEPOSITS API:", depositsData);
      console.log("WITHDRAWS API:", withdrawsData);
      console.log("WALLET HISTORY API:", walletHistoryData);

      // USERS
      if (usersRes.ok && usersData.success) {
        setUsers(usersData.users || []);
      } else {
        console.warn("Users API failed.");
        setUsers([]);
      }

      // DEPOSITS
      if (depositsRes.ok && depositsData.success) {
        setDeposits(depositsData.deposits || []);
      } else {
        console.warn("Deposits API failed.");
        setDeposits([]);
      }

      // WITHDRAWS
      if (withdrawsRes.ok && withdrawsData.success) {
        setWithdraws(withdrawsData.withdrawals || []);
      } else {
        console.warn("Withdraw API failed.");
        setWithdraws([]);
      }

      // WALLET HISTORY
      if (walletHistoryRes.ok && walletHistoryData.success) {
        setWalletHistory(walletHistoryData.history || []);
      } else {
        console.warn("Wallet History API failed.");
        setWalletHistory([]);
      }

    } catch (err: any) {
      console.error("ADMIN DASHBOARD ERROR:", err);
      setError(err.message || "Unable to load dashboard.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // ===================================================
  // REFRESH BUTTON
  // ===================================================

  const refreshDashboard = async () => {
    setRefreshing(true);
    await loadDashboard();
  };

  // ===================================================
  // INITIAL LOAD
  // ===================================================

  useEffect(() => {
    if (token) {
      loadDashboard();
    }
  }, [token]);

  // ===================================================
  // ADMIN AUTH CHECK
  // ===================================================

  useEffect(() => {
    if (!token) return;

    const checkAdmin = async () => {
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

    checkAdmin();
  }, [token]);
    // ===================================================
  // DASHBOARD STATISTICS (PRODUCTION)
  // ===================================================

  const stats: DashboardStats = useMemo(() => {
    const dashboardStats: DashboardStats = {
      totalUsers: users.length,

      totalDeposits: deposits.length,
      pendingDeposits: 0,

      totalWithdraws: withdraws.length,
      pendingWithdraws: 0,

      totalPKR: 0,
      totalGold: 0,
      totalUSDT: 0,
    };

    // Deposits
    deposits.forEach((deposit) => {
      const amount = Number(deposit.amount || 0);
      const wallet = String(deposit.walletType || "PKR").toUpperCase();

      if (deposit.status === "Pending") {
        dashboardStats.pendingDeposits++;
      }

      switch (wallet) {
        case "PKR":
          dashboardStats.totalPKR += amount;
          break;

        case "GOLD":
          dashboardStats.totalGold += amount;
          break;

        case "USDT":
          dashboardStats.totalUSDT += amount;
          break;
      }
    });

    // Withdraws
    withdraws.forEach((withdraw) => {
      if (withdraw.status === "Pending") {
        dashboardStats.pendingWithdraws++;
      }
    });

    return dashboardStats;
  }, [users, deposits, withdraws]);

  // ===================================================
  // RECENT ACTIVITY
  // ===================================================

  const recentWalletHistory = useMemo(() => {
    return [...walletHistory]
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() -
          new Date(a.createdAt).getTime()
      )
      .slice(0, 8);
  }, [walletHistory]);

  // ===================================================
  // RECENT DEPOSITS
  // ===================================================

  const recentDeposits = useMemo(() => {
    return [...deposits]
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() -
          new Date(a.createdAt).getTime()
      )
      .slice(0, 5);
  }, [deposits]);

  // ===================================================
  // RECENT WITHDRAWS
  // ===================================================

  const recentWithdraws = useMemo(() => {
    return [...withdraws]
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() -
          new Date(a.createdAt).getTime()
      )
      .slice(0, 5);
  }, [withdraws]);

  // ===================================================
  // ACTIVE USERS
  // ===================================================

  const activeUsers = useMemo(() => {
    return users.filter(
      (user) => (user.status || "Active") === "Active"
    ).length;
  }, [users]);

  // ===================================================
  // MARKET STATUS
  // ===================================================

  useEffect(() => {
    const hour = new Date().getHours();

    if (hour >= 9 && hour < 22) {
      setMarketStatus("OPEN");
    } else {
      setMarketStatus("CLOSED");
    }
  }, []);

  // ===================================================
  // STATUS COLORS
  // ===================================================

  const getStatusColor = (status?: string) => {
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
  // WALLET COLORS
  // ===================================================

  const getWalletColor = (wallet?: string) => {
    switch ((wallet || "").toUpperCase()) {
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
  // ROLE COLORS
  // ===================================================

  const getRoleColor = (role?: string) => {
    switch ((role || "").toUpperCase()) {
      case "ADMIN":
        return "text-red-400 bg-red-500/10 border border-red-500/30";

      case "USER":
        return "text-blue-400 bg-blue-500/10 border border-blue-500/30";

      default:
        return "text-gray-300 bg-gray-700/20 border border-gray-600/30";
    }
  };
    // ===================================================
  // PAGE UI START
  // ===================================================

  return (
    <div className="min-h-screen bg-[#050816] text-white p-6">

      {/* ================= HEADER ================= */}

      <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-5 mb-8">

        <div>
          <h1 className="text-4xl font-bold text-yellow-400">
            GoldTrade V18 • Enterprise Admin Dashboard
          </h1>

          <p className="text-gray-400 mt-2">
            Welcome back,
            <span className="text-green-400 font-semibold ml-2">
              {adminName}
            </span>
          </p>
        </div>

        <div className="flex gap-3 flex-wrap">

          {/* MARKET STATUS */}

          <div
            className={`px-5 py-3 rounded-xl font-bold border ${
              marketStatus === "OPEN"
                ? "bg-green-600/20 border-green-500 text-green-300"
                : "bg-red-600/20 border-red-500 text-red-300"
            }`}
          >
            Market : {marketStatus}
          </div>

          {/* REFRESH */}

          <button
            onClick={refreshDashboard}
            disabled={refreshing}
            className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold rounded-xl px-5 py-3 flex items-center gap-2 transition disabled:opacity-60"
          >
            <RefreshCw
              size={18}
              className={refreshing ? "animate-spin" : ""}
            />

            {refreshing ? "Refreshing..." : "Refresh"}
          </button>

        </div>
      </div>

      {/* ================= ERROR MESSAGE ================= */}

      {error && (
        <div className="mb-6 rounded-xl border border-red-600 bg-red-600/10 px-5 py-4 text-red-300">
          {error}
        </div>
      )}

      {/* ================= LOADING MESSAGE ================= */}

      {loading && (
        <div className="mb-6 rounded-xl border border-yellow-600 bg-yellow-600/10 px-5 py-4 text-yellow-300">
          Loading dashboard...
        </div>
      )}

      {/* ================= DASHBOARD STATS ================= */}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">

        {/* USERS */}

        <div className="rounded-2xl border border-blue-600/30 bg-[#111827] p-5">

          <div className="flex justify-between items-center mb-3">
            <Users className="text-blue-400" size={30} />
            <span className="text-blue-400 text-xs font-semibold">
              USERS
            </span>
          </div>

          <p className="text-gray-400 text-sm">
            Registered Users
          </p>

          <h2 className="text-3xl font-bold text-blue-400 mt-2">
            {stats.totalUsers}
          </h2>

          <p className="text-gray-500 mt-2 text-sm">
            Active : {activeUsers}
          </p>

        </div>

        {/* DEPOSITS */}

        <div className="rounded-2xl border border-green-600/30 bg-[#111827] p-5">

          <div className="flex justify-between items-center mb-3">
            <ArrowDownCircle className="text-green-400" size={30} />

            <span className="text-green-400 text-xs font-semibold">
              DEPOSITS
            </span>
          </div>

          <p className="text-gray-400 text-sm">
            Pending Deposit Requests
          </p>

          <h2 className="text-3xl font-bold text-green-400 mt-2">
            {stats.pendingDeposits}
          </h2>

          <p className="text-gray-500 mt-2 text-sm">
            Total Requests : {stats.totalDeposits}
          </p>

        </div>

        {/* WITHDRAWS */}

        <div className="rounded-2xl border border-red-600/30 bg-[#111827] p-5">

          <div className="flex justify-between items-center mb-3">
            <ArrowUpCircle className="text-red-400" size={30} />

            <span className="text-red-400 text-xs font-semibold">
              WITHDRAWS
            </span>
          </div>

          <p className="text-gray-400 text-sm">
            Pending Withdraw Requests
          </p>

          <h2 className="text-3xl font-bold text-red-400 mt-2">
            {stats.pendingWithdraws}
          </h2>

          <p className="text-gray-500 mt-2 text-sm">
            Total Requests : {stats.totalWithdraws}
          </p>

        </div>

        {/* WALLET HISTORY */}

        <div className="rounded-2xl border border-purple-600/30 bg-[#111827] p-5">

          <div className="flex justify-between items-center mb-3">
            <History className="text-purple-400" size={30} />

            <span className="text-purple-400 text-xs font-semibold">
              HISTORY
            </span>
          </div>

          <p className="text-gray-400 text-sm">
            Wallet Transactions
          </p>

          <h2 className="text-3xl font-bold text-purple-400 mt-2">
            {walletHistory.length}
          </h2>

          <p className="text-gray-500 mt-2 text-sm">
            Credits & Debits
          </p>

        </div>

      </div>

      {/* ================= WALLET TOTALS ================= */}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">

        {/* PKR */}

        <div className="rounded-2xl border border-green-600/30 bg-[#111827] p-6">

          <div className="flex justify-between items-center mb-4">
            <Wallet className="text-green-400" size={28} />
            <span className="text-green-400 font-semibold">PKR</span>
          </div>

          <h2 className="text-4xl font-bold text-green-400">
            PKR {formatMoney(stats.totalPKR)}
          </h2>

          <p className="text-gray-500 mt-3">
            Total PKR Transactions
          </p>

        </div>

        {/* GOLD */}

        <div className="rounded-2xl border border-yellow-600/30 bg-[#111827] p-6">

          <div className="flex justify-between items-center mb-4">
            <Coins className="text-yellow-400" size={28} />
            <span className="text-yellow-400 font-semibold">GOLD</span>
          </div>

          <h2 className="text-4xl font-bold text-yellow-400">
            {stats.totalGold.toFixed(3)} Gold
          </h2>

          <p className="text-gray-500 mt-3">
            Total Gold Transactions
          </p>

        </div>

        {/* USDT */}

        <div className="rounded-2xl border border-cyan-600/30 bg-[#111827] p-6">

          <div className="flex justify-between items-center mb-4">
            <DollarSign className="text-cyan-400" size={28} />
            <span className="text-cyan-400 font-semibold">USDT</span>
          </div>

          <h2 className="text-4xl font-bold text-cyan-400">
            {stats.totalUSDT.toFixed(2)} USDT
          </h2>

          <p className="text-gray-500 mt-3">
            Total USDT Transactions
          </p>

        </div>

      </div>      {/* =================================================== */}
      {/* QUICK ACTIONS */}
      {/* =================================================== */}

      <div className="mb-10">

        <h2 className="text-2xl font-bold text-yellow-400 mb-5">
          Quick Actions
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">

          <button
            onClick={() => (window.location.href = "/admin/users")}
            className="bg-[#111827] border border-blue-600/30 hover:border-blue-500 rounded-2xl p-5 flex flex-col items-center gap-3 transition"
          >
            <Users className="text-blue-400" size={28} />
            <span className="font-semibold text-sm">Users</span>
          </button>

          <button
            onClick={() => (window.location.href = "/admin/wallet")}
            className="bg-[#111827] border border-green-600/30 hover:border-green-500 rounded-2xl p-5 flex flex-col items-center gap-3 transition"
          >
            <Wallet className="text-green-400" size={28} />
            <span className="font-semibold text-sm">Wallet</span>
          </button>

          <button
            onClick={() => (window.location.href = "/admin/deposit")}
            className="bg-[#111827] border border-yellow-600/30 hover:border-yellow-500 rounded-2xl p-5 flex flex-col items-center gap-3 transition"
          >
            <ArrowDownCircle className="text-yellow-400" size={28} />
            <span className="font-semibold text-sm">Deposits</span>
          </button>

          <button
            onClick={() => (window.location.href = "/admin/withdraw")}
            className="bg-[#111827] border border-red-600/30 hover:border-red-500 rounded-2xl p-5 flex flex-col items-center gap-3 transition"
          >
            <ArrowUpCircle className="text-red-400" size={28} />
            <span className="font-semibold text-sm">Withdraws</span>
          </button>

          <button
            onClick={() => (window.location.href = "/admin/transactions")}
            className="bg-[#111827] border border-cyan-600/30 hover:border-cyan-500 rounded-2xl p-5 flex flex-col items-center gap-3 transition"
          >
            <Activity className="text-cyan-400" size={28} />
            <span className="font-semibold text-sm">Transactions</span>
          </button>

          <button
            onClick={() => (window.location.href = "/admin/settings")}
            className="bg-[#111827] border border-purple-600/30 hover:border-purple-500 rounded-2xl p-5 flex flex-col items-center gap-3 transition"
          >
            <Settings className="text-purple-400" size={28} />
            <span className="font-semibold text-sm">Settings</span>
          </button>

        </div>

      </div>

      {/* =================================================== */}
      {/* RECENT DEPOSITS */}
      {/* =================================================== */}

      <div className="rounded-2xl border border-gray-700 bg-[#111827] overflow-hidden mb-10">

        <div className="px-6 py-5 border-b border-gray-700 flex justify-between items-center">

          <h2 className="text-xl font-bold text-yellow-400">
            Recent Deposit Requests
          </h2>

          <ArrowDownCircle className="text-yellow-400" />

        </div>

        <div className="overflow-x-auto">

          <table className="w-full">

            <thead className="bg-[#1F2937] text-gray-300 text-sm">

              <tr>

                <th className="text-left px-5 py-4">Username</th>

                <th className="text-center">Wallet</th>

                <th className="text-center">Amount</th>

                <th className="text-center">Status</th>

                <th className="text-center">Date</th>

              </tr>

            </thead>

            <tbody>

              {recentDeposits.length === 0 ? (

                <tr>

                  <td
                    colSpan={5}
                    className="py-10 text-center text-gray-400"
                  >
                    No recent deposit requests.
                  </td>

                </tr>

              ) : (

                recentDeposits.map((deposit) => (

                  <tr
                    key={deposit._id}
                    className="border-b border-gray-800 hover:bg-[#192132]"
                  >

                    <td className="px-5 py-4 font-semibold">
                      {deposit.username}
                    </td>

                    <td
                      className={`text-center font-bold ${getWalletColor(
                        deposit.walletType
                      )}`}
                    >
                      {deposit.walletType}
                    </td>

                    <td className="text-center">

                      {deposit.walletType === "PKR" &&
                        `PKR ${formatMoney(deposit.amount)}`}

                      {deposit.walletType === "GOLD" &&
                        `${deposit.amount.toFixed(3)} Gold`}

                      {deposit.walletType === "USDT" &&
                        `${deposit.amount.toFixed(2)} USDT`}

                    </td>

                    <td className="text-center">

                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                          deposit.status
                        )}`}
                      >
                        {deposit.status}
                      </span>

                    </td>

                    <td className="text-center text-gray-400 text-sm">
                      {formatDate(deposit.createdAt)}
                    </td>

                  </tr>

                ))

              )}

            </tbody>

          </table>

        </div>

      </div>

      {/* =================================================== */}
      {/* RECENT WITHDRAW REQUESTS */}
      {/* =================================================== */}

      <div className="rounded-2xl border border-gray-700 bg-[#111827] overflow-hidden mb-10">

        <div className="px-6 py-5 border-b border-gray-700 flex justify-between items-center">

          <h2 className="text-xl font-bold text-red-400">
            Recent Withdraw Requests
          </h2>

          <ArrowUpCircle className="text-red-400" />

        </div>

        <div className="overflow-x-auto">

          <table className="w-full">

            <thead className="bg-[#1F2937] text-gray-300 text-sm">

              <tr>

                <th className="text-left px-5 py-4">Username</th>

                <th className="text-center">Wallet</th>

                <th className="text-center">Amount</th>

                <th className="text-center">Status</th>

                <th className="text-center">Date</th>

              </tr>

            </thead>

            <tbody>

              {recentWithdraws.length === 0 ? (

                <tr>

                  <td
                    colSpan={5}
                    className="py-10 text-center text-gray-400"
                  >
                    No recent withdraw requests.
                  </td>

                </tr>

              ) : (

                recentWithdraws.map((withdraw) => (

                  <tr
                    key={withdraw._id}
                    className="border-b border-gray-800 hover:bg-[#192132]"
                  >

                    <td className="px-5 py-4 font-semibold">
                      {withdraw.username}
                    </td>

                    <td
                      className={`text-center font-bold ${getWalletColor(
                        withdraw.walletType
                      )}`}
                    >
                      {withdraw.walletType}
                    </td>

                    <td className="text-center">

                      {withdraw.walletType === "PKR" &&
                        `PKR ${formatMoney(withdraw.amount)}`}

                      {withdraw.walletType === "GOLD" &&
                        `${withdraw.amount.toFixed(3)} Gold`}

                      {withdraw.walletType === "USDT" &&
                        `${withdraw.amount.toFixed(2)} USDT`}

                    </td>

                    <td className="text-center">

                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                          withdraw.status
                        )}`}
                      >
                        {withdraw.status}
                      </span>

                    </td>

                    <td className="text-center text-gray-400 text-sm">
                      {formatDate(withdraw.createdAt)}
                    </td>

                  </tr>

                ))

              )}

            </tbody>

          </table>

        </div>

      </div>      {/* =================================================== */}
      {/* RECENT USERS */}
      {/* =================================================== */}

      <div className="rounded-2xl border border-gray-700 bg-[#111827] overflow-hidden mb-10">

        <div className="px-6 py-5 border-b border-gray-700 flex justify-between items-center">
          <h2 className="text-xl font-bold text-blue-400">
            Recently Registered Users
          </h2>

          <Users className="text-blue-400" />
        </div>

        <div className="overflow-x-auto">

          <table className="w-full">

            <thead className="bg-[#1F2937] text-gray-300 text-sm">

              <tr>
                <th className="text-left px-5 py-4">Username</th>
                <th className="text-left">Email</th>
                <th className="text-center">Role</th>
                <th className="text-center">Status</th>
                <th className="text-center">Joined</th>
              </tr>

            </thead>

            <tbody>

              {users.length === 0 ? (

                <tr>
                  <td
                    colSpan={5}
                    className="py-10 text-center text-gray-400"
                  >
                    No users found.
                  </td>
                </tr>

              ) : (

                users.slice(0, 8).map((user) => (

                  <tr
                    key={user._id}
                    className="border-b border-gray-800 hover:bg-[#192132]"
                  >

                    <td className="px-5 py-4 font-semibold">
                      {user.username}
                    </td>

                    <td className="text-gray-300">
                      {user.email}
                    </td>

                    <td className="text-center">

                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${getRoleColor(
                          user.role
                        )}`}
                      >
                        {user.role}
                      </span>

                    </td>

                    <td className="text-center">

                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          (user.status || "Active") === "Frozen"
                            ? "text-red-400 bg-red-500/10 border border-red-500/30"
                            : "text-green-400 bg-green-500/10 border border-green-500/30"
                        }`}
                      >
                        {user.status || "Active"}
                      </span>

                    </td>

                    <td className="text-center text-gray-400 text-sm">
                      {formatDate(user.createdAt)}
                    </td>

                  </tr>

                ))

              )}

            </tbody>

          </table>

        </div>

      </div>

      {/* =================================================== */}
      {/* WALLET HISTORY */}
      {/* =================================================== */}

      <div className="rounded-2xl border border-gray-700 bg-[#111827] overflow-hidden mb-10">

        <div className="px-6 py-5 border-b border-gray-700 flex justify-between items-center">

          <h2 className="text-xl font-bold text-purple-400">
            Recent Wallet History
          </h2>

          <History className="text-purple-400" />

        </div>

        <div className="overflow-x-auto">

          <table className="w-full">

            <thead className="bg-[#1F2937] text-gray-300 text-sm">

              <tr>
                <th className="text-left px-5 py-4">User</th>
                <th className="text-center">Wallet</th>
                <th className="text-center">Type</th>
                <th className="text-center">Amount</th>
                <th className="text-center">Note</th>
                <th className="text-center">Date</th>
              </tr>

            </thead>

            <tbody>

              {recentWalletHistory.length === 0 ? (

                <tr>
                  <td
                    colSpan={6}
                    className="py-10 text-center text-gray-400"
                  >
                    Wallet history is empty.
                  </td>
                </tr>

              ) : (

                recentWalletHistory.map((item) => (

                  <tr
                    key={item._id}
                    className="border-b border-gray-800 hover:bg-[#192132]"
                  >

                    <td className="px-5 py-4 font-semibold">
                      {item.username}
                    </td>

                    <td
                      className={`text-center font-bold ${getWalletColor(
                        item.walletType
                      )}`}
                    >
                      {item.walletType}
                    </td>

                    <td className="text-center">

                      <span
                        className={`font-semibold ${
                          item.type === "Credit"
                            ? "text-green-400"
                            : "text-red-400"
                        }`}
                      >
                        {item.type}
                      </span>

                    </td>

                    <td className="text-center">

                      {item.type === "Credit" ? (
                        <span className="text-green-400">
                          + {formatMoney(item.amount)}
                        </span>
                      ) : (
                        <span className="text-red-400">
                          - {formatMoney(item.amount)}
                        </span>
                      )}

                    </td>

                    <td className="text-center text-gray-300 text-sm">
                      {item.note}
                    </td>

                    <td className="text-center text-gray-400 text-sm">
                      {formatDate(item.createdAt)}
                    </td>

                  </tr>

                ))

              )}

            </tbody>

          </table>

        </div>

      </div>

      {/* =================================================== */}
      {/* LOADING OVERLAY */}
      {/* =================================================== */}

      {loading && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center">

          <div className="bg-[#111827] border border-yellow-500/30 rounded-2xl px-8 py-6 flex flex-col items-center gap-4">

            <RefreshCw
              size={38}
              className="animate-spin text-yellow-400"
            />

            <h3 className="text-xl font-bold text-yellow-400">
              GoldTrade V18 Enterprise
            </h3>

            <p className="text-gray-300">
              Loading Admin Dashboard...
            </p>

          </div>

        </div>
      )}

      {/* =================================================== */}
      {/* FOOTER */}
      {/* =================================================== */}

      <footer className="mt-12 border-t border-gray-800 pt-6">

        <div className="flex flex-col lg:flex-row justify-between items-center gap-4">

          <div>
            <h3 className="text-yellow-400 font-bold text-lg">
              GoldTrade V18 Enterprise
            </h3>

            <p className="text-gray-500 text-sm">
              PKR • GOLD • USDT Multi Wallet Trading Platform
            </p>
          </div>

          <div className="flex flex-wrap gap-5 text-sm text-gray-400">

            <div className="flex items-center gap-2">
              <Shield size={16} className="text-green-400" />
              Secure Admin Panel
            </div>

            <div className="flex items-center gap-2">
              <Activity size={16} className="text-cyan-400" />
              Live Wallet Activity
            </div>

            <div className="flex items-center gap-2">
              <TrendingUp size={16} className="text-yellow-400" />
              Enterprise Dashboard
            </div>

            <div className="flex items-center gap-2">
              <Clock size={16} className="text-purple-400" />
              Version 18 Production
            </div>

          </div>

        </div>

      </footer>

    </div>
  );
}