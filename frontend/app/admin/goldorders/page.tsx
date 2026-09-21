"use client";

/*
=========================================================
 GoldTrade V18 Enterprise
 Admin Gold Orders Manager
 Section 1/5
 Linux + Vercel + TypeScript Safe
=========================================================
*/

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import {
  ArrowLeft,
  Coins,
  RefreshCw,
  Search,
  TrendingUp,
  TrendingDown,
  Activity,
  ShieldCheck,
} from "lucide-react";

// ======================================================
// API URL
// ======================================================

const API =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

// ======================================================
// TYPES
// ======================================================

interface GoldOrder {
  _id: string;

  username: string;

  type: "BUY" | "SELL";

  grams: number;

  pricePerGram: number;

  totalAmount: number;

  status: string;

  createdAt: string;
}

interface DashboardAnalytics {
  totalTrades: number;
  completedTrades: number;

  totalBuyGram: number;
  totalSellGram: number;

  totalBuyVolume: number;
  totalSellVolume: number;

  buyPrice: number;
  sellPrice: number;

  marketStatus: "OPEN" | "CLOSED";

  tradingEnabled: boolean;
}

// ======================================================
// COMPONENT
// ======================================================

export default function GoldOrdersPage() {
  // ==========================================
  // PAGE STATE
  // ==========================================

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");

  // ==========================================
  // SEARCH + FILTER
  // ==========================================

  const [search, setSearch] = useState("");

  const [filterType, setFilterType] = useState<
    "ALL" | "BUY" | "SELL"
  >("ALL");

  // ==========================================
  // DATA
  // ==========================================

  const [orders, setOrders] = useState<GoldOrder[]>([]);

  const [analytics, setAnalytics] =
    useState<DashboardAnalytics>({
      totalTrades: 0,
      completedTrades: 0,

      totalBuyGram: 0,
      totalSellGram: 0,

      totalBuyVolume: 0,
      totalSellVolume: 0,

      buyPrice: 0,
      sellPrice: 0,

      marketStatus: "OPEN",
      tradingEnabled: true,
    });

  // ==========================================
  // AUTH HEADER
  // ==========================================

  const getHeaders = () => {
    const token = localStorage.getItem("token");

    return {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };
  };

  // ==========================================
  // LOAD GOLD ORDERS
  // ==========================================

  const loadOrders = async () => {
    try {
      setRefreshing(true);
      setErrorMessage("");

      const response = await fetch(
        `${API}/api/gold/admin/orders`,
        {
          headers: getHeaders(),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Unable to load Gold Orders."
        );
      }

      setOrders(data.orders || []);
    } catch (error: any) {
      console.error(error);

      setErrorMessage(
        error.message || "Unable to load Gold Orders."
      );
    } finally {
      setRefreshing(false);
    }
  };

  // ==========================================
  // LOAD DASHBOARD ANALYTICS
  // ==========================================

  const loadDashboardAnalytics = async () => {
    try {
      const response = await fetch(
        `${API}/api/gold/admin/dashboard`,
        {
          headers: getHeaders(),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Unable to load dashboard."
        );
      }

      setAnalytics(data.analytics);
    } catch (error: any) {
      console.error(error);

      setErrorMessage(
        error.message || "Unable to load dashboard analytics."
      );
    }
  };

  // ==========================================
  // LOAD PAGE
  // ==========================================

  const loadPage = async () => {
    try {
      setLoading(true);

      await Promise.all([
        loadOrders(),
        loadDashboardAnalytics(),
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPage();
  }, []);

  // ==========================================
  // SEARCH FILTER
  // ==========================================

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchSearch =
        order.username
          .toLowerCase()
          .includes(search.toLowerCase());

      const matchType =
        filterType === "ALL"
          ? true
          : order.type === filterType;

      return matchSearch && matchType;
    });
  }, [orders, search, filterType]);
    // =======================================================
  // LOADING SCREEN
  // =======================================================

  if (loading) {
    return (
      <main className="min-h-screen bg-black flex items-center justify-center text-yellow-400 text-xl font-bold">
        <RefreshCw className="animate-spin mr-3" size={28} />
        Loading Gold Orders Manager...
      </main>
    );
  }

  // =======================================================
  // PAGE START
  // =======================================================

  return (
    <main className="min-h-screen bg-black text-white p-6">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* ================================================= */}
        {/* HEADER */}
        {/* ================================================= */}

        <header className="flex flex-wrap items-center justify-between gap-4">

          <div>

            <h1 className="flex items-center gap-3 text-4xl font-black text-yellow-400">
              <Coins size={38} />
              Gold Orders Manager
            </h1>

            <p className="mt-2 text-gray-400">
              Enterprise monitoring dashboard for all Gold Buy & Sell orders.
            </p>

          </div>

          <div className="flex gap-3 flex-wrap">

            <Link
              href="/admin-dashboard"
              className="bg-zinc-800 hover:bg-zinc-700 px-5 py-3 rounded-xl flex items-center gap-2 font-bold transition"
            >
              <ArrowLeft size={18} />
              Dashboard
            </Link>

            <button
              type="button"
              onClick={loadPage}
              disabled={refreshing}
              className="bg-yellow-500 hover:bg-yellow-400 disabled:bg-yellow-700 disabled:cursor-not-allowed text-black px-5 py-3 rounded-xl flex items-center gap-2 font-bold transition"
            >
              <RefreshCw
                size={18}
                className={refreshing ? "animate-spin" : ""}
              />

              {refreshing ? "Refreshing..." : "Refresh"}

            </button>

          </div>

        </header>

        {/* ================================================= */}
        {/* ERROR MESSAGE */}
        {/* ================================================= */}

        {errorMessage && (
          <div className="bg-red-500/10 border border-red-500 rounded-xl p-4 text-red-400 font-semibold">
            {errorMessage}
          </div>
        )}

        {/* ================================================= */}
        {/* ANALYTICS CARDS */}
        {/* ================================================= */}

        <section className="grid md:grid-cols-2 xl:grid-cols-4 gap-5">

          {/* TOTAL ORDERS */}

          <div className="bg-zinc-900 border border-cyan-500 rounded-2xl p-5">

            <div className="flex items-center justify-between">

              <p className="text-gray-400 text-sm">
                Total Orders
              </p>

              <Activity className="text-cyan-400" size={24} />

            </div>

            <h2 className="text-3xl font-black text-cyan-400 mt-3">
              {analytics.totalTrades}
            </h2>

            <p className="text-xs text-gray-500 mt-2">
              Buy + Sell transactions
            </p>

          </div>

          {/* COMPLETED */}

          <div className="bg-zinc-900 border border-green-500 rounded-2xl p-5">

            <div className="flex items-center justify-between">

              <p className="text-gray-400 text-sm">
                Completed Orders
              </p>

              <ShieldCheck className="text-green-400" size={24} />

            </div>

            <h2 className="text-3xl font-black text-green-400 mt-3">
              {analytics.completedTrades}
            </h2>

            <p className="text-xs text-gray-500 mt-2">
              Successfully executed
            </p>

          </div>

          {/* BUY VOLUME */}

          <div className="bg-zinc-900 border border-yellow-500 rounded-2xl p-5">

            <div className="flex items-center justify-between">

              <p className="text-gray-400 text-sm">
                Total Buy Volume
              </p>

              <TrendingUp className="text-yellow-400" size={24} />

            </div>

            <h2 className="text-2xl font-black text-yellow-400 mt-3">
              PKR {analytics.totalBuyVolume.toLocaleString()}
            </h2>

            <p className="text-xs text-gray-500 mt-2">
              {analytics.totalBuyGram.toFixed(2)} grams purchased
            </p>

          </div>

          {/* SELL VOLUME */}

          <div className="bg-zinc-900 border border-red-500 rounded-2xl p-5">

            <div className="flex items-center justify-between">

              <p className="text-gray-400 text-sm">
                Total Sell Volume
              </p>

              <TrendingDown className="text-red-400" size={24} />

            </div>

            <h2 className="text-2xl font-black text-red-400 mt-3">
              PKR {analytics.totalSellVolume.toLocaleString()}
            </h2>

            <p className="text-xs text-gray-500 mt-2">
              {analytics.totalSellGram.toFixed(2)} grams sold
            </p>

          </div>

        </section>

        {/* ================================================= */}
        {/* LIVE MARKET STATUS */}
        {/* ================================================= */}

        <section className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6">

          <div className="flex flex-wrap items-center justify-between gap-5">

            <div>

              <h2 className="text-2xl font-black text-yellow-400 flex items-center gap-2">
                <ShieldCheck size={28} />
                Live Gold Market
              </h2>

              <p className="text-gray-400 mt-2">
                Current market status used for all Buy/Sell transactions.
              </p>

            </div>

            <div className="flex gap-3 flex-wrap">

              <span
                className={`px-4 py-2 rounded-full font-bold ${
                  analytics.marketStatus === "OPEN"
                    ? "bg-green-500/20 text-green-400 border border-green-500"
                    : "bg-red-500/20 text-red-400 border border-red-500"
                }`}
              >
                Market {analytics.marketStatus}
              </span>

              <span
                className={`px-4 py-2 rounded-full font-bold ${
                  analytics.tradingEnabled
                    ? "bg-green-500/20 text-green-400 border border-green-500"
                    : "bg-red-500/20 text-red-400 border border-red-500"
                }`}
              >
                Trading {analytics.tradingEnabled ? "Enabled" : "Disabled"}
              </span>

            </div>

          </div>

          {/* LIVE PRICE CARDS */}

          <div className="grid md:grid-cols-2 gap-5 mt-6">

            <div className="bg-black border border-yellow-500 rounded-xl p-5">

              <p className="text-gray-500 text-sm">
                Current Buy Price
              </p>

              <h3 className="text-3xl font-black text-yellow-400 mt-3">
                PKR {analytics.buyPrice.toLocaleString()}
              </h3>

            </div>

            <div className="bg-black border border-green-500 rounded-xl p-5">

              <p className="text-gray-500 text-sm">
                Current Sell Price
              </p>

              <h3 className="text-3xl font-black text-green-400 mt-3">
                PKR {analytics.sellPrice.toLocaleString()}
              </h3>

            </div>

          </div>

        </section>
                <section className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 space-y-5">

          <div className="flex items-center justify-between flex-wrap gap-4">

            <h2 className="text-2xl font-black text-yellow-400">
              Search & Filter Gold Orders
            </h2>

            <span className="bg-yellow-500/20 text-yellow-400 px-4 py-2 rounded-full text-sm font-bold">
              {filteredOrders.length} Orders Found
            </span>

          </div>

          {/* SEARCH BOX */}

          <div className="relative">

            <Search
              size={20}
              className="absolute left-4 top-3.5 text-gray-500"
            />

            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search username..."
              className="w-full bg-black border border-zinc-700 rounded-xl pl-12 pr-4 py-3 outline-none focus:border-yellow-500"
            />

          </div>

          {/* FILTER BUTTONS */}

          <div className="flex flex-wrap gap-3">

            {/* ALL */}

            <button
              type="button"
              onClick={() => setFilterType("ALL")}
              className={`px-5 py-2 rounded-xl font-bold transition ${
                filterType === "ALL"
                  ? "bg-yellow-500 text-black"
                  : "bg-zinc-800 hover:bg-zinc-700 text-gray-300"
              }`}
            >
              All Orders
            </button>

            {/* BUY */}

            <button
              type="button"
              onClick={() => setFilterType("BUY")}
              className={`px-5 py-2 rounded-xl font-bold transition ${
                filterType === "BUY"
                  ? "bg-green-500 text-black"
                  : "bg-zinc-800 hover:bg-zinc-700 text-green-400"
              }`}
            >
              Buy Orders
            </button>

            {/* SELL */}

            <button
              type="button"
              onClick={() => setFilterType("SELL")}
              className={`px-5 py-2 rounded-xl font-bold transition ${
                filterType === "SELL"
                  ? "bg-red-500 text-white"
                  : "bg-zinc-800 hover:bg-zinc-700 text-red-400"
              }`}
            >
              Sell Orders
            </button>

            {/* RESET */}

            <button
              type="button"
              onClick={() => {
                setSearch("");
                setFilterType("ALL");
              }}
              className="ml-auto bg-zinc-700 hover:bg-zinc-600 px-5 py-2 rounded-xl font-bold transition"
            >
              Reset Filters
            </button>

          </div>

        </section>

        {/* ================================================= */}
        {/* FILTER SUMMARY */}
        {/* ================================================= */}

        <section className="grid md:grid-cols-3 gap-5">

          {/* TOTAL */}

          <div className="bg-zinc-900 border border-yellow-500 rounded-xl p-5">

            <p className="text-gray-500 text-sm">
              Visible Orders
            </p>

            <h3 className="text-3xl font-black text-yellow-400 mt-2">
              {filteredOrders.length}
            </h3>

            <p className="text-xs text-gray-500 mt-2">
              Current search result
            </p>

          </div>

          {/* BUY COUNT */}

          <div className="bg-zinc-900 border border-green-500 rounded-xl p-5">

            <p className="text-gray-500 text-sm">
              Buy Orders
            </p>

            <h3 className="text-3xl font-black text-green-400 mt-2">
              {
                filteredOrders.filter(
                  (order) => order.type === "BUY"
                ).length
              }
            </h3>

            <p className="text-xs text-gray-500 mt-2">
              Current filtered BUY orders
            </p>

          </div>

          {/* SELL COUNT */}

          <div className="bg-zinc-900 border border-red-500 rounded-xl p-5">

            <p className="text-gray-500 text-sm">
              Sell Orders
            </p>

            <h3 className="text-3xl font-black text-red-400 mt-2">
              {
                filteredOrders.filter(
                  (order) => order.type === "SELL"
                ).length
              }
            </h3>

            <p className="text-xs text-gray-500 mt-2">
              Current filtered SELL orders
            </p>

          </div>

        </section>
                <section className="bg-zinc-900 border border-yellow-500 rounded-2xl p-6">

          <div className="flex items-center justify-between flex-wrap gap-4 mb-6">

            <h2 className="text-2xl font-black text-yellow-400">
              Gold Orders Ledger
            </h2>

            <span className="bg-green-500/20 text-green-400 px-4 py-2 rounded-full text-sm font-bold">
              Read Only Audit
            </span>

          </div>

          {/* =============================================== */}
          {/* DESKTOP TABLE */}
          {/* =============================================== */}

          <div className="hidden lg:block overflow-x-auto rounded-xl border border-zinc-700">

            <table className="w-full text-sm">

              <thead className="bg-black text-yellow-400">

                <tr>

                  <th className="text-left px-4 py-4">User</th>

                  <th className="text-left px-4 py-4">Type</th>

                  <th className="text-right px-4 py-4">Grams</th>

                  <th className="text-right px-4 py-4">Price / Gram</th>

                  <th className="text-right px-4 py-4">Total Amount</th>

                  <th className="text-center px-4 py-4">Status</th>

                  <th className="text-right px-4 py-4">Date</th>

                </tr>

              </thead>

              <tbody>

                {filteredOrders.length === 0 ? (

                  <tr>

                    <td
                      colSpan={7}
                      className="text-center py-10 text-gray-500"
                    >
                      No Gold Orders Found.
                    </td>

                  </tr>

                ) : (

                  filteredOrders.map((order) => (

                    <tr
                      key={order._id}
                      className="border-t border-zinc-800 hover:bg-zinc-800 transition"
                    >

                      {/* USER */}

                      <td className="px-4 py-4">

                        <div className="font-bold text-yellow-400">
                          {order.username}
                        </div>

                        <div className="text-xs text-gray-500">
                          #{order._id.slice(-8).toUpperCase()}
                        </div>

                      </td>

                      {/* TYPE */}

                      <td className="px-4 py-4">

                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold ${
                            order.type === "BUY"
                              ? "bg-green-500/20 text-green-400"
                              : "bg-red-500/20 text-red-400"
                          }`}
                        >
                          {order.type}
                        </span>

                      </td>

                      {/* GRAMS */}

                      <td className="px-4 py-4 text-right font-bold text-yellow-300">
                        {Number(order.grams).toFixed(2)} g
                      </td>

                      {/* PRICE */}

                      <td className="px-4 py-4 text-right text-cyan-400 font-semibold">
                        PKR {Number(order.pricePerGram).toLocaleString()}
                      </td>

                      {/* TOTAL */}

                      <td className="px-4 py-4 text-right font-black text-white">
                        PKR {Number(order.totalAmount).toLocaleString()}
                      </td>

                      {/* STATUS */}

                      <td className="px-4 py-4 text-center">

                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold ${
                            order.status === "Completed"
                              ? "bg-green-500/20 text-green-400"
                              : order.status === "Pending"
                              ? "bg-yellow-500/20 text-yellow-400"
                              : "bg-red-500/20 text-red-400"
                          }`}
                        >
                          {order.status}
                        </span>

                      </td>

                      {/* DATE */}

                      <td className="px-4 py-4 text-right text-gray-400 text-xs">
                        {new Date(order.createdAt).toLocaleDateString("en-GB")}
                        <br />
                        {new Date(order.createdAt).toLocaleTimeString("en-GB")}
                      </td>

                    </tr>

                  ))

                )}

              </tbody>

            </table>

          </div>

          {/* =============================================== */}
          {/* MOBILE CARDS */}
          {/* =============================================== */}

          <div className="grid lg:hidden gap-4">

            {filteredOrders.length === 0 ? (

              <div className="text-center py-10 text-gray-500">
                No Gold Orders Found.
              </div>

            ) : (

              filteredOrders.map((order) => (

                <div
                  key={order._id}
                  className="bg-black border border-zinc-700 rounded-xl p-5 space-y-4"
                >

                  {/* HEADER */}

                  <div className="flex justify-between items-center">

                    <div>

                      <h3 className="font-bold text-yellow-400 text-lg">
                        {order.username}
                      </h3>

                      <p className="text-xs text-gray-500">
                        #{order._id.slice(-8).toUpperCase()}
                      </p>

                    </div>

                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold ${
                        order.type === "BUY"
                          ? "bg-green-500/20 text-green-400"
                          : "bg-red-500/20 text-red-400"
                      }`}
                    >
                      {order.type}
                    </span>

                  </div>

                  {/* DETAILS */}

                  <div className="grid grid-cols-2 gap-3 text-sm">

                    <div>

                      <p className="text-gray-500">Grams</p>

                      <p className="text-yellow-300 font-bold">
                        {Number(order.grams).toFixed(2)} g
                      </p>

                    </div>

                    <div>

                      <p className="text-gray-500">Price</p>

                      <p className="text-cyan-400 font-bold">
                        PKR {Number(order.pricePerGram).toLocaleString()}
                      </p>

                    </div>

                    <div>

                      <p className="text-gray-500">Amount</p>

                      <p className="text-white font-black">
                        PKR {Number(order.totalAmount).toLocaleString()}
                      </p>

                    </div>

                    <div>

                      <p className="text-gray-500">Status</p>

                      <span
                        className={`px-2 py-1 rounded-full text-xs font-bold ${
                          order.status === "Completed"
                            ? "bg-green-500/20 text-green-400"
                            : order.status === "Pending"
                            ? "bg-yellow-500/20 text-yellow-400"
                            : "bg-red-500/20 text-red-400"
                        }`}
                      >
                        {order.status}
                      </span>

                    </div>

                  </div>

                  {/* DATE */}

                  <div className="border-t border-zinc-800 pt-3 text-xs text-gray-400 flex justify-between">

                    <span>
                      {new Date(order.createdAt).toLocaleDateString("en-GB")}
                    </span>

                    <span>
                      {new Date(order.createdAt).toLocaleTimeString("en-GB")}
                    </span>

                  </div>

                </div>

              ))

            )}

          </div>

        </section>

        {/* ================================================= */}
        {/* ENTERPRISE AUDIT INFORMATION */}
        {/* ================================================= */}

        <section className="grid md:grid-cols-3 gap-5">

          <div className="bg-zinc-900 border border-yellow-500 rounded-xl p-5">

            <Coins className="text-yellow-400 mb-3" size={28} />

            <h3 className="font-bold text-yellow-400 mb-2">
              Buy Orders
            </h3>

            <p className="text-sm text-gray-400">
              Every BUY order deducts PKR Wallet and credits Gold Wallet automatically.
            </p>

          </div>

          <div className="bg-zinc-900 border border-red-500 rounded-xl p-5">

            <TrendingDown className="text-red-400 mb-3" size={28} />

            <h3 className="font-bold text-red-400 mb-2">
              Sell Orders
            </h3>

            <p className="text-sm text-gray-400">
              Every SELL order deducts Gold Wallet and credits PKR Wallet instantly.
            </p>

          </div>

          <div className="bg-zinc-900 border border-green-500 rounded-xl p-5">

            <ShieldCheck className="text-green-400 mb-3" size={28} />

            <h3 className="font-bold text-green-400 mb-2">
              Enterprise Audit
            </h3>

            <p className="text-sm text-gray-400">
              Orders cannot be edited from Admin Panel. All records remain immutable for audit history.
            </p>

          </div>

        </section>
                <section className="bg-zinc-900 border border-zinc-700 rounded-2xl p-5">

          <div className="flex flex-col md:flex-row items-center justify-between gap-4">

            <div className="text-sm text-gray-400">
              Showing{" "}
              <span className="text-yellow-400 font-bold">
                {filteredOrders.length}
              </span>{" "}
              Gold Orders
            </div>

            <div className="flex items-center gap-3">

              <button
                type="button"
                disabled
                className="px-4 py-2 rounded-xl bg-zinc-800 text-gray-500 cursor-not-allowed"
              >
                Previous
              </button>

              <span className="px-4 py-2 rounded-xl bg-yellow-500 text-black font-bold">
                Page 1
              </span>

              <button
                type="button"
                disabled
                className="px-4 py-2 rounded-xl bg-zinc-800 text-gray-500 cursor-not-allowed"
              >
                Next
              </button>

            </div>

          </div>

        </section>

        {/* ================================================= */}
        {/* QUICK MARKET SUMMARY */}
        {/* ================================================= */}

        <section className="grid md:grid-cols-2 xl:grid-cols-4 gap-5">

          <div className="bg-zinc-900 border border-yellow-500 rounded-xl p-5">

            <p className="text-gray-500 text-sm">
              Buy Price
            </p>

            <h3 className="text-2xl font-black text-yellow-400 mt-2">
              PKR {analytics.buyPrice.toLocaleString()}
            </h3>

          </div>

          <div className="bg-zinc-900 border border-green-500 rounded-xl p-5">

            <p className="text-gray-500 text-sm">
              Sell Price
            </p>

            <h3 className="text-2xl font-black text-green-400 mt-2">
              PKR {analytics.sellPrice.toLocaleString()}
            </h3>

          </div>

          <div className="bg-zinc-900 border border-cyan-500 rounded-xl p-5">

            <p className="text-gray-500 text-sm">
              Market Status
            </p>

            <h3
              className={`text-2xl font-black mt-2 ${
                analytics.marketStatus === "OPEN"
                  ? "text-green-400"
                  : "text-red-400"
              }`}
            >
              {analytics.marketStatus}
            </h3>

          </div>

          <div className="bg-zinc-900 border border-purple-500 rounded-xl p-5">

            <p className="text-gray-500 text-sm">
              Trading Engine
            </p>

            <h3
              className={`text-2xl font-black mt-2 ${
                analytics.tradingEnabled
                  ? "text-green-400"
                  : "text-red-400"
              }`}
            >
              {analytics.tradingEnabled ? "ENABLED" : "DISABLED"}
            </h3>

          </div>

        </section>

        {/* ================================================= */}
        {/* ENTERPRISE SECURITY NOTICE */}
        {/* ================================================= */}

        <section className="bg-zinc-900 border border-green-500 rounded-2xl p-6">

          <h2 className="text-xl font-black text-green-400 mb-4">
            Enterprise Audit Protection
          </h2>

          <div className="grid md:grid-cols-2 gap-5 text-sm">

            <div className="bg-black border border-zinc-700 rounded-xl p-4">

              <h3 className="font-bold text-yellow-400 mb-2">
                Immutable Records
              </h3>

              <p className="text-gray-400">
                Gold BUY and SELL orders cannot be edited or deleted from the
                Admin Panel. Every order remains permanently stored for audit.
              </p>

            </div>

            <div className="bg-black border border-zinc-700 rounded-xl p-4">

              <h3 className="font-bold text-green-400 mb-2">
                Wallet Synchronization
              </h3>

              <p className="text-gray-400">
                Every Gold order is synchronized with PKR Wallet, Gold Wallet,
                Transaction Ledger and Gold Portfolio automatically.
              </p>

            </div>

          </div>

        </section>

        {/* ================================================= */}
        {/* REFRESH INFORMATION */}
        {/* ================================================= */}

        <section className="bg-zinc-900 border border-cyan-500 rounded-2xl p-6">

          <div className="flex flex-wrap justify-between items-center gap-5">

            <div>

              <h2 className="text-xl font-black text-cyan-400">
                Gold Orders Synchronization
              </h2>

              <p className="text-gray-400 mt-2">
                Refresh reloads Gold Orders and Dashboard Analytics from the
                backend.
              </p>

            </div>

            <button
              type="button"
              onClick={loadPage}
              disabled={refreshing}
              className="bg-cyan-500 hover:bg-cyan-400 disabled:bg-cyan-700 disabled:cursor-not-allowed text-black px-6 py-3 rounded-xl flex items-center gap-3 font-bold transition"
            >
              <RefreshCw
                size={18}
                className={refreshing ? "animate-spin" : ""}
              />

              {refreshing ? "Refreshing..." : "Sync Orders"}

            </button>

          </div>

        </section>

        {/* ================================================= */}
        {/* FOOTER */}
        {/* ================================================= */}

        <footer className="border-t border-zinc-800 pt-8 text-center">

          <h3 className="text-yellow-500 text-xl font-black">
            GoldTrade V18 Enterprise
          </h3>

          <p className="text-gray-500 mt-2">
            Gold Orders Manager • Read Only Audit Ledger
          </p>

          <p className="text-gray-600 text-sm mt-2">
            Linux Safe • TypeScript Safe • Render Ready • Vercel Ready
          </p>

        </footer>

      </div>
    </main>
  );
}