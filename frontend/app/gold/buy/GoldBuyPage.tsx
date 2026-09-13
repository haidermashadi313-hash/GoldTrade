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

const GoldBuyPage: React.FC = () => {
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
      const savedUsername =
        localStorage.getItem("username") || "hashi90";

      setUsername(savedUsername);
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
  // LIVE BUY CALCULATIONS
  // ==========================================

  const buyValue = useMemo(() => {
    if (!grams) return 0;

    return Number(grams) * goldPrice.buyPrice;
  }, [grams, goldPrice.buyPrice]);

  const newAveragePrice = useMemo(() => {
    if (!grams || Number(grams) <= 0) {
      return portfolio.averageBuyPrice;
    }

    const currentGold = portfolio.goldBalance;
    const currentAvg = portfolio.averageBuyPrice;
    const newGold = Number(grams);

    if (currentGold === 0) return goldPrice.buyPrice;

    return (
      (currentGold * currentAvg +
        newGold * goldPrice.buyPrice) /
      (currentGold + newGold)
    );
  }, [grams, portfolio, goldPrice.buyPrice]);

  // ==========================================
  // BUY GOLD
  // ==========================================

  const buyGold = async () => {
    if (!grams || Number(grams) <= 0) {
      setMessage("Please enter valid gold grams.");
      setMessageType("error");
      return;
    }

    if (buyValue > portfolio.walletBalance) {
      setMessage("Insufficient PKR Wallet Balance.");
      setMessageType("error");
      return;
    }

    try {
      setProcessing(true);

      const res = await axios.post(`${API}/api/gold/buy`, {
        username,
        grams: Number(grams),
      });

      if (res.data.success) {
        setMessage("Gold purchased successfully.");
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
        err.response?.data?.message || "Gold Purchase Failed."
      );
      setMessageType("error");
    } finally {
      setProcessing(false);
    }
  };

  // ==========================================
  // LOADING SCREEN
  // ==========================================

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex justify-center items-center text-yellow-400 text-2xl font-bold">
        Loading Buy Gold Page...
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
          <h1 className="text-4xl font-black text-green-400">
            BUY GOLD
          </h1>

          <p className="text-gray-400 mt-2">
            Purchase Gold instantly using your PKR Wallet.
          </p>
        </div>

        <button
          onClick={fetchPortfolio}
          className="bg-green-600 hover:bg-green-500 text-white font-bold px-5 py-3 rounded-xl transition"
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

        <div className="bg-zinc-900 border border-green-500 rounded-3xl p-6">
          <p className="text-gray-400 text-sm">Buy Price</p>

          <h2 className="text-3xl font-black text-green-400 mt-2">
            PKR {goldPrice.buyPrice.toLocaleString()}
          </h2>
        </div>

        <div className="bg-zinc-900 border border-red-500 rounded-3xl p-6">
          <p className="text-gray-400 text-sm">Sell Price</p>

          <h2 className="text-3xl font-black text-red-400 mt-2">
            PKR {goldPrice.sellPrice.toLocaleString()}
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

        <div className="bg-zinc-900 border border-blue-500 rounded-3xl p-6">
          <p className="text-gray-400 text-sm">Average Buy Price</p>

          <h2 className="text-3xl font-black text-blue-400 mt-2">
            PKR {portfolio.averageBuyPrice.toLocaleString()}
          </h2>
        </div>

      </div>

      {/* BUY PANEL */}
      <div className="bg-zinc-900 border border-green-500 rounded-3xl p-8">

        <h2 className="text-3xl font-black text-green-400 mb-6">
          Gold Buying Panel
        </h2>

        <label className="block text-gray-300 mb-2">
          Gold Quantity (Grams)
        </label>

        <input
          type="number"
          value={grams}
          onChange={(e) => setGrams(e.target.value)}
          placeholder="Enter grams to buy..."
          className="w-full bg-black border border-zinc-700 rounded-xl px-4 py-4 text-white outline-none focus:border-green-500 mb-6"
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
            <span className="text-gray-400">Buy Price / Gram</span>

            <span className="text-green-400 font-bold">
              PKR {goldPrice.buyPrice.toLocaleString()}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-400">Current Average Buy Price</span>

            <span className="text-blue-400 font-bold">
              PKR {portfolio.averageBuyPrice.toLocaleString()}
            </span>
          </div>

          <div className="border-t border-zinc-700 pt-3 flex justify-between text-lg">
            <span>Total Purchase Cost</span>

            <span className="text-green-400 font-black">
              PKR {buyValue.toLocaleString()}
            </span>
          </div>

          <div className="flex justify-between text-lg">
            <span>New Average Buy Price</span>

            <span className="text-yellow-400 font-black">
              PKR {Math.round(newAveragePrice).toLocaleString()}
            </span>
          </div>

        </div>

        {/* BUY BUTTON */}
        <button
          onClick={buyGold}
          disabled={processing || !goldPrice.tradingEnabled}
          className="w-full bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white font-black text-xl py-4 rounded-2xl transition"
        >
          {processing ? "Processing Purchase..." : "BUY GOLD NOW"}
        </button>

      </div>

      {/* BUY INFORMATION */}
      <div className="mt-10 grid md:grid-cols-2 gap-6">

        <div className="bg-zinc-900 border border-green-600 rounded-3xl p-6">
          <h3 className="text-xl font-black text-green-400 mb-4">
            Buying Rules
          </h3>

          <ul className="space-y-2 text-gray-300">
            <li>• Gold is purchased at the Live Buy Price.</li>
            <li>• PKR Wallet is deducted instantly.</li>
            <li>• Gold Balance updates immediately.</li>
            <li>• Average Buy Price recalculates automatically.</li>
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
              <span>After Purchase</span>

              <span className="text-yellow-400 font-bold">
                PKR {Math.max(portfolio.walletBalance - buyValue, 0).toLocaleString()}
              </span>
            </div>

            <div className="flex justify-between">
              <span>Gold Balance After Buy</span>

              <span className="text-cyan-400 font-bold">
                {(portfolio.goldBalance + Number(grams || 0)).toFixed(3)} g
              </span>
            </div>

          </div>
        </div>

      </div>

      {/* FOOTER */}
      <div className="mt-12 border-t border-zinc-800 pt-6 text-center text-gray-500 text-sm">
        GoldTrade V17 Enterprise • Buy Gold Module • Powered by GoldTrade Backend API
      </div>

    </div>
  );
};

export default GoldBuyPage;