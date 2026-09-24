"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  RefreshCw,
  DollarSign,
  Wallet,
  TrendingUp,
  CheckCircle,
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
  [x: string]: string | number | boolean;
  buyRate: number;
  tradingEnabled: boolean;
}

interface BuyHistory {
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
  buyRate: 285,
  tradingEnabled: true,
};
// =====================================
// PAGE
// =====================================

export default function BuyUsdtPage() {
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

  const [history, setHistory] = useState<BuyHistory[]>([]);

  const [loading, setLoading] = useState(true);
  const [buyLoading, setBuyLoading] = useState(false);

  const [usdtAmount, setUsdtAmount] = useState(100);

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
          buyRate: rateData.buyRate || 285,
          tradingEnabled:
            rateData.tradingEnabled ?? true,
        });
      }

      if (historyRes.ok) {
        setHistory(historyData.history || []);
      }
    } catch (err) {
      console.error("USDT Buy Error:", err);
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
    return usdtAmount * market.buyRate;
  }, [usdtAmount, market.buyRate]);

  const enoughBalance = wallet.walletBalance >= totalPkr;

  // =====================================
  // BUY USDT
  // =====================================

  const buyUsdt = async () => {
    if (!market.tradingEnabled) {
      alert("USDT trading is disabled.");
      return;
    }

    if (!enoughBalance) {
      alert("Insufficient PKR Wallet Balance.");
      return;
    }

    try {
      setBuyLoading(true);

      const response = await fetch(
        `${API}/api/usdt/buy`,
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
        alert("USDT purchased successfully.");
        await loadData();
      } else {
        alert(data.message || "Purchase failed.");
      }
    } catch (err) {
      console.error(err);
      alert("Server Error");
    } finally {
      setBuyLoading(false);
    }
  }; 
  // =====================================================
// CHECK MARKET STATUS BEFORE BUY
// =====================================================

const canBuyUsdt = () => {
  if (!market.tradingEnabled) {
    setErrorMessage("USDT trading is currently disabled by admin.");
    return false;
  }

  if (market.marketStatus !== "OPEN") {
    setErrorMessage("USDT market is currently closed.");
    return false;
  }

  return true;
};
 // =====================================
  // LOADING SCREEN
  // =====================================

  if (loading) {
    return (
      <main className="min-h-screen bg-black flex items-center justify-center text-blue-400">
        <RefreshCw className="animate-spin mr-3" size={26} />
        Loading USDT Buy Page...
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
            <h1 className="flex items-center gap-3 text-4xl font-black text-blue-400">
              <DollarSign size={38} />
              Buy USDT
            </h1>

            <p className="text-gray-400 mt-2">
              Purchase USDT directly from your PKR wallet.
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
              className="bg-blue-600 hover:bg-blue-700 px-4 py-3 rounded-xl flex items-center gap-2 font-bold"
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
              ? "USDT Buying Enabled"
              : "USDT Buying Disabled"}
          </h2>

          <p className="text-gray-300 mt-2">
            {market.tradingEnabled
              ? "You can purchase USDT using your PKR wallet."
              : "Buying has been disabled by the administrator."}
          </p>
        </section>

        {/* ================= WALLET CARDS ================= */}

        <section className="grid md:grid-cols-2 gap-5">

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
              Available balance for USDT purchase.
            </p>
          </div>

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
              Current USDT available in your wallet.
            </p>
          </div>

        </section>

        {/* ================= LIVE BUY RATE ================= */}

        <section className="bg-zinc-900 border border-cyan-500 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <TrendingUp className="text-cyan-400" size={28} />

            <h2 className="text-2xl font-black text-cyan-400">
              Live Buy Rate
            </h2>
          </div>

          <h3 className="text-5xl font-black text-cyan-400">
            Pkr {market.buyRate}
          </h3>

          <p className="text-gray-400 mt-3">
            Current purchase price of 1 USDT.
          </p>
        </section>

        {/* ================= BUY FORM ================= */}

        <section className="bg-zinc-900 border border-blue-500 rounded-2xl p-6 space-y-5">

          <h2 className="text-2xl font-black text-blue-400">
            Buy USDT
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
              className="w-full bg-black border border-zinc-700 rounded-xl px-4 py-3 text-lg outline-none focus:border-blue-500"
              placeholder="Enter USDT amount"
            />
          </div>

          {/* Cost Calculation */}

          <div className="bg-zinc-800 rounded-xl p-5 space-y-3">

            <div className="flex justify-between">
              <span className="text-gray-400">
                Buy Rate
              </span>

              <span className="text-cyan-400 font-bold">
                PKR {market.buyRate}
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
                Total Pkr Required
              </span>

              <span className="text-3xl font-black text-green-400">
                Pkr {totalPkr.toLocaleString()}
              </span>
            </div>

          </div>

          {/* Balance Check */}

          <div
            className={`rounded-xl p-4 border ${
              enoughBalance
                ? "bg-green-950 border-green-500"
                : "bg-red-950 border-red-500"
            }`}
          >
            {enoughBalance ? (
              <div className="flex items-center gap-3 text-green-400">
                <CheckCircle size={22} />

                <span className="font-semibold">
                  Sufficient PKR balance available.
                </span>
              </div>
            ) : (
              <div className="text-red-400 font-semibold">
                Insufficient PKR Wallet Balance.
              </div>
            )}
          </div>

          {/* Buy Button */}

          <button
            disabled={
              buyLoading ||
              !market.tradingEnabled ||
              !enoughBalance
            }
            onClick={buyUsdt}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-700 disabled:text-gray-400 py-4 rounded-xl text-lg font-bold transition"
          >
            {buyLoading ? "Processing Purchase..." : "Buy USDT Now"}
          </button>

        </section>        {/* ================= PURCHASE SUMMARY ================= */}

        <section className="bg-zinc-900 border border-purple-500 rounded-2xl p-6">
          <h2 className="text-2xl font-black text-purple-400 mb-5">
            Purchase Summary
          </h2>

          <div className="grid md:grid-cols-3 gap-5">

            <div className="bg-black rounded-xl p-5 border border-blue-500">
              <p className="text-gray-400 text-sm">Buying</p>

              <h3 className="text-3xl font-black text-blue-400 mt-2">
                {usdtAmount.toFixed(2)} USDT
              </h3>
            </div>

            <div className="bg-black rounded-xl p-5 border border-green-500">
              <p className="text-gray-400 text-sm">Buy Rate</p>

              <h3 className="text-3xl font-black text-green-400 mt-2">
                PKR {market.buyRate}
              </h3>
            </div>

            <div className="bg-black rounded-xl p-5 border border-yellow-500">
              <p className="text-gray-400 text-sm">Total Cost</p>

              <h3 className="text-3xl font-black text-yellow-400 mt-2">
                Pkr {totalPkr.toLocaleString()}
              </h3>
            </div>

          </div>
        </section>

        {/* ================= QUICK BUY BUTTONS ================= */}

        <section className="bg-zinc-900 border border-cyan-500 rounded-2xl p-6">
          <h2 className="text-2xl font-black text-cyan-400 mb-5">
            Quick Buy
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

            {[25, 50, 100, 250].map((amount) => (
              <button
                key={amount}
                onClick={() => setUsdtAmount(amount)}
                className={`rounded-xl p-4 font-bold transition ${
                  usdtAmount === amount
                    ? "bg-blue-600 text-white"
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
                    ? "bg-green-600 text-white"
                    : "bg-zinc-800 hover:bg-zinc-700 text-gray-300"
                }`}
              >
                {amount} USDT
              </button>
            ))}

          </div>
        </section>

        {/* ================= RECENT BUY HISTORY ================= */}

        <section className="bg-zinc-900 border border-blue-500 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-2xl font-black text-blue-400">
              Recent USDT Purchases
            </h2>

            <button
              onClick={loadData}
              className="text-blue-400 hover:text-blue-300 flex items-center gap-2"
            >
              <RefreshCw size={18} />
              Refresh
            </button>
          </div>

          {history.length === 0 ? (
            <div className="text-center py-10 text-gray-500">
              No USDT purchases found.
            </div>
          ) : (
            <div className="space-y-4">

              {history.slice(0, 5).map((item) => (
                <div
                  key={item._id}
                  className="bg-black border border-zinc-700 rounded-xl p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
                >
                  <div>
                    <div className="flex items-center gap-2 text-green-400 font-bold">
                      <CheckCircle size={18} />
                      BUY USDT
                    </div>

                    <p className="text-gray-400 text-sm mt-2">
                      {new Date(item.createdAt).toLocaleString()}
                    </p>
                  </div>

                  <div className="text-center">
                    <p className="text-gray-400 text-sm">
                      Purchased
                    </p>

                    <h3 className="text-2xl font-black text-blue-400">
                      {item.usdtAmount.toFixed(2)} USDT
                    </h3>
                  </div>

                  <div className="text-center">
                    <p className="text-gray-400 text-sm">
                      Paid
                    </p>

                    <h3 className="text-2xl font-black text-green-400">
                      PKR {item.pkrAmount.toLocaleString()}
                    </h3>
                  </div>

                  <div className="text-center">
                    <p className="text-gray-400 text-sm">
                      Rate
                    </p>

                    <h3 className="text-xl font-bold text-yellow-400">
                      PKR {item.rate}
                    </h3>
                  </div>
                </div>
              ))}

            </div>
          )}
        </section>        {/* ================= BUY HISTORY STATISTICS ================= */}

        <section className="bg-zinc-900 border border-green-500 rounded-2xl p-6">
          <h2 className="text-2xl font-black text-green-400 mb-5">
            Purchase Statistics
          </h2>

          <div className="grid md:grid-cols-4 gap-5">

            <div className="bg-black rounded-xl p-5 border border-blue-500">
              <p className="text-gray-400 text-sm">Total Purchases</p>

              <h3 className="text-3xl font-black text-blue-400 mt-2">
                {history.length}
              </h3>
            </div>

            <div className="bg-black rounded-xl p-5 border border-green-500">
              <p className="text-gray-400 text-sm">Total USDT Bought</p>

              <h3 className="text-3xl font-black text-green-400 mt-2">
                {history
                  .reduce((sum, item) => sum + item.usdtAmount, 0)
                  .toFixed(2)}
              </h3>
            </div>

            <div className="bg-black rounded-xl p-5 border border-yellow-500">
              <p className="text-gray-400 text-sm">Total PKR Spent</p>

              <h3 className="text-3xl font-black text-yellow-400 mt-2">
                Pkr{" "}
                {history
                  .reduce((sum, item) => sum + item.pkrAmount, 0)
                  .toLocaleString()}
              </h3>
            </div>

            <div className="bg-black rounded-xl p-5 border border-purple-500">
              <p className="text-gray-400 text-sm">Wallet USDT Value</p>

              <h3 className="text-3xl font-black text-purple-400 mt-2">
                Pkr{" "}
                {(wallet.usdtBalance * market.buyRate).toLocaleString()}
              </h3>
            </div>

          </div>
        </section>

        {/* ================= SEARCH HISTORY ================= */}

        <section className="bg-zinc-900 border border-cyan-500 rounded-2xl p-6">
          <div className="flex flex-wrap justify-between items-center gap-4 mb-5">
            <h2 className="text-2xl font-black text-cyan-400">
              Complete Buy History
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
                    item.usdtAmount
                      .toString()
                      .includes(value) ||
                    item.pkrAmount
                      .toString()
                      .includes(value) ||
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
                  <th className="p-3">USDT</th>
                  <th className="p-3">Rate</th>
                  <th className="p-3">PKR Paid</th>
                  <th className="p-3">Purchase Date</th>
                </tr>
              </thead>

              <tbody>

                {history.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="p-6 text-center text-gray-500"
                    >
                      No purchase history found.
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

                      <td className="p-3 text-yellow-400 font-semibold">
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
        </section>        {/* ================= BUY VALIDATION CARD ================= */}

        <section className="bg-zinc-900 border border-yellow-500 rounded-2xl p-6">
          <h2 className="text-2xl font-black text-yellow-400 mb-5">
            Purchase Validation
          </h2>

          <div className="space-y-4">

            {/* Wallet Balance */}
            <div className="flex items-center justify-between bg-black rounded-xl p-4 border border-zinc-700">
              <span className="text-gray-400">Pkr Wallet Balance</span>

              <span className="text-green-400 font-bold text-lg">
                Pkr {wallet.walletBalance.toLocaleString()}
              </span>
            </div>

            {/* Total Required */}
            <div className="flex items-center justify-between bg-black rounded-xl p-4 border border-zinc-700">
              <span className="text-gray-400">Total Required</span>

              <span className="text-blue-400 font-bold text-lg">
                Pkr {totalPkr.toLocaleString()}
              </span>
            </div>

            {/* Remaining Balance */}
            <div className="flex items-center justify-between bg-black rounded-xl p-4 border border-zinc-700">
              <span className="text-gray-400">Remaining Balance After Purchase</span>

              <span
                className={`font-bold text-lg ${
                  wallet.walletBalance - totalPkr >= 0
                    ? "text-green-400"
                    : "text-red-400"
                }`}
              >
                Pkr {(wallet.walletBalance - totalPkr).toLocaleString()}
              </span>
            </div>

          </div>

          {/* Validation Status */}

          <div
            className={`mt-6 rounded-xl p-5 border ${
              enoughBalance
                ? "bg-green-950 border-green-500"
                : "bg-red-950 border-red-500"
            }`}
          >
            {enoughBalance ? (
              <div className="flex items-center gap-3 text-green-400">
                <CheckCircle size={24} />

                <div>
                  <p className="font-bold text-lg">
                    Purchase Allowed
                  </p>

                  <p className="text-sm text-gray-300">
                    You have enough Pkr balance to buy this USDT amount.
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-red-400">
                <p className="font-bold text-lg">
                  Purchase Blocked
                </p>

                <p className="text-sm text-gray-300 mt-1">
                  Your Pkr wallet balance is lower than the required amount.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* ================= SUCCESS INFO CARD ================= */}

        <section className="bg-zinc-900 border border-green-500 rounded-2xl p-6">
          <h2 className="text-2xl font-black text-green-400 mb-5">
            What Happens After Buying?
          </h2>

          <div className="space-y-4">

            <div className="flex items-start gap-3">
              <CheckCircle
                className="text-green-400 mt-1"
                size={22}
              />

              <div>
                <p className="font-semibold text-white">
                  PKR Wallet Deduction
                </p>

                <p className="text-gray-400 text-sm">
                  The required PKR amount is automatically deducted from your PKR wallet.
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
                  USDT Wallet Credit
                </p>

                <p className="text-gray-400 text-sm">
                  Purchased USDT is instantly credited to your USDT wallet.
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
                  Every purchase appears immediately inside your USDT transaction history.
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
                  Dashboard portfolio value updates automatically after every successful purchase.
                </p>
              </div>
            </div>

          </div>
        </section>

        {/* ================= TRADING RULES ================= */}

        <section className="bg-zinc-900 border border-cyan-500 rounded-2xl p-6">
          <h2 className="text-2xl font-black text-cyan-400 mb-5">
            USDT Buying Rules
          </h2>

          <div className="space-y-4 text-gray-300">

            <div className="flex justify-between border-b border-zinc-800 pb-3">
              <span>Minimum Buy</span>

              <span className="text-cyan-400 font-bold">
                1 USDT
              </span>
            </div>

            <div className="flex justify-between border-b border-zinc-800 pb-3">
              <span>Maximum Buy</span>

              <span className="text-cyan-400 font-bold">
                Wallet Balance Limit
              </span>
            </div>

            <div className="flex justify-between border-b border-zinc-800 pb-3">
              <span>Payment Source</span>

              <span className="text-cyan-400 font-bold">
                PKR Wallet
              </span>
            </div>

            <div className="flex justify-between border-b border-zinc-800 pb-3">
              <span>Wallet Credit Time</span>

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
            Wallet Summary After Purchase
          </h2>

          <div className="grid md:grid-cols-3 gap-5">

            <div className="bg-black rounded-xl p-5 border border-green-500">
              <p className="text-gray-400 text-sm">
                Current PKR Wallet
              </p>

              <h3 className="text-3xl font-black text-green-400 mt-2">
                Pkr {wallet.walletBalance.toLocaleString()}
              </h3>
            </div>

            <div className="bg-black rounded-xl p-5 border border-red-500">
              <p className="text-gray-400 text-sm">
                Remaining After Buy
              </p>

              <h3
                className={`text-3xl font-black mt-2 ${
                  wallet.walletBalance - totalPkr >= 0
                    ? "text-red-400"
                    : "text-red-600"
                }`}
              >
                Pkr {(wallet.walletBalance - totalPkr).toLocaleString()}
              </h3>
            </div>

            <div className="bg-black rounded-xl p-5 border border-blue-500">
              <p className="text-gray-400 text-sm">
                New USDT Balance
              </p>

              <h3 className="text-3xl font-black text-blue-400 mt-2">
                {(wallet.usdtBalance + usdtAmount).toFixed(2)} USDT
              </h3>
            </div>

          </div>
        </section>

        {/* ================= MARKET INFORMATION ================= */}

        <section className="bg-zinc-900 border border-cyan-500 rounded-2xl p-6">
          <h2 className="text-2xl font-black text-cyan-400 mb-5">
            Live Market Information
          </h2>

          <div className="grid md:grid-cols-3 gap-5">

            <div className="bg-black rounded-xl p-5 border border-cyan-500">
              <p className="text-gray-400 text-sm">
                Buy Price
              </p>

              <h3 className="text-3xl font-black text-cyan-400 mt-2">
                Pkr {market.buyRate}
              </h3>
            </div>

            <div className="bg-black rounded-xl p-5 border border-blue-500">
              <p className="text-gray-400 text-sm">
                Purchase Amount
              </p>

              <h3 className="text-3xl font-black text-blue-400 mt-2">
                {usdtAmount.toFixed(2)} USDT
              </h3>
            </div>

            <div className="bg-black rounded-xl p-5 border border-green-500">
              <p className="text-gray-400 text-sm">
                Purchase Value
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
              <p>USDT purchases are recorded instantly in transaction history.</p>
            </div>

            <div className="flex items-start gap-3">
              <CheckCircle className="text-green-400 mt-1" size={20} />
              <p>Pkr wallet balance is deducted automatically after a successful purchase.</p>
            </div>

            <div className="flex items-start gap-3">
              <CheckCircle className="text-green-400 mt-1" size={20} />
              <p>USDT wallet balance updates immediately after purchase confirmation.</p>
            </div>

            <div className="flex items-start gap-3">
              <CheckCircle className="text-green-400 mt-1" size={20} />
              <p>All trades are stored permanently in your GoldTrade account history.</p>
            </div>

          </div>
        </section>

      </div>
    </main>
  );
}


function setErrorMessage(arg0: string) {
  throw new Error("Function not implemented.");
}

