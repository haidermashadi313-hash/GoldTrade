"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Search,
  RefreshCw,
  Wallet,
  DollarSign,
  Coins,
  Gem,
  PlusCircle,
  MinusCircle,
  ShieldCheck,
} from "lucide-react";

const API =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://goldtrade-api.onrender.com";

// ================= TYPES =================

interface WalletHistory {
  _id: string;

  walletType: "PKR" | "USDT" | "GOLD";
  action: "credit" | "debit";

  amount: number;
  previousBalance: number;
  newBalance: number;

  reason: string;

  createdAt: string;

  user?: {
    username: string;
    email: string;
  };

  admin?: {
    username: string;
  };
}

export default function WalletHistoryPage() {
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("token")
      : "";

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [history, setHistory] = useState<WalletHistory[]>([]);

  const [search, setSearch] = useState("");

  const [walletFilter, setWalletFilter] = useState("ALL");
  const [actionFilter, setActionFilter] = useState("ALL");

  // ================= LOAD HISTORY =================

  const loadHistory = async () => {
    try {
      setRefreshing(true);

      const res = await fetch(`${API}/api/admin-wallet/history`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (data.success) {
        setHistory(data.history);
      } else {
        alert(data.message);
      }
    } catch (err) {
      console.log(err);
      alert("Unable to load wallet history.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadHistory();

    const timer = setInterval(loadHistory, 15000);
    return () => clearInterval(timer);
  }, []);

  // ================= FILTERS =================

  const filteredHistory = useMemo(() => {
    return history.filter((item) => {
      const username =
        item.user?.username?.toLowerCase() || "";

      const email =
        item.user?.email?.toLowerCase() || "";

      const searchMatch =
        username.includes(search.toLowerCase()) ||
        email.includes(search.toLowerCase());

      const walletMatch =
        walletFilter === "ALL" ||
        item.walletType === walletFilter;

      const actionMatch =
        actionFilter === "ALL" ||
        item.action === actionFilter;

      return searchMatch && walletMatch && actionMatch;
    });
  }, [history, search, walletFilter, actionFilter]);

  // ================= SUMMARY =================

  const totalCredits = filteredHistory.filter(
    (h) => h.action === "credit"
  ).length;

  const totalDebits = filteredHistory.filter(
    (h) => h.action === "debit"
  ).length;

  const totalPKR = filteredHistory.filter(
    (h) => h.walletType === "PKR"
  ).length;

  const totalUSDT = filteredHistory.filter(
    (h) => h.walletType === "USDT"
  ).length;

  const totalGold = filteredHistory.filter(
    (h) => h.walletType === "GOLD"
  ).length;

  if (loading) {
    return (
      <main className="min-h-screen bg-black flex justify-center items-center text-yellow-400">
        <RefreshCw className="animate-spin mr-3" />
        Loading Wallet History...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white">

      {/* ================= HEADER ================= */}

      <div className="sticky top-0 bg-zinc-950 border-b border-yellow-500 z-50">

        <div className="max-w-7xl mx-auto px-6 py-5 flex justify-between items-center">

          <div>
            <Link
              href="/admin"
              className="flex items-center gap-2 text-yellow-400 text-sm mb-2 hover:text-yellow-300"
            >
              <ArrowLeft size={16} />
              Back to Admin Dashboard
            </Link>

            <h1 className="text-4xl font-black text-yellow-400 flex items-center gap-3">
              <Wallet size={36} />
              Wallet History
            </h1>

            <p className="text-gray-400 mt-2">
              Complete Wallet Credit / Debit Audit Logs
            </p>
          </div>

          <button
            onClick={loadHistory}
            className="bg-yellow-500 hover:bg-yellow-400 text-black px-5 py-3 rounded-xl flex items-center gap-2 font-bold"
          >
            <RefreshCw
              size={18}
              className={refreshing ? "animate-spin" : ""}
            />
            Refresh
          </button>

        </div>

      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">

        {/* ================= SUMMARY CARDS ================= */}

        <div className="grid md:grid-cols-5 gap-4 mb-8">

          <div className="bg-zinc-900 border border-green-600 rounded-2xl p-5">
            <PlusCircle className="text-green-400 mb-2" size={24}/>
            <p className="text-gray-400 text-sm">Credits</p>
            <h2 className="text-3xl font-bold text-green-400">
              {totalCredits}
            </h2>
          </div>

          <div className="bg-zinc-900 border border-red-600 rounded-2xl p-5">
            <MinusCircle className="text-red-400 mb-2" size={24}/>
            <p className="text-gray-400 text-sm">Debits</p>
            <h2 className="text-3xl font-bold text-red-400">
              {totalDebits}
            </h2>
          </div>

          <div className="bg-zinc-900 border border-yellow-500 rounded-2xl p-5">
            <DollarSign className="text-yellow-400 mb-2" size={24}/>
            <p className="text-gray-400 text-sm">PKR Wallet Logs</p>
            <h2 className="text-3xl font-bold text-yellow-400">
              {totalPKR}
            </h2>
          </div>

          <div className="bg-zinc-900 border border-cyan-600 rounded-2xl p-5">
            <Coins className="text-cyan-400 mb-2" size={24}/>
            <p className="text-gray-400 text-sm">USDT Wallet Logs</p>
            <h2 className="text-3xl font-bold text-cyan-400">
              {totalUSDT}
            </h2>
          </div>

          <div className="bg-zinc-900 border border-orange-500 rounded-2xl p-5">
            <Gem className="text-orange-400 mb-2" size={24}/>
            <p className="text-gray-400 text-sm">Gold Wallet Logs</p>
            <h2 className="text-3xl font-bold text-orange-400">
              {totalGold}
            </h2>
          </div>

        </div>

        {/* ================= SEARCH & FILTER BAR ================= */}

        <div className="bg-zinc-900 border border-yellow-500 rounded-3xl p-6 mb-8">

          <h2 className="text-xl font-bold text-yellow-400 mb-5 flex items-center gap-2">
            <ShieldCheck size={22}/>
            Wallet Audit Filters
          </h2>

          <div className="grid lg:grid-cols-3 gap-5">

            {/* Search */}

            <div className="relative">

              <Search
                className="absolute left-4 top-3 text-gray-500"
                size={18}
              />

              <input
                placeholder="Search Username or Email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-black border border-yellow-500 rounded-xl py-3 pl-11 pr-4 outline-none focus:border-yellow-400"
              />

            </div>

            {/* Wallet Filter */}

            <div>

              <label className="block text-gray-400 mb-2">
                Wallet Type
              </label>

              <select
                value={walletFilter}
                onChange={(e) => setWalletFilter(e.target.value)}
                className="w-full bg-black border border-yellow-500 rounded-xl p-3 outline-none"
              >
                <option value="ALL">All Wallets</option>
                <option value="PKR">PKR Wallet</option>
                <option value="USDT">USDT Wallet</option>
                <option value="GOLD">Gold Wallet</option>
              </select>

            </div>

            {/* Action Filter */}

            <div>

              <label className="block text-gray-400 mb-2">
                Transaction Type
              </label>

              <select
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
                className="w-full bg-black border border-yellow-500 rounded-xl p-3 outline-none"
              >
                <option value="ALL">All Actions</option>
                <option value="credit">Credit</option>
                <option value="debit">Debit</option>
              </select>

            </div>

          </div>

          {/* Live Filter Summary */}

          <div className="grid md:grid-cols-4 gap-4 mt-6">

            <div className="bg-black border border-green-700 rounded-xl p-4 text-center">
              <p className="text-xs text-gray-400">Showing Records</p>
              <p className="text-2xl font-bold text-green-400">
                {filteredHistory.length}
              </p>
            </div>

            <div className="bg-black border border-yellow-700 rounded-xl p-4 text-center">
              <p className="text-xs text-gray-400">Wallet Filter</p>
              <p className="text-lg font-bold text-yellow-400">
                {walletFilter}
              </p>
            </div>

            <div className="bg-black border border-cyan-700 rounded-xl p-4 text-center">
              <p className="text-xs text-gray-400">Action Filter</p>
              <p className="text-lg font-bold text-cyan-400">
                {actionFilter}
              </p>
            </div>

            <div className="bg-black border border-purple-700 rounded-xl p-4 text-center">
              <p className="text-xs text-gray-400">Auto Refresh</p>
              <p className="text-lg font-bold text-purple-400">
                Every 15 Seconds
              </p>
            </div>

          </div>

        </div>

        {/* ================= HISTORY TABLE STARTS IN SECTION 3 ================= */}        {/* ================= WALLET HISTORY TABLE ================= */}

        <div className="bg-zinc-900 border border-yellow-500 rounded-3xl p-6 mb-10">

          <h2 className="text-2xl font-bold text-yellow-400 mb-6">
            Wallet Audit Logs
          </h2>

          <div className="overflow-x-auto">

            <table className="w-full min-w-[1200px]">

              <thead className="border-b border-yellow-500 text-yellow-400 text-sm">
                <tr className="text-left">
                  <th className="py-3">User</th>
                  <th>Wallet</th>
                  <th>Action</th>
                  <th>Amount</th>
                  <th>Previous Balance</th>
                  <th>New Balance</th>
                  <th>Reason</th>
                  <th>Admin</th>
                  <th>Date & Time</th>
                </tr>
              </thead>

              <tbody>

                {filteredHistory.map((item) => (

                  <tr
                    key={item._id}
                    className="border-b border-zinc-800 hover:bg-zinc-800 transition"
                  >

                    {/* USER */}

                    <td className="py-4">
                      <div>
                        <p className="font-bold text-yellow-300">
                          {item.user?.username || "Unknown User"}
                        </p>

                        <p className="text-xs text-gray-500">
                          {item.user?.email || "-"}
                        </p>
                      </div>
                    </td>

                    {/* WALLET TYPE */}

                    <td>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold ${
                          item.walletType === "PKR"
                            ? "bg-green-700 text-green-100"
                            : item.walletType === "USDT"
                            ? "bg-cyan-700 text-cyan-100"
                            : "bg-orange-700 text-orange-100"
                        }`}
                      >
                        {item.walletType}
                      </span>
                    </td>

                    {/* ACTION */}

                    <td>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold ${
                          item.action === "credit"
                            ? "bg-green-600 text-white"
                            : "bg-red-600 text-white"
                        }`}
                      >
                        {item.action === "credit"
                          ? "➕ CREDIT"
                          : "➖ DEBIT"}
                      </span>
                    </td>

                    {/* AMOUNT */}

                    <td
                      className={`font-bold ${
                        item.action === "credit"
                          ? "text-green-400"
                          : "text-red-400"
                      }`}
                    >
                      {item.walletType === "PKR" && (
                        <>PKR {Number(item.amount).toLocaleString()}</>
                      )}

                      {item.walletType === "USDT" && (
                        <>{Number(item.amount).toLocaleString()} USDT</>
                      )}

                      {item.walletType === "GOLD" && (
                        <>{Number(item.amount).toFixed(2)} g</>
                      )}
                    </td>

                    {/* PREVIOUS BALANCE */}

                    <td className="text-gray-300 font-medium">
                      {item.walletType === "PKR" && (
                        <>PKR {Number(item.previousBalance).toLocaleString()}</>
                      )}

                      {item.walletType === "USDT" && (
                        <>{Number(item.previousBalance).toLocaleString()} USDT</>
                      )}

                      {item.walletType === "GOLD" && (
                        <>{Number(item.previousBalance).toFixed(2)} g</>
                      )}
                    </td>

                    {/* NEW BALANCE */}

                    <td className="font-bold text-yellow-300">
                      {item.walletType === "PKR" && (
                        <>PKR {Number(item.newBalance).toLocaleString()}</>
                      )}

                      {item.walletType === "USDT" && (
                        <>{Number(item.newBalance).toLocaleString()} USDT</>
                      )}

                      {item.walletType === "GOLD" && (
                        <>{Number(item.newBalance).toFixed(2)} g</>
                      )}
                    </td>

                    {/* REASON */}

                    <td className="max-w-[220px]">
                      <div className="text-sm text-gray-300 break-words">
                        {item.reason || "Manual Wallet Update"}
                      </div>
                    </td>

                    {/* ADMIN */}

                    <td>
                      <div className="bg-zinc-800 rounded-lg px-3 py-2 inline-block">
                        <p className="text-yellow-400 font-semibold text-sm">
                          {item.admin?.username || "Admin"}
                        </p>
                      </div>
                    </td>

                    {/* DATE */}

                    <td className="text-xs text-gray-400 whitespace-nowrap">
                      {new Date(item.createdAt).toLocaleString()}
                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

        </div>

        {/* ================= EMPTY STATE STARTS IN SECTION 4 ================= */}        {/* ================= EMPTY STATE ================= */}

        {filteredHistory.length === 0 && (
          <div className="bg-zinc-900 border border-yellow-500 rounded-3xl p-12 text-center mb-10">

            <Wallet size={64} className="mx-auto text-yellow-400 mb-5" />

            <h2 className="text-3xl font-bold text-yellow-400 mb-3">
              No Wallet History Found
            </h2>

            <p className="text-gray-500">
              No wallet credit/debit records match your current search or filters.
            </p>

          </div>
        )}

        {/* ================= FOOTER SUMMARY ================= */}

        <div className="bg-zinc-900 border border-yellow-500 rounded-3xl p-6">

          <div className="grid md:grid-cols-4 gap-5">

            <div className="bg-black rounded-2xl p-4 border border-yellow-600 text-center">
              <p className="text-gray-400 text-sm">Total Records</p>

              <h3 className="text-3xl font-bold text-yellow-400 mt-2">
                {filteredHistory.length}
              </h3>
            </div>

            <div className="bg-black rounded-2xl p-4 border border-green-600 text-center">
              <p className="text-gray-400 text-sm">Credits</p>

              <h3 className="text-3xl font-bold text-green-400 mt-2">
                {totalCredits}
              </h3>
            </div>

            <div className="bg-black rounded-2xl p-4 border border-red-600 text-center">
              <p className="text-gray-400 text-sm">Debits</p>

              <h3 className="text-3xl font-bold text-red-400 mt-2">
                {totalDebits}
              </h3>
            </div>

            <div className="bg-black rounded-2xl p-4 border border-cyan-600 text-center">
              <p className="text-gray-400 text-sm">System Status</p>

              <h3 className="text-xl font-bold text-cyan-400 mt-3">
                Live Sync Every 15s
              </h3>
            </div>

          </div>

          {/* Last Refresh */}

          <div className="border-t border-zinc-700 mt-6 pt-5 flex flex-col md:flex-row justify-between items-center gap-3">

            <div className="text-sm text-gray-400">
              GoldTrade Wallet Audit System • Binance Style Admin Panel
            </div>

            <div className="flex items-center gap-2 text-green-400 font-semibold">
              <RefreshCw size={16}/>
              Auto Refresh Enabled
            </div>

          </div>

        </div>

      </div>

    </main>
  );
}