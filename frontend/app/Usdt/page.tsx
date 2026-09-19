"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  RefreshCw,
  DollarSign,
  Wallet,
  TrendingUp,
  TrendingDown,
  ArrowDownCircle,
  ArrowUpCircle,
} from "lucide-react";

const API =
  process.env.NEXT_PUBLIC_API_URL || "https://goldtrade-api.onrender.com";

// =====================================
// TYPES
// =====================================

interface WalletData {
  walletBalance: number;
  usdtBalance: number;
}

interface UsdtMarket {
  buyRate: number;
  sellRate: number;
  tradingEnabled: boolean;
}

interface UsdtTransaction {
  _id: string;
  type: "BUY" | "SELL";
  usdtAmount: number;
  pkrAmount: number;
  createdAt: string;
}

// =====================================
// DEFAULT VALUES
// =====================================

const defaultWallet: WalletData = {
  walletBalance: 0,
  usdtBalance: 0,
};

const defaultMarket: UsdtMarket = {
  buyRate: 285,
  sellRate: 283,
  tradingEnabled: true,
};

// =====================================
// PAGE
// =====================================

export default function UsdtDashboardPage() {
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("token") || ""
      : "";

  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  const [wallet, setWallet] =
    useState<WalletData>(defaultWallet);

  const [market, setMarket] =
    useState<UsdtMarket>(defaultMarket);

  const [history, setHistory] = useState<UsdtTransaction[]>([]);

  const [loading, setLoading] = useState(true);

  // BUY / SELL
  const [buyAmount, setBuyAmount] = useState(100);
  const [sellAmount, setSellAmount] = useState(50);

  const [buyLoading, setBuyLoading] = useState(false);
  const [sellLoading, setSellLoading] = useState(false);

  // =====================================
  // LOAD DATA
  // =====================================

  const loadDashboard = async () => {
    try {
      setLoading(true);

      const [walletRes, marketRes, historyRes] =
        await Promise.all([
          fetch(`${API}/api/wallet/balance`, { headers }),
          fetch(`${API}/api/usdt/rate`),
          fetch(`${API}/api/usdt/history`, { headers }),
        ]);

      const walletData = await walletRes.json();
      const marketData = await marketRes.json();
      const historyData = await historyRes.json();

      if (walletRes.ok) {
        setWallet({
          walletBalance: walletData.walletBalance || 0,
          usdtBalance: walletData.usdtBalance || 0,
        });
      }

      if (marketRes.ok) {
        setMarket({
          buyRate: marketData.buyRate || 285,
          sellRate: marketData.sellRate || 283,
          tradingEnabled:
            marketData.tradingEnabled ?? true,
        });
      }

      if (historyRes.ok) {
        setHistory(historyData.history || []);
      }
    } catch (err) {
      console.error("USDT Dashboard Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) {
      window.location.href = "/login";
      return;
    }

    loadDashboard();
  }, []);

  // =====================================
  // BUY USDT
  // =====================================

  const buyUsdt = async () => {
    try {
      setBuyLoading(true);

      const response = await fetch(`${API}/api/usdt/buy`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          usdtAmount: buyAmount,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        await loadDashboard();
      } else {
        alert(data.message || "Buy failed.");
      }
    } catch (err) {
      console.error(err);
      alert("Server Error");
    } finally {
      setBuyLoading(false);
    }
  };

  // =====================================
  // SELL USDT
  // =====================================

  const sellUsdt = async () => {
    try {
      setSellLoading(true);

      const response = await fetch(`${API}/api/usdt/sell`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          usdtAmount: sellAmount,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        await loadDashboard();
      } else {
        alert(data.message || "Sell failed.");
      }
    } catch (err) {
      console.error(err);
      alert("Server Error");
    } finally {
      setSellLoading(false);
    }
  };

  // =====================================
  // CALCULATIONS
  // =====================================

  const buyCost = useMemo(
    () => buyAmount * market.buyRate,
    [buyAmount, market.buyRate]
  );

  const sellValue = useMemo(
    () => sellAmount * market.sellRate,
    [sellAmount, market.sellRate]
  );
    // =====================================
  // LOADING SCREEN
  // =====================================

  if (loading) {
    return (
      <main className="min-h-screen bg-black flex items-center justify-center text-yellow-400">
        <RefreshCw className="animate-spin mr-3" size={26} />
        Loading USDT Dashboard...
      </main>
    );
  }

  // =====================================
  // UI
  // =====================================

  return (
    <main className="min-h-screen bg-black text-white p-6">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* ================= HEADER ================= */}

        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="flex items-center gap-3 text-4xl font-black text-blue-400">
              <DollarSign size={38} />
              USDT Dashboard
            </h1>

            <p className="text-gray-400 mt-2">
              Buy, Sell and manage your USDT wallet.
            </p>
          </div>

          <div className="flex gap-3">
            <Link
              href="/dashboard"
              className="bg-zinc-800 hover:bg-zinc-700 px-4 py-3 rounded-xl flex items-center gap-2 font-bold"
            >
              <ArrowLeft size={18} />
              Dashboard
            </Link>

            <button
              onClick={loadDashboard}
              className="bg-blue-600 hover:bg-blue-700 px-4 py-3 rounded-xl flex items-center gap-2 font-bold"
            >
              <RefreshCw size={18} />
              Refresh
            </button>
          </div>
        </header>

        {/* ================= MARKET STATUS ================= */}

        <section
          className={`rounded-2xl p-5 border ${
            market.tradingEnabled
              ? "bg-green-950 border-green-500"
              : "bg-red-950 border-red-500"
          }`}
        >
          <h2 className="text-xl font-bold">
            {market.tradingEnabled
              ? "USDT Trading Active"
              : "USDT Trading Disabled"}
          </h2>

          <p className="text-gray-300 mt-2">
            {market.tradingEnabled
              ? "You can buy and sell USDT."
              : "Trading is currently disabled by admin."}
          </p>
        </section>

        {/* ================= WALLET CARDS ================= */}

        <section className="grid md:grid-cols-2 gap-5">

          <div className="bg-zinc-900 border border-green-500 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <Wallet className="text-green-400" size={28} />

              <h2 className="text-xl font-bold text-green-400">
                PKR Wallet
              </h2>
            </div>

            <h3 className="text-3xl font-black">
              PKR {wallet.walletBalance.toLocaleString()}
            </h3>
          </div>

          <div className="bg-zinc-900 border border-blue-500 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <DollarSign className="text-blue-400" size={28} />

              <h2 className="text-xl font-bold text-blue-400">
                USDT Wallet
              </h2>
            </div>

            <h3 className="text-3xl font-black">
              {wallet.usdtBalance.toFixed(2)} USDT
            </h3>
          </div>

        </section>

        {/* ================= LIVE RATE ================= */}

        <section className="grid md:grid-cols-2 gap-5">

          <div className="bg-zinc-900 border border-cyan-500 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <TrendingUp className="text-cyan-400" size={24} />

              <h2 className="text-xl font-bold text-cyan-400">
                Buy Rate
              </h2>
            </div>

            <h3 className="text-4xl font-black text-cyan-400">
              PKR {market.buyRate}
            </h3>

            <p className="text-gray-400 mt-2">
              Price per 1 USDT
            </p>
          </div>

          <div className="bg-zinc-900 border border-orange-500 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <TrendingDown className="text-orange-400" size={24} />

              <h2 className="text-xl font-bold text-orange-400">
                Sell Rate
              </h2>
            </div>

            <h3 className="text-4xl font-black text-orange-400">
              PKR {market.sellRate}
            </h3>

            <p className="text-gray-400 mt-2">
              Price per 1 USDT
            </p>
          </div>

        </section>

        {/* ================= BUY / SELL PANELS ================= */}

        <section className="grid lg:grid-cols-2 gap-6">

          {/* BUY USDT */}
          <div className="bg-zinc-900 border border-green-500 rounded-2xl p-6 space-y-5">

            <div className="flex items-center gap-3">
              <ArrowDownCircle className="text-green-400" size={28} />

              <h2 className="text-2xl font-black text-green-400">
                Buy USDT
              </h2>
            </div>

            <input
              type="number"
              min={1}
              value={buyAmount}
              onChange={(e) =>
                setBuyAmount(Number(e.target.value))
              }
              className="w-full bg-black border border-zinc-700 rounded-xl px-4 py-3"
              placeholder="USDT Amount"
            />

            <div className="bg-zinc-800 rounded-xl p-4">
              <p className="text-gray-400">You Pay</p>

              <h3 className="text-3xl font-black text-green-400 mt-2">
                PKR {buyCost.toLocaleString()}
              </h3>
            </div>

            <button
              disabled={!market.tradingEnabled || buyLoading}
              onClick={buyUsdt}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-zinc-700 py-3 rounded-xl font-bold"
            >
              {buyLoading ? "Processing..." : "Buy USDT"}
            </button>

          </div>

          {/* SELL USDT */}
          <div className="bg-zinc-900 border border-red-500 rounded-2xl p-6 space-y-5">

            <div className="flex items-center gap-3">
              <ArrowUpCircle className="text-red-400" size={28} />

              <h2 className="text-2xl font-black text-red-400">
                Sell USDT
              </h2>
            </div>

            <input
              type="number"
              min={1}
              value={sellAmount}
              onChange={(e) =>
                setSellAmount(Number(e.target.value))
              }
              className="w-full bg-black border border-zinc-700 rounded-xl px-4 py-3"
              placeholder="USDT Amount"
            />

            <div className="bg-zinc-800 rounded-xl p-4">
              <p className="text-gray-400">You Receive</p>

              <h3 className="text-3xl font-black text-red-400 mt-2">
                PKR {sellValue.toLocaleString()}
              </h3>
            </div>

            <button
              disabled={!market.tradingEnabled || sellLoading}
              onClick={sellUsdt}
              className="w-full bg-red-600 hover:bg-red-700 disabled:bg-zinc-700 py-3 rounded-xl font-bold"
            >
              {sellLoading ? "Processing..." : "Sell USDT"}
            </button>

          </div>

        </section>        {/* ================= USDT TRANSACTION HISTORY ================= */}

        <section className="bg-zinc-900 border border-cyan-500 rounded-2xl p-6">
          <h2 className="text-2xl font-black text-cyan-400 mb-5">
            USDT Transaction History
          </h2>

          {history.length === 0 ? (
            <div className="text-center py-10 text-gray-500">
              No USDT transactions found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-zinc-700 text-cyan-400">
                    <th className="p-3">Type</th>
                    <th className="p-3">USDT</th>
                    <th className="p-3">PKR</th>
                    <th className="p-3">Rate</th>
                    <th className="p-3">Date</th>
                  </tr>
                </thead>

                <tbody>
                  {history.map((item) => {
                    const rate =
                      item.usdtAmount > 0
                        ? item.pkrAmount / item.usdtAmount
                        : 0;

                    return (
                      <tr
                        key={item._id}
                        className="border-b border-zinc-800 hover:bg-zinc-800 transition"
                      >
                        <td className="p-3">
                          {item.type === "BUY" ? (
                            <span className="inline-flex items-center gap-2 text-green-400 font-semibold">
                              <ArrowDownCircle size={16} />
                              BUY
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-2 text-red-400 font-semibold">
                              <ArrowUpCircle size={16} />
                              SELL
                            </span>
                          )}
                        </td>

                        <td className="p-3 text-blue-400 font-bold">
                          {item.usdtAmount.toFixed(2)} USDT
                        </td>

                        <td className="p-3 text-green-400 font-semibold">
                          PKR {item.pkrAmount.toLocaleString()}
                        </td>

                        <td className="p-3 text-yellow-400 font-semibold">
                          PKR {rate.toFixed(2)}
                        </td>

                        <td className="p-3 text-gray-400 whitespace-nowrap">
                          {new Date(item.createdAt).toLocaleString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* ================= MARKET INFO ================= */}

        <section className="bg-zinc-900 border border-yellow-500 rounded-2xl p-6">
          <h2 className="text-2xl font-black text-yellow-400 mb-5">
            Live USDT Market Information
          </h2>

          <div className="grid md:grid-cols-3 gap-5">
            <div className="bg-black rounded-xl p-5 border border-cyan-500">
              <p className="text-gray-400 text-sm">Buy Price</p>

              <h3 className="text-3xl font-black text-cyan-400 mt-2">
                PKR {market.buyRate}
              </h3>
            </div>

            <div className="bg-black rounded-xl p-5 border border-orange-500">
              <p className="text-gray-400 text-sm">Sell Price</p>

              <h3 className="text-3xl font-black text-orange-400 mt-2">
                PKR {market.sellRate}
              </h3>
            </div>

            <div className="bg-black rounded-xl p-5 border border-blue-500">
              <p className="text-gray-400 text-sm">Wallet Value</p>

              <h3 className="text-3xl font-black text-blue-400 mt-2">
                PKR{" "}
                {(wallet.usdtBalance * market.sellRate).toLocaleString()}
              </h3>

              <p className="text-gray-500 mt-1">
                {wallet.usdtBalance.toFixed(2)} USDT Available
              </p>
            </div>
          </div>
        </section>

      </div>
    </main>
  );
}


