"use client";

/* =========================================================
   GoldTrade V18 Enterprise
   Admin Wallet Manager
   SECTION 1/4 (Foundation)
   ========================================================= */

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Wallet,
  Users,
  ShieldCheck,
  RefreshCw,
  Search,
  Filter,
  Lock,
  Unlock,
  DollarSign,
  Coins,
  CheckCircle,
  XCircle,
  ArrowDownRight,
  ArrowUpRight,
} from "lucide-react";

/* =========================================================
   API URL
   ========================================================= */

const API =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

/* =========================================================
   Interfaces
   ========================================================= */

interface WalletUser {
  _id: string;
  username: string;
  fullName?: string;
  email?: string;

  pkrBalance: number;
  goldBalance: number;
  usdtBalance: number;

  walletFrozen: boolean;
  createdAt: string;
}

interface WalletStats {
  totalUsers: number;
  activeWallets: number;
  frozenWallets: number;

  totalPKR: number;
  totalGold: number;
  totalUSDT: number;
}

/* =========================================================
   Component
   ========================================================= */

export default function AdminWalletPage() {
  /* ---------------- Loading ---------------- */

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  /* ---------------- Users ---------------- */

  const [walletUsers, setWalletUsers] = useState<WalletUser[]>([]);

  /* ---------------- Dashboard Stats ---------------- */

  const [stats, setStats] = useState<WalletStats>({
    totalUsers: 0,
    activeWallets: 0,
    frozenWallets: 0,
    totalPKR: 0,
    totalGold: 0,
    totalUSDT: 0,
  });

  /* ---------------- Search & Filters ---------------- */

  const [search, setSearch] = useState("");
  const [walletFilter, setWalletFilter] = useState<
    "ALL" | "ACTIVE" | "FROZEN"
  >("ALL");

  /* ---------------- Pagination ---------------- */

  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  /* ---------------- Freeze Panel ---------------- */

  const [selectedUser, setSelectedUser] =
    useState<WalletUser | null>(null);

  const [showFreezePanel, setShowFreezePanel] = useState(false);
  const [freezeReason, setFreezeReason] = useState("");
  const [freezeLoading, setFreezeLoading] = useState(false);

  /* ---------------- Credit / Debit Panel ---------------- */

  const [showTransactionPanel, setShowTransactionPanel] =
    useState(false);

  const [transactionLoading, setTransactionLoading] =
    useState(false);

  const [walletType, setWalletType] = useState<
    "PKR" | "GOLD" | "USDT"
  >("PKR");

  const [transactionType, setTransactionType] = useState<
    "credit" | "debit"
  >("credit");

  const [amount, setAmount] = useState("");
  const [transactionNote, setTransactionNote] = useState("");

  /* =========================================================
     JWT Header Helper
     ========================================================= */

  const getHeaders = () => {
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("token")
        : "";

    return {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };
  };

  /* =========================================================
     API — Load Wallet Users
     GET /api/admin/wallet/users
     ========================================================= */

  const loadWalletUsers = async () => {
    const response = await fetch(
      `${API}/api/admin/wallet/users`,
      {
        headers: getHeaders(),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Unable to load wallet users.");
    }

    setWalletUsers(data.users || []);
  };

  /* =========================================================
     API — Load Dashboard Statistics
     GET /api/gold/admin/dashboard
     ========================================================= */

  const loadWalletStats = async () => {
    const response = await fetch(
      `${API}/api/admin/wallet/stats`,
      {
        headers: getHeaders(),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Unable to load wallet statistics.");
    }

    setStats({
      totalUsers: Number(data.totalUsers || 0),
      activeWallets: Number(data.activeWallets || 0),
      frozenWallets: Number(data.frozenWallets || 0),
      totalPKR: Number(data.totalPKR || 0),
      totalGold: Number(data.totalGold || 0),
      totalUSDT: Number(data.totalUSDT || 0),
    });
  };

  /* =========================================================
     Load Complete Dashboard
     ========================================================= */

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setErrorMessage("");

      await Promise.all([
        loadWalletUsers(),
        loadWalletStats(),
      ]);
    } catch (error: any) {
      setErrorMessage(
        error.message || "Unable to load dashboard."
      );
    } finally {
      setLoading(false);
    }
  };

  /* =========================================================
     Refresh Dashboard
     ========================================================= */

  const refreshDashboard = async () => {
    try {
      setRefreshing(true);
      await loadDashboard();
    } finally {
      setRefreshing(false);
    }
  };

  /* =========================================================
     Freeze / Unfreeze Wallet
     POST /api/admin/wallet/freeze
     ========================================================= */

  const toggleWalletFreeze = async (
    username: string,
    freeze: boolean
  ) => {
    try {
      setFreezeLoading(true);

      const response = await fetch(
        `${API}/api/admin/wallet/freeze`,
        {
          method: "POST",
          headers: getHeaders(),
          body: JSON.stringify({
            username,
            freeze,
            reason: freezeReason,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Wallet update failed.");
      }

      setShowFreezePanel(false);
      setSelectedUser(null);
      setFreezeReason("");

      await loadWalletUsers();
    } catch (error: any) {
      alert(error.message);
    } finally {
      setFreezeLoading(false);
    }
  };

  /* =========================================================
     Manual Credit / Debit
     POST /api/admin/wallet/manual-transaction
     ========================================================= */

  const submitManualTransaction = async () => {
    if (!selectedUser) return;

    if (!amount || Number(amount) <= 0) {
      alert("Enter valid amount.");
      return;
    }

    try {
      setTransactionLoading(true);

      const response = await fetch(
        `${API}/api/admin/wallet/manual-transaction`,
        {
          method: "POST",
          headers: getHeaders(),
          body: JSON.stringify({
            username: selectedUser.username,
            walletType,
            transactionType,
            amount: Number(amount),
            note: transactionNote,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Transaction failed.");
      }

      alert("Wallet updated successfully.");

      setShowTransactionPanel(false);
      setAmount("");
      setTransactionNote("");

      await loadDashboard();
    } catch (error: any) {
      alert(error.message);
    } finally {
      setTransactionLoading(false);
    }
  };

  /* =========================================================
     Initial Load
     ========================================================= */

  useEffect(() => {
    loadDashboard();
  }, []);

  /* =========================================================
     Search Filter
     ========================================================= */

  const filteredUsers = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return walletUsers.filter((user) => {
      const searchMatch =
        keyword === "" ||
        user.username.toLowerCase().includes(keyword) ||
        user.fullName?.toLowerCase().includes(keyword) ||
        user.email?.toLowerCase().includes(keyword);

      const statusMatch =
        walletFilter === "ALL" ||
        (walletFilter === "ACTIVE" && !user.walletFrozen) ||
        (walletFilter === "FROZEN" && user.walletFrozen);

      return searchMatch && statusMatch;
    });
  }, [walletUsers, search, walletFilter]);

  /* =========================================================
     Pagination
     ========================================================= */

  const totalPages = Math.max(
    1,
    Math.ceil(filteredUsers.length / rowsPerPage)
  );

  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filteredUsers.slice(start, start + rowsPerPage);
  }, [filteredUsers, currentPage]);

  /* =========================================================
     Wallet Analytics
     ========================================================= */

  const walletAnalytics = useMemo(() => {
    let active = 0;
    let frozen = 0;

    let pkr = 0;
    let gold = 0;
    let usdt = 0;

    walletUsers.forEach((user) => {
      if (user.walletFrozen) frozen++;
      else active++;

      pkr += Number(user.pkrBalance || 0);
      gold += Number(user.goldBalance || 0);
      usdt += Number(user.usdtBalance || 0);
    });

    return {
      active,
      frozen,
      total: walletUsers.length,
      totalPKR: pkr,
      totalGold: gold,
      totalUSDT: usdt,
    };
  }, [walletUsers]);

  /* =========================================================
     Clear Filters
     ========================================================= */

  const clearFilters = () => {
    setSearch("");
    setWalletFilter("ALL");
    setCurrentPage(1);
  };

  /* =========================================================
     Loading Screen
     ========================================================= */

  if (loading) {
    return (
      <main className="min-h-screen bg-black flex items-center justify-center">
        <div className="flex items-center gap-3 text-cyan-400 text-xl font-bold">
          <RefreshCw className="animate-spin" size={28} />
          Loading Admin Wallet Dashboard...
        </div>
      </main>
    );
  }

  /* =========================================================
     Page Start
     ========================================================= */

  return (
    <main className="min-h-screen bg-black text-white p-6">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* ============================================= */}
        {/* HEADER */}
        {/* ============================================= */}

        <header className="flex flex-wrap justify-between items-center gap-5">

          <div>
            <h1 className="flex items-center gap-3 text-4xl font-black text-cyan-400">
              <ShieldCheck size={36} />
              Admin Wallet Manager
            </h1>

            <p className="text-gray-400 mt-2">
              Manage PKR, Gold and USDT wallets for all GoldTrade users.
            </p>
          </div>

          <div className="flex gap-3 flex-wrap">
            <Link
              href="/admin"
              className="bg-zinc-800 hover:bg-zinc-700 px-5 py-3 rounded-xl font-bold transition"
            >
              Admin Dashboard
            </Link>

            <button
              onClick={refreshDashboard}
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
        {/* WALLET DASHBOARD STATS */}
        {/* ============================================= */}

        <section className="space-y-6">

          <div className="flex justify-between items-center flex-wrap gap-3">
            <h2 className="text-3xl font-black text-cyan-400">
              Wallet Dashboard Overview
            </h2>

            <span className="bg-cyan-500/20 border border-cyan-500 text-cyan-400 px-4 py-2 rounded-full text-sm font-bold">
              LIVE ADMIN
            </span>
          </div>

          {/* ROW 1 */}

          <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-5">

            <div className="bg-zinc-900 border border-blue-500 rounded-2xl p-5">
              <Users className="text-blue-400 mb-3" size={28} />

              <p className="text-gray-500 text-sm">Total Users</p>

              <h2 className="text-3xl font-black text-blue-400 mt-2">
                {stats.totalUsers}
              </h2>
            </div>

            <div className="bg-zinc-900 border border-green-500 rounded-2xl p-5">
              <Unlock className="text-green-400 mb-3" size={28} />

              <p className="text-gray-500 text-sm">Active Wallets</p>

              <h2 className="text-3xl font-black text-green-400 mt-2">
                {walletAnalytics.active}
              </h2>
            </div>

            <div className="bg-zinc-900 border border-red-500 rounded-2xl p-5">
              <Lock className="text-red-400 mb-3" size={28} />

              <p className="text-gray-500 text-sm">Frozen Wallets</p>

              <h2 className="text-3xl font-black text-red-400 mt-2">
                {walletAnalytics.frozen}
              </h2>
            </div>

            <div className="bg-zinc-900 border border-purple-500 rounded-2xl p-5">
              <Wallet className="text-purple-400 mb-3" size={28} />

              <p className="text-gray-500 text-sm">Wallet Records</p>

              <h2 className="text-3xl font-black text-purple-400 mt-2">
                {walletAnalytics.total}
              </h2>
            </div>

          </div>

          {/* ROW 2 */}

          <div className="grid md:grid-cols-3 gap-5">

            <div className="bg-zinc-900 border border-green-500 rounded-2xl p-5">
              <DollarSign className="text-green-400 mb-3" size={26} />

              <p className="text-gray-500 text-sm">Total PKR Balance</p>

              <h2 className="text-3xl font-black text-green-400 mt-2">
                PKR {walletAnalytics.totalPKR.toLocaleString()}
              </h2>
            </div>

            <div className="bg-zinc-900 border border-yellow-500 rounded-2xl p-5">
              <Coins className="text-yellow-400 mb-3" size={26} />

              <p className="text-gray-500 text-sm">Total Gold Holdings</p>

              <h2 className="text-3xl font-black text-yellow-400 mt-2">
                {walletAnalytics.totalGold.toFixed(4)} g
              </h2>
            </div>

            <div className="bg-zinc-900 border border-cyan-500 rounded-2xl p-5">
              <DollarSign className="text-cyan-400 mb-3" size={26} />

              <p className="text-gray-500 text-sm">Total USDT Holdings</p>

              <h2 className="text-3xl font-black text-cyan-400 mt-2">
                {walletAnalytics.totalUSDT.toFixed(2)} USDT
              </h2>
            </div>

          </div>

        </section>

        {/* ============================================= */}
        {/* SEARCH + FILTER TOOLBAR */}
        {/* ============================================= */}

        <section className="bg-zinc-900 border border-cyan-500 rounded-2xl p-6 space-y-6">

          <div className="flex justify-between items-center flex-wrap gap-4">
            <div>
              <h2 className="text-2xl font-black text-cyan-400">
                Wallet User Search Center
              </h2>

              <p className="text-gray-400 text-sm mt-2">
                Search users and filter active or frozen wallets.
              </p>
            </div>

            <button
              onClick={clearFilters}
              className="bg-red-500 hover:bg-red-400 text-black px-4 py-3 rounded-xl font-bold transition"
            >
              Clear Filters
            </button>
          </div>

          {/* SEARCH + FILTER */}

          <div className="grid lg:grid-cols-3 gap-5">

            {/* SEARCH */}

            <div className="relative lg:col-span-2">
              <Search
                size={18}
                className="absolute left-4 top-4 text-gray-500"
              />

              <input
                type="text"
                placeholder="Search username, full name or email"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full bg-black border border-zinc-700 rounded-xl pl-11 pr-4 py-3 text-white focus:border-cyan-500 outline-none"
              />
            </div>

            {/* FILTER */}

            <div className="relative">
              <Filter
                size={18}
                className="absolute left-4 top-4 text-gray-500"
              />

              <select
                value={walletFilter}
                onChange={(e) => {
                  setWalletFilter(
                    e.target.value as "ALL" | "ACTIVE" | "FROZEN"
                  );
                  setCurrentPage(1);
                }}
                className="w-full bg-black border border-zinc-700 rounded-xl pl-11 pr-4 py-3 text-white appearance-none focus:border-cyan-500 outline-none"
              >
                <option value="ALL">All Wallets</option>
                <option value="ACTIVE">Active Wallets</option>
                <option value="FROZEN">Frozen Wallets</option>
              </select>
            </div>

          </div>

          {/* ACTIVE FILTER BAR */}

          <div className="flex flex-wrap gap-3">

            <span className="bg-black border border-zinc-700 px-4 py-2 rounded-full text-sm">
              Search:
              <span className="text-cyan-400 font-bold ml-2">
                {search || "None"}
              </span>
            </span>

            <span className="bg-black border border-zinc-700 px-4 py-2 rounded-full text-sm">
              Wallet Filter:
              <span className="text-green-400 font-bold ml-2">
                {walletFilter}
              </span>
            </span>

            <span className="bg-black border border-zinc-700 px-4 py-2 rounded-full text-sm">
              Results:
              <span className="text-purple-400 font-bold ml-2">
                {filteredUsers.length}
              </span>
            </span>

          </div>

        </section>

        {/* ============================================= */}
        {/* DESKTOP WALLET USERS TABLE */}
        {/* ============================================= */}

        <section className="hidden lg:block bg-zinc-900 border border-cyan-500 rounded-2xl overflow-hidden">

          <div className="px-6 py-5 border-b border-zinc-800 flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-black text-cyan-400">
                Wallet Users
              </h2>

              <p className="text-gray-400 text-sm mt-1">
                PKR, Gold and USDT balances for every user.
              </p>
            </div>

            <span className="bg-cyan-500/20 border border-cyan-500 text-cyan-400 px-4 py-2 rounded-full text-sm font-bold">
              {filteredUsers.length} Users
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1300px]">

              <thead className="bg-black text-gray-400 text-sm">

                <tr>
                  <th className="px-5 py-4 text-left">User</th>
                  <th className="px-5 py-4 text-left">PKR Wallet</th>
                  <th className="px-5 py-4 text-left">Gold Wallet</th>
                  <th className="px-5 py-4 text-left">USDT Wallet</th>
                  <th className="px-5 py-4 text-left">Status</th>
                  <th className="px-5 py-4 text-left">Created</th>
                  <th className="px-5 py-4 text-center">Actions</th>
                </tr>

              </thead>

              <tbody>

                {paginatedUsers.length === 0 ? (

                  <tr>
                    <td
                      colSpan={7}
                      className="text-center py-12 text-gray-500"
                    >
                      No wallet users found.
                    </td>
                  </tr>

                ) : (

                  paginatedUsers.map((user) => (

                    <tr
                      key={user._id}
                      className="border-t border-zinc-800 hover:bg-zinc-800/40 transition"
                    >

                      {/* USER */}

                      <td className="px-5 py-4">

                        <div className="space-y-1">

                          <h3 className="font-bold text-white">
                            {user.username}
                          </h3>

                          <p className="text-sm text-gray-400">
                            {user.fullName || "No Full Name"}
                          </p>

                          <p className="text-xs text-gray-500">
                            {user.email || "No Email"}
                          </p>

                        </div>

                      </td>

                      {/* PKR */}

                      <td className="px-5 py-4">

                        <span className="inline-flex px-3 py-2 rounded-lg bg-green-500/10 border border-green-500 text-green-400 font-bold">
                          PKR {Number(user.pkrBalance).toLocaleString()}
                        </span>

                      </td>

                      {/* GOLD */}

                      <td className="px-5 py-4">

                        <span className="inline-flex px-3 py-2 rounded-lg bg-yellow-500/10 border border-yellow-500 text-yellow-400 font-bold">
                          {Number(user.goldBalance).toFixed(4)} g
                        </span>

                      </td>

                      {/* USDT */}

                      <td className="px-5 py-4">

                        <span className="inline-flex px-3 py-2 rounded-lg bg-cyan-500/10 border border-cyan-500 text-cyan-400 font-bold">
                          {Number(user.usdtBalance).toFixed(2)} USDT
                        </span>

                      </td>

                      {/* STATUS */}

                      <td className="px-5 py-4">

                        {user.walletFrozen ? (
                          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/20 border border-red-500 text-red-400 text-sm font-bold">
                            <Lock size={14} />
                            Frozen
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/20 border border-green-500 text-green-400 text-sm font-bold">
                            <Unlock size={14} />
                            Active
                          </span>
                        )}

                      </td>

                      {/* CREATED */}

                      <td className="px-5 py-4 text-gray-300 text-sm">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>

                      {/* ACTIONS */}

                      <td className="px-5 py-4">

                        <div className="flex justify-center flex-wrap gap-2">

                          <button
                            onClick={() => {
                              setSelectedUser(user);
                              setShowFreezePanel(true);
                              setFreezeReason("");
                            }}
                            className={`px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition ${
                              user.walletFrozen
                                ? "bg-green-500 hover:bg-green-400 text-black"
                                : "bg-red-500 hover:bg-red-400 text-black"
                            }`}
                          >
                            {user.walletFrozen ? (
                              <>
                                <Unlock size={14} />
                                Unfreeze
                              </>
                            ) : (
                              <>
                                <Lock size={14} />
                                Freeze
                              </>
                            )}
                          </button>

                          <button
                            onClick={() => {
                              setSelectedUser(user);
                              setTransactionType("credit");
                              setWalletType("PKR");
                              setShowTransactionPanel(true);
                            }}
                            className="bg-cyan-500 hover:bg-cyan-400 text-black px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition"
                          >
                            <CheckCircle size={14} />
                            Credit
                          </button>

                          <button
                            onClick={() => {
                              setSelectedUser(user);
                              setTransactionType("debit");
                              setWalletType("PKR");
                              setShowTransactionPanel(true);
                            }}
                            className="bg-orange-500 hover:bg-orange-400 text-black px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition"
                          >
                            <XCircle size={14} />
                            Debit
                          </button>

                        </div>

                      </td>

                    </tr>

                  ))

                )}

              </tbody>

            </table>
          </div>

        </section>

        {/* ============================================= */}
        {/* MOBILE WALLET USER CARDS */}
        {/* ============================================= */}

        <section className="lg:hidden space-y-5">

          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-black text-cyan-400">
              Wallet Users
            </h2>

            <span className="text-sm text-gray-400">
              {filteredUsers.length} Users
            </span>
          </div>

          {paginatedUsers.length === 0 ? (

            <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-8 text-center">
              <Users size={46} className="mx-auto text-gray-600 mb-4" />

              <h3 className="text-lg font-bold text-gray-400">
                No Wallet Users Found
              </h3>

              <p className="text-gray-500 mt-2 text-sm">
                Try changing the search or wallet filter.
              </p>
            </div>

          ) : (

            paginatedUsers.map((user) => (

              <div
                key={user._id}
                className="bg-zinc-900 border border-zinc-700 rounded-2xl p-5 space-y-5"
              >

                {/* USER INFO */}

                <div className="flex justify-between items-start">

                  <div>
                    <h3 className="text-xl font-black text-white">
                      {user.username}
                    </h3>

                    <p className="text-sm text-gray-400 mt-1">
                      {user.fullName || "No Full Name"}
                    </p>

                    <p className="text-xs text-gray-500 mt-1">
                      {user.email || "No Email"}
                    </p>
                  </div>

                  {user.walletFrozen ? (
                    <span className="bg-red-500/20 border border-red-500 text-red-400 px-3 py-1 rounded-full text-xs font-bold">
                      Frozen
                    </span>
                  ) : (
                    <span className="bg-green-500/20 border border-green-500 text-green-400 px-3 py-1 rounded-full text-xs font-bold">
                      Active
                    </span>
                  )}

                </div>

                {/* BALANCES */}

                <div className="grid grid-cols-2 gap-4">

                  <div className="bg-black border border-green-500 rounded-xl p-4">
                    <p className="text-xs text-gray-500 uppercase">
                      PKR Wallet
                    </p>

                    <h4 className="text-lg font-black text-green-400 mt-2">
                      PKR {Number(user.pkrBalance).toLocaleString()}
                    </h4>
                  </div>

                  <div className="bg-black border border-yellow-500 rounded-xl p-4">
                    <p className="text-xs text-gray-500 uppercase">
                      Gold Wallet
                    </p>

                    <h4 className="text-lg font-black text-yellow-400 mt-2">
                      {Number(user.goldBalance).toFixed(4)} g
                    </h4>
                  </div>

                  <div className="bg-black border border-cyan-500 rounded-xl p-4 col-span-2">
                    <p className="text-xs text-gray-500 uppercase">
                      USDT Wallet
                    </p>

                    <h4 className="text-lg font-black text-cyan-400 mt-2">
                      {Number(user.usdtBalance).toFixed(2)} USDT
                    </h4>
                  </div>

                </div>

                {/* CREATED */}

                <div className="bg-black border border-zinc-700 rounded-xl p-4">
                  <p className="text-xs text-gray-500 uppercase">
                    Wallet Created
                  </p>

                  <p className="text-sm text-gray-300 mt-2">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </p>
                </div>

                {/* ACTIONS */}

                <div className="grid grid-cols-2 gap-3">

                  <button
                    onClick={() => {
                      setSelectedUser(user);
                      setShowFreezePanel(true);
                      setFreezeReason("");
                    }}
                    className={`py-3 rounded-xl font-bold flex justify-center items-center gap-2 transition ${
                      user.walletFrozen
                        ? "bg-green-500 hover:bg-green-400 text-black"
                        : "bg-red-500 hover:bg-red-400 text-black"
                    }`}
                  >
                    {user.walletFrozen ? (
                      <>
                        <Unlock size={18} />
                        Unfreeze
                      </>
                    ) : (
                      <>
                        <Lock size={18} />
                        Freeze
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => {
                      setSelectedUser(user);
                      setTransactionType("credit");
                      setWalletType("PKR");
                      setShowTransactionPanel(true);
                    }}
                    className="bg-cyan-500 hover:bg-cyan-400 text-black py-3 rounded-xl font-bold flex justify-center items-center gap-2 transition"
                  >
                    <CheckCircle size={18} />
                    Credit
                  </button>

                  <button
                    onClick={() => {
                      setSelectedUser(user);
                      setTransactionType("debit");
                      setWalletType("PKR");
                      setShowTransactionPanel(true);
                    }}
                    className="bg-orange-500 hover:bg-orange-400 text-black py-3 rounded-xl font-bold flex justify-center items-center gap-2 transition"
                  >
                    <XCircle size={18} />
                    Debit
                  </button>

                  <button
                    onClick={() => {
                      setSelectedUser(user);
                    }}
                    className="bg-zinc-800 hover:bg-zinc-700 py-3 rounded-xl font-bold flex justify-center items-center gap-2 transition"
                  >
                    <Wallet size={18} />
                    View Wallet
                  </button>

                </div>

              </div>

            ))

          )}

        </section>

        {/* ============================================= */}
        {/* FREEZE / UNFREEZE MODAL */}
        {/* ============================================= */}

        {showFreezePanel && selectedUser && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-zinc-900 border border-red-500 rounded-2xl w-full max-w-lg p-6 space-y-5">

              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-black text-red-400">
                  {selectedUser.walletFrozen ? "Unfreeze Wallet" : "Freeze Wallet"}
                </h2>

                <button
                  onClick={() => {
                    setShowFreezePanel(false);
                    setSelectedUser(null);
                    setFreezeReason("");
                  }}
                  className="text-gray-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <div className="bg-black rounded-xl border border-zinc-700 p-4 space-y-2">
                <p className="text-gray-500 text-sm">Username</p>
                <h3 className="font-bold text-xl">{selectedUser.username}</h3>

                <p className="text-gray-500 text-sm mt-3">Current Status</p>

                {selectedUser.walletFrozen ? (
                  <span className="inline-flex items-center gap-2 bg-red-500/20 border border-red-500 text-red-400 px-3 py-1 rounded-full text-sm font-bold">
                    <Lock size={14} /> Frozen
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-2 bg-green-500/20 border border-green-500 text-green-400 px-3 py-1 rounded-full text-sm font-bold">
                    <Unlock size={14} /> Active
                  </span>
                )}
              </div>

              <div>
                <label className="block mb-2 text-sm text-gray-300 font-semibold">
                  Reason
                </label>

                <textarea
                  rows={4}
                  value={freezeReason}
                  onChange={(e) => setFreezeReason(e.target.value)}
                  placeholder="Reason for freeze / unfreeze"
                  className="w-full bg-black border border-zinc-700 rounded-xl p-4 text-white resize-none focus:border-red-500 outline-none"
                />
              </div>

              <div className="flex gap-3">
                <button
                  disabled={freezeLoading}
                  onClick={() =>
                    toggleWalletFreeze(
                      selectedUser.username,
                      !selectedUser.walletFrozen
                    )
                  }
                  className={`flex-1 py-3 rounded-xl font-bold transition ${
                    selectedUser.walletFrozen
                      ? "bg-green-500 hover:bg-green-400 text-black"
                      : "bg-red-500 hover:bg-red-400 text-black"
                  }`}
                >
                  {freezeLoading
                    ? "Processing..."
                    : selectedUser.walletFrozen
                    ? "Unfreeze Wallet"
                    : "Freeze Wallet"}
                </button>

                <button
                  onClick={() => {
                    setShowFreezePanel(false);
                    setSelectedUser(null);
                    setFreezeReason("");
                  }}
                  className="flex-1 py-3 rounded-xl bg-zinc-700 hover:bg-zinc-600 font-bold"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ============================================= */}
        {/* CREDIT / DEBIT MODAL */}
        {/* ============================================= */}

        {showTransactionPanel && selectedUser && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-zinc-900 border border-cyan-500 rounded-2xl w-full max-w-xl p-6 space-y-5">

              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-black text-cyan-400">
                  Manual Wallet Transaction
                </h2>

                <button
                  onClick={() => {
                    setShowTransactionPanel(false);
                    setAmount("");
                    setTransactionNote("");
                  }}
                  className="text-gray-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <div className="bg-black border border-zinc-700 rounded-xl p-4 space-y-2">
                <p className="text-gray-500 text-sm">Wallet User</p>
                <h3 className="text-xl font-bold">{selectedUser.username}</h3>
              </div>

              <div className="grid md:grid-cols-2 gap-4">

                <div>
                  <label className="block mb-2 text-sm text-gray-300 font-semibold">
                    Wallet Type
                  </label>

                  <select
                    value={walletType}
                    onChange={(e) =>
                      setWalletType(
                        e.target.value as "PKR" | "GOLD" | "USDT"
                      )
                    }
                    className="w-full bg-black border border-zinc-700 rounded-xl p-3 text-white"
                  >
                    <option value="PKR">PKR Wallet</option>
                    <option value="GOLD">Gold Wallet</option>
                    <option value="USDT">USDT Wallet</option>
                  </select>
                </div>

                <div>
                  <label className="block mb-2 text-sm text-gray-300 font-semibold">
                    Transaction Type
                  </label>

                  <select
                    value={transactionType}
                    onChange={(e) =>
                      setTransactionType(
                        e.target.value as "credit" | "debit"
                      )
                    }
                    className="w-full bg-black border border-zinc-700 rounded-xl p-3 text-white"
                  >
                    <option value="credit">Credit</option>
                    <option value="debit">Debit</option>
                  </select>
                </div>

              </div>

              <div>
                <label className="block mb-2 text-sm text-gray-300 font-semibold">
                  Amount
                </label>

                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Enter amount"
                  className="w-full bg-black border border-zinc-700 rounded-xl p-3 text-white"
                />
              </div>

              <div>
                <label className="block mb-2 text-sm text-gray-300 font-semibold">
                  Admin Note
                </label>

                <textarea
                  rows={4}
                  value={transactionNote}
                  onChange={(e) => setTransactionNote(e.target.value)}
                  placeholder="Reason for manual transaction"
                  className="w-full bg-black border border-zinc-700 rounded-xl p-4 text-white resize-none"
                />
              </div>

              <div className="flex gap-3">
                <button
                  disabled={transactionLoading}
                  onClick={submitManualTransaction}
                  className="flex-1 bg-cyan-500 hover:bg-cyan-400 text-black py-3 rounded-xl font-bold"
                >
                  {transactionLoading
                    ? "Processing..."
                    : transactionType === "credit"
                    ? "Credit Wallet"
                    : "Debit Wallet"}
                </button>

                <button
                  onClick={() => {
                    setShowTransactionPanel(false);
                    setAmount("");
                    setTransactionNote("");
                  }}
                  className="flex-1 bg-zinc-700 hover:bg-zinc-600 py-3 rounded-xl font-bold"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ============================================= */}
        {/* PAGINATION */}
        {/* ============================================= */}

        <section className="bg-zinc-900 border border-cyan-500 rounded-2xl p-6 space-y-6">

          <div className="flex flex-wrap justify-between items-center gap-4">
            <div>
              <h2 className="text-2xl font-black text-cyan-400">
                Wallet User Pagination
              </h2>

              <p className="text-gray-400 text-sm mt-2">
                Showing {(currentPage - 1) * rowsPerPage + 1} to {Math.min(currentPage * rowsPerPage, filteredUsers.length)} of {filteredUsers.length} users.
              </p>
            </div>

            <span className="bg-purple-500/20 border border-purple-500 text-purple-400 px-4 py-2 rounded-full font-bold text-sm">
              Page {currentPage} / {totalPages}
            </span>
          </div>

          <div className="flex flex-wrap justify-center gap-2">

            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 font-bold"
            >
              Previous
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`w-10 h-10 rounded-lg font-bold transition ${
                  currentPage === page
                    ? "bg-cyan-500 text-black"
                    : "bg-zinc-800 hover:bg-zinc-700"
                }`}
              >
                {page}
              </button>
            ))}

            <button
              disabled={currentPage === totalPages}
              onClick={() =>
                setCurrentPage((p) => Math.min(p + 1, totalPages))
              }
              className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 font-bold"
            >
              Next
            </button>

          </div>
        </section>

        {/* ============================================= */}
        {/* FOOTER */}
        {/* ============================================= */}

        <footer className="border-t border-zinc-800 pt-8 pb-6">

          <div className="grid md:grid-cols-3 gap-8">

            <div>
              <h3 className="text-lg font-black text-cyan-400 mb-3">
                GoldTrade Admin Wallet
              </h3>

              <p className="text-gray-500 text-sm leading-6">
                Enterprise wallet management for PKR, Gold and USDT balances with admin credit, debit, freeze and monitoring tools.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-black text-green-400 mb-3">
                Available Tools
              </h3>

              <ul className="space-y-2 text-gray-500 text-sm">
                <li>• Wallet Search</li>
                <li>• Wallet Filters</li>
                <li>• Freeze / Unfreeze Wallet</li>
                <li>• Manual Credit</li>
                <li>• Manual Debit</li>
                <li>• Wallet Analytics</li>
                <li>• Pagination</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-black text-purple-400 mb-3">
                Platform Summary
              </h3>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Users</span>
                  <span className="font-bold text-white">{walletAnalytics.total}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-500">Active Wallets</span>
                  <span className="font-bold text-green-400">{walletAnalytics.active}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-500">Frozen Wallets</span>
                  <span className="font-bold text-red-400">{walletAnalytics.frozen}</span>
                </div>
              </div>
            </div>

          </div>

          <div className="border-t border-zinc-800 mt-8 pt-6 flex flex-wrap justify-between items-center gap-4">
            <p className="text-gray-500 text-sm">
              © 2026 GoldTrade V18 Enterprise Admin Wallet Manager.
            </p>

            <button
              onClick={refreshDashboard}
              className="bg-cyan-500 hover:bg-cyan-400 text-black px-5 py-2 rounded-lg font-bold flex items-center gap-2 transition"
            >
              <RefreshCw size={16} /> Refresh Dashboard
            </button>
          </div>

        </footer>

      </div>
    </main>
  );
}