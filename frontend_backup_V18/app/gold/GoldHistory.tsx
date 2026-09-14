"use client";

import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";

// ==========================================
// GOLDTRADE V18 API
// ==========================================

const API =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000";

// ==========================================
// TYPES
// ==========================================

interface GoldTransaction {
  _id: string;
  tradeType: "BUY" | "SELL";
  grams: number;
  pricePerGram: number;
  totalPKR: number;
  averageBuyPrice: number;
  profitLoss: number;
  status: string;
  createdAt: string;
}

const GoldHistoryPage = () => {

  // ==========================================
  // USER + TOKEN
  // ==========================================

  const [username, setUsername] = useState("");
  const [token, setToken] = useState("");

  // ==========================================
  // DATA
  // ==========================================

  const [transactions, setTransactions] = useState<GoldTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] =
    useState<"success" | "error">("success");

  // ==========================================
  // FILTER
  // ==========================================

  const [filter, setFilter] = useState<"ALL" | "BUY" | "SELL">("ALL");

  // ==========================================
  // LOAD USER
  // ==========================================

  useEffect(() => {
    const savedUsername = localStorage.getItem("username") || "";
    const savedToken = localStorage.getItem("token") || "";

    setUsername(savedUsername);
    setToken(savedToken);
  }, []);

  // ==========================================
  // FETCH HISTORY
  // ==========================================

  const fetchHistory = async () => {
    try {
      setLoading(true);

      if (!token) return;

      const response = await axios.get(
        `${API}/api/gold/history`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        setTransactions(response.data.transactions || []);
      }

    } catch (error: any) {

      console.error("GOLD HISTORY ERROR:", error);

      setMessage(
        error.response?.data?.message ||
          "Unable to load gold history."
      );

      setMessageType("error");

    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) return;
    fetchHistory();
  }, [token]);

  // Auto Refresh

  useEffect(() => {
    if (!token) return;

    const interval = setInterval(fetchHistory, 30000);

    return () => clearInterval(interval);
  }, [token]);

    // ==========================================
  // FILTER TRANSACTIONS
  // ==========================================

  const filteredTransactions = useMemo(() => {
    if (filter === "ALL") return transactions;

    return transactions.filter(
      (item) => item.tradeType === filter
    );
  }, [transactions, filter]);

  // ==========================================
  // LIVE STATISTICS
  // ==========================================

  const stats = useMemo(() => {
    const totalBuyGrams = transactions
      .filter((t) => t.tradeType === "BUY")
      .reduce((sum, t) => sum + Number(t.grams), 0);

    const totalSellGrams = transactions
      .filter((t) => t.tradeType === "SELL")
      .reduce((sum, t) => sum + Number(t.grams), 0);

    const totalBuyValue = transactions
      .filter((t) => t.tradeType === "BUY")
      .reduce((sum, t) => sum + Number(t.totalPKR), 0);

    const totalSellValue = transactions
      .filter((t) => t.tradeType === "SELL")
      .reduce((sum, t) => sum + Number(t.totalPKR), 0);

    const realizedProfit = transactions
      .filter((t) => t.tradeType === "SELL")
      .reduce((sum, t) => sum + Number(t.profitLoss || 0), 0);

    return {
      totalBuyGrams,
      totalSellGrams,
      totalBuyValue,
      totalSellValue,
      realizedProfit,
      totalTrades: transactions.length,
    };
  }, [transactions]);

  // ==========================================
  // REFRESH
  // ==========================================

  const refreshHistory = async () => {
    await fetchHistory();
  };

  // ==========================================
  // LOADING SCREEN
  // ==========================================

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex justify-center items-center">
        <div className="text-center">

          <div className="h-16 w-16 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>

          <h2 className="text-yellow-400 text-3xl font-black">
            GOLD HISTORY
          </h2>

          <p className="text-gray-400 mt-2">
            Loading Transaction History...
          </p>

        </div>
      </div>
    );
  }

  // ==========================================
  // PAGE UI STARTS
  // ==========================================

  return (
    <div className="min-h-screen bg-[#070707] text-white p-6">

      {/* HEADER */}

      <div className="flex justify-between items-center flex-wrap gap-4 mb-8">

        <div>
          <h1 className="text-5xl font-black text-yellow-400">
            GOLD HISTORY
          </h1>

          <p className="text-gray-400 mt-2">
            Welcome back, {username}
          </p>
        </div>

        <button
          onClick={refreshHistory}
          className="bg-yellow-500 hover:bg-yellow-400 text-black px-5 py-3 rounded-xl font-bold transition-all duration-300 hover:scale-105"
        >
          🔄 Refresh
        </button>

      </div>

      {/* SUCCESS / ERROR MESSAGE */}

      {message && (
        <div
          className={`mb-6 rounded-xl p-4 font-semibold ${
            messageType === "success"
              ? "bg-green-600 text-white"
              : "bg-red-700 text-white"
          }`}
        >
          {message}
        </div>
      )}

      {/* HISTORY SUMMARY */}

      <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">

        <div className="bg-zinc-900 border border-yellow-500 rounded-3xl p-6">
          <p className="text-gray-400 text-sm">Total Trades</p>

          <h2 className="text-3xl font-black text-yellow-400 mt-2">
            {stats.totalTrades}
          </h2>
        </div>

        <div className="bg-zinc-900 border border-green-500 rounded-3xl p-6">
          <p className="text-gray-400 text-sm">Gold Bought</p>

          <h2 className="text-3xl font-black text-green-400 mt-2">
            {stats.totalBuyGrams.toFixed(3)} g
          </h2>
        </div>

        <div className="bg-zinc-900 border border-red-500 rounded-3xl p-6">
          <p className="text-gray-400 text-sm">Gold Sold</p>

          <h2 className="text-3xl font-black text-red-400 mt-2">
            {stats.totalSellGrams.toFixed(3)} g
          </h2>
        </div>

        <div className="bg-zinc-900 border border-purple-500 rounded-3xl p-6">
          <p className="text-gray-400 text-sm">Realized Profit / Loss</p>

          <h2
            className={`text-3xl font-black mt-2 ${
              stats.realizedProfit >= 0
                ? "text-green-400"
                : "text-red-400"
            }`}
          >
            PKR {stats.realizedProfit.toLocaleString()}
          </h2>
        </div>

      </div>

      {/* FILTER BUTTONS */}

      <div className="flex gap-3 flex-wrap mb-8">

        <button
          onClick={() => setFilter("ALL")}
          className={`px-5 py-3 rounded-xl font-bold transition ${
            filter === "ALL"
              ? "bg-yellow-500 text-black"
              : "bg-zinc-800 text-white hover:bg-zinc-700"
          }`}
        >
          ALL ({transactions.length})
        </button>

        <button
          onClick={() => setFilter("BUY")}
          className={`px-5 py-3 rounded-xl font-bold transition ${
            filter === "BUY"
              ? "bg-green-500 text-white"
              : "bg-zinc-800 text-white hover:bg-zinc-700"
          }`}
        >
          BUY (
          {transactions.filter((t) => t.tradeType === "BUY").length})
        </button>

        <button
          onClick={() => setFilter("SELL")}
          className={`px-5 py-3 rounded-xl font-bold transition ${
            filter === "SELL"
              ? "bg-red-500 text-white"
              : "bg-zinc-800 text-white hover:bg-zinc-700"
          }`}
        >
          SELL (
          {transactions.filter((t) => t.tradeType === "SELL").length})
        </button>

      </div>
            {/* ========================================== */}
      {/* TRANSACTION HISTORY TABLE */}
      {/* ========================================== */}

      <div className="bg-zinc-900 border border-yellow-500 rounded-3xl p-8 mb-10">

        <div className="flex justify-between items-center mb-6 flex-wrap gap-3">

          <h2 className="text-3xl font-black text-yellow-400">
            Gold Transaction History
          </h2>

          <span className="bg-yellow-500 text-black px-4 py-2 rounded-full text-sm font-bold">
            {filteredTransactions.length} Records
          </span>

        </div>

        {filteredTransactions.length === 0 ? (

          <div className="text-center py-12 text-gray-400">

            <div className="text-6xl mb-4">📜</div>

            <h3 className="text-2xl font-bold text-white mb-2">
              No Transactions Found
            </h3>

            <p>
              No {filter !== "ALL" ? filter : ""} gold transactions available.
            </p>

          </div>

        ) : (

          <div className="overflow-x-auto rounded-2xl border border-zinc-800">

            <table className="w-full min-w-[900px]">

              <thead className="bg-black border-b border-zinc-700">

                <tr className="text-gray-400 text-sm">

                  <th className="py-4 px-4 text-left">Trade</th>
                  <th className="py-4 px-4 text-left">Gold (g)</th>
                  <th className="py-4 px-4 text-left">Price / Gram</th>
                  <th className="py-4 px-4 text-left">Total PKR</th>
                  <th className="py-4 px-4 text-left">Profit / Loss</th>
                  <th className="py-4 px-4 text-left">Status</th>
                  <th className="py-4 px-4 text-left">Date</th>

                </tr>

              </thead>

              <tbody>

                {filteredTransactions.map((trade) => (

                  <tr
                    key={trade._id}
                    className="border-b border-zinc-800 hover:bg-zinc-800 transition-all duration-300"
                  >

                    {/* BUY / SELL */}

                    <td className="py-4 px-4">

                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold ${
                          trade.tradeType === "BUY"
                            ? "bg-green-600 text-white"
                            : "bg-red-600 text-white"
                        }`}
                      >
                        {trade.tradeType === "BUY"
                          ? "🟢 BUY"
                          : "🔴 SELL"}
                      </span>

                    </td>

                    {/* GRAMS */}

                    <td className="py-4 px-4 font-bold text-yellow-400">
                      {Number(trade.grams).toFixed(3)} g
                    </td>

                    {/* PRICE */}

                    <td className="py-4 px-4 text-cyan-400 font-semibold">
                      PKR {Number(trade.pricePerGram).toLocaleString()}
                    </td>

                    {/* TOTAL */}

                    <td className="py-4 px-4 text-white font-semibold">
                      PKR {Number(trade.totalPKR).toLocaleString()}
                    </td>

                    {/* PROFIT LOSS */}

                    <td className="py-4 px-4">

                      {trade.tradeType === "BUY" ? (

                        <span className="text-gray-400 font-semibold">
                          --
                        </span>

                      ) : (

                        <span
                          className={`font-bold ${
                            Number(trade.profitLoss) >= 0
                              ? "text-green-400"
                              : "text-red-400"
                          }`}
                        >
                          PKR {Number(trade.profitLoss).toLocaleString()}
                        </span>

                      )}

                    </td>

                    {/* STATUS */}

                    <td className="py-4 px-4">

                      <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-semibold">
                        {trade.status}
                      </span>

                    </td>

                    {/* DATE */}

                    <td className="py-4 px-4 text-gray-400 text-sm whitespace-nowrap">

                      <div>
                        {new Date(trade.createdAt).toLocaleDateString()}
                      </div>

                      <div className="text-xs text-gray-500">
                        {new Date(trade.createdAt).toLocaleTimeString()}
                      </div>

                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

        )}

      </div>

      {/* ========================================== */}
      {/* TRANSACTION SUMMARY CARDS */}
      {/* ========================================== */}

      <h2 className="text-3xl font-black text-yellow-400 mb-5">
        Trading Summary
      </h2>

      <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-5 mb-10">

        <div className="bg-zinc-900 border border-green-600 rounded-3xl p-6">

          <p className="text-gray-400 text-sm">
            Total Buy Value
          </p>

          <h2 className="text-3xl font-black text-green-400 mt-2">
            PKR {stats.totalBuyValue.toLocaleString()}
          </h2>

        </div>

        <div className="bg-zinc-900 border border-red-600 rounded-3xl p-6">

          <p className="text-gray-400 text-sm">
            Total Sell Value
          </p>

          <h2 className="text-3xl font-black text-red-400 mt-2">
            PKR {stats.totalSellValue.toLocaleString()}
          </h2>

        </div>

        <div className="bg-zinc-900 border border-yellow-600 rounded-3xl p-6">

          <p className="text-gray-400 text-sm">
            Gold Bought
          </p>

          <h2 className="text-3xl font-black text-yellow-400 mt-2">
            {stats.totalBuyGrams.toFixed(3)} g
          </h2>

        </div>

        <div className="bg-zinc-900 border border-cyan-600 rounded-3xl p-6">

          <p className="text-gray-400 text-sm">
            Gold Sold
          </p>

          <h2 className="text-3xl font-black text-cyan-400 mt-2">
            {stats.totalSellGrams.toFixed(3)} g
          </h2>

        </div>

      </div>
            {/* ========================================== */}
      {/* PERFORMANCE INSIGHTS */}
      {/* ========================================== */}

      <div className="bg-zinc-900 border border-yellow-500 rounded-3xl p-8 mb-10">

        <h2 className="text-3xl font-black text-yellow-400 mb-6">
          Gold Performance Insights
        </h2>

        <div className="space-y-5">

          <div className="flex justify-between border-b border-zinc-800 pb-3">
            <span className="text-gray-400">Total Trades</span>

            <span className="text-yellow-400 font-bold">
              {stats.totalTrades}
            </span>
          </div>

          <div className="flex justify-between border-b border-zinc-800 pb-3">
            <span className="text-gray-400">Total Buy Value</span>

            <span className="text-green-400 font-bold">
              PKR {stats.totalBuyValue.toLocaleString()}
            </span>
          </div>

          <div className="flex justify-between border-b border-zinc-800 pb-3">
            <span className="text-gray-400">Total Sell Value</span>

            <span className="text-red-400 font-bold">
              PKR {stats.totalSellValue.toLocaleString()}
            </span>
          </div>

          <div className="flex justify-between border-b border-zinc-800 pb-3">
            <span className="text-gray-400">Gold Purchased</span>

            <span className="text-green-400 font-bold">
              {stats.totalBuyGrams.toFixed(3)} g
            </span>
          </div>

          <div className="flex justify-between border-b border-zinc-800 pb-3">
            <span className="text-gray-400">Gold Sold</span>

            <span className="text-red-400 font-bold">
              {stats.totalSellGrams.toFixed(3)} g
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-400">
              Total Realized Profit / Loss
            </span>

            <span
              className={`font-bold text-lg ${
                stats.realizedProfit >= 0
                  ? "text-green-400"
                  : "text-red-400"
              }`}
            >
              PKR {stats.realizedProfit.toLocaleString()}
            </span>
          </div>

        </div>

      </div>

      {/* ========================================== */}
      {/* QUICK HISTORY SUMMARY */}
      {/* ========================================== */}

      <div className="grid md:grid-cols-3 gap-6 mb-10">

        <div className="bg-zinc-900 border border-green-600 rounded-3xl p-6">

          <p className="text-gray-400 text-sm">
            BUY Transactions
          </p>

          <h2 className="text-3xl font-black text-green-400 mt-2">
            {transactions.filter((t) => t.tradeType === "BUY").length}
          </h2>

        </div>

        <div className="bg-zinc-900 border border-red-600 rounded-3xl p-6">

          <p className="text-gray-400 text-sm">
            SELL Transactions
          </p>

          <h2 className="text-3xl font-black text-red-400 mt-2">
            {transactions.filter((t) => t.tradeType === "SELL").length}
          </h2>

        </div>

        <div className="bg-zinc-900 border border-blue-600 rounded-3xl p-6">

          <p className="text-gray-400 text-sm">
            Completed Trades
          </p>

          <h2 className="text-3xl font-black text-blue-400 mt-2">
            {transactions.filter((t) => t.status === "Completed").length}
          </h2>

        </div>

      </div>

      {/* ========================================== */}
      {/* ENTERPRISE FOOTER */}
      {/* ========================================== */}

      <div className="mt-12 border-t border-zinc-800 pt-8 text-center text-gray-500 text-sm">

        <p className="font-semibold text-yellow-400 mb-2 text-lg">
          GoldTrade Enterprise V18 History
        </p>

        <p>
          Buy & Sell History • Profit/Loss • Live Analytics • JWT Protected
        </p>

        <p className="mt-2">
          Powered by GoldTrade Enterprise Backend API
        </p>

        <div className="mt-4 flex justify-center gap-6 flex-wrap text-xs">

          <span className="text-green-400">
            🟢 BUY History
          </span>

          <span className="text-red-400">
            🔴 SELL History
          </span>

          <span className="text-blue-400">
            🔒 JWT Secure
          </span>

          <span className="text-yellow-400">
            📊 Auto Refresh 30 Seconds
          </span>

        </div>

      </div>

    </div>
  );
};

export default GoldHistoryPage;