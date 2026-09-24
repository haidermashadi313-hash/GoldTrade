"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  RefreshCw,
  DollarSign,
  Wallet,
  TrendingDown,
  CheckCircle,
  ArrowUpCircle,
} from "lucide-react";

// =====================================
// API URL (Render + Local Safe)
// =====================================

const API =
  process.env.NEXT_PUBLIC_API_URL || "https://https://goldtrade-2.onrender.com";

// =====================================
// TYPES
// =====================================

interface WalletData {
  walletBalance: number;
  usdtBalance: number;
}

interface UsdtRate {
  sellRate: number;
  tradingEnabled: boolean;
}

interface SellHistory {
  _id: string;
  usdtAmount: number;
  pkrAmount: number;
  rate: number;
  createdAt: string;
}

// =====================================
// DEFAULT VALUES
// =====================================

const emptyWallet: WalletData = {
  walletBalance: 0,
  usdtBalance: 0,
};

const defaultRate: UsdtRate = {
  sellRate: 283,
  tradingEnabled: true,
};

// =====================================
// PAGE
// =====================================

export default function SellUsdtPage() {
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("token") || ""
      : "";

  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  const [wallet, setWallet] =
    useState<WalletData>(emptyWallet);

  const [market, setMarket] =
    useState<UsdtRate>(defaultRate);

  const [history, setHistory] = useState<SellHistory[]>([]);

  const [loading, setLoading] = useState(true);
  const [sellLoading, setSellLoading] = useState(false);

  const [usdtAmount, setUsdtAmount] = useState(50);

  // =====================================
  // LOAD DATA
  // =====================================

  const loadData = async () => {
    try {
      setLoading(true);

      const [walletRes, rateRes, historyRes] =
        await Promise.all([
          fetch(`${API}/api/wallet/balance`, {
            headers,
          }),
          fetch(`${API}/api/usdt/rate`),
          fetch(`${API}/api/usdt/history`, {
            headers,
          }),
        ]);

      const walletData = await walletRes.json();
      const rateData = await rateRes.json();
      const historyData = await historyRes.json();

      if (walletRes.ok) {
        setWallet({
          walletBalance: walletData.walletBalance || 0,
          usdtBalance: walletData.usdtBalance || 0,
        });
      }

      if (rateRes.ok) {
        setMarket({
          sellRate: rateData.sellRate || 283,
          tradingEnabled:
            rateData.tradingEnabled ?? true,
        });
      }

      if (historyRes.ok) {
        setHistory(historyData.history || []);
      }
    } catch (err) {
      console.error("USDT Sell Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) {
      window.location.href = "/login";
      return;
    }

    loadData();
  }, []);

  // =====================================
  // CALCULATIONS
  // =====================================

  const totalPkr = useMemo(() => {
    return usdtAmount * market.sellRate;
  }, [usdtAmount, market.sellRate]);

  const enoughUsdt = wallet.usdtBalance >= usdtAmount;

  // =====================================
  // SELL USDT
  // =====================================

  const sellUsdt = async () => {
    if (!market.tradingEnabled) {
      alert("USDT trading is disabled.");
      return;
    }

    if (!enoughUsdt) {
      alert("Insufficient USDT balance.");
      return;
    }

    try {
      setSellLoading(true);

      const response = await fetch(
        `${API}/api/usdt/sell`,
        {
          method: "POST",
          headers,
          body: JSON.stringify({
            usdtAmount,
          }),
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        alert("USDT sold successfully.");
        await loadData();
      } else {
        alert(data.message || "Sell failed.");
      }
    } catch (err) {
      console.error(err);
      alert("Server Error");
    } finally {
      setSellLoading(false);
    }
  };  // =====================================
  // LOADING SCREEN
  // =====================================

  if (loading) {
    return (
      <main className="min-h-screen bg-black flex items-center justify-center text-red-400">
        <RefreshCw className="animate-spin mr-3" size={26} />
        Loading USDT Sell Page...
      </main>
    );
  }

  // =====================================
  // UI
  // =====================================

  return (
    <main className="min-h-screen bg-black text-white p-6">
      <div className="max-w-6xl mx-auto space-y-8">

        {/* ================= HEADER ================= */}

        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="flex items-center gap-3 text-4xl font-black text-red-400">
              <DollarSign size={38} />
              Sell USDT
            </h1>

            <p className="text-gray-400 mt-2">
              Sell your USDT instantly and receive PKR in your wallet.
            </p>
          </div>

          <div className="flex gap-3">
            <Link
              href="/usdt"
              className="bg-zinc-800 hover:bg-zinc-700 px-4 py-3 rounded-xl flex items-center gap-2 font-bold"
            >
              <ArrowLeft size={18} />
              USDT Dashboard
            </Link>

            <button
              onClick={loadData}
              className="bg-red-600 hover:bg-red-700 px-4 py-3 rounded-xl flex items-center gap-2 font-bold"
            >
              <RefreshCw size={18} />
              Refresh
            </button>
          </div>
        </header>

        {/* ================= TRADING STATUS ================= */}

        <section
          className={`rounded-2xl p-5 border ${
            market.tradingEnabled
              ? "bg-green-950 border-green-500"
              : "bg-red-950 border-red-500"
          }`}
        >
          <h2 className="text-xl font-bold">
            {market.tradingEnabled
              ? "USDT Selling Enabled"
              : "USDT Selling Disabled"}
          </h2>

          <p className="text-gray-300 mt-2">
            {market.tradingEnabled
              ? "You can sell USDT and receive PKR instantly."
              : "Selling has been disabled by the administrator."}
          </p>
        </section>

        {/* ================= WALLET CARDS ================= */}

        <section className="grid md:grid-cols-2 gap-5">

          <div className="bg-zinc-900 border border-blue-500 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <DollarSign className="text-blue-400" size={28} />

              <h2 className="text-xl font-bold text-blue-400">
                USDT Wallet Balance
              </h2>
            </div>

            <h3 className="text-3xl font-black">
              {wallet.usdtBalance.toFixed(2)} USDT
            </h3>

            <p className="text-sm text-gray-400 mt-2">
              Available balance for selling.
            </p>
          </div>

          <div className="bg-zinc-900 border border-green-500 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <Wallet className="text-green-400" size={28} />

              <h2 className="text-xl font-bold text-green-400">
                Pkr Wallet Balance
              </h2>
            </div>

            <h3 className="text-3xl font-black">
              Pkr {wallet.walletBalance.toLocaleString()}
            </h3>

            <p className="text-sm text-gray-400 mt-2">
              Pkr wallet balance before selling USDT.
            </p>
          </div>

        </section>

        {/* ================= LIVE SELL RATE ================= */}

        <section className="bg-zinc-900 border border-orange-500 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <TrendingDown className="text-orange-400" size={28} />

            <h2 className="text-2xl font-black text-orange-400">
              Live Sell Rate
            </h2>
          </div>

          <h3 className="text-5xl font-black text-orange-400">
            PKR {market.sellRate}
          </h3>

          <p className="text-gray-400 mt-3">
            Current selling price of 1 USDT.
          </p>
        </section>

        {/* ================= SELL FORM ================= */}

        <section className="bg-zinc-900 border border-red-500 rounded-2xl p-6 space-y-5">

          <h2 className="text-2xl font-black text-red-400">
            Sell USDT
          </h2>

          <div>
            <label className="block text-sm text-gray-400 mb-2">
              Enter USDT Amount
            </label>

            <input
              type="number"
              min={1}
              value={usdtAmount}
              onChange={(e) =>
                setUsdtAmount(Number(e.target.value))
              }
              className="w-full bg-black border border-zinc-700 rounded-xl px-4 py-3 text-lg outline-none focus:border-red-500"
              placeholder="Enter USDT amount"
            />
          </div>

          {/* Receive Calculation */}

          <div className="bg-zinc-800 rounded-xl p-5 space-y-3">

            <div className="flex justify-between">
              <span className="text-gray-400">
                Sell Rate
              </span>

              <span className="text-orange-400 font-bold">
                PKR {market.sellRate}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-400">
                USDT Amount
              </span>

              <span className="text-blue-400 font-bold">
                {usdtAmount.toFixed(2)} USDT
              </span>
            </div>

            <hr className="border-zinc-700" />

            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold">
                You Will Receive
              </span>

              <span className="text-3xl font-black text-green-400">
                Pkr {totalPkr.toLocaleString()}
              </span>
            </div>

          </div>

          {/* Balance Check */}

          <div
            className={`rounded-xl p-4 border ${
              enoughUsdt
                ? "bg-green-950 border-green-500"
                : "bg-red-950 border-red-500"
            }`}
          >
            {enoughUsdt ? (
              <div className="flex items-center gap-3 text-green-400">
                <CheckCircle size={22} />

                <span className="font-semibold">
                  Sufficient USDT balance available.
                </span>
              </div>
            ) : (
              <div className="text-red-400 font-semibold">
                Insufficient USDT Wallet Balance.
              </div>
            )}
          </div>

          {/* Sell Button */}

          <button
            disabled={
              sellLoading ||
              !market.tradingEnabled ||
              !enoughUsdt
            }
            onClick={sellUsdt}
            className="w-full bg-red-600 hover:bg-red-700 disabled:bg-zinc-700 disabled:text-gray-400 py-4 rounded-xl text-lg font-bold transition"
          >
            {sellLoading ? "Processing Sale..." : "Sell USDT Now"}
          </button>

        </section>        {/* ================= SELL SUMMARY ================= */}

        <section className="bg-zinc-900 border border-purple-500 rounded-2xl p-6">
          <h2 className="text-2xl font-black text-purple-400 mb-5">
            Sell Summary
          </h2>

          <div className="grid md:grid-cols-3 gap-5">
            <div className="bg-black rounded-xl p-5 border border-blue-500">
              <p className="text-gray-400 text-sm">Selling</p>

              <h3 className="text-3xl font-black text-blue-400 mt-2">
                {usdtAmount.toFixed(2)} USDT
              </h3>
            </div>

            <div className="bg-black rounded-xl p-5 border border-orange-500">
              <p className="text-gray-400 text-sm">Sell Rate</p>

              <h3 className="text-3xl font-black text-orange-400 mt-2">
                Pkr {market.sellRate}
              </h3>
            </div>

            <div className="bg-black rounded-xl p-5 border border-green-500">
              <p className="text-gray-400 text-sm">You Will Receive</p>

              <h3 className="text-3xl font-black text-green-400 mt-2">
                Pkr {totalPkr.toLocaleString()}
              </h3>
            </div>
          </div>
        </section>

        {/* ================= QUICK SELL BUTTONS ================= */}

        <section className="bg-zinc-900 border border-red-500 rounded-2xl p-6">
          <h2 className="text-2xl font-black text-red-400 mb-5">
            Quick Sell
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[25, 50, 100, 250].map((amount) => (
              <button
                key={amount}
                onClick={() => setUsdtAmount(amount)}
                className={`rounded-xl p-4 font-bold transition ${
                  usdtAmount === amount
                    ? "bg-red-600 text-white"
                    : "bg-zinc-800 hover:bg-zinc-700 text-gray-300"
                }`}
              >
                {amount} USDT
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            {[500, 1000, 2500, 5000].map((amount) => (
              <button
                key={amount}
                onClick={() => setUsdtAmount(amount)}
                className={`rounded-xl p-4 font-bold transition ${
                  usdtAmount === amount
                    ? "bg-orange-600 text-white"
                    : "bg-zinc-800 hover:bg-zinc-700 text-gray-300"
                }`}
              >
                {amount} USDT
              </button>
            ))}
          </div>
        </section>

        {/* ================= RECENT SELL HISTORY ================= */}

        <section className="bg-zinc-900 border border-cyan-500 rounded-2xl p-6">
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-2xl font-black text-cyan-400">
              Recent USDT Sales
            </h2>

            <button
              onClick={loadData}
              className="text-cyan-400 hover:text-cyan-300 flex items-center gap-2"
            >
              <RefreshCw size={18} />
              Refresh
            </button>
          </div>

          {history.length === 0 ? (
            <div className="text-center py-10 text-gray-500">
              No USDT sales found.
            </div>
          ) : (
            <div className="space-y-4">
              {history.slice(0, 5).map((item) => (
                <div
                  key={item._id}
                  className="bg-black border border-zinc-700 rounded-xl p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
                >
                  <div>
                    <div className="flex items-center gap-2 text-red-400 font-bold">
                      <ArrowUpCircle size={18} />
                      SELL USDT
                    </div>

                    <p className="text-gray-400 text-sm mt-2">
                      {new Date(item.createdAt).toLocaleString()}
                    </p>
                  </div>

                  <div className="text-center">
                    <p className="text-gray-400 text-sm">Sold</p>

                    <h3 className="text-2xl font-black text-blue-400">
                      {item.usdtAmount.toFixed(2)} USDT
                    </h3>
                  </div>

                  <div className="text-center">
                    <p className="text-gray-400 text-sm">Received</p>

                    <h3 className="text-2xl font-black text-green-400">
                      Pkr {item.pkrAmount.toLocaleString()}
                    </h3>
                  </div>

                  <div className="text-center">
                    <p className="text-gray-400 text-sm">Rate</p>

                    <h3 className="text-xl font-bold text-yellow-400">
                      Pkr {item.rate}
                    </h3>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>        {/* ================= SELL HISTORY STATISTICS ================= */}

        <section className="bg-zinc-900 border border-green-500 rounded-2xl p-6">
          <h2 className="text-2xl font-black text-green-400 mb-5">
            Sell Statistics
          </h2>

          <div className="grid md:grid-cols-4 gap-5">

            <div className="bg-black rounded-xl p-5 border border-red-500">
              <p className="text-gray-400 text-sm">Total Sales</p>

              <h3 className="text-3xl font-black text-red-400 mt-2">
                {history.length}
              </h3>
            </div>

            <div className="bg-black rounded-xl p-5 border border-blue-500">
              <p className="text-gray-400 text-sm">Total USDT Sold</p>

              <h3 className="text-3xl font-black text-blue-400 mt-2">
                {history
                  .reduce((sum, item) => sum + item.usdtAmount, 0)
                  .toFixed(2)}
              </h3>
            </div>

            <div className="bg-black rounded-xl p-5 border border-green-500">
              <p className="text-gray-400 text-sm">Total PKR Received</p>

              <h3 className="text-3xl font-black text-green-400 mt-2">
                Pkr{" "}
                {history
                  .reduce((sum, item) => sum + item.pkrAmount, 0)
                  .toLocaleString()}
              </h3>
            </div>

            <div className="bg-black rounded-xl p-5 border border-yellow-500">
              <p className="text-gray-400 text-sm">Current USDT Wallet Value</p>

              <h3 className="text-3xl font-black text-yellow-400 mt-2">
                Pkr{" "}
                {(wallet.usdtBalance * market.sellRate).toLocaleString()}
              </h3>
            </div>

          </div>
        </section>

        {/* ================= SEARCH SELL HISTORY ================= */}

        <section className="bg-zinc-900 border border-cyan-500 rounded-2xl p-6">
          <div className="flex flex-wrap justify-between items-center gap-4 mb-5">

            <h2 className="text-2xl font-black text-cyan-400">
              Complete Sell History
            </h2>

            <input
              type="text"
              placeholder="Search by date or amount..."
              onChange={(e) => {
                const value = e.target.value.toLowerCase();

                if (!value) {
                  loadData();
                  return;
                }

                const filtered = history.filter((item) => {
                  return (
                    item.usdtAmount.toString().includes(value) ||
                    item.pkrAmount.toString().includes(value) ||
                    new Date(item.createdAt)
                      .toLocaleDateString()
                      .toLowerCase()
                      .includes(value)
                  );
                });

                setHistory(filtered);
              }}
              className="bg-black border border-zinc-700 rounded-xl px-4 py-3 w-full md:w-80 outline-none focus:border-cyan-500"
            />

          </div>

          <div className="overflow-x-auto">

            <table className="w-full text-left">

              <thead>
                <tr className="border-b border-zinc-700 text-cyan-400">
                  <th className="p-3">#</th>
                  <th className="p-3">USDT Sold</th>
                  <th className="p-3">Sell Rate</th>
                  <th className="p-3">PKR Received</th>
                  <th className="p-3">Date & Time</th>
                </tr>
              </thead>

              <tbody>

                {history.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="p-6 text-center text-gray-500"
                    >
                      No sell history found.
                    </td>
                  </tr>
                ) : (
                  history.map((item, index) => (
                    <tr
                      key={item._id}
                      className="border-b border-zinc-800 hover:bg-zinc-800 transition"
                    >
                      <td className="p-3 text-gray-400">
                        {index + 1}
                      </td>

                      <td className="p-3 text-blue-400 font-bold">
                        {item.usdtAmount.toFixed(2)} USDT
                      </td>

                      <td className="p-3 text-orange-400 font-semibold">
                        Pkr {item.rate}
                      </td>

                      <td className="p-3 text-green-400 font-semibold">
                        Pkr {item.pkrAmount.toLocaleString()}
                      </td>

                      <td className="p-3 text-gray-400 whitespace-nowrap">
                        {new Date(item.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}

              </tbody>

            </table>

          </div>
        </section>        {/* ================= SELL VALIDATION CARD ================= */}

        <section className="bg-zinc-900 border border-yellow-500 rounded-2xl p-6">
          <h2 className="text-2xl font-black text-yellow-400 mb-5">
            Sell Validation
          </h2>

          <div className="space-y-4">

            {/* Current USDT Wallet */}
            <div className="flex items-center justify-between bg-black rounded-xl p-4 border border-zinc-700">
              <span className="text-gray-400">Current USDT Wallet</span>

              <span className="text-blue-400 font-bold text-lg">
                {wallet.usdtBalance.toFixed(2)} USDT
              </span>
            </div>

            {/* Selling Amount */}
            <div className="flex items-center justify-between bg-black rounded-xl p-4 border border-zinc-700">
              <span className="text-gray-400">Selling Amount</span>

              <span className="text-orange-400 font-bold text-lg">
                {usdtAmount.toFixed(2)} USDT
              </span>
            </div>

            {/* Remaining USDT */}
            <div className="flex items-center justify-between bg-black rounded-xl p-4 border border-zinc-700">
              <span className="text-gray-400">
                Remaining USDT After Sell
              </span>

              <span
                className={`font-bold text-lg ${
                  wallet.usdtBalance - usdtAmount >= 0
                    ? "text-green-400"
                    : "text-red-400"
                }`}
              >
                {(wallet.usdtBalance - usdtAmount).toFixed(2)} USDT
              </span>
            </div>

            {/* PKR Receive */}
            <div className="flex items-center justify-between bg-black rounded-xl p-4 border border-zinc-700">
              <span className="text-gray-400">PKR You Will Receive</span>

              <span className="text-green-400 font-bold text-lg">
                Pkr {totalPkr.toLocaleString()}
              </span>
            </div>

          </div>

          {/* Validation Status */}

          <div
            className={`mt-6 rounded-xl p-5 border ${
              enoughUsdt
                ? "bg-green-950 border-green-500"
                : "bg-red-950 border-red-500"
            }`}
          >
            {enoughUsdt ? (
              <div className="flex items-center gap-3 text-green-400">
                <CheckCircle size={24} />

                <div>
                  <p className="font-bold text-lg">
                    Sale Allowed
                  </p>

                  <p className="text-sm text-gray-300">
                    Your wallet contains enough USDT for this transaction.
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-red-400">
                <p className="font-bold text-lg">
                  Sale Blocked
                </p>

                <p className="text-sm text-gray-300 mt-1">
                  Your USDT wallet balance is lower than the amount you are trying to sell.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* ================= SUCCESS INFORMATION ================= */}

        <section className="bg-zinc-900 border border-green-500 rounded-2xl p-6">
          <h2 className="text-2xl font-black text-green-400 mb-5">
            What Happens After Selling?
          </h2>

          <div className="space-y-4">

            <div className="flex items-start gap-3">
              <CheckCircle
                className="text-green-400 mt-1"
                size={22}
              />

              <div>
                <p className="font-semibold text-white">
                  USDT Wallet Deduction
                </p>

                <p className="text-gray-400 text-sm">
                  The sold USDT amount is automatically deducted from your USDT wallet.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <CheckCircle
                className="text-green-400 mt-1"
                size={22}
              />

              <div>
                <p className="font-semibold text-white">
                  PKR Wallet Credit
                </p>

                <p className="text-gray-400 text-sm">
                  PKR is instantly credited to your PKR wallet after a successful sale.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <CheckCircle
                className="text-green-400 mt-1"
                size={22}
              />

              <div>
                <p className="font-semibold text-white">
                  Transaction History Updated
                </p>

                <p className="text-gray-400 text-sm">
                  Every sale appears immediately in your USDT transaction history.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <CheckCircle
                className="text-green-400 mt-1"
                size={22}
              />

              <div>
                <p className="font-semibold text-white">
                  Portfolio Updated
                </p>

                <p className="text-gray-400 text-sm">
                  Your GoldTrade dashboard updates wallet balances instantly.
                </p>
              </div>
            </div>

          </div>
        </section>

        {/* ================= TRADING RULES ================= */}

        <section className="bg-zinc-900 border border-cyan-500 rounded-2xl p-6">
          <h2 className="text-2xl font-black text-cyan-400 mb-5">
            USDT Selling Rules
          </h2>

          <div className="space-y-4 text-gray-300">

            <div className="flex justify-between border-b border-zinc-800 pb-3">
              <span>Minimum Sell</span>

              <span className="text-cyan-400 font-bold">
                1 USDT
              </span>
            </div>

            <div className="flex justify-between border-b border-zinc-800 pb-3">
              <span>Maximum Sell</span>

              <span className="text-cyan-400 font-bold">
                Available USDT Wallet Balance
              </span>
            </div>

            <div className="flex justify-between border-b border-zinc-800 pb-3">
              <span>Payment Destination</span>

              <span className="text-cyan-400 font-bold">
                PKR Wallet
              </span>
            </div>

            <div className="flex justify-between border-b border-zinc-800 pb-3">
              <span>PKR Credit Time</span>

              <span className="text-cyan-400 font-bold">
                Instant
              </span>
            </div>

            <div className="flex justify-between">
              <span>Trading Status</span>

              <span
                className={`font-bold ${
                  market.tradingEnabled
                    ? "text-green-400"
                    : "text-red-400"
                }`}
              >
                {market.tradingEnabled
                  ? "Enabled"
                  : "Disabled"}
              </span>
            </div>

          </div>
        </section>        {/* ================= WALLET SUMMARY ================= */}

        <section className="bg-zinc-900 border border-purple-500 rounded-2xl p-6">
          <h2 className="text-2xl font-black text-purple-400 mb-5">
            Wallet Summary After Selling
          </h2>

          <div className="grid md:grid-cols-3 gap-5">

            <div className="bg-black rounded-xl p-5 border border-blue-500">
              <p className="text-gray-400 text-sm">
                Current USDT Wallet
              </p>

              <h3 className="text-3xl font-black text-blue-400 mt-2">
                {wallet.usdtBalance.toFixed(2)} USDT
              </h3>
            </div>

            <div className="bg-black rounded-xl p-5 border border-red-500">
              <p className="text-gray-400 text-sm">
                Remaining After Sell
              </p>

              <h3
                className={`text-3xl font-black mt-2 ${
                  wallet.usdtBalance - usdtAmount >= 0
                    ? "text-red-400"
                    : "text-red-600"
                }`}
              >
                {(wallet.usdtBalance - usdtAmount).toFixed(2)} USDT
              </h3>
            </div>

            <div className="bg-black rounded-xl p-5 border border-green-500">
              <p className="text-gray-400 text-sm">
                PKR Wallet After Sale
              </p>

              <h3 className="text-3xl font-black text-green-400 mt-2">
                Pkr{" "}
                {(wallet.walletBalance + totalPkr).toLocaleString()}
              </h3>
            </div>

          </div>
        </section>

        {/* ================= LIVE MARKET INFORMATION ================= */}

        <section className="bg-zinc-900 border border-cyan-500 rounded-2xl p-6">
          <h2 className="text-2xl font-black text-cyan-400 mb-5">
            Live USDT Market Information
          </h2>

          <div className="grid md:grid-cols-3 gap-5">

            <div className="bg-black rounded-xl p-5 border border-orange-500">
              <p className="text-gray-400 text-sm">
                Sell Price
              </p>

              <h3 className="text-3xl font-black text-orange-400 mt-2">
                Pkr {market.sellRate}
              </h3>
            </div>

            <div className="bg-black rounded-xl p-5 border border-blue-500">
              <p className="text-gray-400 text-sm">
                Selling Amount
              </p>

              <h3 className="text-3xl font-black text-blue-400 mt-2">
                {usdtAmount.toFixed(2)} USDT
              </h3>
            </div>

            <div className="bg-black rounded-xl p-5 border border-green-500">
              <p className="text-gray-400 text-sm">
                Pkr Receive Value
              </p>

              <h3 className="text-3xl font-black text-green-400 mt-2">
                Pkr {totalPkr.toLocaleString()}
              </h3>
            </div>

          </div>
        </section>

        {/* ================= SECURITY NOTICE ================= */}

        <section className="bg-zinc-900 border border-yellow-500 rounded-2xl p-6">
          <h2 className="text-2xl font-black text-yellow-400 mb-5">
            Trading Security
          </h2>

          <div className="space-y-3 text-gray-300">

            <div className="flex items-start gap-3">
              <CheckCircle className="text-green-400 mt-1" size={20} />
              <p>USDT sales are recorded instantly in your transaction history.</p>
            </div>

            <div className="flex items-start gap-3">
              <CheckCircle className="text-green-400 mt-1" size={20} />
              <p>Your USDT wallet balance is deducted automatically after a successful sale.</p>
            </div>

            <div className="flex items-start gap-3">
              <CheckCircle className="text-green-400 mt-1" size={20} />
              <p>PKR wallet balance updates immediately after sale confirmation.</p>
            </div>

            <div className="flex items-start gap-3">
              <CheckCircle className="text-green-400 mt-1" size={20} />
              <p>Every trade is permanently stored in your GoldTrade account history.</p>
            </div>

          </div>
        </section>

      </div>
    </main>
  );
}


