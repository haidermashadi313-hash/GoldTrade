"use client";

import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";

// ==========================================
// GoldTrade API
// ==========================================

const API =
  process.env.NEXT_PUBLIC_API_URL || "https://https://goldtrade-cky2.onrender.com";

interface GoldTransaction {
  _id: string;
  tradeType: "buy" | "sell";
  grams: number;
  pricePerGram: number;
  
  totalPkr: number;
  profitLoss?: number;
  status: string;
  createdAt: string;
}

const Goldhistory: React.FC = () => {
  // ==========================================
  // STATES
  // ==========================================

  const [username, setUsername] = useState("");
  const [transactions, setTransactions] = useState<GoldTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("ALL");

  // ==========================================
  // LOAD USERNAME FROM LOCAL STORAGE
  // ==========================================

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedUsername =
        localStorage.getItem("username") || "hashi90";

      setUsername(savedUsername);
    }
  }, []);

  // ==========================================
  // FETCH GOLD history
  // ==========================================

  const fetchhistory = async () => {
    if (!username) return;

    try {
      setRefreshing(true);

      const res = await axios.get(
        `${API}/api/gold/history/${username}`
      );

      if (res.data.success) {
        setTransactions(res.data.transactions || res.data.data || []);
      } else {
        setTransactions([]);
      }
    } catch (error) {
      console.error("history Error:", error);
      setTransactions([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // ==========================================
  // LOAD history WHEN USERNAME IS READY
  // ==========================================

  useEffect(() => {
    if (!username) return;

    fetchhistory();
  }, [username]);

  // ==========================================
  // FILTER TRANSACTIONS
  // ==========================================

  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      const matchesType =
        filter === "ALL" ? true : tx.tradeType === filter;

      const matchesSearch =
        tx.tradeType.toLowerCase().includes(search.toLowerCase()) ||
        tx.status.toLowerCase().includes(search.toLowerCase());

      return matchesType && matchesSearch;
    });
  }, [transactions, filter, search]);
    // ==========================================
  // SUMMARY
  // ==========================================

  const totalbuy = filteredTransactions
    .filter((tx) => tx.tradeType === "buy")
    .reduce((sum, tx) => sum + tx.grams, 0);

  const totalsell = filteredTransactions
    .filter((tx) => tx.tradeType === "sell")
    .reduce((sum, tx) => sum + tx.grams, 0);

  const totalVolume = filteredTransactions.reduce(
    (sum, tx) => sum + tx.totalPkr,
    0
  );

  const totalProfit = filteredTransactions.reduce(
    (sum, tx) => sum + (tx.profitLoss || 0),
    0
  );

  // ==========================================
  // LOADING SCREEN
  // ==========================================

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex justify-center items-center text-yellow-400 text-xl font-bold">
        Loading Gold history...
      </div>
    );
  }

  // ==========================================
  // PAGE UI
  // ==========================================

  return (
    <div className="min-h-screen bg-[#070707] text-white p-6">

      {/* HEADER */}
      <div className="flex justify-between items-center flex-wrap gap-4 mb-8">

        <div>
          <h1 className="text-4xl font-black text-yellow-400">
            GOLD history
          </h1>

          <p className="text-gray-400 mt-1">
            buy 鈥?sell 鈥?Profit & Loss history
          </p>
        </div>

        <button
          onClick={fetchhistory}
          disabled={refreshing}
          className="bg-yellow-500 hover:bg-yellow-400 text-black font-bold px-5 py-3 rounded-xl transition disabled:opacity-50"
        >
          {refreshing ? "Refreshing..." : "Refresh"}
        </button>

      </div>

      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">

        <div className="bg-zinc-900 border border-green-500 rounded-3xl p-6">
          <p className="text-gray-400 text-sm">Total buy</p>

          <h2 className="text-3xl font-black text-green-400 mt-2">
            {totalbuy.toFixed(3)} g
          </h2>
        </div>

        <div className="bg-zinc-900 border border-red-500 rounded-3xl p-6">
          <p className="text-gray-400 text-sm">Total sell</p>

          <h2 className="text-3xl font-black text-red-400 mt-2">
            {totalsell.toFixed(3)} g
          </h2>
        </div>

        <div className="bg-zinc-900 border border-blue-500 rounded-3xl p-6">
          <p className="text-gray-400 text-sm">Trading Volume</p>

          <h2 className="text-3xl font-black text-blue-400 mt-2">
            Pkr {totalVolume.toLocaleString()}
          </h2>
        </div>

        <div className="bg-zinc-900 border border-yellow-500 rounded-3xl p-6">
          <p className="text-gray-400 text-sm">Profit / Loss</p>

          <h2
            className={`text-3xl font-black mt-2 ${
              totalProfit >= 0
                ? "text-green-400"
                : "text-red-400"
            }`}
          >
            Pkr {totalProfit.toFixed(2)}
          </h2>
        </div>

      </div>

      {/* SEARCH + FILTER */}
      <div className="bg-zinc-900 border border-zinc-700 rounded-3xl p-6 mb-8">

        <div className="grid md:grid-cols-2 gap-4">

          <input
            type="text"
            placeholder="Search buy / sell / Status..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-black border border-zinc-700 rounded-xl px-4 py-3 text-white outline-none focus:border-yellow-500"
          />

          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="bg-black border border-zinc-700 rounded-xl px-4 py-3 text-white outline-none focus:border-yellow-500"
          >
            <option value="ALL">All Transactions</option>
            <option value="buy">buy Only</option>
            <option value="sell">sell Only</option>
          </select>

        </div>

        <p className="text-gray-500 mt-4 text-sm">
          Showing {filteredTransactions.length} transaction(s)
        </p>

      </div>

      {/* TRANSACTION TABLE */}
      <div className="bg-zinc-900 border border-yellow-500 rounded-3xl p-6">

        <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
          <h2 className="text-3xl font-black text-yellow-400">
            Gold Transaction history
          </h2>

          <span className="text-sm text-gray-400">
            {filteredTransactions.length} Record(s)
          </span>
        </div>

        {filteredTransactions.length === 0 ? (
          <div className="text-center py-16">

            <div className="text-6xl mb-4">馃獧</div>

            <h3 className="text-2xl font-bold text-gray-300">
              No Transactions Found
            </h3>

            <p className="text-gray-500 mt-2">
              buy or sell Gold to see transaction history.
            </p>

          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl">

            <table className="w-full">

              <thead className="bg-black text-yellow-400 uppercase text-sm">

                <tr>
                  <th className="px-4 py-4 text-left">Type</th>
                  <th className="px-4 py-4 text-left">Grams</th>
                  <th className="px-4 py-4 text-left">Price / Gram</th>
                  <th className="px-4 py-4 text-left">Total Pkr</th>
                  <th className="px-4 py-4 text-left">Profit / Loss</th>
                  <th className="px-4 py-4 text-left">Status</th>
                  <th className="px-4 py-4 text-left">Date</th>
                </tr>

              </thead>

              <tbody>

                {filteredTransactions.map((tx) => (
                  <tr
                    key={tx._id}
                    className="border-b border-zinc-700 hover:bg-zinc-800 transition"
                  >

                    <td className="px-4 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold ${
                          tx.tradeType === "buy"
                            ? "bg-green-600 text-white"
                            : "bg-red-600 text-white"
                        }`}
                      >
                        {tx.tradeType}
                      </span>
                    </td>

                    <td className="px-4 py-4 text-yellow-300 font-semibold">
                      {tx.grams.toFixed(3)} g
                    </td>

                    <td className="px-4 py-4 text-blue-300">
                      Pkr {tx.pricePerGram.toLocaleString()}
                    </td>

                    <td className="px-4 py-4 text-green-400 font-semibold">
                      Pkr {tx.totalPkr.toLocaleString()}
                    </td>

                    <td
                      className={`px-4 py-4 font-semibold ${
                        (tx.profitLoss || 0) >= 0
                          ? "text-green-400"
                          : "text-red-400"
                      }`}
                    >
                      Pkr {(tx.profitLoss || 0).toFixed(2)}
                    </td>

                    <td className="px-4 py-4">
                      <span className="px-3 py-1 rounded-full bg-yellow-500 text-black text-xs font-bold">
                        {tx.status}
                      </span>
                    </td>

                    <td className="px-4 py-4 text-gray-400 text-sm">
                      {new Date(tx.createdAt).toLocaleDateString("en-GB")}
                      <br />
                      {new Date(tx.createdAt).toLocaleTimeString("en-GB")}
                    </td>

                  </tr>
                ))}

              </tbody>

            </table>

          </div>
        )}

      </div>

      {/* FOOTER */}
      <div className="mt-12 border-t border-zinc-800 pt-6 text-center text-gray-500 text-sm">
        GoldTrade V17 Enterprise 鈥?Gold Trading history Dashboard
      </div>

    </div>
  );
};

export default Goldhistory;


