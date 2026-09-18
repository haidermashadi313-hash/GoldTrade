"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  RefreshCw,
  wallet,
  Search,
  DollarSign,
  Coins,
  Gem,
  PlusCircle,
  MinusCircle,
  ShieldCheck,
} from "lucide-react";

const API =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

// ================= TYPES =================

interface wallethistory {
  _id: string;

  username: string;
  email?: string;
  walletType: "Pkr" | "Usdt" | "GOLD";
  type: "CREDIT" | "DEBIT";

  amount: number;
  previousBalance: number;
  newBalance: number;

  note?: string;
  adminUsername?: string;

  createdAt: string;
}

export default function wallethistoryPage() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [history, sethistory] = useState<wallethistory[]>([]);

  const [search, setSearch] = useState("");
  const [walletFilter, setwalletFilter] = useState("ALL");
  const [actionFilter, setActionFilter] = useState("ALL");
    // ================= LOAD history =================

  const loadhistory = async () => {
  try {
    setLoading(true);

    const response = await fetch(
      `${API}/api/admin/wallet/history/all`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      }
    );

    const result = await response.json();

    console.log("wallet history RESPONSE:", result);

    // API Error
    if (!response.ok || !result.success) {
      throw new Error(result.message || "Failed to load wallet history.");
    }

    // SAFE DATA 
    sethistory(
      Array.isArray(result.transactions)
        ? result.transactions
        : []
    );

  } catch (err: any) {
    console.error("wallet history ERROR:", err);

    sethistory([]); 

    alert(err.message || "Unable to load wallet history.");
  } finally {
    setLoading(false);
  }
};
  // ================= FILTERS =================

  const filteredhistory = useMemo(() => {
  return (history || []).filter((item) => {
    const username = (item.username || "").toLowerCase();
  

    const searchMatch =
      username.includes(search.toLowerCase()) ||
      false;

    const walletMatch =
      walletFilter === "ALL" || item.walletType === walletFilter;

    const actionMatch =
      actionFilter === "ALL" ||
      item.type.toUpperCase() === actionFilter.toUpperCase();

    return searchMatch && walletMatch && actionMatch;
  });
}, [history, search, walletFilter, actionFilter]);

  // ================= SUMMARY =================

  const totalCredits = filteredhistory.filter(
    (h) => h.type === "CREDIT"
  ).length;

  const totalDebits = filteredhistory.filter(
    (h) => h.type === "DEBIT"
  ).length;

  const totalPkr = filteredhistory.filter(
    (h) => h.walletType === "Pkr"
  ).length;

  const totalUsdt = filteredhistory.filter(
    (h) => h.walletType === "Usdt"
  ).length;

  const totalGold = filteredhistory.filter(
    (h) => h.walletType === "GOLD"
  ).length;

  if (loading) {
    return (
      <main className="min-h-screen bg-black flex justify-center items-center text-yellow-400">
        <RefreshCw className="animate-spin mr-3" />
        Loading wallet history...
      </main>
    );
  }  return (
    <main className="min-h-screen bg-black text-white">

      {/* HEADER */}

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
              <wallet size={34} />
              wallet history
            </h1>

            <p className="text-gray-400 mt-2">
              GoldTrade V18 wallet Audit Logs
            </p>
          </div>

          <button
            onClick={loadhistory}
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

        {/* SUMMARY */}

        <div className="grid md:grid-cols-5 gap-4 mb-8">

          <div className="bg-zinc-900 border border-green-600 rounded-2xl p-5">
            <PlusCircle className="text-green-400 mb-2" />
            <p className="text-gray-400 text-sm">Credits</p>
            <h2 className="text-3xl font-bold text-green-400">{totalCredits}</h2>
          </div>

          <div className="bg-zinc-900 border border-red-600 rounded-2xl p-5">
            <MinusCircle className="text-red-400 mb-2" />
            <p className="text-gray-400 text-sm">Debits</p>
            <h2 className="text-3xl font-bold text-red-400">{totalDebits}</h2>
          </div>

          <div className="bg-zinc-900 border border-yellow-500 rounded-2xl p-5">
            <DollarSign className="text-yellow-400 mb-2" />
            <p className="text-gray-400 text-sm">Pkr Logs</p>
            <h2 className="text-3xl font-bold text-yellow-400">{totalPkr}</h2>
          </div>

          <div className="bg-zinc-900 border border-cyan-500 rounded-2xl p-5">
            <Coins className="text-cyan-400 mb-2" />
            <p className="text-gray-400 text-sm">Usdt Logs</p>
            <h2 className="text-3xl font-bold text-cyan-400">{totalUsdt}</h2>
          </div>

          <div className="bg-zinc-900 border border-orange-500 rounded-2xl p-5">
            <Gem className="text-orange-400 mb-2" />
            <p className="text-gray-400 text-sm">Gold Logs</p>
            <h2 className="text-3xl font-bold text-orange-400">{totalGold}</h2>
          </div>

        </div>

        {/* SEARCH */}

        <div className="bg-zinc-900 border border-yellow-500 rounded-3xl p-6 mb-8">

          <h2 className="text-xl font-bold text-yellow-400 mb-5 flex items-center gap-2">
            <ShieldCheck size={20} />
            wallet Audit Filters
          </h2>

          <div className="grid lg:grid-cols-3 gap-5">

            <div className="relative">
              <Search className="absolute left-4 top-3 text-gray-500" size={18} />

              <input
                placeholder="Search Username or Email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-black border border-yellow-500 rounded-xl py-3 pl-11 pr-4 outline-none focus:border-yellow-400"
              />
            </div>

            <select
              value={walletFilter}
              onChange={(e) => setwalletFilter(e.target.value)}
              className="bg-black border border-yellow-500 rounded-xl p-3"
            >
              <option value="ALL">All wallets</option>
              <option value="Pkr">Pkr wallet</option>
              <option value="Usdt">Usdt wallet</option>
              <option value="GOLD">Gold wallet</option>
            </select>

            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="bg-black border border-yellow-500 rounded-xl p-3"
            >
              <option value="ALL">All Transactions</option>
              <option value="CREDIT">Credits</option>
              <option value="DEBIT">Debits</option>
            </select>

          </div>

        </div>

        {/* TABLE */}

        <div className="bg-zinc-900 border border-yellow-500 rounded-3xl p-6">

          <h2 className="text-2xl font-bold text-yellow-400 mb-6">
            wallet Audit Logs
          </h2>

          <div className="overflow-x-auto">

            <table className="w-full min-w-[1200px]">

              <thead className="border-b border-yellow-500 text-yellow-400 text-sm">
                <tr className="text-left">
                  <th className="py-3">User</th>
                  <th>wallet</th>
                  <th>Action</th>
                  <th>Amount</th>
                  <th>Previous</th>
                  <th>New</th>
                  <th>Reason</th>
                  <th>Admin</th>
                  <th>Date</th>
                </tr>
              </thead>

              <tbody>

                {filteredhistory.map((item) => (

                  <tr
                    key={item._id}
                    className="border-b border-zinc-800 hover:bg-zinc-800 transition"
                  >

                    <td className="py-4">
                      <p className="font-bold text-yellow-300">
                        {item.username}
                      </p>

                      <p className="text-xs text-gray-500">
                        {item.email || "-"}
                      </p>
                    </td>

                    <td>
                      <span className="px-3 py-1 rounded-full bg-zinc-800 text-xs font-bold">
                        {item.walletType}
                      </span>
                    </td>

                    <td>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold ${
                          item.type === "CREDIT"
                            ? "bg-green-600 text-white"
                            : "bg-red-600 text-white"
                        }`}
                      >
                        {item.type}
                      </span>
                    </td>

                    <td
                      className={`font-bold ${
                        item.type === "CREDIT"
                          ? "text-green-400"
                          : "text-red-400"
                      }`}
                    >
                      {item.walletType === "Pkr"
                        ? `Pkr ${item.amount.toLocaleString()}`
                        : item.walletType === "Usdt"
                        ? `${item.amount.toLocaleString()} Usdt`
                        : `${item.amount.toFixed(2)} g`}
                    </td>

                    <td className="text-gray-300">
                      {item.previousBalance}
                    </td>

                    <td className="text-yellow-300 font-bold">
                      {item.newBalance}
                    </td>

                    <td className="text-sm text-gray-400">
                      {item.note || "Manual wallet Update"}
                    </td>

                    <td>
                      <span className="bg-zinc-800 px-3 py-1 rounded-lg text-yellow-400 text-sm font-semibold">
                        {item.adminUsername}
                      </span>
                    </td>

                    <td className="text-xs text-gray-400 whitespace-nowrap">
                      {new Date(item.createdAt).toLocaleString()}
                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

          {filteredhistory.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              No wallet history Found
            </div>
          )}

        </div>

      </div>

    </main>
  );
}