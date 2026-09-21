"use client";

/* ==========================================================
   GoldTrade V18 Enterprise
   Admin User Manager
   SECTION 1/4 - Foundation (Compile Safe)
========================================================== */

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import {
  Users,
  Search,
  RefreshCw,
  Wallet,
  ShieldCheck,
  ShieldX,
  DollarSign,
  Coins,
} from "lucide-react";

const API =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

/* ==========================================================
   Interfaces
========================================================== */

interface UserWallet {
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

interface Analytics {
  totalUsers: number;
  activeWallets: number;
  frozenWallets: number;

  totalPkrBalance: number;
  totalGoldBalance: number;
  totalUsdtBalance: number;
}

export default function AdminUsersPage() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [users, setUsers] = useState<UserWallet[]>([]);

  const [analytics, setAnalytics] = useState<Analytics>({
    totalUsers: 0,
    activeWallets: 0,
    frozenWallets: 0,
    totalPkrBalance: 0,
    totalGoldBalance: 0,
    totalUsdtBalance: 0,
  });

  const [search, setSearch] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  /* ---------------- Wallet Modal ---------------- */

  const [selectedUser, setSelectedUser] = useState<UserWallet | null>(
    null
  );

  const [walletType, setWalletType] = useState("PKR");
  const [actionType, setActionType] = useState("credit");
  const [amount, setAmount] = useState("");

  /* ==========================================================
     AUTH HEADER
  ========================================================== */

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

  /* ==========================================================
     LOAD USERS
     GET /api/admin/users
  ========================================================== */

  const loadUsers = async () => {
    const response = await fetch(`${API}/api/admin/users`, {
      headers: getHeaders(),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Unable to load users.");
    }

    setUsers(data.users || []);
    setAnalytics(data.analytics);
  };

  /* ==========================================================
     LOAD DASHBOARD
  ========================================================== */

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setErrorMessage("");

      await loadUsers();
    } catch (error: any) {
      setErrorMessage(error.message || "Unable to load dashboard.");
    } finally {
      setLoading(false);
    }
  };

  const refreshDashboard = async () => {
    try {
      setRefreshing(true);
      await loadDashboard();
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  /* ==========================================================
     SEARCH FILTER
  ========================================================== */

  const filteredUsers = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return users.filter((user) => {
      if (!keyword) return true;

      return (
        user.username.toLowerCase().includes(keyword) ||
        user.fullName?.toLowerCase().includes(keyword) ||
        user.email?.toLowerCase().includes(keyword)
      );
    });
  }, [users, search]);

  /* ==========================================================
     PAGINATION
  ========================================================== */

  const totalPages = Math.max(
    1,
    Math.ceil(filteredUsers.length / rowsPerPage)
  );

  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;

    return filteredUsers.slice(start, start + rowsPerPage);
  }, [filteredUsers, currentPage]);

  /* ==========================================================
     LOADING SCREEN
  ========================================================== */

  if (loading) {
    return (
      <main className="min-h-screen bg-black flex items-center justify-center">
        <div className="flex items-center gap-3 text-cyan-400 text-xl font-bold">
          <RefreshCw className="animate-spin" size={28} />
          Loading Admin Users Dashboard...
        </div>
      </main>
    );
  }

  /* ==========================================================
     PAGE START
  ========================================================== */

  return (
    <main className="min-h-screen bg-black text-white p-6">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* ============================================= */}
        {/* PAGE HEADER */}
        {/* ============================================= */}

        <header className="flex flex-wrap justify-between items-center gap-5">

          <div>
            <h1 className="flex items-center gap-3 text-4xl font-black text-cyan-400">
              <Users size={38} />
              Admin User Manager
            </h1>

            <p className="text-gray-400 mt-2">
              GoldTrade V18 Enterprise • User Wallet Management System
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
              className="bg-cyan-500 hover:bg-cyan-400 disabled:bg-cyan-700 text-black px-5 py-3 rounded-xl font-bold flex items-center gap-2 transition"
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
          <div className="bg-red-500/10 border border-red-500 rounded-xl p-4 text-red-400 font-semibold">
            {errorMessage}
          </div>
        )}

        {/* ============================================= */}
        {/* ANALYTICS CARDS */}
        {/* ============================================= */}

        <section className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">

          <div className="bg-zinc-900 border border-cyan-500 rounded-2xl p-5">
            <Users className="text-cyan-400 mb-3" size={28} />

            <p className="text-gray-500 text-sm uppercase">
              Total Users
            </p>

            <h2 className="text-3xl font-black text-cyan-400 mt-2">
              {analytics.totalUsers}
            </h2>
          </div>

          <div className="bg-zinc-900 border border-green-500 rounded-2xl p-5">
            <ShieldCheck className="text-green-400 mb-3" size={28} />

            <p className="text-gray-500 text-sm uppercase">
              Active Wallets
            </p>

            <h2 className="text-3xl font-black text-green-400 mt-2">
              {analytics.activeWallets}
            </h2>
          </div>

          <div className="bg-zinc-900 border border-red-500 rounded-2xl p-5">
            <ShieldX className="text-red-400 mb-3" size={28} />

            <p className="text-gray-500 text-sm uppercase">
              Frozen Wallets
            </p>

            <h2 className="text-3xl font-black text-red-400 mt-2">
              {analytics.frozenWallets}
            </h2>
          </div>

          <div className="bg-zinc-900 border border-green-500 rounded-2xl p-5">
            <DollarSign className="text-green-400 mb-3" size={28} />

            <p className="text-gray-500 text-sm uppercase">
              Total PKR Balance
            </p>

            <h2 className="text-2xl font-black text-green-400 mt-2">
              PKR {analytics.totalPkrBalance.toLocaleString()}
            </h2>
          </div>

          <div className="bg-zinc-900 border border-yellow-500 rounded-2xl p-5">
            <Coins className="text-yellow-400 mb-3" size={28} />

            <p className="text-gray-500 text-sm uppercase">
              Total Gold Balance
            </p>

            <h2 className="text-2xl font-black text-yellow-400 mt-2">
              {analytics.totalGoldBalance.toFixed(2)} g
            </h2>
          </div>

          <div className="bg-zinc-900 border border-purple-500 rounded-2xl p-5">
            <Wallet className="text-purple-400 mb-3" size={28} />

            <p className="text-gray-500 text-sm uppercase">
              Total USDT Balance
            </p>

            <h2 className="text-2xl font-black text-purple-400 mt-2">
              {analytics.totalUsdtBalance.toFixed(2)} USDT
            </h2>
          </div>

        </section>

        {/* ============================================= */}
        {/* SEARCH TOOLBAR */}
        {/* ============================================= */}

        <section className="bg-zinc-900 border border-cyan-500 rounded-2xl p-6 space-y-5">

          <div>
            <h2 className="text-2xl font-black text-cyan-400">
              Search Users
            </h2>

            <p className="text-gray-400 text-sm mt-2">
              Search by username, full name or email address.
            </p>
          </div>

          <div className="relative">

            <Search
              size={18}
              className="absolute left-4 top-4 text-gray-500"
            />

            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search username, full name or email..."
              className="w-full bg-black border border-zinc-700 rounded-xl pl-11 pr-4 py-3 text-white focus:border-cyan-500 outline-none"
            />

          </div>

          <div className="flex flex-wrap gap-3">

            <span className="bg-black border border-zinc-700 px-4 py-2 rounded-full text-sm">
              Search:
              <span className="ml-2 text-cyan-400 font-bold">
                {search || "None"}
              </span>
            </span>

            <span className="bg-black border border-zinc-700 px-4 py-2 rounded-full text-sm">
              Users:
              <span className="ml-2 text-green-400 font-bold">
                {filteredUsers.length}
              </span>
            </span>

          </div>

        </section>

        {/* ============================================= */}
        {/* WALLET SUMMARY */}
        {/* ============================================= */}

        <section className="bg-zinc-900 border border-purple-500 rounded-2xl p-6">

          <h2 className="text-2xl font-black text-purple-400 mb-6">
            Wallet Distribution
          </h2>

          <div className="grid md:grid-cols-3 gap-5">

            <div className="bg-black border border-green-500 rounded-xl p-5 text-center">

              <DollarSign className="mx-auto text-green-400 mb-3" size={30} />

              <p className="text-gray-500 text-sm uppercase">
                PKR Wallet
              </p>

              <h3 className="text-2xl font-black text-green-400 mt-2">
                PKR {analytics.totalPkrBalance.toLocaleString()}
              </h3>

            </div>

            <div className="bg-black border border-yellow-500 rounded-xl p-5 text-center">

              <Coins className="mx-auto text-yellow-400 mb-3" size={30} />

              <p className="text-gray-500 text-sm uppercase">
                Gold Wallet
              </p>

              <h3 className="text-2xl font-black text-yellow-400 mt-2">
                {analytics.totalGoldBalance.toFixed(2)} g
              </h3>

            </div>

            <div className="bg-black border border-purple-500 rounded-xl p-5 text-center">

              <Wallet className="mx-auto text-purple-400 mb-3" size={30} />

              <p className="text-gray-500 text-sm uppercase">
                USDT Wallet
              </p>

              <h3 className="text-2xl font-black text-purple-400 mt-2">
                {analytics.totalUsdtBalance.toFixed(2)} USDT
              </h3>

            </div>

          </div>

        </section>

        {/* ============================================= */}
        {/* USERS TABLE */}
        {/* ============================================= */}

        <section className="bg-zinc-900 border border-cyan-500 rounded-2xl overflow-hidden">

          <div className="flex justify-between items-center px-6 py-5 border-b border-zinc-800 flex-wrap gap-3">
            <div>
              <h2 className="text-2xl font-black text-cyan-400">
                User Wallet Management
              </h2>
              <p className="text-gray-400 text-sm mt-1">
                Manage PKR, GOLD and USDT wallets.
              </p>
            </div>

            <span className="bg-cyan-500/20 border border-cyan-500 text-cyan-400 px-4 py-2 rounded-full text-sm font-bold">
              {filteredUsers.length} Users
            </span>
          </div>

          <div className="hidden lg:block overflow-x-auto">

            <table className="w-full min-w-[1300px]">

              <thead className="bg-black text-gray-400 text-sm">

                <tr>
                  <th className="text-left px-5 py-4">Username</th>
                  <th className="text-left px-5 py-4">PKR</th>
                  <th className="text-left px-5 py-4">Gold</th>
                  <th className="text-left px-5 py-4">USDT</th>
                  <th className="text-left px-5 py-4">Wallet</th>
                  <th className="text-left px-5 py-4">Joined</th>
                  <th className="text-center px-5 py-4">Actions</th>
                </tr>

              </thead>

              <tbody>

                {paginatedUsers.length === 0 ? (

                  <tr>
                    <td colSpan={7} className="text-center py-12 text-gray-500">
                      No users found.
                    </td>
                  </tr>

                ) : (

                  paginatedUsers.map((user) => (

                    <tr
                      key={user._id}
                      className="border-t border-zinc-800 hover:bg-zinc-800/40 transition"
                    >

                      <td className="px-5 py-4">

                        <div>
                          <h4 className="font-bold text-white">
                            {user.username}
                          </h4>

                          <p className="text-xs text-gray-500">
                            {user.email || "No Email"}
                          </p>
                        </div>

                      </td>

                      <td className="px-5 py-4 text-green-400 font-bold">
                        PKR {user.pkrBalance.toLocaleString()}
                      </td>

                      <td className="px-5 py-4 text-yellow-400 font-bold">
                        {user.goldBalance.toFixed(2)} g
                      </td>

                      <td className="px-5 py-4 text-purple-400 font-bold">
                        {user.usdtBalance.toFixed(2)} USDT
                      </td>

                      <td className="px-5 py-4">

                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold ${
                            user.walletFrozen
                              ? "bg-red-500/20 border border-red-500 text-red-400"
                              : "bg-green-500/20 border border-green-500 text-green-400"
                          }`}
                        >
                          {user.walletFrozen ? "Frozen" : "Active"}
                        </span>

                      </td>

                      <td className="px-5 py-4 text-gray-400 text-sm">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>

                      <td className="px-5 py-4">

                        <div className="flex flex-wrap gap-2 justify-center">

                          <button
                            onClick={() => setSelectedUser(user)}
                            className="bg-cyan-500 hover:bg-cyan-400 text-black px-3 py-2 rounded-lg text-xs font-bold transition"
                          >
                            Wallet
                          </button>

                          <button
                            className={`px-3 py-2 rounded-lg text-xs font-bold transition ${
                              user.walletFrozen
                                ? "bg-green-500 hover:bg-green-400 text-black"
                                : "bg-red-500 hover:bg-red-400 text-black"
                            }`}
                          >
                            {user.walletFrozen ? "Unfreeze" : "Freeze"}
                          </button>

                        </div>

                      </td>

                    </tr>

                  ))

                )}

              </tbody>

            </table>

          </div>
                    {/* ============================================= */}
          {/* MOBILE USER CARDS */}
          {/* ============================================= */}

          <div className="lg:hidden p-5 space-y-5">

            {paginatedUsers.map((user) => (

              <div
                key={user._id}
                className="bg-black border border-zinc-700 rounded-xl p-5 space-y-4"
              >

                <div className="flex justify-between items-center">

                  <div>

                    <h3 className="font-black text-lg text-white">
                      {user.username}
                    </h3>

                    <p className="text-xs text-gray-500">
                      {user.email || "No Email"}
                    </p>

                  </div>

                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold ${
                      user.walletFrozen
                        ? "bg-red-500/20 border border-red-500 text-red-400"
                        : "bg-green-500/20 border border-green-500 text-green-400"
                    }`}
                  >
                    {user.walletFrozen ? "Frozen" : "Active"}
                  </span>

                </div>

                <div className="grid grid-cols-3 gap-3 text-center">

                  <div className="bg-zinc-900 rounded-lg p-3">
                    <p className="text-gray-500 text-xs">PKR</p>
                    <p className="text-green-400 font-bold text-sm">
                      {user.pkrBalance.toLocaleString()}
                    </p>
                  </div>

                  <div className="bg-zinc-900 rounded-lg p-3">
                    <p className="text-gray-500 text-xs">Gold</p>
                    <p className="text-yellow-400 font-bold text-sm">
                      {user.goldBalance.toFixed(2)}
                    </p>
                  </div>

                  <div className="bg-zinc-900 rounded-lg p-3">
                    <p className="text-gray-500 text-xs">USDT</p>
                    <p className="text-purple-400 font-bold text-sm">
                      {user.usdtBalance.toFixed(2)}
                    </p>
                  </div>

                </div>

                <div className="grid grid-cols-2 gap-3">

                  <button
                    onClick={() => setSelectedUser(user)}
                    className="bg-cyan-500 hover:bg-cyan-400 text-black py-3 rounded-xl font-bold transition"
                  >
                    Wallet
                  </button>

                  <button
                    className={`py-3 rounded-xl font-bold transition ${
                      user.walletFrozen
                        ? "bg-green-500 hover:bg-green-400 text-black"
                        : "bg-red-500 hover:bg-red-400 text-black"
                    }`}
                  >
                    {user.walletFrozen ? "Unfreeze" : "Freeze"}
                  </button>

                </div>

              </div>

            ))}

          </div>

        </section>
                  {/* ============================================= */}
          {/* MOBILE USER CARDS */}
          {/* ============================================= */}

          <div className="lg:hidden p-5 space-y-5">

            {paginatedUsers.map((user) => (

              <div
                key={user._id}
                className="bg-black border border-zinc-700 rounded-xl p-5 space-y-4"
              >

                <div className="flex justify-between items-center">

                  <div>

                    <h3 className="font-black text-lg text-white">
                      {user.username}
                    </h3>

                    <p className="text-xs text-gray-500">
                      {user.email || "No Email"}
                    </p>

                  </div>

                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold ${
                      user.walletFrozen
                        ? "bg-red-500/20 border border-red-500 text-red-400"
                        : "bg-green-500/20 border border-green-500 text-green-400"
                    }`}
                  >
                    {user.walletFrozen ? "Frozen" : "Active"}
                  </span>

                </div>

                <div className="grid grid-cols-3 gap-3 text-center">

                  <div className="bg-zinc-900 rounded-lg p-3">
                    <p className="text-gray-500 text-xs">PKR</p>
                    <p className="text-green-400 font-bold text-sm">
                      {user.pkrBalance.toLocaleString()}
                    </p>
                  </div>

                  <div className="bg-zinc-900 rounded-lg p-3">
                    <p className="text-gray-500 text-xs">Gold</p>
                    <p className="text-yellow-400 font-bold text-sm">
                      {user.goldBalance.toFixed(2)}
                    </p>
                  </div>

                  <div className="bg-zinc-900 rounded-lg p-3">
                    <p className="text-gray-500 text-xs">USDT</p>
                    <p className="text-purple-400 font-bold text-sm">
                      {user.usdtBalance.toFixed(2)}
                    </p>
                  </div>

                </div>

                <div className="grid grid-cols-2 gap-3">

                  <button
                    onClick={() => setSelectedUser(user)}
                    className="bg-cyan-500 hover:bg-cyan-400 text-black py-3 rounded-xl font-bold transition"
                  >
                    Wallet
                  </button>

                  <button
                    className={`py-3 rounded-xl font-bold transition ${
                      user.walletFrozen
                        ? "bg-green-500 hover:bg-green-400 text-black"
                        : "bg-red-500 hover:bg-red-400 text-black"
                    }`}
                  >
                    {user.walletFrozen ? "Unfreeze" : "Freeze"}
                  </button>

                </div>

              </div>

            ))}

          </div>

          {/* ============================================= */}
        {/* WALLET CREDIT / DEBIT MODAL */}
        {/* ============================================= */}

        {selectedUser && (

          <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">

            <div className="bg-zinc-900 border border-cyan-500 rounded-2xl w-full max-w-lg p-6 space-y-5">

              <div className="flex justify-between items-center">

                <h2 className="text-2xl font-black text-cyan-400">
                  Wallet Manager
                </h2>

                <button
                  onClick={() => {
                    setSelectedUser(null);
                    setAmount("");
                  }}
                  className="text-red-400 font-bold"
                >
                  Close
                </button>

              </div>

              <div className="bg-black rounded-xl p-4 space-y-2">

                <h3 className="font-black text-white">
                  {selectedUser.username}
                </h3>

                <p className="text-sm text-gray-400">
                  PKR: {selectedUser.pkrBalance.toLocaleString()}
                </p>

                <p className="text-sm text-yellow-400">
                  Gold: {selectedUser.goldBalance.toFixed(2)} g
                </p>

                <p className="text-sm text-purple-400">
                  USDT: {selectedUser.usdtBalance.toFixed(2)}
                </p>

              </div>

              <div className="space-y-3">

                <label className="text-sm text-gray-400">
                  Wallet Type
                </label>

                <select
                  value={walletType}
                  onChange={(e) => setWalletType(e.target.value)}
                  className="w-full bg-black border border-zinc-700 rounded-xl p-3 text-white"
                >
                  <option value="PKR">PKR Wallet</option>
                  <option value="GOLD">Gold Wallet</option>
                  <option value="USDT">USDT Wallet</option>
                </select>

              </div>

              <div className="space-y-3">

                <label className="text-sm text-gray-400">
                  Action
                </label>

                <select
                  value={actionType}
                  onChange={(e) => setActionType(e.target.value)}
                  className="w-full bg-black border border-zinc-700 rounded-xl p-3 text-white"
                >
                  <option value="credit">Credit</option>
                  <option value="debit">Debit</option>
                </select>

              </div>

              <div className="space-y-3">

                <label className="text-sm text-gray-400">
                  Amount
                </label>

                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Enter amount..."
                  className="w-full bg-black border border-zinc-700 rounded-xl p-3 text-white"
                />

              </div>

              <button
                className="w-full bg-cyan-500 hover:bg-cyan-400 text-black py-3 rounded-xl font-bold transition"
              >
                Update Wallet
              </button>

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
                User Pagination
              </h2>

              <p className="text-gray-400 text-sm mt-2">
                Showing {paginatedUsers.length} of {filteredUsers.length} users.
              </p>
            </div>

            <span className="bg-cyan-500/20 border border-cyan-500 text-cyan-400 px-4 py-2 rounded-full font-bold text-sm">
              Page {currentPage} / {totalPages}
            </span>

          </div>

          <div className="flex justify-center gap-2 flex-wrap">

            <button
              onClick={() => setCurrentPage(Math.max(currentPage - 1, 1))}
              disabled={currentPage === 1}
              className="bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 px-4 py-2 rounded-lg font-bold"
            >
              Previous
            </button>

            {Array.from({ length: totalPages }).map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentPage(index + 1)}
                className={`w-10 h-10 rounded-lg font-bold transition ${
                  currentPage === index + 1
                    ? "bg-cyan-500 text-black"
                    : "bg-zinc-800 hover:bg-zinc-700 text-white"
                }`}
              >
                {index + 1}
              </button>
            ))}

            <button
              onClick={() =>
                setCurrentPage(Math.min(currentPage + 1, totalPages))
              }
              disabled={currentPage === totalPages}
              className="bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 px-4 py-2 rounded-lg font-bold"
            >
              Next
            </button>

          </div>

        </section>

        {/* ============================================= */}
        {/* QUICK ACTIONS */}
        {/* ============================================= */}

        <section className="grid md:grid-cols-3 gap-5">

          <Link
            href="/admin/wallet"
            className="bg-zinc-900 border border-green-500 rounded-2xl p-6 hover:border-green-400 transition"
          >
            <Wallet className="text-green-400 mb-3" size={30} />

            <h3 className="text-xl font-black text-green-400">
              Wallet Manager
            </h3>

            <p className="text-gray-400 text-sm mt-2">
              Manage PKR, GOLD and USDT wallets.
            </p>
          </Link>

          <Link
            href="/admin/gold"
            className="bg-zinc-900 border border-yellow-500 rounded-2xl p-6 hover:border-yellow-400 transition"
          >
            <Coins className="text-yellow-400 mb-3" size={30} />

            <h3 className="text-xl font-black text-yellow-400">
              Gold Manager
            </h3>

            <p className="text-gray-400 text-sm mt-2">
              Manage Gold market, prices and buy/sell orders.
            </p>
          </Link>

          <Link
            href="/admin/usdt"
            className="bg-zinc-900 border border-purple-500 rounded-2xl p-6 hover:border-purple-400 transition"
          >
            <Wallet className="text-purple-400 mb-3" size={30} />

            <h3 className="text-xl font-black text-purple-400">
              USDT Manager
            </h3>

            <p className="text-gray-400 text-sm mt-2">
              Manage USDT deposits, withdrawals and trading settings.
            </p>
          </Link>

        </section>

        {/* ============================================= */}
        {/* ENTERPRISE SUMMARY */}
        {/* ============================================= */}

        <section className="bg-zinc-900 border border-cyan-500 rounded-2xl p-6 space-y-6">

          <h2 className="text-2xl font-black text-cyan-400">
            Enterprise Wallet Summary
          </h2>

          <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-5">

            <div className="bg-black border border-green-500 rounded-xl p-5 text-center">
              <DollarSign className="mx-auto text-green-400 mb-3" size={28} />
              <p className="text-gray-500 text-xs uppercase">PKR Balance</p>

              <h3 className="text-2xl font-black text-green-400 mt-2">
                PKR {analytics.totalPkrBalance.toLocaleString()}
              </h3>
            </div>

            <div className="bg-black border border-yellow-500 rounded-xl p-5 text-center">
              <Coins className="mx-auto text-yellow-400 mb-3" size={28} />
              <p className="text-gray-500 text-xs uppercase">Gold Balance</p>

              <h3 className="text-2xl font-black text-yellow-400 mt-2">
                {analytics.totalGoldBalance.toFixed(2)} g
              </h3>
            </div>

            <div className="bg-black border border-purple-500 rounded-xl p-5 text-center">
              <Wallet className="mx-auto text-purple-400 mb-3" size={28} />
              <p className="text-gray-500 text-xs uppercase">USDT Balance</p>

              <h3 className="text-2xl font-black text-purple-400 mt-2">
                {analytics.totalUsdtBalance.toFixed(2)} USDT
              </h3>
            </div>

            <div className="bg-black border border-cyan-500 rounded-xl p-5 text-center">
              <Users className="mx-auto text-cyan-400 mb-3" size={28} />
              <p className="text-gray-500 text-xs uppercase">Registered Users</p>

              <h3 className="text-2xl font-black text-cyan-400 mt-2">
                {analytics.totalUsers}
              </h3>
            </div>

          </div>

        </section>

        {/* ============================================= */}
        {/* FOOTER */}
        {/* ============================================= */}

        <footer className="border-t border-zinc-800 pt-8 pb-6">

          <div className="grid md:grid-cols-3 gap-8">

            <div>
              <h3 className="text-lg font-black text-cyan-400 mb-3">
                GoldTrade V18 Enterprise
              </h3>

              <p className="text-gray-500 text-sm leading-6">
                Complete Enterprise User Management dashboard with wallet controls,
                search, analytics, freeze/unfreeze and transaction management.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-black text-green-400 mb-3">
                Wallet Controls
              </h3>

              <ul className="space-y-2 text-sm text-gray-500">
                <li>• PKR Credit / Debit</li>
                <li>• Gold Credit / Debit</li>
                <li>• USDT Credit / Debit</li>
                <li>• Freeze Wallet</li>
                <li>• Unfreeze Wallet</li>
                <li>• Search Users</li>
                <li>• Pagination</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-black text-purple-400 mb-3">
                Wallet Statistics
              </h3>

              <div className="space-y-3 text-sm">

                <div className="flex justify-between">
                  <span className="text-gray-500">Total Users</span>
                  <span className="font-bold text-cyan-400">
                    {analytics.totalUsers}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-500">Active Wallets</span>
                  <span className="font-bold text-green-400">
                    {analytics.activeWallets}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-500">Frozen Wallets</span>
                  <span className="font-bold text-red-400">
                    {analytics.frozenWallets}
                  </span>
                </div>

              </div>

            </div>

          </div>

          <div className="border-t border-zinc-800 mt-8 pt-6 flex flex-wrap justify-between items-center gap-4">

            <p className="text-gray-500 text-sm">
              © 2026 GoldTrade V18 Enterprise User Wallet Manager.
            </p>

            <button
              onClick={refreshDashboard}
              disabled={refreshing}
              className="bg-cyan-500 hover:bg-cyan-400 disabled:bg-cyan-700 text-black px-5 py-2 rounded-lg font-bold flex items-center gap-2 transition"
            >
              <RefreshCw
                size={16}
                className={refreshing ? "animate-spin" : ""}
              />

              {refreshing ? "Refreshing..." : "Refresh Dashboard"}
            </button>

          </div>

        </footer>

      </div>
    </main>
  );
}