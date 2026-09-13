"use client";

import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";

// ==========================================
// GOLDTRADE API CONFIG
// ==========================================

const API =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000";

// ==========================================
// TYPES
// ==========================================

interface GoldPrice {
  buyPrice: number;
  sellPrice: number;
  tradingEnabled: boolean;
  marketStatus: string;
}

interface Portfolio {
  goldBalance: number;
  walletBalance: number;
  averageBuyPrice: number;
  currentPrice: number;
  liveProfit: number;
  portfolioValue: number;
  totalProfitLoss: number;
}

const GoldSellPage: React.FC = () => {
  // ==========================================
  // STATES
  // ==========================================

  const [username, setUsername] = useState("");

  const [goldPrice, setGoldPrice] = useState<GoldPrice>({
    buyPrice: 0,
    sellPrice: 0,
    tradingEnabled: true,
    marketStatus: "OPEN",
  });

  const [portfolio, setPortfolio] = useState<Portfolio>({
    goldBalance: 0,
    walletBalance: 0,
    averageBuyPrice: 0,
    currentPrice: 0,
    liveProfit: 0,
    portfolioValue: 0,
    totalProfitLoss: 0,
  });

  const [grams, setGrams] = useState("");

  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">(
    "success"
  );

  // ==========================================
  // LOAD USERNAME
  // ==========================================

  useEffect(() => {
    if (typeof window !== "undefined") {
      setUsername(localStorage.getItem("username") || "hashi90");
    }
  }, []);

  // ==========================================
  // FETCH LIVE DATA
  // ==========================================

  const fetchPortfolio = async () => {
    if (!username) return;

    try {
      setLoading(true);

      const [priceRes, portfolioRes] = await Promise.all([
        axios.get(`${API}/api/gold/price`),
        axios.get(`${API}/api/gold/portfolio/${username}`),
      ]);

      if (priceRes.data.success) {
        setGoldPrice(priceRes.data);
      }

      if (portfolioRes.data.success) {
        setPortfolio(portfolioRes.data);
      }
    } catch (err) {
      console.error("Portfolio Error:", err);

      setMessage("Unable to connect with GoldTrade Server.");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!username) return;

    fetchPortfolio();
  }, [username]);

  // ==========================================
  // LIVE CALCULATIONS
  // ==========================================

  const sellValue = useMemo(() => {
    if (!grams) return 0;

    return Number(grams) * goldPrice.sellPrice;
  }, [grams, goldPrice.sellPrice]);

  const estimatedProfit = useMemo(() => {
    if (!grams) return 0;

    return (
      Number(grams) *
      (goldPrice.sellPrice - portfolio.averageBuyPrice)
    );
  }, [grams, goldPrice.sellPrice, portfolio.averageBuyPrice]);

  // ==========================================
  // SELL GOLD
  // ==========================================

  const sellGold = async () => {
    if (!grams || Number(grams) <= 0) {
      setMessage("Please enter valid gold grams.");
      setMessageType("error");
      return;
    }

    if (Number(grams) > portfolio.goldBalance) {
      setMessage("You don't have enough gold balance.");
      setMessageType("error");
      return;
    }

    try {
      setProcessing(true);

      const res = await axios.post(`${API}/api/gold/sell`, {
        username,
        grams: Number(grams),
      });

      if (res.data.success) {
        setMessage("Gold sold successfully.");
        setMessageType("success");

        setGrams("");

        await fetchPortfolio();
      } else {
        setMessage(res.data.message);
        setMessageType("error");
      }
    } catch (err: any) {
      console.error(err);

      setMessage(
        err.response?.data?.message || "Gold Sell Failed."
      );
      setMessageType("error");
    } finally {
      setProcessing(false);
    }
  };

  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex justify-center items-center text-yellow-400 text-2xl font-bold">
        Loading Sell Gold Page...
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
          <h1 className="text-4xl font-black text-red-400">
            SELL GOLD
          </h1>

          <p className="text-gray-400 mt-2">
            Sell your gold instantly into your PKR Wallet.
          </p>
        </div>

        <button
          onClick={fetchPortfolio}
          className="bg-red-600 hover:bg-red-500 text-white font-bold px-5 py-3 rounded-xl transition"
        >
          Refresh
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

      {/* LIVE MARKET */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-5 mb-8">

        <div className="bg-zinc-900 border border-red-500 rounded-3xl p-6">
          <p className="text-gray-400 text-sm">Sell Price</p>

          <h2 className="text-3xl font-black text-red-400 mt-2">
            PKR {goldPrice.sellPrice.toLocaleString()}
          </h2>
        </div>

        <div className="bg-zinc-900 border border-green-500 rounded-3xl p-6">
          <p className="text-gray-400 text-sm">Average Buy Price</p>

          <h2 className="text-3xl font-black text-green-400 mt-2">
            PKR {portfolio.averageBuyPrice.toLocaleString()}
          </h2>
        </div>

        <div className="bg-zinc-900 border border-cyan-500 rounded-3xl p-6">
          <p className="text-gray-400 text-sm">Market Status</p>

          <h2 className="text-3xl font-black text-cyan-400 mt-2">
            {goldPrice.marketStatus}
          </h2>
        </div>

        <div className="bg-zinc-900 border border-yellow-500 rounded-3xl p-6">
          <p className="text-gray-400 text-sm">Trading</p>

          <h2 className="text-3xl font-black text-yellow-400 mt-2">
            {goldPrice.tradingEnabled ? "OPEN" : "CLOSED"}
          </h2>
        </div>

      </div>

      {/* PORTFOLIO SUMMARY */}
      <div className="grid md:grid-cols-3 gap-6 mb-10">

        <div className="bg-zinc-900 border border-yellow-500 rounded-3xl p-6">
          <p className="text-gray-400 text-sm">Gold Balance</p>

          <h2 className="text-3xl font-black text-yellow-400 mt-2">
            {portfolio.goldBalance.toFixed(3)} g
          </h2>
        </div>

        <div className="bg-zinc-900 border border-green-500 rounded-3xl p-6">
          <p className="text-gray-400 text-sm">Wallet Balance</p>

          <h2 className="text-3xl font-black text-green-400 mt-2">
            PKR {portfolio.walletBalance.toLocaleString()}
          </h2>
        </div>

        <div className="bg-zinc-900 border border-purple-500 rounded-3xl p-6">
          <p className="text-gray-400 text-sm">Total Profit / Loss</p>

          <h2
            className={`text-3xl font-black mt-2 ${
              portfolio.totalProfitLoss >= 0
                ? "text-green-400"
                : "text-red-400"
            }`}
          >
            PKR {portfolio.totalProfitLoss.toLocaleString()}
          </h2>
        </div>

      </div>

      {/* SELL PANEL */}
      <div className="bg-zinc-900 border border-red-500 rounded-3xl p-8">

        <h2 className="text-3xl font-black text-red-400 mb-6">
          Gold Selling Panel
        </h2>

        <label className="block text-gray-300 mb-2">
          Gold Quantity (Grams)
        </label>

        <input
          type="number"
          value={grams}
          onChange={(e) => setGrams(e.target.value)}
          placeholder="Enter grams to sell..."
          className="w-full bg-black border border-zinc-700 rounded-xl px-4 py-4 text-white outline-none focus:border-red-500 mb-6"
        />

        {/* LIVE CALCULATOR */}
        <div className="bg-black rounded-2xl p-5 border border-zinc-700 mb-6 space-y-3">

          <div className="flex justify-between">
            <span className="text-gray-400">Gold Quantity</span>

            <span className="text-yellow-400 font-bold">
              {grams || "0"} g
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-400">Sell Price / Gram</span>

            <span className="text-red-400 font-bold">
              PKR {goldPrice.sellPrice.toLocaleString()}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-400">Average Buy Price</span>

            <span className="text-green-400 font-bold">
              PKR {portfolio.averageBuyPrice.toLocaleString()}
            </span>
          </div>

          <div className="border-t border-zinc-700 pt-3 flex justify-between text-lg">
            <span>Total Receive Amount</span>

            <span className="text-yellow-400 font-black">
              PKR {sellValue.toLocaleString()}
            </span>
          </div>

          <div className="flex justify-between text-lg">
            <span>Estimated Profit / Loss</span>

            <span
              className={`font-black ${
                estimatedProfit >= 0
                  ? "text-green-400"
                  : "text-red-400"
              }`}
            >
              PKR {estimatedProfit.toLocaleString()}
            </span>
          </div>

        </div>

        {/* SELL BUTTON */}
        <button
          onClick={sellGold}
          disabled={processing || !goldPrice.tradingEnabled}
          className="w-full bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-black text-xl py-4 rounded-2xl transition"
        >
          {processing ? "Processing Sell..." : "SELL GOLD NOW"}
        </button>

      </div>

      {/* SELL INFORMATION */}
      <div className="mt-10 grid md:grid-cols-2 gap-6">

        <div className="bg-zinc-900 border border-green-600 rounded-3xl p-6">
          <h3 className="text-xl font-black text-green-400 mb-4">
            Selling Rules
          </h3>

          <ul className="space-y-2 text-gray-300">
            <li>• Gold will be sold at the current Live Sell Price.</li>
            <li>• PKR Wallet will be credited instantly.</li>
            <li>• Average Buy Price updates automatically.</li>
            <li>• Profit/Loss is calculated for every completed sell trade.</li>
          </ul>
        </div>

        <div className="bg-zinc-900 border border-yellow-600 rounded-3xl p-6">
          <h3 className="text-xl font-black text-yellow-400 mb-4">
            Wallet Preview
          </h3>

          <div className="space-y-3">

            <div className="flex justify-between">
              <span>Current Wallet</span>

              <span className="text-green-400 font-bold">
                PKR {portfolio.walletBalance.toLocaleString()}
              </span>
            </div>

            <div className="flex justify-between">
              <span>After Selling</span>

              <span className="text-yellow-400 font-bold">
                PKR {(portfolio.walletBalance + sellValue).toLocaleString()}
              </span>
            </div>

            <div className="flex justify-between">
              <span>Remaining Gold</span>

              <span className="text-cyan-400 font-bold">
                {Math.max(portfolio.goldBalance - Number(grams || 0), 0).toFixed(3)} g
              </span>
            </div>

          </div>
        </div>

      </div>

      {/* FOOTER */}
      <div className="mt-12 border-t border-zinc-800 pt-6 text-center text-gray-500 text-sm">
        GoldTrade V17 Enterprise • Sell Gold Module • Powered by GoldTrade Backend API
      </div>

    </div>
  );
};

export default GoldSellPage;