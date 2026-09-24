"use client";

// =====================================================
// GoldTrade V18 Enterprise
// ADMIN WALLET MANAGER
// PART 1/6
// Production Version
// =====================================================

import { useEffect, useMemo, useState } from "react";

import {
  Wallet,
  DollarSign,
  Coins,
  Search,
  RefreshCw,
  User,
  PlusCircle,
  MinusCircle,
  History,
  Shield,
  Calendar,
  Save,
  XCircle,
} from "lucide-react";

// =====================================================
// API URL
// =====================================================

const API =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

// =====================================================
// TYPES
// =====================================================

interface WalletData {
  pkr: number;
  gold: number;
  usdt: number;
}

interface WalletUser {
  _id: string;
  username: string;
  email: string;
  role: string;
  status: "Active" | "Frozen";
  wallet: WalletData;
}

interface WalletHistoryItem {
  _id: string;
  username: string;
  walletType: "PKR" | "GOLD" | "USDT";
  type: "Credit" | "Debit";
  amount: number;
  note: string;
  admin?: string;
  createdAt: string;
}

interface WalletStatistics {
  totalUsers: number;
  totalPKR: number;
  totalGold: number;
  totalUSDT: number;
  totalCredits: number;
  totalDebits: number;
}

// =====================================================
// COMPONENT
// =====================================================

export default function AdminWalletPage() {

  // ===================================================
  // AUTH
  // ===================================================

  const [token, setToken] = useState("");
  const [adminName, setAdminName] =
    useState("Administrator");

  // ===================================================
  // USERS / HISTORY
  // ===================================================

  const [walletUsers, setWalletUsers] =
    useState<WalletUser[]>([]);

  const [walletHistory, setWalletHistory] =
    useState<WalletHistoryItem[]>([]);

  const [statistics, setStatistics] =
    useState<WalletStatistics>({
      totalUsers: 0,
      totalPKR: 0,
      totalGold: 0,
      totalUSDT: 0,
      totalCredits: 0,
      totalDebits: 0,
    });

  // ===================================================
  // UI STATES
  // ===================================================

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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
  // WALLET MODAL
  // ===================================================

  const [walletModalOpen, setWalletModalOpen] =
    useState(false);

  const [selectedUser, setSelectedUser] =
    useState<WalletUser | null>(null);

  const [walletType, setWalletType] = useState<
    "PKR" | "GOLD" | "USDT"
  >("PKR");

  const [transactionType, setTransactionType] =
    useState<"Credit" | "Debit">("Credit");

  const [amount, setAmount] = useState(0);
  const [note, setNote] = useState("");

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
  // FILTER USERS
  // ===================================================

  const filteredUsers = useMemo(() => {
    const keyword = search.toLowerCase();

    return walletUsers.filter((user) => {
      return (
        user.username.toLowerCase().includes(keyword) ||
        user.email.toLowerCase().includes(keyword)
      );
    });
  }, [walletUsers, search]);

  // ===================================================
  // RECENT HISTORY
  // ===================================================

  const recentHistory = useMemo(() => {
    return [...walletHistory]
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() -
          new Date(a.createdAt).getTime()
      )
      .slice(0, 20);
  }, [walletHistory]);
    // ===================================================
  // LOAD WALLET DASHBOARD
  // ===================================================

  const loadWalletDashboard = async () => {
    if (!token) return;

    try {
      setLoading(true);
      setError("");

      const [
        usersRes,
        historyRes,
        statsRes,
      ] = await Promise.all([
        fetch(`${API}/api/admin/wallet`, {
          headers: adminHeaders,
          cache: "no-store",
        }),

        fetch(`${API}/api/admin/wallet/history`, {
          headers: adminHeaders,
          cache: "no-store",
        }),

        fetch(`${API}/api/admin/wallet/statistics`, {
          headers: adminHeaders,
          cache: "no-store",
        }),
      ]);

      const usersData = await usersRes.json();
      const historyData = await historyRes.json();
      const statsData = await statsRes.json();

      console.log("WALLET USERS:", usersData);
      console.log("WALLET HISTORY:", historyData);
      console.log("WALLET STATS:", statsData);

      // USERS
      if (usersRes.ok && usersData.success) {
        setWalletUsers(usersData.users || []);
      } else {
        setWalletUsers([]);
      }

      // HISTORY
      if (historyRes.ok && historyData.success) {
        setWalletHistory(historyData.history || []);
      } else {
        setWalletHistory([]);
      }

      // STATISTICS
      if (statsRes.ok && statsData.success) {
        setStatistics(statsData.statistics);
      } else {
        setStatistics({
          totalUsers: 0,
          totalPKR: 0,
          totalGold: 0,
          totalUSDT: 0,
          totalCredits: 0,
          totalDebits: 0,
        });
      }

    } catch (err: any) {
      console.error("LOAD WALLET DASHBOARD ERROR:", err);

      setError(
        err.message || "Unable to load wallet dashboard."
      );

    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // ===================================================
  // REFRESH WALLET DASHBOARD
  // ===================================================

  const refreshWalletDashboard = async () => {
    setRefreshing(true);
    await loadWalletDashboard();
  };

  // ===================================================
  // ADMIN AUTH CHECK
  // ===================================================

  const checkAdminAuth = async () => {
    if (!token) return;

    try {
      const response = await fetch(
        `${API}/api/admin/auth/check`,
        {
          headers: adminHeaders,
          cache: "no-store",
        }
      );

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
    loadWalletDashboard();
  }, [token]);

  // ===================================================
  // CLEAR SUCCESS / ERROR MESSAGE
  // ===================================================

  useEffect(() => {
    if (!message) return;

    const timer = setTimeout(() => {
      setMessage("");
    }, 4000);

    return () => clearTimeout(timer);
  }, [message]);
    // ===================================================
  // OPEN WALLET MODAL
  // ===================================================

  const openWalletModal = (
    user: WalletUser,
    type: "Credit" | "Debit"
  ) => {
    setSelectedUser(user);
    setTransactionType(type);

    setWalletType("PKR");
    setAmount(0);
    setNote("");

    setWalletModalOpen(true);
  };

  // ===================================================
  // CLOSE WALLET MODAL
  // ===================================================

  const closeWalletModal = () => {
    setWalletModalOpen(false);
    setSelectedUser(null);

    setWalletType("PKR");
    setTransactionType("Credit");

    setAmount(0);
    setNote("");
  };

  // ===================================================
  // SAVE WALLET TRANSACTION
  // POST /api/admin/wallet/transaction
  // ===================================================

  const saveWalletTransaction = async () => {
    if (!selectedUser) return;

    if (amount <= 0) {
      setMessage("Enter a valid amount.");
      setMessageType("error");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        `${API}/api/admin/wallet/transaction`,
        {
          method: "POST",
          headers: adminHeaders,
          body: JSON.stringify({
            userId: selectedUser._id,
            walletType,
            transactionType,
            amount: Number(amount),
            note: note.trim(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Wallet transaction failed."
        );
      }

      setMessage(
        `${walletType} wallet ${transactionType.toLowerCase()} successful.`
      );
      setMessageType("success");

      closeWalletModal();
      await loadWalletDashboard();

    } catch (err: any) {
      console.error("WALLET TRANSACTION ERROR:", err);

      setMessage(
        err.message || "Wallet transaction failed."
      );
      setMessageType("error");

    } finally {
      setLoading(false);
    }
  };

  // ===================================================
  // QUICK CREDIT
  // ===================================================

  const quickCreditWallet = async (
    user: WalletUser,
    wallet: "PKR" | "GOLD" | "USDT",
    value: number
  ) => {
    setSelectedUser(user);
    setWalletType(wallet);
    setTransactionType("Credit");
    setAmount(value);

    await saveWalletTransaction();
  };

  // ===================================================
  // QUICK DEBIT
  // ===================================================

  const quickDebitWallet = async (
    user: WalletUser,
    wallet: "PKR" | "GOLD" | "USDT",
    value: number
  ) => {
    setSelectedUser(user);
    setWalletType(wallet);
    setTransactionType("Debit");
    setAmount(value);

    await saveWalletTransaction();
  };

  // ===================================================
  // TRANSACTION BADGE COLOR
  // ===================================================

  const getTransactionColor = (
    type: "Credit" | "Debit"
  ) => {
    return type === "Credit"
      ? "text-green-400 bg-green-500/10 border border-green-500/30"
      : "text-red-400 bg-red-500/10 border border-red-500/30";
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
            GoldTrade V18 • Enterprise Wallet Manager
          </h1>

          <p className="text-gray-400 mt-2">
            Manage PKR, GOLD and USDT wallets for all users.
          </p>

          <p className="text-gray-500 text-sm mt-1">
            Logged in as{" "}
            <span className="text-green-400 font-semibold">
              {adminName}
            </span>
          </p>
        </div>

        <button
          onClick={refreshWalletDashboard}
          disabled={refreshing}
          className="flex items-center gap-2 bg-yellow-500 hover:bg-yellow-600 disabled:opacity-60 text-black font-semibold px-5 py-3 rounded-xl transition"
        >
          <RefreshCw
            size={18}
            className={refreshing ? "animate-spin" : ""}
          />

          {refreshing ? "Refreshing..." : "Refresh Wallets"}
        </button>

      </div>

      {/* ========================================== */}
      {/* MESSAGE */}
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
      {/* WALLET STATISTICS */}
      {/* ========================================== */}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">

        {/* USERS */}

        <div className="rounded-2xl bg-[#111827] border border-blue-600/30 p-5">
          <div className="flex justify-between items-center mb-3">
            <User className="text-blue-400" size={28} />
            <span className="text-xs font-semibold text-blue-400">
              USERS
            </span>
          </div>

          <p className="text-gray-400 text-sm">Wallet Holders</p>

          <h2 className="text-3xl font-bold text-blue-400 mt-2">
            {statistics.totalUsers}
          </h2>
        </div>

        {/* CREDIT */}

        <div className="rounded-2xl bg-[#111827] border border-green-600/30 p-5">
          <div className="flex justify-between items-center mb-3">
            <PlusCircle className="text-green-400" size={28} />
            <span className="text-xs font-semibold text-green-400">
              CREDIT
            </span>
          </div>

          <p className="text-gray-400 text-sm">Total Credits</p>

          <h2 className="text-3xl font-bold text-green-400 mt-2">
            {statistics.totalCredits}
          </h2>
        </div>

        {/* DEBIT */}

        <div className="rounded-2xl bg-[#111827] border border-red-600/30 p-5">
          <div className="flex justify-between items-center mb-3">
            <MinusCircle className="text-red-400" size={28} />
            <span className="text-xs font-semibold text-red-400">
              DEBIT
            </span>
          </div>

          <p className="text-gray-400 text-sm">Total Debits</p>

          <h2 className="text-3xl font-bold text-red-400 mt-2">
            {statistics.totalDebits}
          </h2>
        </div>

        {/* HISTORY */}

        <div className="rounded-2xl bg-[#111827] border border-purple-600/30 p-5">
          <div className="flex justify-between items-center mb-3">
            <History className="text-purple-400" size={28} />
            <span className="text-xs font-semibold text-purple-400">
              HISTORY
            </span>
          </div>

          <p className="text-gray-400 text-sm">Wallet Transactions</p>

          <h2 className="text-3xl font-bold text-purple-400 mt-2">
            {walletHistory.length}
          </h2>
        </div>

      </div>

      {/* ========================================== */}
      {/* WALLET TOTALS */}
      {/* ========================================== */}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">

        <div className="rounded-2xl bg-[#111827] border border-green-600/20 p-5">
          <div className="flex justify-between items-center mb-2">
            <DollarSign className="text-green-400" size={24} />
            <span className="text-green-400 text-xs font-semibold">PKR</span>
          </div>

          <h3 className="text-2xl font-bold text-green-400">
            PKR {formatMoney(statistics.totalPKR)}
          </h3>

          <p className="text-gray-400 text-sm mt-2">
            Total PKR Balance
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
            Total Gold Balance
          </p>
        </div>

        <div className="rounded-2xl bg-[#111827] border border-cyan-600/20 p-5">
          <div className="flex justify-between items-center mb-2">
            <Wallet className="text-cyan-400" size={24} />
            <span className="text-cyan-400 text-xs font-semibold">USDT</span>
          </div>

          <h3 className="text-2xl font-bold text-cyan-400">
            {statistics.totalUSDT.toFixed(2)} USDT
          </h3>

          <p className="text-gray-400 text-sm mt-2">
            Total USDT Balance
          </p>
        </div>

      </div>

      {/* ========================================== */}
      {/* SEARCH */}
      {/* ========================================== */}

      <div className="rounded-2xl bg-[#111827] border border-gray-700 p-5 mb-8">

        <div className="relative">

          <Search
            size={20}
            className="absolute left-4 top-3.5 text-gray-500"
          />

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search username or email..."
            className="w-full bg-[#1F2937] border border-gray-600 rounded-xl py-3 pl-12 pr-4 outline-none focus:border-yellow-500 transition"
          />

        </div>

      </div>

      {/* ========================================== */}
      {/* WALLET USERS TABLE */}
      {/* ========================================== */}

      <div className="rounded-2xl border border-gray-700 bg-[#111827] overflow-hidden">

        <div className="px-6 py-5 border-b border-gray-700 flex justify-between items-center">

          <h2 className="text-xl font-bold text-yellow-400">
            Wallet Users ({filteredUsers.length})
          </h2>

          <Wallet className="text-yellow-400" />

        </div>

        <div className="overflow-x-auto">

          <table className="w-full min-w-[1250px]">

            <thead className="bg-[#1F2937] text-gray-300 text-sm">

              <tr>
                <th className="text-left px-5 py-4">User</th>
                <th className="text-center">PKR</th>
                <th className="text-center">Gold</th>
                <th className="text-center">USDT</th>
                <th className="text-center">Status</th>
                <th className="text-center">Actions</th>
              </tr>

            </thead>

            <tbody>
                            {loading ? (
                <tr>
                  <td
                    colSpan={6}
                    className="py-12 text-center text-gray-400"
                  >
                    Loading wallet users...
                  </td>
                </tr>

              ) : filteredUsers.length === 0 ? (

                <tr>
                  <td
                    colSpan={6}
                    className="py-12 text-center text-red-300"
                  >
                    No wallet users found.
                  </td>
                </tr>

              ) : (

                filteredUsers.map((user) => (

                  <tr
                    key={user._id}
                    className="border-b border-gray-800 hover:bg-[#1B2435] transition"
                  >

                    {/* USER INFO */}

                    <td className="px-5 py-4">

                      <div className="flex items-center gap-3">

                        <div className="w-11 h-11 rounded-full bg-yellow-500/20 flex items-center justify-center">
                          <User
                            size={20}
                            className="text-yellow-400"
                          />
                        </div>

                        <div>
                          <p className="font-semibold text-white">
                            {user.username}
                          </p>

                          <p className="text-sm text-gray-400">
                            {user.email}
                          </p>
                        </div>

                      </div>

                    </td>

                    {/* PKR */}

                    <td className="text-center">

                      <span className="text-green-400 font-semibold">
                        PKR{" "}
                        {formatMoney(user.wallet?.pkr || 0)}
                      </span>

                    </td>

                    {/* GOLD */}

                    <td className="text-center">

                      <span className="text-yellow-400 font-semibold">
                        {Number(user.wallet?.gold || 0).toFixed(3)} Gold
                      </span>

                    </td>

                    {/* USDT */}

                    <td className="text-center">

                      <span className="text-cyan-400 font-semibold">
                        {Number(user.wallet?.usdt || 0).toFixed(2)} USDT
                      </span>

                    </td>

                    {/* STATUS */}

                    <td className="text-center">

                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          user.status === "Frozen"
                            ? "text-red-400 bg-red-500/10 border border-red-500/30"
                            : "text-green-400 bg-green-500/10 border border-green-500/30"
                        }`}
                      >
                        {user.status}
                      </span>

                    </td>

                    {/* ACTION BUTTONS */}

                    <td className="px-4 py-4">

                      <div className="flex flex-wrap justify-center gap-2">

                        {/* CREDIT */}

                        <button
                          onClick={() =>
                            openWalletModal(user, "Credit")
                          }
                          className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-xs font-semibold transition flex items-center gap-1"
                        >
                          <PlusCircle size={14} />
                          Credit
                        </button>

                        {/* DEBIT */}

                        <button
                          onClick={() =>
                            openWalletModal(user, "Debit")
                          }
                          className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg text-xs font-semibold transition flex items-center gap-1"
                        >
                          <MinusCircle size={14} />
                          Debit
                        </button>

                        {/* HISTORY */}

                        <button
                          onClick={() => {
                            setSearch(user.username);
                          }}
                          className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded-lg text-xs font-semibold transition flex items-center gap-1"
                        >
                          <History size={14} />
                          History
                        </button>

                      </div>

                    </td>

                  </tr>

                ))

              )}

            </tbody>
                      </table>
        </div>
      </div>

      {/* ========================================== */}
      {/* WALLET CREDIT / DEBIT MODAL */}
      {/* ========================================== */}

      {walletModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">

          <div className="w-full max-w-xl rounded-3xl bg-[#111827] border border-yellow-500/30 shadow-2xl overflow-hidden">

            {/* HEADER */}

            <div className="flex justify-between items-center px-6 py-5 border-b border-gray-700">

              <div>
                <h2 className="text-2xl font-bold text-yellow-400">
                  {transactionType} Wallet Balance
                </h2>

                <p className="text-gray-400 text-sm mt-1">
                  {selectedUser.username}
                </p>
              </div>

              <button
                onClick={closeWalletModal}
                className="text-gray-400 hover:text-red-400 transition"
              >
                <XCircle size={28} />
              </button>

            </div>

            {/* BODY */}

            <div className="p-6 space-y-5">

              {/* Wallet Type */}

              <div>
                <label className="block text-sm text-gray-300 mb-2">
                  Wallet Type
                </label>

                <select
                  value={walletType}
                  onChange={(e) =>
                    setWalletType(
                      e.target.value as "PKR" | "GOLD" | "USDT"
                    )
                  }
                  className="w-full bg-[#1F2937] border border-gray-600 rounded-xl px-4 py-3 outline-none focus:border-yellow-500"
                >
                  <option value="PKR">PKR Wallet</option>
                  <option value="GOLD">Gold Wallet</option>
                  <option value="USDT">USDT Wallet</option>
                </select>
              </div>

              {/* Amount */}

              <div>
                <label className="block text-sm text-gray-300 mb-2">
                  Amount
                </label>

                <input
                  type="number"
                  value={amount}
                  onChange={(e) =>
                    setAmount(Number(e.target.value))
                  }
                  placeholder="Enter amount"
                  className="w-full bg-[#1F2937] border border-gray-600 rounded-xl px-4 py-3 outline-none focus:border-yellow-500"
                />
              </div>

              {/* Note */}

              <div>
                <label className="block text-sm text-gray-300 mb-2">
                  Admin Note
                </label>

                <textarea
                  rows={3}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Reason for credit / debit"
                  className="w-full bg-[#1F2937] border border-gray-600 rounded-xl px-4 py-3 outline-none resize-none focus:border-yellow-500"
                />
              </div>

            </div>

            {/* FOOTER */}

            <div className="border-t border-gray-700 px-6 py-5 flex justify-end gap-3">

              <button
                onClick={closeWalletModal}
                className="bg-gray-700 hover:bg-gray-600 px-5 py-3 rounded-xl font-semibold transition"
              >
                Cancel
              </button>

              <button
                onClick={saveWalletTransaction}
                disabled={loading}
                className={`px-5 py-3 rounded-xl font-semibold flex items-center gap-2 transition ${
                  transactionType === "Credit"
                    ? "bg-green-600 hover:bg-green-700"
                    : "bg-red-600 hover:bg-red-700"
                } disabled:opacity-60`}
              >
                <Save size={18} />

                {transactionType} Wallet
              </button>

            </div>

          </div>

        </div>
      )}

      {/* ========================================== */}
      {/* RECENT WALLET HISTORY */}
      {/* ========================================== */}

      <div className="rounded-2xl border border-gray-700 bg-[#111827] overflow-hidden mt-10 mb-10">

        <div className="px-6 py-5 border-b border-gray-700 flex justify-between items-center">

          <h2 className="text-xl font-bold text-purple-400">
            Recent Wallet Transactions
          </h2>

          <History className="text-purple-400" />

        </div>

        <div className="overflow-x-auto">

          <table className="w-full min-w-[1100px]">

            <thead className="bg-[#1F2937] text-gray-300 text-sm">

              <tr>
                <th className="text-left px-5 py-4">User</th>
                <th className="text-center">Wallet</th>
                <th className="text-center">Type</th>
                <th className="text-center">Amount</th>
                <th className="text-center">Admin Note</th>
                <th className="text-center">Date</th>
              </tr>

            </thead>

            <tbody>

              {recentHistory.length === 0 ? (

                <tr>
                  <td
                    colSpan={6}
                    className="py-12 text-center text-gray-400"
                  >
                    Wallet history not found.
                  </td>
                </tr>

              ) : (

                recentHistory.map((item) => (

                  <tr
                    key={item._id}
                    className="border-b border-gray-800 hover:bg-[#1B2435]"
                  >

                    <td className="px-5 py-4 font-semibold">
                      {item.username}
                    </td>

                    <td
                      className={`text-center font-semibold ${getWalletColor(
                        item.walletType
                      )}`}
                    >
                      {item.walletType}
                    </td>

                    <td className="text-center">

                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${getTransactionColor(
                          item.type
                        )}`}
                      >
                        {item.type}
                      </span>

                    </td>

                    <td className="text-center font-semibold">

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

                    <td className="text-center text-gray-300">
                      {item.note || "--"}
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

      {/* ========================================== */}
      {/* LOADING OVERLAY */}
      {/* ========================================== */}

      {loading && (
        <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center">

          <div className="bg-[#111827] border border-yellow-500/30 rounded-2xl px-8 py-6 flex flex-col items-center gap-4">

            <RefreshCw
              size={36}
              className="animate-spin text-yellow-400"
            />

            <h3 className="text-xl font-bold text-yellow-400">
              GoldTrade V18 Enterprise
            </h3>

            <p className="text-gray-300">
              Processing wallet transaction...
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
              PKR • GOLD • USDT Wallet Management System
            </p>

          </div>

          <div className="flex flex-wrap gap-5 text-sm text-gray-400">

            <div className="flex items-center gap-2">
              <Shield size={16} className="text-green-400" />
              Secure Wallet Control
            </div>

            <div className="flex items-center gap-2">
              <History size={16} className="text-purple-400" />
              Transaction History
            </div>

            <div className="flex items-center gap-2">
              <Wallet size={16} className="text-cyan-400" />
              Enterprise Wallet Manager
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