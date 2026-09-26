"use client";

/* ==========================================================
   GoldTrade V18 Enterprise
   Admin Gold Manager
   SECTION 1/4 - Foundation (Compile Safe)
========================================================== */

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import {
  Coins,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Search,
  CheckCircle,
  XCircle,
  ShieldCheck,
  ArrowDownRight,
  ArrowUpRight,
} from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

/* ================= INTERFACES ================= */

interface GoldSettings {
  buyGoldPrice: number;
  sellGoldPrice: number;
  goldPriceUSD: number;
  usdToPkr: number;
  goldTradingEnabled: boolean;
  marketStatus: "OPEN" | "CLOSED";
}

interface GoldOrder {
  _id: string;
  username: string;
  orderType: "BUY" | "SELL";
  quantity: number;
  price: number;
  totalAmount: number;
  status: "Pending" | "Approved" | "Rejected";
  createdAt: string;
}

export default function AdminGoldPage() {

  /* ---------------- LOADING ---------------- */

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  /* ---------------- SETTINGS ---------------- */

  const [settings, setSettings] = useState<GoldSettings>({
    buyGoldPrice: 0,
    sellGoldPrice: 0,
    goldPriceUSD: 0,
    usdToPkr: 0,
    goldTradingEnabled: true,
    marketStatus: "OPEN",
  });

  /* ---------------- ORDERS ---------------- */

  const [buyOrders, setBuyOrders] = useState<GoldOrder[]>([]);
  const [sellOrders, setSellOrders] = useState<GoldOrder[]>([]);

  /* ---------------- SEARCH ---------------- */

  const [search, setSearch] = useState("");

  /* ---------------- PAGINATION ---------------- */

  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  /* ---------------- AUTH HEADER ---------------- */

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

  // =========================================================
  // LOAD GOLD SETTINGS
  // GET /api/admin/gold/settings
  // =========================================================

  const loadGoldSettings = async () => {
    const response = await fetch(
      `${API}/api/admin/gold/settings`,
      {
        headers: getHeaders(),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Unable to load Gold settings.");
    }

    setSettings(data.settings);
  };

  // =========================================================
  // LOAD BUY ORDERS
  // GET /api/admin/gold/buy-orders
  // =========================================================

  const loadBuyOrders = async () => {
    const response = await fetch(
      `${API}/api/admin/gold/buy-orders`,
      {
        headers: getHeaders(),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Unable to load buy orders.");
    }

    setBuyOrders(data.orders || []);
  };

  // =========================================================
  // LOAD SELL ORDERS
  // GET /api/admin/gold/sell-orders
  // =========================================================

  const loadSellOrders = async () => {
    const response = await fetch(
      `${API}/api/admin/gold/sell-orders`,
      {
        headers: getHeaders(),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Unable to load sell orders.");
    }

    setSellOrders(data.orders || []);
  };

  // =========================================================
  // LOAD DASHBOARD
  // =========================================================

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setErrorMessage("");

      await Promise.all([
        loadGoldSettings(),
        loadBuyOrders(),
        loadSellOrders(),
      ]);
    } catch (error: any) {
      setErrorMessage(error.message || "Unable to load Gold dashboard.");
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // REFRESH DASHBOARD
  // =========================================================

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

  // =========================================================
  // SEARCH FILTERS
  // =========================================================

  const filteredBuyOrders = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return buyOrders.filter((order) => {
      if (!keyword) return true;

      return order.username.toLowerCase().includes(keyword);
    });
  }, [buyOrders, search]);

  const filteredSellOrders = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return sellOrders.filter((order) => {
      if (!keyword) return true;

      return order.username.toLowerCase().includes(keyword);
    });
  }, [sellOrders, search]);

  // =========================================================
  // ANALYTICS
  // =========================================================

  const analytics = useMemo(() => {
    const pendingBuy = buyOrders.filter(
      (order) => order.status === "Pending"
    ).length;

    const pendingSell = sellOrders.filter(
      (order) => order.status === "Pending"
    ).length;

    const totalBuyVolume = buyOrders.reduce(
      (sum, order) => sum + Number(order.quantity || 0),
      0
    );

    const totalSellVolume = sellOrders.reduce(
      (sum, order) => sum + Number(order.quantity || 0),
      0
    );

    return {
      pendingBuy,
      pendingSell,
      totalBuyVolume,
      totalSellVolume,
    };
  }, [buyOrders, sellOrders]);

  /* ==========================================================
     LOADING SCREEN
  ========================================================== */

  if (loading) {
    return (
      <main className="min-h-screen bg-black flex items-center justify-center">
        <div className="flex items-center gap-3 text-yellow-400 text-xl font-bold">
          <RefreshCw className="animate-spin" size={28} />
          Loading Gold Admin Dashboard...
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
            <h1 className="flex items-center gap-3 text-4xl font-black text-yellow-400">
              <Coins size={38} />
              Admin Gold Manager
            </h1>

            <p className="text-gray-400 mt-2">
              GoldTrade V18 Enterprise • Live Gold Market Administration
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
              className="bg-yellow-400 hover:bg-yellow-300 disabled:bg-yellow-700 disabled:cursor-not-allowed text-black px-5 py-3 rounded-xl font-bold flex items-center gap-2 transition"
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
        {/* GOLD PRICE CARDS */}
        {/* ============================================= */}

        <section className="grid md:grid-cols-2 xl:grid-cols-4 gap-5">

          <div className="bg-zinc-900 border border-green-500 rounded-2xl p-5">
            <TrendingUp className="text-green-400 mb-3" size={28} />

            <p className="text-gray-500 text-sm uppercase">
              Buy Gold Price
            </p>

            <h2 className="text-3xl font-black text-green-400 mt-2">
              PKR {settings.buyGoldPrice.toLocaleString()}
            </h2>
          </div>

          <div className="bg-zinc-900 border border-red-500 rounded-2xl p-5">
            <TrendingDown className="text-red-400 mb-3" size={28} />

            <p className="text-gray-500 text-sm uppercase">
              Sell Gold Price
            </p>

            <h2 className="text-3xl font-black text-red-400 mt-2">
              PKR {settings.sellGoldPrice.toLocaleString()}
            </h2>
          </div>

          <div className="bg-zinc-900 border border-cyan-500 rounded-2xl p-5">
            <ArrowDownRight className="text-cyan-400 mb-3" size={28} />

            <p className="text-gray-500 text-sm uppercase">
              Pending Buy Orders
            </p>

            <h2 className="text-3xl font-black text-cyan-400 mt-2">
              {analytics.pendingBuy}
            </h2>
          </div>

          <div className="bg-zinc-900 border border-orange-500 rounded-2xl p-5">
            <ArrowUpRight className="text-orange-400 mb-3" size={28} />

            <p className="text-gray-500 text-sm uppercase">
              Pending Sell Orders
            </p>

            <h2 className="text-3xl font-black text-orange-400 mt-2">
              {analytics.pendingSell}
            </h2>
          </div>

        </section>

        {/* ============================================= */}
        {/* MARKET ANALYTICS */}
        {/* ============================================= */}

        <section className="grid lg:grid-cols-2 gap-5">

          <div className="bg-zinc-900 border border-green-500 rounded-2xl p-6">

            <p className="text-gray-500 text-sm uppercase">
              Total Buy Volume
            </p>

            <h2 className="text-4xl font-black text-green-400 mt-3">
              {analytics.totalBuyVolume.toFixed(2)} g
            </h2>

          </div>

          <div className="bg-zinc-900 border border-orange-500 rounded-2xl p-6">

            <p className="text-gray-500 text-sm uppercase">
              Total Sell Volume
            </p>

            <h2 className="text-4xl font-black text-orange-400 mt-3">
              {analytics.totalSellVolume.toFixed(2)} g
            </h2>

          </div>

        </section>

        {/* ============================================= */}
        {/* GOLD MARKET STATUS */}
        {/* ============================================= */}

        <section className="bg-zinc-900 border border-yellow-500 rounded-2xl p-6 space-y-6">

          <div className="flex justify-between items-center flex-wrap gap-4">

            <div>
              <h2 className="text-2xl font-black text-yellow-400">
                Gold Market Status
              </h2>

              <p className="text-gray-400 text-sm mt-2">
                Current Gold Market configuration across GoldTrade.
              </p>
            </div>

            <div
              className={`px-5 py-3 rounded-xl font-bold ${
                settings.goldTradingEnabled
                  ? "bg-green-500/20 border border-green-500 text-green-400"
                  : "bg-red-500/20 border border-red-500 text-red-400"
              }`}
            >
              {settings.goldTradingEnabled
                ? "Trading Enabled"
                : "Trading Disabled"}
            </div>

          </div>

          <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-5">

            <div className="bg-black border border-green-500 rounded-xl p-5">
              <p className="text-gray-500 text-sm">Buy Price</p>

              <h3 className="text-2xl font-black text-green-400 mt-2">
                PKR {settings.buyGoldPrice.toLocaleString()}
              </h3>
            </div>

            <div className="bg-black border border-red-500 rounded-xl p-5">
              <p className="text-gray-500 text-sm">Sell Price</p>

              <h3 className="text-2xl font-black text-red-400 mt-2">
                PKR {settings.sellGoldPrice.toLocaleString()}
              </h3>
            </div>

            <div className="bg-black border border-cyan-500 rounded-xl p-5">
              <p className="text-gray-500 text-sm">Gold USD Price</p>

              <h3 className="text-2xl font-black text-cyan-400 mt-2">
                ${settings.goldPriceUSD.toLocaleString()}
              </h3>
            </div>

            <div className="bg-black border border-purple-500 rounded-xl p-5">
              <p className="text-gray-500 text-sm">USD → PKR</p>

              <h3 className="text-2xl font-black text-purple-400 mt-2">
                {settings.usdToPkr}
              </h3>
            </div>

          </div>

          <div className="bg-black border border-zinc-700 rounded-xl p-5">

            <p className="text-gray-500 text-sm">
              Market Status
            </p>

            <h3
              className={`text-2xl font-black mt-2 ${
                settings.marketStatus === "OPEN"
                  ? "text-green-400"
                  : "text-red-400"
              }`}
            >
              {settings.marketStatus === "OPEN"
                ? "MARKET OPEN"
                : "MARKET CLOSED"}
            </h3>

          </div>

        </section>

        {/* ============================================= */}
        {/* SEARCH BAR */}
        {/* ============================================= */}

        <section className="bg-zinc-900 border border-yellow-500 rounded-2xl p-6 space-y-5">

          <div>
            <h2 className="text-2xl font-black text-yellow-400">
              Search Gold Orders
            </h2>

            <p className="text-gray-400 text-sm mt-2">
              Search gold buy or sell orders by username.
            </p>
          </div>

          <div className="relative">

            <Search
              size={18}
              className="absolute left-4 top-4 text-gray-500"
            />

            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search username..."
              className="w-full bg-black border border-zinc-700 rounded-xl pl-11 pr-4 py-3 text-white focus:border-yellow-500 outline-none"
            />

          </div>

          <div className="flex flex-wrap gap-3">

            <span className="bg-black border border-zinc-700 px-4 py-2 rounded-full text-sm">
              Buy Orders:
              <span className="ml-2 text-green-400 font-bold">
                {filteredBuyOrders.length}
              </span>
            </span>

            <span className="bg-black border border-zinc-700 px-4 py-2 rounded-full text-sm">
              Sell Orders:
              <span className="ml-2 text-orange-400 font-bold">
                {filteredSellOrders.length}
              </span>
            </span>

          </div>

        </section>

        {/* ============================================= */}
        {/* PENDING GOLD BUY ORDERS */}
        {/* ============================================= */}

        <section className="bg-zinc-900 border border-green-500 rounded-2xl overflow-hidden">

          <div className="flex justify-between items-center px-6 py-5 border-b border-zinc-800 flex-wrap gap-3">
            <div>
              <h2 className="text-2xl font-black text-green-400">
                Pending Gold Buy Orders
              </h2>
              <p className="text-gray-400 text-sm mt-1">
                Review customer buy gold requests.
              </p>
            </div>

            <span className="bg-green-500/20 border border-green-500 text-green-400 px-4 py-2 rounded-full text-sm font-bold">
              {filteredBuyOrders.length} Pending
            </span>
          </div>

          {/* Desktop Table */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full min-w-[1100px]">
              <thead className="bg-black text-gray-400 text-sm">
                <tr>
                  <th className="text-left px-5 py-4">Username</th>
                  <th className="text-left px-5 py-4">Quantity</th>
                  <th className="text-left px-5 py-4">Price</th>
                  <th className="text-left px-5 py-4">Total</th>
                  <th className="text-left px-5 py-4">Date</th>
                  <th className="text-center px-5 py-4">Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredBuyOrders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-10 text-gray-500">
                      No pending buy orders found.
                    </td>
                  </tr>
                ) : (
                  filteredBuyOrders.map((order) => (
                    <tr
                      key={order._id}
                      className="border-t border-zinc-800 hover:bg-zinc-800/40 transition"
                    >
                      <td className="px-5 py-4 font-bold text-white">
                        {order.username}
                      </td>

                      <td className="px-5 py-4 text-yellow-400 font-semibold">
                        {order.quantity} g
                      </td>

                      <td className="px-5 py-4 text-green-400 font-semibold">
                        PKR {order.price.toLocaleString()}
                      </td>

                      <td className="px-5 py-4 text-cyan-400 font-bold">
                        PKR {order.totalAmount.toLocaleString()}
                      </td>

                      <td className="px-5 py-4 text-gray-300 text-sm">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex justify-center gap-2 flex-wrap">

                          <button className="bg-green-500 hover:bg-green-400 text-black px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition">
                            <CheckCircle size={14} />
                            Approve
                          </button>

                          <button className="bg-red-500 hover:bg-red-400 text-black px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition">
                            <XCircle size={14} />
                            Reject
                          </button>

                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="lg:hidden p-5 space-y-4">
            {filteredBuyOrders.map((order) => (
              <div
                key={order._id}
                className="bg-black border border-zinc-700 rounded-xl p-5 space-y-4"
              >
                <div className="flex justify-between items-center">
                  <h3 className="font-black text-lg text-white">
                    {order.username}
                  </h3>

                  <span className="text-xs text-gray-500">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-gray-500">Quantity</p>
                    <p className="text-yellow-400 font-bold">{order.quantity} g</p>
                  </div>

                  <div>
                    <p className="text-gray-500">Price</p>
                    <p className="text-green-400 font-bold">
                      PKR {order.price.toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="bg-zinc-900 border border-cyan-500 rounded-xl p-4">
                  <p className="text-xs text-gray-500 uppercase">Order Total</p>
                  <h3 className="text-2xl font-black text-cyan-400 mt-2">
                    PKR {order.totalAmount.toLocaleString()}
                  </h3>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button className="bg-green-500 hover:bg-green-400 text-black py-3 rounded-xl font-bold flex justify-center items-center gap-2 transition">
                    <CheckCircle size={18} />
                    Approve
                  </button>

                  <button className="bg-red-500 hover:bg-red-400 text-black py-3 rounded-xl font-bold flex justify-center items-center gap-2 transition">
                    <XCircle size={18} />
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>

        </section>

        {/* ============================================= */}
        {/* PENDING GOLD SELL ORDERS */}
        {/* ============================================= */}

        <section className="bg-zinc-900 border border-orange-500 rounded-2xl overflow-hidden">

          <div className="flex justify-between items-center px-6 py-5 border-b border-zinc-800 flex-wrap gap-3">
            <div>
              <h2 className="text-2xl font-black text-orange-400">
                Pending Gold Sell Orders
              </h2>
              <p className="text-gray-400 text-sm mt-1">
                Review customer sell gold requests.
              </p>
            </div>

            <span className="bg-orange-500/20 border border-orange-500 text-orange-400 px-4 py-2 rounded-full text-sm font-bold">
              {filteredSellOrders.length} Pending
            </span>
          </div>

          {/* Desktop Table */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full min-w-[1100px]">
              <thead className="bg-black text-gray-400 text-sm">
                <tr>
                  <th className="text-left px-5 py-4">Username</th>
                  <th className="text-left px-5 py-4">Quantity</th>
                  <th className="text-left px-5 py-4">Price</th>
                  <th className="text-left px-5 py-4">Total</th>
                  <th className="text-left px-5 py-4">Date</th>
                  <th className="text-center px-5 py-4">Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredSellOrders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-10 text-gray-500">
                      No pending sell orders found.
                    </td>
                  </tr>
                ) : (
                  filteredSellOrders.map((order) => (
                    <tr
                      key={order._id}
                      className="border-t border-zinc-800 hover:bg-zinc-800/40 transition"
                    >
                      <td className="px-5 py-4 font-bold text-white">
                        {order.username}
                      </td>

                      <td className="px-5 py-4 text-yellow-400 font-semibold">
                        {order.quantity} g
                      </td>

                      <td className="px-5 py-4 text-red-400 font-semibold">
                        PKR {order.price.toLocaleString()}
                      </td>

                      <td className="px-5 py-4 text-cyan-400 font-bold">
                        PKR {order.totalAmount.toLocaleString()}
                      </td>

                      <td className="px-5 py-4 text-gray-300 text-sm">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex justify-center gap-2 flex-wrap">

                          <button className="bg-green-500 hover:bg-green-400 text-black px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition">
                            <CheckCircle size={14} />
                            Approve
                          </button>

                          <button className="bg-red-500 hover:bg-red-400 text-black px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition">
                            <XCircle size={14} />
                            Reject
                          </button>

                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="lg:hidden p-5 space-y-4">
            {filteredSellOrders.map((order) => (
              <div
                key={order._id}
                className="bg-black border border-zinc-700 rounded-xl p-5 space-y-4"
              >
                <div className="flex justify-between items-center">
                  <h3 className="font-black text-lg text-white">
                    {order.username}
                  </h3>

                  <span className="text-xs text-gray-500">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-gray-500">Quantity</p>
                    <p className="text-yellow-400 font-bold">{order.quantity} g</p>
                  </div>

                  <div>
                    <p className="text-gray-500">Price</p>
                    <p className="text-red-400 font-bold">
                      PKR {order.price.toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="bg-zinc-900 border border-cyan-500 rounded-xl p-4">
                  <p className="text-xs text-gray-500 uppercase">Order Total</p>
                  <h3 className="text-2xl font-black text-cyan-400 mt-2">
                    PKR {order.totalAmount.toLocaleString()}
                  </h3>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button className="bg-green-500 hover:bg-green-400 text-black py-3 rounded-xl font-bold flex justify-center items-center gap-2 transition">
                    <CheckCircle size={18} />
                    Approve
                  </button>

                  <button className="bg-red-500 hover:bg-red-400 text-black py-3 rounded-xl font-bold flex justify-center items-center gap-2 transition">
                    <XCircle size={18} />
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>

        </section>

        {/* ============================================= */}
        {/* PAGINATION */}
        {/* ============================================= */}

        <section className="bg-zinc-900 border border-yellow-500 rounded-2xl p-6 space-y-6">

          <div className="flex flex-wrap justify-between items-center gap-4">

            <div>
              <h2 className="text-2xl font-black text-yellow-400">
                Gold Orders Pagination
              </h2>

              <p className="text-gray-400 text-sm mt-2">
                Total Buy Orders: {filteredBuyOrders.length} | Total Sell Orders: {filteredSellOrders.length}
              </p>
            </div>

            <span className="bg-yellow-500/20 border border-yellow-500 text-yellow-400 px-4 py-2 rounded-full font-bold text-sm">
              Page {currentPage}
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

            {Array.from({ length: 5 }).map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentPage(index + 1)}
                className={`w-10 h-10 rounded-lg font-bold ${
                  currentPage === index + 1
                    ? "bg-yellow-400 text-black"
                    : "bg-zinc-800 hover:bg-zinc-700"
                }`}
              >
                {index + 1}
              </button>
            ))}

            <button
              onClick={() => setCurrentPage(currentPage + 1)}
              className="bg-zinc-800 hover:bg-zinc-700 px-4 py-2 rounded-lg font-bold"
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
            href="/admin/usdt"
            className="bg-zinc-900 border border-cyan-500 rounded-2xl p-6 hover:border-cyan-400 transition"
          >
            <ShieldCheck className="text-cyan-400 mb-3" size={30} />

            <h3 className="text-xl font-black text-cyan-400">
              USDT Manager
            </h3>

            <p className="text-gray-400 text-sm mt-2">
              Open Enterprise USDT Management Dashboard.
            </p>
          </Link>

          <Link
            href="/admin/wallet"
            className="bg-zinc-900 border border-green-500 rounded-2xl p-6 hover:border-green-400 transition"
          >
            <Coins className="text-green-400 mb-3" size={30} />

            <h3 className="text-xl font-black text-green-400">
              Wallet Manager
            </h3>

            <p className="text-gray-400 text-sm mt-2">
              Manage PKR, Gold and USDT user wallets.
            </p>
          </Link>

          <Link
            href="/admin"
            className="bg-zinc-900 border border-purple-500 rounded-2xl p-6 hover:border-purple-400 transition"
          >
            <ShieldCheck className="text-purple-400 mb-3" size={30} />

            <h3 className="text-xl font-black text-purple-400">
              Admin Dashboard
            </h3>

            <p className="text-gray-400 text-sm mt-2">
              Return to Enterprise Admin Dashboard.
            </p>
          </Link>

        </section>

        {/* ============================================= */}
        {/* GOLD MARKET SUMMARY */}
        {/* ============================================= */}

        <section className="bg-zinc-900 border border-yellow-500 rounded-2xl p-6 space-y-6">

          <h2 className="text-2xl font-black text-yellow-400">
            Gold Market Summary
          </h2>

          <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-5">

            <div className="bg-black border border-green-500 rounded-xl p-5 text-center">
              <p className="text-gray-500 text-xs uppercase">
                Buy Price
              </p>

              <h3 className="text-2xl font-black text-green-400 mt-2">
                PKR {settings.buyGoldPrice.toLocaleString()}
              </h3>
            </div>

            <div className="bg-black border border-red-500 rounded-xl p-5 text-center">
              <p className="text-gray-500 text-xs uppercase">
                Sell Price
              </p>

              <h3 className="text-2xl font-black text-red-400 mt-2">
                PKR {settings.sellGoldPrice.toLocaleString()}
              </h3>
            </div>

            <div className="bg-black border border-cyan-500 rounded-xl p-5 text-center">
              <p className="text-gray-500 text-xs uppercase">
                Gold USD
              </p>

              <h3 className="text-2xl font-black text-cyan-400 mt-2">
                ${settings.goldPriceUSD.toLocaleString()}
              </h3>
            </div>

            <div className="bg-black border border-purple-500 rounded-xl p-5 text-center">
              <p className="text-gray-500 text-xs uppercase">
                USD → PKR
              </p>

              <h3 className="text-2xl font-black text-purple-400 mt-2">
                {settings.usdToPkr}
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
              <h3 className="text-lg font-black text-yellow-400 mb-3">
                GoldTrade V18 Enterprise
              </h3>

              <p className="text-gray-500 text-sm leading-6">
                Enterprise Gold Management System with Buy/Sell approvals,
                live pricing, USD conversion and complete trading controls.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-black text-green-400 mb-3">
                Gold Features
              </h3>

              <ul className="space-y-2 text-sm text-gray-500">
                <li>• Live Gold Buy Price</li>
                <li>• Live Gold Sell Price</li>
                <li>• Gold USD Market Price</li>
                <li>• USD → PKR Conversion</li>
                <li>• Buy Order Approval</li>
                <li>• Sell Order Approval</li>
                <li>• Search Orders</li>
                <li>• Mobile Responsive Dashboard</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-black text-purple-400 mb-3">
                Market Status
              </h3>

              <div className="space-y-3 text-sm">

                <div className="flex justify-between">
                  <span className="text-gray-500">Trading</span>

                  <span
                    className={`font-bold ${
                      settings.goldTradingEnabled
                        ? "text-green-400"
                        : "text-red-400"
                    }`}
                  >
                    {settings.goldTradingEnabled ? "LIVE" : "OFFLINE"}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-500">Market</span>

                  <span
                    className={`font-bold ${
                      settings.marketStatus === "OPEN"
                        ? "text-green-400"
                        : "text-red-400"
                    }`}
                  >
                    {settings.marketStatus}
                  </span>
                </div>

              </div>
            </div>

          </div>

          <div className="border-t border-zinc-800 mt-8 pt-6 flex flex-wrap justify-between items-center gap-4">

            <p className="text-gray-500 text-sm">
              © 2026 GoldTrade V18 Enterprise Gold Market Manager.
            </p>

            <button
              onClick={refreshDashboard}
              disabled={refreshing}
              className="bg-yellow-400 hover:bg-yellow-300 disabled:bg-yellow-700 disabled:cursor-not-allowed text-black px-5 py-2 rounded-lg font-bold flex items-center gap-2 transition"
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